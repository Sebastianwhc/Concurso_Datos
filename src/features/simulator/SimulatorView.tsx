import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { Play, Pause, RotateCcw, CloudRain, Thermometer, Droplets, Cpu, TriangleAlert,
  ShieldAlert, TrendingUp, TrendingDown, Minus, Radio } from 'lucide-react';
import EChart from '../dashboard/components/EChart';
import {
  getSession,
  correrPronostico,
  type ModelMeta,
  type ClimaEscenario,
  type ForecastResult,
} from './forecast';
import { fetchLiveClima, type LiveClima } from './liveWeather';
import Situacion2026 from './Situacion2026';
import Backtest2024 from './Backtest2024';
import styles from './SimulatorView.module.css';

const HORIZONTE = 16; // semanas a proyectar
const ANCHOR = { anio: 2026, semana: 22 }; // última semana observada (re-anclada a 2026 vía boletín INS; ver scripts/build_nowcast_seed.py)
// Costo directo medio ponderado por caso de dengue en COP (ver docs/06_IMPACTO_ECONOMICO.md:
// 68,4% ambulatorio + 31% hospitalizado + 0,57% grave, estudios Colombia, TRM 4.000).
const COSTO_CASO_COP = 1_388_831;
const PCT_EVITABLE = 0.20; // % de casos evitables con acción temprana (escenario moderado)
/** Formatea pesos colombianos en millones: 1_570_000_000 -> "$1.570 M". */
const fmtMillones = (cop: number) => `$${Math.round(cop / 1e6).toLocaleString('es-CO')} M`;
const DENGUE_COLORS = ['#16243d', '#1d4ed8', '#22d3ee', '#eab308', '#f97316', '#ef4444'];
// Contorno por municipio. Tonos fuera de la rampa de relleno (azul→rojo) para
// que el borde no se confunda con el color de riesgo de las comunas.
const CITY_BORDER: Record<string, string> = {
  Bucaramanga: '#ffffff',
  Floridablanca: '#b300ff',
};

const baseTooltip = {
  backgroundColor: 'rgba(16,22,35,0.95)',
  borderColor: 'rgba(255,255,255,0.1)',
  textStyle: { color: '#fff', fontSize: 12 },
};

interface ComunaFeat { id: string; municipio: string; comuna: string; }

/** Niveles de alerta por incidencia semanal (casos por 10.000 hab), calibrados
 *  sobre la distribución del pronóstico (p90≈3.1, p80≈2.0, p50≈0.66). */
interface NivelAlerta { id: 'alto' | 'medio' | 'vigilancia' | 'bajo'; min: number; label: string; color: string; accion: string; }
const NIVELES: NivelAlerta[] = [
  { id: 'alto', min: 3.0, label: 'Riesgo alto', color: '#ef4444',
    accion: 'Intervención inmediata: fumigación focalizada (control adulticida), eliminación de criaderos casa a casa y búsqueda activa de febriles.' },
  { id: 'medio', min: 1.5, label: 'Riesgo medio', color: '#f97316',
    accion: 'Intensificar el control vectorial y campañas de eliminación de criaderos; alertar a las IPS de la zona.' },
  { id: 'vigilancia', min: 0.7, label: 'Vigilancia', color: '#eab308',
    accion: 'Monitoreo reforzado y prevención comunitaria (lavado de tanques, recipientes y llantas).' },
  { id: 'bajo', min: 0, label: 'Bajo', color: '#22c55e',
    accion: 'Vigilancia epidemiológica rutinaria.' },
];
const nivelDe = (inc: number): NivelAlerta => NIVELES.find((n) => inc >= n.min) ?? NIVELES[NIVELES.length - 1];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const REFRESCO_VIVO_MS = 10 * 60 * 1000; // 10 minutos

/** Etiqueta de semana epidemiológica a partir del ancla + k. */
function etiquetaSemana(k: number): string {
  const total = ANCHOR.semana + k;
  const anio = ANCHOR.anio + Math.floor((total - 1) / 52);
  const sem = ((total - 1) % 52) + 1;
  return `Sem. ${sem} · ${anio}`;
}

