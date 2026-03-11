import { useEffect, useRef, useState } from 'react';

/**
 * NeurorightsPentagon — 5 neurorights as a radar/pentagon visualization.
 * Vertices scale proportionally to technique threat count. MI (81) is the largest.
 * Edges draw themselves on scroll, then vertices pulse to size.
 */

interface Right {
  code: string;
  name: string;
  count: number;
  color: string;
}

interface Props {
  rights: Right[];
}

const DEFAULTS: Right[] = [
  { code: 'MI', name: 'Mental Integrity', count: 81, color: '#ef4444' },
  { code: 'MP', name: 'Mental Privacy', count: 64, color: '#f59e0b' },
  { code: 'CL', name: 'Cognitive Liberty', count: 60, color: '#3b82f6' },
  { code: 'PC', name: 'Psychological Continuity', count: 28, color: '#8b5cf6' },
  { code: 'EA', name: 'Equal Access', count: 0, color: '#10b981' },
];

export default function NeurorightsPentagon({ rights = DEFAULTS }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [counts, setCounts] = useState<number[]>(rights.map(() => 0));
  const countsRef = useRef<number[]>(rights.map(() => 0));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animate counters
  useEffect(() => {
    if (!revealed) return;
    const duration = 2000;
    const start = performance.now();
    const targets = rights.map((r) => r.count);

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const newCounts = targets.map((t) => Math.round(eased * t));
      const changed = newCounts.some((v, i) => v !== countsRef.current[i]);
      if (changed) {
        countsRef.current = newCounts;
        setCounts([...newCounts]);
      }
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [revealed, rights]);

  // Pentagon geometry
  const cx = 50,
    cy = 50;
  const maxRadius = 38;
  const maxCount = Math.max(...rights.map((r) => r.count), 1);

  // Vertices at equal angles, starting from top
  const vertices = rights.map((right, i) => {
    const angle = (Math.PI * 2 * i) / rights.length - Math.PI / 2;
    const fullX = cx + maxRadius * Math.cos(angle);
    const fullY = cy + maxRadius * Math.sin(angle);
    const ratio = right.count / maxCount;
    const dataX = cx + maxRadius * ratio * Math.cos(angle);
    const dataY = cy + maxRadius * ratio * Math.sin(angle);
    return { ...right, angle, fullX, fullY, dataX, dataY, ratio, index: i };
  });

  // Outer pentagon path (full size)
  const outerPath = vertices.map((v, i) => `${i === 0 ? 'M' : 'L'}${v.fullX},${v.fullY}`).join(' ') + ' Z';

  // Data polygon path (scaled to counts)
  const dataPath = vertices.map((v, i) => `${i === 0 ? 'M' : 'L'}${v.dataX},${v.dataY}`).join(' ') + ' Z';

  // Grid rings (25%, 50%, 75%)
  const gridRings = [0.25, 0.5, 0.75].map((scale) => {
    const points = vertices.map((v) => {
      const x = cx + maxRadius * scale * Math.cos(v.angle);
      const y = cy + maxRadius * scale * Math.sin(v.angle);
      return `${x},${y}`;
    });
    return `M${points.join(' L')} Z`;
  });

  // Pentagon edge total length (approximate for stroke-dashoffset animation)
  const perimeterApprox = 5 * 2 * maxRadius * Math.sin(Math.PI / 5);

  return (
    <div ref={containerRef} className="w-full max-w-lg mx-auto px-4">
      <svg viewBox="0 0 100 100" className="w-full" style={{ maxHeight: '400px' }}>
        {/* Grid rings */}
        {gridRings.map((path, i) => (
          <path
            key={i}
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.15"
            className="text-[var(--color-text-faint)]"
            style={{
              opacity: revealed ? 0.15 : 0,
              transition: `opacity 800ms ease ${300 + i * 200}ms`,
            }}
          />
        ))}

        {/* Axis lines from center to vertices */}
        {vertices.map((v) => (
          <line
            key={`axis-${v.code}`}
            x1={cx}
            y1={cy}
            x2={v.fullX}
            y2={v.fullY}
            stroke="currentColor"
            strokeWidth="0.15"
            className="text-[var(--color-text-faint)]"
            style={{
              opacity: revealed ? 0.2 : 0,
              transition: `opacity 800ms ease 400ms`,
            }}
          />
        ))}

        {/* Outer pentagon — draws itself */}
        <path
          d={outerPath}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.3"
          className="text-[var(--color-text-faint)]"
          style={{
            strokeDasharray: perimeterApprox,
            strokeDashoffset: revealed ? 0 : perimeterApprox,
            opacity: revealed ? 0.3 : 0,
            transition: `stroke-dashoffset 1500ms cubic-bezier(0.16, 1, 0.3, 1) 200ms, opacity 400ms ease 200ms`,
          }}
        />

        {/* Data polygon — fills to proportional size */}
        <path
          d={revealed ? dataPath : `M${cx},${cy} L${cx},${cy} L${cx},${cy} L${cx},${cy} L${cx},${cy} Z`}
          fill="url(#pentagon-gradient)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.3"
          style={{
            opacity: revealed ? 1 : 0,
            transition: `d 1500ms cubic-bezier(0.16, 1, 0.3, 1) 800ms, opacity 600ms ease 800ms`,
          }}
        />

        {/* Gradient definition */}
        <defs>
          <radialGradient id="pentagon-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.15" />
          </radialGradient>
        </defs>

        {/* Vertex dots */}
        {vertices.map((v) => (
          <circle
            key={`dot-${v.code}`}
            cx={revealed ? v.dataX : cx}
            cy={revealed ? v.dataY : cy}
            r={revealed ? 1.2 + v.ratio * 1.5 : 0}
            fill={v.color}
            style={{
              filter: `drop-shadow(0 0 3px ${v.color}80)`,
              transition: `cx 1500ms cubic-bezier(0.16, 1, 0.3, 1) 800ms, cy 1500ms cubic-bezier(0.16, 1, 0.3, 1) 800ms, r 800ms cubic-bezier(0.34, 1.56, 0.64, 1) 1200ms`,
            }}
          />
        ))}

        {/* Vertex labels */}
        {vertices.map((v) => {
          // Push label outward from center
          const labelDist = maxRadius + 7;
          const lx = cx + labelDist * Math.cos(v.angle);
          const ly = cy + labelDist * Math.sin(v.angle);

          return (
            <g
              key={`label-${v.code}`}
              style={{
                opacity: revealed ? 1 : 0,
                transition: `opacity 600ms ease ${1400 + v.index * 150}ms`,
              }}
            >
              <text
                x={lx}
                y={ly - 1.5}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[3.5px] font-bold fill-[var(--color-text-primary)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {v.code}
              </text>
              <text
                x={lx}
                y={ly + 2.5}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[2px] fill-[var(--color-text-muted)]"
              >
                {v.count > 0 ? v.count : '—'}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Right names below */}
      <div
        className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-[10px] sm:text-xs"
        style={{
          opacity: revealed ? 1 : 0,
          transition: 'opacity 800ms ease 2200ms',
        }}
      >
        {rights.map((r) => (
          <div key={r.code} className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ backgroundColor: r.color }}
            />
            <span className="text-[var(--color-text-muted)]">{r.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
