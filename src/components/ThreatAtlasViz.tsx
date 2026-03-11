import { useEffect, useRef, useState } from 'react';

/**
 * ThreatAtlasViz — 109 severity-colored dots scatter then cluster onto brain regions.
 * Dots start random, then migrate to their anatomical band region on the brain image.
 * Counter animates 0→total.
 */

interface Props {
  total: number;
  bySeverity: { critical: number; high: number; medium: number; low: number };
}

// Band regions — cx/cy as % of the brain IMAGE (1452x794)
const BAND_REGIONS = [
  { id: 'N7', count: 45, color: '#dc2626', cx: 38, cy: 12, spread: 8 },
  { id: 'N6', count: 31, color: '#ef4444', cx: 30, cy: 42, spread: 5 },
  { id: 'N5', count: 22, color: '#f97316', cx: 34, cy: 34, spread: 5 },
  { id: 'N4', count: 18, color: '#fb923c', cx: 27, cy: 50, spread: 4 },
  { id: 'N3', count: 14, color: '#fbbf24', cx: 14, cy: 58, spread: 5 },
  { id: 'N2', count: 8,  color: '#fcd34d', cx: 22, cy: 66, spread: 3 },
  { id: 'N1', count: 18, color: '#fb923c', cx: 26, cy: 82, spread: 4 },
];

// Seeded pseudo-random
const seed = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

interface Dot {
  band: string;
  color: string;
  sx: number; sy: number; // scattered start (% of container)
  tx: number; ty: number; // target on brain (% of container)
  delay: number;
}

function generateDots(): Dot[] {
  const dots: Dot[] = [];
  let idx = 0;

  for (const band of BAND_REGIONS) {
    for (let i = 0; i < band.count; i++) {
      // Scattered position across full container
      const sx = 5 + seed(idx * 3) * 90;
      const sy = 5 + seed(idx * 3 + 1) * 90;

      // Target: clustered around band center with spread
      const angle = seed(idx * 3 + 2) * Math.PI * 2;
      const dist = seed(idx * 5) * band.spread;
      const tx = band.cx + Math.cos(angle) * dist;
      const ty = band.cy + Math.sin(angle) * dist;

      dots.push({
        band: band.id,
        color: band.color,
        sx, sy, tx, ty,
        delay: idx * 8 + seed(idx * 7) * 300,
      });
      idx++;
    }
  }
  return dots;
}

export default function ThreatAtlasViz({ total }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'hidden' | 'scattered' | 'clustered'>('hidden');
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const dots = useRef(generateDots()).current;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase('scattered');
          setTimeout(() => setPhase('clustered'), 1000);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animate counter
  useEffect(() => {
    if (phase !== 'clustered') return;
    const duration = 2000;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * total);
      if (value !== countRef.current) {
        countRef.current = value;
        setCount(value);
      }
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [phase, total]);

  const isVisible = phase !== 'hidden';
  const isClustered = phase === 'clustered';

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto px-4">
      {/* Counter */}
      <div
        className="text-center mb-6"
        style={{
          opacity: isClustered ? 1 : 0,
          transform: isClustered ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 800ms cubic-bezier(0.16, 1, 0.3, 1) 300ms',
        }}
      >
        <span className="text-6xl sm:text-7xl font-bold font-[family-name:var(--font-heading)] bg-gradient-to-b from-[#f97316] to-[#ef4444] bg-clip-text text-transparent">
          {count}
        </span>
      </div>

      {/* Brain image + dot overlay container */}
      <div className="relative w-full">
        {/* Brain image — sets the container size */}
        <img
          src="/images/brain-lateral.png"
          alt=""
          className="w-full h-auto block"
          style={{
            opacity: isVisible ? 0.25 : 0,
            transition: 'opacity 1200ms ease 200ms',
          }}
        />

        {/* Dots — absolutely positioned over the image using % */}
        {dots.map((dot, i) => {
          const left = isClustered ? dot.tx : dot.sx;
          const top = isClustered ? dot.ty : dot.sy;

          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: isVisible ? '6px' : '0px',
                height: isVisible ? '6px' : '0px',
                backgroundColor: dot.color,
                opacity: isVisible ? 0.85 : 0,
                transform: 'translate(-50%, -50%)',
                transition: `left 1200ms cubic-bezier(0.16, 1, 0.3, 1) ${dot.delay}ms, top 1200ms cubic-bezier(0.16, 1, 0.3, 1) ${dot.delay}ms, width 500ms ease ${dot.delay * 0.3}ms, height 500ms ease ${dot.delay * 0.3}ms, opacity 400ms ease ${dot.delay * 0.3}ms`,
                boxShadow: dot.color === '#dc2626' ? `0 0 4px ${dot.color}80` : undefined,
              }}
            />
          );
        })}
      </div>

      {/* Band legend */}
      <div
        className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-4 text-[10px] sm:text-xs"
        style={{
          opacity: isClustered ? 1 : 0,
          transition: 'opacity 800ms ease 2200ms',
        }}
      >
        {BAND_REGIONS.map((b) => (
          <div key={b.id} className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ backgroundColor: b.color }}
            />
            <span className="text-[var(--color-text-muted)]">
              {b.id} <span className="opacity-60">({b.count})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
