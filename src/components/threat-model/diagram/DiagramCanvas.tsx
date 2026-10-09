import { useId, useMemo } from 'react';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { listElementsInModelOrder } from '@/lib/threat-model/model-order';
import { describeLink } from '@/lib/threat-model/stride';
import { ZONE_LABELS, computeDiagramLayout, type EdgeLine, type NodeBox } from '../diagram-layout';
import { FULL_METRICS, UNBADGED_METRICS } from './diagram-metrics';
import type { DiagramHighlight, ElementState, StepMark } from './diagram-types';
import { ConnectionCard, ConnectionWire } from './DiagramConnection';
import { HatchDefs } from './DiagramMarks';
import DiagramPart, { TISSUE_CONTACT_TAG } from './DiagramPart';
import { describeBadge, type ElementBadge } from './element-badges';
import FlowPassMark from './FlowPassMark';
import { buildPayloadTags, describePayloadTags, passDirectionOf, type PayloadFlows } from './payload-tags';
import type { DiagramInteraction } from './use-diagram-interaction';
import type { FlowPass } from './use-flow-pass';

const ZONE_RADIUS = 14;
const ZONE_LABEL_INSET = 12;
const ZONE_LABEL_BASELINE = 19;

interface Props {
  model: DeviceModel;
  title: string;
  /** What the drawing shows, in a sentence, for readers who cannot see it. */
  description: string;
  flows: PayloadFlows;
  badges: ReadonlyMap<string, ElementBadge>;
  stepMarks: ReadonlyMap<string, StepMark>;
  highlight: DiagramHighlight | null;
  selectedElementId: string | null;
  interaction: DiagramInteraction;
  flowPass: FlowPass;
  /** True when parts and connections can be selected; the drawing is then a group of buttons, not a picture. */
  isSelectable: boolean;
}

/**
 * The device as a drawing, at one CSS pixel per unit: zones as columns from the tissue side
 * outward, parts in them, and every connection drawn from the edge of one part to the edge
 * of the other with its label set on the line.
 */
export default function DiagramCanvas({ model, title, description, flows, badges, stepMarks, highlight, selectedElementId, interaction, flowPass, isSelectable }: Props) {
  const hasBadges = badges.size > 0;
  const layout = useMemo(() => computeDiagramLayout(model, hasBadges ? FULL_METRICS : UNBADGED_METRICS), [model, hasBadges]);
  const hatchId = useId();
  const descriptionId = useId();
  const nodeById = new Map(layout.nodes.map((node) => [node.id, node]));
  const edgeById = new Map(layout.edges.map((edge) => [edge.id, edge]));

  const stateOf = (elementId: string, isHighlighted: boolean): ElementState => ({
    isSelected: elementId === selectedElementId,
    isLit: interaction.isLit(elementId),
    isDimmed: highlight !== null && !isHighlighted,
  });
  const edgeState = (edge: EdgeLine): ElementState => stateOf(edge.id, highlight?.linkIds.includes(edge.id) ?? true);

  const renderPart = (node: NodeBox) => {
    const badge = badges.get(node.id);
    const name = `${node.label}, part${node.isTissueContact ? `, ${TISSUE_CONTACT_TAG}` : ''}. ${describeBadge(badge)}`.trim();
    return (
      <DiagramPart
        key={node.id} node={node} badge={badge} stepMark={stepMarks.get(node.id)} hatchId={hatchId}
        state={stateOf(node.id, highlight?.componentIds.includes(node.id) ?? true)} elementProps={interaction.controlProps(node.id, name)}
      />
    );
  };

  const renderCard = (edge: EdgeLine) => {
    const tags = buildPayloadTags(flows.get(edge.id) ?? [], { model, linkId: edge.id, lineHeading: edge.heading });
    const badge = badges.get(edge.id);
    const carried = tags.length > 0 ? `, carrying ${describePayloadTags(tags)}` : '';
    const description = `${describeLink(model, edge.id)}${carried}`;
    return (
      <ConnectionCard
        key={edge.id} edge={edge} tags={tags} badge={badge} stepMark={stepMarks.get(edge.id)} hatchId={hatchId} description={description}
        state={edgeState(edge)} elementProps={interaction.controlProps(edge.id, `Connection, ${description}. ${describeBadge(badge)}`.trim())}
      />
    );
  };

  const renderPass = (edge: EdgeLine) => {
    const passKey = flowPass.activeKeys.get(edge.id);
    const direction = passDirectionOf(flows.get(edge.id) ?? []);
    if (passKey === undefined || direction === null) return null;
    return <FlowPassMark key={`${edge.id}:${passKey}`} path={edge.path} direction={direction} onDone={() => flowPass.finish(edge.id)} />;
  };

  return (
    // An image role hides everything inside it from assistive technology, so it is used only when
    // the drawing is a picture. With selectable parts it is a labelled group of buttons instead.
    <svg
      className="lab-diagram-svg" width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`}
      role={isSelectable ? 'group' : 'img'} aria-label={title} aria-describedby={descriptionId}
    >
      <desc id={descriptionId}>{description}</desc>
      <HatchDefs id={hatchId} />
      {layout.zones.map((zone) => (
        <g key={zone.zone} className="lab-diagram-zone">
          <rect x={zone.x} y={zone.y} width={zone.width} height={zone.height} rx={ZONE_RADIUS} />
          <text x={zone.x + ZONE_LABEL_INSET} y={zone.y + ZONE_LABEL_BASELINE}>{ZONE_LABELS[zone.zone]}</text>
        </g>
      ))}
      {layout.edges.map((edge) => <ConnectionWire key={edge.id} edge={edge} state={edgeState(edge)} elementProps={interaction.pointerProps(edge.id)} />)}
      {layout.edges.map(renderPass)}
      {/* Parts and connection labels follow the model's order, so the Tab key walks the device from the tissue side outward. */}
      {listElementsInModelOrder(model).map((element) => {
        const node = nodeById.get(element.id);
        const edge = edgeById.get(element.id);
        return node !== undefined ? renderPart(node) : edge !== undefined ? renderCard(edge) : null;
      })}
    </svg>
  );
}
