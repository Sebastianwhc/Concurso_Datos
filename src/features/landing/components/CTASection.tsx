import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CTASection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sectionRef.current) return;

    // Animate content reveal
    gsap.fromTo(
      sectionRef.current.querySelectorAll('.cta-el'),
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
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

  return (
    <section
      ref={sectionRef}
      id="cta"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8rem 1.5rem 6rem 1.5rem',
        // Fondo con gradiente unificado exactamente como SimulatorSection
        background: 'linear-gradient(180deg, #0b0f19 0%, #070a14 50%, #0b0f19 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Background Wrapper with Progressive Reveal Mask */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          maskImage: 'linear-gradient(180deg, #000 0%, #000 75%, rgba(0,0,0,0.4) 90%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 75%, rgba(0,0,0,0.4) 90%, rgba(0,0,0,0) 100%)',
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

        {/* Halo 1 (Centered Behind Title): Cian + Violeta */}
        <div
          style={{
            position: 'absolute',
            top: '25%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(750px, 100vw)',
            height: 'min(750px, 100vw)',
            background: 'radial-gradient(circle, rgba(0, 229, 255, 0.18) 0%, rgba(124, 58, 237, 0.08) 45%, rgba(124, 58, 237, 0) 75%)',
            filter: 'blur(120px)',
          }}
        />

        {/* Halo 2 (Behind CTA Buttons): Cian -> Azul */}
        <div
          style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(650px, 90vw)',
            height: 'min(650px, 90vw)',
            background: 'radial-gradient(circle, rgba(0, 229, 255, 0.15) 0%, rgba(0, 184, 255, 0.08) 50%, rgba(0, 184, 255, 0) 80%)',
            filter: 'blur(100px)',
          }}
        />

        {/* Halo 3 (Behind Contact Cards): Violeta Suave */}
        <div
          style={{
            position: 'absolute',
            top: '78%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(700px, 95vw)',
            height: 'min(700px, 95vw)',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, rgba(147, 51, 234, 0.03) 50%, rgba(147, 51, 234, 0) 80%)',
            filter: 'blur(110px)',
          }}
        />
      </div>

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

      <div style={{ maxWidth: '900px', width: '100%', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        {/* Separator */}
        <div className="cta-el" style={{ width: '80px', height: '2px', background: 'linear-gradient(90deg, #00e5ff, #7c3aed)', margin: '0 auto 2.5rem', borderRadius: '1px', opacity: 0 }} />

        <p className="cta-el" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '1.2rem', opacity: 0 }}>
          Concurso Gubernamental
        </p>

        <h2 className="cta-el" style={{ fontSize: 'clamp(1.6rem, 3.8vw, 2.8rem)', fontWeight: 800, color: '#fff', lineHeight: 1.3, margin: '0 0 2rem 0', opacity: 0 }}>
          Datos al Ecosistema 2026:
          <br />
          <span style={{ 
            background: 'linear-gradient(90deg, #00e5ff, #00b8ff, #7c3aed, #9333ea)', 
            WebkitBackgroundClip: 'text', 
            backgroundClip: 'text', 
            color: 'transparent',
            filter: 'drop-shadow(0 0 25px rgba(0, 229, 255, 0.25))',
            fontWeight: 900
          }}>
            IA para Colombia
          </span>
        </h2>

        {/* Glowing Category Badge */}
        <div 
          className="cta-el" 
          style={{ 
            display: 'inline-block',
            padding: '0.65rem 1.8rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(8, 14, 30, 0.5) 0%, rgba(17, 10, 36, 0.5) 100%)',
            border: '1px solid rgba(0, 229, 255, 0.16)',
            boxShadow: '0 0 30px rgba(0, 229, 255, 0.06), inset 0 0 15px rgba(124, 58, 237, 0.06)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            margin: '0 auto 3rem', 
            maxWidth: '520px', 
            opacity: 0 
          }}
        >
          <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 500 }}>
            Proyecto diseñado para la
          </span>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, margin: '0.2rem 0 0.1rem 0', background: 'linear-gradient(90deg, #00e5ff, #00b8ff, #7c3aed, #9333ea)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', textShadow: '0 0 15px rgba(0, 229, 255, 0.15)' }}>
            Categoría Avanzado
          </div>
          <span style={{ fontSize: '0.8rem', color: 'rgba(0, 229, 255, 0.8)', fontWeight: 600, letterSpacing: '0.5px' }}>
            Reto: Salud y Bienestar
          </span>
        </div>

        <br />

        {/* Team badge */}
        <div className="cta-el" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 1.4rem', borderRadius: '100px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginBottom: '3.5rem', opacity: 0 }}>
          <span>👨‍💻</span>
          EcoSalud IA — Bucaramanga, Santander
        </div>

        {/* Buttons */}
        <div className="cta-el cta-buttons" style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap', opacity: 0 }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="glow-btn"
            style={{
              padding: '1rem 2.2rem', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #00e5ff 0%, #00b8ff 100%)',
              color: '#000', fontSize: '1.02rem', fontWeight: 750,
              cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              letterSpacing: '0.5px',
              flex: '1 1 220px', maxWidth: '320px',
            }}
          >
            Ver Dashboard Interactivo
          </button>

          <button
            onClick={() => window.open('https://github.com/Sebastianwhc/Concurso_Datos', '_blank')}
            style={{
              padding: '1rem 2.2rem', borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)', color: '#fff',
              fontSize: '1.02rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', letterSpacing: '0.5px',
              flex: '1 1 220px', maxWidth: '320px',
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; 
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; 
              e.currentTarget.style.borderColor = 'rgba(0,229,255,0.45)';
              e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 229, 255, 0.1), 0 0 20px rgba(0, 229, 255, 0.05)';
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.transform = 'scale(1)'; 
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; 
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Repositorio del Código
          </button>
        </div>

        {/* Sección de Contacto */}
        <div className="cta-el" style={{ marginTop: '5rem', opacity: 0 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginBottom: '2rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            Contacto de los Desarrolladores
          </h3>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '640px', margin: '0 auto' }}>
            {/* Tarjeta Daniela */}
            <div style={{
              flex: '1 1 260px',
              padding: '1.8rem',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(8, 14, 30, 0.6) 0%, rgba(17, 10, 36, 0.6) 100%)',
              border: '1px solid rgba(0, 229, 255, 0.12)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 15px 35px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
              textAlign: 'center',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
              e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.45)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 229, 255, 0.06) 0%, rgba(8, 14, 30, 0.6) 100%)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 229, 255, 0.1), 0 0 20px rgba(0, 229, 255, 0.05), inset 0 1px 0 rgba(255,255,255,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.12)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(8, 14, 30, 0.6) 0%, rgba(17, 10, 36, 0.6) 100%)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)';
            }}
            >
              <div style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>👩‍💻</div>
              <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.15rem', fontWeight: 700 }}>
                <a href="mailto:daalreba@gmail.com" style={{ color: '#00e5ff', textDecoration: 'none', transition: 'color 0.2s', textShadow: '0 0 10px rgba(0, 229, 255, 0.15)' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                   onMouseLeave={(e) => e.currentTarget.style.color = '#00e5ff'}>
                  Daniela Reyes
                </a>
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.45)', letterSpacing: '0.2px' }}>
                daalreba@gmail.com
              </p>
            </div>

            {/* Tarjeta Sebastián */}
            <div style={{
              flex: '1 1 260px',
              padding: '1.8rem',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(8, 14, 30, 0.6) 0%, rgba(17, 10, 36, 0.6) 100%)',
              border: '1px solid rgba(124, 58, 237, 0.12)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 15px 35px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
              textAlign: 'center',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
              e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.45)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 58, 237, 0.06) 0%, rgba(8, 14, 30, 0.6) 100%)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(124, 58, 237, 0.1), 0 0 20px rgba(124, 58, 237, 0.05), inset 0 1px 0 rgba(255,255,255,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.12)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(8, 14, 30, 0.6) 0%, rgba(17, 10, 36, 0.6) 100%)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)';
            }}
            >
              <div style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>👨‍💻</div>
              <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.15rem', fontWeight: 700 }}>
                <a href="mailto:sebastian00735@gmail.com" style={{ color: '#7c3aed', textDecoration: 'none', transition: 'color 0.2s', textShadow: '0 0 10px rgba(124, 58, 237, 0.15)' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                   onMouseLeave={(e) => e.currentTarget.style.color = '#7c3aed'}>
                  Sebastián Díaz
                </a>
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.45)', letterSpacing: '0.2px' }}>
                sebastian00735@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.5px', padding: '0 1rem', zIndex: 2 }}>
        © 2026 EcoSalud IA · Datos abiertos SIVIGILA + CDMB · Hecho con ❤️ en Bucaramanga
      </div>

      <style>{`
        .glow-btn {
          position: relative;
          z-index: 1;
          animation: pulseShadow 2.5s infinite alternate;
        }
        .glow-btn::before {
          content: '';
          position: absolute;
          top: -2px; left: -2px; right: -2px; bottom: -2px;
          background: linear-gradient(135deg, #00e5ff, #7c3aed, #9333ea);
          border-radius: 16px;
          z-index: -1;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .glow-btn:hover::before {
          opacity: 1;
        }
        .glow-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 0 50px rgba(0, 229, 255, 0.65), 0 15px 30px rgba(0, 0, 0, 0.4);
          color: #fff !important;
          background: #000 !important;
        }
        @keyframes pulseShadow {
          0% {
            box-shadow: 0 0 25px rgba(0, 229, 255, 0.35), 0 5px 15px rgba(0, 0, 0, 0.3);
          }
          100% {
            box-shadow: 0 0 45px rgba(0, 229, 255, 0.6), 0 10px 25px rgba(0, 229, 255, 0.15), 0 5px 15px rgba(0, 0, 0, 0.3);
          }
        }
      `}</style>
    </section>
  );
};

export default CTASection;
