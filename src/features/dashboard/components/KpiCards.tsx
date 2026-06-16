import React from 'react';
import { Activity, BedDouble, AlertTriangle, HeartPulse } from 'lucide-react';
import type { Kpis } from '../dengue';
import styles from '../DashboardView.module.css';

const fmt = (n: number) => n.toLocaleString('es-CO');

const KpiCards: React.FC<{ kpis: Kpis }> = ({ kpis }) => {
  const cards = [
    {
      icon: <Activity size={22} />, color: 'var(--accent-cyan)',
      label: 'Casos totales', value: fmt(kpis.total), sub: 'registros SIVIGILA',
    },
    {
      icon: <BedDouble size={22} />, color: '#eab308',
      label: 'Hospitalizados', value: fmt(kpis.hosp),
      sub: `${kpis.hospPct.toFixed(1)}% del total`,
    },
    {
      icon: <AlertTriangle size={22} />, color: 'var(--accent-orange)',
      label: 'Dengue grave', value: fmt(kpis.graves),
      sub: `${kpis.total ? ((kpis.graves / kpis.total) * 100).toFixed(1) : 0}% del total`,
    },
    {
      icon: <HeartPulse size={22} />, color: '#ef4444',
      label: 'Fallecidos', value: fmt(kpis.fallecidos),
      sub: `letalidad ${kpis.letalidad.toFixed(2)}%`,
    },
  ];

  return (
    <div className={styles.kpiGrid}>
      {cards.map((c) => (
        <div key={c.label} className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ color: c.color, background: `${c.color}1a` }}>
            {c.icon}
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiValue}>{c.value}</span>
            <span className={styles.kpiLabel}>{c.label}</span>
            <span className={styles.kpiSub}>{c.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
