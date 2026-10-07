/**
 * Deterministic layout for the architecture diagram: one column per trust zone,
 * ordered from the patient outward, with components stacked inside their zone.
 */

import { TRUST_ZONES, type DeviceModel, type TrustZone } from '@/lib/threat-model/device-model';

const NODE_WIDTH = 150;
const NODE_HEIGHT = 56;
const NODE_GAP = 28;
const ZONE_PADDING = 14;
/** Vertical room above and below the components for connections that arc past a zone. */
const ARC_ROOM = 52;
const ZONE_GAP = 72;
const ZONE_HEADER = 30;
const MARGIN = 12;
const ARC_BASE_OFFSET = 62;
const ARC_STEP_OFFSET = 14;

export const ZONE_LABELS: Record<TrustZone, string> = {
  in_body: 'In the body',
  on_body: 'On the body',
  patient_controlled: 'Patient-controlled',
  clinic: 'Clinic',
  cloud: 'Cloud',
};

export interface ZoneBox { zone: TrustZone; x: number; y: number; width: number; height: number }
export interface NodeBox { id: string; label: string; x: number; y: number; width: number; height: number }
export interface EdgeLine {
  id: string;
  label: string;
  /** SVG path: straight between neighbours, curved when it has to pass other components. */
  path: string;
  labelX: number;
  labelY: number;
  /** True when the connection carries data, commands, or updates; drives the flow animation. */
  carriesPayload: boolean;
}

export interface DiagramLayout {
  width: number;
  height: number;
  zones: ZoneBox[];
  nodes: NodeBox[];
  edges: EdgeLine[];
}

function tallestZoneCount(model: DeviceModel, zones: readonly TrustZone[]): number {
  return Math.max(1, ...zones.map((zone) => model.components.filter((component) => component.trustZone === zone).length));
}

function layoutNodes(model: DeviceModel, zones: readonly TrustZone[], arcRoom: number): NodeBox[] {
  return zones.flatMap((zone, zoneIndex) => {
    const zoneX = MARGIN + zoneIndex * (NODE_WIDTH + 2 * ZONE_PADDING + ZONE_GAP);
    return model.components
      .filter((component) => component.trustZone === zone)
      .map((component, rowIndex): NodeBox => ({
        id: component.id,
        label: component.label,
        x: zoneX + ZONE_PADDING,
        y: MARGIN + ZONE_HEADER + arcRoom + rowIndex * (NODE_HEIGHT + NODE_GAP),
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      }));
  });
}

function layoutEdges(model: DeviceModel, nodes: readonly NodeBox[]): EdgeLine[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const arcIndex = { next: 0 };
  return model.links.flatMap((link): EdgeLine[] => {
    const from = nodeById.get(link.fromComponentId);
    const to = nodeById.get(link.toComponentId);
    if (from === undefined || to === undefined) return [];
    const carriesPayload = link.carriesNeuralData || link.carriesStimulationCommands || link.carriesSoftwareUpdates;
    return [{ ...routeEdge(link.id, link.medium.replaceAll('_', ' '), from, to, nodes, arcIndex), carriesPayload }];
  });
}

/** True when another component sits between the two ends, so a straight line would cross it. */
function crossesAnotherNode(from: NodeBox, to: NodeBox, nodes: readonly NodeBox[]): boolean {
  const [left, right] = from.x <= to.x ? [from, to] : [to, from];
  return nodes.some((node) => node.id !== from.id && node.id !== to.id
    && node.x > left.x && node.x < right.x
    && Math.abs(node.y - left.y) < NODE_HEIGHT && Math.abs(node.y - right.y) < NODE_HEIGHT);
}

function routeEdge(id: string, label: string, from: NodeBox, to: NodeBox, nodes: readonly NodeBox[], arcIndex: { next: number }): Omit<EdgeLine, 'carriesPayload'> {
  const x1 = from.x + from.width / 2;
  const y1 = from.y + from.height / 2;
  const x2 = to.x + to.width / 2;
  const y2 = to.y + to.height / 2;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  if (!crossesAnotherNode(from, to, nodes)) {
    return { id, label, path: `M ${x1} ${y1} L ${x2} ${y2}`, labelX: midX, labelY: midY - 7 };
  }
  // Alternate above and below, a little further out each time, so arcs do not overlap each other.
  const side = arcIndex.next % 2 === 0 ? -1 : 1;
  const offset = side * (ARC_BASE_OFFSET + Math.floor(arcIndex.next / 2) * ARC_STEP_OFFSET);
  arcIndex.next += 1;
  const controlY = midY + 2 * offset;
  return { id, label, path: `M ${x1} ${y1} Q ${midX} ${controlY} ${x2} ${y2}`, labelX: midX, labelY: midY + offset - 7 };
}

export function computeDiagramLayout(model: DeviceModel): DiagramLayout {
  const zones = TRUST_ZONES.filter((zone) => model.components.some((component) => component.trustZone === zone));
  const zoneWidth = NODE_WIDTH + 2 * ZONE_PADDING;
  // Room for arcs is reserved only when some connection has to pass another component.
  const flatNodes = layoutNodes(model, zones, ZONE_PADDING);
  const flatNodeById = new Map(flatNodes.map((node) => [node.id, node]));
  const needsArcs = model.links.some((link) => {
    const from = flatNodeById.get(link.fromComponentId);
    const to = flatNodeById.get(link.toComponentId);
    return from !== undefined && to !== undefined && crossesAnotherNode(from, to, flatNodes);
  });
  const arcRoom = needsArcs ? ARC_ROOM : ZONE_PADDING;
  const zoneHeight = ZONE_HEADER + 2 * arcRoom + tallestZoneCount(model, zones) * (NODE_HEIGHT + NODE_GAP) - NODE_GAP;
  const nodes = needsArcs ? layoutNodes(model, zones, arcRoom) : flatNodes;
  return {
    width: 2 * MARGIN + zones.length * zoneWidth + Math.max(0, zones.length - 1) * ZONE_GAP,
    height: 2 * MARGIN + zoneHeight,
    zones: zones.map((zone, index): ZoneBox => ({
      zone, x: MARGIN + index * (zoneWidth + ZONE_GAP), y: MARGIN, width: zoneWidth, height: zoneHeight,
    })),
    nodes,
    edges: layoutEdges(model, nodes),
  };
}
