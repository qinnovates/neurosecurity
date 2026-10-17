import { describe, it, expect } from 'vitest';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { PRESETS } from '@/lib/threat-model/__tests__/preset-reports';
import { computeDiagramLayout, type EdgeLine } from '../../diagram-layout';
import { COMPACT_METRICS, FULL_METRICS, type DiagramMetrics } from '../diagram-metrics';
import { EIGHT_PART_MODEL } from './eight-part-model';

const MODELS: readonly (readonly [string, DeviceModel])[] = [...PRESETS.map(([id, preset]) => [id, preset.model] as const), ['eight parts', EIGHT_PART_MODEL]];
const GRIDS: readonly (readonly [string, DiagramMetrics])[] = [['full', FULL_METRICS], ['compact', COMPACT_METRICS]];

/** Runs of another connection that pass through this connection's label, so the label would read as theirs. */
export function listRunsUnderLabel(labelled: EdgeLine, other: EdgeLine): string[] {
  const { card } = labelled;
  const [left, right, top, bottom] = [card.x, card.x + card.width, card.y, card.y + card.height];
  const crossings: string[] = [];
  for (let index = 1; index < other.points.length; index += 1) {
    const [from, to] = [other.points[index - 1], other.points[index]];
    const [minX, maxX, minY, maxY] = [Math.min(from.x, to.x), Math.max(from.x, to.x), Math.min(from.y, to.y), Math.max(from.y, to.y)];
    if (maxX > left && minX < right && maxY > top && minY < bottom) crossings.push(`${other.id} run ${index} under the label of ${labelled.id}`);
  }
  return crossings;
}

describe.each(GRIDS)('on the %s grid', (_gridName, metrics) => {
  it.each(MODELS)('no connection of %s runs under the label of another', (_name, model) => {
    const { edges } = computeDiagramLayout(model, metrics);
    const crossings = edges.flatMap((labelled) => edges.filter((other) => other.id !== labelled.id).flatMap((other) => listRunsUnderLabel(labelled, other)));
    expect(crossings).toEqual([]);
  });
});
