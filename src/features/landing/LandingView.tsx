import React, { useEffect, useState, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSection from './components/HeroSection';
import ThreatSection from './components/ThreatSection';
import TransitionSection from './components/TransitionSection';
import TerritorySection from './components/TerritorySection';
import SourcesSection from './components/SourcesSection';
import SimulatorSection from './components/SimulatorSection';
import CostSection from './components/CostSection';
import CTASection from './components/CTASection';
import { loadDengueData, COL, type DengueData } from '../dashboard/dengue';

gsap.registerPlugin(ScrollTrigger);

interface NowcastData {
  ancla: { anio: number; semana: number };
  series: {
    santander: Array<{ anio: number; semana: number; casos: number }>;
    bucaramanga_real: Array<{ anio: number; semana: number; casos: number }>;
    floridablanca_estimada: Array<{ anio: number; semana: number; casos: number }>;
  };
}

export interface ThreatData {
  broteYear: number;
  casosBrote: number;
  bgaBrote: number;
  casos2026: number;
  semana2026: number;
  casosSantander2025: number;
  historicalSeries: Array<{ year: number; cases: number }>;
  peakYear: number;
  peakCases: number;
  baselineYear: number;
  baselineCases: number;
  femaleCases: number;
  maleCases: number;
  femalePercent: number;
  malePercent: number;
  ageDistribution: Array<{ name: string; cases: number }>;
  mostAffectedAgeGroup: string;
  mostAffectedCases: number;
  hospitalizedCount: number;
  hospitalizedPercent: number;
  deadCount: number;
  letalidad: number;
  sinSignosCases: number;
  sinSignosPercent: number;
  conSignosCases: number;
  conSignosPercent: number;
  graveCases: number;
  gravePercent: number;
}

const LandingView: React.FC = () => {
  const [dengueData, setDengueData] = useState<DengueData | null>(null);
  const [nowcast, setNowcast] = useState<NowcastData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      loadDengueData(),
      fetch(`${import.meta.env.BASE_URL}data/nowcast_2026.json`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([data, now]) => {
        setDengueData(data);
        setNowcast(now as NowcastData | null);
        setLoading(false);
      })
      .catch((e) => {
        console.error('Failed to load landing data:', e);
        setLoading(false);
      });

    return () => {
      // Cleanup all ScrollTrigger instances on unmount
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // Refresh ScrollTrigger once data is loaded and DOM height has expanded
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const stats = useMemo<ThreatData | null>(() => {
    if (!dengueData) return null;

    const rows = dengueData.rows;
    const meta = dengueData.meta;

    // 1. Año del brote (2024): año completo y más robusto para demografía/clínica.
    //    El detalle por caso solo existe en el registro individual (FOSCAL) → usamos
    //    2024 (11.541 casos) en vez de 2025 parcial (corte en agosto/S35).
    const BROTE_YEAR = 2024;
    const rowsBrote = rows.filter((r) => r[COL.anio] === BROTE_YEAR);
    const casosBrote = rowsBrote.length;
    const bgaBrote = rowsBrote.filter((r) => r[COL.municipio] === 0).length;

    // 1b. Situación vigente desde el boletín del INS (dato fresco 2026 y Santander 2025 completo)
    const sumYear = (arr: Array<{ anio: number; casos: number }> | undefined, year: number) =>
      (arr ?? []).filter((p) => p.anio === year).reduce((a, p) => a + p.casos, 0);
    const casos2026 = Math.round(sumYear(nowcast?.series.bucaramanga_real, 2026));
    const semana2026 = nowcast?.ancla?.semana ?? 0;
    const casosSantander2025 = Math.round(sumYear(nowcast?.series.santander, 2025));

    // 2. Evolución histórica 2015-2025
    const yearCounts: Record<number, number> = {};
    meta.years.forEach((y) => {
      yearCounts[y] = 0;
    });
    rows.forEach((r) => {
      const y = r[COL.anio];
      if (yearCounts[y] !== undefined) {
        yearCounts[y]++;
      }
    });

    const historicalSeries = meta.years.map((y) => ({
      year: y,
      cases: yearCounts[y],
    }));

    // Pico histórico
    let peakYear = 2024;
    let peakCases = 0;
    historicalSeries.forEach((d) => {
      if (d.cases > peakCases) {
        peakCases = d.cases;
        peakYear = d.year;
      }
    });

    const baselineYear = 2015;
    const baselineCases = yearCounts[baselineYear] ?? 0;

    const femaleCases = rowsBrote.filter((r) => r[COL.sexo] === 0).length;
    const maleCases = rowsBrote.filter((r) => r[COL.sexo] === 1).length;
    const femalePercent = casosBrote > 0 ? parseFloat(((femaleCases / casosBrote) * 100).toFixed(1)) : 0;
    const malePercent = casosBrote > 0 ? parseFloat(((maleCases / casosBrote) * 100).toFixed(1)) : 0;

    const ageDistribution = meta.dicts.edad.map((name, i) => {
      const cases = rowsBrote.filter((r) => r[COL.edad] === i).length;
      return { name, cases };
    });

    let mostAffectedAgeGroup = '';
    let mostAffectedCases = 0;
    ageDistribution.forEach((d) => {
      if (d.cases > mostAffectedCases) {
        mostAffectedCases = d.cases;
        mostAffectedAgeGroup = d.name;
      }
    });

    const hospitalizedCount = rowsBrote.filter((r) => r[COL.hosp] === 1).length;
    const hospitalizedPercent = casosBrote > 0 ? parseFloat(((hospitalizedCount / casosBrote) * 100).toFixed(1)) : 0;
    const deadCount = rowsBrote.filter((r) => r[COL.fallecido] === 1).length;
    const letalidad = casosBrote > 0 ? parseFloat(((deadCount / casosBrote) * 100).toFixed(2)) : 0;

    const sinSignosCases = rowsBrote.filter((r) => r[COL.severidad] === 0).length;
    const sinSignosPercent = casosBrote > 0 ? parseFloat(((sinSignosCases / casosBrote) * 100).toFixed(1)) : 0;
    const conSignosCases = rowsBrote.filter((r) => r[COL.severidad] === 1).length;
    const conSignosPercent = casosBrote > 0 ? parseFloat(((conSignosCases / casosBrote) * 100).toFixed(1)) : 0;
    const graveCases = rowsBrote.filter((r) => r[COL.severidad] === 2).length;
    const gravePercent = casosBrote > 0 ? parseFloat(((graveCases / casosBrote) * 100).toFixed(1)) : 0;

    return {
      broteYear: BROTE_YEAR,
      casosBrote,
      bgaBrote,
      casos2026,
      semana2026,
      casosSantander2025,
      historicalSeries,
      peakYear,
      peakCases,
      baselineYear,
      baselineCases,
      femaleCases,
      maleCases,
      femalePercent,
      malePercent,
      ageDistribution,
      mostAffectedAgeGroup,
      mostAffectedCases,
      hospitalizedCount,
      hospitalizedPercent,
      deadCount,
      letalidad,
      sinSignosCases,
      sinSignosPercent,
      conSignosCases,
      conSignosPercent,
      graveCases,
      gravePercent,
    };
  }, [dengueData, nowcast]);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#0b0f19',
        color: '#fff',
        overflowX: 'hidden',
      }}
    >
      {/* Sección 1: El Héroe (El Gancho) */}
      <HeroSection />

      {/* Sección 2: La Amenaza (El Problema Real) */}
      <ThreatSection data={stats} loading={loading} />

      {/* Transición Narrativa */}
      <TransitionSection />

      {/* Sección 3: El Territorio (El Mapa de Casos) */}
      <TerritorySection bucaramangaCasesBrote={stats?.bgaBrote ?? 0} broteYear={stats?.broteYear ?? 2024} />

      {/* Sección 4: Datos Abiertos (Fuentes, variables y tratamiento) */}
      <SourcesSection />

      {/* Acto 6: Impacto Económico */}
      <CostSection />

      {/* Sección 5: El Simulador Predictivo (La Solución Avanzada) */}
      <SimulatorSection />

      {/* Sección 6: Call to Action (Cierre) */}
      <CTASection />
    </div>
  );
};

export default LandingView;
