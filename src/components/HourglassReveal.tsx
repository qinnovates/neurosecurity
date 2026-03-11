import { useEffect, useRef, useState } from 'react';

/**
 * HourglassReveal — 11 bands of the QIF hourglass build from I0 outward on scroll.
 * Gold interface center → green neural bands upward → blue synthetic bands downward.
 */

interface Band {
  id: string;
  name: string;
  zone: string;
  color: string;
  description: string;
}

interface Props {
  bands: Band[];
  widths: readonly number[];
}

export default function HourglassReveal({ bands, widths }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

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

  // Build order: I0 (index 7) first, then pairs expanding outward
  // N1+S1 (6,8), N2+S2 (5,9), N3+S3 (4,10), N4 (3), N5 (2), N6 (1), N7 (0)
  const getDelay = (index: number): number => {
    const i0 = 7;
    const distance = Math.abs(index - i0);
    return distance * 120; // 120ms stagger per layer
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto px-4">
      <div className="flex flex-col items-center gap-[3px]">
        {bands.map((band, i) => {
          const width = widths[i];
          const delay = getDelay(i);
          const isInterface = band.zone === 'interface';

          return (
            <div
              key={band.id}
              className="relative group flex items-center justify-center"
              style={{
                width: '100%',
                maxWidth: '100%',
              }}
            >
              {/* Band bar */}
              <div
                className="relative rounded-full overflow-hidden"
                style={{
                  width: revealed ? `${width}%` : '0%',
                  height: isInterface ? '28px' : '20px',
                  backgroundColor: band.color,
                  opacity: revealed ? 1 : 0,
                  transition: `width 800ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, opacity 400ms ease ${delay}ms`,
                  boxShadow: revealed
                    ? `0 0 ${isInterface ? '20px' : '10px'} ${band.color}40`
                    : 'none',
                }}
              >
                {/* Inner glow */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)`,
                  }}
                />
              </div>

              {/* Band label — appears after bar */}
              <div
                className="absolute left-0 right-0 flex items-center justify-between px-2 pointer-events-none"
                style={{
                  opacity: revealed ? 1 : 0,
                  transition: `opacity 500ms ease ${delay + 600}ms`,
                }}
              >
                <span
                  className="text-[9px] sm:text-[10px] font-mono tracking-wider uppercase"
                  style={{ color: band.color, textShadow: `0 0 8px ${band.color}60` }}
                >
                  {band.id}
                </span>
                <span
                  className="text-[9px] sm:text-[10px] font-light tracking-wide hidden sm:inline"
                  style={{ color: `${band.color}cc` }}
                >
                  {band.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone labels */}
      <div
        className="flex justify-between mt-6 text-[10px] sm:text-xs tracking-[0.15em] uppercase"
        style={{
          opacity: revealed ? 1 : 0,
          transition: 'opacity 800ms ease 1600ms',
        }}
      >
        <span className="text-[#166534]">Neural</span>
        <span className="text-[#f59e0b]">Interface</span>
        <span className="text-[#3b82f6]">Synthetic</span>
      </div>
    </div>
  );
}
