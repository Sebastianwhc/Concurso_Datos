import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Database, Activity, MapPinned, CloudRain, Building2, ShieldCheck, Server } from 'lucide-react';
import { useT } from '../../../i18n/useT';

gsap.registerPlugin(ScrollTrigger);

interface Source {
  icon: React.ReactNode;
  name: string;
  entity: string;
  detail: string;
  tag: string;
  open: boolean; // true = dato abierto; false = convenio/semiprivado
}

const SourcesSection: React.FC = () => {
  const { t } = useT();
  const sectionRef = useRef<HTMLElement>(null);

  const sources: Source[] = [
    {
      icon: <Database size={22} />,
      name: t.sources.card1Name,
      entity: 'INS · datos.gov.co',
      detail: t.sources.card1Detail,
      tag: t.sources.tagOpen,
      open: true,
    },
    {
      icon: <Activity size={22} />,
      name: t.sources.card2Name,
      entity: 'INS',
      detail: t.sources.card2Detail,
      tag: t.sources.tagOpen,
      open: true,
    },
    {
      icon: <MapPinned size={22} />,
      name: t.sources.card3Name,
      entity: 'DANE · Marco Geoestadístico Nacional',
      detail: t.sources.card3Detail,
      tag: t.sources.tagOpen,
      open: true,
    },
    {
      icon: <CloudRain size={22} />,
      name: t.sources.card4Name,
      entity: 'IDEAM · CDMB',
      detail: t.sources.card4Detail,
      tag: t.sources.tagOpen,
      open: true,
    },
    {
      icon: <Building2 size={22} />,
      name: t.sources.card5Name,
      entity: 'Geoportales AMB · Floridablanca',
      detail: t.sources.card5Detail,
      tag: t.sources.tagOpen,
      open: true,
    },
    {
      icon: <ShieldCheck size={22} />,
      name: t.sources.card6Name,
      entity: 'Convenio · Clínica FOSCAL',
      detail: t.sources.card6Detail,
      tag: t.sources.tagAgreement,
      open: false,
    },
  ];

  useEffect(() => {
    if (!sectionRef.current) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.set(sectionRef.current.querySelectorAll('.src-reveal, .src-card, .src-strip'), { opacity: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      },
    });

    tl.fromTo(
      sectionRef.current.querySelectorAll('.src-reveal'),
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power3.out' }
    )
      .fromTo(
        sectionRef.current.querySelectorAll('.src-card'),
        { opacity: 0, y: 40, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.1, ease: 'power3.out' },
        '-=0.7'
      )
      .fromTo(
        sectionRef.current.querySelector('.src-strip'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
        '-=0.5'
      );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="fuentes"
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
        overflow: 'hidden',
      }}
    >
      {/* Ambient Narrative Halos (Cian) — modestos por rendimiento */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '-8%',
          transform: 'translate(-50%, -50%)',
          width: 'min(750px, 95vw)',
          height: 'min(750px, 95vw)',
          background: 'radial-gradient(circle, #00e5ff 0%, rgba(0, 229, 255, 0.35) 50%, transparent 80%)',
          opacity: 0.14,
          filter: 'blur(110px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '75%',
          right: '-10%',
          transform: 'translate(50%, -50%)',
          width: 'min(800px, 100vw)',
          height: 'min(800px, 100vw)',
          background: 'radial-gradient(circle, #00b8ff 0%, rgba(0, 184, 255, 0.3) 50%, transparent 80%)',
          opacity: 0.16,
          filter: 'blur(120px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: '1100px', width: '100%', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'center', alignItems: 'center', maxWidth: '820px', margin: '0 auto' }}>
          <span
            className="src-reveal"
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
              width: 'fit-content',
              opacity: 0,
              boxShadow: '0 0 15px rgba(0, 229, 255, 0.12)',
            }}
          >
            {t.sources.badge}
          </span>

          <h2
            className="src-reveal"
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
            {t.sources.titleLine1}
            <br />
            <span style={{
              background: 'linear-gradient(90deg, #00f0ff, #00b8ff, #b300ff)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: 900,
            }}>
              {t.sources.titleLine2}
            </span>
          </h2>

          <p
            className="src-reveal"
            style={{
              fontSize: 'clamp(0.95rem, 1.5vw, 1.2rem)',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.8,
              margin: 0,
              opacity: 0,
            }}
          >
            {t.sources.desc}
          </p>
        </div>

        {/* Grid de fuentes */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.4rem',
            width: '100%',
          }}
        >
          {sources.map((s, i) => {
            const accent = s.open ? '0, 229, 255' : '179, 0, 255'; // cian abierto · morado convenio
            return (
              <div
                key={i}
                className="src-card"
                style={{
                  background: 'rgba(10, 15, 30, 0.65)',
                  border: `1px solid rgba(${accent}, 0.14)`,
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                  boxShadow: `0 0 30px rgba(${accent}, 0.04)`,
                  borderRadius: '20px',
                  padding: '1.9rem 1.6rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.7rem',
                  opacity: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: `rgba(${accent}, 0.08)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: s.open ? '#00e5ff' : '#c46bff',
                    border: `1px solid rgba(${accent}, 0.18)`,
                  }}>
                    {s.icon}
                  </div>
                  <span style={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: s.open ? '#00e5ff' : '#c46bff',
                    background: `rgba(${accent}, 0.08)`,
                    border: `1px solid rgba(${accent}, 0.2)`,
                    borderRadius: '100px',
                    padding: '0.25rem 0.7rem',
                    whiteSpace: 'nowrap',
                  }}>
                    {s.tag}
                  </span>
                </div>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginTop: '0.3rem' }}>
                  {s.name}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: s.open ? 'rgba(0,229,255,0.75)' : 'rgba(196,107,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {s.entity}
                </span>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
                  {s.detail}
                </p>
              </div>
            );
          })}
        </div>

        {/* Franja de tratamiento */}
        <div
          className="src-strip"
          style={{
            background: 'rgba(10, 15, 30, 0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '20px',
            padding: '1.8rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.4rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            textAlign: 'center',
            opacity: 0,
          }}
        >
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(0, 229, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00e5ff',
            border: '1px solid rgba(0, 229, 255, 0.18)',
            flexShrink: 0,
          }}>
            <Server size={22} />
          </div>
          <p style={{ fontSize: 'clamp(0.85rem, 1.4vw, 1.05rem)', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6, maxWidth: '760px' }}>
            <strong style={{ color: '#fff' }}>{t.sources.treatmentTitle}</strong> {t.sources.treatmentDesc}
          </p>
        </div>
      </div>
    </section>
  );
};

export default SourcesSection;
