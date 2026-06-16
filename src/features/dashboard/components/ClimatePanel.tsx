import React, { useEffect, useMemo, useState } from 'react';
import type { EChartsOption } from 'echarts';
import EChart from './EChart';
import { COL, type Row } from '../dengue';
import styles from '../DashboardView.module.css';

interface ClimaWeek { anio: number; semana: number; precip: number | null; temp: number | null; humedad: number | null; }

const AXIS = 'rgba(255,255,255,0.35)';
const SPLIT = 'rgba(255,255,255,0.05)';

/** Panel multicausal: casos de dengue vs. clima semanal (lluvia y temperatura). */
const ClimatePanel: React.FC<{ rows: Row[] }> = ({ rows }) => {
  const [clima, setClima] = useState<ClimaWeek[] | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/clima_semanal.json`)
      .then((r) => r.json())
      .then((d) => setClima(d.weekly))
      .catch(() => setClima([]));
  }, []);

  const option = useMemo<EChartsOption | null>(() => {
    if (!clima) return null;
    const cmap = new Map(clima.map((w) => [w.anio * 100 + w.semana, w]));
    const dmap = new Map<number, number>();
    const years = new Set<number>();
    for (const r of rows) {
      if (r[COL.semana] < 1) continue;
      years.add(r[COL.anio]);
      const k = r[COL.anio] * 100 + r[COL.semana];
      dmap.set(k, (dmap.get(k) ?? 0) + 1);
    }
    // Semanas continuas de los años presentes (rellena ceros de dengue)
    const keys = clima
      .filter((w) => years.has(w.anio))
      .map((w) => w.anio * 100 + w.semana)
      .sort((a, b) => a - b);

    const x = keys.map((k) => `${Math.floor(k / 100)}·S${String(k % 100).padStart(2, '0')}`);
    const casos = keys.map((k) => dmap.get(k) ?? 0);
    const precip = keys.map((k) => cmap.get(k)?.precip ?? null);
    const temp = keys.map((k) => cmap.get(k)?.temp ?? null);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(16,22,35,0.95)', borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#fff', fontSize: 12 },
      },
      legend: { data: ['Casos', 'Lluvia (mm)', 'Temp (°C)'], textStyle: { color: AXIS }, top: 0 },
      grid: { left: 50, right: 64, top: 36, bottom: 40 },
      xAxis: {
        type: 'category', data: x, boundaryGap: false,
        axisLine: { lineStyle: { color: SPLIT } }, axisLabel: { color: AXIS, fontSize: 10 },
      },
      yAxis: [
        { type: 'value', name: 'Casos', position: 'left', nameTextStyle: { color: AXIS }, axisLabel: { color: AXIS, fontSize: 10 }, splitLine: { lineStyle: { color: SPLIT } } },
        { type: 'value', name: 'Lluvia', position: 'right', nameTextStyle: { color: AXIS }, axisLabel: { color: AXIS, fontSize: 10 }, splitLine: { show: false } },
        { type: 'value', name: '°C', position: 'right', offset: 46, min: 15, max: 27, nameTextStyle: { color: AXIS }, axisLabel: { color: AXIS, fontSize: 10 }, splitLine: { show: false } },
      ],
      series: [
        { name: 'Casos', type: 'line', data: casos, yAxisIndex: 0, smooth: true, showSymbol: false, areaStyle: { color: 'rgba(0,240,255,0.18)' }, lineStyle: { color: '#00f0ff', width: 1.5 }, z: 3 },
        { name: 'Lluvia (mm)', type: 'bar', data: precip, yAxisIndex: 1, itemStyle: { color: 'rgba(59,130,246,0.45)' } },
        { name: 'Temp (°C)', type: 'line', data: temp, yAxisIndex: 2, smooth: true, showSymbol: false, lineStyle: { color: '#ff6600', width: 1.5, opacity: 0.85 } },
      ],
      dataZoom: x.length > 60 ? [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 6, textStyle: { color: AXIS } }] : undefined,
    };
  }, [clima, rows]);

  if (!option) return <div className={styles.mapLoading} style={{ height: 360 }}>Cargando clima…</div>;
  return <EChart option={option} height={360} />;
};

export default ClimatePanel;
