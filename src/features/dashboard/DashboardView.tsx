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
import ClimatePanel from './components/ClimatePanel';
import { useT } from '../../i18n/useT';
import styles from './DashboardView.module.css';

const AXIS = 'rgba(255,255,255,0.9)';
const AXIS_LINE = 'rgba(255,255,255,0.45)';
const SPLIT = 'rgba(255,255,255,0.06)';
const CYAN = '#00f0ff';

const baseGrid = { left: 48, right: 20, top: 30, bottom: 36 };
const axisCommon = {
  axisLine: { lineStyle: { color: AXIS_LINE } },
  axisLabel: { color: AXIS, fontSize: 11 },
  splitLine: { lineStyle: { color: SPLIT } },
};
const tooltipStyle = {
  backgroundColor: 'rgba(16,22,35,0.95)',
  borderColor: 'rgba(255,255,255,0.1)',
  textStyle: { color: '#fff', fontSize: 12 },
};

const AMBER = '#f59e0b';

const DashboardView: React.FC = () => {
  const { t, lang } = useT();
  const [data, setData] = useState<DengueData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters());
  const [bga2026, setBga2026] = useState<number[] | null>(null);

  useEffect(() => {
    loadDengueData().then(setData).catch((e) => setError(String(e)));
    const base = import.meta.env.BASE_URL;
    fetch(`${base}data/nowcast_2026.json`)
      .then((r) => r.json())
      .then((d: { series?: { bucaramanga_real?: { anio: number; semana: number; casos: number }[] } }) => {
        const arr: number[] = new Array(53).fill(NaN);
        (d.series?.bucaramanga_real ?? []).forEach((p) => {
          if (p.anio === 2026 && p.semana >= 1 && p.semana <= 53) arr[p.semana - 1] = Math.round(p.casos);
        });
        setBga2026(arr);
      })
      .catch(() => setBga2026(null));
  }, []);

  const rows = useMemo(() => (data ? applyFilters(data.rows, filters) : []), [data, filters]);

  const vig2026 = useMemo(() => {
    if (!data || !bga2026) return null;
    const present = bga2026.map((v, i) => [v, i + 1]).filter(([v]) => !Number.isNaN(v));
    const lastWeek = present.length ? present[present.length - 1][1] : 0;
    const total = present.reduce((a, [v]) => a + v, 0);
    const ultima = present.length ? present[present.length - 1][0] : 0;
    const uptoWk = (year: number) =>
      data.rows.reduce((a, r) => a + (r[COL.anio] === year && r[COL.semana] <= lastWeek ? 1 : 0), 0);
    const ref2024 = uptoWk(2024);
    const pct2024 = ref2024 ? (total / ref2024) * 100 : 0;
    return { lastWeek, total, ultima, pct2024 };
  }, [data, bga2026]);

  const charts = useMemo<{ kpis: ReturnType<typeof computeKpis>; options: Record<string, EChartsOption> } | null>(() => {
    if (!data) return null;
    const { meta } = data;
    const gravesIdx = meta.dicts.severidad.indexOf('Grave');
    const fIdx = meta.dicts.sexo.indexOf('F');
    const mIdx = meta.dicts.sexo.indexOf('M');
    const kpis = computeKpis(rows, gravesIdx);

    const ec = endemicChannel(data.rows, meta.years, -1);
    const line2026 = bga2026 ?? new Array(53).fill(NaN);
    const ceil = Math.max(...ec.p75, ...line2026.filter((v) => !Number.isNaN(v)), 1) * 1.2;

    const labelSuccess = lang === 'es' ? 'Éxito' : 'Success';
    const labelSecurity = lang === 'es' ? 'Seguridad' : 'Security';
    const labelEpidemic = lang === 'es' ? 'Epidemia' : 'Epidemic';
    const label2026 = lang === 'es' ? '2026 (boletín INS)' : '2026 (INS Bulletin)';

    const endemic: EChartsOption = {
      tooltip: {
        trigger: 'axis', ...tooltipStyle,
        formatter: (params: unknown) => {
          const arr = params as Array<{ dataIndex: number }>;
          const i = arr[0]?.dataIndex ?? 0;
          const v2026 = line2026[i];
          const weekLabel = lang === 'es' ? `Semana ${ec.weeks[i]}` : `Week ${ec.weeks[i]}`;
          const noData = lang === 'es' ? '2026: sin dato aún' : '2026: no data yet';
          const cases2026 = lang === 'es' ? 'Casos 2026 (boletín):' : '2026 Cases (bulletin):';
          const expected = lang === 'es' ? 'Esperado histórico (mediana):' : 'Historic expected (median):';
          const threshold = lang === 'es' ? 'Umbral epidemia (p75):' : 'Epidemic threshold (p75):';

          return `<b>${weekLabel}</b><br/>` +
            (Number.isNaN(v2026) ? `<i style="color:rgba(255,255,255,0.5)">${noData}</i><br/>`
              : `${cases2026} <b style="color:${CYAN}">${v2026}</b><br/>`) +
            `${expected} ${Math.round(ec.p50[i])}<br/>` +
            `${threshold} ${Math.round(ec.p75[i])}`;
        },
      },
      legend: { data: [labelSuccess, labelSecurity, labelEpidemic, label2026], textStyle: { color: AXIS }, top: 0, right: 0 },
      grid: { ...baseGrid, top: 36 },
      xAxis: {
        type: 'category', data: ec.weeks,
        name: lang === 'es' ? 'Semana epidemiológica' : 'Epidemiological week',
        nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: AXIS }, ...axisCommon
      },
      yAxis: {
        type: 'value',
        name: lang === 'es' ? 'Casos' : 'Cases',
        nameTextStyle: { color: AXIS }, ...axisCommon
      },
      series: [
        { name: labelSuccess, type: 'line', data: ec.p25, stack: 'band', lineStyle: { opacity: 0 }, showSymbol: false, areaStyle: { color: 'rgba(34,197,94,0.30)' } },
        { name: labelSecurity, type: 'line', data: ec.p75.map((v, i) => v - ec.p25[i]), stack: 'band', lineStyle: { opacity: 0 }, showSymbol: false, areaStyle: { color: 'rgba(234,179,8,0.26)' } },
        { name: labelEpidemic, type: 'line', data: ec.p75.map((v) => ceil - v), stack: 'band', lineStyle: { opacity: 0 }, showSymbol: false, areaStyle: { color: 'rgba(239,68,68,0.22)' } },
        { name: 'p25', type: 'line', data: ec.p25, showSymbol: false, smooth: true, silent: true,
          lineStyle: { color: '#22e07a', width: 1.6, shadowColor: 'rgba(34,224,122,0.9)', shadowBlur: 7 }, z: 4 },
        { name: 'p50', type: 'line', data: ec.p50, showSymbol: false, smooth: true, silent: true,
          lineStyle: { color: 'rgba(255,255,255,0.5)', width: 1, type: 'dashed' }, z: 4 },
        { name: 'p75', type: 'line', data: ec.p75, showSymbol: false, smooth: true, silent: true,
          lineStyle: { color: '#ff5a36', width: 1.9, shadowColor: 'rgba(255,90,54,0.95)', shadowBlur: 8 }, z: 5 },
        { name: label2026, type: 'line', data: line2026, showSymbol: false, smooth: true, connectNulls: false,
          lineStyle: { color: CYAN, width: 3.2, shadowColor: 'rgba(0,240,255,0.95)', shadowBlur: 11 }, z: 6 },
      ],
    };

    const yearly = casesByYear(data.rows, meta.years);
    const trendYears: (number | string)[] = [...meta.years, 2026];
    const trendData = [
      ...yearly.map((v) => ({ value: v, itemStyle: { color: 'rgba(0,240,255,0.55)', borderRadius: [4, 4, 0, 0] as number[] } })),
      { value: vig2026?.total ?? 0, itemStyle: { color: AMBER, borderRadius: [4, 4, 0, 0] as number[] } },
    ];
    const trend: EChartsOption = {
      tooltip: {
        trigger: 'axis', ...tooltipStyle,
        formatter: (params: unknown) => {
          const a = (params as Array<{ axisValue: string; value: number; dataIndex: number }>)[0];
          const parcial = a.dataIndex === meta.years.length
            ? (lang === 'es' ? ` (parcial, a sem. ${vig2026?.lastWeek ?? '—'})` : ` (partial, thru week ${vig2026?.lastWeek ?? '—'})`)
            : '';
          const casesText = lang === 'es' ? 'Casos:' : 'Cases:';
          return `<b>${a.axisValue}</b>${parcial}<br/>${casesText} <b>${a.value}</b>`;
        },
      },
      grid: baseGrid,
      xAxis: { type: 'category', data: trendYears, ...axisCommon },
      yAxis: { type: 'value', ...axisCommon },
      series: [{ type: 'bar', data: trendData, barWidth: '55%' }],
    };

    const { f, m } = ageBySex(rows, meta.dicts.edad.length, fIdx, mIdx);
    const femaleLabel = lang === 'es' ? 'Femenino' : 'Female';
    const maleLabel = lang === 'es' ? 'Masculino' : 'Male';
    const pyramid: EChartsOption = {
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' }, ...tooltipStyle,
        formatter: (params: unknown) => {
          const arr = params as Array<{ axisValue: string; value: number; seriesName: string }>;
          return `<b>${arr[0]?.axisValue}</b><br/>` +
            arr.map((p) => `${p.seriesName}: <b>${Math.abs(p.value)}</b>`).join('<br/>');
        },
      },
      legend: { data: [femaleLabel, maleLabel], textStyle: { color: AXIS }, top: 0 },
      grid: { ...baseGrid, top: 30, left: 60 },
      xAxis: { type: 'value', axisLabel: { color: AXIS, fontSize: 11, formatter: (v: number) => `${Math.abs(v)}` }, axisLine: { lineStyle: { color: AXIS_LINE } }, splitLine: { lineStyle: { color: SPLIT } } },
      yAxis: { type: 'category', data: meta.dicts.edad, axisLine: { lineStyle: { color: AXIS_LINE } }, axisLabel: { color: AXIS, fontSize: 11 } },
      series: [
        { name: femaleLabel, type: 'bar', stack: 'sex', data: f.map((v) => -v), itemStyle: { color: '#b300ff', borderRadius: [0, 3, 3, 0] } },
        { name: maleLabel, type: 'bar', stack: 'sex', data: m, itemStyle: { color: CYAN, borderRadius: [0, 3, 3, 0] } },
      ],
    };

    const sev = countByDict(rows, COL.severidad, meta.dicts.severidad.length);
    const sevColors = ['#22c55e', '#eab308', '#ef4444', 'rgba(255,255,255,0.25)'];
    const severity: EChartsOption = {
      tooltip: { trigger: 'item', ...tooltipStyle, formatter: '{b}: <b>{c}</b> ({d}%)' },
      legend: { bottom: 0, textStyle: { color: AXIS, fontSize: 11 }, type: 'scroll' },
      series: [{
        type: 'pie', radius: ['45%', '70%'], center: ['50%', '44%'], avoidLabelOverlap: true,
        itemStyle: { borderColor: '#0b0f19', borderWidth: 2 },
        label: { color: '#fff', fontSize: 11 },
        data: meta.dicts.severidad.map((name, i) => {
          let label = name;
          if (lang === 'en') {
            if (name === 'Grave') label = 'Severe';
            else if (name === 'Con signos de alarma') label = 'With warning signs';
            else if (name === 'Sin signos de alarma') label = 'Without warning signs';
          }
          return { name: label, value: sev[i], itemStyle: { color: sevColors[i % sevColors.length] } };
        }),
      }],
    };

    const estr = countByDict(rows, COL.estrato, meta.dicts.estrato.length);
    const estrato: EChartsOption = {
      tooltip: { trigger: 'axis', ...tooltipStyle },
      grid: baseGrid,
      xAxis: { type: 'category', data: meta.dicts.estrato, ...axisCommon },
      yAxis: { type: 'value', ...axisCommon },
      series: [{ type: 'bar', data: estr, barWidth: '55%', itemStyle: { color: '#eab308', borderRadius: [4, 4, 0, 0] } }],
    };

    const reg = countByDict(rows, COL.regimen, meta.dicts.regimen.length);
    const regPairs = reg.map((v, i) => [v, i] as [number, number]).filter(([v]) => v > 0).sort((a, b) => a[0] - b[0]);
    const totalReg = rows.length || 1;
    const regimen: EChartsOption = {
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' }, ...tooltipStyle,
        formatter: (p: unknown) => { const a = (p as Array<{ name: string; value: number }>)[0]; return `${a.name}: <b>${a.value}</b> (${((a.value / totalReg) * 100).toFixed(1)}%)`; },
      },
      grid: { ...baseGrid, left: 110, right: 30 },
      xAxis: { type: 'value', axisLabel: { color: AXIS, fontSize: 11 }, axisLine: { lineStyle: { color: AXIS_LINE } }, splitLine: { lineStyle: { color: SPLIT } } },
      yAxis: { type: 'category', data: regPairs.map(([, i]) => meta.dicts.regimen[i]), axisLine: { lineStyle: { color: AXIS_LINE } }, axisLabel: { color: AXIS, fontSize: 11 } },
      series: [{ type: 'bar', data: regPairs.map(([v]) => v), barWidth: '60%', itemStyle: { color: '#22d3ee', borderRadius: [0, 3, 3, 0] } }],
    };

    const prev = symptomPrevalence(rows, meta.symptoms.length);
    const order = prev.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).slice(-12);
    const total = rows.length || 1;
    const symptoms: EChartsOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...tooltipStyle, formatter: (p: unknown) => { const a = (p as Array<{ name: string; value: number }>)[0]; return `${a.name}: <b>${((a.value / total) * 100).toFixed(1)}%</b>`; } },
      grid: { ...baseGrid, left: 130, right: 30 },
      xAxis: { type: 'value', max: 100, axisLabel: { color: AXIS, fontSize: 11, formatter: '{value}%' }, axisLine: { lineStyle: { color: AXIS_LINE } }, splitLine: { lineStyle: { color: SPLIT } } },
      yAxis: { type: 'category', data: order.map(([, i]) => meta.symptoms[i]), axisLine: { lineStyle: { color: AXIS_LINE } }, axisLabel: { color: AXIS, fontSize: 11 } },
      series: [{ type: 'bar', data: order.map(([v]) => +((v / total) * 100).toFixed(1)), barWidth: '60%', itemStyle: { color: CYAN, borderRadius: [0, 3, 3, 0] } }],
    };

    return { kpis, options: { endemic, trend, pyramid, severity, estrato, regimen, symptoms } };
  }, [data, rows, filters, bga2026, vig2026, lang]);

  if (error) return <div className={styles.state}>{lang === 'es' ? `Error cargando datos: ${error}` : `Error loading data: ${error}`}</div>;
  if (!data || !charts) return <div className={styles.state}>{lang === 'es' ? 'Cargando datos del SIVIGILA…' : 'Loading SIVIGILA data…'}</div>;

  const { kpis, options } = charts;
  const locale = lang === 'es' ? 'es-CO' : 'en-US';

  return (
    <div className={styles.dashboard}>
      {/* ===== SECCIÓN 2026 · Vigilancia en curso (boletín INS) ===== */}
      <SectionHeader
        eyebrow={t.dashboard.section1Eyebrow}
        title={t.dashboard.section1Title}
        note={t.dashboard.section1Note}
      />

      {vig2026 && (
        <div className={styles.kpiRow2026}>
          <Stat2026
            value={vig2026.total.toLocaleString(locale)}
            label={t.dashboard.statAcum.replace('{sem}', String(vig2026.lastWeek))}
          />
          <Stat2026
            value={vig2026.ultima.toLocaleString(locale)}
            label={t.dashboard.statWeek.replace('{sem}', String(vig2026.lastWeek))}
          />
          <Stat2026
            value={`${vig2026.pct2024.toFixed(0)}%`}
            label={t.dashboard.statRatio}
            color={vig2026.pct2024 >= 100 ? '#ef4444' : '#22c55e'}
          />
        </div>
      )}

      <div className={styles.chartGrid}>
        <Panel
          title={t.dashboard.panelEndemicTitle}
          subtitle={t.dashboard.panelEndemicSub}
          span={2}
          tag={t.dashboard.panelEndemicTag}
        >
          <EChart option={options.endemic} height={360} />
        </Panel>

        <Panel
          title={t.dashboard.panelTrendTitle}
          subtitle={t.dashboard.panelTrendSub}
          span={2}
          tag={t.dashboard.panelEndemicTag}
        >
          <EChart option={options.trend} />
        </Panel>
      </div>

      {/* ===== SECCIÓN 2015–2025 · Perfil epidemiológico (SIVIGILA individual) ===== */}
      <SectionHeader
        eyebrow={t.dashboard.section2Eyebrow}
        title={t.dashboard.section2Title}
        note={t.dashboard.section2Note}
      />

      <FilterBar meta={data.meta} filters={filters} onChange={setFilters} />
      <KpiCards kpis={kpis} />

      <div className={styles.chartGrid}>
        <Panel title={t.dashboard.panelClimateTitle} subtitle={t.dashboard.panelClimateSub} span={2}>
          <ClimatePanel rows={rows} />
        </Panel>

        <Panel title={t.dashboard.panelPyramidTitle} subtitle={t.dashboard.panelPyramidSub}>
          <EChart option={options.pyramid} height={360} />
        </Panel>

        <Panel title={t.dashboard.panelSeverityTitle} subtitle={t.dashboard.panelSeveritySub}>
          <EChart option={options.severity} />
        </Panel>

        <Panel title={t.dashboard.panelEstratoTitle} subtitle={t.dashboard.panelEstratoSub}>
          <EChart option={options.estrato} />
        </Panel>

        <Panel title={t.dashboard.panelRegimenTitle} subtitle={t.dashboard.panelRegimenSub}>
          <EChart option={options.regimen} />
        </Panel>

        <Panel title={t.dashboard.panelSymptomsTitle} subtitle={t.dashboard.panelSymptomsSub} span={2}>
          <EChart option={options.symptoms} height={360} />
        </Panel>
      </div>

      <GeoMaps />
    </div>
  );
};

