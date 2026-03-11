import { useEffect, useRef, useState } from 'react';

/**
 * DualUseSplit — The dual-use discovery visualization.
 * 109 dots start unified, then split: 77 mirror to therapy (green), 25 remain as silicon-only (dimmed).
 * The emotional peak of the scroll narrative.
 */

interface Props {
  therapeutic: number;
  siliconOnly: number;
  total: number;
}

// Seeded pseudo-random
const seed = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export default function DualUseSplit({ therapeutic, siliconOnly, total }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'hidden' | 'unified' | 'split'>('hidden');
  const [therapyCount, setTherapyCount] = useState(0);
  const therapyRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Phase 1: show unified
          setPhase('unified');
          // Phase 2: split after delay
          setTimeout(() => setPhase('split'), 1200);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animate therapy counter during split
  useEffect(() => {
    if (phase !== 'split') return;
    const duration = 1500;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * therapeutic);
      if (value !== therapyRef.current) {
        therapyRef.current = value;
        setTherapyCount(value);
      }
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [phase, therapeutic]);

  // Generate dot positions for both columns
  const dots = useRef(
    Array.from({ length: total }, (_, i) => ({
      isTherapeutic: i < therapeutic,
      // Unified position (center column)
      ux: 50 + (seed(i * 2) - 0.5) * 30,
      uy: 5 + seed(i * 2 + 1) * 90,
      // Split positions
      attackX: 22 + (seed(i * 3) - 0.5) * 28,
      therapyX: 78 + (seed(i * 3 + 1) - 0.5) * 28,
      splitY: 5 + seed(i * 3 + 2) * 90,
      delay: i * 8,
    }))
  ).current;

  const isVisible = phase !== 'hidden';
  const isSplit = phase === 'split';

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto px-4">
      {/* Column headers — appear on split */}
      <div
        className="flex justify-between px-8 sm:px-16 mb-4"
        style={{
          opacity: isSplit ? 1 : 0,
          transition: 'opacity 800ms ease 400ms',
        }}
      >
        <div className="text-center">
          <span className="text-xs sm:text-sm tracking-wider uppercase text-[#f97316]/80">
            Attack
          </span>
        </div>
        <div className="text-center">
          <span className="text-xs sm:text-sm tracking-wider uppercase text-emerald-400/80">
            Therapy
          </span>
        </div>
      </div>

      {/* Visualization */}
      <svg viewBox="0 0 100 100" className="w-full" style={{ maxHeight: '350px' }}>
        {/* Center divider line — appears on split */}
        <line
          x1="50"
          y1="0"
          x2="50"
          y2="100"
          stroke="currentColor"
          strokeWidth="0.2"
          strokeDasharray="2,2"
          className="text-[var(--color-text-faint)]"
          style={{
            opacity: isSplit ? 0.3 : 0,
            transition: 'opacity 600ms ease 200ms',
          }}
        />

        {dots.map((dot, i) => {
          const cx = isSplit
            ? dot.isTherapeutic
              ? dot.attackX // attack side
              : dot.attackX // silicon-only stays on attack side
            : dot.ux;
          const cy = isSplit ? dot.splitY : dot.uy;

          // Attack-side color
          const attackColor = dot.isTherapeutic ? '#f97316' : '#64748b';
          const attackOpacity = dot.isTherapeutic ? 0.8 : 0.35;

          return (
            <g key={i}>
              {/* Attack dot */}
              <circle
                cx={cx}
                cy={cy}
                r={isVisible ? 0.7 : 0}
                fill={isSplit ? attackColor : '#f97316'}
                style={{
                  opacity: isVisible ? (isSplit ? attackOpacity : 0.6) : 0,
                  transition: `cx 1200ms cubic-bezier(0.16, 1, 0.3, 1) ${dot.delay}ms, cy 1200ms cubic-bezier(0.16, 1, 0.3, 1) ${dot.delay}ms, r 500ms ease ${dot.delay}ms, opacity 500ms ease ${dot.delay}ms, fill 800ms ease ${dot.delay}ms`,
                }}
              />
              {/* Therapy mirror dot — only for dual-use techniques */}
              {dot.isTherapeutic && (
                <circle
                  cx={isSplit ? dot.therapyX : dot.ux}
                  cy={isSplit ? dot.splitY : dot.uy}
                  r={isSplit ? 0.7 : 0}
                  fill="#10b981"
                  style={{
                    opacity: isSplit ? 0.8 : 0,
                    transition: `cx 1200ms cubic-bezier(0.16, 1, 0.3, 1) ${dot.delay + 200}ms, cy 1200ms cubic-bezier(0.16, 1, 0.3, 1) ${dot.delay + 200}ms, r 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${dot.delay + 400}ms, opacity 600ms ease ${dot.delay + 400}ms`,
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Counters */}
      <div
        className="flex justify-between px-8 sm:px-16 mt-4"
        style={{
          opacity: isSplit ? 1 : 0,
          transition: 'opacity 800ms ease 800ms',
        }}
      >
        <div className="text-center">
          <span className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] text-[#f97316]">
            {total}
          </span>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1">techniques</p>
        </div>
        <div className="text-center">
          <span className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] text-emerald-400">
            {therapyCount}
          </span>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1">therapeutic mirrors</p>
        </div>
      </div>
    </div>
  );
}
