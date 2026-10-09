import type { ReactNode } from 'react';
import type { EvidenceStep } from './evidence-steps';

/** The mark is never drawn smaller than this, in CSS pixels: below it the silhouettes run together. */
export const EVIDENCE_MARK_MINIMUM_PX = 12;

const FRAME = <rect x="0.5" y="0.5" width="11" height="11" fill="none" stroke="currentColor" />;
/** The frame's 10px interior is four 5px cells. The more cells are filled, the stronger the evidence. */
const CELL = {
  topLeft: <rect key="top-left" x="1" y="1" width="5" height="5" />,
  topRight: <rect key="top-right" x="6" y="1" width="5" height="5" />,
  bottomLeft: <rect key="bottom-left" x="1" y="6" width="5" height="5" />,
  bottomRight: <rect key="bottom-right" x="6" y="6" width="5" height="5" />,
} as const;
/** No frame: four corner brackets with 3px legs. */
const BRACKETS = <path d="M0.5 3.5V0.5H3.5M8.5 0.5H11.5V3.5M11.5 8.5V11.5H8.5M3.5 11.5H0.5V8.5" fill="none" stroke="currentColor" />;
const BAR = <rect x="3" y="5" width="6" height="2" />;

/** Each step has its own outline, so two steps differ in shape and not only in how much is filled. */
const DRAWING_BY_STEP: Readonly<Record<EvidenceStep, ReactNode>> = {
  validated: <>{FRAME}{CELL.topLeft}{CELL.topRight}{CELL.bottomLeft}{CELL.bottomRight}</>,
  'demonstrated-lab': <>{FRAME}{CELL.topLeft}{CELL.bottomLeft}{CELL.bottomRight}</>,
  'demonstrated-case': <>{FRAME}{CELL.bottomLeft}{CELL.bottomRight}</>,
  'theoretical-modelled': <>{FRAME}{CELL.bottomLeft}</>,
  'theoretical-proposed': FRAME,
  speculative: BRACKETS,
  'not-stated': BAR,
};

interface Props {
  step: EvidenceStep;
  /** Side length in CSS pixels. Values under 12 are drawn at 12. */
  size?: number;
  /** Accessible name. Leave out when words beside the mark already say it. */
  label?: string;
}

/** One evidence silhouette, in the text colour, so it holds in both themes, on paper and in forced colours. */
export default function EvidenceStepMark({ step, size = EVIDENCE_MARK_MINIMUM_PX, label }: Props) {
  const side = Math.max(EVIDENCE_MARK_MINIMUM_PX, size);
  return (
    <svg
      className="lab-evidence-mark" data-step={step} width={side} height={side} viewBox="0 0 12 12" fill="currentColor" shapeRendering="crispEdges" focusable="false"
      role={label === undefined ? undefined : 'img'} aria-label={label} aria-hidden={label === undefined ? true : undefined}
    >
      {DRAWING_BY_STEP[step]}
    </svg>
  );
}
