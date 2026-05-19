import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CTASection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sectionRef.current) return;

    gsap.fromTo(
      sectionRef.current.querySelectorAll('.cta-el'),
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      id="cta"
      style={{
        position: 'relative', width: '100%', minHeight: '60vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '6rem 1.5rem',
        background: 'linear-gradient(180deg, #070b14 0%, #0b0f19 50%, #0d1425 100%)',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '50vw', height: '30vh', background: 'radial-gradient(ellipse, rgba(0,240,255,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Separator */}
        <div className="cta-el" style={{ width: '60px', height: '2px', background: 'linear-gradient(90deg, #00f0ff, #b300ff)', margin: '0 auto 2.5rem', borderRadius: '1px', opacity: 0 }} />

        <p className="cta-el" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem', opacity: 0 }}>
          Concurso Gubernamental
        </p>

        <h2 className="cta-el" style={{ fontSize: 'clamp(1.4rem, 3vw, 2.5rem)', fontWeight: 800, color: '#fff', lineHeight: 1.3, margin: '0 0 1rem 0', opacity: 0 }}>
          Datos al Ecosistema 2026:
          <br />
          <span style={{ background: 'linear-gradient(90deg, #00f0ff, #b300ff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            IA para Colombia
          </span>
        </h2>

        <p className="cta-el" style={{ fontSize: 'clamp(0.88rem, 1.3vw, 1.1rem)', color: 'rgba(255,255,255,0.45)', margin: '0 auto 1rem', maxWidth: '500px', lineHeight: 1.6, opacity: 0 }}>
          Proyecto diseñado para la <strong style={{ color: '#00f0ff' }}>Categoría Avanzado</strong>
          <br />Reto: Salud y Bienestar
        </p>

        {/* Team badge */}
        <div className="cta-el" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.2rem', borderRadius: '100px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '3rem', opacity: 0 }}>
          <span>👨‍💻</span>
          EcoSalud IA — Bucaramanga, Santander
        </div>

        {/* Buttons */}
        <div className="cta-el cta-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', opacity: 0 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '0.9rem 2rem', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #00f0ff 0%, #00b8ff 100%)',
              color: '#000', fontSize: '1rem', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.3s ease',
              boxShadow: '0 0 25px rgba(0,240,255,0.3)', letterSpacing: '0.3px',
              flex: '1 1 200px', maxWidth: '320px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(0,240,255,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 25px rgba(0,240,255,0.3)'; }}
          >
            Ver Dashboard Interactivo
          </button>

          <button
            onClick={() => window.open('https://github.com/Sebastianwhc/Concurso_Datos', '_blank')}
            style={{
              padding: '0.9rem 2rem', borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)', color: '#fff',
              fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.3s ease', letterSpacing: '0.3px',
              flex: '1 1 200px', maxWidth: '320px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,240,255,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          >
            Repositorio del Código
          </button>
        </div>

        {/* Sección de Contacto */}
        <div className="cta-el" style={{ marginTop: '4rem', opacity: 0 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Contacto de los Desarrolladores
          </h3>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '600px', margin: '0 auto' }}>
            {/* Tarjeta Daniela */}
            <div style={{
              flex: '1 1 240px',
              padding: '1.5rem',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              textAlign: 'center',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
              e.currentTarget.style.background = 'rgba(0, 240, 255, 0.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👩‍💻</div>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
                <a href="mailto:daalreba@gmail.com" style={{ color: '#00f0ff', textDecoration: 'none', transition: 'color 0.2s' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                   onMouseLeave={(e) => e.currentTarget.style.color = '#00f0ff'}>
                  Daniela Reyes
                </a>
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                daalreba@gmail.com
              </p>
            </div>

            {/* Tarjeta Sebastián */}
            <div style={{
              flex: '1 1 240px',
              padding: '1.5rem',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              textAlign: 'center',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = 'rgba(179, 0, 255, 0.3)';
              e.currentTarget.style.background = 'rgba(179, 0, 255, 0.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👨‍💻</div>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
                <a href="mailto:sebastian00735@gmail.com" style={{ color: '#b300ff', textDecoration: 'none', transition: 'color 0.2s' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                   onMouseLeave={(e) => e.currentTarget.style.color = '#b300ff'}>
                  Sebastián Díaz
                </a>
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                sebastian00735@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px', padding: '0 1rem' }}>
        © 2026 EcoSalud IA · Datos abiertos SIVIGILA + CDMB · Hecho con ❤️ en Bucaramanga
      </div>
    </section>
  );
};

export default CTASection;
