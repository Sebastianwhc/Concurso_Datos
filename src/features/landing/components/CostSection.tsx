import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Coins, AlertCircle, PiggyBank, Cpu } from 'lucide-react';
import { useT } from '../../../i18n/useT';

gsap.registerPlugin(ScrollTrigger);

const CostSection: React.FC = () => {
  const { t } = useT();
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

    const counts = { cost: 0, brote: 0, min: 0, max: 0 };
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCostPerCase(1.4);
      setBroteCost(16000);
      setSavingsMin(1600);
      setSavingsMax(4800);
      gsap.set(sectionRef.current.querySelectorAll('.cost-reveal-text'), { opacity: 1, y: 0 });
      gsap.set(sectionRef.current.querySelectorAll('.cost-card'), { opacity: 1, y: 0, scale: 1 });
      gsap.set(climaxRef.current, { opacity: 1, scale: 1, y: 0 });
      return;
    }

    // Force a ScrollTrigger refresh after mount to ensure correct layout calculations
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    // Consolidated timeline triggered every time the section enters the viewport (like other acts)
    const costTl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
    });

    // 1. Reveal header texts
    costTl.fromTo(
      sectionRef.current.querySelectorAll('.cost-reveal-text'),
      { opacity: 0, y: 35 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        stagger: 0.18,
        ease: 'power3.out',
      }
    );

    // 2. Reveal KPI cards
    costTl.fromTo(
      sectionRef.current.querySelectorAll('.cost-card'),
      { opacity: 0, y: 40, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.1,
        stagger: 0.12,
        ease: 'power3.out',
      },
      '-=0.95'
    );

    // 3. Animate the counter numbers from 0 to final value
    costTl.to(
      counts,
      {
        cost: 1.4,
        brote: 16000,
        min: 1600,
        max: 4800,
        duration: 2.2,
        ease: 'power2.out',
        onUpdate: () => {
          setCostPerCase(counts.cost);
          setBroteCost(Math.round(counts.brote));
          setSavingsMin(Math.round(counts.min));
          setSavingsMax(Math.round(counts.max));
        },
      },
      '-=1.2'
    );

    // 4. Reveal climax card
    costTl.fromTo(
      climaxRef.current,
      { opacity: 0, scale: 0.94, y: 55 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1.4,
        ease: 'power3.out',
      },
      '-=1.4'
    );

    return () => {
      costTl.kill();
      clearTimeout(refreshTimer);
    };
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
      {/* Ambient Narrative Halos (Amarillo) */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(600px, 85vw)',
          height: 'min(600px, 85vw)',
          background: 'radial-gradient(circle, #facc15 0%, rgba(250, 204, 21, 0.6) 50%, transparent 80%)',
          opacity: 0.45,
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '-10%',
          transform: 'translate(-50%, -50%)',
          width: 'min(800px, 100vw)',
          height: 'min(800px, 100vw)',
          background: 'radial-gradient(circle, #facc15 0%, rgba(250, 204, 21, 0.45) 50%, transparent 80%)',
          opacity: 0.30,
          filter: 'blur(110px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '-12%',
          transform: 'translate(50%, -50%)',
          width: 'min(850px, 110vw)',
          height: 'min(850px, 110vw)',
          background: 'radial-gradient(circle, #facc15 0%, rgba(250, 204, 21, 0.45) 50%, transparent 80%)',
          opacity: 0.35,
          filter: 'blur(120px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '80%',
          left: '-8%',
          transform: 'translate(-50%, -50%)',
          width: 'min(700px, 95vw)',
          height: 'min(700px, 95vw)',
          background: 'radial-gradient(circle, #facc15 0%, rgba(250, 204, 21, 0.45) 50%, transparent 80%)',
          opacity: 0.25,
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
            {t.cost.badge}
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
            {t.cost.titleLine1}
            <br />
            <span style={{
              background: 'linear-gradient(90deg, #facc15, #fb923c, #ef4444)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: 900,
            }}>
              {t.cost.titleLine2}
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
            {t.cost.desc}
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
              {t.cost.card1Title}
            </span>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
              {t.cost.card1Value.replace('{cost}', costPerCase.toFixed(1))}
            </span>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
              {t.cost.card1Desc}
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
              {t.cost.card2Title}
            </span>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
              {t.cost.card2Value.replace('{cost}', broteCost.toLocaleString('de-DE'))}
            </span>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
              {t.cost.card2Desc}
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
              {t.cost.card3Title}
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
              {t.cost.card3Value.replace('{min}', savingsMin.toLocaleString('de-DE')).replace('{max}', savingsMax.toLocaleString('de-DE'))}
            </span>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
              {t.cost.card3Desc}
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
              {t.cost.card4Title}
            </span>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
              {t.cost.card4Value}
            </span>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
              {t.cost.card4Desc}
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
            {t.cost.climaxTitle1}
            <br />
            <span style={{
              background: 'linear-gradient(90deg, #facc15, #fb923c, #ef4444)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: 950,
            }}>
              {t.cost.climaxTitle2}
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
            {t.cost.climaxSub1}
            <br />
            <span style={{ color: '#fb923c', fontWeight: 700 }}>{t.cost.climaxSub2}</span>
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
            {t.cost.methodologyTitle}
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
            {t.cost.methodologyDesc}
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
