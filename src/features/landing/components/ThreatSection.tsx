import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ─── Donut / Pie chart (sex distribution) ─── */
const DonutChart: React.FC<{ inView: boolean }> = ({ inView }) => {
  const femalePercent = 54.1;
  const malePercent = 45.9;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const femaleLen = (femalePercent / 100) * circumference;
  const maleLen = (malePercent / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
      <svg viewBox="0 0 200 200" width="220" height="220" style={{ filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.2))' }}>
        {/* Background ring */}
        <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
        {/* Female arc */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#00f0ff"
          strokeWidth="18"
          strokeDasharray={`${femaleLen} ${circumference}`}
          strokeDashoffset={inView ? 0 : circumference}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.22,1,0.36,1)' }}
        />
        {/* Male arc */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#b300ff"
          strokeWidth="18"
          strokeDasharray={`${maleLen} ${circumference}`}
          strokeDashoffset={inView ? 0 : circumference}
          strokeLinecap="round"
          transform={`rotate(${-90 + (femalePercent / 100) * 360} 100 100)`}
          style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.22,1,0.36,1) 0.3s' }}
        />
        {/* Center label */}
        <text x="100" y="95" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700">
          9,000+
        </text>
        <text x="100" y="116" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">
          casos Santander 2025
        </text>
      </svg>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#00f0ff', display: 'inline-block' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Mujeres {femalePercent}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#b300ff', display: 'inline-block' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Hombres {malePercent}%</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Age distribution area chart ─── */
const AgeChart: React.FC<{ inView: boolean }> = ({ inView }) => {
  // Stylized data points: age ranges vs intensity
  const data = [
    { age: '0-5', value: 35 },
    { age: '6-10', value: 72 },
    { age: '11-15', value: 88 },
    { age: '16-18', value: 80 },
    { age: '19-25', value: 55 },
    { age: '26-35', value: 42 },
    { age: '36-45', value: 38 },
    { age: '46-55', value: 30 },
    { age: '56-65', value: 22 },
    { age: '65+', value: 15 },
  ];

  const w = 500;
  const h = 200;
  const padding = 40;
  const chartW = w - padding * 2;
  const chartH = h - padding;
  const maxVal = 100;

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * chartW,
    y: h - padding - (d.value / maxVal) * chartH,
  }));

  // Create smooth bezier curve
  const pathData = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (p.x - prev.x) * 0.4;
    const cpx2 = p.x - (p.x - prev.x) * 0.4;
    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaPath = `${pathData} L ${points[points.length - 1].x} ${h - padding} L ${points[0].x} ${h - padding} Z`;

  return (
    <div style={{ width: '100%', maxWidth: '540px' }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="revealClip">
            <rect
              x="0"
              y="0"
              width={inView ? w : 0}
              height={h}
              style={{ transition: 'width 2s cubic-bezier(0.22,1,0.36,1)' }}
            />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={padding}
            y1={h - padding - frac * chartH}
            x2={w - padding}
            y2={h - padding - frac * chartH}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="4 4"
          />
        ))}

        {/* Area & line */}
        <g clipPath="url(#revealClip)">
          <path d={areaPath} fill="url(#areaGradient)" />
          <path d={pathData} fill="none" stroke="#00f0ff" strokeWidth="2.5" />
          {/* Dots */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#00f0ff" opacity="0.8">
              <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" begin={`${i * 0.2}s`} />
            </circle>
          ))}
        </g>

        {/* X axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={padding + (i / (data.length - 1)) * chartW}
            y={h - 8}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="9"
          >
            {d.age}
          </text>
        ))}

        {/* Y axis label */}
        <text x={padding - 8} y={h - padding - 0.75 * chartH} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="8">
          Alto
        </text>
        <text x={padding - 8} y={h - padding} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="8">
          Bajo
        </text>
      </svg>
      <p
        style={{
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.4)',
          marginTop: '0.75rem',
        }}
      >
        Distribución por grupo etario — picos en 6 a 18 años
      </p>
    </div>
  );
};

/* ─── Main Section ─── */
const ThreatSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) return;

    // Section reveal
    gsap.fromTo(
      sectionRef.current.querySelectorAll('.threat-text'),
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    // Charts reveal
    ScrollTrigger.create({
      trigger: statsRef.current,
      start: 'top 70%',
      onEnter: () => setInView(true),
      onLeaveBack: () => setInView(false),
    });

    // Parallax for chart containers
    if (leftRef.current && rightRef.current) {
      gsap.fromTo(
        leftRef.current,
        { opacity: 0, x: -60 },
        {
          opacity: 1,
          x: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: statsRef.current, start: 'top 70%', toggleActions: 'play none none reverse' },
        }
      );
      gsap.fromTo(
        rightRef.current,
        { opacity: 0, x: 60 },
        {
          opacity: 1,
          x: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: statsRef.current, start: 'top 70%', toggleActions: 'play none none reverse' },
        }
      );
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      id="threat"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6rem 2rem',
        background: 'linear-gradient(180deg, #050810 0%, #0b0f19 30%, #0d1425 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Accent glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60vw',
          height: '40vh',
          background: 'radial-gradient(ellipse, rgba(255,40,40,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '1100px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span
            className="threat-text"
            style={{
              display: 'inline-block',
              padding: '0.4rem 1.2rem',
              borderRadius: '100px',
              background: 'rgba(255,60,60,0.1)',
              border: '1px solid rgba(255,60,60,0.2)',
              color: '#ff4444',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
              opacity: 0,
            }}
          >
            La amenaza
          </span>
          <h2
            className="threat-text"
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 3.2rem)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              margin: '0 0 1.5rem 0',
              opacity: 0,
            }}
          >
            El dengue no es solo un número.
            <br />
            <span style={{ color: '#ff4444' }}>Es una emergencia en curso.</span>
          </h2>
          <p
            className="threat-text"
            style={{
              fontSize: 'clamp(0.95rem, 1.5vw, 1.2rem)',
              color: 'rgba(255,255,255,0.55)',
              maxWidth: '650px',
              margin: '0 auto',
              lineHeight: 1.7,
              opacity: 0,
            }}
          >
            Santander reportó cerca de <strong style={{ color: '#ff6666' }}>9.000 casos</strong> en 2025.
            Bucaramanga aportó más del <strong style={{ color: '#ff6666' }}>27%</strong> de los afectados.
            La enfermedad golpea con fuerza a la población más joven.
          </p>
        </div>

        {/* Charts Grid */}
        <div
          ref={statsRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          <div
            ref={leftRef}
            style={{
              background: 'rgba(16, 22, 35, 0.6)',
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
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', letterSpacing: '0.5px' }}>
              Distribución por Sexo
            </h3>
            <DonutChart inView={inView} />
          </div>

          <div
            ref={rightRef}
            style={{
              background: 'rgba(16, 22, 35, 0.6)',
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
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', letterSpacing: '0.5px' }}>
              Incidencia por Grupo Etario
            </h3>
            <AgeChart inView={inView} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThreatSection;
