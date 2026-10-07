import { useMemo, type KeyboardEvent } from 'react';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import type { PayloadFlow } from '@/lib/threat-model/payload-flow';
import type { LinkPayload } from '@/lib/threat-model/reference-data-types';
import { ZONE_LABELS, computeDiagramLayout, type EdgeLine, type NodeBox } from './diagram-layout';

export interface DiagramHighlight {
  componentIds: readonly string[];
  linkIds: readonly string[];
}

export interface ChainMarker {
  elementId: string;
  position: number;
}

interface Props {
  model: DeviceModel;
  /** Accessible name; also says which view is shown. */
  title: string;
  /** When set, everything outside it is dimmed. */
  highlight?: DiagramHighlight | null;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string) => void;
  openRiskCounts?: ReadonlyMap<string, number>;
  /** The steps of a chain to mark, each on the part it acts on. */
  chainSteps?: readonly ChainMarker[];
  /**
   * During playback, how many steps have been reached: those are filled, the rest outlined, and a marker
   * travels to the newest. Omit for the still picture with every step shown.
   */
  reachedStepCount?: number;
  /**
   * What each connection carries and which way, keyed by link id. When given, each payload gets its own
   * moving track and an arrowhead; when omitted, a connection that carries anything shows one plain flow.
   */
  payloadFlows?: ReadonlyMap<string, readonly PayloadFlow[]>;
}

const MAX_LABEL_CHARACTERS = 20;
const BADGE_RADIUS = 9;
const TRAVELLER_RADIUS = 13;
/** Tracks for different payloads run side by side, this far apart. */
const TRACK_SPACING = 6;
const ARROW_SPACING = 16;
const ARROW_DROP = 13;
const ARROW_RIGHT = 'M -5 -4 L 5 0 L -5 4 Z';
const ARROW_LEFT = 'M 5 -4 L -5 0 L 5 4 Z';
const UNDIRECTED_MARK = 'M -4 0 L 0 -4 L 4 0 L 0 4 Z';

export const PAYLOAD_LABELS: Record<LinkPayload, string> = {
  neuralData: 'neural data',
  stimulationCommands: 'stimulation commands',
  softwareUpdates: 'software updates',
};

function describeFlow(flow: PayloadFlow): string {
  if (flow.sense === null) return PAYLOAD_LABELS[flow.payload];
  return `${PAYLOAD_LABELS[flow.payload]} ${flow.sense === 'away' ? 'away from' : 'toward'} the neural interface`;
}

const NODE_STEP_INSET = 4;

/** A step marker on a connection sits under its label, and under the payload arrows when there are any. */
function edgeStepY(labelY: number, flowCount: number): number {
  return labelY + (flowCount > 0 ? 32 : 18);
}

/** Offsets that centre `count` items around zero, `spacing` apart. */
function spread(count: number, index: number, spacing: number): number {
  return (index - (count - 1) / 2) * spacing;
}

function shorten(label: string): string {
  return label.length > MAX_LABEL_CHARACTERS ? `${label.slice(0, MAX_LABEL_CHARACTERS - 1)}…` : label;
}

function activateOnKey(event: KeyboardEvent<SVGGElement>, activate: () => void): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    activate();
  }
}

function Badge({ className, x, y, text }: { className: string; x: number; y: number; text: string }) {
  return (
    <g className={className} aria-hidden="true">
      <circle cx={x} cy={y} r={BADGE_RADIUS} />
      <text x={x} y={y + 3.5} textAnchor="middle">{text}</text>
    </g>
  );
}

function positionsAt(markers: readonly ChainMarker[], elementId: string): string | null {
  const positions = markers.filter((marker) => marker.elementId === elementId).map((marker) => marker.position);
  return positions.length > 0 ? positions.join(',') : null;
}

/** A step marker is outlined until playback reaches the first step on its part. */
function stepClass(markers: readonly ChainMarker[], elementId: string, reachedStepCount: number | undefined): string {
  if (reachedStepCount === undefined) return 'tm-step';
  const first = Math.min(...markers.filter((marker) => marker.elementId === elementId).map((marker) => marker.position));
  return first <= reachedStepCount ? 'tm-step' : 'tm-step tm-step--ahead';
}

