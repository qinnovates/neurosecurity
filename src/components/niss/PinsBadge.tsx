/**
 * PinsBadge — Renders a PINS (Potential Impact to Neural Safety) alert badge.
 *
 * Only renders when pins is true. Uses role="alert" for screen reader
 * announcement and a subtle pulse animation to draw attention.
 */

interface Props {
  /** Whether PINS flag is active */
  pins: boolean;
  /** Badge size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show explanation text below the badge */
  showExplanation?: boolean;
}

const SIZE_CLASSES = {
  sm: {
    badge: 'px-2 py-0.5 text-xs gap-1',
    icon: 'text-xs',
    label: 'text-xs font-semibold',
    explanation: 'text-xs mt-1',
  },
  md: {
    badge: 'px-3 py-1 text-sm gap-1.5',
    icon: 'text-sm',
    label: 'text-sm font-semibold',
    explanation: 'text-sm mt-1.5',
  },
  lg: {
    badge: 'px-4 py-1.5 text-base gap-2',
    icon: 'text-base',
    label: 'text-base font-semibold',
    explanation: 'text-base mt-2',
  },
} as const;

const EXPLANATION =
  'PINS triggers when Biological Impact is High/Critical or Reversibility is Irreversible. Indicates potential lasting harm to neural safety.';

export default function PinsBadge({
  pins,
  size = 'md',
  showExplanation = false,
}: Props) {
  if (!pins) return null;

  const sizes = SIZE_CLASSES[size];

  return (
    <div className="inline-flex flex-col">
      <span
        className={`inline-flex items-center rounded-full border border-red-500/40 bg-red-500/15 text-red-400 animate-pulse ${sizes.badge}`}
        role="alert"
        aria-label="PINS: Potential Impact to Neural Safety flag is active"
      >
        <span className={sizes.icon} aria-hidden="true">
          {/* Shield icon (Unicode) */}
          {'\uD83D\uDEE1\uFE0F'}
        </span>
        <span className={sizes.label}>PINS</span>
      </span>
      {showExplanation && (
        <span className={`${sizes.explanation} text-red-400/70 max-w-xs`}>
          {EXPLANATION}
        </span>
      )}
    </div>
  );
}
