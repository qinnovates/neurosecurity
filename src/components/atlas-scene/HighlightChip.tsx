import { DEFAULT_LENS, HIGHLIGHT_LENS_KINDS, LENS_LABELS, lensSubjectId, type Lens } from '@/lib/atlas-explorer/lens-state';

interface Props {
  lens: Lens;
  /** The lens the highlight replaced, or null. Clearing goes back to it, or to the default. */
  previousLens: Lens | null;
  onClear: () => void;
}

/**
 * The state the lens bar cannot show: a chosen technique or device carries the
 * colour, so no bar button is pressed. The chip says what is carrying it, beside
 * the bar, and its cross ends it.
 */
export default function HighlightChip({ lens, previousLens, onClear }: Props) {
  const subjectId = lensSubjectId(lens);
  if (subjectId === null || !HIGHLIGHT_LENS_KINDS.includes(lens.kind)) return null;
  const words = `${LENS_LABELS[lens.kind]} ${subjectId}`;
  return (
    <p className="atlas-highlight-chip" data-highlight-chip="true">
      <span>{words}</span>
      <button type="button" className="atlas-highlight-clear" aria-label={`Clear ${words}, back to the ${LENS_LABELS[(previousLens ?? DEFAULT_LENS).kind]} lens`} onClick={onClear}>×</button>
    </p>
  );
}
