import React, { useEffect, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import EChart from './EChart';
import styles from '../DashboardView.module.css';

interface Muni {
  code: string;
  name: string;
  total: number;
  graves: number;
  byYear: Record<string, number>;
}
interface SantanderData {
  meta: { years: number[]; max_total: number; max_by_year: Record<string, number> };
  municipios: Muni[];
}
interface MetroPuntos {
  meta: { total_direcciones: number; geocodificados: number; municipios: string[]; years: string[] };
  points: [number, number, number, number][]; // [lon, lat, añoIdx, municipioIdx]
}
interface ComunaFeat { id: string; municipio: string; comuna: string; }

const DENGUE_COLORS = ['#16243d', '#1d4ed8', '#eab308', '#f97316', '#ef4444'];
const CITY_COLORS = ['#00f0ff', '#ff6600', '#b300ff']; // Bucaramanga, Floridablanca, Girón
const CITY_TINT: Record<string, string> = {
  Bucaramanga: 'rgba(0,240,255,0.06)',
  Floridablanca: 'rgba(255,102,0,0.07)',
  'Girón': 'rgba(179,0,255,0.07)',
};

const baseTooltip = {
  backgroundColor: 'rgba(16,22,35,0.95)',
  borderColor: 'rgba(255,255,255,0.1)',
  textStyle: { color: '#fff', fontSize: 12 },
};

/** Dos vistas geoespaciales:
 *  - Santander (archivo nacional, 2007–2022) — contexto regional
 *  - Área Metropolitana por comunas — casos geocodificados (puntos), 2023–2025 */
const GeoMaps: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [sData, setSData] = useState<SantanderData | null>(null);
  const [metro, setMetro] = useState<MetroPuntos | null>(null);
  const [comunaFeats, setComunaFeats] = useState<ComunaFeat[] | null>(null);
  const [yearS, setYearS] = useState<number | 'all'>('all');
  const [yearM, setYearM] = useState<string | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const base = import.meta.env.BASE_URL;
    Promise.all([
      fetch(`${base}santander_municipios.geojson`).then((r) => r.json()),
      fetch(`${base}amb_comunas.geojson`).then((r) => r.json()),
      fetch(`${base}data/santander_dengue.json`).then((r) => r.json()),
      fetch(`${base}data/metro_puntos.json`).then((r) => r.json()),
    ])
      .then(([sGeo, cGeo, dd, mp]: [unknown, { features: { properties: ComunaFeat }[] }, SantanderData, MetroPuntos]) => {
        if (!active) return;
        echarts.registerMap('santander', sGeo as never);
        echarts.registerMap('amb_comunas', cGeo as never);
        setComunaFeats(cGeo.features.map((f) => f.properties));
        setSData(dd);
        setMetro(mp);
        setReady(true);
      })
      .catch((e) => active && setError(String(e)));
    return () => { active = false; };
  }, []);

  const santanderOption = useMemo<EChartsOption | null>(() => {
    if (!sData) return null;
    const max = yearS === 'all' ? sData.meta.max_total : sData.meta.max_by_year[String(yearS)] ?? 0;
    const seriesData = sData.municipios
      .filter((m) => m.code !== '000')
      .map((m) => ({ name: m.code, value: yearS === 'all' ? m.total : m.byYear[String(yearS)] ?? 0, mpio: m.name }));
    return {
      tooltip: {
        trigger: 'item', ...baseTooltip,
        formatter: (p: unknown) => {
          const d = p as { data?: { mpio: string; value: number } };
          return d.data ? `<b>${d.data.mpio}</b><br/>Casos de dengue: <b>${(d.data.value || 0).toLocaleString('es-CO')}</b>` : '';
        },
      },
      visualMap: {
        type: 'continuous', min: 0, max: Math.max(max, 1), left: 6, bottom: 8,
        calculable: true, itemHeight: 110, text: ['Más', 'Menos'],
        textStyle: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
        inRange: { color: DENGUE_COLORS },
      },
      series: [{
        type: 'map', map: 'santander', nameProperty: 'MPIO_CCDGO',
        roam: true, aspectScale: 1, scaleLimit: { min: 1, max: 12 },
        layoutCenter: ['50%', '50%'], layoutSize: '100%',
        data: seriesData, label: { show: false },
        itemStyle: { borderColor: 'rgba(255,255,255,0.12)', borderWidth: 0.5, areaColor: '#0f1626' },
        emphasis: { label: { show: true, color: '#fff', fontSize: 11 }, itemStyle: { areaColor: '#00f0ff', borderColor: '#fff' } },
      }],
    };
  }, [sData, yearS]);

  const metroOption = useMemo<EChartsOption | null>(() => {
    if (!metro || !comunaFeats) return null;
    const cities = metro.meta.municipios;
    const pts = yearM === 'all'
      ? metro.points
      : metro.points.filter((p) => metro.meta.years[p[2]] === yearM);

    // Agrega casos por ubicación única (la geocodificación es a nivel de calle,
    // así que muchas direcciones comparten coordenada). Cada burbuja = un punto,
    // con tamaño proporcional al número de casos allí.
    const agg = new Map<string, { lon: number; lat: number; mi: number; n: number }>();
    for (const p of pts) {
      const key = `${p[0]},${p[1]},${p[3]}`;
      const e = agg.get(key);
      if (e) e.n++;
      else agg.set(key, { lon: p[0], lat: p[1], mi: p[3], n: 1 });
    }
    const groups = [...agg.values()];
    const featMap = Object.fromEntries(comunaFeats.map((f) => [f.id, f]));

    return {
      tooltip: {
        trigger: 'item', ...baseTooltip,
        formatter: (p: unknown) => {
          const d = p as { componentType?: string; name?: string; seriesName?: string; value?: number[] };
          if (d.componentType === 'geo') {
            const f = featMap[d.name ?? ''];
            return f ? `<b>${f.comuna}</b><br/><span style="color:rgba(255,255,255,0.55)">${f.municipio}</span>` : '';
          }
          const n = d.value?.[2] ?? 0;
          return `<b>${d.seriesName}</b><br/>${n} caso${n === 1 ? '' : 's'} en esta ubicación`;
        },
      },
      legend: {
        data: cities, top: 0, right: 0,
        textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
        inactiveColor: 'rgba(255,255,255,0.2)',
      },
      geo: {
        map: 'amb_comunas', nameProperty: 'id', roam: true, aspectScale: 1,
        layoutCenter: ['50%', '50%'], layoutSize: '104%',
        scaleLimit: { min: 1, max: 12 },
        itemStyle: { areaColor: '#0f1626', borderColor: 'rgba(255,255,255,0.18)', borderWidth: 0.6 },
        regions: comunaFeats.map((f) => ({
          name: f.id, itemStyle: { areaColor: CITY_TINT[f.municipio] ?? '#0f1626' },
        })),
        emphasis: { itemStyle: { areaColor: 'rgba(0,240,255,0.16)' }, label: { show: false } },
        label: { show: false },
      },
      series: cities.map((city, mi) => ({
        name: city,
        type: 'scatter' as const,
        coordinateSystem: 'geo' as const,
        data: groups.filter((g) => g.mi === mi).map((g) => ({ value: [g.lon, g.lat, g.n] })),
        symbolSize: (v: number[]) => Math.min(5 + Math.sqrt(v[2]) * 2.6, 30),
        itemStyle: {
          color: CITY_COLORS[mi % CITY_COLORS.length], opacity: 0.55,
          borderColor: 'rgba(0,0,0,0.35)', borderWidth: 0.4,
        },
        emphasis: { itemStyle: { opacity: 0.9 } },
      })),
    };
  }, [metro, comunaFeats, yearM]);

  if (error) return <div className={styles.state}>No se pudieron cargar los mapas: {error}</div>;
  if (!ready || !sData || !metro || !comunaFeats || !santanderOption || !metroOption)
    return <div className={styles.mapLoading}>Cargando mapas geoespaciales…</div>;

  return (
    <div className={styles.geoSection}>
      <div className={styles.geoHeader}>
        <h3>Distribución geoespacial del dengue</h3>
        <span>Contexto regional y ubicación de casos por comuna en el Área Metropolitana</span>
      </div>

      <div className={styles.geoGrid}>
        <div className={styles.mapCard}>
          <div className={styles.mapCardHead}>
            <div className={styles.mapCardTitle}>Departamento de Santander · 87 municipios</div>
            <select className={styles.mapSelect} value={yearS} onChange={(e) => setYearS(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
              <option value="all">Acumulado</option>
              {sData.meta.years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <EChart option={santanderOption} height={430} />
          <div className={styles.mapNote}>Casos de dengue · SIVIGILA nacional (2007–2022)</div>
        </div>

        <div className={styles.mapCard}>
          <div className={styles.mapCardHead}>
            <div className={styles.mapCardTitle}>Área Metropolitana · casos por comuna</div>
            <select className={styles.mapSelect} value={yearM} onChange={(e) => setYearM(e.target.value)}>
              <option value="all">Acumulado</option>
              {metro.meta.years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <EChart option={metroOption} height={470} />
          <div className={styles.mapNote}>
            {metro.meta.geocodificados.toLocaleString('es-CO')} casos geocodificados (Reporte Salud Pública,
            2023–2025) sobre las comunas de Bucaramanga (17) y Floridablanca (8). Girón se muestra como
            casos (burbujas) — no tiene comunas oficiales abiertas. Pasa el cursor sobre una comuna para ver su nombre.
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoMaps;
