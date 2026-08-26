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
import { useT } from '../../i18n/useT';
import styles from './SimulatorView.module.css';

const HORIZONTE = 16;
const ANCHOR = { anio: 2026, semana: 22 };
const COSTO_CASO_COP = 1_388_831;
const PCT_EVITABLE = 0.20;

const fmtMillones = (cop: number, lang: 'es' | 'en') =>
  `$${Math.round(cop / 1e6).toLocaleString(lang === 'es' ? 'es-CO' : 'en-US')} M`;

const DENGUE_COLORS = ['#16243d', '#1d4ed8', '#22d3ee', '#eab308', '#f97316', '#ef4444'];
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

interface NivelAlerta { id: 'alto' | 'medio' | 'vigilancia' | 'bajo'; min: number; label: string; color: string; accion: string; }

const getNiveles = (lang: 'es' | 'en'): NivelAlerta[] => [
  {
    id: 'alto', min: 3.0,
    label: lang === 'es' ? 'Riesgo alto' : 'High risk',
    color: '#ef4444',
    accion: lang === 'es'
      ? 'Intervención inmediata: fumigación focalizada (control adulticida), eliminación de criaderos casa a casa y búsqueda activa de febriles.'
      : 'Immediate intervention: targeted spraying (adulticide control), door-to-door breeding site removal, and active febrile search.',
  },
  {
    id: 'medio', min: 1.5,
    label: lang === 'es' ? 'Riesgo medio' : 'Medium risk',
    color: '#f97316',
    accion: lang === 'es'
      ? 'Intensificar el control vectorial y campañas de eliminación de criaderos; alertar a las IPS de la zona.'
      : 'Intensify vector control and breeding site elimination campaigns; alert local healthcare centers.',
  },
  {
    id: 'vigilancia', min: 0.7,
    label: lang === 'es' ? 'Vigilancia' : 'Surveillance',
    color: '#eab308',
    accion: lang === 'es'
      ? 'Monitoreo reforzado y prevención comunitaria (lavado de tanques, recipientes y llantas).'
      : 'Reinforced monitoring and community prevention (washing water tanks, containers, and tires).',
  },
  {
    id: 'bajo', min: 0,
    label: lang === 'es' ? 'Bajo' : 'Low',
    color: '#22c55e',
    accion: lang === 'es' ? 'Vigilancia epidemiológica rutinaria.' : 'Routine epidemiological surveillance.',
  },
];

