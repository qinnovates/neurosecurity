/** The device model as a graph: components and links are both nodes, joined where a link meets a component. */

import type { DeviceModel } from './device-model';

export type ElementGraph = ReadonlyMap<string, readonly string[]>;

export function buildElementGraph(model: DeviceModel): ElementGraph {
  const neighbours = new Map<string, string[]>(model.components.map((component) => [component.id, []]));
  for (const link of model.links) {
    neighbours.set(link.id, [link.fromComponentId, link.toComponentId]);
    neighbours.get(link.fromComponentId)?.push(link.id);
    neighbours.get(link.toComponentId)?.push(link.id);
  }
  for (const adjacent of neighbours.values()) adjacent.sort();
  return neighbours;
}

export function areDirectlyConnected(graph: ElementGraph, leftId: string, rightId: string): boolean {
  return graph.get(leftId)?.includes(rightId) ?? false;
}

/**
 * Shortest path between two elements, both ends included, or null when they are
 * not connected. Breadth-first over sorted neighbours, so the result is deterministic.
 */
export function findShortestPath(graph: ElementGraph, fromId: string, toId: string): string[] | null {
  if (!graph.has(fromId) || !graph.has(toId)) return null;
  const previous = new Map<string, string | null>([[fromId, null]]);
  const queue = [fromId];
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    if (current === toId) return tracePath(previous, toId);
    for (const next of graph.get(current) ?? []) {
      if (!previous.has(next)) {
        previous.set(next, current);
        queue.push(next);
      }
    }
  }
  return null;
}

function tracePath(previous: ReadonlyMap<string, string | null>, endId: string): string[] {
  const path: string[] = [];
  for (let current: string | null | undefined = endId; current !== null && current !== undefined; current = previous.get(current)) {
    path.unshift(current);
  }
  return path;
}
