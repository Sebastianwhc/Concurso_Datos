import React, { useEffect, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import EChart from './EChart';
import { useT } from '../../../i18n/useT';
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
  points: [number, number, number, number][];
}
interface ComunaFeat { id: string; municipio: string; comuna: string; }

const DENGUE_COLORS = ['#16243d', '#1d4ed8', '#eab308', '#f97316', '#ef4444'];
const CITY_COLORS = ['#00f0ff', '#ff6600', '#b300ff'];
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

const GeoMaps: React.FC = () => {
  const { t, lang } = useT();
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
    const codeToName = Object.fromEntries(sData.municipios.map((m) => [m.code, m.name]));
    const seriesData = sData.municipios
      .filter((m) => m.code !== '000')
      .map((m) => ({ name: m.code, value: yearS === 'all' ? m.total : m.byYear[String(yearS)] ?? 0, mpio: m.name }));
    const dengueCasesLabel = lang === 'es' ? 'Casos de dengue:' : 'Dengue cases:';
    const moreLabel = lang === 'es' ? 'Más' : 'More';
    const lessLabel = lang === 'es' ? 'Menos' : 'Less';

    return {
      tooltip: {
        trigger: 'item', ...baseTooltip,
        formatter: (p: unknown) => {
          const d = p as { data?: { mpio: string; value: number } };
          return d.data ? `<b>${d.data.mpio}</b><br/>${dengueCasesLabel} <b>${(d.data.value || 0).toLocaleString(lang === 'es' ? 'es-CO' : 'en-US')}</b>` : '';
        },
      },
      visualMap: {
        type: 'continuous', min: 0, max: Math.max(max, 1), left: 6, bottom: 8,
        calculable: true, itemHeight: 110, text: [moreLabel, lessLabel],
        textStyle: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
        inRange: { color: DENGUE_COLORS },
      },
      series: [{
        type: 'map', map: 'santander', nameProperty: 'MPIO_CCDGO',
        roam: true, aspectScale: 1, scaleLimit: { min: 1, max: 12 },
        layoutCenter: ['50%', '50%'], layoutSize: '100%',
        data: seriesData, label: { show: false },
        itemStyle: { borderColor: 'rgba(255,255,255,0.22)', borderWidth: 0.8, areaColor: '#0f1626' },
        emphasis: {
          label: {
            show: true, color: '#fff', fontSize: 11, fontWeight: 'bold' as const,
            formatter: (p: unknown) => codeToName[(p as { name: string }).name] ?? '',
          },
          itemStyle: { areaColor: '#00f0ff', borderColor: '#fff' },
        },
      }],
    };
  }, [sData, yearS, lang]);

  const metroOption = useMemo<EChartsOption | null>(() => {
    if (!metro || !comunaFeats) return null;
    const cities = metro.meta.municipios;
    const pts = yearM === 'all'
      ? metro.points
      : metro.points.filter((p) => metro.meta.years[p[2]] === yearM);

    const agg = new Map<string, { lon: number; lat: number; mi: number; n: number }>();
    for (const p of pts) {
      const key = `${p[0]},${p[1]},${p[3]}`;
      const e = agg.get(key);
      if (e) e.n++;
      else agg.set(key, { lon: p[0], lat: p[1], mi: p[3], n: 1 });
    }
    const groups = [...agg.values()];
    const featMap = Object.fromEntries(comunaFeats.map((f) => [f.comuna, f]));

    return {
      tooltip: {
        trigger: 'item', ...baseTooltip,
        formatter: (p: unknown) => {
          const d = p as { name?: string; seriesName?: string; value?: number[] };
          if (Array.isArray(d.value)) {
            const n = d.value[2] ?? 0;
            const casesText = lang === 'es'
              ? `${n} caso${n === 1 ? '' : 's'} en esta ubicación`
              : `${n} case${n === 1 ? '' : 's'} at this location`;
            return `<b>${d.seriesName}</b><br/>${casesText}`;
          }
          const f = featMap[d.name ?? ''];
          return f
            ? `<b>${f.comuna}</b><br/><span style="color:rgba(255,255,255,0.55)">${f.municipio}</span>`
            : `<b>${d.name ?? ''}</b>`;
        },
      },
      legend: {
        data: cities, top: 0, right: 0,
        textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
        inactiveColor: 'rgba(255,255,255,0.2)',
      },
      geo: {
        map: 'amb_comunas', nameProperty: 'comuna', roam: true, aspectScale: 1,
        layoutCenter: ['50%', '50%'], layoutSize: '104%',
        scaleLimit: { min: 1, max: 12 },
        itemStyle: { areaColor: '#0f1626', borderColor: 'rgba(255,255,255,0.18)', borderWidth: 0.6 },
        regions: comunaFeats.map((f) => ({
          name: f.comuna, itemStyle: { areaColor: CITY_TINT[f.municipio] ?? '#0f1626' },
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
  }, [metro, comunaFeats, yearM, lang]);

  if (error) return <div className={styles.state}>{lang === 'es' ? `No se pudieron cargar los mapas: ${error}` : `Failed to load maps: ${error}`}</div>;
  if (!ready || !sData || !metro || !comunaFeats || !santanderOption || !metroOption)
    return <div className={styles.mapLoading}>{lang === 'es' ? 'Cargando mapas geoespaciales…' : 'Loading geospatial maps…'}</div>;

  return (
    <div className={styles.geoSection}>
      <div className={styles.geoHeader}>
        <h3>{lang === 'es' ? 'Distribución geoespacial del dengue' : 'Geospatial Dengue Distribution'}</h3>
        <span>{lang === 'es' ? 'Contexto regional y ubicación de casos por comuna en el Área Metropolitana' : 'Regional context and case locations by district in the Metropolitan Area'}</span>
      </div>

      <div className={styles.geoGrid}>
        <div className={styles.mapCard}>
          <div className={styles.mapCardHead}>
            <div className={styles.mapCardTitle}>{t.dashboard.geomaps.titleSantander}</div>
            <select className={styles.mapSelect} value={yearS} onChange={(e) => setYearS(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
              <option value="all">{t.dashboard.geomaps.allYears}</option>
              {sData.meta.years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <EChart option={santanderOption} height={430} />
          <div className={styles.mapNote}>{t.dashboard.geomaps.subSantander.replace('{municipios}', '87')}</div>
        </div>

        <div className={styles.mapCard}>
          <div className={styles.mapCardHead}>
            <div className={styles.mapCardTitle}>{t.dashboard.geomaps.titleMetro}</div>
            <select className={styles.mapSelect} value={yearM} onChange={(e) => setYearM(e.target.value)}>
              <option value="all">{t.dashboard.geomaps.allYears}</option>
              {metro.meta.years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <EChart option={metroOption} height={470} />
          <div className={styles.mapNote}>
            {t.dashboard.geomaps.subMetro.replace('{count}', metro.meta.geocodificados.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US'))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoMaps;
