import FilterChip from '@/components/lab-kit/FilterChip';
import HatchSwatch from '@/components/lab-kit/HatchSwatch';
import { isZeroNotAssessed } from './facet-counts';

interface Props {
  label: string;
  /** Open rows from the technique catalog this effect would leave. */
  catalogCount: number;
  /** Open rows from the generic baseline that count under this effect. */
  baselineCount: number;
  /** True when some catalog technique with this effect has no placement decision. */
  isIncomplete: boolean;
  isPressed: boolean;
  onToggle: () => void;
}

const NOT_ASSESSED_LABEL = 'not assessed';
const BASELINE_WORD = 'baseline';

/**
 * An effect filter. Baseline rows are counted apart from catalog rows, so a number made
 * only of the generic baseline never stands in for catalog techniques nobody has assessed.
 */
export default function GoalChip({ label, catalogCount, baselineCount, isIncomplete, isPressed, onToggle }: Props) {
  const isNotAssessed = isZeroNotAssessed(catalogCount, isIncomplete);
  if (baselineCount === 0) return <FilterChip label={label} count={catalogCount} isNotAssessed={isNotAssessed} isPressed={isPressed} onToggle={onToggle} />;
  return (
    <button type="button" className="lab-chip" aria-pressed={isPressed} data-not-assessed={isNotAssessed} onClick={onToggle}>
      <span>{label}</span>{' '}
      {isNotAssessed ? <><HatchSwatch /><span>{NOT_ASSESSED_LABEL}</span></> : <span className="lab-figure">{catalogCount}</span>}{' '}
      <span>+ <span className="lab-figure">{baselineCount}</span> {BASELINE_WORD}</span>
    </button>
  );
}
