/**
 * Capa de datos del Dashboard de Dengue.
 * Carga el artefacto columnar (public/data/dengue.json), lo decodifica y
 * expone helpers de filtrado y agregación. Todo corre en el navegador.
 */

// --- Estructura del artefacto exportado por scripts/build_dashboard_data.py ---
export interface DengueMeta {
  total: number;
  years: number[];
  source: string;
  dicts: {
    sexo: string[];
    edad: string[];
    estrato: string[];
    regimen: string[];
    severidad: string[];
    tipo_caso: string[];
  };
  symptoms: string[];
}

export interface DengueRaw {
  meta: DengueMeta;
  columns: string[];
  rows: number[][];
}

// Índices de columna (deben coincidir con el orden en el pipeline)
export const COL = {
  anio: 0, semana: 1, sexo: 2, edad: 3, estrato: 4, regimen: 5,
  severidad: 6, tipo_caso: 7, hosp: 8, fallecido: 9, sintomas: 10,
} as const;

export type Row = number[];

export interface DengueData {
  meta: DengueMeta;
  rows: Row[];
}

export async function loadDengueData(): Promise<DengueData> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/dengue.json`);
  if (!res.ok) throw new Error(`No se pudo cargar dengue.json (${res.status})`);
  const raw = (await res.json()) as DengueRaw;
  return { meta: raw.meta, rows: raw.rows };
}

// --- Filtros ---
export interface Filters {
  anio: number | 'all';
  sexo: Set<number>;       // índices vacíos = todos
  severidad: Set<number>;
  estrato: Set<number>;
  hosp: 'all' | 'yes' | 'no';
}

export const emptyFilters = (): Filters => ({
  anio: 'all',
  sexo: new Set(),
  severidad: new Set(),
  estrato: new Set(),
  hosp: 'all',
});

/** Aplica filtros transversales. `includeYear=false` ignora el filtro de año
 *  (lo usa el canal endémico, que necesita el histórico completo). */
export function applyFilters(rows: Row[], f: Filters, includeYear = true): Row[] {
  return rows.filter((r) => {
    if (includeYear && f.anio !== 'all' && r[COL.anio] !== f.anio) return false;
    if (f.sexo.size && !f.sexo.has(r[COL.sexo])) return false;
    if (f.severidad.size && !f.severidad.has(r[COL.severidad])) return false;
    if (f.estrato.size && !f.estrato.has(r[COL.estrato])) return false;
    if (f.hosp === 'yes' && r[COL.hosp] !== 1) return false;
    if (f.hosp === 'no' && r[COL.hosp] !== 0) return false;
    return true;
  });
}

// --- Agregaciones ---
export interface Kpis {
  total: number;
  hosp: number;
  hospPct: number;
  graves: number;
  fallecidos: number;
  letalidad: number;
}

export function computeKpis(rows: Row[], gravesIndex: number): Kpis {
  const total = rows.length;
  let hosp = 0, graves = 0, fall = 0;
  for (const r of rows) {
    if (r[COL.hosp] === 1) hosp++;
    if (r[COL.severidad] === gravesIndex) graves++;
    if (r[COL.fallecido] === 1) fall++;
  }
  return {
    total,
    hosp,
    hospPct: total ? (hosp / total) * 100 : 0,
    graves,
    fallecidos: fall,
    letalidad: total ? (fall / total) * 100 : 0,
  };
}

/** Conteo por una columna categórica, alineado con el diccionario. */
export function countByDict(rows: Row[], colIndex: number, dictLen: number): number[] {
  const out = new Array(dictLen).fill(0);
  for (const r of rows) {
    const v = r[colIndex];
    if (v >= 0 && v < dictLen) out[v]++;
  }
  return out;
}

/** Pirámide edad × sexo. Devuelve conteos por grupo de edad para F y M. */
export function ageBySex(rows: Row[], edadLen: number, fIdx: number, mIdx: number) {
  const f = new Array(edadLen).fill(0);
  const m = new Array(edadLen).fill(0);
  for (const r of rows) {
    const e = r[COL.edad];
    if (e < 0 || e >= edadLen) continue;
    if (r[COL.sexo] === fIdx) f[e]++;
    else if (r[COL.sexo] === mIdx) m[e]++;
  }
  return { f, m };
}

/** Casos por año (ignora el filtro de año). */
export function casesByYear(rows: Row[], years: number[]): number[] {
  const idx = new Map(years.map((y, i) => [y, i]));
  const out = new Array(years.length).fill(0);
  for (const r of rows) {
    const i = idx.get(r[COL.anio]);
    if (i !== undefined) out[i]++;
  }
  return out;
}

/** Prevalencia de síntomas (cuántos registros tienen cada bit). */
export function symptomPrevalence(rows: Row[], nSymptoms: number): number[] {
  const out = new Array(nSymptoms).fill(0);
  for (const r of rows) {
    const mask = r[COL.sintomas];
    for (let b = 0; b < nSymptoms; b++) {
      if (mask & (1 << b)) out[b]++;
    }
  }
  return out;
}

/**
 * Canal endémico: para cada semana 1..53 calcula los percentiles (p25, p50, p75)
 * de casos a partir de los años de referencia, y la curva del año foco.
 * `rows` ya viene filtrado por todo excepto el año.
 */
export function endemicChannel(rows: Row[], years: number[], focusYear: number) {
  const N = 53;
  // matriz año -> semana -> conteo
  const byYearWeek = new Map<number, number[]>();
  for (const y of years) byYearWeek.set(y, new Array(N + 1).fill(0));
  for (const r of rows) {
    const wk = r[COL.semana];
    if (wk < 1 || wk > N) continue;
    const arr = byYearWeek.get(r[COL.anio]);
    if (arr) arr[wk]++;
  }

  const p25: number[] = [], p50: number[] = [], p75: number[] = [], focus: number[] = [];
  const refYears = years.filter((y) => y !== focusYear);
  for (let wk = 1; wk <= N; wk++) {
    const vals = refYears.map((y) => byYearWeek.get(y)![wk]).sort((a, b) => a - b);
    p25.push(percentile(vals, 0.25));
    p50.push(percentile(vals, 0.5));
    p75.push(percentile(vals, 0.75));
    focus.push(byYearWeek.get(focusYear)?.[wk] ?? 0);
  }
  return { weeks: Array.from({ length: N }, (_, i) => i + 1), p25, p50, p75, focus };
}

function percentile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}
