import React, { useEffect, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { History, CheckCircle2 } from 'lucide-react';
import EChart from '../dashboard/components/EChart';
import styles from './SimulatorView.module.css';

/**
 * Backtest del brote 2024 — la prueba de credibilidad del simulador.
 *
 * Muestra que el modelo, anclado a inicios de 2024 (ciego de ahí en adelante) y
 * alimentado con el clima REAL de 2024, proyectó la trayectoria ascendente del brote
 * que de verdad ocurrió. Datos calculados offline en scripts/build_backtest_2024.py
 * (mismo ONNX, ingeniería de features idéntica al entrenamiento).
 *
 * Si backtest_2024.json no está, el componente no se renderiza.
 */
interface Backtest {
  ancla: { anio: number; semana: number };
  horizonte: number;
  ciudad: string;
  weeks: number[];
  real: number[];
  forecast: (number | null)[];
  metrics: {
    backtest_mae: number;
    modelo: { R2: number; MAE: number };
    baseline: { R2: number };
    fraccion_2026_error_pct: number | null;
  };
}

const baseTooltip = {
  backgroundColor: 'rgba(16,22,35,0.95)',
  borderColor: 'rgba(255,255,255,0.1)',
  textStyle: { color: '#fff', fontSize: 12 },
};

const Backtest2024: React.FC = () => {
  const [bt, setBt] = useState<Backtest | null>(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    let active = true;
    fetch(`${base}data/backtest_2024.json`)
      .then((r) => r.json())
      .then((d) => { if (active) setBt(d as Backtest); })
      .catch(() => { /* sin backtest: no se renderiza */ });
    return () => { active = false; };
  }, []);

  const option = useMemo<EChartsOption | null>(() => {
    if (!bt) return null;
    const anchorIdx = bt.weeks.indexOf(bt.ancla.semana);
    return {
      tooltip: {
        trigger: 'axis', ...baseTooltip,
        formatter: (params: unknown) => {
          const arr = params as Array<{ axisValue: string; seriesName: string; value: number | null }>;
          const head = `<b>Sem. ${arr[0]?.axisValue} · 2024</b>`;
          const body = arr.filter((p) => p.value != null)
            .map((p) => `${p.seriesName}: <b>${Math.round(p.value as number)}</b>`).join('<br/>');
          return `${head}<br/>${body}`;
        },
      },
      legend: { top: 0, right: 0, data: ['Real (SIVIGILA)', 'Modelo (proyección)'],
        textStyle: { color: 'rgba(255,255,255,0.85)', fontSize: 11 }, itemWidth: 16, itemHeight: 8 },
      grid: { left: 8, right: 12, top: 28, bottom: 6, containLabel: true },
      xAxis: { type: 'category', name: 'Sem. epi. 2024', nameTextStyle: { color: 'rgba(255,255,255,0.9)' },
        data: bt.weeks,
        axisLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 10, interval: 1 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.45)' } } },
      yAxis: { type: 'value', name: 'casos/sem', nameTextStyle: { color: 'rgba(255,255,255,0.9)' },
        axisLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
      series: [
        { name: 'Real (SIVIGILA)', type: 'line', smooth: true, symbol: 'none', data: bt.real,
          lineStyle: { color: '#ffffff', width: 2.5 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255,255,255,0.16)' }, { offset: 1, color: 'rgba(255,255,255,0.01)' }]) } },
        { name: 'Modelo (proyección)', type: 'line', smooth: true, symbol: 'none', connectNulls: false, data: bt.forecast,
          lineStyle: { color: '#00f0ff', width: 3, type: 'dashed', shadowColor: 'rgba(0,240,255,0.85)', shadowBlur: 9 },
          markLine: { silent: true, symbol: 'none',
            data: [{ xAxis: anchorIdx }],
            lineStyle: { color: 'rgba(255,255,255,0.4)', type: 'dotted', width: 1.5 },
            label: { formatter: 'modelo ciego →', color: 'rgba(255,255,255,0.65)', fontSize: 10, position: 'insideEndTop' } } },
      ],
    };
  }, [bt]);

  if (!bt || !option) return null;
  const m = bt.metrics;

  return (
    <div className={styles.panel} style={{ marginTop: 18 }}>
      <div className={styles.panelHead}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={16} /> ¿Por qué confiar? · Backtest del brote 2024
        </h3>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>pronóstico vs. realidad · Bucaramanga</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'stretch' }}>
        <div style={{ flex: '1 1 380px', minWidth: 300 }}>
          <EChart option={option} height={270} />
        </div>

        {/* Tarjeta de métricas de validación */}
        <div style={{ flex: '1 1 200px', minWidth: 200, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', gap: 12, padding: '4px 4px 4px 8px',
          borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          <Metric value={`+${m.modelo.R2.toFixed(2)}`} label="R² · validación en el brote 2024–25" good />
          <Metric value={m.modelo.MAE.toFixed(2)} label="MAE (casos/sem, 1 paso)" />
          <Metric value={m.baseline.R2.toFixed(2)} label="R² del baseline climatológico" bad />
          <Metric value={`${m.backtest_mae.toFixed(0)}`} label="MAE de esta proyección (16 sem recursivas)" />
          {m.fraccion_2026_error_pct != null && (
            <Metric value={`${Math.abs(m.fraccion_2026_error_pct).toFixed(0)}%`} label="error al reproducir Bucaramanga real 2026" />
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12,
        padding: '8px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.08)',
        border: '1px solid rgba(34,197,94,0.25)' }}>
        <CheckCircle2 size={15} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 11.5, lineHeight: 1.45, color: 'rgba(255,255,255,0.78)' }}>
          Alimentado <b>solo con datos hasta la semana {bt.ancla.semana} de 2024</b> y el clima real, el modelo
          proyectó la <b>trayectoria ascendente del brote</b> que realmente ocurrió. Es conservador (subestima
          algo el pico), pero <b>acierta la dirección y la magnitud</b> — justo lo que necesita un sistema de alerta temprana.
        </span>
      </div>
    </div>
  );
};

const Metric: React.FC<{ value: string; label: string; good?: boolean; bad?: boolean }> = ({ value, label, good, bad }) => (
  <div>
    <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.05,
      color: good ? '#22c55e' : bad ? '#ef4444' : '#00f0ff' }}>{value}</div>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{label}</div>
  </div>
);

export default Backtest2024;
