import React from 'react';
import { Activity, BedDouble, AlertTriangle, HeartPulse } from 'lucide-react';
import type { Kpis } from '../dengue';
import { useT } from '../../../i18n/useT';
import styles from '../DashboardView.module.css';

const KpiCards: React.FC<{ kpis: Kpis }> = ({ kpis }) => {
  const { t, lang } = useT();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const fmt = (n: number) => n.toLocaleString(locale);

  const cards = [
    {
      icon: <Activity size={22} />, color: 'var(--accent-cyan)',
      label: t.dashboard.kpis.total, value: fmt(kpis.total), sub: t.dashboard.kpis.totalSub,
    },
    {
      icon: <BedDouble size={22} />, color: '#eab308',
      label: t.dashboard.kpis.hosp, value: fmt(kpis.hosp),
      sub: t.dashboard.kpis.hospSub.replace('{pct}', kpis.hospPct.toFixed(1)),
    },
    {
      icon: <AlertTriangle size={22} />, color: 'var(--accent-orange)',
      label: t.dashboard.kpis.grave, value: fmt(kpis.graves),
      sub: t.dashboard.kpis.graveSub.replace('{pct}', (kpis.total ? ((kpis.graves / kpis.total) * 100).toFixed(1) : '0')),
    },
    {
      icon: <HeartPulse size={22} />, color: '#ef4444',
      label: t.dashboard.kpis.deaths, value: fmt(kpis.fallecidos),
      sub: t.dashboard.kpis.deathsSub.replace('{pct}', kpis.letalidad.toFixed(2)),
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
