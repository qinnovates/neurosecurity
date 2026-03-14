/**
 * NissScoreBadge — Displays a NISS score with severity icon, score value,
 * and severity label in a colored rounded badge.
 *
 * Each severity level uses a unique Unicode shape for colorblind accessibility:
 *   none=○  low=◎  medium=▲  high=◆  critical=⬢
 */

import type { NissSeverity } from '../../lib/niss-parser';
import { SEVERITY_DISPLAY } from './niss-display-utils';

interface Props {
  /** Numeric NISS score (0.0-10.0) */
  score: number;
  /** Severity classification */
  severity: NissSeverity;
  /** Whether to display the numeric score (default: true) */
  showScore?: boolean;
  /** Badge size variant */
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: {
    badge: 'px-2 py-0.5 text-xs gap-1',
    icon: 'text-xs',
    score: 'text-xs font-bold',
    label: 'text-xs',
  },
  md: {
    badge: 'px-3 py-1 text-sm gap-1.5',
    icon: 'text-sm',
    score: 'text-sm font-bold',
    label: 'text-sm',
  },
  lg: {
    badge: 'px-4 py-1.5 text-base gap-2',
    icon: 'text-base',
    score: 'text-base font-bold',
    label: 'text-base',
  },
} as const;

export default function NissScoreBadge({
  score,
  severity,
  showScore = true,
  size = 'md',
}: Props) {
  const display = SEVERITY_DISPLAY[severity];
  const sizes = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${display.bg} ${display.border} ${display.text} ${sizes.badge}`}
      role="status"
      aria-label={`${display.ariaLabel}, score ${score.toFixed(1)}`}
    >
      <span className={sizes.icon} aria-hidden="true">
        {display.icon}
      </span>
      {showScore && (
        <span className={sizes.score}>{score.toFixed(1)}</span>
      )}
      <span className={sizes.label}>{display.label}</span>
    </span>
  );
}
