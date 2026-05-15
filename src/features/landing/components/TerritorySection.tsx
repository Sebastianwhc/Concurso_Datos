import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ─── Types ─── */
interface GeoFeature {
  type: string;
  properties: { MPIO_CNMBR: string; MPIO_CCNCT: string };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoJSON {
  type: string;
  features: GeoFeature[];
}

interface CaseDot {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  r: number;
  delay: number;
  cluster: number;
  alpha: number;
  born: boolean;
}

/* ─── Geo helpers ─── */
const projectCoords = (
  lon: number,
  lat: number,
  bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number },
  w: number,
  h: number,
  padding: number
): [number, number] => {
  const drawW = w - padding * 2;
  const drawH = h - padding * 2;
  const geoW = bounds.maxLon - bounds.minLon;
  const geoH = bounds.maxLat - bounds.minLat;
  const scale = Math.min(drawW / geoW, drawH / geoH);
  const offsetX = padding + (drawW - geoW * scale) / 2;
  const offsetY = padding + (drawH - geoH * scale) / 2;
  const x = offsetX + (lon - bounds.minLon) * scale;
  const y = offsetY + (bounds.maxLat - lat) * scale; // flip Y
  return [x, y];
};

const getBounds = (features: GeoFeature[]) => {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  features.forEach((f) => {
    const rings =
      f.geometry.type === 'MultiPolygon'
        ? (f.geometry.coordinates as number[][][][]).flat()
        : (f.geometry.coordinates as number[][][]);
    rings.forEach((ring) =>
      ring.forEach(([lon, lat]) => {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      })
    );
  });
  // Add small padding to bounds
  const padLon = (maxLon - minLon) * 0.05;
  const padLat = (maxLat - minLat) * 0.05;
  return {
    minLon: minLon - padLon,
    maxLon: maxLon + padLon,
    minLat: minLat - padLat,
    maxLat: maxLat + padLat,
  };
};

/* ─── Generate case dots that land inside municipality polygons ─── */
const pointInPolygon = (x: number, y: number, polygon: number[][]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};

const generateDotsInFeatures = (
  features: GeoFeature[],
  bounds: ReturnType<typeof getBounds>,
  w: number,
  h: number,
  padding: number,
  count: number
): CaseDot[] => {
  const dots: CaseDot[] = [];
  // Weight by municipality (Bucaramanga most cases)
  const weights: Record<string, number> = {
    '68001': 0.40, // Bucaramanga
    '68276': 0.25, // Floridablanca
    '68307': 0.15, // Girón
    '68547': 0.20, // Piedecuesta
  };

  const projectedPolygons = features.map((f) => {
    const rings =
      f.geometry.type === 'MultiPolygon'
        ? (f.geometry.coordinates as number[][][][]).flat()
        : (f.geometry.coordinates as number[][][]);
    return {
      code: f.properties.MPIO_CCNCT,
      rings: rings.map((ring) => ring.map(([lon, lat]) => projectCoords(lon, lat, bounds, w, h, padding))),
    };
  });

  // Generate dots per municipality
  for (const pp of projectedPolygons) {
    const weight = weights[pp.code] || 0.1;
    const n = Math.round(count * weight);
    const mainRing = pp.rings[0];
    // Bounding box of polygon
    let bMinX = Infinity, bMaxX = -Infinity, bMinY = Infinity, bMaxY = -Infinity;
    mainRing.forEach(([px, py]) => {
      if (px < bMinX) bMinX = px;
      if (px > bMaxX) bMaxX = px;
      if (py < bMinY) bMinY = py;
      if (py > bMaxY) bMaxY = py;
    });

    let placed = 0;
    let attempts = 0;
    while (placed < n && attempts < n * 20) {
      attempts++;
      const tx = bMinX + Math.random() * (bMaxX - bMinX);
      const ty = bMinY + Math.random() * (bMaxY - bMinY);
      if (pointInPolygon(tx, ty, mainRing)) {
        dots.push({
          x: tx + (Math.random() - 0.5) * 200,
          y: -30 - Math.random() * 250,
          targetX: tx,
          targetY: ty,
          r: Math.random() * 2 + 0.8,
          delay: Math.random() * 3.5,
          cluster: ['68001', '68276', '68307', '68547'].indexOf(pp.code),
          alpha: 0,
          born: false,
        });
        placed++;
      }
    }
  }

  return dots;
};

