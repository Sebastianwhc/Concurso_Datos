import React, { useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BedDouble, HeartPulse } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* --- Helper to shorten SIVIGILA age category labels --- */
const shortenAgeLabel = (label: string): string => {
  const l = label.toLowerCase().trim();
  if (l.includes("menor de 1")) return "<1";
  if (l.includes("70 y mas")) return "70+";
  return label.replace(/\s*a\s*/gi, "-");
};

/* --- Types --- */
interface AgeDataPoint {
  age: string;
  value: number;
}

interface HistoricalPoint {
  year: number;
  cases: number;
}

interface DonutChartProps {
  inView: boolean;
  femalePercent: number;
  malePercent: number;
  totalCases: number;
}

interface AgeChartProps {
  inView: boolean;
  data: AgeDataPoint[];
}

interface HistoricalChartProps {
  inView: boolean;
  data: HistoricalPoint[];
}

/* ─── Donut / Pie chart (sex distribution) ─── */
const DonutChart: React.FC<DonutChartProps> = ({ inView, femalePercent, malePercent, totalCases }) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const femaleLen = (femalePercent / 100) * circumference;
  const maleLen = (malePercent / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
      <svg viewBox="0 0 200 200" width="180" height="180" style={{ filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.15))', maxWidth: '100%' }}>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
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
        <text x="100" y="95" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700" fontFamily="Inter, sans-serif">
          {totalCases.toLocaleString('es-CO')}
        </text>
        <text x="100" y="116" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="Inter, sans-serif">
          casos Bga 2025*
        </text>
      </svg>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00f0ff', display: 'inline-block' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Mujeres {femalePercent}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#b300ff', display: 'inline-block' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Hombres {malePercent}%</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Age distribution area chart ─── */
const AgeChart: React.FC<AgeChartProps> = ({ inView, data }) => {
  const w = 480;
  const h = 180;
  const padding = 36;
  const chartW = w - padding * 2;
  const chartH = h - padding;
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * chartW,
    y: h - padding - (d.value / maxVal) * chartH,
  }));

  const pathData = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (p.x - prev.x) * 0.45;
    const cpx2 = p.x - (p.x - prev.x) * 0.45;
    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaPath = `${pathData} L ${points[points.length - 1].x} ${h - padding} L ${points[0].x} ${h - padding} Z`;

  return (
    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', minWidth: '280px', width: '100%' }}>
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

        <g clipPath="url(#revealClip)">
          <path d={areaPath} fill="url(#areaGradient)" />
          <path d={pathData} fill="none" stroke="#00f0ff" strokeWidth="2.5" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#00f0ff" opacity="0.8">
              <animate attributeName="r" values="3.5;5.5;3.5" dur="2s" repeatCount="indefinite" begin={`${i * 0.18}s`} />
            </circle>
          ))}
        </g>

        {data.map((d, i) => (
          <text
            key={i}
            x={padding + (i / (data.length - 1)) * chartW}
            y={h - 8}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="9"
            fontFamily="Inter, sans-serif"
          >
            {shortenAgeLabel(d.age)}
          </text>
        ))}

        <text x={padding - 8} y={h - padding - 0.75 * chartH} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Inter, sans-serif">Alto</text>
        <text x={padding - 8} y={h - padding} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Inter, sans-serif">Bajo</text>
      </svg>
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.75rem' }}>
        Foco principal en adultos jóvenes de 20-29 años y escolares de 5-14 años.
      </p>
    </div>
  );
};