const SimulatorView: React.FC = () => {
  const [meta, setMeta] = useState<ModelMeta | null>(null);
  const [comunaFeats, setComunaFeats] = useState<ComunaFeat[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);

  // Escenario climático (sliders) — se inicializa con la mediana del modelo.
  const [clima, setClima] = useState<ClimaEscenario | null>(null);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);

  // Modo "en vivo": consume clima real de Bucaramanga (Open-Meteo) cada 10 min.
  const [liveMode, setLiveMode] = useState(false);
  const [live, setLive] = useState<LiveClima | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  // Reproducción semana a semana
  const [week, setWeek] = useState(0); // índice 0..HORIZONTE-1
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  // Consulta puntual: comuna + semana elegidas por el usuario (independiente de la reproducción)
  const [selComuna, setSelComuna] = useState<string>('');
  const [detailWeek, setDetailWeek] = useState<number>(0);

  // --- Carga inicial: meta + sesión ONNX + geojson de comunas ---
  useEffect(() => {
    let active = true;
    const base = import.meta.env.BASE_URL;
    Promise.all([
      fetch(`${base}data/model_meta.json`).then((r) => r.json()),
      fetch(`${base}amb_comunas.geojson`).then((r) => r.json()),
      fetch(`${base}amb_municipios.geojson`).then((r) => r.json()),
      getSession(base),
    ])
      .then((res) => {
        if (!active) return;
        const m = res[0] as ModelMeta;
        const geo = res[1] as { type: string; features: { properties: ComunaFeat; geometry: unknown }[] };
        const muni = res[2] as { features: { properties: { municipio: string }; geometry: unknown }[] };
        // Mapa combinado en UNA sola registración para que relleno (comunas) y
        // contorno (municipios) compartan UNA transformación de roam → sin delay.
        // Orden de dibujo (id sintético 'MUNI_*' para el contorno):
        //   1) Bucaramanga al FONDO  -> solo asoma su borde exterior.
        //   2) comunas en MEDIO      -> reciben el hover.
        //   3) Floridablanca ENCIMA  -> se ve también su frontera interna con Bga.
        //      (su dato es `silent`, así no bloquea el hover de sus comunas).
        const muniFeatures = muni.features.map((f) => ({
          ...f, properties: { ...f.properties, id: `MUNI_${f.properties.municipio}` },
        }));
        const bga = muniFeatures.filter((f) => f.properties.municipio === 'Bucaramanga');
        const fl = muniFeatures.filter((f) => f.properties.municipio === 'Floridablanca');
        const combined = { type: 'FeatureCollection', features: [...bga, ...geo.features, ...fl] };
        echarts.registerMap('amb_sim', combined as never);
        setComunaFeats(geo.features.map((f) => f.properties));
        setMeta(m);
        setClima({
          precip: m.clima_ranges.precip.med,
          temp: m.clima_ranges.temp.med,
          humedad: m.clima_ranges.humedad.med,
        });
      })
      .catch((e) => active && setError(String(e)));
    return () => { active = false; };
  }, []);

  // --- Recalcular pronóstico cuando cambia el escenario climático (con debounce) ---
  useEffect(() => {
    if (!meta || !clima) return;
    let active = true;
    const base = import.meta.env.BASE_URL;
    const t = window.setTimeout(() => {
      setComputing(true);
      getSession(base)
        .then((session) => correrPronostico(session, meta, clima, HORIZONTE))
        .then((res) => { if (active) { setForecast(res); setComputing(false); } })
        .catch((e) => active && (setError(String(e)), setComputing(false)));
    }, 180);
    return () => { active = false; window.clearTimeout(t); };
  }, [meta, clima]);

  // --- Modo en vivo: trae clima real y lo fija como escenario (cada 10 min) ---
  useEffect(() => {
    if (!liveMode || !meta) return;
    let active = true;
    const r = meta.clima_ranges;
    const apply = async () => {
      try {
        const lc = await fetchLiveClima();
        if (!active) return;
        setLive(lc);
        setLiveError(null);
        // Acotamos al rango del modelo para no extrapolar fuera de lo entrenado.
        setClima({
          precip: clamp(lc.precip, r.precip.min, r.precip.max),
          temp: clamp(lc.temp, r.temp.min, r.temp.max),
          humedad: clamp(lc.humedad, r.humedad.min, r.humedad.max),
        });
      } catch (e) {
        if (active) setLiveError(String(e));
      }
    };
    apply();
    const id = window.setInterval(apply, REFRESCO_VIVO_MS);
    return () => { active = false; window.clearInterval(id); };
  }, [liveMode, meta]);

  // --- Bucle de reproducción ---
  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setWeek((w) => {
        if (w >= HORIZONTE - 1) { setPlaying(false); return w; }
        return w + 1;
      });
    }, 850);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [playing]);

  // Escala de color estable (máximo sobre todo el horizonte y comunas).
  const maxCasos = useMemo(() => {
    if (!forecast) return 1;
    let mx = 0;
    for (const id in forecast.porComuna)
      for (const v of forecast.porComuna[id]) if (v > mx) mx = v;
    return Math.max(mx, 1);
  }, [forecast]);

  const comunaById = useMemo(
    () => Object.fromEntries((meta?.comunas ?? []).map((c) => [c.id, c])),
    [meta]
  );

  // Ranking de comunas en riesgo para la semana actual.
  const ranking = useMemo(() => {
    if (!forecast) return [];
    return Object.entries(forecast.porComuna)
      .map(([id, serie]) => ({ id, casos: serie[week] ?? 0, c: comunaById[id] }))
      .filter((r) => r.c)
      .sort((a, b) => b.casos - a.casos);
  }, [forecast, week, comunaById]);

  // Capa de alerta temprana: clasifica cada comuna por incidencia y sugiere acción.
  const alerta = useMemo(() => {
    if (!forecast || !meta) return null;
    const items = meta.comunas.map((c) => {
      const serie = forecast.porComuna[c.id] ?? [];
      const casos = serie[week] ?? 0;
      const inc = (casos / c.pob) * 10000; // por 10.000 hab/semana
      const prev = week > 0 ? serie[week - 1] ?? casos : meta.seed[c.id]?.[3] ?? casos;
      const tend = casos > prev * 1.05 ? 'subiendo' : casos < prev * 0.95 ? 'bajando' : 'estable';
      return { id: c.id, nombre: c.nombre, municipio: c.municipio, casos, inc, nivel: nivelDe(inc), tend };
    });
    const conteo = { alto: 0, medio: 0, vigilancia: 0, bajo: 0 } as Record<NivelAlerta['id'], number>;
    for (const i of items) conteo[i.nivel.id]++;
    const prioridad = items
      .filter((i) => i.nivel.id === 'alto' || i.nivel.id === 'medio')
      .sort((a, b) => b.inc - a.inc);
    return { items, conteo, prioridad };
  }, [forecast, meta, week]);

  // Consulta puntual: comuna + semana elegidas -> métricas y recomendación de esa comuna.
  const consulta = useMemo(() => {
    if (!forecast || !meta) return null;
    // Default estable: la comuna con mayor total proyectado en todo el horizonte.
    let defId = meta.comunas[0]?.id ?? '';
    let mxTot = -1;
    for (const c of meta.comunas) {
      const tot = (forecast.porComuna[c.id] ?? []).reduce((a, b) => a + b, 0);
      if (tot > mxTot) { mxTot = tot; defId = c.id; }
    }
    const id = selComuna || defId;
    const c = comunaById[id];
    if (!c) return null;
    const serie = forecast.porComuna[id] ?? [];
    const w = Math.min(detailWeek, serie.length - 1);
    const casos = serie[w] ?? 0;
    const inc = (casos / c.pob) * 10000; // por 10.000 hab/semana
    const prev = w > 0 ? (serie[w - 1] ?? casos) : (meta.seed[id]?.[3] ?? casos);
    const tend = casos > prev * 1.05 ? 'subiendo' : casos < prev * 0.95 ? 'bajando' : 'estable';
    const nivel = nivelDe(inc);
    const pico = serie.length ? Math.max(...serie) : 0;
    const semanaPico = serie.indexOf(pico);
    const total = serie.reduce((a, b) => a + b, 0);
    return { id, c, w, serie, casos, inc, tend, nivel, pico, semanaPico, total };
  }, [forecast, meta, selComuna, detailWeek, comunaById]);

  // Mini-trayectoria de la comuna consultada (16 semanas) con marcador en la semana elegida.
  const consultaChart = useMemo<EChartsOption | null>(() => {
    if (!consulta) return null;
    const xs = consulta.serie.map((_, i) => etiquetaSemana(i + 1));
    return {
      grid: { top: 14, right: 10, bottom: 22, left: 30 },
      tooltip: { trigger: 'axis', ...baseTooltip,
        formatter: (p: unknown) => {
          const a = p as { dataIndex: number; value: number }[];
          return `<b>${xs[a[0].dataIndex]}</b><br/>Casos: <b>${Math.round(a[0].value)}</b>`;
        } },
      xAxis: { type: 'category', data: xs,
        axisLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, interval: 3 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.35)' } } },
      yAxis: { type: 'value', axisLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
      series: [{
        type: 'line', smooth: true, symbol: 'none', data: consulta.serie.map((v) => Math.round(v)),
        lineStyle: { color: consulta.nivel.color, width: 2.5 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255,255,255,0.12)' }, { offset: 1, color: 'rgba(255,255,255,0.01)' }]) },
        markPoint: { symbol: 'circle', symbolSize: 11,
          data: [{ name: 'sel', coord: [consulta.w, Math.round(consulta.casos)] }],
          itemStyle: { color: '#fff', borderColor: consulta.nivel.color, borderWidth: 3 }, label: { show: false } },
      }],
    };
  }, [consulta]);

  const totalActual = forecast ? forecast.totalSemana[week] ?? 0 : 0;
  const totalPico = forecast ? Math.max(...forecast.totalSemana) : 0;
  const semanaPico = forecast ? forecast.totalSemana.indexOf(totalPico) : 0;

  // Traducción a pesos: casos proyectados en el horizonte × costo medio por caso.
  const casosHorizonte = forecast ? forecast.totalSemana.reduce((a, b) => a + b, 0) : 0;
  const costoHorizonte = casosHorizonte * COSTO_CASO_COP;
  const ahorroHorizonte = costoHorizonte * PCT_EVITABLE;

  // --- Opción del mapa coroplético (riesgo por comuna en la semana actual) ---
  const mapOption = useMemo<EChartsOption | null>(() => {
    if (!forecast || !meta) return null;
    const data = [
      // Comunas (con valor de riesgo → coloreadas por visualMap, con tooltip).
      ...meta.comunas.map((c) => ({
        name: c.id,
        value: forecast.porComuna[c.id]?.[week] ?? 0,
        nombre: c.nombre,
        municipio: c.municipio,
      })),
      // Contorno de municipios (sin valor → visualMap los ignora; `silent` → no
      // capturan el hover, que pasa a las comunas de debajo).
      {
        name: 'MUNI_Bucaramanga', value: undefined as unknown as number, silent: true,
        itemStyle: { areaColor: 'transparent', borderColor: CITY_BORDER.Bucaramanga, borderWidth: 4 },
      },
      {
        name: 'MUNI_Floridablanca', value: undefined as unknown as number, silent: true,
        itemStyle: { areaColor: 'transparent', borderColor: CITY_BORDER.Floridablanca, borderWidth: 4 },
      },
    ];
    return {
      tooltip: {
        trigger: 'item', ...baseTooltip,
        formatter: (p: unknown) => {
          const d = p as { data?: { nombre?: string; municipio?: string; value?: number } };
          if (!d.data || d.data.nombre === undefined) return ''; // contorno de municipio
          return `<b>${d.data.nombre}</b><br/><span style="color:rgba(255,255,255,0.55)">${d.data.municipio}</span><br/>Casos proyectados: <b>${(d.data.value ?? 0).toFixed(1)}</b>`;
        },
      },
      visualMap: {
        type: 'continuous', min: 0, max: maxCasos, left: 6, bottom: 8,
        calculable: true, itemHeight: 120, text: ['Mayor riesgo', 'Menor'],
        textStyle: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
        inRange: { color: DENGUE_COLORS },
      },
      series: [{
        // Una sola serie sobre el mapa combinado: una transformación de roam → sin delay.
        type: 'map', map: 'amb_sim', nameProperty: 'id',
        roam: true, aspectScale: 1, scaleLimit: { min: 0.8, max: 12 },
        layoutCenter: ['50%', '50%'], layoutSize: '104%',
        data,
        itemStyle: { borderColor: 'rgba(255,255,255,0.12)', borderWidth: 0.5, areaColor: '#0f1626' },
        select: { disabled: true },
        emphasis: {
          label: { show: true, color: '#fff', fontSize: 11, fontWeight: 'bold' as const,
            formatter: (p: unknown) => (p as { data?: { nombre?: string } }).data?.nombre ?? '' },
          itemStyle: { borderColor: '#fff', borderWidth: 1.4 },
        },
      }],
    };
  }, [forecast, meta, week, maxCasos]);

  // --- Trayectoria metropolitana: tramo OBSERVADO (semilla) -> PRONÓSTICO, con frontera ---
  const trendOption = useMemo<EChartsOption | null>(() => {
    if (!forecast || !meta) return null;
    const OFFSET = 4; // semanas observadas (semilla) que se anteponen
    const seedWeeks = [ANCHOR.semana - 3, ANCHOR.semana - 2, ANCHOR.semana - 1, ANCHOR.semana];
    const seedLabels = seedWeeks.map((s) => `Sem. ${s} · ${ANCHOR.anio}`);
    const seedTotals = [0, 1, 2, 3].map((j) =>
      Math.round(Object.values(meta.seed).reduce((a, arr) => a + (arr[j] ?? 0), 0)));
    const fc = forecast.totalSemana.map((v) => Math.round(v));
    const xs = fc.map((_, i) => etiquetaSemana(i + 1));
    const xAll = [...seedLabels, ...xs];
    const obs: (number | null)[] = [...seedTotals, ...fc.map(() => null)];
    const pred: (number | null)[] = [null, null, null, seedTotals[3], ...fc];
    return {
      grid: { top: 26, right: 16, bottom: 28, left: 40 },
      legend: { top: 0, right: 0, data: ['Observado', 'Pronóstico'],
        textStyle: { color: 'rgba(255,255,255,0.8)', fontSize: 10 }, itemWidth: 14, itemHeight: 8 },
      tooltip: { trigger: 'axis', ...baseTooltip,
        formatter: (p: unknown) => {
          const arr = p as { dataIndex: number; value: number | null }[];
          const i = arr[0].dataIndex;
          const val = arr.find((a) => a.value != null)?.value ?? 0;
          const tag = i < OFFSET ? 'observado' : `+${i - OFFSET + 1} sem`;
          return `<b>${xAll[i]}</b> (${tag})<br/>Casos AMB: <b>${Math.round(val)}</b>`;
        } },
      xAxis: { type: 'category', data: xAll, axisLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 9, interval: 2 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.45)' } } },
      yAxis: { type: 'value', axisLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
      series: [
        { name: 'Observado', type: 'line', smooth: true, symbol: 'none', data: obs,
          lineStyle: { color: 'rgba(255,255,255,0.85)', width: 2 },
          areaStyle: { color: 'rgba(255,255,255,0.06)' } },
        { name: 'Pronóstico', type: 'line', smooth: true, symbol: 'none', connectNulls: false, data: pred,
          lineStyle: { color: '#00f0ff', width: 2.5 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0,240,255,0.35)' }, { offset: 1, color: 'rgba(0,240,255,0.02)' }]) },
          markLine: { silent: true, symbol: 'none', data: [{ xAxis: OFFSET - 1 }],
            lineStyle: { color: 'rgba(255,255,255,0.4)', type: 'dotted', width: 1.5 },
            label: { formatter: 'pronóstico →', color: 'rgba(255,255,255,0.65)', fontSize: 10, position: 'insideEndTop' } },
          markPoint: {
            symbol: 'circle', symbolSize: 12,
            data: [{ name: 'actual', coord: [week + OFFSET, Math.round(forecast.totalSemana[week] ?? 0)] }],
            itemStyle: { color: '#fff', borderColor: '#00f0ff', borderWidth: 3 },
            label: { show: false },
          },
        },
      ],
    };
  }, [forecast, week, meta]);

  if (error)
    return <div className={styles.state}>No se pudo cargar el motor predictivo: {error}</div>;
  if (!meta || !clima || !comunaFeats)
    return <div className={styles.state}><Cpu className={styles.spin} /> Cargando motor predictivo (ONNX)…</div>;

  const setC = (k: keyof ClimaEscenario) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setClima((c) => (c ? { ...c, [k]: Number(e.target.value) } : c));
  const resetClima = () => setClima({
    precip: meta.clima_ranges.precip.med,
    temp: meta.clima_ranges.temp.med,
    humedad: meta.clima_ranges.humedad.med,
  });

  const ConsultaTrend = consulta
    ? (consulta.tend === 'subiendo' ? TrendingUp : consulta.tend === 'bajando' ? TrendingDown : Minus)
    : Minus;

  return (
    <div className={styles.sim}>
      {/* Encabezado + métricas del modelo */}
      <div className={styles.header}>
        <div>
          <h2>Simulador predictivo de propagación</h2>
          <p>Pronóstico autoregresivo del dengue por comuna del Área Metropolitana, semana a semana.
             Ajusta el escenario climático y observa cómo evoluciona el riesgo.</p>
        </div>
        <div className={styles.metricBadges}>
          <div className={styles.metricBadge}>
            <span className={styles.metricVal}>R² {meta.metrics.modelo.R2.toFixed(2)}</span>
            <span className={styles.metricLbl}>validación en brote 2024–25</span>
          </div>
          <div className={styles.metricBadge}>
            <span className={styles.metricVal}>MAE {meta.metrics.modelo.MAE.toFixed(1)}</span>
            <span className={styles.metricLbl}>error medio (casos/sem)</span>
          </div>
        </div>
      </div>

      {/* Ancla real verificable: situación 2026 del boletín del INS (Santander) */}
      <Situacion2026 />

      <div className={styles.grid}>
        {/* Columna izquierda: mapa + control de simulación */}
        <div className={styles.mapCol}>
        {/* Mapa de riesgo */}
        <div className={styles.mapCard}>
          <div className={styles.mapHead}>
            <span className={styles.mapTitle}>Riesgo proyectado por comuna</span>
            <span className={styles.weekTag}>{etiquetaSemana(week + 1)} · proyección +{week + 1} sem</span>
          </div>
          <div className={styles.cityLegend}>
            <span><i style={{ borderColor: CITY_BORDER.Bucaramanga }} /> Bucaramanga</span>
            <span><i style={{ borderColor: CITY_BORDER.Floridablanca }} /> Floridablanca</span>
          </div>
          {mapOption && <RiskMap option={mapOption} height={460} />}

          {/* Controles de reproducción */}
          <div className={styles.playbar}>
            <button className={styles.playBtn} onClick={() => {
              if (week >= HORIZONTE - 1) setWeek(0);
              setPlaying((p) => !p);
            }}>
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button className={styles.iconBtn} onClick={() => { setPlaying(false); setWeek(0); }} title="Reiniciar">
              <RotateCcw size={16} />
            </button>
            <input
              type="range" min={0} max={HORIZONTE - 1} value={week}
              onChange={(e) => { setPlaying(false); setWeek(Number(e.target.value)); }}
              className={styles.weekSlider}
            />
            <span className={styles.weekCount}>+{week + 1}/{HORIZONTE}</span>
          </div>
          <div className={styles.mapNote}>
            Las predicciones se realimentan (autoregresivo): los casos de cada semana alimentan la
            siguiente. Girón no se modela aquí (sin comunas en datos abiertos).
          </div>
        </div>

        {/* Control de simulación destacado (botón verde para correr) — llena el espacio bajo el mapa */}
        <div className={styles.panel}>
          <div className={styles.panelHead}><h3>Control de simulación</h3></div>
          <button
            className={styles.runBtn}
            data-playing={playing}
            onClick={() => { if (week >= HORIZONTE - 1) setWeek(0); setPlaying((p) => !p); }}
          >
            {playing ? <><Pause size={18} /> Pausar</> : <><Play size={18} /> Correr simulación</>}
          </button>
          <div className={styles.runMeta}>
            <span>Semana proyectada</span>
            <b>+{week + 1} / {HORIZONTE}</b>
          </div>
          <div className={styles.runHint}>
            Reproduce el pronóstico semana a semana en el mapa. Ajusta los sliders de clima para comparar escenarios.
          </div>
        </div>
        </div>

        {/* Panel lateral: escenario climático + resumen */}
        <div className={styles.side}>
          {/* Escenario climático */}
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <h3>Escenario climático</h3>
              <button
                className={`${styles.liveToggle} ${liveMode ? styles.liveOn : ''}`}
                onClick={() => setLiveMode((v) => !v)}
                title="Consume clima real de Bucaramanga (Open-Meteo) cada 10 min"
              >
                <Radio size={13} /> {liveMode ? 'En vivo' : 'Tiempo real'}
              </button>
            </div>

            {liveMode && (
              <div className={styles.liveBar}>
                {liveError ? (
                  <span className={styles.liveErr}>⚠ Sin conexión al servicio de clima · usando último escenario</span>
                ) : live ? (
                  <span>
                    <span className={styles.liveDot} /> En vivo · Bucaramanga · ahora <b>{live.currentTemp?.toFixed(0)}°C</b>
                    {' · act. '}{new Date(live.updated).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  <span>Conectando al clima en vivo…</span>
                )}
              </div>
            )}

            <Slider icon={<CloudRain size={15} />} label="Precipitación" unit="mm/sem" disabled={liveMode}
              value={clima.precip} range={meta.clima_ranges.precip} step={0.5} onChange={setC('precip')} />
            <Slider icon={<Thermometer size={15} />} label="Temperatura" unit="°C" disabled={liveMode}
              value={clima.temp} range={meta.clima_ranges.temp} step={0.1} onChange={setC('temp')} />
            <Slider icon={<Droplets size={15} />} label="Humedad" unit="%" disabled={liveMode}
              value={clima.humedad} range={meta.clima_ranges.humedad} step={1} onChange={setC('humedad')} />

            {liveMode ? (
              <div className={styles.moneyNote}>
                Escenario fijado con clima real (Open-Meteo): suma de lluvia y media de temp/humedad de los
                últimos 7 días. Desactiva «En vivo» para ajustar a mano.
              </div>
            ) : (
              <button className={styles.resetClima} onClick={resetClima}>Restablecer a la mediana</button>
            )}
            {computing && <div className={styles.computing}>Recalculando pronóstico…</div>}
          </div>

          {/* Resumen */}
          <div className={styles.panel}>
            <div className={styles.summaryGrid}>
              <div className={styles.bigStat}>
                <span className={styles.bigVal}>{totalActual.toFixed(0)}</span>
                <span className={styles.bigLbl}>casos AMB · {etiquetaSemana(week + 1)}</span>
              </div>
              <div className={styles.bigStat}>
                <span className={styles.bigVal}>{totalPico.toFixed(0)}</span>
                <span className={styles.bigLbl}>pico proyectado (+{semanaPico + 1} sem)</span>
              </div>
            </div>
            {trendOption && <EChart option={trendOption} height={172} />}
            <div className={styles.mapNote} style={{ marginTop: 2 }}>
              Tramo <b>observado</b> = Bucaramanga real + Floridablanca estimada (boletín INS, hasta {`2026-S${ANCHOR.semana}`});
              de la divisoria en adelante es <b>pronóstico</b> del modelo.
            </div>

            {/* Traducción económica del escenario (el "tamaño del premio") */}
            <div className={styles.moneyStrip}>
              <div className={styles.moneyItem}>
                <span className={styles.moneyVal}>{fmtMillones(costoHorizonte)}</span>
                <span className={styles.moneyLbl}>costo proyectado · {HORIZONTE} sem (AMB)</span>
              </div>
              <div className={styles.moneyItem}>
                <span className={`${styles.moneyVal} ${styles.moneySave}`}>{fmtMillones(ahorroHorizonte)}</span>
                <span className={styles.moneyLbl}>ahorro potencial con acción temprana (−20%)</span>
              </div>
            </div>
            <div className={styles.moneyNote}>
              ≈ ${(COSTO_CASO_COP / 1e6).toFixed(2).replace('.', ',')} millones COP por caso (costo directo de atención; ver documentación económica).
            </div>
          </div>

          {/* Top comunas en riesgo */}
          <div className={styles.panel}>
            <div className={styles.panelHead}><h3>Comunas en mayor riesgo</h3></div>
            <ul className={styles.ranking}>
              {ranking.slice(0, 6).map((r, i) => (
                <li key={r.id} className={styles.rankItem}>
                  <span className={styles.rankPos}>{i + 1}</span>
                  <span className={styles.rankName}>
                    {r.c.nombre}
                    <em className={styles.rankCity}>{r.c.municipio}</em>
                  </span>
                  <div className={styles.rankBar}>
                    <div className={styles.rankBarFill}
                      style={{ width: `${Math.min(100, (r.casos / maxCasos) * 100)}%` }} />
                  </div>
                  <span className={styles.rankVal}>{r.casos.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Sistema de alerta temprana y recomendaciones accionables */}
      {alerta && (
        <div className={styles.alertaSection}>
          <div className={styles.alertaHead}>
            <div className={styles.alertaTitle}>
              <ShieldAlert size={18} />
              <h3>Sistema de alerta temprana · recomendaciones</h3>
            </div>
            <span className={styles.weekTag}>{etiquetaSemana(week + 1)} · +{week + 1} sem</span>
          </div>

          {/* Consulta puntual: elige comuna + semana -> recomendación específica */}
          {consulta && (
            <div className={styles.consulta}>
              <div className={styles.consultaControls}>
                <label className={styles.consultaField}>
                  <span>Comuna</span>
                  <select
                    className={styles.consultaSelect}
                    value={consulta.id}
                    onChange={(e) => setSelComuna(e.target.value)}
                  >
                    {['Bucaramanga', 'Floridablanca'].map((mun) => (
                      <optgroup key={mun} label={mun}>
                        {meta.comunas.filter((c) => c.municipio === mun).map((c) => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <label className={styles.consultaField}>
                  <span>Semana proyectada</span>
                  <select
                    className={styles.consultaSelect}
                    value={consulta.w}
                    onChange={(e) => setDetailWeek(Number(e.target.value))}
                  >
                    {Array.from({ length: HORIZONTE }, (_, k) => (
                      <option key={k} value={k}>{etiquetaSemana(k + 1)} · +{k + 1} sem</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={styles.consultaResult} style={{ borderLeftColor: consulta.nivel.color }}>
                <div className={styles.consultaTop}>
                  <span className={styles.consultaNombre}>
                    {consulta.c.nombre} <em>{consulta.c.municipio}</em>
                  </span>
                  <span className={styles.consultaNivel} style={{ color: consulta.nivel.color }}>
                    {consulta.nivel.label}
                  </span>
                </div>
                <div className={styles.consultaMetrics}>
                  <div><b>{consulta.casos.toFixed(1)}</b><span>casos proyectados</span></div>
                  <div><b>{consulta.inc.toFixed(1)}</b><span>por 10k hab</span></div>
                  <div className={styles.consultaTendBox}><ConsultaTrend size={14} /><span>{consulta.tend}</span></div>
                  <div><b>{Math.round(consulta.total)}</b><span>total {HORIZONTE} sem</span></div>
                </div>
                {consultaChart && <EChart option={consultaChart} height={120} />}
                <div className={styles.consultaAccion}>
                  <span className={styles.consultaAccionLbl}>Recomendación para esta comuna</span>
                  {consulta.nivel.accion}
                </div>
              </div>
            </div>
          )}

          {/* Mensaje titular (cambia con la semana y el escenario) */}
          <div
            className={styles.alertaBanner}
            style={{ borderColor: alerta.conteo.alto ? '#ef4444' : alerta.conteo.medio ? '#f97316' : '#22c55e' }}
          >
            {alerta.conteo.alto > 0 ? (
              <>🔴 <b>{alerta.conteo.alto} comuna{alerta.conteo.alto > 1 ? 's' : ''} en riesgo alto</b> esta semana.
                Prioriza el control vectorial en <b>{alerta.prioridad.slice(0, 3).map((p) => p.nombre).join(', ')}</b>.</>
            ) : alerta.conteo.medio > 0 ? (
              <>🟠 <b>{alerta.conteo.medio} comuna{alerta.conteo.medio > 1 ? 's' : ''} en riesgo medio</b>.
                Refuerza prevención en <b>{alerta.prioridad.slice(0, 3).map((p) => p.nombre).join(', ')}</b>.</>
            ) : (
              <>🟢 Sin comunas en riesgo alto esta semana. Mantener vigilancia epidemiológica rutinaria.</>
            )}
          </div>

          {/* Conteo por nivel */}
          <div className={styles.nivelChips}>
            {NIVELES.map((n) => (
              <span key={n.id} className={styles.nivelChip}>
                <i style={{ background: n.color }} /> {n.label}: <b>{alerta.conteo[n.id]}</b>
              </span>
            ))}
          </div>

          {/* Tarjetas de acción priorizadas */}
          {alerta.prioridad.length > 0 ? (
            <div className={styles.accionGrid}>
              {alerta.prioridad.slice(0, 6).map((p) => {
                const Trend = p.tend === 'subiendo' ? TrendingUp : p.tend === 'bajando' ? TrendingDown : Minus;
                return (
                  <div key={p.id} className={styles.accionCard} style={{ borderLeftColor: p.nivel.color }}>
                    <div className={styles.accionTop}>
                      <span className={styles.accionNombre}>{p.nombre} <em>{p.municipio}</em></span>
                      <span className={styles.accionNivel} style={{ color: p.nivel.color }}>{p.nivel.label}</span>
                    </div>
                    <div className={styles.accionMetrics}>
                      <span>{p.casos.toFixed(1)} casos/sem</span>
                      <span>{p.inc.toFixed(1)} /10k hab</span>
                      <span className={styles.accionTend}><Trend size={13} /> {p.tend}</span>
                    </div>
                    <div className={styles.accionTexto}>{p.nivel.accion}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.accionVacio}>
              Ninguna comuna supera el umbral de riesgo medio en esta semana proyectada.
            </div>
          )}

          <div className={styles.mapNote}>
            Nivel por <b>incidencia semanal</b> (casos por 10.000 hab): alto ≥ 3 · medio ≥ 1,5 · vigilancia ≥ 0,7.
            Las acciones son sugerencias de control vectorial estándar; la decisión final es de la autoridad sanitaria.
          </div>
        </div>
      )}

      {/* Validación: backtest del brote 2024 (pronóstico vs. realidad) */}
      <Backtest2024 />

      {/* Nota honesta sobre el rol del clima */}
      <div className={styles.disclaimer}>
        <TriangleAlert size={16} />
        <span>
          <b>El clima es un modulador, no el motor.</b> El modelo aprende que la inercia epidémica
          (casos recientes) predice el dengue mucho mejor que el clima por sí solo — así funcionan los
          sistemas reales de alerta temprana. Por eso los sliders ajustan el escenario, pero la trayectoria
          la marca sobre todo la dinámica de transmisión. Profundidad de datos asimétrica:
          Bucaramanga 2015–2025; Floridablanca 2023–2025.
        </span>
      </div>
    </div>
  );
};

/**
 * Mapa de riesgo (mapa combinado: relleno de comunas + contorno de municipios,
 * una sola serie). `notMerge=false`: al avanzar de semana se actualizan los datos
 * por merge, así NO se pierde el zoom/desplazamiento del usuario.
 */
const RiskMap: React.FC<{ option: EChartsOption; height: number }> = ({ option, height }) => (
  <ReactECharts
    option={option}
    style={{ height, width: '100%' }}
    opts={{ renderer: 'canvas' }}
    notMerge={false}
    lazyUpdate
  />
);

/** Slider de clima con etiqueta de valor. */
const Slider: React.FC<{
  icon: React.ReactNode; label: string; unit: string;
  value: number; range: { min: number; max: number; med: number };
  step: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}> = ({ icon, label, unit, value, range, step, onChange, disabled }) => (
  <div className={`${styles.sliderRow} ${disabled ? styles.sliderDisabled : ''}`}>
    <div className={styles.sliderTop}>
      <span className={styles.sliderLabel}>{icon} {label}</span>
      <span className={styles.sliderValue}>{value.toFixed(step < 1 ? 1 : 0)} <em>{unit}</em></span>
    </div>
    <input type="range" min={range.min} max={range.max} step={step} value={value}
      onChange={onChange} className={styles.climaSlider} disabled={disabled} />
  </div>
);

export default SimulatorView;
