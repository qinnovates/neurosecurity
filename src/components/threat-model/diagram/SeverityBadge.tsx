import { CATALOG_SEVERITIES, type CatalogSeverity } from '@/lib/threat-model/catalog-types';
import { NOT_ASSESSED_LABEL, splitBar, type ElementBadge } from './element-badges';

export const BADGE_BAR_WIDTH = 40;
/** The badge takes one row of this height, whatever it says, so every element's badge is the same size. */
export const BADGE_ROW_HEIGHT = 14;
const BAR_HEIGHT = 10;
const BAR_DROP = 2;
/** A share's height says its severity, as the kit's severity stripe does: the taller, the more severe. */
export const SHARE_HEIGHT: Readonly<Record<CatalogSeverity, number>> = { critical: 10, high: 7, medium: 4, low: 2 };
const TEXT_GAP = 6;
const TEXT_BASELINE = 11;
const SWATCH_SIZE = 12;
/** Space left between two shares of the bar, so neighbours of the same colour stay distinct. */
const SHARE_GAP = 1;

interface Props {
  badge: ElementBadge;
  x: number;
  y: number;
  /** Id of the hatch pattern in the same drawing. */
  hatchId: string;
}

function severityCounts(badge: ElementBadge): Record<string, number> {
  if (badge.kind !== 'split') return {};
  return Object.fromEntries(CATALOG_SEVERITIES.map((severity) => [`data-${severity}`, badge.bySeverity[severity]]));
}

/**
 * Open catalog rows on one part or connection: a bar split by catalog severity, each share as
 * tall as its severity, with the total printed beside it. Where nothing is placed on the element it is the hatch and the words
 * "not assessed"; a zero is printed only for an element that has rows.
 */
export default function SeverityBadge({ badge, x, y, hatchId }: Props) {
  if (badge.kind === 'not-assessed') {
    return (
      <g className="lab-diagram-badge" data-badge="not-assessed" aria-hidden="true">
        <rect className="lab-diagram-badge-hatch" x={x + 0.5} y={y + 1.5} width={SWATCH_SIZE - 1} height={SWATCH_SIZE - 1} fill={`url(#${hatchId})`} />
        <text x={x + SWATCH_SIZE + TEXT_GAP - 1} y={y + TEXT_BASELINE}>{NOT_ASSESSED_LABEL}</text>
      </g>
    );
  }
  if (badge.kind === 'total') {
    return (
      <g className="lab-diagram-badge" data-badge="total" data-open={badge.open} aria-hidden="true">
        <text className="lab-diagram-badge-count" x={x} y={y + TEXT_BASELINE}>{badge.open} open</text>
      </g>
    );
  }
  const shares = splitBar(badge.bySeverity, BADGE_BAR_WIDTH);
  return (
    <g className="lab-diagram-badge" data-badge="split" data-open={badge.open} {...severityCounts(badge)} aria-hidden="true">
      {shares.map((share, index) => (
        <rect
          key={share.severity} className="lab-diagram-badge-share" data-severity={share.severity} data-count={share.count}
          x={x + share.x} y={y + BAR_DROP + BAR_HEIGHT - SHARE_HEIGHT[share.severity]}
          width={share.width - (index === shares.length - 1 ? 0 : SHARE_GAP)} height={SHARE_HEIGHT[share.severity]}
        />
      ))}
      <line className="lab-diagram-badge-base" x1={x} y1={y + BAR_DROP + BAR_HEIGHT + 0.5} x2={x + BADGE_BAR_WIDTH} y2={y + BAR_DROP + BAR_HEIGHT + 0.5} />
      <text className="lab-diagram-badge-count" x={x + BADGE_BAR_WIDTH + TEXT_GAP} y={y + TEXT_BASELINE}>{badge.open === 0 ? '0 open' : badge.open}</text>
    </g>
  );
}
