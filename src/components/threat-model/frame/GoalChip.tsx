import FilterChip from '@/components/lab-kit/FilterChip';
import HatchSwatch from '@/components/lab-kit/HatchSwatch';
import { NOT_ASSESSED_LABEL, describeTermCounts, zeroLabelFor, type TermCounts } from './scope-by-kind';

interface Props {
  label: string;
  /** Open rows from the technique catalog this filter would leave. */
  catalogCount: number;
  /** Open rows from the generic baseline that count under this filter; leave out where the baseline has none. */
  baselineCount?: number;
  /** Where the catalog's techniques of this kind stand against the device, so a zero says what is true. */
  termCounts: TermCounts;
  isPressed: boolean;
  onToggle: () => void;
}

const BASELINE_WORD = 'baseline';

/**
 * A filter over the device's rows. A zero is never printed bare: the chip says "none on this
 * device" where placement decisions exist for the kind, and "not assessed" only where none
 * does. Baseline rows are counted apart from catalog rows, so a number made only of the
 * generic baseline never stands in for catalog techniques nobody has assessed.
 */
export default function GoalChip({ label, catalogCount, baselineCount = 0, termCounts, isPressed, onToggle }: Props) {
  const zeroLabel = zeroLabelFor(catalogCount, termCounts);
  if (zeroLabel === null && baselineCount === 0) return <FilterChip label={label} count={catalogCount} isPressed={isPressed} onToggle={onToggle} />;
  const isNotAssessed = zeroLabel === NOT_ASSESSED_LABEL;
  const detail = zeroLabel === null ? '' : describeTermCounts(termCounts);
  return (
    <button
      type="button" className="lab-chip" aria-pressed={isPressed} data-not-assessed={isNotAssessed} data-zero={zeroLabel !== null}
      title={detail === '' ? undefined : detail} onClick={onToggle}
    >
      <span>{label}</span>{' '}
      {zeroLabel === null
        ? <span className="lab-figure">{catalogCount}</span>
        : <>{isNotAssessed && <HatchSwatch />}<span className="model-chip-zero">{zeroLabel}</span></>}
      {baselineCount > 0 && <>{' '}<span>+ <span className="lab-figure">{baselineCount}</span> {BASELINE_WORD}</span></>}
    </button>
  );
}
