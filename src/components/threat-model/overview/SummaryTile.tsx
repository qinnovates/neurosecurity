import StatTile from '@/components/lab-kit/StatTile';
import type { HeadlineFigure } from '@/lib/threat-model/headline-figures';
import { NONE_ON_DEVICE_LABEL, hasPlacementDecision, type TermCounts } from '../frame/scope-by-kind';

interface Props {
  /** One of the figures the Overview and the Report share, counted by `summariseHeadlineFigures`. */
  figure: HeadlineFigure;
  /** Where the catalog's techniques of this kind stand against the device. Leave out for a figure that is never an unexplained zero. */
  termCounts?: TermCounts;
}

/**
 * One headline figure. When there is nothing of the kind to count, it says why in words and
 * never prints a bare zero: "none on this device" where placement decisions exist for the
 * kind, "not assessed" only where none does.
 */
export default function SummaryTile({ figure, termCounts }: Props) {
  const note = figure.note ?? undefined;
  if (figure.isNotAssessed && termCounts !== undefined && hasPlacementDecision(termCounts)) {
    return (
      <div className="lab-stat">
        <span className="lab-stat-figure" data-not-assessed="true">{NONE_ON_DEVICE_LABEL}</span>
        <span className="lab-stat-label">{figure.label}</span>
        {note !== undefined && <span className="lab-stat-note">{note}</span>}
      </div>
    );
  }
  return <StatTile label={figure.label} figure={figure.figure} unit={figure.unit} isNotAssessed={figure.isNotAssessed} note={note} />;
}