const nivelDe = (inc: number, lang: 'es' | 'en'): NivelAlerta => {
  const niveles = getNiveles(lang);
  return niveles.find((n) => inc >= n.min) ?? niveles[niveles.length - 1];
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const REFRESCO_VIVO_MS = 10 * 60 * 1000;

function etiquetaSemana(k: number, lang: 'es' | 'en'): string {
  const total = ANCHOR.semana + k;
  const anio = ANCHOR.anio + Math.floor((total - 1) / 52);
  const sem = ((total - 1) % 52) + 1;
  return lang === 'es' ? `Sem. ${sem} · ${anio}` : `Wk. ${sem} · ${anio}`;
}

const SimulatorView: React.FC = () => {
  const { t, lang } = useT();
  const [meta, setMeta] = useState<ModelMeta | null>(null);
  const [comunaFeats, setComunaFeats] = useState<ComunaFeat[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);

  const [clima, setClima] = useState<ClimaEscenario | null>(null);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);

  const [liveMode, setLiveMode] = useState(false);
  const [live, setLive] = useState<LiveClima | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  const [week, setWeek] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  const [selComuna, setSelComuna] = useState<string>('');
  const [detailWeek, setDetailWeek] = useState<number>(0);

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

  useEffect(() => {
    if (!meta || !clima) return;
    let active = true;
    const base = import.meta.env.BASE_URL;
    const tim = window.setTimeout(() => {
      setComputing(true);
      getSession(base)
        .then((session) => correrPronostico(session, meta, clima, HORIZONTE))
        .then((res) => { if (active) { setForecast(res); setComputing(false); } })
        .catch((e) => active && (setError(String(e)), setComputing(false)));
    }, 180);
    return () => { active = false; window.clearTimeout(tim); };
  }, [meta, clima]);

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

  const ranking = useMemo(() => {
    if (!forecast) return [];
    return Object.entries(forecast.porComuna)
      .map(([id, serie]) => ({ id, casos: serie[week] ?? 0, c: comunaById[id] }))
      .filter((r) => r.c)
      .sort((a, b) => b.casos - a.casos);
  }, [forecast, week, comunaById]);

  const alerta = useMemo(() => {
    if (!forecast || !meta) return null;
    const items = meta.comunas.map((c) => {
      const serie = forecast.porComuna[c.id] ?? [];
      const casos = serie[week] ?? 0;
      const inc = (casos / c.pob) * 10000;
      const prev = week > 0 ? serie[week - 1] ?? casos : meta.seed[c.id]?.[3] ?? casos;
      const tend = casos > prev * 1.05
        ? (lang === 'es' ? 'subiendo' : 'rising')
        : casos < prev * 0.95
          ? (lang === 'es' ? 'bajando' : 'falling')
          : (lang === 'es' ? 'estable' : 'stable');
      return { id: c.id, nombre: c.nombre, municipio: c.municipio, casos, inc, nivel: nivelDe(inc, lang), tend };
    });
    const conteo = { alto: 0, medio: 0, vigilancia: 0, bajo: 0 } as Record<NivelAlerta['id'], number>;
    for (const i of items) conteo[i.nivel.id]++;
    const prioridad = items
      .filter((i) => i.nivel.id === 'alto' || i.nivel.id === 'medio')
      .sort((a, b) => b.inc - a.inc);
    return { items, conteo, prioridad };
  }, [forecast, meta, week, lang]);

  const consulta = useMemo(() => {
    if (!forecast || !meta) return null;
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
    const inc = (casos / c.pob) * 10000;
    const prev = w > 0 ? (serie[w - 1] ?? casos) : (meta.seed[id]?.[3] ?? casos);
    const tend = casos > prev * 1.05
      ? (lang === 'es' ? 'subiendo' : 'rising')
      : casos < prev * 0.95
        ? (lang === 'es' ? 'bajando' : 'falling')
        : (lang === 'es' ? 'estable' : 'stable');
    const nivel = nivelDe(inc, lang);
    const pico = serie.length ? Math.max(...serie) : 0;
    const semanaPico = serie.indexOf(pico);
    const total = serie.reduce((a, b) => a + b, 0);
    return { id, c, w, serie, casos, inc, tend, nivel, pico, semanaPico, total };
  }, [forecast, meta, selComuna, detailWeek, comunaById, lang]);

  const consultaChart = useMemo<EChartsOption | null>(() => {
    if (!consulta) return null;
    const xs = consulta.serie.map((_, i) => etiquetaSemana(i + 1, lang));
    const casesLabel = lang === 'es' ? 'Casos:' : 'Cases:';
    return {
      grid: { top: 14, right: 10, bottom: 22, left: 30 },
      tooltip: { trigger: 'axis', ...baseTooltip,
        formatter: (p: unknown) => {
          const a = p as { dataIndex: number; value: number }[];
          return `<b>${xs[a[0].dataIndex]}</b><br/>${casesLabel} <b>${Math.round(a[0].value)}</b>`;
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
  }, [consulta, lang]);

  const totalActual = forecast ? forecast.totalSemana[week] ?? 0 : 0;
  const totalPico = forecast ? Math.max(...forecast.totalSemana) : 0;
  const semanaPico = forecast ? forecast.totalSemana.indexOf(totalPico) : 0;

  const casosHorizonte = forecast ? forecast.totalSemana.reduce((a, b) => a + b, 0) : 0;
  const costoHorizonte = casosHorizonte * COSTO_CASO_COP;
  const ahorroHorizonte = costoHorizonte * PCT_EVITABLE;

  const mapOption = useMemo<EChartsOption | null>(() => {
    if (!forecast || !meta) return null;
    const data = [
      ...meta.comunas.map((c) => ({
        name: c.id,
        value: forecast.porComuna[c.id]?.[week] ?? 0,
        nombre: c.nombre,
        municipio: c.municipio,
      })),
      {
        name: 'MUNI_Bucaramanga', value: undefined as unknown as number, silent: true,
        itemStyle: { areaColor: 'transparent', borderColor: CITY_BORDER.Bucaramanga, borderWidth: 4 },
      },
      {
        name: 'MUNI_Floridablanca', value: undefined as unknown as number, silent: true,
        itemStyle: { areaColor: 'transparent', borderColor: CITY_BORDER.Floridablanca, borderWidth: 4 },
      },
    ];
    const projLabel = lang === 'es' ? 'Casos proyectados:' : 'Projected cases:';
    const moreRisk = lang === 'es' ? 'Mayor riesgo' : 'Higher risk';
    const lessRisk = lang === 'es' ? 'Menor' : 'Lower';

    return {
      tooltip: {
        trigger: 'item', ...baseTooltip,
        formatter: (p: unknown) => {
          const d = p as { data?: { nombre?: string; municipio?: string; value?: number } };
          if (!d.data || d.data.nombre === undefined) return '';
          return `<b>${d.data.nombre}</b><br/><span style="color:rgba(255,255,255,0.55)">${d.data.municipio}</span><br/>${projLabel} <b>${(d.data.value ?? 0).toFixed(1)}</b>`;
        },
      },
      visualMap: {
        type: 'continuous', min: 0, max: maxCasos, left: 6, bottom: 8,
        calculable: true, itemHeight: 120, text: [moreRisk, lessRisk],
        textStyle: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
        inRange: { color: DENGUE_COLORS },
      },
      series: [{
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
  }, [forecast, meta, week, maxCasos, lang]);

  const trendOption = useMemo<EChartsOption | null>(() => {
    if (!forecast || !meta) return null;
    const OFFSET = 4;
    const seedWeeks = [ANCHOR.semana - 3, ANCHOR.semana - 2, ANCHOR.semana - 1, ANCHOR.semana];
    const seedLabels = seedWeeks.map((s) => lang === 'es' ? `Sem. ${s} · ${ANCHOR.anio}` : `Wk. ${s} · ${ANCHOR.anio}`);
    const seedTotals = [0, 1, 2, 3].map((j) =>
      Math.round(Object.values(meta.seed).reduce((a, arr) => a + (arr[j] ?? 0), 0)));
    const fc = forecast.totalSemana.map((v) => Math.round(v));
    const xs = fc.map((_, i) => etiquetaSemana(i + 1, lang));
    const xAll = [...seedLabels, ...xs];
    const obs: (number | null)[] = [...seedTotals, ...fc.map(() => null)];
    const pred: (number | null)[] = [null, null, null, seedTotals[3], ...fc];

    const labelObs = lang === 'es' ? 'Observado' : 'Observed';
    const labelPred = lang === 'es' ? 'Pronóstico' : 'Forecast';
    const casesAMB = lang === 'es' ? 'Casos AMB:' : 'Metro cases:';
    const forecastArrow = lang === 'es' ? 'pronóstico →' : 'forecast →';

    return {
      grid: { top: 26, right: 16, bottom: 28, left: 40 },
      legend: { top: 0, right: 0, data: [labelObs, labelPred],
        textStyle: { color: 'rgba(255,255,255,0.8)', fontSize: 10 }, itemWidth: 14, itemHeight: 8 },
      tooltip: { trigger: 'axis', ...baseTooltip,
        formatter: (p: unknown) => {
          const arr = p as { dataIndex: number; value: number | null }[];
          const i = arr[0].dataIndex;
          const val = arr.find((a) => a.value != null)?.value ?? 0;
          const tag = i < OFFSET ? (lang === 'es' ? 'observado' : 'observed') : `+${i - OFFSET + 1} ${lang === 'es' ? 'sem' : 'wks'}`;
          return `<b>${xAll[i]}</b> (${tag})<br/>${casesAMB} <b>${Math.round(val)}</b>`;
        } },
      xAxis: { type: 'category', data: xAll, axisLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 9, interval: 2 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.45)' } } },
      yAxis: { type: 'value', axisLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
      series: [
        { name: labelObs, type: 'line', smooth: true, symbol: 'none', data: obs,
          lineStyle: { color: 'rgba(255,255,255,0.85)', width: 2 },
          areaStyle: { color: 'rgba(255,255,255,0.06)' } },
        { name: labelPred, type: 'line', smooth: true, symbol: 'none', connectNulls: false, data: pred,
          lineStyle: { color: '#00f0ff', width: 2.5 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0,240,255,0.35)' }, { offset: 1, color: 'rgba(0,240,255,0.02)' }]) },
          markLine: { silent: true, symbol: 'none', data: [{ xAxis: OFFSET - 1 }],
            lineStyle: { color: 'rgba(255,255,255,0.4)', type: 'dotted', width: 1.5 },
            label: { formatter: forecastArrow, color: 'rgba(255,255,255,0.65)', fontSize: 10, position: 'insideEndTop' } },
          markPoint: {
            symbol: 'circle', symbolSize: 12,
            data: [{ name: 'actual', coord: [week + OFFSET, Math.round(forecast.totalSemana[week] ?? 0)] }],
            itemStyle: { color: '#fff', borderColor: '#00f0ff', borderWidth: 3 },
            label: { show: false },
          },
        },
      ],
    };
  }, [forecast, week, meta, lang]);

  if (error)
    return <div className={styles.state}>{lang === 'es' ? `No se pudo cargar el motor predictivo: ${error}` : `Failed to load predictive engine: ${error}`}</div>;
  if (!meta || !clima || !comunaFeats)
    return <div className={styles.state}><Cpu className={styles.spin} /> {lang === 'es' ? 'Cargando motor predictivo (ONNX)…' : 'Loading predictive engine (ONNX)…'}</div>;

  const setC = (k: keyof ClimaEscenario) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setClima((c) => (c ? { ...c, [k]: Number(e.target.value) } : c));
  const resetClima = () => setClima({
    precip: meta.clima_ranges.precip.med,
    temp: meta.clima_ranges.temp.med,
    humedad: meta.clima_ranges.humedad.med,
  });

  const ConsultaTrend = consulta
    ? (consulta.tend === 'subiendo' || consulta.tend === 'rising' ? TrendingUp : consulta.tend === 'bajando' || consulta.tend === 'falling' ? TrendingDown : Minus)
    : Minus;

  const weekUnits = lang === 'es' ? 'sem' : 'wks';

  return (
    <div className={styles.sim}>
      {/* Encabezado + métricas del modelo */}
      <div className={styles.header}>
        <div>
          <h2>{lang === 'es' ? 'Simulador predictivo de propagación' : 'Predictive Propagation Simulator'}</h2>
          <p>{lang === 'es' ? 'Pronóstico autoregresivo del dengue por comuna del Área Metropolitana, semana a semana. Ajusta el escenario climático y observa cómo evoluciona el riesgo.' : 'Autoregressive dengue forecast by district in the Metropolitan Area, week by week. Adjust climate scenarios and observe risk evolution.'}</p>
        </div>
        <div className={styles.metricBadges}>
          <div className={styles.metricBadge}>
            <span className={styles.metricVal}>R² {meta.metrics.modelo.R2.toFixed(2)}</span>
            <span className={styles.metricLbl}>{lang === 'es' ? 'validación en brote 2024–25' : 'validation in 2024–25 outbreak'}</span>
          </div>
          <div className={styles.metricBadge}>
            <span className={styles.metricVal}>MAE {meta.metrics.modelo.MAE.toFixed(1)}</span>
            <span className={styles.metricLbl}>{lang === 'es' ? 'error medio (casos/sem)' : 'mean error (cases/wk)'}</span>
          </div>
        </div>
      </div>

      {/* Ancla real verificable: situación 2026 del boletín del INS */}
      <Situacion2026 forecast={forecast} comunas={meta.comunas} />

      <div className={styles.grid}>
        {/* Columna izquierda: mapa + control de simulación */}
        <div className={styles.mapCol}>
          <div className={styles.mapCard}>
            <div className={styles.mapHead}>
              <span className={styles.mapTitle}>{t.simulator.simMapTitle}</span>
              <span className={styles.weekTag}>{etiquetaSemana(week + 1, lang)} · {lang === 'es' ? `proyección +${week + 1} sem` : `projection +${week + 1} wks`}</span>
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
              <button className={styles.iconBtn} onClick={() => { setPlaying(false); setWeek(0); }} title={lang === 'es' ? 'Reiniciar' : 'Restart'}>
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
              {t.simulator.mapNote}
            </div>
          </div>

          {/* Control de simulación */}
          <div className={styles.panel}>
            <div className={styles.panelHead}><h3>{t.simulator.simControlTitle}</h3></div>
            <button
              className={styles.runBtn}
              data-playing={playing}
              onClick={() => { if (week >= HORIZONTE - 1) setWeek(0); setPlaying((p) => !p); }}
            >
              {playing
                ? <><Pause size={18} /> {t.simulator.btnPause}</>
                : <><Play size={18} /> {t.simulator.btnRun}</>}
            </button>
            <div className={styles.runMeta}>
              <span>{t.simulator.projectedWeek}</span>
              <b>+{week + 1} / {HORIZONTE}</b>
            </div>
            <div className={styles.runHint}>
              {t.simulator.runHint}
            </div>
          </div>
        </div>

        {/* Panel lateral: escenario climático + resumen */}
        <div className={styles.side}>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <h3>{t.simulator.climateScenarioTitle}</h3>
              <button
                className={`${styles.liveToggle} ${liveMode ? styles.liveOn : ''}`}
                onClick={() => setLiveMode((v) => !v)}
                title={lang === 'es' ? 'Consume clima real de Bucaramanga (Open-Meteo) cada 10 min' : 'Fetches real Bucaramanga weather (Open-Meteo) every 10 min'}
              >
                <Radio size={13} /> {liveMode ? t.simulator.liveToggleLive : t.simulator.liveToggleRealtime}
              </button>
            </div>

            {liveMode && (
              <div className={styles.liveBar}>
                {liveError ? (
                  <span className={styles.liveErr}>{t.simulator.liveError}</span>
                ) : live ? (
                  <span>
                    <span className={styles.liveDot} /> {lang === 'es' ? 'En vivo · Bucaramanga · ahora ' : 'Live · Bucaramanga · now '} <b>{live.currentTemp?.toFixed(0)}°C</b>
                    {' · '}{lang === 'es' ? 'act. ' : 'upd. '}{new Date(live.updated).toLocaleTimeString(lang === 'es' ? 'es-CO' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  <span>{t.simulator.liveConnecting}</span>
                )}
              </div>
            )}

            <Slider icon={<CloudRain size={15} />} label={t.simulator.lblPrecip} unit={t.simulator.unitPrecip} disabled={liveMode}
              value={clima.precip} range={meta.clima_ranges.precip} step={0.5} onChange={setC('precip')} />
            <Slider icon={<Thermometer size={15} />} label={t.simulator.lblTemp} unit={t.simulator.unitTemp} disabled={liveMode}
              value={clima.temp} range={meta.clima_ranges.temp} step={0.1} onChange={setC('temp')} />
            <Slider icon={<Droplets size={15} />} label={t.simulator.lblHumidity} unit={t.simulator.unitHumidity} disabled={liveMode}
              value={clima.humedad} range={meta.clima_ranges.humedad} step={1} onChange={setC('humedad')} />

            {liveMode ? (
              <div className={styles.moneyNote}>
                {lang === 'es'
                  ? 'Escenario fijado con clima real (Open-Meteo): suma de lluvia y media de temp/humedad de los últimos 7 días. Desactiva «En vivo» para ajustar a mano.'
                  : 'Scenario fixed with live weather (Open-Meteo): 7-day rainfall sum and average temp/humidity. Disable "Live" to adjust manually.'}
              </div>
            ) : (
              <button className={styles.resetClima} onClick={resetClima}>{t.simulator.btnResetMed}</button>
            )}
            {computing && <div className={styles.computing}>{t.simulator.recalculating}</div>}
          </div>

          {/* Resumen */}
          <div className={styles.panel}>
            <div className={styles.summaryGrid}>
              <div className={styles.bigStat}>
                <span className={styles.bigVal}>{totalActual.toFixed(0)}</span>
                <span className={styles.bigLbl}>{t.simulator.summaryAmbCases.replace('{semana}', etiquetaSemana(week + 1, lang))}</span>
              </div>
              <div className={styles.bigStat}>
                <span className={styles.bigVal}>{totalPico.toFixed(0)}</span>
                <span className={styles.bigLbl}>{t.simulator.summaryPeakCases.replace('{semana}', String(semanaPico + 1))}</span>
              </div>
            </div>
            {trendOption && <EChart option={trendOption} height={172} />}
            <div className={styles.mapNote} style={{ marginTop: 2 }}>
              {t.simulator.observedNote.replace('{semana}', String(ANCHOR.semana))}
            </div>

            {/* Traducción económica */}
            <div className={styles.moneyStrip}>
              <div className={styles.moneyItem}>
                <span className={styles.moneyVal}>{fmtMillones(costoHorizonte, lang)}</span>
                <span className={styles.moneyLbl}>{t.simulator.moneyProjected}</span>
              </div>
              <div className={styles.moneyItem}>
                <span className={`${styles.moneyVal} ${styles.moneySave}`}>{fmtMillones(ahorroHorizonte, lang)}</span>
                <span className={styles.moneyLbl}>{t.simulator.moneySavings}</span>
              </div>
            </div>
            <div className={styles.moneyNote}>
              {t.simulator.moneyNote}
            </div>
          </div>

          {/* Top comunas */}
          <div className={styles.panel}>
            <div className={styles.panelHead}><h3>{t.simulator.rankingTitle}</h3></div>
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

      {/* Sistema de alerta temprana */}
      {alerta && (
        <div className={styles.alertaSection}>
          <div className={styles.alertaHead}>
            <div className={styles.alertaTitle}>
              <ShieldAlert size={18} />
              <h3>{lang === 'es' ? 'Sistema de alerta temprana · recomendaciones' : 'Early Warning System · Recommendations'}</h3>
            </div>
            <span className={styles.weekTag}>{etiquetaSemana(week + 1, lang)} · +{week + 1} {weekUnits}</span>
          </div>

          {consulta && (
            <div className={styles.consulta}>
              <div className={styles.consultaControls}>
                <label className={styles.consultaField}>
                  <span>{lang === 'es' ? 'Comuna' : 'Comuna'}</span>
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
                  <span>{lang === 'es' ? 'Semana proyectada' : 'Projected week'}</span>
                  <select
                    className={styles.consultaSelect}
                    value={consulta.w}
                    onChange={(e) => setDetailWeek(Number(e.target.value))}
                  >
                    {Array.from({ length: HORIZONTE }, (_, k) => (
                      <option key={k} value={k}>{etiquetaSemana(k + 1, lang)} · +{k + 1} {weekUnits}</option>
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
                  <div><b>{consulta.casos.toFixed(1)}</b><span>{lang === 'es' ? 'casos proyectados' : 'projected cases'}</span></div>
                  <div><b>{consulta.inc.toFixed(1)}</b><span>{lang === 'es' ? 'por 10k hab' : 'per 10k pop'}</span></div>
                  <div className={styles.consultaTendBox}><ConsultaTrend size={14} /><span>{consulta.tend}</span></div>
                  <div><b>{Math.round(consulta.total)}</b><span>{lang === 'es' ? `total ${HORIZONTE} sem` : `total ${HORIZONTE} wks`}</span></div>
                </div>
                {consultaChart && <EChart option={consultaChart} height={120} />}
                <div className={styles.consultaAccion}>
                  <span className={styles.consultaAccionLbl}>{lang === 'es' ? 'Recomendación para esta comuna' : 'Recommendation for this comuna'}</span>
                  {consulta.nivel.accion}
                </div>
              </div>
            </div>
          )}

          {/* Mensaje titular */}
          <div
            className={styles.alertaBanner}
            style={{ borderColor: alerta.conteo.alto ? '#ef4444' : alerta.conteo.medio ? '#f97316' : '#22c55e' }}
          >
            {lang === 'es' ? (
              alerta.conteo.alto > 0 ? (
                <>🔴 <b>{alerta.conteo.alto} comuna{alerta.conteo.alto > 1 ? 's' : ''} en riesgo alto</b> esta semana.
                  Prioriza el control vectorial en <b>{alerta.prioridad.slice(0, 3).map((p) => p.nombre).join(', ')}</b>.</>
              ) : alerta.conteo.medio > 0 ? (
                <>🟠 <b>{alerta.conteo.medio} comuna{alerta.conteo.medio > 1 ? 's' : ''} en riesgo medio</b>.
                  Refuerza prevención en <b>{alerta.prioridad.slice(0, 3).map((p) => p.nombre).join(', ')}</b>.</>
              ) : (
                <>🟢 Sin comunas en riesgo alto esta semana. Mantener vigilancia epidemiológica rutinaria.</>
              )
            ) : (
              alerta.conteo.alto > 0 ? (
                <>🔴 <b>{alerta.conteo.alto} comuna{alerta.conteo.alto > 1 ? 's' : ''} at high risk</b> this week.
                  Prioritize vector control in <b>{alerta.prioridad.slice(0, 3).map((p) => p.nombre).join(', ')}</b>.</>
              ) : alerta.conteo.medio > 0 ? (
                <>🟠 <b>{alerta.conteo.medio} comuna{alerta.conteo.medio > 1 ? 's' : ''} at medium risk</b>.
                  Reinforce prevention in <b>{alerta.prioridad.slice(0, 3).map((p) => p.nombre).join(', ')}</b>.</>
              ) : (
                <>🟢 No comunas at high risk this week. Maintain routine epidemiological surveillance.</>
              )
            )}
          </div>

          {/* Conteo por nivel */}
          <div className={styles.nivelChips}>
            {getNiveles(lang).map((n) => (
              <span key={n.id} className={styles.nivelChip}>
                <i style={{ background: n.color }} /> {n.label}: <b>{alerta.conteo[n.id]}</b>
              </span>
            ))}
          </div>

          {/* Tarjetas de acción priorizadas */}
          {alerta.prioridad.length > 0 ? (
            <div className={styles.accionGrid}>
              {alerta.prioridad.slice(0, 6).map((p) => {
                const Trend = p.tend === 'subiendo' || p.tend === 'rising' ? TrendingUp : p.tend === 'bajando' || p.tend === 'falling' ? TrendingDown : Minus;
                return (
                  <div key={p.id} className={styles.accionCard} style={{ borderLeftColor: p.nivel.color }}>
                    <div className={styles.accionTop}>
                      <span className={styles.accionNombre}>{p.nombre} <em>{p.municipio}</em></span>
                      <span className={styles.accionNivel} style={{ color: p.nivel.color }}>{p.nivel.label}</span>
                    </div>
                    <div className={styles.accionMetrics}>
                      <span>{p.casos.toFixed(1)} {lang === 'es' ? 'casos/sem' : 'cases/wk'}</span>
                      <span>{p.inc.toFixed(1)} {lang === 'es' ? '/10k hab' : '/10k pop'}</span>
                      <span className={styles.accionTend}><Trend size={13} /> {p.tend}</span>
                    </div>
                    <div className={styles.accionTexto}>{p.nivel.accion}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.accionVacio}>
              {lang === 'es'
                ? 'Ninguna comuna supera el umbral de riesgo medio en esta semana proyectada.'
                : 'No comuna exceeds the medium risk threshold in this projected week.'}
            </div>
          )}

          <div className={styles.mapNote}>
            {lang === 'es'
              ? 'Nivel por incidencia semanal (casos por 10.000 hab): alto ≥ 3 · medio ≥ 1,5 · vigilancia ≥ 0,7. Las acciones son sugerencias de control vectorial estándar; la decisión final es de la autoridad sanitaria.'
              : 'Level by weekly incidence (cases per 10,000 pop): high ≥ 3 · medium ≥ 1.5 · surveillance ≥ 0.7. Actions are standard vector control guidelines; final authority rests with public health officials.'}
          </div>
        </div>
      )}

      {/* Validación: backtest del brote 2024 */}
      <Backtest2024 />

      {/* Nota sobre el rol del clima */}
      <div className={styles.disclaimer}>
        <TriangleAlert size={16} />
        <span>
          {lang === 'es' ? (
            <>
              <b>El clima es un modulador, no el motor.</b> El modelo aprende que la inercia epidémica
              (casos recientes) predice el dengue mucho mejor que el clima por sí solo — así funcionan los
              sistemas reales de alerta temprana. Por eso los sliders ajustan el escenario, pero la trayectoria
              la marca sobre todo la dinámica de transmisión. Profundidad de datos asimétrica:
              Bucaramanga 2015–2025; Floridablanca 2023–2025.
            </>
          ) : (
            <>
              <b>Climate modulates, but doesn’t drive transmission alone.</b> The model learns that epidemic inertia
              (recent case counts) predicts dengue dynamics far better than climate in isolation — reflecting true
              early-warning systems. Sliders tune the scenario, while transmission inertia governs trajectory.
              Historical depth: Bucaramanga 2015–2025; Floridablanca 2023–2025.
            </>
          )}
        </span>
      </div>
    </div>
  );
};

const RiskMap: React.FC<{ option: EChartsOption; height: number }> = ({ option, height }) => (
  <ReactECharts
    option={option}
    style={{ height, width: '100%' }}
    opts={{ renderer: 'canvas' }}
    notMerge={false}
    lazyUpdate
  />
);

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
