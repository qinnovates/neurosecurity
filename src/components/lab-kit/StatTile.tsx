import type { ReactNode } from 'react';
import HatchSwatch from './HatchSwatch';
import { useCountTransition } from './motion/use-count-transition';

interface Props {
  label: string;
  /** Computed by the caller from the data or the model. Never typed in. */
  figure: number;
  /** What the figure counts, set small after it: "of 174", "open". */
  unit?: string;
  /**
   * True when the figure is zero only because nothing of this kind was assessed. The tile
   * then says so in words: a bare zero would read as "none found".
   */
  isNotAssessed?: boolean;
  /** A line under the label. */
  note?: ReactNode;
}

const NOT_ASSESSED_LABEL = 'Not assessed';

/** One large figure with its label. A changed figure swaps at once and is marked for a moment. */
export default function StatTile({ label, figure, unit, isNotAssessed = false, note }: Props) {
  const { value, hasChanged } = useCountTransition(figure);
  return (
    <div className="lab-stat">
      {isNotAssessed ? (
        <span className="lab-stat-figure" data-not-assessed="true"><HatchSwatch /> {NOT_ASSESSED_LABEL}</span>
      ) : (
        <span className="lab-stat-figure">
          <span data-changed={hasChanged}>{value}</span>
          {unit !== undefined && <span className="lab-stat-unit">{unit}</span>}
        </span>
      )}
      <span className="lab-stat-label">{label}</span>
      {note !== undefined && <span className="lab-stat-note">{note}</span>}
    </div>
  );
}
