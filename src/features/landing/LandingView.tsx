import React, { useEffect, useState, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSection from './components/HeroSection';
import ThreatSection from './components/ThreatSection';
import TransitionSection from './components/TransitionSection';
import TerritorySection from './components/TerritorySection';
import SolutionSection from './components/SolutionSection';
import SimulatorSection from './components/SimulatorSection';
import CTASection from './components/CTASection';
import { loadDengueData, COL, type DengueData } from '../dashboard/dengue';

gsap.registerPlugin(ScrollTrigger);

export interface ThreatData {
  totalCases2025: number;
  bga2025: number;
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
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Refresh ScrollTrigger when all content is loaded
    ScrollTrigger.refresh();

    loadDengueData()
      .then((data) => {
        setDengueData(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error('Failed to load dengue data:', e);
        setLoading(false);
      });

    return () => {
      // Cleanup all ScrollTrigger instances on unmount
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const stats = useMemo<ThreatData | null>(() => {
    if (!dengueData) return null;

    const rows = dengueData.rows;
    const meta = dengueData.meta;

    // 1. Filtrar registros para 2025
    const rows2025 = rows.filter((r) => r[COL.anio] === 2025);
    const totalCases2025 = rows2025.length;
    const bga2025 = rows2025.filter((r) => r[COL.municipio] === 0).length;

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

    const femaleCases = rows2025.filter((r) => r[COL.sexo] === 0).length;
    const maleCases = rows2025.filter((r) => r[COL.sexo] === 1).length;
    const femalePercent = totalCases2025 > 0 ? parseFloat(((femaleCases / totalCases2025) * 100).toFixed(1)) : 0;
    const malePercent = totalCases2025 > 0 ? parseFloat(((maleCases / totalCases2025) * 100).toFixed(1)) : 0;

    const ageDistribution = meta.dicts.edad.map((name, i) => {
      const cases = rows2025.filter((r) => r[COL.edad] === i).length;
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

    const hospitalizedCount = rows2025.filter((r) => r[COL.hosp] === 1).length;
    const hospitalizedPercent = totalCases2025 > 0 ? parseFloat(((hospitalizedCount / totalCases2025) * 100).toFixed(1)) : 0;
    const deadCount = rows2025.filter((r) => r[COL.fallecido] === 1).length;
    const letalidad = totalCases2025 > 0 ? parseFloat(((deadCount / totalCases2025) * 100).toFixed(2)) : 0;

    const sinSignosCases = rows2025.filter((r) => r[COL.severidad] === 0).length;
    const sinSignosPercent = totalCases2025 > 0 ? parseFloat(((sinSignosCases / totalCases2025) * 100).toFixed(1)) : 0;
    const conSignosCases = rows2025.filter((r) => r[COL.severidad] === 1).length;
    const conSignosPercent = totalCases2025 > 0 ? parseFloat(((conSignosCases / totalCases2025) * 100).toFixed(1)) : 0;
    const graveCases = rows2025.filter((r) => r[COL.severidad] === 2).length;
    const gravePercent = totalCases2025 > 0 ? parseFloat(((graveCases / totalCases2025) * 100).toFixed(1)) : 0;

    return {
      totalCases2025,
      bga2025,
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
  }, [dengueData]);

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
      <TerritorySection bucaramangaCases2025={stats?.bga2025 ?? 0} />

      {/* Sección 4: La Solución Tradicional vs Nuestra IA */}
      <SolutionSection />

      {/* Sección 5: El Simulador Predictivo (La Solución Avanzada) */}
      <SimulatorSection />

      {/* Sección 6: Call to Action (Cierre) */}
      <CTASection />
    </div>
  );
};

export default LandingView;
