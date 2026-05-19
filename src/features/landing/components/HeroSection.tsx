import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ParticleCanvas from './ParticleCanvas';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HeroSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({
      delay: 0.3,
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });

    tl.fromTo(
      titleRef.current,
      { opacity: 0, y: 60, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: 'power3.out' }
    )
      .fromTo(
        subtitleRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
        '-=0.8'
      )
      .fromTo(
        scrollHintRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
        '-=0.3'
      );

    gsap.to(scrollHintRef.current, {
      y: 12,
      duration: 1.5,
      ease: 'power1.inOut',
      yoyo: true,
      repeat: -1,
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 50%, #0d1425 0%, #0b0f19 60%, #050810 100%)',
      }}
    >
      <ParticleCanvas />

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,8,16,0.8) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          maxWidth: '900px',
          width: '100%',
          padding: '0 1.5rem',
        }}
      >
        <div
          className="hero-badge"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1.5rem',
            marginBottom: '2rem',
            borderRadius: '100px',
            background: 'rgba(0, 240, 255, 0.08)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            color: '#00f0ff',
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}
        >
          Datos al Ecosistema 2026 · IA para Colombia
        </div>

        <h1
          ref={titleRef}
          style={{
            fontSize: 'clamp(1.75rem, 5vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            color: '#fff',
            opacity: 0,
            margin: '0 0 1.5rem 0',
          }}
        >
          No podemos detener el clima.
          <br />
          <span
            style={{
              background: 'linear-gradient(90deg, #00f0ff, #b300ff)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Pero podemos anticipar la epidemia.
          </span>
        </h1>

        <p
          ref={subtitleRef}
          style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.35rem)',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: 1.7,
            opacity: 0,
          }}
        >
          Presentamos el primer simulador predictivo de Dengue impulsado por
          Inteligencia Artificial para Bucaramanga.
        </p>
      </div>

      {/* Scroll indicator */}
      <div
        ref={scrollHintRef}
        style={{
          position: 'absolute',
          bottom: '2.5rem',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          opacity: 0,
          cursor: 'pointer',
        }}
        onClick={() => {
          document.getElementById('threat')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          Descubre cómo
        </span>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(0,240,255,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 13l5 5 5-5" />
          <path d="M7 6l5 5 5-5" />
        </svg>
      </div>

      <style>{`
        @media (max-width: 480px) {
          #hero .hero-badge {
            font-size: 0.6rem !important;
            letter-spacing: 0.5px !important;
            padding: 0.35rem 0.75rem !important;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
