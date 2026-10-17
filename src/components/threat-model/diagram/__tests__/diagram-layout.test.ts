import { describe, it, expect } from 'vitest';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { PRESETS } from '@/lib/threat-model/__tests__/preset-reports';
import { computeDiagramLayout, type DiagramLayout } from '../../diagram-layout';
import { doBoxesOverlap, doesSegmentEnterBox, isOnBoxEdge, segmentsOf } from '../diagram-geometry';
import { FULL_METRICS, MINI_METRICS, type DiagramMetrics } from '../diagram-metrics';
import { EIGHT_PART_MODEL } from './eight-part-model';

const MODELS: readonly (readonly [string, DeviceModel])[] = [
  ...PRESETS.map(([presetId, preset]) => [presetId, preset.model] as const),
  ['a synthetic eight-part device', EIGHT_PART_MODEL],
];
const METRICS: readonly (readonly [string, DiagramMetrics])[] = [['full size', FULL_METRICS], ['miniature', MINI_METRICS]];

function nodeOf(layout: DiagramLayout, nodeId: string) {
  const node = layout.nodes.find((candidate) => candidate.id === nodeId);
  if (node === undefined) throw new Error(`test setup: no node ${nodeId}`);
  return node;
}

describe.each(MODELS)('the layout of %s', (_name, model) => {
  describe.each(METRICS)('at %s', (_size, metrics) => {
    const layout = computeDiagramLayout(model, metrics);

    it('draws every part and every connection', () => {
      expect(layout.nodes.map((node) => node.id).sort()).toEqual(model.components.map((component) => component.id).sort());
      expect(layout.edges.map((edge) => edge.id)).toEqual(model.links.map((link) => link.id));
    });

    it('passes no connection through the box of any part', () => {
      for (const edge of layout.edges) {
        for (const [from, to] of segmentsOf(edge.points)) {
          const entered = layout.nodes.filter((node) => doesSegmentEnterBox(from, to, node)).map((node) => node.id);
          expect(entered, `${edge.id} enters`).toEqual([]);
        }
      }
    });

    it('starts and ends every connection on the edge of its two parts', () => {
      for (const edge of layout.edges) {
        expect(isOnBoxEdge(edge.points[0], nodeOf(layout, edge.fromId)), `${edge.id} start`).toBe(true);
        expect(isOnBoxEdge(edge.points[edge.points.length - 1], nodeOf(layout, edge.toId)), `${edge.id} end`).toBe(true);
      }
    });

    it('draws every connection as horizontal and vertical runs', () => {
      for (const edge of layout.edges) {
        expect(edge.points.length).toBeGreaterThan(1);
        for (const [from, to] of segmentsOf(edge.points)) expect(from.x === to.x || from.y === to.y, edge.id).toBe(true);
      }
    });

    it('keeps parts apart and inside the drawing', () => {
      layout.nodes.forEach((node, index) => {
        expect(node.x).toBeGreaterThanOrEqual(0);
        expect(node.x + node.width).toBeLessThanOrEqual(layout.width);
        expect(node.y + node.height).toBeLessThanOrEqual(layout.height);
        for (const other of layout.nodes.slice(index + 1)) expect(doBoxesOverlap(node, other), `${node.id} and ${other.id}`).toBe(false);
      });
    });
  });

  it('puts no connection label over a part or over another label, and keeps it inside the drawing', () => {
    const layout = computeDiagramLayout(model);
    layout.edges.forEach((edge, index) => {
      expect(edge.card.width).toBe(FULL_METRICS.cardWidth);
      expect(edge.card.x).toBeGreaterThanOrEqual(0);
      expect(edge.card.x + edge.card.width).toBeLessThanOrEqual(layout.width);
      expect(edge.card.y).toBeGreaterThanOrEqual(0);
      expect(edge.card.y + edge.card.height).toBeLessThanOrEqual(layout.height);
      expect(layout.nodes.filter((node) => doBoxesOverlap(edge.card, node)).map((node) => node.id), `${edge.id} label over`).toEqual([]);
      for (const other of layout.edges.slice(index + 1)) expect(doBoxesOverlap(edge.card, other.card), `${edge.id} and ${other.id}`).toBe(false);
    });
  });
});

describe('the layout as a device grows', () => {
  it('does not shrink a part: eight parts are drawn at the size three are', () => {
    const small = computeDiagramLayout(PRESETS[0][1].model);
    const large = computeDiagramLayout(EIGHT_PART_MODEL);
    expect(new Set([...small.nodes, ...large.nodes].map((node) => `${node.width}x${node.height}`))).toEqual(new Set([`${FULL_METRICS.nodeWidth}x${FULL_METRICS.nodeHeight}`]));
    expect(large.width).toBeGreaterThan(small.width);
  });

  it('lays out a device with no parts as an empty drawing', () => {
    const layout = computeDiagramLayout({ ...EIGHT_PART_MODEL, components: [], links: [] });
    expect(layout.nodes).toEqual([]);
    expect(layout.edges).toEqual([]);
  });

  it('leaves out a connection whose end is not a part of the model, and nothing else', () => {
    const model = { ...EIGHT_PART_MODEL, links: [...EIGHT_PART_MODEL.links, { ...EIGHT_PART_MODEL.links[0], id: 'dangling', toComponentId: 'missing' }] };
    expect(computeDiagramLayout(model).edges.map((edge) => edge.id)).toEqual(EIGHT_PART_MODEL.links.map((link) => link.id));
  });
});
