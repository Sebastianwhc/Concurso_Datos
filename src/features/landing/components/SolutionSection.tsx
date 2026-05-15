import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/*
 * Endemic Channel chart — Traditional epidemiological surveillance tool
 * Three zones: success (green), safety (yellow), epidemic (red)
 * Plus an animated "real cases" black line approaching the red zone.
 */

const EndemicChannelChart: React.FC<{ inView: boolean }> = ({ inView }) => {
  const w = 700;
  const h = 340;
  const padL = 60;
  const padR = 30;
  const padT = 30;
  const padB = 50;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const weeks = Array.from({ length: 52 }, (_, i) => i + 1);
  const xScale = (wk: number) => padL + ((wk - 1) / 51) * chartW;
  const yScale = (val: number) => padT + chartH - (val / 120) * chartH;

  // Zone boundaries (cases per epidemiological week)
  const successLine = [15, 14, 12, 11, 10, 9, 10, 12, 14, 16, 18, 20, 22, 25, 28, 30, 32, 33, 34, 33, 30, 28, 25, 22, 20, 18, 16, 15, 14, 15, 18, 22, 28, 32, 35, 38, 40, 42, 44, 42, 38, 34, 30, 26, 22, 18, 16, 14, 13, 12, 13, 14];
  const safetyLine = [30, 28, 25, 23, 22, 20, 22, 25, 28, 32, 36, 40, 44, 48, 52, 55, 58, 60, 62, 60, 55, 50, 45, 40, 36, 32, 30, 28, 27, 28, 32, 38, 48, 55, 60, 65, 68, 72, 75, 72, 65, 58, 50, 44, 38, 32, 28, 26, 25, 24, 25, 28];
  const epidemicLine = [50, 46, 42, 38, 36, 34, 36, 40, 45, 50, 56, 62, 68, 74, 80, 85, 88, 92, 95, 92, 85, 78, 70, 62, 55, 50, 46, 44, 42, 44, 50, 58, 70, 80, 88, 95, 100, 105, 108, 105, 95, 85, 75, 65, 56, 48, 42, 40, 38, 37, 38, 42];
  // Real cases (approaching epidemic line)
  const realCases = [22, 20, 18, 16, 15, 18, 22, 28, 32, 38, 42, 48, 55, 60, 65, 70, 74, 78, 82, 80, 72, 65, 55, 48, 42, 36, 32, 30, 32, 38, 45, 55, 65, 75, 82, 88, 92, 95, 98, 94, 85, 75, 62, 52, 44, 36, 30, 28, 26, 25, 28, 32];

  const makePath = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i + 1)} ${yScale(v)}`).join(' ');

  const makeArea = (top: number[], bottom: number[]) => {
    const topPath = top.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i + 1)} ${yScale(v)}`).join(' ');
    const bottomPath = bottom.map((v, i) => `L ${xScale(52 - i)} ${yScale(v)}`).join(' ');
    const reversedBottom = [...bottom].reverse();
    const bottomPathR = reversedBottom.map((v, i) => `L ${xScale(52 - i)} ${yScale(v)}`).join(' ');
    return `${topPath} ${bottomPathR} Z`;
  };

  const realCasesPath = makePath(realCases);
  const pathLen = 3000; // approximate

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ overflow: 'visible', maxWidth: '700px' }}>
      <defs>
        <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="safetyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eab308" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#eab308" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="epidemicGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Y axis grid */}
      {[0, 30, 60, 90, 120].map((v) => (
        <g key={v}>
          <line x1={padL} y1={yScale(v)} x2={w - padR} y2={yScale(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          <text x={padL - 8} y={yScale(v) + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="9">{v}</text>
        </g>
      ))}

      {/* Zone fills */}
      <path d={makeArea(successLine, Array(52).fill(0))} fill="url(#successGrad)" opacity={inView ? 1 : 0} style={{ transition: 'opacity 1s ease 0.2s' }} />
      <path d={makeArea(safetyLine, successLine)} fill="url(#safetyGrad)" opacity={inView ? 1 : 0} style={{ transition: 'opacity 1s ease 0.5s' }} />
      <path d={makeArea(epidemicLine, safetyLine)} fill="url(#epidemicGrad)" opacity={inView ? 1 : 0} style={{ transition: 'opacity 1s ease 0.8s' }} />

      {/* Zone boundary lines */}
      <path d={makePath(successLine)} fill="none" stroke="#22c55e" strokeWidth="1.5" opacity={inView ? 0.6 : 0} style={{ transition: 'opacity 1s ease 0.2s' }} />
      <path d={makePath(safetyLine)} fill="none" stroke="#eab308" strokeWidth="1.5" opacity={inView ? 0.6 : 0} style={{ transition: 'opacity 1s ease 0.5s' }} />
      <path d={makePath(epidemicLine)} fill="none" stroke="#ef4444" strokeWidth="1.5" opacity={inView ? 0.6 : 0} style={{ transition: 'opacity 1s ease 0.8s' }} />

      {/* Real cases line — animated draw */}
      <path
        d={realCasesPath}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeDasharray={pathLen}
        strokeDashoffset={inView ? 0 : pathLen}
        style={{ transition: `stroke-dashoffset 3s cubic-bezier(0.22,1,0.36,1) 1.2s` }}
      />

      {/* Danger pulse where real cases approach epidemic line */}
      {inView && (
        <circle cx={xScale(38)} cy={yScale(95)} r="6" fill="rgba(255,60,60,0.6)">
          <animate attributeName="r" values="6;12;6" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Zone labels */}
      <text x={w - padR + 5} y={yScale(10)} fill="#22c55e" fontSize="8" fontWeight="600" opacity={inView ? 0.7 : 0} style={{ transition: 'opacity 1s ease 0.3s' }}>ÉXITO</text>
      <text x={w - padR + 5} y={yScale(40)} fill="#eab308" fontSize="8" fontWeight="600" opacity={inView ? 0.7 : 0} style={{ transition: 'opacity 1s ease 0.6s' }}>SEGURIDAD</text>
      <text x={w - padR + 5} y={yScale(75)} fill="#ef4444" fontSize="8" fontWeight="600" opacity={inView ? 0.7 : 0} style={{ transition: 'opacity 1s ease 0.9s' }}>EPIDEMIA</text>

      {/* X axis labels (select weeks) */}
      {[1, 10, 20, 30, 40, 52].map((wk) => (
        <text key={wk} x={xScale(wk)} y={h - 10} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9">
          SE {wk}
        </text>
      ))}

      {/* Axis labels */}
      <text x={padL - 40} y={padT + chartH / 2} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" transform={`rotate(-90, ${padL - 40}, ${padT + chartH / 2})`}>
        Casos
      </text>
      <text x={padL + chartW / 2} y={h - 0} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9">
        Semana Epidemiológica
      </text>
    </svg>
  );
};

const SolutionSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) return;

    gsap.fromTo(
      sectionRef.current.querySelectorAll('.solution-text'),
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 65%',
          once: true,
        },
      }
    );

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 50%',
      once: true,
      onEnter: () => setInView(true),
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      id="solution"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6rem 2rem',
        background: 'linear-gradient(180deg, #0b0f19 0%, #0a0e18 50%, #0d1425 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Subtle gradient accent */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          right: '10%',
          width: '30vw',
          height: '30vw',
          background: 'radial-gradient(ellipse, rgba(234,179,8,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '1000px', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span
            className="solution-text"
            style={{
              display: 'inline-block',
              padding: '0.4rem 1.2rem',
              borderRadius: '100px',
              background: 'rgba(234,179,8,0.1)',
              border: '1px solid rgba(234,179,8,0.2)',
              color: '#eab308',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
              opacity: 0,
            }}
          >
            Vigilancia Epidemiológica
          </span>

          <h2
            className="solution-text"
            style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              margin: '0 0 1.5rem 0',
              opacity: 0,
            }}
          >
            El canal endémico nos dice{' '}
            <span style={{ color: '#eab308' }}>dónde estuvimos.</span>
          </h2>

          <p
            className="solution-text"
            style={{
              fontSize: 'clamp(0.95rem, 1.4vw, 1.15rem)',
              color: 'rgba(255,255,255,0.5)',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.7,
              opacity: 0,
            }}
          >
            El SIVIGILA es un sistema de vigilancia reactiva. Registra lo que ya ocurrió.
            Pero para salvar vidas necesitamos ver <strong style={{ color: '#fff' }}>hacia dónde vamos</strong>.
          </p>
        </div>

        {/* Chart container */}
        <div
          className="solution-text"
          style={{
            background: 'rgba(16, 22, 35, 0.5)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: 0,
          }}
        >
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { color: '#22c55e', label: 'Zona de Éxito' },
              { color: '#eab308', label: 'Zona de Seguridad' },
              { color: '#ef4444', label: 'Zona de Epidemia' },
              { color: '#ffffff', label: 'Casos Reales 2025' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 16, height: 3, background: item.color, borderRadius: 2, display: 'inline-block' }} />
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
              </div>
            ))}
          </div>

          <EndemicChannelChart inView={inView} />

          <p
            style={{
              marginTop: '2rem',
              fontSize: 'clamp(1rem, 1.6vw, 1.3rem)',
              fontWeight: 700,
              color: '#fff',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Nuestra <span style={{ color: '#00f0ff' }}>Inteligencia Artificial</span> nos dice{' '}
            <span style={{ color: '#00f0ff' }}>hacia dónde vamos.</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
