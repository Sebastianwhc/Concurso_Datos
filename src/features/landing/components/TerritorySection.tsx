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
interface MapCanvasProps {
  active: boolean;
  height: number;
}

const MapCanvas: React.FC<MapCanvasProps> = ({ active, height }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<CaseDot[]>([]);
  const geoRef = useRef<GeoJSON | null>(null);
  const frameRef = useRef(0);
  const startTimeRef = useRef(0);
  const sizeRef = useRef(340);
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

    const size = sizeRef.current || 340;
    const w = size;
    const h = size;
    const padding = Math.round(size * 0.077); // ~40px at 520, scales down

    ctx.clearRect(0, 0, w, h);

    const bounds = getBounds(geo.features);

    /* ── 1. Background ── */
    const baseBg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.55);
    baseBg.addColorStop(0, '#0a101d');
    baseBg.addColorStop(0.7, '#05080f');
    baseBg.addColorStop(1, '#03050a');
    ctx.fillStyle = baseBg;
    ctx.fillRect(0, 0, w, h);

    /* ── 2. Draw municipality polygons ── */
    const colors: Record<string, string> = {
      '68001': 'rgba(0, 229, 255, 0.09)', // Bucaramanga (brightest cian)
      '68276': 'rgba(0, 184, 255, 0.07)', // Floridablanca (cian-blue)
      '68307': 'rgba(0, 140, 255, 0.05)', // Girón (deep cian)
      '68547': 'rgba(0, 100, 255, 0.06)', // Piedecuesta (deep blue)
    };
    const strokeColors: Record<string, string> = {
      '68001': 'rgba(0, 229, 255, 0.55)', // Bucaramanga
      '68276': 'rgba(0, 184, 255, 0.45)', // Floridablanca
      '68307': 'rgba(0, 150, 255, 0.35)', // Girón
      '68547': 'rgba(0, 170, 255, 0.40)', // Piedecuesta
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

      ctx.font = `600 ${Math.round(size * 0.017)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
      ctx.fillText(feature.properties.MPIO_CNMBR, lx, ly);
    });

    /* ── 3. Internal grid pattern for realism ── */
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.025)';
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
    const sc = size / 520; // scale factor
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = `700 ${Math.round(10 * sc)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('N', w - 25 * sc, 25 * sc);
    ctx.beginPath();
    ctx.moveTo(w - 25 * sc, 29 * sc);
    ctx.lineTo(w - 25 * sc, 44 * sc);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w - 28 * sc, 32 * sc);
    ctx.lineTo(w - 25 * sc, 25 * sc);
    ctx.lineTo(w - 22 * sc, 32 * sc);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Scale bar
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(18 * sc, h - 22 * sc);
    ctx.lineTo(78 * sc, h - 22 * sc);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(18 * sc, h - 26 * sc);
    ctx.lineTo(18 * sc, h - 18 * sc);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(78 * sc, h - 26 * sc);
    ctx.lineTo(78 * sc, h - 18 * sc);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = `500 ${Math.round(8 * sc)}px Inter, system-ui, sans-serif`;
    ctx.fillText('5 km', 48 * sc, h - 10 * sc);

    /* ── 8. Counter overlay ── */
    if (active && visibleCount > 0) {
      ctx.fillStyle = 'rgba(0, 200, 255, 0.25)';
      ctx.font = `600 ${Math.round(9 * sc)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(`${visibleCount} casos georreferenciados`, w - 18 * sc, 22 * sc);
    }

    frameRef.current = requestAnimationFrame(draw);
  }, [active, loaded]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper || !loaded) return;

    const applySize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = Math.min(wrapper.clientWidth, height);
      sizeRef.current = size;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      // Reset dots so they regenerate at new scale
      dotsRef.current = [];
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
    };

    applySize();
    const ro = new ResizeObserver(() => {
      applySize();
    });
    ro.observe(wrapper);

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, [draw, loaded, height]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 960;
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: isMobile ? '100%' : `${height}px`,
    height: isMobile ? undefined : `${height}px`,
    aspectRatio: isMobile ? '1' : undefined,
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid rgba(0, 229, 255, 0.2)',
    boxShadow: '0 0 50px rgba(0, 229, 255, 0.12), inset 0 0 30px rgba(0, 229, 255, 0.06)',
    background: 'rgba(2, 4, 8, 0.75)',
  };

  if (!loaded) {
    return (
      <div ref={wrapperRef} style={{ ...wrapperStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Cargando mapa...</span>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} style={wrapperStyle}>
      {/* Upper discrete label */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '20px',
        zIndex: 10,
        fontSize: '0.65rem',
        fontWeight: 700,
        color: 'rgba(0, 229, 255, 0.45)',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        background: 'rgba(5, 8, 16, 0.65)',
        padding: '0.25rem 0.65rem',
        borderRadius: '6px',
        border: '1px solid rgba(0, 229, 255, 0.12)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        pointerEvents: 'none',
      }}>
        ANÁLISIS ESPACIAL
      </div>

      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          borderRadius: '20px',
        }}
      />

      {/* Lower discrete label */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '20px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.15rem',
        textAlign: 'left',
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.5px' }}>
          ÁREA METROPOLITANA DE BUCARAMANGA
        </span>
        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2px' }}>
          Fuente: DANE 2018 + SIVIGILA
        </span>
      </div>
    </div>
  );
};

/* ─── Main Section ─── */
interface TerritorySectionProps {
  bucaramangaCases2025: number;
}

const TerritorySection: React.FC<TerritorySectionProps> = ({ bucaramangaCases2025 }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const [mapActive, setMapActive] = useState(false);
  const [santanderData, setSantanderData] = useState<any>(null);
  const [rightHeight, setRightHeight] = useState<number>(600);

  useEffect(() => {
    fetch('/data/santander_dengue.json')
      .then((r) => r.json())
      .then((data) => setSantanderData(data))
      .catch((err) => console.error('Failed to load Santander data:', err));
  }, []);

  useEffect(() => {
    const el = rightColumnRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.height > 0) {
          setRightHeight(entry.contentRect.height);
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [santanderData]);

  const totalSantander = React.useMemo(() => {
    if (!santanderData) return 0;
    return santanderData.municipios.reduce((acc: number, m: any) => acc + m.total, 0);
  }, [santanderData]);

  const totalAMB = React.useMemo(() => {
    if (!santanderData) return 0;
    const ambCodes = new Set(['001', '276', '307', '547']);
    return santanderData.municipios
      .filter((m: any) => ambCodes.has(m.code))
      .reduce((acc: number, m: any) => acc + m.total, 0);
  }, [santanderData]);

  const totalAMBGraves = React.useMemo(() => {
    if (!santanderData) return 0;
    const ambCodes = new Set(['001', '276', '307', '547']);
    return santanderData.municipios
      .filter((m: any) => ambCodes.has(m.code))
      .reduce((acc: number, m: any) => acc + m.graves, 0);
  }, [santanderData]);

  const ambPercent = React.useMemo(() => {
    if (totalSantander === 0) return '0%';
    return ((totalAMB / totalSantander) * 100).toFixed(1) + '%';
  }, [totalAMB, totalSantander]);

  const ambMuniCount = React.useMemo(() => {
    if (!santanderData) return 0;
    const ambCodes = new Set(['001', '276', '307', '547']);
    return santanderData.municipios.filter((m: any) => ambCodes.has(m.code)).length;
  }, [santanderData]);

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
  }, [santanderData]);

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
        padding: '6rem 1.5rem',
        background: 'linear-gradient(180deg, #060a14 0%, #070d18 40%, #0b0f19 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Ambient radial glow consistent with Act 2/3 */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(900px, 95vw)',
          height: 'min(900px, 95vw)',
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.05) 0%, rgba(0, 140, 255, 0.015) 45%, rgba(0, 140, 255, 0.005) 70%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(70px)',
        }}
      />

      <div className="territory-grid" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>

        {/* Header Block (Badge, Title, Description) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'center', alignItems: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <span
            className="territory-text"
            style={{
              display: 'inline-block',
              padding: '0.45rem 1.3rem',
              borderRadius: '100px',
              background: 'rgba(0, 229, 255, 0.07)',
              border: '1px solid rgba(0, 229, 255, 0.18)',
              color: '#00e5ff',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              width: 'fit-content',
              opacity: 0,
              boxShadow: '0 0 15px rgba(0, 229, 255, 0.12)',
            }}
          >
            EL TERRITORIO
          </span>

          <h2
            className="territory-text"
            style={{
              fontSize: 'clamp(1.9rem, 4.5vw, 3.2rem)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              margin: 0,
              letterSpacing: '-1.5px',
              opacity: 0,
            }}
          >
            LOS BROTES SIGUEN{' '}
            <span style={{
              background: 'linear-gradient(90deg, #00f0ff, #00b8ff, #0055ff)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}>
              PATRONES IDENTIFICABLES
            </span>
          </h2>

          <p
            className="territory-text"
            style={{
              fontSize: 'clamp(0.95rem, 1.5vw, 1.2rem)',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.8,
              margin: 0,
              opacity: 0,
            }}
          >
            Los datos georreferenciados muestran que la transmisión no se distribuye de manera uniforme. Al analizar la concentración histórica de casos es posible identificar territorios donde el riesgo epidemiológico persiste a lo largo del tiempo.
          </p>
        </div>

        {/* 60/40 Grid Layout */}
        <div className="territory-grid-layout">

          {/* Column Left (60%): Map Canvas with SIG overlay style */}
          <div className="territory-text territory-map-column" style={{ opacity: 0, display: 'flex', justifyContent: 'center', width: '100%' }}>
            <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

              {/* Depth Ambient Glow behind map */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '115%',
                  height: '115%',
                  background: 'radial-gradient(circle, rgba(0, 229, 255, 0.055) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  zIndex: 0,
                  filter: 'blur(60px)',
                }}
              />

              {/* The actual canvas with inside labels */}
              <MapCanvas active={mapActive} height={rightHeight} />
            </div>
          </div>

          {/* Column Right (40%): High-impact storytelling discoveries */}
          <div ref={rightColumnRef} style={{ display: 'flex', flexDirection: 'column', gap: '3rem', width: '100%', justifyContent: 'center' }}>

            {/* Gran Afirmación 1: Concentración Metropolitana (69.3%) */}
            <div className="territory-text" style={{ opacity: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left' }}>
              <span style={{
                fontSize: 'clamp(3.6rem, 5.5vw, 4.8rem)',
                fontWeight: 900,
                background: 'linear-gradient(90deg, #00f0ff, #00b8ff)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                lineHeight: 1,
                letterSpacing: '-2px',
                textShadow: '0 0 30px rgba(0, 229, 255, 0.2)',
                display: 'block',
              }}>
                {santanderData ? ambPercent : '...'}
              </span>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#00e5ff',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                display: 'block',
                marginTop: '0.3rem',
              }}>
                Concentración del Riesgo Regional
              </span>
              <p style={{
                fontSize: '0.98rem',
                color: 'rgba(255, 255, 255, 0.65)',
                lineHeight: 1.6,
                margin: '0.5rem 0 0 0',
              }}>
                Los {ambMuniCount || '4'} municipios del Área Metropolitana consolidan la gran mayoría de la carga epidemiológica de Santander. Tan solo en Bucaramanga, se reportaron {bucaramangaCases2025 > 0 ? bucaramangaCases2025.toLocaleString() : '...'} casos durante el año 2025.
              </p>
            </div>

            {/* Gran Afirmación 2: Casos Históricos (82,763) */}
            <div className="territory-text" style={{ opacity: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left' }}>
              <span style={{
                fontSize: 'clamp(3.6rem, 5.5vw, 4.8rem)',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1,
                letterSpacing: '-2px',
                textShadow: '0 0 30px rgba(255, 255, 255, 0.1)',
                display: 'block',
              }}>
                {totalAMB > 0 ? totalAMB.toLocaleString() : '...'}
              </span>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.45)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                display: 'block',
                marginTop: '0.3rem',
              }}>
                Casos Históricos en el Perímetro
              </span>
              <p style={{
                fontSize: '0.98rem',
                color: 'rgba(255, 255, 255, 0.65)',
                lineHeight: 1.6,
                margin: '0.5rem 0 0 0',
              }}>
                Decenas de miles de infecciones georreferenciadas revelan patrones persistentes de transmisión. La recurrencia espacial del brote dibuja un mapa de vulnerabilidad continuo a lo largo de los años.
              </p>
            </div>

            {/* Gran Afirmación 3: Casos Graves (8.146) */}
            <div className="territory-text" style={{ opacity: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left' }}>
              <span style={{
                fontSize: 'clamp(3.6rem, 5.5vw, 4.8rem)',
                fontWeight: 900,
                background: 'linear-gradient(90deg, #00b8ff, #0055ff)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                lineHeight: 1,
                letterSpacing: '-2px',
                textShadow: '0 0 30px rgba(0, 85, 255, 0.15)',
                display: 'block',
              }}>
                {totalAMBGraves > 0 ? totalAMBGraves.toLocaleString() : '...'}
              </span>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'rgba(0, 184, 255, 0.85)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                display: 'block',
                marginTop: '0.3rem',
              }}>
                Alertas Clínicas de Dengue Grave
              </span>
              <p style={{
                fontSize: '0.98rem',
                color: 'rgba(255, 255, 255, 0.65)',
                lineHeight: 1.6,
                margin: '0.5rem 0 0 0',
              }}>
                Casos severos registrados en el área demuestran que la escala territorial del brote tiene consecuencias clínicas directas, exigiendo un enfoque preventivo de micro-focalización espacial.
              </p>
            </div>

          </div>

        </div>

        {/* Transición Narrativa hacia Acto 6 */}
        <p
          className="territory-text"
          style={{
            textAlign: 'center',
            fontSize: 'clamp(0.95rem, 1.4vw, 1.25rem)',
            color: 'rgba(255,255,255,0.55)',
            maxWidth: '700px',
            margin: '6rem auto 0 auto',
            lineHeight: 1.6,
            opacity: 0,
          }}
        >
          Comprender dónde ocurre el riesgo es fundamental. El siguiente paso es <span style={{ color: '#00b8ff', fontWeight: 600 }}>anticipar cuándo</span> podría volver a aparecer.
        </p>

      </div>

      <style>{`
        .territory-grid {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        .territory-grid-layout {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 4.5rem;
          width: 100%;
          align-items: center;
        }
        @media (max-width: 960px) {
          .territory-grid-layout {
            grid-template-columns: 1fr !important;
            gap: 3.5rem !important;
          }
        }
      `}</style>
    </section>
  );
};

export default TerritorySection;

