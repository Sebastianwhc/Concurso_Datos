import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];
    const PARTICLE_COUNT = 70;
    const CONNECT_DIST = 110;
    const colors = [
      'rgba(0, 240, 255,',   // cyan
      'rgba(0, 150, 255,',   // blue
      'rgba(179, 0, 255,',   // purple
      'rgba(255, 60, 60,',   // red (dengue)
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Heat map blobs
    const blobs = Array.from({ length: 5 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 200 + 100,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw heat blobs
      for (const blob of blobs) {
        blob.x += blob.vx;
        blob.y += blob.vy;
        if (blob.x < -200 || blob.x > width + 200) blob.vx *= -1;
        if (blob.y < -200 || blob.y > height + 200) blob.vy *= -1;

        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
        gradient.addColorStop(0, 'rgba(255, 40, 40, 0.06)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.03)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(blob.x - blob.radius, blob.y - blob.radius, blob.radius * 2, blob.radius * 2);
      }

      // Update particle positions
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      // Draw connections once per unique pair (avoids O(n²) double counting)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.08 * (1 - dist / CONNECT_DIST)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.alpha})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.alpha * 0.15})`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Only animate while the canvas is on-screen, to avoid burning CPU/GPU
    // when the user has scrolled past the hero.
    let running = false;
    const start = () => {
      if (running) return;
      running = true;
      animate();
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(animationRef.current);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      stop();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default ParticleCanvas;
