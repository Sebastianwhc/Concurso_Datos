import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Coins, AlertCircle, PiggyBank, Cpu } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const CostSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const climaxRef = useRef<HTMLDivElement>(null);

  // States for counters
  const [costPerCase, setCostPerCase] = useState(0); // 0 -> 1.4 (float)
  const [broteCost, setBroteCost] = useState(0); // 0 -> 16000 (int)
  const [savingsMin, setSavingsMin] = useState(0); // 0 -> 1600 (int)
  const [savingsMax, setSavingsMax] = useState(0); // 0 -> 4800 (int)

  useEffect(() => {
    if (!sectionRef.current) return;

    // Fade-in animations for header texts
    gsap.fromTo(
      sectionRef.current.querySelectorAll('.cost-reveal-text'),
      { opacity: 0, y: 35 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        stagger: 0.18,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    // Cards reveal
    gsap.fromTo(
      sectionRef.current.querySelectorAll('.cost-card'),
      { opacity: 0, y: 40, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.1,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: cardsRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    // Climax card reveal
    gsap.fromTo(
      climaxRef.current,
      { opacity: 0, scale: 0.94, y: 55 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1.4,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: climaxRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    // Animate the counters using GSAP ScrollTrigger
    const counts = { cost: 0, brote: 0, min: 0, max: 0 };
    gsap.to(counts, {
      cost: 1.4,
      brote: 16000,
      min: 1600,
      max: 4800,
      duration: 2.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: cardsRef.current,
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
      onUpdate: () => {
        setCostPerCase(counts.cost);
        setBroteCost(Math.round(counts.brote));
        setSavingsMin(Math.round(counts.min));
        setSavingsMax(Math.round(counts.max));
      },
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      id="cost-impact"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8rem 1.5rem 6rem 1.5rem',
        background: 'linear-gradient(180deg, #0b0f19 0%, #070a14 50%, #0b0f19 100%)',
      }}
    >
      {/* Ambient Narrative Halos (Naranja) */}
      {/* Halo Central (Detrás del Contenido) */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(600px, 85vw)',
          height: 'min(600px, 85vw)',
          background: 'radial-gradient(circle, #fb923c 0%, rgba(251, 146, 60, 0.4) 50%, transparent 80%)',
          opacity: 0.22,
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Halo Lateral Izquierdo Superior */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '-10%',
          transform: 'translate(-50%, -50%)',
          width: 'min(800px, 100vw)',
          height: 'min(800px, 100vw)',
          background: 'radial-gradient(circle, #fb923c 0%, rgba(251, 146, 60, 0.3) 50%, transparent 80%)',
          opacity: 0.14,
          filter: 'blur(110px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Halo Lateral Derecho Medio */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '-12%',
          transform: 'translate(50%, -50%)',
          width: 'min(850px, 110vw)',
          height: 'min(850px, 110vw)',
          background: 'radial-gradient(circle, #fb923c 0%, rgba(251, 146, 60, 0.3) 50%, transparent 80%)',
          opacity: 0.18,
          filter: 'blur(120px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Halo Lateral Izquierdo Inferior */}
      <div
        style={{
          position: 'absolute',
          top: '80%',
          left: '-8%',
          transform: 'translate(-50%, -50%)',
          width: 'min(700px, 95vw)',
          height: 'min(700px, 95vw)',
          background: 'radial-gradient(circle, #fb923c 0%, rgba(251, 146, 60, 0.3) 50%, transparent 80%)',
          opacity: 0.12,
          filter: 'blur(100px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: '1100px', width: '100%', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '4rem' }}>

        {/* Header Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'center', alignItems: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <span
            className="cost-reveal-text"
            style={{
              display: 'inline-block',
              padding: '0.45rem 1.3rem',
              borderRadius: '100px',
              background: 'rgba(250, 204, 21, 0.05)',
              border: '1px solid rgba(250, 204, 21, 0.2)',
              color: '#facc15',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              width: 'fit-content',
              opacity: 0,
              boxShadow: '0 0 15px rgba(250, 204, 21, 0.12)',
            }}
          >
            IMPACTO ECONÓMICO
          </span>

          <h2
            className="cost-reveal-text"
            style={{
              fontSize: 'clamp(1.9rem, 4.5vw, 3.2rem)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              margin: 0,
              letterSpacing: '-1.5px',
              opacity: 0,
            }}
          >
            EL DENGUE TAMBIÉN
            <br />
            <span style={{
              background: 'linear-gradient(90deg, #facc15, #fb923c, #ef4444)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: 900,
            }}>
              TIENE UN COSTO
            </span>
          </h2>

          <p
            className="cost-reveal-text"
            style={{
              fontSize: 'clamp(0.95rem, 1.5vw, 1.2rem)',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.8,
              margin: 0,
              opacity: 0,
            }}
          >
            El impacto de una epidemia no se mide únicamente en pacientes, hospitalizaciones o fallecimientos.
            También se refleja en recursos públicos, capacidad operativa, atención médica y presupuesto sanitario.
            Cada caso representa un costo que podría evitarse si el riesgo se identifica antes de que el brote alcance su punto crítico.
          </p>
        </div>

        {/* Storytelling Cards Grid */}
        <div
          ref={cardsRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            width: '100%',
          }}
        >
          {/* Momento 1: Costo promedio por caso */}
          <div
            className="cost-card"
            style={{
              background: 'rgba(10, 15, 30, 0.65)',
              border: '1px solid rgba(251, 146, 60, 0.12)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              boxShadow: '0 0 30px rgba(251, 146, 60, 0.04)',
              borderRadius: '20px',
              padding: '2.2rem 1.8rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '0.8rem',
              opacity: 0,
            }}
          >
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(251, 146, 60, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fb923c',
              marginBottom: '0.4rem',
              border: '1px solid rgba(251, 146, 60, 0.15)',
            }}>
              <Coins size={22} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              CADA CASO TIENE UN COSTO
            </span>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
              ${costPerCase.toFixed(1)} MILLONES
            </span>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
              Costo promedio estimado por caso de dengue para el sistema de salud colombiano. Este valor incluye atención médica y costos directos asociados al manejo clínico.
            </p>
          </div>

          {/* Momento 2: Costo estimado del brote */}
          <div
            className="cost-card"
            style={{
              background: 'rgba(10, 15, 30, 0.65)',
              border: '1px solid rgba(239, 68, 68, 0.12)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.04)',
              borderRadius: '20px',
              padding: '2.2rem 1.8rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '0.8rem',
              opacity: 0,
            }}
          >
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              marginBottom: '0.4rem',
              border: '1px solid rgba(239, 68, 68, 0.15)',
            }}>
              <AlertCircle size={22} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              UN BROTE TIENE CONSECUENCIAS REALES
            </span>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
              ${broteCost.toLocaleString('de-DE')} MILLONES
            </span>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
              Costo directo estimado del brote de dengue registrado en Bucaramanga durante 2024.
            </p>
          </div>

          {/* Momento 3: Ahorro potencial anual */}
          <div
            className="cost-card"
            style={{
              background: 'rgba(10, 15, 30, 0.65)',
              border: '1px solid rgba(250, 204, 21, 0.12)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              boxShadow: '0 0 30px rgba(250, 204, 21, 0.04)',
              borderRadius: '20px',
              padding: '2.2rem 1.8rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '0.8rem',
              opacity: 0,
            }}
          >
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(250, 204, 21, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#facc15',
              marginBottom: '0.4rem',
              border: '1px solid rgba(250, 204, 21, 0.15)',
            }}>
              <PiggyBank size={22} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              PREVENIR ES MÁS BARATO QUE REACCIONAR
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
              ${savingsMin.toLocaleString('de-DE')} – ${savingsMax.toLocaleString('de-DE')} MILLONES
            </span>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
              Ahorro potencial anual si una estrategia de alerta temprana logra evitar entre el 10% y el 30% de los casos durante un año epidémico.
            </p>
          </div>

          {/* Momento 4: Costo operativo de la plataforma */}
          <div
            className="cost-card"
            style={{
              background: 'rgba(10, 15, 30, 0.65)',
              border: '1px solid rgba(251, 146, 60, 0.12)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              boxShadow: '0 0 30px rgba(251, 146, 60, 0.04)',
              borderRadius: '20px',
              padding: '2.2rem 1.8rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '0.8rem',
              opacity: 0,
            }}
          >
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(251, 146, 60, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fb923c',
              marginBottom: '0.4rem',
              border: '1px solid rgba(251, 146, 60, 0.15)',
            }}>
              <Cpu size={22} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              OPERAR LA PLATAFORMA
            </span>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
              ≈ $0
            </span>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
              La plataforma opera mediante tecnologías abiertas, inferencia local en navegador y arquitectura de bajo costo.
            </p>
          </div>
        </div>

        {/* Clímax Narrativo */}
        <div
          ref={climaxRef}
          style={{
            width: '100%',
            background: 'rgba(15, 8, 5, 0.65)',
            border: '1px solid rgba(250, 204, 21, 0.25)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 0 50px rgba(250, 204, 21, 0.08)',
            borderRadius: '28px',
            padding: '3.5rem 2.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1.2rem',
            marginTop: '1.5rem',
            opacity: 0,
          }}
        >
          <h3
            style={{
              fontSize: 'clamp(1.4rem, 3.8vw, 2.5rem)',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.2,
              margin: 0,
              letterSpacing: '-1px',
              textTransform: 'uppercase',
            }}
          >
            UN SOLO CASO DE DENGUE EVITADO
            <br />
            <span style={{
              background: 'linear-gradient(90deg, #facc15, #fb923c, #ef4444)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: 950,
            }}>
              PAGA TODO EL PROYECTO
            </span>
          </h3>
          <div style={{ width: '40px', height: '1.5px', background: 'rgba(250, 204, 21, 0.3)', margin: '0.5rem auto' }} />
          <p
            style={{
              fontSize: 'clamp(1.05rem, 1.8vw, 1.4rem)',
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: 500,
              margin: 0,
            }}
          >
            El retorno no es marginal.
            <br />
            <span style={{ color: '#fb923c', fontWeight: 700 }}>Es de órdenes de magnitud.</span>
          </p>
        </div>

        {/* Sección de Validación y Rigor (Fuentes y Metodología) */}
        <div
          style={{
            width: '100%',
            marginTop: '3.5rem',
            paddingTop: '2.5rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'left',
          }}
        >
          <h4
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.45)',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              margin: '0 0 1rem 0',
            }}
          >
            FUENTES Y METODOLOGÍA
          </h4>
          <p
            style={{
              fontSize: '0.78rem',
              color: 'rgba(255, 255, 255, 0.35)',
              lineHeight: 1.6,
              margin: '0 0 1.2rem 0',
              width: '100%',
            }}
          >
            Las estimaciones económicas se basan en estudios científicos publicados para Colombia sobre costos de atención del dengue y en datos epidemiológicos propios de SIVIGILA Bucaramanga 2015–2025. Las proporciones de gravedad fueron calculadas utilizando la base histórica del proyecto. Las cifras de ahorro representan escenarios de impacto potencial y dependen de la capacidad de respuesta de la autoridad sanitaria.
          </p>

          {/* Referencias */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.8rem 2rem',
              fontSize: '0.72rem',
              color: 'rgba(255, 255, 255, 0.25)',
              fontStyle: 'italic',
            }}
          >
            <div>• Shepard et al. — Cost of Dengue in Colombia</div>
            <div>• Castañeda-Orjuela et al. — Economic Burden of Dengue</div>
            <div>• SIVIGILA Bucaramanga 2015–2025</div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CostSection;