/* ─── Canvas Map Component ─── */
const MapCanvas: React.FC<{ active: boolean }> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<CaseDot[]>([]);
  const geoRef = useRef<GeoJSON | null>(null);
  const frameRef = useRef(0);
  const startTimeRef = useRef(0);
  const [loaded, setLoaded] = useState(false);


  // Load GeoJSON
  useEffect(() => {
    fetch('/amb_metropolitana.geojson')
      .then((r) => r.json())
      .then((data: GeoJSON) => {
        geoRef.current = data;
        setLoaded(true);
      })
      .catch((err) => console.error('Failed to load GeoJSON:', err));
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const geo = geoRef.current;
    if (!canvas || !geo) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 520;
    const w = size;
    const h = size;
    const padding = 40;

    ctx.clearRect(0, 0, w, h);

    const bounds = getBounds(geo.features);

    /* ── 1. Background ── */
    const baseBg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.55);
    baseBg.addColorStop(0, '#0f1a2e');
    baseBg.addColorStop(0.6, '#0c1524');
    baseBg.addColorStop(1, '#060a14');
    ctx.fillStyle = baseBg;
    ctx.fillRect(0, 0, w, h);

    /* ── 2. Draw municipality polygons ── */
    const colors: Record<string, string> = {
      '68001': 'rgba(0, 180, 255, 0.08)', // Bucaramanga
      '68276': 'rgba(0, 160, 230, 0.06)', // Floridablanca
      '68307': 'rgba(0, 140, 200, 0.05)', // Girón
      '68547': 'rgba(0, 150, 220, 0.05)', // Piedecuesta
    };
    const strokeColors: Record<string, string> = {
      '68001': 'rgba(0, 200, 255, 0.35)',
      '68276': 'rgba(0, 180, 255, 0.25)',
      '68307': 'rgba(0, 160, 255, 0.20)',
      '68547': 'rgba(0, 170, 255, 0.22)',
    };

    geo.features.forEach((feature) => {
      const code = feature.properties.MPIO_CCNCT;
      const rings =
        feature.geometry.type === 'MultiPolygon'
          ? (feature.geometry.coordinates as number[][][][]).flat()
          : (feature.geometry.coordinates as number[][][]);

      rings.forEach((ring) => {
        ctx.beginPath();
        ring.forEach(([lon, lat], i) => {
          const [px, py] = projectCoords(lon, lat, bounds, w, h, padding);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        });
        ctx.closePath();

        // Fill
        ctx.fillStyle = colors[code] || 'rgba(0, 150, 255, 0.04)';
        ctx.fill();

        // Stroke
        ctx.strokeStyle = strokeColors[code] || 'rgba(0, 150, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Municipality label
      const mainRing =
        feature.geometry.type === 'MultiPolygon'
          ? (feature.geometry.coordinates as number[][][][])[0][0]
          : (feature.geometry.coordinates as number[][][])[0];
      // Centroid approximation
      let cLon = 0, cLat = 0;
      mainRing.forEach(([lon, lat]) => { cLon += lon; cLat += lat; });
      cLon /= mainRing.length;
      cLat /= mainRing.length;
      const [lx, ly] = projectCoords(cLon, cLat, bounds, w, h, padding);

      ctx.font = '600 9px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
      ctx.fillText(feature.properties.MPIO_CNMBR, lx, ly);
    });

    /* ── 3. Internal grid pattern for realism ── */
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.lineWidth = 0.4;
    for (let gx = padding; gx < w - padding; gx += 15) {
      ctx.beginPath();
      ctx.moveTo(gx, padding);
      ctx.lineTo(gx, h - padding);
      ctx.stroke();
    }
    for (let gy = padding; gy < h - padding; gy += 15) {
      ctx.beginPath();
      ctx.moveTo(padding, gy);
      ctx.lineTo(w - padding, gy);
      ctx.stroke();
    }

    if (!active) dotsRef.current = [];
    /* ── 4. Initialize dots on first active frame ── */
    if (active && dotsRef.current.length === 0 && geo.features.length > 0) {
      dotsRef.current = generateDotsInFeatures(geo.features, bounds, w, h, padding, 500);
      startTimeRef.current = performance.now();
    }

    /* ── 5. Animate case dots ── */
    const elapsed = active ? (performance.now() - startTimeRef.current) / 1000 : 0;
    let visibleCount = 0;

    dotsRef.current.forEach((dot) => {
      if (!active) return;
      if (elapsed >= dot.delay && !dot.born) dot.born = true;
      if (!dot.born) return;

      // Lerp to target
      dot.x += (dot.targetX - dot.x) * 0.045;
      dot.y += (dot.targetY - dot.y) * 0.045;
      dot.alpha = Math.min(dot.alpha + 0.015, 0.85);
      visibleCount++;

      // Glow halo
      const glow = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, dot.r * 6);
      glow.addColorStop(0, `rgba(0, 180, 255, ${dot.alpha * 0.25})`);
      glow.addColorStop(1, 'rgba(0, 180, 255, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(dot.x - dot.r * 6, dot.y - dot.r * 6, dot.r * 12, dot.r * 12);

      // Core
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      const clusterColors = ['#00e5ff', '#00b8ff', '#0099dd', '#00aaee'];
      ctx.fillStyle = clusterColors[dot.cluster] || '#00b8ff';
      ctx.globalAlpha = dot.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    });



    /* ── 6. Pulsing cluster hotspots ── */
    if (active && elapsed > 2) {
      // Hotspots at real centroids of Bucaramanga and Floridablanca
      const hotspots = geo.features
        .filter((f) => ['68001', '68276'].includes(f.properties.MPIO_CCNCT))
        .map((f) => {
          const ring =
            f.geometry.type === 'MultiPolygon'
              ? (f.geometry.coordinates as number[][][][])[0][0]
              : (f.geometry.coordinates as number[][][])[0];
          let cLon = 0, cLat = 0;
          ring.forEach(([lon, lat]) => { cLon += lon; cLat += lat; });
          return projectCoords(cLon / ring.length, cLat / ring.length, bounds, w, h, padding);
        });

      hotspots.forEach(([hx, hy], i) => {
        const pulse = Math.sin(elapsed * 1.5 + i * 2.5) * 0.5 + 0.5;
        const pr = 25 + pulse * 15;
        ctx.beginPath();
        ctx.arc(hx, hy, pr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 220, 255, ${0.06 + pulse * 0.08})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    /* ── 7. Compass + Scale ── */
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = '700 10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', w - 25, 25);
    ctx.beginPath();
    ctx.moveTo(w - 25, 29);
    ctx.lineTo(w - 25, 44);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.stroke();
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(w - 28, 32);
    ctx.lineTo(w - 25, 25);
    ctx.lineTo(w - 22, 32);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Scale bar
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(18, h - 22);
    ctx.lineTo(78, h - 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(18, h - 26);
    ctx.lineTo(18, h - 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(78, h - 26);
    ctx.lineTo(78, h - 18);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = '500 8px Inter, system-ui, sans-serif';
    ctx.fillText('5 km', 48, h - 10);

    /* ── 8. Counter overlay ── */
    if (active && visibleCount > 0) {
      ctx.fillStyle = 'rgba(0, 200, 255, 0.2)';
      ctx.font = '600 9px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${visibleCount} casos georreferenciados`, 18, 22);
    }

    /* ── 9. Title ── */
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.font = '500 8px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Área Metropolitana de Bucaramanga — DANE 2018 / SIVIGILA 2025', 18, h - 38);

    frameRef.current = requestAnimationFrame(draw);
  }, [active, loaded]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loaded) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 520;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw, loaded]);

  if (!loaded) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          aspectRatio: '1',
          borderRadius: '20px',
          background: 'rgba(12, 18, 30, 0.6)',
          border: '1px solid rgba(0, 180, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.85rem',
        }}
      >
        Cargando mapa...
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        maxWidth: '520px',
        height: 'auto',
        aspectRatio: '1',
        borderRadius: '20px',
        border: '1px solid rgba(0, 180, 255, 0.1)',
        boxShadow:
          '0 0 60px rgba(0, 100, 255, 0.1), 0 0 120px rgba(0, 50, 120, 0.05), inset 0 0 60px rgba(0, 50, 120, 0.03)',
      }}
    />
  );
};

