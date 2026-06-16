import React, { useEffect, useMemo, useState } from 'react';
import type { EChartsOption } from 'echarts';
import {
  loadDengueData, emptyFilters, applyFilters, computeKpis, countByDict,
  ageBySex, casesByYear, symptomPrevalence, endemicChannel, COL,
  type DengueData, type Filters,
} from './dengue';
import EChart from './components/EChart';
import KpiCards from './components/KpiCards';
import FilterBar from './components/FilterBar';
import GeoMaps from './components/GeoMaps';
import styles from './DashboardView.module.css';

const AXIS = 'rgba(255,255,255,0.35)';
const SPLIT = 'rgba(255,255,255,0.05)';
const CYAN = '#00f0ff';

const baseGrid = { left: 48, right: 20, top: 30, bottom: 36 };
const axisCommon = {
  axisLine: { lineStyle: { color: SPLIT } },
  axisLabel: { color: AXIS, fontSize: 11 },
  splitLine: { lineStyle: { color: SPLIT } },
};
const tooltipStyle = {
  backgroundColor: 'rgba(16,22,35,0.95)',
  borderColor: 'rgba(255,255,255,0.1)',
  textStyle: { color: '#fff', fontSize: 12 },
};

const DashboardView: React.FC = () => {
  const [data, setData] = useState<DengueData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters());

  useEffect(() => {
    loadDengueData().then(setData).catch((e) => setError(String(e)));
  }, []);

  // Filas filtradas (incluye año) para KPIs y demografía
  const rows = useMemo(() => (data ? applyFilters(data.rows, filters) : []), [data, filters]);
  // Filas sin filtro de año para el canal endémico y la tendencia anual
  const rowsNoYear = useMemo(() => (data ? applyFilters(data.rows, filters, false) : []), [data, filters]);

  const charts = useMemo<{ kpis: ReturnType<typeof computeKpis>; options: Record<string, EChartsOption> } | null>(() => {
    if (!data) return null;
    const { meta } = data;
    const gravesIdx = meta.dicts.severidad.indexOf('Grave');
    const fIdx = meta.dicts.sexo.indexOf('F');
    const mIdx = meta.dicts.sexo.indexOf('M');
    const kpis = computeKpis(rows, gravesIdx);

    // --- Canal endémico ---
    const focusYear = filters.anio.size ? Math.max(...filters.anio) : meta.years[meta.years.length - 1];
    const ec = endemicChannel(rowsNoYear, meta.years, focusYear);
    const ceil = Math.max(...ec.p75, ...ec.focus, 1) * 1.2;
    const endemic: EChartsOption = {
      tooltip: {
        trigger: 'axis', ...tooltipStyle,
        formatter: (params: unknown) => {
          const arr = params as Array<{ axisValue: string; dataIndex: number }>;
          const i = arr[0]?.dataIndex ?? 0;
          return `<b>Semana ${ec.weeks[i]}</b><br/>` +
            `Casos ${focusYear}: <b style="color:#fff">${ec.focus[i]}</b><br/>` +
            `Esperado (mediana): ${Math.round(ec.p50[i])}<br/>` +
            `Umbral epidemia (p75): ${Math.round(ec.p75[i])}`;
        },
      },
      legend: { data: ['Éxito', 'Seguridad', 'Epidemia', `Casos ${focusYear}`], textStyle: { color: AXIS }, top: 0, right: 0 },
      grid: { ...baseGrid, top: 36 },
      xAxis: { type: 'category', data: ec.weeks, name: 'Semana epidemiológica', nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: AXIS }, ...axisCommon },
      yAxis: { type: 'value', name: 'Casos', nameTextStyle: { color: AXIS }, ...axisCommon },
      series: [
        { name: 'Éxito', type: 'line', data: ec.p25, stack: 'band', lineStyle: { opacity: 0 }, showSymbol: false, areaStyle: { color: 'rgba(34,197,94,0.22)' } },
        { name: 'Seguridad', type: 'line', data: ec.p75.map((v, i) => v - ec.p25[i]), stack: 'band', lineStyle: { opacity: 0 }, showSymbol: false, areaStyle: { color: 'rgba(234,179,8,0.20)' } },
        { name: 'Epidemia', type: 'line', data: ec.p75.map((v) => ceil - v), stack: 'band', lineStyle: { opacity: 0 }, showSymbol: false, areaStyle: { color: 'rgba(239,68,68,0.16)' } },
        { name: `Casos ${focusYear}`, type: 'line', data: ec.focus, showSymbol: false, smooth: true, lineStyle: { color: '#fff', width: 2.5 }, z: 5 },
      ],
    };

    // --- Tendencia anual ---
    const yearly = casesByYear(rowsNoYear, meta.years);
    const trend: EChartsOption = {
      tooltip: { trigger: 'axis', ...tooltipStyle },
      grid: baseGrid,
      xAxis: { type: 'category', data: meta.years, ...axisCommon },
      yAxis: { type: 'value', ...axisCommon },
      series: [{
        type: 'bar', data: yearly.map((v, i) => {
          const sel = filters.anio.size ? filters.anio.has(meta.years[i]) : meta.years[i] === focusYear;
          return { value: v, itemStyle: { color: sel ? CYAN : 'rgba(0,240,255,0.3)', borderRadius: [4, 4, 0, 0] } };
        }),
        barWidth: '55%',
      }],
    };

    // --- Pirámide edad × sexo ---
    const { f, m } = ageBySex(rows, meta.dicts.edad.length, fIdx, mIdx);
    const pyramid: EChartsOption = {
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' }, ...tooltipStyle,
        formatter: (params: unknown) => {
          const arr = params as Array<{ axisValue: string; value: number; seriesName: string }>;
          return `<b>${arr[0]?.axisValue}</b><br/>` +
            arr.map((p) => `${p.seriesName}: <b>${Math.abs(p.value)}</b>`).join('<br/>');
        },
      },
      legend: { data: ['Femenino', 'Masculino'], textStyle: { color: AXIS }, top: 0 },
      grid: { ...baseGrid, top: 30, left: 60 },
      xAxis: { type: 'value', axisLabel: { color: AXIS, fontSize: 11, formatter: (v: number) => `${Math.abs(v)}` }, axisLine: { lineStyle: { color: SPLIT } }, splitLine: { lineStyle: { color: SPLIT } } },
      yAxis: { type: 'category', data: meta.dicts.edad, axisLine: { lineStyle: { color: SPLIT } }, axisLabel: { color: AXIS, fontSize: 11 } },
      series: [
        { name: 'Femenino', type: 'bar', stack: 'sex', data: f.map((v) => -v), itemStyle: { color: '#b300ff', borderRadius: [0, 3, 3, 0] } },
        { name: 'Masculino', type: 'bar', stack: 'sex', data: m, itemStyle: { color: CYAN, borderRadius: [0, 3, 3, 0] } },
      ],
    };

    // --- Severidad (donut) ---
    const sev = countByDict(rows, COL.severidad, meta.dicts.severidad.length);
    const sevColors = ['#22c55e', '#eab308', '#ef4444', 'rgba(255,255,255,0.25)'];
    const severity: EChartsOption = {
      tooltip: { trigger: 'item', ...tooltipStyle, formatter: '{b}: <b>{c}</b> ({d}%)' },
      legend: { bottom: 0, textStyle: { color: AXIS, fontSize: 11 }, type: 'scroll' },
      series: [{
        type: 'pie', radius: ['45%', '70%'], center: ['50%', '44%'], avoidLabelOverlap: true,
        itemStyle: { borderColor: '#0b0f19', borderWidth: 2 },
        label: { color: '#fff', fontSize: 11 },
        data: meta.dicts.severidad.map((name, i) => ({ name, value: sev[i], itemStyle: { color: sevColors[i % sevColors.length] } })),
      }],
    };

    // --- Estrato ---
    const estr = countByDict(rows, COL.estrato, meta.dicts.estrato.length);
    const estrato: EChartsOption = {
      tooltip: { trigger: 'axis', ...tooltipStyle },
      grid: baseGrid,
      xAxis: { type: 'category', data: meta.dicts.estrato, ...axisCommon },
      yAxis: { type: 'value', ...axisCommon },
      series: [{ type: 'bar', data: estr, barWidth: '55%', itemStyle: { color: '#eab308', borderRadius: [4, 4, 0, 0] } }],
    };

    // --- Síntomas (top prevalencia) ---
    const prev = symptomPrevalence(rows, meta.symptoms.length);
    const order = prev.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).slice(-12);
    const total = rows.length || 1;
    const symptoms: EChartsOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...tooltipStyle, formatter: (p: unknown) => { const a = (p as Array<{ name: string; value: number }>)[0]; return `${a.name}: <b>${((a.value / total) * 100).toFixed(1)}%</b>`; } },
      grid: { ...baseGrid, left: 130, right: 30 },
      xAxis: { type: 'value', max: 100, axisLabel: { color: AXIS, fontSize: 11, formatter: '{value}%' }, axisLine: { lineStyle: { color: SPLIT } }, splitLine: { lineStyle: { color: SPLIT } } },
      yAxis: { type: 'category', data: order.map(([, i]) => meta.symptoms[i]), axisLine: { lineStyle: { color: SPLIT } }, axisLabel: { color: AXIS, fontSize: 11 } },
      series: [{ type: 'bar', data: order.map(([v]) => +((v / total) * 100).toFixed(1)), barWidth: '60%', itemStyle: { color: CYAN, borderRadius: [0, 3, 3, 0] } }],
    };

    return { kpis, options: { endemic, trend, pyramid, severity, estrato, symptoms } };
  }, [data, rows, rowsNoYear, filters]);

  if (error) return <div className={styles.state}>Error cargando datos: {error}</div>;
  if (!data || !charts) return <div className={styles.state}>Cargando datos del SIVIGILA…</div>;

  const { kpis, options } = charts;

  return (
    <div className={styles.dashboard}>
      <FilterBar meta={data.meta} filters={filters} onChange={setFilters} />
      <KpiCards kpis={kpis} />

      <div className={styles.chartGrid}>
        <Panel title="Canal endémico semanal" subtitle="Casos del año vs. bandas históricas (éxito / seguridad / epidemia)" span={2}>
          <EChart option={options.endemic} height={360} />
        </Panel>

        <Panel title="Tendencia anual" subtitle="Casos confirmados por año">
          <EChart option={options.trend} />
        </Panel>

        <Panel title="Pirámide poblacional" subtitle="Casos por grupo de edad y sexo">
          <EChart option={options.pyramid} height={360} />
        </Panel>

        <Panel title="Clasificación clínica" subtitle="Distribución por severidad">
          <EChart option={options.severity} />
        </Panel>

        <Panel title="Estrato socioeconómico" subtitle="Casos por estrato">
          <EChart option={options.estrato} />
        </Panel>

        <Panel title="Signos y síntomas" subtitle="Prevalencia en los casos filtrados" span={2}>
          <EChart option={options.symptoms} height={360} />
        </Panel>
      </div>

      <GeoMaps />
    </div>
  );
};

const Panel: React.FC<{ title: string; subtitle: string; span?: number; children: React.ReactNode }> = ({ title, subtitle, span = 1, children }) => (
  <div className={styles.panel} style={{ gridColumn: span === 2 ? 'span 2' : undefined }}>
    <div className={styles.panelHead}>
      <h3>{title}</h3>
      <span>{subtitle}</span>
    </div>
    {children}
  </div>
);

export default DashboardView;
