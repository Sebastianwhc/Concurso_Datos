import React, { useEffect, useRef, useState } from 'react';
import { Filter, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { emptyFilters, type DengueMeta, type Filters } from '../dengue';
import styles from '../DashboardView.module.css';

interface Props {
  meta: DengueMeta;
  filters: Filters;
  onChange: (f: Filters) => void;
}

interface Opt { value: number; label: string; }

const Dropdown: React.FC<{
  id: string;
  label: string;
  opts: Opt[];
  selected: Set<number>;
  openKey: string | null;
  setOpenKey: (k: string | null) => void;
  onToggle: (v: number) => void;
  onClear: () => void;
}> = ({ id, label, opts, selected, openKey, setOpenKey, onToggle, onClear }) => {
  const open = openKey === id;
  const summary =
    selected.size === 0 ? 'Todos'
      : selected.size === 1 ? opts.find((o) => selected.has(o.value))?.label ?? '1'
        : `${selected.size} seleccionados`;

  return (
    <div className={styles.fdrop}>
      <button
        type="button"
        className={`${styles.fdropBtn} ${selected.size ? styles.fdropActive : ''}`}
        onClick={() => setOpenKey(open ? null : id)}
      >
        <span className={styles.fdropText}>
          <span className={styles.fdropLabel}>{label}</span>
          <span className={styles.fdropValue}>{summary}</span>
        </span>
        <ChevronDown size={15} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {open && (
        <div className={styles.fdropPanel}>
          <div className={styles.fdropPanelHead}>
            <span>{label}</span>
            {selected.size > 0 && <button type="button" onClick={onClear}>Limpiar</button>}
          </div>
          <div className={styles.fdropList}>
            {opts.map((o) => {
              const on = selected.has(o.value);
              return (
                <button type="button" key={o.value} className={styles.fdropItem} onClick={() => onToggle(o.value)}>
                  <span className={`${styles.checkbox} ${on ? styles.checkboxOn : ''}`}>
                    {on && <Check size={12} strokeWidth={3} />}
                  </span>
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const FilterBar: React.FC<Props> = ({ meta, filters, onChange }) => {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenKey(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toggleIn = (key: keyof Filters, v: number) => {
    const set = new Set(filters[key]);
    if (set.has(v)) set.delete(v); else set.add(v);
    onChange({ ...filters, [key]: set });
  };
  const clear = (key: keyof Filters) => onChange({ ...filters, [key]: new Set<number>() });

  const sexoOpts: Opt[] = meta.dicts.sexo.map((l, i) => ({ value: i, label: l === 'F' ? 'Femenino' : 'Masculino' }));
  const sevOpts: Opt[] = meta.dicts.severidad.map((l, i) => ({ value: i, label: l }));
  const estrOpts: Opt[] = meta.dicts.estrato.map((l, i) => ({ value: i, label: l === 'Sin dato' ? l : `Estrato ${l}` }));
  const anioOpts: Opt[] = meta.years.map((y) => ({ value: y, label: String(y) }));
  const hospOpts: Opt[] = [{ value: 1, label: 'Hospitalizado' }, { value: 0, label: 'Ambulatorio' }];

  const anySelected = filters.anio.size || filters.sexo.size || filters.severidad.size || filters.estrato.size || filters.hosp.size;

  return (
    <div className={styles.filterBar} ref={ref}>
      <div className={styles.filterTitle}>
        <Filter size={16} />
        <span>Filtros</span>
      </div>

      <div className={styles.filterDropdowns}>
        <Dropdown id="anio" label="Año" opts={anioOpts} selected={filters.anio} openKey={openKey} setOpenKey={setOpenKey} onToggle={(v) => toggleIn('anio', v)} onClear={() => clear('anio')} />
        <Dropdown id="sexo" label="Sexo" opts={sexoOpts} selected={filters.sexo} openKey={openKey} setOpenKey={setOpenKey} onToggle={(v) => toggleIn('sexo', v)} onClear={() => clear('sexo')} />
        <Dropdown id="severidad" label="Severidad" opts={sevOpts} selected={filters.severidad} openKey={openKey} setOpenKey={setOpenKey} onToggle={(v) => toggleIn('severidad', v)} onClear={() => clear('severidad')} />
        <Dropdown id="estrato" label="Estrato" opts={estrOpts} selected={filters.estrato} openKey={openKey} setOpenKey={setOpenKey} onToggle={(v) => toggleIn('estrato', v)} onClear={() => clear('estrato')} />
        <Dropdown id="hosp" label="Hospitalización" opts={hospOpts} selected={filters.hosp} openKey={openKey} setOpenKey={setOpenKey} onToggle={(v) => toggleIn('hosp', v)} onClear={() => clear('hosp')} />
      </div>

      {anySelected ? (
        <button className={styles.resetBtn} onClick={() => onChange(emptyFilters())}>
          <RotateCcw size={13} /> Limpiar todo
        </button>
      ) : null}
    </div>
  );
};

export default FilterBar;
