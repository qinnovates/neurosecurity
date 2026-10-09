/**
 * Deterministic layout for the device diagram: one column per trust zone, ordered from the
 * patient outward, with the parts of a zone stacked inside it. Connections are planned on
 * that grid (diagram/edge-plan), the grid is sized to fit them (diagram/diagram-frame) and
 * each is then drawn from the edge of one part to the edge of the other (diagram/edge-routing).
 */

import { TRUST_ZONES, type DeviceModel, type ModelLink, type TrustZone } from '@/lib/threat-model/device-model';
import { computeFrame } from './diagram/diagram-frame';
import type { Box } from './diagram/diagram-geometry';
import { FULL_METRICS, type DiagramMetrics } from './diagram/diagram-metrics';
import { planEdges, type GridLink, type GridNode } from './diagram/edge-plan';
import { routeEdges, type EdgeLine } from './diagram/edge-routing';

export type { EdgeLine } from './diagram/edge-routing';

export const ZONE_LABELS: Record<TrustZone, string> = {
  in_body: 'In the body',
  on_body: 'On the body',
  patient_controlled: 'Patient-controlled',
  clinic: 'Clinic',
  cloud: 'Cloud',
};

export interface ZoneBox extends Box { zone: TrustZone }
export interface NodeBox extends Box {
  id: string;
  label: string;
  /** The part in contact with neural tissue or the scalp. */
  isTissueContact: boolean;
}

export interface DiagramLayout {
  width: number;
  height: number;
  zones: ZoneBox[];
  nodes: NodeBox[];
  /** One per connection whose two ends are parts of the model, in the model's order. */
  edges: EdgeLine[];
}

/** How many of the three modelled payloads a connection carries. */
export function countPayloads(link: ModelLink): number {
  return [link.carriesNeuralData, link.carriesStimulationCommands, link.carriesSoftwareUpdates].filter(Boolean).length;
}

export function describeMedium(link: ModelLink): string {
  return link.medium.replaceAll('_', ' ');
}

function placeOnGrid(model: DeviceModel, zones: readonly TrustZone[]): GridNode[] {
  return zones.flatMap((zone, col) => model.components
    .filter((component) => component.trustZone === zone)
    .map((component, row): GridNode => ({ id: component.id, label: component.label, col, row, isTissueContact: component.isNeuralInterface })));
}

function toGridLinks(model: DeviceModel): GridLink[] {
  return model.links.map((link): GridLink => ({
    id: link.id, label: describeMedium(link), fromId: link.fromComponentId, toId: link.toComponentId, payloadCount: countPayloads(link),
  }));
}

export function computeDiagramLayout(model: DeviceModel, metrics: DiagramMetrics = FULL_METRICS): DiagramLayout {
  const zones = TRUST_ZONES.filter((zone) => model.components.some((component) => component.trustZone === zone));
  const gridNodes = placeOnGrid(model, zones);
  const rowCount = Math.max(0, ...gridNodes.map((node) => node.row + 1));
  const plan = planEdges(gridNodes, toGridLinks(model));
  const frame = computeFrame(plan, zones.length, rowCount, metrics);
  const bandWidth = metrics.nodeWidth + 2 * metrics.zonePadding;
  return {
    width: frame.width,
    height: frame.height,
    zones: zones.map((zone, col): ZoneBox => ({
      zone, x: frame.columnX[col] - metrics.zonePadding, y: metrics.margin, width: bandWidth, height: frame.height - 2 * metrics.margin,
    })),
    nodes: gridNodes.map((node): NodeBox => ({
      id: node.id, label: node.label, isTissueContact: node.isTissueContact,
      x: frame.columnX[node.col], y: frame.rowY[node.row], width: metrics.nodeWidth, height: metrics.nodeHeight,
    })),
    edges: routeEdges(plan, frame, metrics),
  };
}
