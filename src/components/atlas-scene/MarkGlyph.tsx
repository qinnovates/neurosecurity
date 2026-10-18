import type { RowMark } from '@/lib/atlas-explorer/region-lens';

/** What each mark means in words, for the legend. The row itself also says it in text. */
export const MARK_WORDS: Readonly<Record<RowMark, string>> = {
  solid: 'shape filled',
  inside_or_mixed: 'shape not filled: inside or mixed',
  no_data: 'shape empty: no data',
  context: 'shape with no QIF record',
  no_shape: 'no shape drawn',
  varies: 'shapes differ',
};

interface Props {
  mark: RowMark;
}

/**
 * A small square that mirrors how the 3D view marks a shape: filled, half
 * filled, outlined, dashed, or absent. Decorative: the words beside it carry
 * the meaning.
 */
export default function MarkGlyph({ mark }: Props) {
  return (
    <svg className="atlas-glyph" data-mark={mark} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <rect className="atlas-glyph-frame" x="1.5" y="1.5" width="11" height="11" rx="2" />
      {mark === 'solid' && <rect className="atlas-glyph-fill" x="1.5" y="1.5" width="11" height="11" rx="2" />}
      {(mark === 'inside_or_mixed' || mark === 'varies') && <path className="atlas-glyph-fill" d="M1.5 12.5V3.5a2 2 0 0 1 2-2h9Z" />}
      {mark === 'no_shape' && <path className="atlas-glyph-stroke" d="M4 10 10 4" />}
    </svg>
  );
}
