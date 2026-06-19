import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type ThreatData } from '../LandingView';
import { ShieldCheck, TriangleAlert, HeartPulse, BedDouble, Activity } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface ThreatSectionProps {
  data: ThreatData | null;
  loading: boolean;
}



/* ─── Main Section ─── */
const ThreatSection: React.FC<ThreatSectionProps> = ({ data, loading }) => {
  const sectionRef = useRef<HTMLElement>(null);

  const act1Ref = useRef<HTMLDivElement>(null);
  const act2Ref = useRef<HTMLDivElement>(null);
  const act3Ref = useRef<HTMLDivElement>(null);
  const act4Ref = useRef<HTMLDivElement>(null);

  const [inViewAct2, setInViewAct2] = useState(false);
  const [inViewAct3, setInViewAct3] = useState(false);
  const [inViewAct4, setInViewAct4] = useState(false);
  const [costBrote2024, setCostBrote2024] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 16000 : 0
  );

  useEffect(() => {
    if (loading || !data) return;

    // Animaciones de Entrada para el Acto 1
    const act1Tl = gsap.timeline({
      scrollTrigger: {
        trigger: act1Ref.current,
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
    });

    act1Tl.fromTo(
      '.scroll-reveal-badge',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
    )
      .fromTo(
        '.scroll-reveal-title',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
        '-=0.95'
      )
      .fromTo(
        '.scroll-reveal-kpi',
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 1.4, ease: 'power3.out' },
        '-=0.95'
      )
      .fromTo(
        '.scroll-reveal-econ-title',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
        '-=0.95'
      )
      .fromTo(
        '.scroll-reveal-econ-kpi',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' },
        '-=0.85'
      )
      .fromTo(
        '.scroll-reveal-econ-sub',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
        '-=0.85'
      )
      .fromTo(
        '.scroll-reveal-econ-methodology',
        { opacity: 0 },
        { opacity: 1, duration: 1, ease: 'power2.out' },
        '-=0.75'
      )
      .fromTo(
        '.scroll-reveal-text',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
        '-=0.95'
      )
      .fromTo(
        '.scroll-reveal-indicators > div',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power2.out' },
        '-=0.8'
      );

    // Animación de conteo del brote 2024 en Acto 1 (con soporte de accesibilidad)
    if (typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const econCountObj = { val: 0 };
      act1Tl.to(econCountObj, {
        val: 16000,
        duration: 2.2,
        ease: 'power2.out',
        onUpdate: () => {
          setCostBrote2024(Math.round(econCountObj.val));
        }
      }, '-=3.2'); // Se ejecuta en paralelo durante la animación del bloque
    }

    // Acto 2: Trigger de Visibilidad del Gráfico
    ScrollTrigger.create({
      trigger: act2Ref.current,
      start: 'top 65%',
      onEnter: () => setInViewAct2(true),
      onLeaveBack: () => setInViewAct2(false),
    });

    // Acto 2: Animaciones de Entrada
    const act2Tl = gsap.timeline({
      scrollTrigger: {
        trigger: act2Ref.current,
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
    });

    act2Tl.fromTo(
      '.scroll-reveal-badge-act2',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
    )
      .fromTo(
        '.scroll-reveal-title-act2',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
        '-=0.95'
      )
      .fromTo(
        '.scroll-reveal-text-act2',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
        '-=0.95'
      )
      .fromTo(
        '.scroll-reveal-chart-act2',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' },
        '-=0.9'
      )
      .fromTo(
        '.scroll-reveal-card-act2',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, stagger: 0.15, ease: 'power3.out' },
        '-=0.95'
      )
      .fromTo(
        '.scroll-reveal-phrase-act2',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' },
        '-=0.8'
      );

    // Acto 3: Trigger de Visibilidad del Gráfico
    ScrollTrigger.create({
      trigger: act3Ref.current,
      start: 'top 65%',
      onEnter: () => setInViewAct3(true),
      onLeaveBack: () => setInViewAct3(false),
    });

    // Acto 3: Animaciones de Entrada
    const act3Tl = gsap.timeline({
      scrollTrigger: {
        trigger: act3Ref.current,
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
    });

    act3Tl.fromTo(
      '.scroll-reveal-badge-act3',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
    )
      .fromTo(
        '.scroll-reveal-title-act3',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
        '-=0.95'
      )
      .fromTo(
        '.scroll-reveal-text-act3',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
        '-=0.95'
      )
      .fromTo(
        '.scroll-reveal-panel-left-act3',
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 1.3, ease: 'power3.out' },
        '-=0.9'
      )
      .fromTo(
        '.scroll-reveal-panel-right-act3',
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 1.3, ease: 'power3.out' },
        '-=1.3'
      )
      .fromTo(
        '.scroll-reveal-findings-act3',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
        '-=0.9'
      );

    // Acto 4: Trigger de Visibilidad
    ScrollTrigger.create({
      trigger: act4Ref.current,
      start: 'top 65%',
      onEnter: () => setInViewAct4(true),
      onLeaveBack: () => setInViewAct4(false),
    });

    // Acto 4: Animaciones de Entrada
    const act4Tl = gsap.timeline({
      scrollTrigger: {
        trigger: act4Ref.current,
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
    });

    act4Tl.fromTo(
      '.scroll-reveal-badge-act4',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
    )
      .fromTo(
        '.scroll-reveal-title-act4',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
        '-=0.95'
      )
      .fromTo(
        '.scroll-reveal-text-act4',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
        '-=0.95'
      )
      .fromTo(
        '.scroll-reveal-severity-bar-act4',
        { opacity: 0, scaleX: 0.96 },
        { opacity: 1, scaleX: 1, duration: 1.4, ease: 'power3.out' },
        '-=0.9'
      )
      .fromTo(
        '.scroll-reveal-clinical-card-act4',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, stagger: 0.12, ease: 'power3.out' },
        '-=0.95'
      )
      .fromTo(
        '.scroll-reveal-kpi-row-act4',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
        '-=0.9'
      )
      .fromTo(
        '.scroll-reveal-insight-act4',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
        '-=0.9'
      );
  }, [loading, data]);

  if (loading || !data) {
    return (
      <section
        ref={sectionRef}
        id="threat"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050810',
        }}
      >
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          Procesando datos históricos...
        </div>
      </section>
    );
  }

  // Cómputo del gráfico histórico (Acto 2)
  const histW = 900;
  const histH = 500;
  const histPadL = 60;
  const histPadR = 60;
  const histPadT = 110;
  const histPadB = 50;
  const histChartW = histW - histPadL - histPadR;
  const histChartH = histH - histPadT - histPadB;

  const maxHistCases = data.peakCases;
  const histPoints = data.historicalSeries.map((d, i) => {
    const x = histPadL + (i / (data.historicalSeries.length - 1)) * histChartW;
    const y = histPadT + histChartH - (d.cases / maxHistCases) * histChartH;
    return { x, y, cases: d.cases, year: d.year };
  });

  const histPathData = histPoints.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = histPoints[i - 1];
    const cpx1 = prev.x + (p.x - prev.x) * 0.45;
    const cpx2 = p.x - (p.x - prev.x) * 0.45;
    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const histAreaPath = `${histPathData} L ${histPoints[histPoints.length - 1].x} ${histH - histPadB} L ${histPoints[0].x} ${histH - histPadB} Z`;

  const peakPt = histPoints.find((p) => p.year === data.peakYear) || histPoints[9];

  return (
    <section
      ref={sectionRef}
      id="threat"
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6rem 2rem 0 2rem',
        background: 'linear-gradient(180deg, #050810 0%, #0b0f19 30%, #0d1222 100%)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '1100px', width: '100%', position: 'relative', zIndex: 1 }}>

        {/* ─── ACTO 1: LA AMENAZA (DISEÑO PREMIUM HERO) ─── */}
        <div
          ref={act1Ref}
          style={{
            minHeight: '82vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '2rem 0 5rem 0',
            position: 'relative',
          }}
        >
          {/* Ambient Narrative Halos (Rojo Epidemiológico) */}
          {/* Halo Central (Detrás del KPI 2.418) */}
          <div
            style={{
              position: 'absolute',
              top: '46%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(600px, 85vw)',
              height: 'min(600px, 85vw)',
              background: 'radial-gradient(circle, #ff3b4d 0%, rgba(255, 59, 77, 0.4) 50%, transparent 80%)',
              opacity: 0.28,
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
              background: 'radial-gradient(circle, #ff5b6b 0%, rgba(255, 91, 107, 0.3) 50%, transparent 80%)',
              opacity: 0.18,
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
              background: 'radial-gradient(circle, #ff4d5a 0%, rgba(255, 77, 90, 0.3) 50%, transparent 80%)',
              opacity: 0.24,
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
              background: 'radial-gradient(circle, #ff3b4d 0%, rgba(255, 59, 77, 0.3) 50%, transparent 80%)',
              opacity: 0.15,
              filter: 'blur(100px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          {/* Upper Badge */}
          <span
            className="scroll-reveal-badge"
            style={{
              display: 'inline-block',
              padding: '0.45rem 1.3rem',
              borderRadius: '100px',
              background: 'rgba(255,77,77,0.07)',
              border: '1px solid rgba(255,77,77,0.18)',
              color: '#ff4d4d',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '2rem',
              boxShadow: '0 0 15px rgba(255,77,77,0.12)',
              position: 'relative',
              zIndex: 1,
              opacity: 0,
            }}
          >
            LA AMENAZA
          </span>

          {/* Main Title */}
          <h2
            className="scroll-reveal-title"
            style={{
              fontSize: 'clamp(1.9rem, 5vw, 4rem)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.15,
              margin: '0 0 2rem 0',
              position: 'relative',
              zIndex: 1,
              letterSpacing: '-2px',
              opacity: 0,
            }}
          >
            EL DENGUE NO ESPERA.
            <br />
            <span
              style={{
                position: 'relative',
                display: 'inline-block',
                background: 'linear-gradient(90deg, #ff4d4d, #ff6b6b, #ff8787)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 0 8px rgba(255, 77, 77, 0.45), 0 0 20px rgba(255, 77, 77, 0.25), 0 0 40px rgba(255, 77, 77, 0.15)',
              }}
            >
              {/* Ambient diffuse lighting behind the phrase */}
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '130%',
                height: '160%',
                background: 'radial-gradient(circle, rgba(255, 77, 77, 0.18) 0%, rgba(255, 77, 77, 0.04) 60%, transparent 80%)',
                filter: 'blur(24px)',
                zIndex: -1,
                pointerEvents: 'none',
                display: 'block',
              }} />
              ES UNA EMERGENCIA EN CURSO.
            </span>
          </h2>

          {/* KPI Central Gigante */}
          <div
            className="scroll-reveal-kpi"
            style={{
              position: 'relative',
              display: 'inline-block',
              marginBottom: '2.5rem',
              zIndex: 1,
              opacity: 0,
            }}
          >
            <span
              style={{
                fontSize: 'clamp(5.5rem, 13vw, 8.5rem)',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '-3px',
                lineHeight: 1,
                display: 'block',
                textShadow: '0 0 35px rgba(255,77,77,0.18)',
              }}
            >
              {data.totalCases2025.toLocaleString()}
            </span>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                display: 'block',
                marginTop: '0.8rem',
              }}
            >
              CASOS NOTIFICADOS EN 2025
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.35)',
                display: 'block',
                marginTop: '0.3rem',
              }}
            >
              Corte epidemiológico actual
            </span>
          </div>

          {/* Nuevo Bloque Narrativo: Impacto Económico en Acto 1 */}
          <div
            className="scroll-reveal-econ"
            style={{
              marginTop: '1.5rem',
              marginBottom: '3.5rem',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            {/* Ambient diffuse lighting behind the economic beat */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '180px',
              height: '180px',
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, transparent 75%)',
              filter: 'blur(30px)',
              zIndex: -1,
              pointerEvents: 'none',
            }} />

            <h4
              className="scroll-reveal-econ-title"
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#ff5c5c',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                margin: 0,
                opacity: 0,
              }}
            >
              EL DENGUE NO SOLO ENFERMA
            </h4>

            <p
              className="scroll-reveal-econ-kpi"
              style={{
                fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)',
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 500,
                maxWidth: '650px',
                margin: 0,
                lineHeight: 1.4,
                opacity: 0,
              }}
            >
              En el brote epidemiológico de 2024, el dengue le costó a Bucaramanga aproximadamente{' '}
              <strong style={{
                color: '#ef4444',
                fontWeight: 900,
                display: 'block',
                fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
                letterSpacing: '-1.5px',
                marginTop: '0.5rem',
                textShadow: '0 0 25px rgba(239,68,68,0.3)',
              }}>
                ≈ ${costBrote2024.toLocaleString('de-DE')} millones
              </strong>
            </p>

            <p
              className="scroll-reveal-econ-sub"
              style={{
                fontSize: '0.82rem',
                color: 'rgba(255,255,255,0.45)',
                maxWidth: '520px',
                margin: '0 auto',
                lineHeight: 1.5,
                opacity: 0,
              }}
            >
              Recursos destinados a atención médica, hospitalizaciones y respuesta sanitaria durante uno de los años más críticos del brote.
            </p>

            {/* Nota Metodológica Académica */}
            <div
              className="scroll-reveal-econ-methodology"
              style={{
                fontSize: '0.68rem',
                color: 'rgba(255,255,255,0.25)',
                maxWidth: '550px',
                margin: '0.5rem auto 0 auto',
                lineHeight: 1.4,
                fontStyle: 'italic',
                opacity: 0,
              }}
            >
              Fuente: estimación económica del brote de dengue en Bucaramanga 2024 basada en costos directos de atención reportados en estudios colombianos y escenarios documentados del proyecto.
            </div>
          </div>

          {/* Narrative Paragraph */}
          <p
            className="scroll-reveal-text"
            style={{
              fontSize: 'clamp(0.95rem, 1.6vw, 1.25rem)',
              color: 'rgba(255,255,255,0.65)',
              maxWidth: '700px',
              margin: '0 auto 3.5rem auto',
              lineHeight: 1.75,
              position: 'relative',
              zIndex: 1,
              opacity: 0,
            }}
          >
            Bucaramanga registra <strong style={{ color: '#ff6b6b' }}>{data.totalCases2025.toLocaleString()} casos</strong> notificados durante 2025. Detrás de cada registro existe una <strong style={{ color: '#ff6b6b' }}>persona</strong>, una <strong style={{ color: '#ff6b6b' }}>familia</strong> y una <strong style={{ color: '#ff6b6b' }}>comunidad</strong> expuesta al riesgo epidemiológico.
          </p>

          {/* Micro Indicadores */}
          <div
            className="scroll-reveal-indicators"
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {[
              `• ${data.totalCases2025.toLocaleString()} Casos reportados`,
              '• Año 2025',
              '• Vigilancia SIVIGILA',
            ].map((text, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  padding: '0.55rem 1.3rem',
                  borderRadius: '100px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.75)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  opacity: 0,
                }}
              >
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* ─── ACTO 2: LA HISTORIA DEL BROTE ─── */}
        <div
          ref={act2Ref}
          style={{
            padding: '6rem 0 7rem 0',
            borderTop: '1px solid rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Ambient Narrative Halos (Cian) */}
          {/* Halo Central (Detrás del Gráfico Histórico) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(600px, 85vw)',
              height: 'min(600px, 85vw)',
              background: 'radial-gradient(circle, #00f0ff 0%, rgba(0, 240, 255, 0.4) 50%, transparent 80%)',
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
              background: 'radial-gradient(circle, #00e5ff 0%, rgba(0, 229, 255, 0.3) 50%, transparent 80%)',
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
              background: 'radial-gradient(circle, #00b8ff 0%, rgba(0, 184, 255, 0.3) 50%, transparent 80%)',
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
              background: 'radial-gradient(circle, #00f0ff 0%, rgba(0, 240, 255, 0.3) 50%, transparent 80%)',
              opacity: 0.12,
              filter: 'blur(100px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          {/* Upper Badge */}
          <span
            className="scroll-reveal-badge-act2"
            style={{
              display: 'inline-block',
              padding: '0.45rem 1.3rem',
              borderRadius: '100px',
              background: 'rgba(0, 229, 255, 0.05)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              color: '#00e5ff',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '2rem',
              boxShadow: '0 0 15px rgba(0, 229, 255, 0.12)',
              opacity: 0,
            }}
          >
            LA HISTORIA DEL BROTE
          </span>

          {/* Main Title */}
          <h2
            className="scroll-reveal-title-act2"
            style={{
              fontSize: 'clamp(1.9rem, 5vw, 4rem)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.15,
              margin: '0 0 2rem 0',
              letterSpacing: '-2px',
              opacity: 0,
            }}
          >
            UNA AMENAZA QUE
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #00f0ff, #00b8ff, #0055ff)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              CRECIÓ CON EL TIEMPO
            </span>
          </h2>

          {/* Narrative Text */}
          <p
            className="scroll-reveal-text-act2"
            style={{
              fontSize: 'clamp(0.95rem, 1.6vw, 1.25rem)',
              color: 'rgba(255,255,255,0.65)',
              maxWidth: '720px',
              margin: '0 auto 3rem auto',
              lineHeight: 1.75,
              opacity: 0,
            }}
          >
            Durante la última década, los casos de dengue han mostrado una evolución variable, alcanzando su punto más alto en <strong style={{ color: '#00f0ff' }}>{data.peakYear}</strong>, cuando se notificaron <strong style={{ color: '#00f0ff' }}>{data.peakCases.toLocaleString()} casos</strong>.
          </p>

          {/* Historical SVG Chart Container */}
          <div
            className="scroll-reveal-chart-act2"
            style={{
              position: 'relative',
              width: '100%',
              background: 'rgba(10, 15, 30, 0.45)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '24px',
              padding: '2.5rem 1.5rem 1.5rem 1.5rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              marginBottom: '3rem',
              overflow: 'visible',
              opacity: 0,
            }}
          >
            <div style={{ position: 'relative', width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ position: 'relative', width: '100%', minWidth: '780px', height: `${histH}px` }}>

                {/* Floating Peak Card */}
                <div style={{
                  position: 'absolute',
                  left: `${(peakPt.x / histW) * 100}%`,
                  top: `${(peakPt.y / histH) * 100}%`,
                  transform: inViewAct2 ? 'translate(-50%, -125%) scale(1)' : 'translate(-50%, -115%) scale(0.9)',
                  opacity: inViewAct2 ? 1 : 0,
                  transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
                  background: 'rgba(10, 15, 30, 0.85)',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '12px',
                  color: '#00f0ff',
                  fontSize: '0.8rem',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 240, 255, 0.15)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.1rem',
                }}>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', fontWeight: 600 }}>PICO HISTÓRICO</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{data.peakCases.toLocaleString()}</span>
                  <span style={{ fontSize: '0.65rem', color: '#00f0ff', fontWeight: 600 }}>{data.peakYear}</span>
                </div>

                {/* SVG Graph */}
                <svg viewBox={`0 0 ${histW} ${histH}`} style={{ display: 'block', overflow: 'visible', width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="histGradAct2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                    </linearGradient>
                    <clipPath id="histRevealAct2">
                      <rect
                        x="0"
                        y="0"
                        width={inViewAct2 ? histW : 0}
                        height={histH}
                        style={{ transition: 'width 2.2s cubic-bezier(0.22,1,0.36,1)' }}
                      />
                    </clipPath>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => (
                    <line
                      key={idx}
                      x1={histPadL}
                      y1={histPadT + histChartH - frac * histChartH}
                      x2={histW - histPadR}
                      y2={histPadT + histChartH - frac * histChartH}
                      stroke="rgba(255,255,255,0.03)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Vertical grid lines & X labels */}
                  {histPoints.map((p, i) => (
                    <g key={i}>
                      <line
                        x1={p.x}
                        y1={histPadT}
                        x2={p.x}
                        y2={histH - histPadB}
                        stroke="rgba(255,255,255,0.015)"
                        strokeWidth="1"
                      />
                      <text
                        x={p.x}
                        y={histH - 18}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.35)"
                        fontSize="11"
                        fontWeight={p.year === data.peakYear ? '700' : '400'}
                      >
                        {p.year}
                      </text>
                    </g>
                  ))}

                  {/* Curve and Area */}
                  <g clipPath="url(#histRevealAct2)">
                    <path d={histAreaPath} fill="url(#histGradAct2)" />
                    <path d={histPathData} fill="none" stroke="#00f0ff" strokeWidth="4.5" style={{ filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.3))' }} />

                    {/* Nodes */}
                    {histPoints.map((p, i) => {
                      const isPeak = p.year === data.peakYear;
                      return (
                        <g key={i}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isPeak ? 6 : 3.5}
                            fill={isPeak ? '#00f0ff' : 'rgba(255,255,255,0.5)'}
                          />
                          {isPeak && (
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={14}
                              fill="none"
                              stroke="#00f0ff"
                              strokeWidth="2.2"
                            >
                              <animate attributeName="r" values="6;22;6" dur="2.2s" repeatCount="indefinite" />
                              <animate attributeName="opacity" values="1;0;1" dur="2.2s" repeatCount="indefinite" />
                            </circle>
                          )}
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginTop: '1.5rem', margin: '0', letterSpacing: '0.5px' }}>
              Curva Histórica de Casos Totales Anuales — Visualización basada exclusivamente en los registros epidemiológicos reales.
            </p>
          </div>

          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            width: '100%',
          }}>
            {/* Card 1: Año Inicial */}
            <div className="scroll-reveal-card-act2" style={{
              background: 'rgba(10,15,30,0.65)',
              border: '1px solid rgba(0,229,255,0.12)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              boxShadow: '0 0 30px rgba(0,229,255,0.05)',
              borderRadius: '20px',
              padding: '2rem 1.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              opacity: 0,
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Año Inicial
              </span>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {data.baselineYear}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#00f0ff', fontWeight: 500 }}>
                {data.baselineCases.toLocaleString()} casos registrados
              </span>
            </div>

            {/* Card 2: Pico Epidémico */}
            <div className="scroll-reveal-card-act2" style={{
              background: 'rgba(10,15,30,0.65)',
              border: '1px solid rgba(0,229,255,0.12)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              boxShadow: '0 0 30px rgba(0,229,255,0.05)',
              borderRadius: '20px',
              padding: '2rem 1.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              opacity: 0,
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Pico Epidémico
              </span>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {data.peakYear}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#00f0ff', fontWeight: 500 }}>
                {data.peakCases.toLocaleString()} casos registrados
              </span>
            </div>

            {/* Card 3: Año Actual */}
            <div className="scroll-reveal-card-act2" style={{
              background: 'rgba(10,15,30,0.65)',
              border: '1px solid rgba(0,229,255,0.12)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              boxShadow: '0 0 30px rgba(0,229,255,0.05)',
              borderRadius: '20px',
              padding: '2rem 1.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              opacity: 0,
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Año Actual (2025)
              </span>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {data.totalCases2025.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#00f0ff', fontWeight: 500 }}>
                Casos notificados (corte parcial)
              </span>
            </div>
          </div>

          {/* Transition Phrase */}
          <p
            className="scroll-reveal-phrase-act2"
            style={{
              textAlign: 'center',
              fontSize: 'clamp(0.95rem, 1.4vw, 1.2rem)',
              color: 'rgba(255,255,255,0.55)',
              maxWidth: '650px',
              margin: '4rem auto 0 auto',
              lineHeight: 1.6,
              opacity: 0,
            }}
          >
            Los datos históricos revelan que los brotes no ocurren al azar. Comprender su <span style={{ color: '#00f0ff', fontWeight: 600 }}>evolución</span> es el primer paso para <span style={{ color: '#00f0ff', fontWeight: 600 }}>anticipar el riesgo</span>.
          </p>
        </div>

        {/* ─── ACTO 3: LAS PERSONAS DETRÁS DE LOS DATOS ─── */}
        <div
          ref={act3Ref}
          style={{
            padding: '6rem 0 7rem 0',
            borderTop: '1px solid rgba(255,255,255,0.03)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Ambient Narrative Halos (Violeta) */}
          {/* Halo Central (Detrás de los Paneles) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(600px, 85vw)',
              height: 'min(600px, 85vw)',
              background: 'radial-gradient(circle, #b300ff 0%, rgba(179, 0, 255, 0.4) 50%, transparent 80%)',
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
              background: 'radial-gradient(circle, #b300ff 0%, rgba(179, 0, 255, 0.3) 50%, transparent 80%)',
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
              background: 'radial-gradient(circle, #b300ff 0%, rgba(179, 0, 255, 0.3) 50%, transparent 80%)',
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
              background: 'radial-gradient(circle, #b300ff 0%, rgba(179, 0, 255, 0.3) 50%, transparent 80%)',
              opacity: 0.12,
              filter: 'blur(100px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* Upper Badge */}
          <span
            className="scroll-reveal-badge-act3"
            style={{
              display: 'inline-block',
              padding: '0.45rem 1.3rem',
              borderRadius: '100px',
              background: 'rgba(179, 0, 255, 0.05)',
              border: '1px solid rgba(179, 0, 255, 0.2)',
              color: '#b300ff',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '2rem',
              boxShadow: '0 0 15px rgba(179, 0, 255, 0.12)',
              opacity: 0,
            }}
          >
            LAS PERSONAS DETRÁS DE LOS DATOS
          </span>

          {/* Main Title */}
          <h2
            className="scroll-reveal-title-act3"
            style={{
              fontSize: 'clamp(1.9rem, 5vw, 4rem)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.15,
              margin: '0 0 2rem 0',
              letterSpacing: '-2px',
              opacity: 0,
            }}
          >
            EL DENGUE NO AFECTA
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #df80ff, #b300ff, #7300a3)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              A TODOS POR IGUAL
            </span>
          </h2>

          {/* Narrative Text */}
          <p
            className="scroll-reveal-text-act3"
            style={{
              fontSize: 'clamp(0.95rem, 1.6vw, 1.25rem)',
              color: 'rgba(255,255,255,0.65)',
              maxWidth: '720px',
              margin: '0 auto 3.5rem auto',
              lineHeight: 1.75,
              opacity: 0,
            }}
          >
            Los registros epidemiológicos muestran diferencias importantes entre grupos poblacionales. La edad y el sexo permiten identificar patrones clave para comprender el comportamiento del brote.
          </p>

          {/* Two Panels Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
              width: '100%',
              marginBottom: '3rem',
            }}
          >
            {/* PANEL IZQUIERDO: Distribución por sexo */}
            <div
              className="scroll-reveal-panel-left-act3"
              style={{
                background: 'rgba(10,15,30,0.65)',
                border: '1px solid rgba(179,0,255,0.12)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                boxShadow: '0 0 30px rgba(179,0,255,0.05)',
                borderRadius: '24px',
                padding: '2.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: 0,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Violet Glow behind sex donut */}
              <div
                style={{
                  position: 'absolute',
                  top: '55%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '320px',
                  height: '320px',
                  background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, rgba(124,58,237,0.02) 45%, rgba(179,0,255,0.005) 75%, transparent 100%)',
                  pointerEvents: 'none',
                  zIndex: 0,
                  filter: 'blur(70px)',
                }}
              />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '2rem', letterSpacing: '0.5px' }}>
                DISTRIBUCIÓN POR SEXO
              </h3>

              <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', flex: 1 }}>

                {/* Mujeres Legend Block */}
                <div style={{
                  flex: 1,
                  minWidth: '125px',
                  padding: '1.2rem',
                  background: 'rgba(179, 0, 255, 0.02)',
                  border: '1px solid rgba(179, 0, 255, 0.1)',
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: '0 0 20px rgba(179, 0, 255, 0.02)',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>MUJERES</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b300ff', textShadow: '0 0 10px rgba(179,0,255,0.3)', margin: '0.3rem 0' }}>
                    {data.femalePercent}%
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                    {data.femaleCases.toLocaleString()} casos
                  </span>
                </div>

                {/* Donut SVG */}
                {(() => {
                  const radius = 112; // 80 increased by 40%
                  const circumference = 2 * Math.PI * radius;
                  const femaleLen = (data.femalePercent / 100) * circumference;
                  const maleLen = (data.malePercent / 100) * circumference;
                  return (
                    <div style={{ position: 'relative', width: '240px', height: '240px' }}>
                      <svg viewBox="0 0 280 280" width="240" height="240" style={{ filter: 'drop-shadow(0 0 20px rgba(179,0,255,0.15))', maxWidth: '100%', transform: 'rotate(-90deg)' }}>
                        <circle cx="140" cy="140" r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="20" />

                        {/* Mujeres (Violet) Segment */}
                        <circle
                          cx="140"
                          cy="140"
                          r={radius}
                          fill="none"
                          stroke="#d470ffff"
                          strokeWidth="20"
                          strokeDasharray={`${femaleLen} ${circumference}`}
                          strokeDashoffset={inViewAct3 ? 0 : circumference}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.22,1,0.36,1)' }}
                        />

                        {/* Hombres (Purple) Segment */}
                        <circle
                          cx="140"
                          cy="140"
                          r={radius}
                          fill="none"
                          stroke="#b300ff"
                          strokeWidth="20"
                          strokeDasharray={`${maleLen} ${circumference}`}
                          strokeDashoffset={inViewAct3 ? 0 : circumference}
                          strokeLinecap="round"
                          transform={`rotate(${(data.femalePercent / 100) * 360} 140 140)`}
                          style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.22,1,0.36,1) 0.2s' }}
                        />
                      </svg>

                      {/* Donut Center HTML Info */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        width: '180px',
                        textAlign: 'center',
                      }}>
                        <span style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-1px' }}>
                          {data.totalCases2025.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.2rem' }}>
                          CASOS ANALIZADOS
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#b300ff', marginTop: '0.15rem' }}>
                          Año 2025
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Hombres Legend Block */}
                <div style={{
                  flex: 1,
                  minWidth: '125px',
                  padding: '1.2rem',
                  background: 'rgba(179, 0, 255, 0.02)',
                  border: '1px solid rgba(179, 0, 255, 0.1)',
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: '0 0 20px rgba(179, 0, 255, 0.02)',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>HOMBRES</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b300ff', textShadow: '0 0 10px rgba(179,0,255,0.3)', margin: '0.3rem 0' }}>
                    {data.malePercent}%
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                    {data.maleCases.toLocaleString()} casos
                  </span>
                </div>

              </div>
            </div>

            {/* PANEL DERECHO: Distribución por edad */}
            <div
              className="scroll-reveal-panel-right-act3"
              style={{
                background: 'rgba(10,15,30,0.65)',
                border: '1px solid rgba(179,0,255,0.12)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                boxShadow: '0 0 30px rgba(179,0,255,0.05)',
                borderRadius: '24px',
                padding: '2.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: 0,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Violet Glow behind age histogram */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '320px',
                  height: '320px',
                  background: 'radial-gradient(circle, rgba(179,0,255,0.05) 0%, rgba(179,0,255,0.015) 55%, transparent 75%)',
                  pointerEvents: 'none',
                  zIndex: 0,
                  filter: 'blur(70px)',
                }}
              />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', letterSpacing: '0.5px' }}>
                GRUPOS ETARIOS
              </h3>

              {(() => {
                const w = 600;
                const h = 300;
                const padL = 35;
                const padR = 20;
                const padB = 40;
                const padT = 55;
                const chartW = w - padL - padR;
                const chartH = h - padB - padT;

                const maxVal = Math.max(...data.ageDistribution.map(d => d.cases), 1);

                return (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* SVG Bar Chart Wrapper with scroll on mobile */}
                    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <div style={{ minWidth: '480px', width: '100%', height: `${h}px` }}>
                        <svg viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible', width: '100%', height: '100%' }}>

                          <defs>
                            <linearGradient id="barGradAct3" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#b300ff" />
                              <stop offset="100%" stopColor="#4d0080" />
                            </linearGradient>

                            <linearGradient id="barGradDominant" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#e066ff" />
                              <stop offset="100%" stopColor="#b300ff" />
                            </linearGradient>

                            <clipPath id="barRevealClip">
                              <rect
                                x="0"
                                y={inViewAct3 ? 0 : h}
                                width={w}
                                height={h}
                                style={{ transition: 'y 2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                              />
                            </clipPath>
                          </defs>

                          {/* Horizontal Grid lines */}
                          {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => (
                            <line
                              key={idx}
                              x1={padL}
                              y1={padT + chartH - frac * chartH}
                              x2={w - padR}
                              y2={padT + chartH - frac * chartH}
                              stroke="rgba(255,255,255,0.03)"
                              strokeWidth="1"
                            />
                          ))}

                          <g clipPath="url(#barRevealClip)">
                            {data.ageDistribution.map((d, i) => {
                              const barW = 22;
                              const step = chartW / (data.ageDistribution.length - 1 || 1);
                              const x = padL + i * step - barW / 2;
                              const barH = (d.cases / maxVal) * chartH;
                              const y = padT + chartH - barH;
                              const isDominant = d.name === data.mostAffectedAgeGroup;

                              return (
                                <g key={i}>
                                  {/* Bar Rect */}
                                  <rect
                                    x={x}
                                    y={y}
                                    width={barW}
                                    height={barH}
                                    rx="5"
                                    fill={isDominant ? 'url(#barGradDominant)' : 'url(#barGradAct3)'}
                                    stroke={isDominant ? '#b300ff' : 'none'}
                                    strokeWidth={isDominant ? 2 : 0}
                                    style={{
                                      filter: isDominant ? 'drop-shadow(0 0 10px rgba(179,0,255,0.4))' : 'drop-shadow(0 0 4px rgba(179,0,255,0.15))',
                                    }}
                                  />

                                  {/* Case Value on Top */}
                                  <text
                                    x={x + barW / 2}
                                    y={y - 8}
                                    textAnchor="middle"
                                    fill={isDominant ? '#b300ff' : 'rgba(255,255,255,0.5)'}
                                    fontSize="10"
                                    fontWeight={isDominant ? '800' : '600'}
                                  >
                                    {d.cases}
                                  </text>

                                  {/* X-axis Label */}
                                  <text
                                    x={x + barW / 2}
                                    y={h - 12}
                                    textAnchor="middle"
                                    fill={isDominant ? '#b300ff' : 'rgba(255,255,255,0.4)'}
                                    fontSize="9.5"
                                    fontWeight={isDominant ? '700' : '400'}
                                  >
                                    {d.name}
                                  </text>

                                  {/* Dominant floating label */}
                                  {isDominant && (
                                    <g>
                                      {/* Background capsule */}
                                      <rect
                                        x={x + barW / 2 - 58}
                                        y={y - 38}
                                        width="116"
                                        height="16"
                                        rx="8"
                                        fill="rgba(10, 15, 30, 0.85)"
                                        stroke="#b300ff"
                                        strokeWidth="1.2"
                                      />
                                      <text
                                        x={x + barW / 2}
                                        y={y - 27}
                                        textAnchor="middle"
                                        fill="#b300ff"
                                        fontSize="7.5"
                                        fontWeight="900"
                                        letterSpacing="0.5px"
                                      >
                                        GRUPO MÁS AFECTADO
                                      </text>
                                    </g>
                                  )}
                                </g>
                              );
                            })}
                          </g>
                        </svg>
                      </div>
                    </div>

                    {/* Insight Card */}
                    <div style={{
                      background: 'rgba(179, 0, 255, 0.02)',
                      border: '1px solid rgba(179, 0, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '1.2rem',
                      textAlign: 'left',
                      fontSize: '0.88rem',
                      lineHeight: '1.5',
                      color: 'rgba(255,255,255,0.7)',
                    }}>
                      El grupo etario con mayor incidencia corresponde a <strong style={{ color: '#b300ff' }}>{data.mostAffectedAgeGroup}</strong>, concentrando <strong style={{ color: '#b300ff' }}>{data.mostAffectedCases.toLocaleString()} registros</strong> durante el periodo analizado.
                    </div>

                  </div>
                );
              })()}
            </div>
          </div>

          {/* PANEL DE HALLAZGOS */}
          <div
            className="scroll-reveal-findings-act3"
            style={{
              width: '100%',
              background: 'rgba(10,15,30,0.65)',
              border: '1px solid rgba(179,0,255,0.12)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              boxShadow: '0 0 30px rgba(179,0,255,0.05)',
              borderRadius: '24px',
              padding: '2rem 2.5rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              opacity: 0,
            }}
          >
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b300ff', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
              HALLAZGO EPIDEMIOLÓGICO
            </h4>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0 }}>
              Los patrones demográficos observados permiten identificar los grupos poblacionales más expuestos y orientar estrategias de prevención focalizadas.
            </p>
          </div>

        </div>

        {/* ─── ACTO 4: EL IMPACTO CLÍNICO ─── */}
        <div
          ref={act4Ref}
          style={{
            padding: '6rem 0 0 0',
            borderTop: '1px solid rgba(255,255,255,0.03)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Ambient Narrative Halos (Amarillo) */}
          {/* Halo Central (Detrás del Contenido Clínico) */}
          <div
            style={{
              position: 'absolute',
              top: '45%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(600px, 85vw)',
              height: 'min(600px, 85vw)',
              background: 'radial-gradient(circle, #facc15 0%, rgba(250, 204, 21, 0.4) 50%, transparent 80%)',
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
              background: 'radial-gradient(circle, #facc15 0%, rgba(250, 204, 21, 0.3) 50%, transparent 80%)',
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
              background: 'radial-gradient(circle, #facc15 0%, rgba(250, 204, 21, 0.3) 50%, transparent 80%)',
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
              background: 'radial-gradient(circle, #facc15 0%, rgba(250, 204, 21, 0.3) 50%, transparent 80%)',
              opacity: 0.12,
              filter: 'blur(100px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          {/* Upper Badge */}
          <span
            className="scroll-reveal-badge-act4"
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
              marginBottom: '2rem',
              boxShadow: '0 0 15px rgba(250, 204, 21, 0.12)',
              opacity: 0,
            }}
          >
            IMPACTO CLÍNICO
          </span>

          {/* Main Title */}
          <h2
            className="scroll-reveal-title-act4"
            style={{
              fontSize: 'clamp(1.9rem, 5vw, 4rem)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.15,
              margin: '0 0 2rem 0',
              letterSpacing: '-2px',
              opacity: 0,
            }}
          >
            NO TODOS LOS CASOS
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #facc15, #fb923c, #ef4444)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              EVOLUCIONAN IGUAL
            </span>
          </h2>

          {/* Narrative Text */}
          <p
            className="scroll-reveal-text-act4"
            style={{
              fontSize: 'clamp(0.95rem, 1.6vw, 1.25rem)',
              color: 'rgba(255,255,255,0.65)',
              maxWidth: '720px',
              margin: '0 auto 3.5rem auto',
              lineHeight: 1.75,
              opacity: 0,
            }}
          >
            El comportamiento clínico del dengue puede variar desde cuadros leves hasta situaciones que requieren atención hospitalaria inmediata. Los datos permiten comprender la magnitud real del impacto sanitario.
          </p>

          {/* Visual Principal: Barra de Severidad */}
          <div
            className="scroll-reveal-severity-bar-act4"
            style={{
              width: '100%',
              background: 'rgba(10,15,30,0.65)',
              border: '1px solid rgba(250,204,21,0.12)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              boxShadow: '0 0 30px rgba(250,204,21,0.05)',
              borderRadius: '24px',
              padding: '2.5rem 2.5rem',
              marginBottom: '3rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '2.5rem',
              opacity: 0,
            }}
          >
            {/* Labels Above the Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              fontSize: '0.85rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}>
              {/* Sin signos label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Sin signos de alarma</span>
                <span style={{ color: '#facc15', fontSize: '1.1rem', fontWeight: 800 }}>
                  {data.sinSignosCases.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>({data.sinSignosPercent}%)</span>
                </span>
              </div>

              {/* Con signos label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Con signos de alarma</span>
                <span style={{ color: '#fb923c', fontSize: '1.1rem', fontWeight: 800 }}>
                  {data.conSignosCases.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>({data.conSignosPercent}%)</span>
                </span>
              </div>

              {/* Grave label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Dengue grave</span>
                <span style={{ color: '#ef4444', fontSize: '1.1rem', fontWeight: 800 }}>
                  {data.graveCases.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>({data.gravePercent}%)</span>
                </span>
              </div>
            </div>

            {/* The Severity Bar */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '36px',
              borderRadius: '100px',
              background: 'rgba(255,255,255,0.03)',
              overflow: 'hidden',
              display: 'flex',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              {/* Segment 1: Sin Signos (Yellow) */}
              <div style={{
                height: '100%',
                width: inViewAct4 ? `${data.sinSignosPercent}%` : '0%',
                background: '#facc15',
                boxShadow: 'inset 0 0 10px rgba(250,204,21,0.4), 0 0 10px rgba(250,204,21,0.2)',
                transition: 'width 2s cubic-bezier(0.16, 1, 0.3, 1)',
              }} />

              {/* Segment 2: Con Signos (Orange) */}
              <div style={{
                height: '100%',
                width: inViewAct4 ? `${data.conSignosPercent}%` : '0%',
                background: '#fb923c',
                boxShadow: 'inset 0 0 10px rgba(251,146,60,0.4), 0 0 10px rgba(251,146,60,0.2)',
                transition: 'width 2s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
              }} />

              {/* Segment 3: Grave (Red) */}
              <div style={{
                height: '100%',
                width: inViewAct4 ? `${data.gravePercent}%` : '0%',
                background: '#ef4444',
                boxShadow: 'inset 0 0 10px rgba(239,68,68,0.4), 0 0 10px rgba(239,68,68,0.2)',
                transition: 'width 2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
              }} />
            </div>
          </div>

          {/* Tarjetas Clínicas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            width: '100%',
            marginBottom: '3rem',
          }}>
            {/* Tarjeta 1: Sin Signos de Alarma */}
            <div
              className="scroll-reveal-clinical-card-act4"
              style={{
                background: 'rgba(10,15,30,0.65)',
                border: '1px solid rgba(250,204,21,0.12)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                boxShadow: '0 0 30px rgba(250,204,21,0.05)',
                borderRadius: '20px',
                padding: '2rem 1.8rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '0.6rem',
                opacity: 0,
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(250, 204, 21, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#facc15',
                marginBottom: '0.4rem',
                border: '1px solid rgba(250, 204, 21, 0.15)',
              }}>
                <ShieldCheck size={22} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Sin Signos de Alarma
              </span>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                {data.sinSignosCases.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#facc15', fontWeight: 600, marginTop: '-0.3rem' }}>
                {data.sinSignosPercent}% de los casos
              </span>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', margin: '0.4rem 0 0 0', lineHeight: 1.4 }}>
                Casos con evolución clínica favorable.
              </p>
            </div>

            {/* Tarjeta 2: Con Signos de Alarma */}
            <div
              className="scroll-reveal-clinical-card-act4"
              style={{
                background: 'rgba(10,15,30,0.65)',
                border: '1px solid rgba(250,204,21,0.12)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                boxShadow: '0 0 30px rgba(250,204,21,0.05)',
                borderRadius: '20px',
                padding: '2rem 1.8rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '0.6rem',
                opacity: 0,
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(251, 146, 60, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb923c',
                marginBottom: '0.4rem',
                border: '1px solid rgba(251, 146, 60, 0.15)',
              }}>
                <TriangleAlert size={22} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Con Signos de Alarma
              </span>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                {data.conSignosCases.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#fb923c', fontWeight: 600, marginTop: '-0.3rem' }}>
                {data.conSignosPercent}% de los casos
              </span>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', margin: '0.4rem 0 0 0', lineHeight: 1.4 }}>
                Pacientes que requieren seguimiento clínico prioritario.
              </p>
            </div>

            {/* Tarjeta 3: Dengue Grave */}
            <div
              className="scroll-reveal-clinical-card-act4"
              style={{
                background: 'rgba(10,15,30,0.65)',
                border: '1px solid rgba(250,204,21,0.12)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                boxShadow: '0 0 30px rgba(250,204,21,0.05)',
                borderRadius: '20px',
                padding: '2rem 1.8rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '0.6rem',
                opacity: 0,
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                marginBottom: '0.4rem',
                border: '1px solid rgba(239, 68, 68, 0.15)',
              }}>
                <HeartPulse size={22} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Dengue Grave
              </span>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                {data.graveCases.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, marginTop: '-0.3rem' }}>
                {data.gravePercent}% de los casos
              </span>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', margin: '0.4rem 0 0 0', lineHeight: 1.4 }}>
                Casos con mayor riesgo de complicaciones.
              </p>
            </div>
          </div>

          {/* KPIs de Impacto Sanitario */}
          <div
            className="scroll-reveal-kpi-row-act4"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              width: '100%',
              marginBottom: '3rem',
              opacity: 0,
            }}
          >
            {/* KPI 1: Hospitalizados */}
            <div style={{
              background: 'rgba(10,15,30,0.65)',
              border: '1px solid rgba(250,204,21,0.12)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderRadius: '20px',
              padding: '1.6rem 2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              textAlign: 'left',
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(250, 204, 21, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#facc15',
                border: '1px solid rgba(250, 204, 21, 0.15)',
              }}>
                <BedDouble size={22} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  HOSPITALIZADOS
                </span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                  {data.hospitalizedCount.toLocaleString()} <span style={{ fontSize: '0.9rem', color: '#facc15', fontWeight: 700 }}>({data.hospitalizedPercent}%)</span>
                </span>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.3 }}>
                  Pacientes que requirieron atención intrahospitalaria.
                </span>
              </div>
            </div>

            {/* KPI 2: Fallecidos */}
            <div style={{
              background: 'rgba(10,15,30,0.65)',
              border: '1px solid rgba(250,204,21,0.12)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderRadius: '20px',
              padding: '1.6rem 2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              textAlign: 'left',
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.15)',
              }}>
                <HeartPulse size={22} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  FALLECIDOS
                </span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                  {data.deadCount.toLocaleString()}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.3 }}>
                  Casos reportados como fallecidos.
                </span>
              </div>
            </div>

            {/* KPI 3: Letalidad */}
            <div style={{
              background: 'rgba(10,15,30,0.65)',
              border: '1px solid rgba(250,204,21,0.12)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderRadius: '20px',
              padding: '1.6rem 2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              textAlign: 'left',
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(251, 146, 60, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb923c',
                border: '1px solid rgba(251, 146, 60, 0.15)',
              }}>
                <Activity size={22} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  LETALIDAD
                </span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                  {data.letalidad}%
                </span>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.3 }}>
                  Tasa observada durante el periodo analizado.
                </span>
              </div>
            </div>
          </div>

          {/* Panel de Insight */}
          <div
            className="scroll-reveal-insight-act4"
            style={{
              width: '100%',
              background: 'rgba(10,15,30,0.65)',
              border: '1px solid rgba(250,204,21,0.12)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              boxShadow: '0 0 30px rgba(250,204,21,0.05)',
              borderRadius: '24px',
              padding: '2rem 2.5rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              marginBottom: '0',
              opacity: 0,
            }}
          >
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#facc15', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
              HALLAZGO CLÍNICO
            </h4>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0 }}>
              Aunque la mayoría de los pacientes presentaron cuadros sin signos de alarma (<strong style={{ color: '#facc15' }}>{data.sinSignosPercent}%</strong>), una proporción importante (<strong style={{ color: '#fb923c' }}>{data.conSignosPercent}%</strong>) requirió seguimiento clínico especializado y atención hospitalaria.
            </p>
          </div>



        </div>

      </div>

      {/* Capas Atmosféricas de Transición en la Base */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '150px',
          background: 'linear-gradient(to bottom, transparent, #0d1222)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '800px',
          height: '160px',
          background: 'radial-gradient(circle, rgba(250, 204, 21, 0.04) 0%, rgba(239, 68, 68, 0.02) 50%, transparent 80%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </section>
  );
};

export default ThreatSection;
