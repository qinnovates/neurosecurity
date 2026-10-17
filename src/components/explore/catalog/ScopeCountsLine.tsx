import HatchSwatch from '@/components/lab-kit/HatchSwatch';
import type { CatalogScopeCounts } from '@/lib/threat-model/catalog-filter';
import { SCOPE_TERMS, SCOPE_TERM_LABELS, type ScopeTerm } from '@/lib/threat-model/lab-terms';

interface Props {
  /** Where the techniques stand with every filter applied except the "On this device" one. */
  counts: CatalogScopeCounts;
  /** The terms the reader has pressed. */
  pickedTerms: readonly ScopeTerm[];
}

/**
 * Printed while the "On this device" filter is on. A short or empty list then sits beside
 * how many techniques in view were never assessed, so it cannot be read as "none apply".
 */
export default function ScopeCountsLine({ counts, pickedTerms }: Props) {
  return (
    <p className="explore-scope-counts">
      <span className="lab-soft">Of <span className="lab-figure">{counts.shown}</span> matching the other filters:</span>
      {SCOPE_TERMS.map((term) => (
        <span key={term} className="explore-scope-count" data-term={term} data-picked={pickedTerms.includes(term)}>
          {term === 'not_assessed' && <HatchSwatch />}
          <span className="lab-figure">{counts.byTerm[term]}</span> {SCOPE_TERM_LABELS[term]}
        </span>
      ))}
    </p>
  );
}
