import { useEffect } from 'react';
import { useLens } from './hooks/useLens';
import type { Lens } from '../lib/lens';
import { LENS_LABELS } from '../lib/lens';

const LENSES: Lens[] = ['security', 'clinical'];

/**
 * Segmented control for switching between Security and Clinical lenses.
 * Renders as a glass-morphism pill with a sliding indicator.
 * Keyboard shortcuts: S = security, C = clinical (when not focused on an input).
 */
export default function LensToggle() {
  const { lens, setLens } = useLens();

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Skip if modifier keys are held
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setLens('security');
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setLens('clinical');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setLens]);

  const activeIndex = LENSES.indexOf(lens);

  return (
    <div
      className="relative inline-flex items-center rounded-full p-0.5"
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
        className="absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 ease-out"
        style={{
          width: 'calc(50% - 2px)',
          left: activeIndex === 0 ? '2px' : 'calc(50%)',
          background:
            lens === 'security'
              ? 'rgba(59, 130, 246, 0.15)'
              : 'rgba(6, 182, 212, 0.15)',
          border: `1px solid ${
            lens === 'security'
              ? 'rgba(59, 130, 246, 0.3)'
              : 'rgba(6, 182, 212, 0.3)'
          }`,
          boxShadow:
            lens === 'security'
              ? '0 0 12px rgba(59, 130, 246, 0.1)'
              : '0 0 12px rgba(6, 182, 212, 0.1)',
        }}
        aria-hidden="true"
      />

      {LENSES.map((l) => {
        const isActive = lens === l;
        const label = LENS_LABELS[l];

        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${label.name} lens${l === 'security' ? ' (S)' : ' (C)'}`}
            onClick={() => setLens(l)}
            className="relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-colors duration-200 cursor-pointer select-none"
            style={{
              color: isActive
                ? l === 'security'
                  ? 'var(--color-accent-primary)'
                  : 'var(--color-accent-secondary)'
                : 'var(--color-text-muted)',
            }}
          >
            {/* Status dot */}
            <span
              className="inline-block w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                background: isActive
                  ? l === 'security'
                    ? '#3b82f6'
                    : '#06b6d4'
                  : 'var(--color-text-faint)',
                boxShadow: isActive
                  ? l === 'security'
                    ? '0 0 6px rgba(59, 130, 246, 0.5)'
                    : '0 0 6px rgba(6, 182, 212, 0.5)'
                  : 'none',
              }}
              aria-hidden="true"
            />
            <span style={{ letterSpacing: '0.05em' }}>{label.name}</span>
            <kbd
              className="hidden sm:inline-block ml-0.5 px-1 py-px rounded text-[0.6rem] font-mono transition-opacity duration-200"
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-faint)',
                opacity: isActive ? 0.7 : 0.4,
              }}
              aria-hidden="true"
            >
              {l === 'security' ? 'S' : 'C'}
            </kbd>
          </button>
        );
      })}
    </div>
  );
}
