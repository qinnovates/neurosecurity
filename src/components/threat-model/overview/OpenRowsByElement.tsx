import HatchSwatch from '@/components/lab-kit/HatchSwatch';
import Legend from '@/components/lab-kit/Legend';
import { CATALOG_SEVERITIES, type CatalogSeverity } from '@/lib/threat-model/catalog-types';
import { CATALOG_SEVERITY_LABELS } from '@/lib/threat-model/lab-terms';
import type { ElementRowCounts } from '@/lib/threat-model/register-counts';
import { isZeroNotAssessed } from '../frame/facet-counts';
import { useModelHighlight } from '../model-highlight';
import { shareOfLongest } from './CoverageBySeverity';
import StackBar, { StackKey, type StackTone } from './StackBar';

interface Props {
  /** One entry per part and connection, in model order, counted over the whole device. */
  elementCounts: readonly ElementRowCounts[];
  /** True when some catalog technique has no placement decision, so an element with no row cannot be read as "none". */
  isCoverageIncomplete: boolean;
  /** Narrows the Model mode to the element and opens its rows. */
  onSelectElement: (elementId: string) => void;
}

export const OPEN_ROWS_TITLE = 'Open rows by part and connection';
const NOT_ASSESSED_LABEL = 'Not assessed';
/** Severity by fill: only Critical is red; the rest step down in ink. */
const TONE_BY_SEVERITY: Readonly<Record<CatalogSeverity, StackTone>> = { critical: 'critical', high: 'strong', medium: 'medium', low: 'light' };

interface LineProps extends Omit<Props, 'elementCounts'> {
  counts: ElementRowCounts;
  /** The most catalog rows on any one part or connection: the length every bar is measured against. */
  mostRows: number;
}

/**
 * One part or connection. Its track is as long as its rows are of the largest count, so the
 * lines rank by length; the filled part is the rows still open, and the empty rest of the
 * track is the rows with a decision.
 */
function ElementLine({ counts, mostRows, isCoverageIncomplete, onSelectElement }: LineProps) {
  const highlight = useModelHighlight();
  const isNotAssessed = isZeroNotAssessed(counts.catalogRows, isCoverageIncomplete);
  const segments = CATALOG_SEVERITIES.map((severity) => ({
    id: severity, label: CATALOG_SEVERITY_LABELS[severity], count: counts.openBySeverity[severity], tone: TONE_BY_SEVERITY[severity],
  }));
  return (
    <li>
      <button type="button" className="model-element-line" data-kind={counts.kind} onClick={() => onSelectElement(counts.id)} {...highlight.bind(counts.id)}>
        <span className="model-element-label" title={counts.label}>{counts.label}</span>
        {isNotAssessed ? <span className="model-element-bar lab-soft"><HatchSwatch /> {NOT_ASSESSED_LABEL}</span> : (
          <>
            <span className="model-element-bar">
              <span className="model-element-scale" style={{ width: shareOfLongest(counts.catalogRows, mostRows) }}>
                <StackBar subject={`open rows on ${counts.label}`} segments={segments} remainder={counts.catalogRows - counts.openCatalogRows} />
              </span>
            </span>
            <span className="model-element-figure"><span className="lab-figure">{counts.openCatalogRows}</span> open of <span className="lab-figure">{counts.catalogRows}</span></span>
          </>
        )}
      </button>
    </li>
  );
}

/** Where the open rows sit: one bar per part and connection in model order, on one scale, split by catalog severity. */
export default function OpenRowsByElement({ elementCounts, isCoverageIncomplete, onSelectElement }: Props) {
  const mostRows = Math.max(0, ...elementCounts.map((counts) => counts.catalogRows));
  return (
    <>
      <ul className="model-element-lines">
        {elementCounts.map((counts) => (
          <ElementLine key={counts.id} counts={counts} mostRows={mostRows} isCoverageIncomplete={isCoverageIncomplete} onSelectElement={onSelectElement} />
        ))}
      </ul>
      <Legend
        label="Catalog severity of the open rows"
        items={CATALOG_SEVERITIES.map((severity) => ({ id: severity, mark: <StackKey tone={TONE_BY_SEVERITY[severity]} />, name: CATALOG_SEVERITY_LABELS[severity] }))}
      />
    </>
  );
}
