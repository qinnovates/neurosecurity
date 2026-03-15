import { useEffect, useRef, useCallback } from 'react';
import { useLens } from './hooks/useLens';
import type { Lens } from '../lib/lens';
import { LENS_LABELS } from '../lib/lens';

const LENSES: Lens[] = ['security', 'both', 'clinical'];

const ACCENT: Record<Lens, { bg: string; border: string; text: string; glow: string }> = {
  security: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.3)',
    text: '#1d4ed8',
    glow: '0 0 10px rgba(59, 130, 246, 0.1)',
  },
  both: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.3)',
    text: '#1d4ed8',
    glow: '0 0 10px rgba(59, 130, 246, 0.1)',
  },
  clinical: {
    bg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.3)',
    text: '#0e7490',
    glow: '0 0 10px rgba(6, 182, 212, 0.1)',
  },
};

/**
 * 3-state segmented control: Security | Both | Clinical.
 * Compact pill with sliding indicator and roving tabindex.
 */
export default function LensToggle() {
  const { lens, setLens } = useLens();
  const groupRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);

  useEffect(() => { hasMounted.current = true; }, []);

  // Keyboard shortcuts (S / B / C when not in an input)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === 's') { e.preventDefault(); setLens('security'); }
      else if (key === 'b') { e.preventDefault(); setLens('both'); }
      else if (key === 'c') { e.preventDefault(); setLens('clinical'); }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setLens]);

  // Roving tabindex: arrow keys move between buttons
  const onKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = (idx + 1) % LENSES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = (idx - 1 + LENSES.length) % LENSES.length;
    } else {
      return;
    }
    e.preventDefault();
    const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    if (buttons?.[next]) {
      buttons[next].focus();
      setLens(LENSES[next]);
    }
  }, [setLens]);

  const activeIndex = LENSES.indexOf(lens);
  const accent = ACCENT[lens];
  const shortcutKeys: Record<Lens, string> = { security: 'S', both: 'B', clinical: 'C' };

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={groupRef}
        className="relative inline-flex items-center rounded-full p-px"
        style={{
          background: 'var(--color-glass-bg)',
          border: '1px solid var(--color-glass-border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        role="radiogroup"
        aria-label="Analysis lens"
      >
        {/* Sliding indicator */}
        <span
          className="absolute top-px bottom-px rounded-full transition-all duration-300 ease-out"
          style={{
            width: `calc(${100 / LENSES.length}% - 2px)`,
            left: `calc(${(activeIndex * 100) / LENSES.length}% + 1px)`,
            background: accent.bg,
            border: `1px solid ${accent.border}`,
            boxShadow: accent.glow,
          }}
          aria-hidden="true"
        />

        {LENSES.map((l, i) => {
          const isActive = lens === l;
          const colors = ACCENT[l];
          const label = LENS_LABELS[l];

          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`${label.name} lens (${shortcutKeys[l]})`}
              onClick={() => setLens(l)}
              onKeyDown={(e) => onKeyDown(e, i)}
              tabIndex={isActive ? 0 : -1}
              className="relative z-10 flex items-center px-2 py-2 rounded-full text-[11px] font-semibold tracking-wide transition-colors duration-200 cursor-pointer select-none"
              style={{
                color: isActive ? colors.text : 'var(--color-text-muted)',
              }}
            >
              <span style={{ letterSpacing: '0.05em' }}>{label.name}</span>
            </button>
          );
        })}
      </div>

      {/* Live announcer for screen readers */}
      <div
        aria-live="polite"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {hasMounted.current ? (lens === 'both' ? 'Viewing both lenses' : `Viewing as ${LENS_LABELS[lens].name}`) : ''}
      </div>
    </div>
  );
}
