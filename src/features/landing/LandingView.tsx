import React, { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSection from './components/HeroSection';
import ThreatSection from './components/ThreatSection';
import TerritorySection from './components/TerritorySection';
import SolutionSection from './components/SolutionSection';
import SimulatorSection from './components/SimulatorSection';
import CTASection from './components/CTASection';

gsap.registerPlugin(ScrollTrigger);

const LandingView: React.FC = () => {
  useEffect(() => {
    // Refresh ScrollTrigger when all content is loaded
    ScrollTrigger.refresh();

    return () => {
      // Cleanup all ScrollTrigger instances on unmount
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

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
      <ThreatSection />

      {/* Sección 3: El Territorio (El Mapa de Casos) */}
      <TerritorySection />

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
