import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { Play, Pause, RotateCcw, CloudRain, Thermometer, Droplets, Cpu, TriangleAlert } from 'lucide-react';
import EChart from '../dashboard/components/EChart';
import {
  getSession,
  correrPronostico,
  type ModelMeta,
  type ClimaEscenario,
  type ForecastResult,
} from './forecast';
import styles from './SimulatorView.module.css';

const HORIZONTE = 16; // semanas a proyectar
const ANCHOR = { anio: 2025, semana: 35 }; // última semana observada (ancla Bucaramanga)
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

  // Reproducción semana a semana
  const [week, setWeek] = useState(0); // índice 0..HORIZONTE-1
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

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

  const totalActual = forecast ? forecast.totalSemana[week] ?? 0 : 0;
  const totalPico = forecast ? Math.max(...forecast.totalSemana) : 0;
  const semanaPico = forecast ? forecast.totalSemana.indexOf(totalPico) : 0;

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

  // --- Trayectoria metropolitana (línea con marcador en la semana actual) ---
  const trendOption = useMemo<EChartsOption | null>(() => {
    if (!forecast) return null;
    const xs = forecast.totalSemana.map((_, i) => etiquetaSemana(i + 1));
    return {
      grid: { top: 18, right: 16, bottom: 28, left: 40 },
      tooltip: { trigger: 'axis', ...baseTooltip,
        formatter: (p: unknown) => {
          const arr = p as { dataIndex: number; value: number }[];
          const i = arr[0].dataIndex;
          return `<b>${xs[i]}</b> (+${i + 1} sem)<br/>Casos AMB: <b>${arr[0].value.toFixed(0)}</b>`;
        } },
      xAxis: { type: 'category', data: xs, axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, interval: 2 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } } },
      yAxis: { type: 'value', axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
      series: [{
        type: 'line', smooth: true, symbol: 'none',
        data: forecast.totalSemana.map((v) => Math.round(v)),
        lineStyle: { color: '#00f0ff', width: 2.5 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(0,240,255,0.35)' }, { offset: 1, color: 'rgba(0,240,255,0.02)' }]) },
        markPoint: {
          symbol: 'circle', symbolSize: 12,
          data: [{ name: 'actual', coord: [week, Math.round(forecast.totalSemana[week] ?? 0)] }],
          itemStyle: { color: '#fff', borderColor: '#00f0ff', borderWidth: 3 },
          label: { show: false },
        },
      }],
    };
  }, [forecast, week]);

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

      <div className={styles.grid}>
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

        {/* Panel lateral: escenario climático + resumen */}
        <div className={styles.side}>
          {/* Escenario climático */}
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <h3>Escenario climático</h3>
              <button className={styles.resetClima} onClick={resetClima}>Restablecer</button>
            </div>
            <Slider icon={<CloudRain size={15} />} label="Precipitación" unit="mm/sem"
              value={clima.precip} range={meta.clima_ranges.precip} step={0.5} onChange={setC('precip')} />
            <Slider icon={<Thermometer size={15} />} label="Temperatura" unit="°C"
              value={clima.temp} range={meta.clima_ranges.temp} step={0.1} onChange={setC('temp')} />
            <Slider icon={<Droplets size={15} />} label="Humedad" unit="%"
              value={clima.humedad} range={meta.clima_ranges.humedad} step={1} onChange={setC('humedad')} />
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
            {trendOption && <EChart option={trendOption} height={150} />}
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
}> = ({ icon, label, unit, value, range, step, onChange }) => (
  <div className={styles.sliderRow}>
    <div className={styles.sliderTop}>
      <span className={styles.sliderLabel}>{icon} {label}</span>
      <span className={styles.sliderValue}>{value.toFixed(step < 1 ? 1 : 0)} <em>{unit}</em></span>
    </div>
    <input type="range" min={range.min} max={range.max} step={step} value={value}
      onChange={onChange} className={styles.climaSlider} />
  </div>
);

export default SimulatorView;
