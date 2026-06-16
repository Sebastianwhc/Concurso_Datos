import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import type { DengueMeta, Filters } from '../dengue';
import styles from '../DashboardView.module.css';

interface Props {
  meta: DengueMeta;
  filters: Filters;
  onChange: (f: Filters) => void;
}

/** Alterna un índice dentro de un Set de filtro. */
function toggle(set: Set<number>, idx: number): Set<number> {
  const next = new Set(set);
  if (next.has(idx)) next.delete(idx);
  else next.add(idx);
  return next;
}

const FilterBar: React.FC<Props> = ({ meta, filters, onChange }) => {
  const chip = (active: boolean) =>
    `${styles.chip} ${active ? styles.chipActive : ''}`;

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterHeader}>
        <Filter size={16} />
        <span>Filtros</span>
        <button
          className={styles.resetBtn}
          onClick={() => onChange({ ...filters, sexo: new Set(), severidad: new Set(), estrato: new Set(), hosp: 'all', anio: 'all' })}
        >
          <RotateCcw size={13} /> Limpiar
        </button>
      </div>

      <div className={styles.filterRow}>
        <span className={styles.filterLabel}>Año</span>
        <div className={styles.chips}>
          <button className={chip(filters.anio === 'all')} onClick={() => onChange({ ...filters, anio: 'all' })}>Todos</button>
          {meta.years.map((y) => (
            <button key={y} className={chip(filters.anio === y)} onClick={() => onChange({ ...filters, anio: y })}>{y}</button>
          ))}
        </div>
      </div>

      <div className={styles.filterRow}>
        <span className={styles.filterLabel}>Sexo</span>
        <div className={styles.chips}>
          {meta.dicts.sexo.map((label, i) => (
            <button key={label} className={chip(filters.sexo.has(i))} onClick={() => onChange({ ...filters, sexo: toggle(filters.sexo, i) })}>
              {label === 'F' ? 'Femenino' : 'Masculino'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterRow}>
        <span className={styles.filterLabel}>Severidad</span>
        <div className={styles.chips}>
          {meta.dicts.severidad.map((label, i) => (
            <button key={label} className={chip(filters.severidad.has(i))} onClick={() => onChange({ ...filters, severidad: toggle(filters.severidad, i) })}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterRow}>
        <span className={styles.filterLabel}>Estrato</span>
        <div className={styles.chips}>
          {meta.dicts.estrato.map((label, i) => (
            <button key={label} className={chip(filters.estrato.has(i))} onClick={() => onChange({ ...filters, estrato: toggle(filters.estrato, i) })}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterRow}>
        <span className={styles.filterLabel}>Hospitalización</span>
        <div className={styles.chips}>
          {([['all', 'Todos'], ['yes', 'Hospitalizado'], ['no', 'Ambulatorio']] as const).map(([val, label]) => (
            <button key={val} className={chip(filters.hosp === val)} onClick={() => onChange({ ...filters, hosp: val })}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
