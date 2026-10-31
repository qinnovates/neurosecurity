import { LENS_LABELS, type LensKind } from '@/lib/atlas-explorer/lens-state';

/**
 * The lenses that are a fact about a region, which is what a colour can be.
 * `technique` and `stated_targets` are not here: they are selections of a
 * thing whose regions then light up, so they belong to the highlight picker
 * and not to this row. Keeping them here cost two buttons whose only state,
 * until a subject was chosen, was colouring nothing.
 */
export const FACT_LENS_KINDS: readonly LensKind[] = ['band', 'niss', 'dsm'];

/** The fourth lens, specified and shipped unavailable: the control stays, keyboard-reachable, with its reason beside it. */
const BLOCKED_LENS_LABEL = 'Body function';
/*
 * Copy owned by `src/lib/anatomy/limits-copy.ts`, which this lane may not
 * edit. Written here verbatim for Lane 6 to route under the key named beside
 * it, and kept off the `.atlas-limit` class until it has.
 */
/** limits-copy key `lens_body_function`. */
const BLOCKED_LENS_REASON = 'Not available in this build. A body-function lens needs a controlled list of functions. The atlas file records each region’s function as a sentence, not as a tag, so there is nothing to colour by yet.';

/** The blocked lens's reason stands in the lens panel, away from the bar in the picture's header, and the bar's button names it. */
const BLOCKED_LENS_REASON_ID = 'atlas-lens-blocked-reason';

interface Props {
  activeKind: LensKind;
  onChoose: (kind: LensKind) => void;
}

/**
 * Chooses the lens. Each choice is a real button; the bar behind them slides to
 * the active one, which shows that the lens changed and nothing more. While a
 * highlight is carrying the colour, no fact lens is pressed and the bar shows
 * no thumb, because none of these is what the colour means.
 */
export default function ColourModePicker({ activeKind, onChoose }: Props) {
  const activeIndex = FACT_LENS_KINDS.indexOf(activeKind);
  const slots = FACT_LENS_KINDS.length + 1;
  return (
    <div
      className="atlas-lenses" role="group" aria-label="Lens" data-fact-lens={activeIndex >= 0}
      style={{ '--atlas-lens-index': Math.max(activeIndex, 0), '--atlas-lens-count': slots } as React.CSSProperties}
    >
      <span className="atlas-lens-thumb" aria-hidden="true" />
      {FACT_LENS_KINDS.map((kind) => (
        <button key={kind} type="button" className="atlas-lens" aria-pressed={kind === activeKind} onClick={() => onChoose(kind)}>
          {LENS_LABELS[kind]}
        </button>
      ))}
      <button type="button" className="atlas-lens" aria-pressed={false} aria-disabled="true" aria-describedby={BLOCKED_LENS_REASON_ID} onClick={() => undefined}>
        {BLOCKED_LENS_LABEL}
      </button>
    </div>
  );
}

/** Why the fourth lens cannot be used, for the panel the bar's limits stay in. */
export function BlockedLensReason() {
  return <p className="atlas-lens-blocked" id={BLOCKED_LENS_REASON_ID} data-coverage-note="lens_body_function">{BLOCKED_LENS_REASON}</p>;
}