const SectionHeader: React.FC<{ eyebrow: string; title: string; note: string }> = ({ eyebrow, title, note }) => (
  <div style={{ margin: '8px 0 4px', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
    <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: CYAN, fontWeight: 700 }}>{eyebrow}</div>
    <h2 style={{ margin: '2px 0 6px', fontSize: 22, color: '#fff' }}>{title}</h2>
    <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.55)', maxWidth: 880 }}>{note}</p>
  </div>
);

const Stat2026: React.FC<{ value: string; label: string; color?: string }> = ({ value, label, color }) => (
  <div className={styles.panel} style={{ padding: '14px 16px', flex: '1 1 160px', minWidth: 160 }}>
    <div style={{ fontSize: 26, fontWeight: 700, color: color ?? CYAN, lineHeight: 1.05 }}>{value}</div>
    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{label}</div>
  </div>
);

const Panel: React.FC<{ title: string; subtitle: string; span?: number; tag?: string; children: React.ReactNode }> = ({ title, subtitle, span = 1, tag, children }) => (
  <div className={styles.panel} style={{ gridColumn: span === 2 ? 'span 2' : undefined }}>
    <div className={styles.panelHead}>
      <h3>{title}</h3>
      <span>{subtitle}</span>
    </div>
    {tag && (
      <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 600,
        color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 999, padding: '2px 8px' }}>{tag}</span>
    )}
    {children}
  </div>
);

export default DashboardView;
