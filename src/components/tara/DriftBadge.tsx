import { useState } from 'react';
import { DRIFT_CONFIG, type DriftCode } from './drift-constants';

interface DriftBadgeProps {
  drift: DriftCode | null;
  driftWindow: string | null;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const SIZE_STYLES = {
  sm: {
    fontSize: '0.7rem',
    padding: '2px 8px',
    gap: '3px',
    lineHeight: '1.4',
  },
  md: {
    fontSize: '0.8rem',
    padding: '4px 12px',
    gap: '5px',
    lineHeight: '1.5',
  },
} as const;

export default function DriftBadge({
  drift,
  driftWindow,
  size = 'sm',
  showLabel = true,
}: DriftBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!drift) return null;

  const config = DRIFT_CONFIG[drift];
  if (!config) return null;

  const sizeStyle = SIZE_STYLES[size];
  const ariaLabel = `Drift: ${config.label}${driftWindow ? ` (${driftWindow})` : ''}`;

  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      <span
        role="status"
        aria-label={ariaLabel}
        tabIndex={0}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: sizeStyle.gap,
          padding: sizeStyle.padding,
          fontSize: sizeStyle.fontSize,
          lineHeight: sizeStyle.lineHeight,
          fontWeight: 600,
          fontFamily: 'var(--font-mono, monospace)',
          letterSpacing: '0.04em',
          color: config.color,
          background: config.bg,
          border: `1px solid ${config.border}`,
          borderRadius: '9999px',
          cursor: driftWindow ? 'help' : 'default',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          transition: 'opacity 0.15s ease',
        }}
      >
        <span aria-hidden="true">{config.icon}</span>
        {showLabel && <span>{config.label}</span>}
      </span>

      {driftWindow && showTooltip && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '6px',
            padding: '4px 10px',
            fontSize: '0.7rem',
            lineHeight: '1.4',
            fontWeight: 400,
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
            color: 'var(--color-text-primary, #fafafa)',
            background: 'var(--color-bg-elevated, #27272a)',
            border: '1px solid var(--color-border, rgba(255, 255, 255, 0.06))',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 50,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          {driftWindow}
        </span>
      )}
    </span>
  );
}
