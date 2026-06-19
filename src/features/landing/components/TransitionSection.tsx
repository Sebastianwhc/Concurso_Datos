import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TransitionSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // GSAP ScrollTrigger animation for the narrative text elements
    gsap.fromTo(
      el.querySelectorAll('.transition-reveal'),
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1.4,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    // GSAP ScrollTrigger animation for the background SVG elements
    gsap.fromTo(
      el.querySelectorAll('.transition-reveal-bg'),
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }, []);

  return (
    <section
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '45vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0d1222 0%, #060913 100%)',
        overflow: 'hidden',
        padding: '6rem 2rem 4rem 2rem',
      }}
    >
      {/* Capas Atmosféricas de Transición (Entrada y Salida) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '150px',
          background: 'linear-gradient(to bottom, #0d1222, transparent)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '150px',
          background: 'linear-gradient(to bottom, transparent, #060913)',
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
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.05) 0%, rgba(0, 184, 255, 0.01) 50%, transparent 80%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      {/* Background Vector Topographic / Spatial Network Layer */}
      <svg
        className="transition-reveal-bg"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0,
        }}
        viewBox="0 0 1440 350"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Topographic Contour Curves */}
        <path
          d="M -100 130 C 250 180, 350 40, 750 190 C 1050 280, 1150 90, 1550 160"
          fill="none"
          stroke="rgba(0, 229, 255, 0.05)"
          strokeWidth="1.2"
          strokeDasharray="4 6"
        />
        <path
          d="M -100 170 C 200 220, 400 100, 700 240 C 980 340, 1180 130, 1550 210"
          fill="none"
          stroke="rgba(0, 184, 255, 0.035)"
          strokeWidth="1"
        />
        <path
          d="M -100 210 C 150 260, 450 150, 650 290 C 920 380, 1220 180, 1550 260"
          fill="none"
          stroke="rgba(0, 229, 255, 0.03)"
          strokeWidth="1.2"
        />

        {/* Transmission Network Connections */}
        <line x1="280" y1="90" x2="420" y2="210" stroke="rgba(0, 229, 255, 0.04)" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1="420" y1="210" x2="680" y2="150" stroke="rgba(0, 229, 255, 0.045)" strokeWidth="0.8" />
        <line x1="680" y1="150" x2="890" y2="250" stroke="rgba(0, 229, 255, 0.035)" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1="890" y1="250" x2="1140" y2="120" stroke="rgba(0, 229, 255, 0.045)" strokeWidth="0.8" />
        <line x1="420" y1="210" x2="890" y2="250" stroke="rgba(0, 229, 255, 0.025)" strokeWidth="0.8" />

        {/* Scattered Luminous Nodes with Pulse Animations */}
        <g>
          {/* Node 1 */}
          <circle cx="280" cy="90" r="3" fill="#00e5ff" opacity="0.45" />
          <circle cx="280" cy="90" r="8" fill="none" stroke="#00e5ff" strokeWidth="0.5" opacity="0.2">
            <animate attributeName="r" values="3;10;3" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0;0.35" dur="4s" repeatCount="indefinite" />
          </circle>

          {/* Node 2 */}
          <circle cx="420" cy="210" r="3.5" fill="#00b8ff" opacity="0.5" />
          <circle cx="420" cy="210" r="10" fill="none" stroke="#00b8ff" strokeWidth="0.5" opacity="0.25">
            <animate attributeName="r" values="3.5;13;3.5" dur="5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.45;0;0.45" dur="5s" repeatCount="indefinite" />
          </circle>

          {/* Node 3 */}
          <circle cx="680" cy="150" r="2.5" fill="#00e5ff" opacity="0.35" />

          {/* Node 4 */}
          <circle cx="890" cy="250" r="4" fill="#00b8ff" opacity="0.5" />
          <circle cx="890" cy="250" r="12" fill="none" stroke="#00b8ff" strokeWidth="0.5" opacity="0.2">
            <animate attributeName="r" values="4;15;4" dur="6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.45;0;0.45" dur="6s" repeatCount="indefinite" />
          </circle>

          {/* Node 5 */}
          <circle cx="1140" cy="120" r="3" fill="#00e5ff" opacity="0.4" />
        </g>

        {/* Faint Geographic Coordinate Labels */}
        <text x="295" y="93" fill="rgba(0, 229, 255, 0.14)" fontSize="8.5" fontFamily="SFMono-Regular, Consolas, monospace" letterSpacing="0.5">7.1253° N / 73.1198° W</text>
        <text x="435" y="213" fill="rgba(0, 229, 255, 0.14)" fontSize="8.5" fontFamily="SFMono-Regular, Consolas, monospace" letterSpacing="0.5">SIVIGILA GEO-REF: 68001</text>
        <text x="905" y="253" fill="rgba(0, 229, 255, 0.14)" fontSize="8.5" fontFamily="SFMono-Regular, Consolas, monospace" letterSpacing="0.5">7.0988° N / 73.0845° W</text>
        <text x="1155" y="123" fill="rgba(0, 229, 255, 0.11)" fontSize="8.5" fontFamily="SFMono-Regular, Consolas, monospace" letterSpacing="0.5">CLUSTER_DENSITY: HIGH</text>
      </svg>

      {/* Glow Ambient cian y azul consistente con Acto 5 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(750px, 95vw)',
          height: '100%',
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.04) 0%, rgba(0, 184, 255, 0.01) 50%, transparent 80%)',
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(50px)',
        }}
      />

      <div
        style={{
          maxWidth: '800px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.2rem',
        }}
      >
        {/* Revelation Title style Stripe/Linear */}
        <h2
          className="transition-reveal"
          style={{
            fontSize: 'clamp(1.6rem, 3.8vw, 2.6rem)',
            fontWeight: 800,
            letterSpacing: '1px',
            lineHeight: 1.25,
            margin: 0,
            background: 'linear-gradient(90deg, #ffffff 50%, #80f0ff 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            opacity: 0,
            textTransform: 'uppercase',
            textShadow: '0 0 40px rgba(0, 229, 255, 0.15)',
          }}
        >
          EL RIESGO TIENE UNA UBICACIÓN
        </h2>

        {/* Narrative bridge paragraph */}
        <p
          className="transition-reveal"
          style={{
            fontSize: 'clamp(0.9rem, 1.4vw, 1.15rem)',
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: 1.8,
            margin: 0,
            fontWeight: 400,
            opacity: 0,
          }}
        >
          Comprender el impacto clínico es solo una parte de la historia. Cada caso ocurre en un territorio específico y, cuando los datos se observan en conjunto, comienzan a aparecer patrones espaciales que revelan dónde se concentra el riesgo.
        </p>
      </div>
    </section>
  );
};

export default TransitionSection;
