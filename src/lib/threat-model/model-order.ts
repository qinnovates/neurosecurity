/**
 * The order the Lab lists a device's parts and connections in: from the tissue side outward,
 * as the diagram draws them. Parts go by trust zone, then by their order in the model; each
 * connection follows the inner of its two ends.
 */

import { TRUST_ZONES, type DeviceModel } from './device-model';
import { describeLink } from './stride';

export interface ModelElement {
  id: string;
  kind: 'part' | 'connection';
  label: string;
}

export function listElementsInModelOrder(model: DeviceModel): ModelElement[] {
  const parts = model.components
    .map((component, index) => ({ component, index }))
    .sort((left, right) => TRUST_ZONES.indexOf(left.component.trustZone) - TRUST_ZONES.indexOf(right.component.trustZone) || left.index - right.index)
    .map(({ component }) => component);
  const positionOf = new Map(parts.map((part, index) => [part.id, index]));
  const innerEndOf = (fromId: string, toId: string): number =>
    Math.min(positionOf.get(fromId) ?? parts.length, positionOf.get(toId) ?? parts.length);
  const connectionsAfter = (position: number): ModelElement[] => model.links
    .filter((link) => innerEndOf(link.fromComponentId, link.toComponentId) === position)
    .map((link): ModelElement => ({ id: link.id, kind: 'connection', label: describeLink(model, link.id) }));
  return [
    ...parts.flatMap((part, position): ModelElement[] => [{ id: part.id, kind: 'part', label: part.label }, ...connectionsAfter(position)]),
    // A connection neither of whose ends is a part of the model is still listed, last.
    ...connectionsAfter(parts.length),
  ];
}
