import type { KeyboardEvent, MouseEvent } from 'react';
import type { RegionRow } from '@/lib/atlas-explorer/region-rows';
import MarkGlyph, { MARK_WORDS } from './MarkGlyph';
import ReviewMark from './ReviewMark';

interface Props {
  row: RegionRow;
  isSelected: boolean;
  /** Exactly one row is the list's tab stop; the arrow keys move between rows. */
  isTabStop: boolean;
  onSelect: (regionId: string, byKeyboard: boolean) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, regionId: string) => void;
}

/** A structure marked by a ring alone has no shape to fill, whatever the lens holds for it. */
const MARKER_WORDS = 'location marker, no shape to fill';

/** A click from the keyboard carries no pointer detail. */
function isKeyboardClick(event: MouseEvent<HTMLButtonElement>): boolean {
  return event.detail === 0;
}

/**
 * One region as a button whose text says everything the row shows: the region,
 * what stands for it and why, its review state, and what the active lens holds
 * for it. The mark is also an attribute, for the 3D view and for tests.
 */
export default function RegionRowButton({ row, isSelected, isTabStop, onSelect, onKeyDown }: Props) {
  return (
    <li className="atlas-row-item" data-row-id={row.id}>
      <button
        type="button" className="atlas-row" data-region-id={row.id} data-mark={row.lens.mark} data-standing={row.lens.standing}
        aria-current={isSelected ? 'true' : undefined} tabIndex={isTabStop ? 0 : -1}
        onClick={(event) => onSelect(row.id, isKeyboardClick(event))} onKeyDown={(event) => onKeyDown(event, row.id)}
      >
        <span className="atlas-cell atlas-cell-name">
          <span className="atlas-row-name">{row.name}</span>
          <span className="sr-only">, band {row.bandId}.</span>
        </span>
        <span className="atlas-cell atlas-cell-geometry" data-geometry={row.geometryState}>
          <span className="sr-only">Shape: </span>
          <span className="atlas-row-fact">{row.geometryLabel}</span>
          {row.geometryReason !== null && row.geometryState !== 'drawn' && <span className="atlas-row-why">{row.geometryReason}</span>}
          <ReviewMark state={row.reviewState} />
        </span>
        <span className="atlas-cell atlas-cell-lens" key={`${row.lens.standing}:${row.lens.value}`}>
          <span className="sr-only">Under this lens: </span>
          <span className="atlas-row-value"><MarkGlyph mark={row.lens.mark} />{row.lens.value}</span>
          <span className="atlas-row-why">{row.lens.reason}; {row.geometryState === 'marker_only' ? MARKER_WORDS : MARK_WORDS[row.lens.mark]}</span>
          {row.lens.reviewState !== null && <ReviewMark state={row.lens.reviewState} />}
        </span>
      </button>
    </li>
  );
}
