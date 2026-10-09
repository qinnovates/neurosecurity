import { HatchFill } from '@/components/lab-kit/HatchSwatch';
import SeverityMark from '@/components/lab-kit/SeverityMark';
import SplitBar, { type SplitBarKind, type SplitBarSegment } from '@/components/lab-kit/SplitBar';
import { CATALOG_SEVERITY_HEADING, SCOPE_TERMS, SCOPE_TERM_LABELS, type ScopeTerm } from '@/lib/threat-model/lab-terms';
import type { SeverityCoverage } from '@/lib/threat-model/placement-coverage';

interface Props {
  coverage: SeverityCoverage;
}

export const COVERAGE_TITLE = 'Coverage by catalog severity';
const SUBJECT = 'catalog techniques';
/** How each scope term is drawn. The hatch is "not assessed" and nothing else. */
const KIND_BY_TERM: Readonly<Record<ScopeTerm, SplitBarKind>> = { applies: 'solid', would_apply_if: 'soft', reviewed_outside: 'open', not_assessed: 'hatch' };

function toSegments(byTerm: Record<ScopeTerm, number>): SplitBarSegment[] {
  return SCOPE_TERMS.map((term) => ({ id: term, label: SCOPE_TERM_LABELS[term], count: byTerm[term], kind: KIND_BY_TERM[term] }));
}

/** Every catalog technique, by catalog severity and by where it stands against this device. Each integer is printed. */
export default function CoverageBySeverity({ coverage }: Props) {
  return (
    <table className="model-coverage">
      <caption className="sr-only">{COVERAGE_TITLE}</caption>
      <thead>
        <tr>
          <th scope="col">{CATALOG_SEVERITY_HEADING}</th>
          <th scope="col"><span className="sr-only">Share</span></th>
          {SCOPE_TERMS.map((term) => (
            <th key={term} scope="col" className="model-coverage-figure">
              <span className="lab-splitbar-key" data-kind={KIND_BY_TERM[term]} aria-hidden="true">{KIND_BY_TERM[term] === 'hatch' && <HatchFill />}</span>{' '}
              {SCOPE_TERM_LABELS[term]}
            </th>
          ))}
          <th scope="col" className="model-coverage-figure">Total</th>
        </tr>
      </thead>
      <tbody>
        {coverage.rows.map((row) => (
          <tr key={row.severity}>
            <th scope="row"><SeverityMark severity={row.severity} /></th>
            <td className="model-coverage-bar"><SplitBar subject={SUBJECT} segments={toSegments(row.byTerm)} isListHidden /></td>
            {SCOPE_TERMS.map((term) => <td key={term} className="model-coverage-figure lab-figure">{row.byTerm[term]}</td>)}
            <td className="model-coverage-figure lab-figure">{row.total}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Total</th>
          <td className="model-coverage-bar"><SplitBar subject={SUBJECT} segments={toSegments(coverage.totalsByTerm)} isListHidden /></td>
          {SCOPE_TERMS.map((term) => <td key={term} className="model-coverage-figure lab-figure">{coverage.totalsByTerm[term]}</td>)}
          <td className="model-coverage-figure lab-figure">{coverage.total}</td>
        </tr>
      </tfoot>
    </table>
  );
}
