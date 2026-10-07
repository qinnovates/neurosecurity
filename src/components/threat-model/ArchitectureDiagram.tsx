import { useMemo, type KeyboardEvent } from 'react';
import type { DeviceModel } from '@/lib/threat-model/device-model';
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
  chainMarkers?: readonly ChainMarker[];
}

const MAX_LABEL_CHARACTERS = 20;
const BADGE_RADIUS = 9;

function shorten(label: string): string {
  return label.length > MAX_LABEL_CHARACTERS ? `${label.slice(0, MAX_LABEL_CHARACTERS - 1)}…` : label;
}

function activateOnKey(event: KeyboardEvent<SVGGElement>, activate: () => void): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    activate();
  }
}

/** Chain step markers appear one after another, in step order. */
const TRACE_STEP_MS = 700;

function Badge({ className, x, y, text, delayMs }: { className: string; x: number; y: number; text: string; delayMs?: number }) {
  return (
    <g className={className} aria-hidden="true" style={delayMs === undefined ? undefined : { animationDelay: `${delayMs}ms` }}>
      <circle cx={x} cy={y} r={BADGE_RADIUS} />
      <text x={x} y={y + 3.5} textAnchor="middle">{text}</text>
    </g>
  );
}

function positionsAt(markers: readonly ChainMarker[], elementId: string): string | null {
  const positions = markers.filter((marker) => marker.elementId === elementId).map((marker) => marker.position);
  return positions.length > 0 ? positions.join(',') : null;
}

function traceDelayAt(markers: readonly ChainMarker[], elementId: string): number {
  const positions = markers.filter((marker) => marker.elementId === elementId).map((marker) => marker.position);
  return (Math.min(...positions) - 1) * TRACE_STEP_MS;
}

export default function ArchitectureDiagram({
  model, title, highlight = null, selectedElementId = null, onSelectElement, openRiskCounts, chainMarkers = [],
}: Props) {
  const layout = useMemo(() => computeDiagramLayout(model), [model]);
  const interfaceId = model.components.find((component) => component.isNeuralInterface)?.id;
  const isInteractive = onSelectElement !== undefined;

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
    const steps = positionsAt(chainMarkers, edge.id);
    const isHighlighted = highlight?.linkIds.includes(edge.id) ?? true;
    return (
      <g key={edge.id} className={`tm-edge ${stateClass(edge.id, isHighlighted)}`} {...interactionProps(edge.id, `Connection, ${edge.label}`)}>
        <title>{`Connection: ${edge.label}`}</title>
        <path d={edge.path} />
        {edge.carriesPayload && isHighlighted && <path className="tm-flow" d={edge.path} />}
        <text x={edge.labelX} y={edge.labelY} textAnchor="middle">{edge.label}</text>
        {steps !== null && <Badge className="tm-step" x={edge.labelX} y={edge.labelY + 18} text={steps} delayMs={traceDelayAt(chainMarkers, edge.id)} />}
      </g>
    );
  };

  const renderNode = (node: NodeBox) => {
    const steps = positionsAt(chainMarkers, node.id);
    const openRisks = openRiskCounts?.get(node.id) ?? 0;
    const isHighlighted = highlight?.componentIds.includes(node.id) ?? true;
    const interfaceClass = node.id === interfaceId ? 'tm-node--interface' : '';
    return (
      <g key={node.id} className={`tm-node ${interfaceClass} ${stateClass(node.id, isHighlighted)}`} {...interactionProps(node.id, node.label)}>
        <title>{node.label}</title>
        <rect x={node.x} y={node.y} width={node.width} height={node.height} rx={10} />
        <text x={node.x + node.width / 2} y={node.y + node.height / 2 + 4} textAnchor="middle">{shorten(node.label)}</text>
        {openRisks > 0 && <Badge className="tm-heat" x={node.x + node.width - 4} y={node.y + 4} text={String(openRisks)} />}
        {steps !== null && <Badge className="tm-step" x={node.x + 4} y={node.y + 4} text={steps} delayMs={traceDelayAt(chainMarkers, node.id)} />}
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
    </svg>
  );
}