/* ─── Main Section ─── */
const TerritorySection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [mapActive, setMapActive] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) return;

    gsap.fromTo(
      sectionRef.current.querySelectorAll('.territory-text'),
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 55%',
      onEnter: () => setMapActive(true),
      onLeaveBack: () => setMapActive(false),
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      id="territory"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6rem 2rem',
        background: 'linear-gradient(180deg, #0d1425 0%, #060a14 50%, #0b0f19 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '30%',
          width: '40vw',
          height: '40vw',
          background: 'radial-gradient(ellipse, rgba(0,100,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(40px)',
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          maxWidth: '1100px',
          width: '100%',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Real GeoJSON Map */}
        <div
          className="territory-text"
          style={{ display: 'flex', justifyContent: 'center', opacity: 0 }}
        >
          <MapCanvas active={mapActive} />
        </div>

        {/* Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <span
            className="territory-text"
            style={{
              display: 'inline-block',
              padding: '0.4rem 1.2rem',
              borderRadius: '100px',
              background: 'rgba(0,150,255,0.1)',
              border: '1px solid rgba(0,150,255,0.2)',
              color: '#00b8ff',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              width: 'fit-content',
              opacity: 0,
            }}
          >
            El Territorio
          </span>

          <h2
            className="territory-text"
            style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              margin: 0,
              opacity: 0,
            }}
          >
            La enfermedad{' '}
            <span style={{ color: '#00b8ff' }}>no ataca al azar.</span>
          </h2>

          <p
            className="territory-text"
            style={{
              fontSize: 'clamp(0.95rem, 1.4vw, 1.15rem)',
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.8,
              margin: 0,
              maxWidth: '500px',
              opacity: 0,
            }}
          >
            Sigue patrones geográficos y climáticos precisos. Nuestros datos georreferenciados
            revelan <strong style={{ color: '#00d4ff' }}>clusters de alta densidad</strong> en
            los municipios del Área Metropolitana de Bucaramanga, donde las condiciones
            ambientales favorecen la propagación del vector <em>Aedes aegypti</em>.
          </p>

          {/* Stats */}
          <div
            className="territory-text"
            style={{ display: 'flex', gap: '2rem', marginTop: '1rem', opacity: 0 }}
          >
            {[
              { value: '2,400+', label: 'Casos Bucaramanga' },
              { value: '4', label: 'Municipios AMB' },
              { value: '27%', label: 'del total deptal.' },
            ].map((stat, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00b8ff' }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Fuente */}
          <p
            className="territory-text"
            style={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.2)',
              marginTop: '0.5rem',
              opacity: 0,
            }}
          >
            Fuente cartográfica: Marco Geoestadístico Nacional — DANE 2018
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          #territory > div:nth-child(2) {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </section>
  );
};

export default TerritorySection;