/* ─── Historical trend area/line chart ─── */
const HistoricalChart: React.FC<HistoricalChartProps> = ({ inView, data }) => {
  const w = 960;
  const h = 220;
  const padL = 60;
  const padR = 40;
  const padT = 30;
  const padB = 40;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const maxVal = Math.max(...data.map((d) => d.cases), 1);

  const points = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * chartW,
    y: padT + chartH - (d.cases / maxVal) * chartH,
    cases: d.cases,
    year: d.year,
  }));

  const pathLine = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (p.x - prev.x) * 0.45;
    const cpx2 = p.x - (p.x - prev.x) * 0.45;
    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const pathArea = `${pathLine} L ${points[points.length - 1].x} ${h - padB} L ${points[0].x} ${h - padB} Z`;

  return (
    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', minWidth: '600px', width: '100%' }}>
        <defs>
          <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.0" />
          </linearGradient>
          <clipPath id="revealHistClip">
            <rect
              x="0"
              y="0"
              width={inView ? w : 0}
              height={h}
              style={{ transition: 'width 2.2s cubic-bezier(0.22,1,0.36,1)' }}
            />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
          <g key={frac}>
            <line
              x1={padL}
              y1={padT + (1 - frac) * chartH}
              x2={w - padR}
              y2={padT + (1 - frac) * chartH}
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="4 4"
              strokeWidth="0.8"
            />
            <text
              x={padL - 12}
              y={padT + (1 - frac) * chartH + 4}
              textAnchor="end"
              fill="rgba(255,255,255,0.35)"
              fontSize="10"
              fontFamily="Inter, sans-serif"
            >
              {Math.round(frac * maxVal).toLocaleString('es-CO')}
            </text>
          </g>
        ))}

        {/* Area and Line */}
        <g clipPath="url(#revealHistClip)">
          <path d={pathArea} fill="url(#histGrad)" />
          <path d={pathLine} fill="none" stroke="#00f0ff" strokeWidth="2.5" />

          {/* Dots on points */}
          {points.map((p, i) => (
            <g key={i}>
              {p.year === 2024 && (
                <circle cx={p.x} cy={p.y} r="10" fill="rgba(239, 68, 68, 0.35)">
                  <animate attributeName="r" values="8;16;8" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0.1;0.7" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
              
              <circle
                cx={p.x}
                cy={p.y}
                r={p.year === 2024 ? "5.5" : "4"}
                fill={p.year === 2024 ? "#ef4444" : "#00f0ff"}
                stroke="#0b0f19"
                strokeWidth="1.5"
              />
              
              <text
                x={p.x}
                y={p.y - 11}
                textAnchor="middle"
                fill={p.year === 2024 ? "#ff6666" : "#ffffff"}
                fontSize="9.5"
                fontWeight={p.year === 2024 ? "800" : "500"}
                fontFamily="Inter, sans-serif"
              >
                {p.cases.toLocaleString('es-CO')}
              </text>
            </g>
          ))}
        </g>

        {/* X axis labels (Years) */}
        {data.map((d, i) => (
          <text
            key={i}
            x={padL + (i / (data.length - 1)) * chartW}
            y={h - 12}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="10"
            fontFamily="Inter, sans-serif"
          >
            {d.year}
          </text>
        ))}
        
        <text
          x={padL - 45}
          y={padT + chartH / 2}
          textAnchor="middle"
          fill="rgba(255,255,255,0.25)"
          fontSize="9"
          fontFamily="Inter, sans-serif"
          transform={`rotate(-90, ${padL - 45}, ${padT + chartH / 2})`}
        >
          Casos Reportados SIVIGILA
        </text>
      </svg>
    </div>
  );
};

