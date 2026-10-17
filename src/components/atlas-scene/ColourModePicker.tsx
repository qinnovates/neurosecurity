import { LENS_KINDS, LENS_LABELS, type LensKind } from '@/lib/atlas-explorer/lens-state';

interface Props {
  activeKind: LensKind;
  onChoose: (kind: LensKind) => void;
}

/**
 * Chooses the lens. Each choice is a real button; the bar behind them slides to
 * the active one, which shows that the lens changed and nothing more.
 */
export default function ColourModePicker({ activeKind, onChoose }: Props) {
  const activeIndex = LENS_KINDS.indexOf(activeKind);
  return (
    <div className="atlas-lenses" role="group" aria-label="Lens" style={{ '--atlas-lens-index': activeIndex, '--atlas-lens-count': LENS_KINDS.length } as React.CSSProperties}>
      <span className="atlas-lens-thumb" aria-hidden="true" />
      {LENS_KINDS.map((kind) => (
        <button key={kind} type="button" className="atlas-lens" aria-pressed={kind === activeKind} onClick={() => onChoose(kind)}>
          {LENS_LABELS[kind]}
        </button>
      ))}
    </div>
  );
}
