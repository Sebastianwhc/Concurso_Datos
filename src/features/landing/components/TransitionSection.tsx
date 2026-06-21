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

    // GSAP Scroll Parallax effect on the background graphics
    gsap.fromTo(
      el.querySelector('.transition-reveal-bg'),
      { y: -45 },
      {
        y: 45,
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1, // smooth scrub
        }
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
          height: '140%', // slightly taller to accommodate vertical parallax drift
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0,
        }}
        viewBox="0 0 1440 400"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Topographic Contour Curves (Animated current flows) */}
        <path
          className="contour-line-1"
          d="M -100 130 C 250 180, 350 40, 750 190 C 1050 280, 1150 90, 1550 160"
          fill="none"
          stroke="rgba(0, 229, 255, 0.09)"
          strokeWidth="1.2"
          strokeDasharray="6 8"
        />
        <path
          className="contour-line-2"
          d="M -100 170 C 200 220, 400 100, 700 240 C 980 340, 1180 130, 1550 210"
          fill="none"
          stroke="rgba(0, 184, 255, 0.065)"
          strokeWidth="1"
          strokeDasharray="8 10"
        />
        <path
          className="contour-line-3"
          d="M -100 210 C 150 260, 450 150, 650 290 C 920 380, 1220 180, 1550 260"
          fill="none"
          stroke="rgba(0, 229, 255, 0.055)"
          strokeWidth="1.2"
          strokeDasharray="5 7"
        />

        {/* Transmission Network Connections (Pulsating) */}
        <line x1="280" y1="90" x2="420" y2="210" className="network-line" stroke="rgba(0, 229, 255, 0.06)" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1="420" y1="210" x2="680" y2="150" className="network-line" stroke="rgba(0, 229, 255, 0.07)" strokeWidth="0.8" />
        <line x1="680" y1="150" x2="890" y2="250" className="network-line" stroke="rgba(0, 229, 255, 0.05)" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1="890" y1="250" x2="1140" y2="120" className="network-line" stroke="rgba(0, 229, 255, 0.07)" strokeWidth="0.8" />
        <line x1="420" y1="210" x2="890" y2="250" className="network-line" stroke="rgba(0, 229, 255, 0.045)" strokeWidth="0.8" />

        {/* Scattered Luminous Nodes with Pulse Animations */}
        <g>
          {/* Node 1 */}
          <circle cx="280" cy="90" r="3" fill="#00e5ff" className="glow-dot" />
          <circle cx="280" cy="90" r="8" fill="none" stroke="#00e5ff" strokeWidth="0.5" className="glow-circle-1" />

          {/* Node 2 */}
          <circle cx="420" cy="210" r="3.5" fill="#00b8ff" className="glow-dot" />
          <circle cx="420" cy="210" r="10" fill="none" stroke="#00b8ff" strokeWidth="0.5" className="glow-circle-2" />

          {/* Node 3 */}
          <circle cx="680" cy="150" r="2.5" fill="#00e5ff" className="glow-dot" />

          {/* Node 4 */}
          <circle cx="890" cy="250" r="4" fill="#00b8ff" className="glow-dot" />
          <circle cx="890" cy="250" r="12" fill="none" stroke="#00b8ff" strokeWidth="0.5" className="glow-circle-3" />

          {/* Node 5 */}
          <circle cx="1140" cy="120" r="3" fill="#00e5ff" className="glow-dot" />
        </g>

        {/* Faint Geographic Coordinate Labels (Satellite Tracker Flicker) */}
        <text x="295" y="93" className="coord-text-1" fill="rgba(0, 229, 255, 0.25)" fontSize="8.5" fontFamily="SFMono-Regular, Consolas, monospace" letterSpacing="0.5">7.1253° N / 73.1198° W</text>
        <text x="435" y="213" className="coord-text-2" fill="rgba(0, 229, 255, 0.25)" fontSize="8.5" fontFamily="SFMono-Regular, Consolas, monospace" letterSpacing="0.5">SIVIGILA GEO-REF: 68001</text>
        <text x="905" y="253" className="coord-text-3" fill="rgba(0, 229, 255, 0.25)" fontSize="8.5" fontFamily="SFMono-Regular, Consolas, monospace" letterSpacing="0.5">7.0988° N / 73.0845° W</text>
        <text x="1155" y="123" className="coord-text-4" fill="rgba(0, 229, 255, 0.2)" fontSize="8.5" fontFamily="SFMono-Regular, Consolas, monospace" letterSpacing="0.5">CLUSTER_DENSITY: HIGH</text>
      </svg>

      {/* Glow Ambient cian y azul consistente con Acto 5 */}
      <div
        className="transition-glow"
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

      <style>{`
        .contour-line-1 { animation: flowLine1 15s linear infinite; }
        .contour-line-2 { animation: flowLine2 22s linear infinite reverse; }
        .contour-line-3 { animation: flowLine3 18s linear infinite; }
        
        .network-line { animation: netPulse 4s ease-in-out infinite alternate; }
        
        .glow-dot { animation: dotGlow 2.5s ease-in-out infinite alternate; }
        .glow-circle-1 { animation: circlePulse1 3.5s linear infinite; }
        .glow-circle-2 { animation: circlePulse2 4.2s linear infinite; }
        .glow-circle-3 { animation: circlePulse3 4.8s linear infinite; }
        
        .coord-text-1 { animation: textFlicker 3s infinite 0.2s alternate; }
        .coord-text-2 { animation: textFlicker 4s infinite 1.2s alternate; }
        .coord-text-3 { animation: textFlicker 3.5s infinite 0.7s alternate; }
        .coord-text-4 { animation: textFlicker 5s infinite 2.2s alternate; }

        @keyframes flowLine1 { to { stroke-dashoffset: -100; } }
        @keyframes flowLine2 { to { stroke-dashoffset: -120; } }
        @keyframes flowLine3 { to { stroke-dashoffset: -90; } }

        @keyframes netPulse {
          0% { stroke-opacity: 0.35; stroke-dashoffset: 0; }
          100% { stroke-opacity: 0.95; stroke-dashoffset: 15; }
        }

        @keyframes dotGlow {
          0% { fill-opacity: 0.55; filter: drop-shadow(0 0 2px rgba(0, 229, 255, 0.4)); }
          100% { fill-opacity: 1; filter: drop-shadow(0 0 10px rgba(0, 229, 255, 0.95)); }
        }

        @keyframes circlePulse1 {
          0% { r: 3px; stroke-opacity: 0.65; }
          100% { r: 16px; stroke-opacity: 0; }
        }
        @keyframes circlePulse2 {
          0% { r: 3.5px; stroke-opacity: 0.65; }
          100% { r: 20px; stroke-opacity: 0; }
        }
        @keyframes circlePulse3 {
          0% { r: 4px; stroke-opacity: 0.65; }
          100% { r: 24px; stroke-opacity: 0; }
        }

        @keyframes textFlicker {
          0% { fill-opacity: 0.25; }
          40% { fill-opacity: 0.18; }
          43% { fill-opacity: 0.65; }
          45% { fill-opacity: 0.18; }
          70% { fill-opacity: 0.65; }
          72% { fill-opacity: 0.22; }
          100% { fill-opacity: 0.7; }
        }
      `}</style>
    </section>
  );
};

export default TransitionSection;
