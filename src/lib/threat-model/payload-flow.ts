/**
 * Which way each payload travels on a connection. The device model records what a link
 * carries, not the direction, so the direction is derived by one stated rule: neural data
 * moves away from the part in contact with tissue; stimulation commands and software
 * updates move toward it. Where the rule cannot decide, the flow has no direction.
 */

import type { DeviceModel, ModelLink } from './device-model';
import { LINK_PAYLOADS, type LinkPayload } from './reference-data-types';

/** Relative to the neural interface. Null when both ends of the link are equally far from it, or unreachable. */
export type FlowSense = 'away' | 'toward' | null;

export interface PayloadFlow {
  payload: LinkPayload;
  sense: FlowSense;
  /** True when the payload travels from the link's `from` component to its `to` component; null when undirected. */
  isFromTo: boolean | null;
}

const SENSE_BY_PAYLOAD: Record<LinkPayload, 'away' | 'toward'> = {
  neuralData: 'away',
  stimulationCommands: 'toward',
  softwareUpdates: 'toward',
};

const CARRIES: Record<LinkPayload, (link: ModelLink) => boolean> = {
  neuralData: (link) => link.carriesNeuralData,
  stimulationCommands: (link) => link.carriesStimulationCommands,
  softwareUpdates: (link) => link.carriesSoftwareUpdates,
};

/** Steps from the neural interface to each component along the model's links; unreachable components are absent. */
function distancesFromInterface(model: DeviceModel): Map<string, number> {
  const start = model.components.find((component) => component.isNeuralInterface);
  const distances = new Map<string, number>();
  if (start === undefined) return distances;
  distances.set(start.id, 0);
  const queue = [start.id];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const nextDistance = (distances.get(current) ?? 0) + 1;
    for (const link of model.links) {
      const neighbour = link.fromComponentId === current ? link.toComponentId : link.toComponentId === current ? link.fromComponentId : null;
      if (neighbour !== null && !distances.has(neighbour)) {
        distances.set(neighbour, nextDistance);
        queue.push(neighbour);
      }
    }
  }
  return distances;
}

/** One entry per link that carries something, keyed by link id, with a flow per payload in a fixed order. */
export function derivePayloadFlows(model: DeviceModel): Map<string, PayloadFlow[]> {
  const distances = distancesFromInterface(model);
  const flows = new Map<string, PayloadFlow[]>();
  for (const link of model.links) {
    const carried = LINK_PAYLOADS.filter((payload) => CARRIES[payload](link));
    if (carried.length === 0) continue;
    const fromDistance = distances.get(link.fromComponentId);
    const toDistance = distances.get(link.toComponentId);
    const isDecidable = fromDistance !== undefined && toDistance !== undefined && fromDistance !== toDistance;
    flows.set(link.id, carried.map((payload): PayloadFlow => {
      if (!isDecidable) return { payload, sense: null, isFromTo: null };
      const sense = SENSE_BY_PAYLOAD[payload];
      const isFromNearer = fromDistance < toDistance;
      return { payload, sense, isFromTo: sense === 'away' ? isFromNearer : !isFromNearer };
    }));
  }
  return flows;
}