export default function ArchitectureDiagram({
  model, title, highlight = null, selectedElementId = null, onSelectElement, openRiskCounts, chainSteps = [], reachedStepCount, payloadFlows,
}: Props) {
  const layout = useMemo(() => computeDiagramLayout(model), [model]);
  const interfaceId = model.components.find((component) => component.isNeuralInterface)?.id;
  const isInteractive = onSelectElement !== undefined;

  // During playback a marker sits on the part the newest step acts on, and glides there from the last one.
  const newestStep = reachedStepCount === undefined ? undefined : chainSteps.find((marker) => marker.position === reachedStepCount);
  const travellerNode = layout.nodes.find((node) => node.id === newestStep?.elementId);
  const travellerEdge = layout.edges.find((edge) => edge.id === newestStep?.elementId);
  const travellerAt = travellerNode !== undefined
    ? { x: travellerNode.x + NODE_STEP_INSET, y: travellerNode.y + NODE_STEP_INSET }
    : travellerEdge !== undefined
      ? { x: travellerEdge.labelX, y: edgeStepY(travellerEdge.labelY, payloadFlows?.get(travellerEdge.id)?.length ?? 0) }
      : null;

  const stateClass = (elementId: string, isHighlighted: boolean): string => [
    highlight !== null && !isHighlighted ? 'tm-dimmed' : '',
    elementId === selectedElementId ? 'tm-node--selected tm-edge--selected' : '',
  ].join(' ');

  const interactionProps = (elementId: string, label: string) => (isInteractive ? {
    tabIndex: 0,
    role: 'button',
    'aria-label': `${label}. Show threats.`,
    'aria-pressed': elementId === selectedElementId,
    onClick: () => onSelectElement(elementId),
    onKeyDown: (event: KeyboardEvent<SVGGElement>) => activateOnKey(event, () => onSelectElement(elementId)),
  } : {});

  const renderEdge = (edge: EdgeLine) => {
    const steps = positionsAt(chainSteps, edge.id);
    const isHighlighted = highlight?.linkIds.includes(edge.id) ?? true;
    const flows = payloadFlows?.get(edge.id) ?? [];
    const carried = flows.length > 0 ? `, carrying ${flows.map(describeFlow).join('; ')}` : '';
    return (
      <g key={edge.id} className={`tm-edge ${stateClass(edge.id, isHighlighted)}`} {...interactionProps(edge.id, `Connection, ${edge.label}${carried}`)}>
        <title>{`Connection: ${edge.label}${carried}`}</title>
        <path d={edge.path} />
        {payloadFlows === undefined && edge.carriesPayload && isHighlighted && <path className="tm-flow" d={edge.path} />}
        {isHighlighted && flows.map((flow, index) => (
          <path
            key={flow.payload} className="tm-track" d={edge.path} data-payload={flow.payload}
            data-direction={flow.isFromTo === null ? 'none' : flow.isFromTo ? 'forward' : 'backward'}
            transform={`translate(0 ${spread(flows.length, index, TRACK_SPACING)})`}
          />
        ))}
        {flows.map((flow, index) => (
          <path
            key={flow.payload} className="tm-payload-arrow" data-payload={flow.payload} aria-hidden="true"
            d={flow.isFromTo === null ? UNDIRECTED_MARK : flow.isFromTo === edge.runsLeftToRight ? ARROW_RIGHT : ARROW_LEFT}
            transform={`translate(${edge.labelX + spread(flows.length, index, ARROW_SPACING)} ${edge.labelY + ARROW_DROP})`}
          />
        ))}
        <text x={edge.labelX} y={edge.labelY} textAnchor="middle">{edge.label}</text>
        {steps !== null && <Badge className={stepClass(chainSteps, edge.id, reachedStepCount)} x={edge.labelX} y={edgeStepY(edge.labelY, flows.length)} text={steps} />}
      </g>
    );
  };

  const renderNode = (node: NodeBox) => {
    const steps = positionsAt(chainSteps, node.id);
    const openRisks = openRiskCounts?.get(node.id) ?? 0;
    const isHighlighted = highlight?.componentIds.includes(node.id) ?? true;
    const interfaceClass = node.id === interfaceId ? 'tm-node--interface' : '';
    return (
      <g key={node.id} className={`tm-node ${interfaceClass} ${stateClass(node.id, isHighlighted)}`} {...interactionProps(node.id, node.label)}>
        <title>{node.label}</title>
        <rect x={node.x} y={node.y} width={node.width} height={node.height} rx={10} />
        <text x={node.x + node.width / 2} y={node.y + node.height / 2 + 4} textAnchor="middle">{shorten(node.label)}</text>
        {openRisks > 0 && <Badge className="tm-heat" x={node.x + node.width - 4} y={node.y + 4} text={String(openRisks)} />}
        {steps !== null && <Badge className={stepClass(chainSteps, node.id, reachedStepCount)} x={node.x + NODE_STEP_INSET} y={node.y + NODE_STEP_INSET} text={steps} />}
      </g>
    );
  };

  return (
    // An image role hides everything inside it from assistive technology, so it is used only
    // when the diagram is a picture. With selectable parts it is a labelled group instead.
    <svg className="tm-diagram" viewBox={`0 0 ${layout.width} ${layout.height}`} role={isInteractive ? 'group' : 'img'} aria-label={title}>
      <title>{title}</title>
      {layout.zones.map((zone) => (
        <g key={zone.zone}>
          <rect className="tm-zone" x={zone.x} y={zone.y} width={zone.width} height={zone.height} rx={14} />
          <text className="tm-zone-label" x={zone.x + 14} y={zone.y + 22}>{ZONE_LABELS[zone.zone]}</text>
        </g>
      ))}
      {layout.edges.map(renderEdge)}
      {layout.nodes.map(renderNode)}
      {travellerAt !== null && <circle className="tm-chain-traveller" r={TRAVELLER_RADIUS} style={{ transform: `translate(${travellerAt.x}px, ${travellerAt.y}px)` }} aria-hidden="true" />}
    </svg>
  );
}
