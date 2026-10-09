import { useRef } from 'react';
import HatchSwatch from './HatchSwatch';
import { useCountTransition } from './motion/use-count-transition';

interface Props {
  label: string;
  /** How many rows this filter would leave on screen. */
  count: number;
  isPressed: boolean;
  /**
   * True when the count is zero because nothing of this kind has been assessed. The chip
   * then says so in words, because a bare zero would read as "none found".
   */
  isNotAssessed?: boolean;
  onToggle: () => void;
}

const NOT_ASSESSED_LABEL = 'not assessed';

/** A filter that always shows what choosing it would leave. */
export default function FilterChip({ label, count, isPressed, isNotAssessed = false, onToggle }: Props) {
  const figureRef = useRef<HTMLSpanElement>(null);
  const { value, hasChanged } = useCountTransition(count, figureRef);
  return (
    <button type="button" className="lab-chip" aria-pressed={isPressed} data-not-assessed={isNotAssessed} onClick={onToggle}>
      {/* The space keeps the accessible name as separate words; the flex gap sets the visual spacing. */}
      <span>{label}</span>{' '}
      {isNotAssessed
        ? <><HatchSwatch /><span>{NOT_ASSESSED_LABEL}</span></>
        : <span className="lab-figure" ref={figureRef} data-changed={hasChanged}>{value}</span>}
    </button>
  );
}
