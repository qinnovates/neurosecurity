import type { CatalogSeverity } from '@/lib/threat-model/catalog-types';

const SEVERITY_LABELS: Record<CatalogSeverity, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

/** Severity as a word with a coloured stripe beside it. The colour never sits behind the text. */
export default function SeverityMark({ severity }: { severity: CatalogSeverity }) {
  return <span className="lab-severity" data-severity={severity}>{SEVERITY_LABELS[severity]}</span>;
}
