import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SimulatorSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
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
        background: 'linear-gradient(180deg, #0d1425 0%, #0b0f19 50%, #070b14 100%)',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: '20%', left: '30%', width: '40vw', height: '40vw', background: 'radial-gradient(ellipse, rgba(0,240,255,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '30vw', height: '30vw', background: 'radial-gradient(ellipse, rgba(179,0,255,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1100px', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span
            className="sim-text"
            style={{
              display: 'inline-block', padding: '0.4rem 1.2rem', borderRadius: '100px',
              background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)',
              color: '#00f0ff', fontSize: '0.8rem', fontWeight: 600,
              letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '1.5rem', opacity: 0,
            }}
          >
            La Solución Avanzada
          </span>

          <h2
            className="sim-text"
            style={{
              fontSize: 'clamp(1.4rem, 3.5vw, 2.8rem)', fontWeight: 800,
              color: '#fff', lineHeight: 1.2, margin: '0 0 1.5rem 0', opacity: 0,
            }}
          >
            Simulador Predictivo con{' '}
            <span style={{ background: 'linear-gradient(90deg, #00f0ff, #b300ff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
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
            background: 'rgba(16, 22, 40, 0.5)', backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '28px', padding: '2.5rem',
            maxWidth: '680px', width: '100%', margin: '0 auto',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
            opacity: 0,
          }}
        >
          {/* Header bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #00f0ff, #b300ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
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
                background: projecting ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg, #00f0ff 0%, #00b8ff 50%, #b300ff 100%)',
                color: projecting ? 'rgba(255,255,255,0.6)' : '#000',
                fontSize: '1rem', fontWeight: 700,
                cursor: projecting ? 'wait' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: projecting ? 'none' : '0 0 30px rgba(0,240,255,0.3)',
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
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '1.5rem', border: `1px solid ${riskColor}33`, animation: 'fadeInUp 0.5s ease' }}>
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
                    <div style={{ fontSize: 'clamp(1.2rem,3vw,1.5rem)', fontWeight: 800, color: '#00f0ff' }}>87%</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Confianza modelo</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'clamp(1.2rem,3vw,1.5rem)', fontWeight: 800, color: '#b300ff' }}>3</div>
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
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          cursor: pointer; box-shadow: 0 0 10px rgba(0,240,255,0.5); border: 2px solid rgba(0,240,255,0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          cursor: pointer; box-shadow: 0 0 10px rgba(0,240,255,0.5); border: 2px solid rgba(0,240,255,0.5);
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
