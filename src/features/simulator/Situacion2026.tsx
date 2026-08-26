import React, { useEffect, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { CheckCircle2, Activity } from 'lucide-react';
import EChart from '../dashboard/components/EChart';
import type { Comuna, ForecastResult } from './forecast';
import { useT } from '../../i18n/useT';
import styles from './SimulatorView.module.css';

interface SeriePunto { anio: number; semana: number; casos: number; }
interface Nowcast {
  ancla: { anio: number; semana: number };
  calibracion: {
    f_bga: number; f_bga_validacion_2026: number; f_bga_error_pct_2026: number; f_florida: number;
  };
  series: { santander: SeriePunto[]; bucaramanga_real: SeriePunto[] };
}

const baseTooltip = {
  backgroundColor: 'rgba(16,22,35,0.95)',
  borderColor: 'rgba(255,255,255,0.1)',
  textStyle: { color: '#fff', fontSize: 12 },
};

interface Props {
  forecast: ForecastResult | null;
  comunas: Comuna[];
}

const Situacion2026: React.FC<Props> = ({ forecast, comunas }) => {
  const { lang } = useT();
  const [nc, setNc] = useState<Nowcast | null>(null);
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const fmt = (n: number) => Math.round(n).toLocaleString(locale);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    let active = true;
    fetch(`${base}data/nowcast_2026.json`)
      .then((r) => r.json())
      .then((d) => { if (active) setNc(d as Nowcast); })
      .catch(() => { /* sin nowcast */ });
    return () => { active = false; };
  }, []);

  const data = useMemo(() => {
    if (!nc) return null;
    const san = nc.series.santander;
    const byYear = (y: number) => {
      const arr: (number | null)[] = new Array(53).fill(null);
      san.filter((p) => p.anio === y).forEach((p) => { arr[p.semana - 1] = Math.round(p.casos); });
      return arr;
    };
    const sum = (y: number, hasta = 53) =>
      san.filter((p) => p.anio === y && p.semana <= hasta).reduce((a, p) => a + p.casos, 0);

    const ult = san.filter((p) => p.anio === 2026).slice(-1)[0];
    const sUlt = ult?.semana ?? nc.ancla.semana;
    const acum2026 = sum(2026);
    const acum2024Comp = sum(2024, sUlt);
    const ratio = acum2024Comp ? acum2026 / acum2024Comp : 0;

    const pronostico: (number | null)[] = new Array(53).fill(null);
    if (forecast && comunas.length && nc.calibracion.f_bga > 0) {
      const boundaryIdx = sUlt - 1;
      pronostico[boundaryIdx] = ult?.casos ?? null;
      const bgaIds = comunas.filter((c) => c.municipio === 'Bucaramanga').map((c) => c.id);
      for (let i = 0; i < forecast.horizonte; i++) {
        const idx = boundaryIdx + 1 + i;
        if (idx >= 53) break;
        const bgaCasos = bgaIds.reduce((s, id) => s + (forecast.porComuna[id]?.[i] ?? 0), 0);
        pronostico[idx] = Math.round(bgaCasos / nc.calibracion.f_bga);
      }
    }

    const label2024 = lang === 'es' ? '2024 (brote)' : '2024 (outbreak)';
    const label2026Forecast = lang === 'es' ? '2026 (pronóstico)' : '2026 (forecast)';
    const casesPerWeek = lang === 'es' ? 'casos/sem' : 'cases/wk';
    const epiWeek = lang === 'es' ? 'Sem. epi.' : 'Epi. week';

    const option: EChartsOption = {
      tooltip: { trigger: 'axis', ...baseTooltip,
        axisPointer: { type: 'line', lineStyle: { color: 'rgba(255,255,255,0.2)' } } },
      legend: { top: 0, right: 0, textStyle: { color: 'rgba(255,255,255,0.85)', fontSize: 11 },
        itemWidth: 14, itemHeight: 8 },
      grid: { left: 8, right: 12, top: 28, bottom: 6, containLabel: true },
      xAxis: { type: 'category', name: epiWeek, nameTextStyle: { color: 'rgba(255,255,255,0.9)' },
        data: Array.from({ length: 53 }, (_, i) => i + 1),
        axisLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 10, interval: 4 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.45)' } } },
      yAxis: { type: 'value', name: casesPerWeek, nameTextStyle: { color: 'rgba(255,255,255,0.9)' },
        axisLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
      series: [
        { name: label2024, type: 'line', smooth: true, symbol: 'none', data: byYear(2024),
          lineStyle: { color: '#f97316', width: 1.5, opacity: 0.65 } },
        { name: '2025', type: 'line', smooth: true, symbol: 'none', data: byYear(2025),
          lineStyle: { color: 'rgba(255,255,255,0.45)', width: 1.5, type: 'dashed' } },
        { name: '2026', type: 'line', smooth: true, symbol: 'none', data: byYear(2026),
          lineStyle: { color: '#00f0ff', width: 3 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0,240,255,0.30)' }, { offset: 1, color: 'rgba(0,240,255,0.02)' }]) } },
        { name: label2026Forecast, type: 'line', smooth: true, symbol: 'none', connectNulls: false,
          data: pronostico,
          lineStyle: { color: '#00f0ff', width: 2.5, type: 'dashed' } },
      ],
    };
    return { option, acum2026, ult, sUlt, ratio };
  }, [nc, forecast, comunas, lang]);

  if (!nc || !data) return null;
  const errAbs = Math.abs(nc.calibracion.f_bga_error_pct_2026);

  return (
    <div className={styles.panel} style={{ marginBottom: 18 }}>
      <div className={styles.panelHead}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} /> {lang === 'es' ? 'Situación 2026 · Santander' : '2026 Situation · Santander'}
        </h3>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          {lang === 'es' ? 'dato real · boletín epidemiológico INS' : 'actual data · INS epidemiological bulletin'}
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '6px 0 12px' }}>
        <Kpi
          val={fmt(data.acum2026)}
          lbl={lang === 'es' ? `acumulado 2026 (a sem. ${data.sUlt})` : `2026 total (thru week ${data.sUlt})`}
        />
        <Kpi
          val={fmt(data.ult?.casos ?? 0)}
          lbl={lang === 'es' ? `casos en la sem. ${data.sUlt}` : `cases in week ${data.sUlt}`}
        />
        <Kpi
          val={`${(data.ratio * 100).toFixed(0)}%`}
          lbl={lang === 'es' ? 'del nivel de 2024 (brote) a la misma semana' : 'of 2024 outbreak level at same week'}
          color={data.ratio >= 1 ? '#ef4444' : '#22c55e'}
        />
      </div>

      <EChart option={data.option} height={240} />

      {/* Validación del método */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10,
        padding: '8px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.08)',
        border: '1px solid rgba(34,197,94,0.25)' }}>
        <CheckCircle2 size={15} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 11.5, lineHeight: 1.45, color: 'rgba(255,255,255,0.75)' }}>
          {lang === 'es' ? (
            <>
              <b>Método validado:</b> la fracción Bucaramanga/Santander calibrada con 2024–2025
              reproduce el Bucaramanga <b>real</b> de 2026 con un error de solo <b>{errAbs.toFixed(0)}%</b>.
              Por eso el simulador se re-ancla con confianza en <b>2026-S{nc.ancla.semana}</b>.
              {' '}<span style={{ color: 'rgba(255,255,255,0.5)' }}>
                Frontera: real (Bucaramanga) · estimado (Floridablanca, vía fracción) · pronóstico (de aquí en adelante).
              </span>
            </>
          ) : (
            <>
              <b>Validated Method:</b> the Bucaramanga/Santander ratio calibrated with 2024–2025
              reproduces <b>real</b> 2026 Bucaramanga cases with an error of only <b>{errAbs.toFixed(0)}%</b>.
              The simulator confidently anchors at <b>2026-W{nc.ancla.semana}</b>.
              {' '}<span style={{ color: 'rgba(255,255,255,0.5)' }}>
                Boundary: actual (Bucaramanga) · estimated (Floridablanca, via ratio) · forecast (ahead).
              </span>
            </>
          )}
        </span>
      </div>
    </div>
  );
};

const Kpi: React.FC<{ val: string; lbl: string; color?: string }> = ({ val, lbl, color }) => (
  <div style={{ flex: '1 1 120px', minWidth: 120 }}>
    <div style={{ fontSize: 22, fontWeight: 700, color: color ?? '#00f0ff', lineHeight: 1.1 }}>{val}</div>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{lbl}</div>
  </div>
);

export default Situacion2026;
