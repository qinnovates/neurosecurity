import type { CatalogSeverity } from '@/lib/threat-model/catalog-types';

const SEVERITY_LABELS: Readonly<Record<CatalogSeverity, string>> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
const STRIPE_WIDTH = 4;
const STRIPE_BOX_HEIGHT = 14;
/** Stripe height in pixels. Height carries the order, so it reads without colour. */
const STRIPE_HEIGHT: Readonly<Record<CatalogSeverity, number>> = { critical: 14, high: 10, medium: 6, low: 3 };

interface Props {
  severity: CatalogSeverity;
  /** Hide the word when a column header or neighbour already says it. The stripe keeps an accessible name. */
  isLabelHidden?: boolean;
}

/** Severity as a word with a stripe beside it: the taller the stripe, the more severe. Only Critical is red. */
export default function SeverityMark({ severity, isLabelHidden = false }: Props) {
  const height = STRIPE_HEIGHT[severity];
  return (
    <span className="lab-severity" data-severity={severity}>
      <svg
        className="lab-severity-stripe" width={STRIPE_WIDTH} height={STRIPE_BOX_HEIGHT} viewBox={`0 0 ${STRIPE_WIDTH} ${STRIPE_BOX_HEIGHT}`} fill="currentColor" shapeRendering="crispEdges" focusable="false"
        role={isLabelHidden ? 'img' : undefined} aria-label={isLabelHidden ? `Severity: ${SEVERITY_LABELS[severity]}` : undefined} aria-hidden={isLabelHidden ? undefined : true}
      >
        <rect x="0" y={STRIPE_BOX_HEIGHT - height} width={STRIPE_WIDTH} height={height} />
      </svg>
      {!isLabelHidden && <span>{SEVERITY_LABELS[severity]}</span>}
    </span>
  );
}
