import type { NodeBox } from '../diagram-layout';
import { LABEL_LINE_CHARACTERS, LABEL_LINE_COUNT } from './diagram-metrics';
import type { ElementState, StepMark } from './diagram-types';
import { StepPill } from './DiagramMarks';
import type { ElementBadge } from './element-badges';
import { wrapLabel } from './label-lines';
import SeverityBadge from './SeverityBadge';
import type { ElementProps } from './use-diagram-interaction';

export const TISSUE_CONTACT_TAG = 'tissue contact';

const CORNER_RADIUS = 10;
const TEXT_INSET = 12;
/** How far the second border of the tissue-contact part sits inside the first. */
const INNER_BORDER_INSET = 3.5;
const TAG_BASELINE = 19;
const LABEL_LINE_HEIGHT = 16;
/** Baseline of the first label line when the tag takes the line above it. */
const LABEL_BASELINE_UNDER_TAG = 37;
/** Middle of the space the label takes above a badge when there is no tag. */
const LABEL_MIDDLE = 31;
const LABEL_BASELINE_SHIFT = 4.5;
const BADGE_TOP = 62;
const STEP_INSET = 6;

interface Props {
  node: NodeBox;
  state: ElementState;
  badge: ElementBadge | undefined;
  stepMark: StepMark | undefined;
  elementProps: ElementProps;
  hatchId: string;
}

/** Baseline of the first label line, measured from the top of the part. With no badge the name takes the middle of the box. */
function firstBaseline(lineCount: number, hasTag: boolean, boxHeight: number | null): number {
  if (hasTag) return LABEL_BASELINE_UNDER_TAG;
  const middle = boxHeight === null ? LABEL_MIDDLE : boxHeight / 2;
  return middle - ((lineCount - 1) * LABEL_LINE_HEIGHT) / 2 + LABEL_BASELINE_SHIFT;
}

/**
 * One part of the device: its name on up to two lines and its badge. The part in contact
 * with tissue has a double ink border and a text tag; it never takes the selection colour
 * unless it is selected.
 */
export default function DiagramPart({ node, state, badge, stepMark, elementProps, hatchId }: Props) {
  const lines = wrapLabel(node.label, LABEL_LINE_CHARACTERS, LABEL_LINE_COUNT);
  const baseline = node.y + firstBaseline(lines.length, node.isTissueContact, badge === undefined ? node.height : null);
  return (
    <g
      className="lab-diagram-part" data-kind="part" data-selected={state.isSelected} data-dimmed={state.isDimmed}
      data-tissue-contact={node.isTissueContact} {...elementProps} data-lit={state.isLit}
    >
      <title>{node.label}</title>
      <rect className="lab-diagram-box" x={node.x} y={node.y} width={node.width} height={node.height} rx={CORNER_RADIUS} />
      {node.isTissueContact && (
        <rect
          className="lab-diagram-box-inner" x={node.x + INNER_BORDER_INSET} y={node.y + INNER_BORDER_INSET}
          width={node.width - 2 * INNER_BORDER_INSET} height={node.height - 2 * INNER_BORDER_INSET} rx={CORNER_RADIUS - INNER_BORDER_INSET}
        />
      )}
      {node.isTissueContact && <text className="lab-diagram-tag" x={node.x + TEXT_INSET} y={node.y + TAG_BASELINE}>{TISSUE_CONTACT_TAG}</text>}
      <text className="lab-diagram-part-label">
        {lines.map((line, index) => <tspan key={line + String(index)} x={node.x + TEXT_INSET} y={baseline + index * LABEL_LINE_HEIGHT}>{line}</tspan>)}
      </text>
      {badge !== undefined && <SeverityBadge badge={badge} x={node.x + TEXT_INSET} y={node.y + BADGE_TOP} hatchId={hatchId} />}
      {stepMark !== undefined && <StepPill x={node.x + node.width - STEP_INSET} y={node.y + STEP_INSET} mark={stepMark} />}
    </g>
  );
}