/* ─── Stacked bar chart for severity ─── */
const SeverityBar: React.FC<{ pctSin: number; pctCon: number; pctGrave: number; sin: number; con: number; grave: number }> = ({ pctSin, pctCon, pctGrave, sin, con, grave }) => {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', width: '100%', height: '14px', borderRadius: '7px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
        {pctSin > 0 && (
          <div style={{ width: `${pctSin}%`, background: 'linear-gradient(90deg, #00f0ff 0%, #00b8ff 100%)', boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)' }} />
        )}
        {pctCon > 0 && (
          <div style={{ width: `${pctCon}%`, background: 'linear-gradient(90deg, #eab308 0%, #ffaa00 100%)' }} />
        )}
        {pctGrave > 0 && (
          <div style={{ width: `${pctGrave}%`, background: 'linear-gradient(90deg, #ef4444 0%, #ff0000 100%)', boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)' }} />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', width: '100%', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00f0ff', display: 'inline-block' }} />
            <span style={{ color: 'rgba(255,255,255,0.65)' }}>Sin signos de alarma</span>
          </div>
          <span style={{ fontWeight: 600, color: '#fff' }}>{sin.toLocaleString('es-CO')} ({pctSin}%)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308', display: 'inline-block' }} />
            <span style={{ color: 'rgba(255,255,255,0.65)' }}>Con signos de alarma</span>
          </div>
          <span style={{ fontWeight: 600, color: '#fff' }}>{con.toLocaleString('es-CO')} ({pctCon}%)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ color: 'rgba(255,255,255,0.65)' }}>Dengue grave</span>
          </div>
          <span style={{ fontWeight: 600, color: '#fff' }}>{grave.toLocaleString('es-CO')} ({pctGrave}%)</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Section ─── */
const ThreatSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<{
    meta: {
      dicts: {
        sexo: string[];
        edad: string[];
      };
      years: number[];
    };
    rows: number[][];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/dengue.json`)
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading dengue data:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (loading || !data || !sectionRef.current) return;

    gsap.fromTo(
      sectionRef.current.querySelectorAll('.threat-text'),
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    gsap.fromTo(
      sectionRef.current.querySelectorAll('.chart-panel'),
      { opacity: 0, y: 55 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        stagger: 0.25,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: statsRef.current || sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 55%',
      onEnter: () => setInView(true),
      onLeaveBack: () => setInView(false),
    });
  }, [loading, data]);

  // Real calculations
  const data2025 = useMemo(() => {
    if (!data) return null;
    const rows2025 = data.rows.filter((r) => r[0] === 2025);
    const total = rows2025.length;
    if (total === 0) return null;

    let fCount = 0, mCount = 0;
    rows2025.forEach((r) => {
      if (r[2] === 0) fCount++;
      else if (r[2] === 1) mCount++;
    });
    const femalePercent = parseFloat(((fCount / total) * 100).toFixed(1));
    const malePercent = parseFloat(((mCount / total) * 100).toFixed(1));

    const ageGroups = data.meta.dicts.edad;
    const ageCounts = new Array(ageGroups.length).fill(0);
    rows2025.forEach((r) => {
      const idx = r[3];
      if (idx >= 0 && idx < ageCounts.length) {
        ageCounts[idx]++;
      }
    });
    const ageData = ageGroups.map((group, idx) => ({
      age: group,
      value: ageCounts[idx],
    }));

    let sinSignos = 0, conSignos = 0, grave = 0;
    rows2025.forEach((r) => {
      if (r[6] === 0) sinSignos++;
      else if (r[6] === 1) conSignos++;
      else if (r[6] === 2) grave++;
    });
    const pctSin = parseFloat(((sinSignos / total) * 100).toFixed(1));
    const pctCon = parseFloat(((conSignos / total) * 100).toFixed(1));
    const pctGrave = parseFloat(((grave / total) * 100).toFixed(1));

    let hospCount = 0;
    rows2025.forEach((r) => {
      if (r[8] === 1) hospCount++;
    });
    const hospPct = parseFloat(((hospCount / total) * 100).toFixed(1));

    let deadCount = 0;
    rows2025.forEach((r) => {
      if (r[9] === 1) deadCount++;
    });
    const letalidad = parseFloat(((deadCount / total) * 100).toFixed(2));

    return {
      total,
      femalePercent,
      malePercent,
      ageData,
      sinSignos,
      conSignos,
      grave,
      pctSin,
      pctCon,
      pctGrave,
      hospCount,
      hospPct,
      deadCount,
      letalidad,
    };
  }, [data]);

  const historicalData = useMemo(() => {
    if (!data) return [];
    const yearMap = new Map<number, number>();
    data.meta.years.forEach((y) => yearMap.set(y, 0));
    data.rows.forEach((r) => {
      const y = r[0];
      if (yearMap.has(y)) {
        yearMap.set(y, yearMap.get(y)! + 1);
      }
    });
    return data.meta.years.map((y) => ({
      year: y,
      cases: yearMap.get(y) || 0,
    }));
  }, [data]);

  if (loading || !data || !data2025) {
    return (
      <section
        ref={sectionRef}
        id="threat"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0f19',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{ width: 44, height: 44, border: '3.5px solid rgba(255,255,255,0.1)', borderTopColor: '#00f0ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>
            Cargando datos epidemiológicos reales de SIVIGILA...
          </span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </section>
    );
  }

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
          background: 'radial-gradient(ellipse, rgba(255,40,40,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '1100px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
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
              fontSize: 'clamp(1.5rem, 4vw, 3.2rem)',
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
              fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)',
              color: 'rgba(255,255,255,0.55)',
              maxWidth: '750px',
              margin: '0 auto',
              lineHeight: 1.7,
              opacity: 0,
            }}
          >
            Santander reportó cerca de <strong style={{ color: '#ff6666' }}>9.000 casos</strong> en 2025.
            Bucaramanga aportó el <strong style={{ color: '#ff6666' }}>{((data2025.total / 9000) * 100).toFixed(1)}%</strong> de los afectados con <strong style={{ color: '#ff6666' }}>{data2025.total.toLocaleString('es-CO')} casos reales</strong> notificados en su red hospitalaria (corte a SE 35).
          </p>
        </div>

        {/* ── 1. Historical Outbreaks Panel (Width 1 / -1) ── */}
        <div
          className="threat-text chart-panel"
          style={{
            background: 'rgba(16, 22, 35, 0.55)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '2.5rem',
            opacity: 0,
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
            Evolución Histórica de Brotes (2015 - 2025)
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem', textAlign: 'center' }}>
            Curva de casos anuales de SIVIGILA Bucaramanga · se destaca el pico epidémico histórico sin precedentes registrado en 2024.
          </span>
          <HistoricalChart inView={inView} data={historicalData} />
        </div>

        {/* ── 2. Demographics and Severity Cards Grid ── */}
        <div
          ref={statsRef}
          className="threat-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            alignItems: 'stretch',
          }}
        >
          {/* Card A: Sex */}
          <div
            className="chart-panel"
            style={{
              background: 'rgba(16, 22, 35, 0.55)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '24px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: 0,
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            }}
          >
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem', letterSpacing: '0.5px', textAlign: 'center', textTransform: 'uppercase' }}>
              Distribución por Sexo (2025)
            </h3>
            <DonutChart
              inView={inView}
              femalePercent={data2025.femalePercent}
              malePercent={data2025.malePercent}
              totalCases={data2025.total}
            />
          </div>

          {/* Card B: Age */}
          <div
            className="chart-panel"
            style={{
              background: 'rgba(16, 22, 35, 0.55)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '24px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: 0,
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            }}
          >
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem', letterSpacing: '0.5px', textAlign: 'center', textTransform: 'uppercase' }}>
              Incidencia por Grupo Etario (2025)
            </h3>
            <AgeChart inView={inView} data={data2025.ageData} />
          </div>

          {/* Card C: Clinical Impact */}
          <div
            className="chart-panel"
            style={{
              background: 'rgba(16, 22, 35, 0.55)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '24px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: 0,
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            }}
          >
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem', letterSpacing: '0.5px', textAlign: 'center', textTransform: 'uppercase' }}>
              Impacto Clínico (2025)
            </h3>
            
            <SeverityBar
              pctSin={data2025.pctSin}
              pctCon={data2025.pctCon}
              pctGrave={data2025.pctGrave}
              sin={data2025.sinSignos}
              con={data2025.conSignos}
              grave={data2025.grave}
            />

            {/* Micro-KPIs for hospitalized and deceased */}
            <div style={{ display: 'flex', width: '100%', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.2rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(234,179,8,0.04)', border: '1px solid rgba(234,179,8,0.1)', borderRadius: '12px', padding: '0.65rem' }}>
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hospitalizados</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#eab308', marginTop: '0.2rem', fontFamily: 'Inter, sans-serif' }}>
                  {data2025.hospCount.toLocaleString('es-CO')}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: '0.1rem' }}>
                  {data2025.hospPct}% del total
                </span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '12px', padding: '0.65rem' }}>
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fallecidos</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ef4444', marginTop: '0.2rem', fontFamily: 'Inter, sans-serif' }}>
                  {data2025.deadCount.toLocaleString('es-CO')}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: '0.1rem' }}>
                  Letalidad {data2025.letalidad}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThreatSection;
