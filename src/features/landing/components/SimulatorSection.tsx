import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SimulatorSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  const [temperature, setTemperature] = useState(31);
  const [precipitation, setPrecipitation] = useState(65);
  const [projecting, setProjecting] = useState(false);
  const [projected, setProjected] = useState(false);

  useEffect(() => {
    if (!sectionRef.current || !mockupRef.current) return;

    gsap.fromTo(
      sectionRef.current.querySelectorAll('.sim-text'),
      { opacity: 0, y: 50 },
      {
        opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 65%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    gsap.fromTo(
      mockupRef.current,
      { opacity: 0, y: 80, scale: 0.92 },
      {
        opacity: 1, y: 0, scale: 1, duration: 1.5, ease: 'power3.out',
        scrollTrigger: {
          trigger: mockupRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    // Background Particle Canvas (Cian, Azul, Violeta, Púrpura)
    const canvas = canvasRef.current;
    let handleResize = () => {};
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        interface Particle {
          x: number;
          y: number;
          vx: number;
          vy: number;
          radius: number;
          alpha: number;
          color: string;
        }

        const particles: Particle[] = [];
        const PARTICLE_COUNT = 90;
        const colors = [
          'rgba(0, 229, 255,',  // cian (#00e5ff)
          'rgba(0, 184, 255,',  // azul (#00b8ff)
          'rgba(124, 58, 237,', // violeta (#7c3aed)
          'rgba(147, 51, 234,', // púrpura (#9333ea)
        ];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.28,
            vy: (Math.random() - 0.5) * 0.28,
            radius: Math.random() * 2.8 + 0.8,
            alpha: Math.random() * 0.45 + 0.2,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }

        const animate = () => {
          if (!canvas || !ctx) return;
          ctx.clearRect(0, 0, width, height);

          // Draw dynamic connections
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            for (let j = i + 1; j < particles.length; j++) {
              const other = particles[j];
              const dx = p.x - other.x;
              const dy = p.y - other.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 130) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0, 229, 255, ${0.18 * (1 - dist / 130)})`;
                ctx.lineWidth = 0.65;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(other.x, other.y);
                ctx.stroke();
              }
            }
          }

          // Draw particles
          for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `${p.color}${p.alpha})`;
            ctx.fill();

            // Subtle outer glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = `${p.color}${p.alpha * 0.25})`;
            ctx.fill();
          }

          animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        handleResize = () => {
          if (!canvas) return;
          width = window.innerWidth;
          height = window.innerHeight;
          canvas.width = width;
          canvas.height = height;
        };
        window.addEventListener('resize', handleResize);
      }
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleProject = () => {
    setProjecting(true);
    setTimeout(() => {
      setProjecting(false);
      setProjected(true);
    }, 2000);
  };

  const riskLevel = temperature > 30 && precipitation > 50 ? 'ALTO' : temperature > 28 ? 'MEDIO' : 'BAJO';
  const riskColor = riskLevel === 'ALTO' ? '#ef4444' : riskLevel === 'MEDIO' ? '#eab308' : '#22c55e';
  const estimatedCases = Math.round((temperature * 2.5 + precipitation * 0.8) * (1 + Math.random() * 0.1));

  return (
    <section
      ref={sectionRef}
      id="simulator"
      style={{
        position: 'relative', width: '100%', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '6rem 1.5rem',
        // Fondo con gradiente unificado para evitar fondo plano y mantener la profundidad visual
        background: 'linear-gradient(180deg, #0b0f19 0%, #070a14 50%, #0b0f19 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Background Wrapper with Progressive Reveal Mask (Hace que todo emerja gradualmente) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.01) 20%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.15) 48%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.8) 84%, rgba(0,0,0,1) 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.01) 20%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.15) 48%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.8) 84%, rgba(0,0,0,1) 100%)',
        }}
      >
        {/* Background Particle Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />

        {/* Holographic Digital Grid */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `
              radial-gradient(rgba(0, 229, 255, 0.12) 1.2px, transparent 1.2px),
              linear-gradient(rgba(0, 229, 255, 0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 229, 255, 0.035) 1px, transparent 1px)
            `,
            backgroundSize: '36px 36px',
            opacity: 0.55,
          }}
        />

        {/* Ambient Atmospheric Glow Layers (Cyan, Azul, Violeta, Púrpura) */}
        {/* Halo 1 (Top Left): Cyan */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '-5%',
            width: 'min(650px, 90vw)',
            height: 'min(650px, 90vw)',
            background: 'radial-gradient(circle, rgba(0, 229, 255, 0.32) 0%, rgba(0, 184, 255, 0.08) 50%, rgba(0, 184, 255, 0) 80%)',
            filter: 'blur(100px)',
          }}
        />

        {/* Halo 2 (Bottom Right): Purple */}
        <div
          style={{
            position: 'absolute',
            bottom: '-5%',
            right: '-5%',
            width: 'min(700px, 95vw)',
            height: 'min(700px, 95vw)',
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.28) 0%, rgba(124, 58, 237, 0.06) 50%, rgba(124, 58, 237, 0) 80%)',
            filter: 'blur(110px)',
          }}
        />

        {/* Halo 3 (Right Middle): Blue */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '-10%',
            width: 'min(600px, 80vw)',
            height: 'min(600px, 80vw)',
            background: 'radial-gradient(circle, rgba(0, 184, 255, 0.26) 0%, rgba(124, 58, 237, 0.04) 55%, rgba(124, 58, 237, 0) 80%)',
            filter: 'blur(90px)',
          }}
        />

        {/* Halo 4 (Left Bottom): Purple/Cyan */}
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '-10%',
            width: 'min(600px, 80vw)',
            height: 'min(600px, 80vw)',
            background: 'radial-gradient(circle, rgba(0, 229, 255, 0.24) 0%, rgba(147, 51, 234, 0.04) 55%, rgba(147, 51, 234, 0) 80%)',
            filter: 'blur(95px)',
          }}
        />

        {/* Giant Radial Halo behind the Simulator Panel (Cyan + Violet Mix) - Moved down to 65% */}
        <div
          style={{
            position: 'absolute',
            top: '65%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(850px, 110vw)',
            height: 'min(850px, 110vw)',
            background: 'radial-gradient(circle, rgba(0, 229, 255, 0.35) 0%, rgba(124, 58, 237, 0.22) 45%, rgba(147, 51, 234, 0.05) 70%, rgba(147, 51, 234, 0) 85%)',
            filter: 'blur(120px)',
          }}
        />

        {/* SVG Circuits & Tech Connections */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.45,
          }}
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="circGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#00b8ff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="circGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Circuit lines */}
          <path d="M-100,150 L300,150 L450,280 L950,280 L1050,180 L1600,180" fill="none" stroke="url(#circGrad1)" strokeWidth="1.5" />
          <path d="M-100,750 L400,750 L520,630 L880,630 L980,730 L1600,730" fill="none" stroke="url(#circGrad2)" strokeWidth="1.5" />
          <path d="M250,-100 L250,220 L370,340 L370,800" fill="none" stroke="url(#circGrad1)" strokeWidth="1" strokeDasharray="4,4" />
          <path d="M1180,1000 L1180,680 L1060,560 L1060,100" fill="none" stroke="url(#circGrad2)" strokeWidth="1" strokeDasharray="4,4" />
          
          {/* Network connections */}
          <line x1="300" y1="150" x2="370" y2="340" stroke="#00b8ff" strokeWidth="0.5" strokeOpacity="0.25" />
          <line x1="450" y1="280" x2="520" y2="630" stroke="#7c3aed" strokeWidth="0.5" strokeOpacity="0.25" />
          <line x1="950" y1="280" x2="880" y2="630" stroke="#7c3aed" strokeWidth="0.5" strokeOpacity="0.25" />
          <line x1="1050" y1="180" x2="1060" y2="560" stroke="#00e5ff" strokeWidth="0.5" strokeOpacity="0.25" />

          {/* Nodes */}
          <circle cx="300" cy="150" r="4.5" fill="#00e5ff" className="glow-node-1" />
          <circle cx="450" cy="280" r="5" fill="#7c3aed" className="glow-node-2" />
          <circle cx="950" cy="280" r="4" fill="#9333ea" className="glow-node-3" />
          <circle cx="1050" cy="180" r="4.5" fill="#00b8ff" className="glow-node-4" />
          
          <circle cx="400" cy="750" r="4" fill="#9333ea" className="glow-node-1" />
          <circle cx="520" cy="630" r="5.5" fill="#00e5ff" className="glow-node-2" />
          <circle cx="880" cy="630" r="4" fill="#00b8ff" className="glow-node-3" />
          <circle cx="980" cy="730" r="4.5" fill="#7c3aed" className="glow-node-4" />
        </svg>
      </div>

      {/* Top Transition Blend Gradient Overlay (Funde el fondo de CostSection con el de Simulator) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '220px',
          background: 'linear-gradient(180deg, #0b0f19 0%, rgba(11, 15, 25, 0) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Noise Texture Overlay to prevent gradient banding and add a premium cinematic texture */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: 0.018,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <div style={{ maxWidth: '1100px', width: '100%', position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span
            className="sim-text"
            style={{
              display: 'inline-block', padding: '0.4rem 1.2rem', borderRadius: '100px',
              background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)',
              color: '#00e5ff', fontSize: '0.8rem', fontWeight: 600,
              letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '1.5rem', opacity: 0,
              boxShadow: '0 0 15px rgba(0, 229, 255, 0.1)',
            }}
          >
            LA SOLUCIÓN AVANZADA
          </span>

          <h2
            className="sim-text"
            style={{
              fontSize: 'clamp(1.4rem, 3.5vw, 2.8rem)', fontWeight: 800,
              color: '#fff', lineHeight: 1.2, margin: '0 0 1.5rem 0', opacity: 0,
            }}
          >
            Simulador Predictivo con{' '}
            <span style={{ background: 'linear-gradient(90deg, #00e5ff, #7c3aed, #9333ea)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              Inteligencia Artificial
            </span>
          </h2>

          <p
            className="sim-text"
            style={{
              fontSize: 'clamp(0.9rem, 1.4vw, 1.15rem)', color: 'rgba(255,255,255,0.5)',
              maxWidth: '650px', margin: '0 auto', lineHeight: 1.7, opacity: 0,
            }}
          >
            Cruzamos datos abiertos del <strong style={{ color: 'rgba(255,255,255,0.8)' }}>SIVIGILA</strong> con telemetría
            climática en tiempo real de la <strong style={{ color: 'rgba(255,255,255,0.8)' }}>CDMB</strong> —
            humedad, temperatura y precipitaciones — para proyectar el impacto semana a semana.
          </p>
        </div>

        {/* Glassmorphism Mockup */}
        <div
          ref={mockupRef}
          className="sim-mockup"
          style={{
            background: 'linear-gradient(135deg, rgba(8, 14, 30, 0.7) 0%, rgba(17, 10, 36, 0.7) 100%)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(0, 229, 255, 0.15)',
            borderRadius: '28px',
            padding: '2.5rem',
            maxWidth: '680px',
            width: '100%',
            margin: '0 auto',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(0, 229, 255, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            opacity: 0,
          }}
        >
          {/* Header bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #00e5ff, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                🧠
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Motor Predictivo v2.0</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>LSTM + Variables Climáticas</div>
              </div>
            </div>
            <div style={{ padding: '0.3rem 0.8rem', borderRadius: '100px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
              ● En línea
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            {/* Temperature */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>🌡️ Temperatura Promedio</label>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ff6600' }}>{temperature}°C</span>
              </div>
              <input
                type="range" min="20" max="40" value={temperature}
                onChange={(e) => { setTemperature(Number(e.target.value)); setProjected(false); }}
                style={{ width: '100%', height: '6px', borderRadius: '3px', appearance: 'none', background: 'linear-gradient(90deg, #22c55e 0%, #eab308 50%, #ef4444 100%)', outline: 'none', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>20°C</span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>40°C</span>
              </div>
            </div>

            {/* Precipitation */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>🌧️ Precipitación Semanal</label>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#00b8ff' }}>{precipitation} mm</span>
              </div>
              <input
                type="range" min="0" max="150" value={precipitation}
                onChange={(e) => { setPrecipitation(Number(e.target.value)); setProjected(false); }}
                style={{ width: '100%', height: '6px', borderRadius: '3px', appearance: 'none', background: 'linear-gradient(90deg, #0066aa 0%, #00b8ff 50%, #00f0ff 100%)', outline: 'none', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>0 mm</span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>150 mm</span>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={handleProject}
              disabled={projecting}
              style={{
                width: '100%', padding: '1rem', borderRadius: '14px', border: 'none',
                background: projecting ? 'rgba(0,229,255,0.2)' : 'linear-gradient(135deg, #00e5ff 0%, #00b8ff 50%, #7c3aed 100%)',
                color: projecting ? 'rgba(255,255,255,0.6)' : '#000',
                fontSize: '1rem', fontWeight: 700,
                cursor: projecting ? 'wait' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: projecting ? 'none' : '0 0 30px rgba(0,229,255,0.35)',
                letterSpacing: '0.5px',
              }}
            >
              {projecting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  Calculando proyección...
                </span>
              ) : '⚡ Proyectar Semana 38'}
            </button>

            {/* Results */}
            {projected && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.45)',
                borderRadius: '16px',
                padding: '1.5rem',
                border: `1px solid ${riskColor}40`,
                boxShadow: `0 0 20px ${riskColor}08`,
                animation: 'fadeInUp 0.5s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>Resultado de Proyección — SE 38</span>
                  <span style={{ padding: '0.2rem 0.7rem', borderRadius: '100px', background: `${riskColor}20`, color: riskColor, fontSize: '0.75rem', fontWeight: 700 }}>
                    Riesgo {riskLevel}
                  </span>
                </div>
                <div className="sim-results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: 'clamp(1.2rem,3vw,1.5rem)', fontWeight: 800, color: riskColor }}>{estimatedCases}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Casos estimados</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'clamp(1.2rem,3vw,1.5rem)', fontWeight: 800, color: '#00e5ff' }}>87%</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Confianza modelo</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'clamp(1.2rem,3vw,1.5rem)', fontWeight: 800, color: '#7c3aed' }}>3</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Comunas críticas</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom text */}
        <p
          className="sim-text"
          style={{
            textAlign: 'center', fontSize: 'clamp(0.9rem, 1.3vw, 1.1rem)',
            color: 'rgba(255,255,255,0.45)', maxWidth: '600px',
            margin: '3rem auto 0', lineHeight: 1.7, opacity: 0,
          }}
        >
          Proyectamos el impacto semana a semana para que los hospitales y secretarías de salud
          actúen <strong style={{ color: '#fff' }}>antes de que la línea roja sea cruzada.</strong>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .glow-node-1 { animation: pulseGlow 3s infinite alternate; }
        .glow-node-2 { animation: pulseGlow 4s infinite alternate-reverse; }
        .glow-node-3 { animation: pulseGlow 2.5s infinite alternate; }
        .glow-node-4 { animation: pulseGlow 3.5s infinite alternate-reverse; }
        
        @keyframes pulseGlow {
          0% { r: 4px; fill-opacity: 0.5; filter: drop-shadow(0 0 4px rgba(0,229,255,0.5)); }
          100% { r: 9px; fill-opacity: 1; filter: drop-shadow(0 0 15px rgba(0,229,255,1)) drop-shadow(0 0 30px rgba(124, 58, 237, 0.85)); }
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          cursor: pointer; box-shadow: 0 0 10px rgba(0,229,255,0.5); border: 2px solid rgba(0,229,255,0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          cursor: pointer; box-shadow: 0 0 10px rgba(0,229,255,0.5); border: 2px solid rgba(0,229,255,0.5);
        }
        @media (max-width: 480px) {
          .sim-results-grid { grid-template-columns: 1fr 1fr !important; }
          .sim-results-grid > div:last-child { grid-column: 1 / -1; }
        }
      `}</style>
    </section>
  );
};

export default SimulatorSection;
