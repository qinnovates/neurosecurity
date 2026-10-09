import type { EdgeLine } from '../diagram-layout';
import type { ElementState, StepMark } from './diagram-types';
import { PayloadArrow, StepPill } from './DiagramMarks';
import type { ElementBadge } from './element-badges';
import type { PayloadTag } from './payload-tags';
import SeverityBadge from './SeverityBadge';
import type { ElementProps } from './use-diagram-interaction';

const CARD_RADIUS = 6;
const TEXT_INSET = 10;
const MEDIUM_BASELINE = 19;
const LINE_HEIGHT = 16;
/** A payload's arrow is centred this far in from the card's edge; its words start after it. */
const ARROW_CENTRE = 15;
const PAYLOAD_TEXT_INSET = 25;
const ARROW_RISE = 4;
const BADGE_TOP = 28;
const STEP_INSET = 6;

interface WireProps {
  edge: EdgeLine;
  state: ElementState;
  elementProps: ElementProps;
}

/** A connection's line, from the edge of one part to the edge of the other, with a wider unseen stroke to point at. */
export function ConnectionWire({ edge, state, elementProps }: WireProps) {
  return (
    <g className="lab-diagram-wire" data-selected={state.isSelected} data-dimmed={state.isDimmed} {...elementProps} data-lit={state.isLit}>
      <path className="lab-diagram-line" d={edge.path} />
      <path className="lab-diagram-hit" d={edge.path} />
    </g>
  );
}

interface CardProps extends WireProps {
  /** The connection in full: "EEG headset to Phone app (bluetooth le)". */
  description: string;
  tags: readonly PayloadTag[];
  badge: ElementBadge | undefined;
  stepMark: StepMark | undefined;
  hatchId: string;
}

/**
 * A connection's label, set on its line: the medium, one line per payload with an arrow for
 * the derived direction, and the badge. A connection that carries none of the modelled
 * payloads has no payload line.
 */
export function ConnectionCard({ edge, state, elementProps, description, tags, badge, stepMark, hatchId }: CardProps) {
  const { card } = edge;
  return (
    <g className="lab-diagram-link" data-kind="connection" data-selected={state.isSelected} data-dimmed={state.isDimmed} {...elementProps} data-lit={state.isLit}>
      <title>{description}</title>
      <rect className="lab-diagram-box" x={card.x} y={card.y} width={card.width} height={card.height} rx={CARD_RADIUS} />
      <text className="lab-diagram-link-label" x={card.x + TEXT_INSET} y={card.y + MEDIUM_BASELINE}>{edge.label}</text>
      {tags.map((tag, index) => {
        const baseline = card.y + MEDIUM_BASELINE + (index + 1) * LINE_HEIGHT;
        return (
          <g key={tag.payload} className="lab-diagram-payload" data-payload={tag.payload} data-heading={tag.heading ?? 'none'}>
            {tag.heading !== null && <PayloadArrow x={card.x + ARROW_CENTRE} y={baseline - ARROW_RISE} heading={tag.heading} />}
            <text x={card.x + PAYLOAD_TEXT_INSET} y={baseline}>{tag.label}</text>
          </g>
        );
      })}
      {badge !== undefined && <SeverityBadge badge={badge} x={card.x + TEXT_INSET} y={card.y + BADGE_TOP + tags.length * LINE_HEIGHT} hatchId={hatchId} />}
      {stepMark !== undefined && <StepPill x={card.x + card.width - STEP_INSET} y={card.y + STEP_INSET} mark={stepMark} />}
    </g>
  );
}
