// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { act, render, screen, cleanup, renderHook } from '@testing-library/react';
import { countRowsByElement } from '@/lib/threat-model/register-counts';
import { PRESETS } from '@/lib/threat-model/__tests__/preset-reports';
import ArchitectureDiagram from '../../ArchitectureDiagram';
import { computeDiagramLayout } from '../../diagram-layout';
import { COMPACT_METRICS, FULL_METRICS, metricsFor } from '../diagram-metrics';
import { listEnteredIds, useEnteredIds } from '../use-entered-ids';
import { EIGHT_PART_MODEL } from './eight-part-model';

/** Test-only: a ResizeObserver that reports the width the test sets, since jsdom lays nothing out. */
let observedWidth = 0;
const observers = new Set<() => void>();
class FakeResizeObserver {
  private readonly notify: () => void;
  constructor(callback: ResizeObserverCallback) { this.notify = () => callback([], this as unknown as ResizeObserver); }
  observe(target: Element): void {
    target.getBoundingClientRect = () => ({ width: observedWidth, height: 100, top: 0, left: 0, right: observedWidth, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    observers.add(this.notify);
    this.notify();
  }
  unobserve(): void { observers.delete(this.notify); }
  disconnect(): void { observers.delete(this.notify); }
}
function resizeTo(width: number): void {
  observedWidth = width;
  act(() => { for (const notify of observers) notify(); });
}

const original = globalThis.ResizeObserver;
beforeEach(() => { globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver; });
afterEach(() => {
  cleanup();
  observers.clear();
  globalThis.ResizeObserver = original;
});

describe('the compact grid', () => {
  it.each(PRESETS)('lays %s out narrower and lower than the full grid, at the same type sizes', (_presetId, { model }) => {
    const full = computeDiagramLayout(model, FULL_METRICS);
    const compact = computeDiagramLayout(model, COMPACT_METRICS);
    expect(compact.width).toBeLessThan(full.width);
    expect(compact.height).toBeLessThan(full.height);
    expect(compact.nodes.map((node) => node.id)).toEqual(full.nodes.map((node) => node.id));
    expect(compact.edges.map((edge) => edge.id)).toEqual(full.edges.map((edge) => edge.id));
  });

  it('keeps a part\'s name, tag and badge inside the part on both grids', () => {
    for (const metrics of [FULL_METRICS, COMPACT_METRICS]) {
      expect(metrics.tagBaseline).toBeLessThan(metrics.labelBaselineUnderTag);
      // Two lines of the name end above the badge row, and the badge row ends inside the part.
      expect(metrics.labelBaselineUnderTag + 16).toBeLessThan(metrics.badgeTop);
      expect(metrics.badgeTop + 14).toBeLessThanOrEqual(metrics.nodeHeight);
      // A line of the name at 13px semi-bold fits the part: about 7.5px a character, with the inset on each side.
      expect(metrics.labelLineCharacters * 7.5 + 24).toBeLessThanOrEqual(metrics.nodeWidth + 8);
    }
  });

  it('gives a connection\'s label no badge row when nothing is badged', () => {
    expect(metricsFor('compact', false).cardBaseHeight).toBeLessThan(metricsFor('compact', true).cardBaseHeight);
    expect(metricsFor('compact', true)).toBe(COMPACT_METRICS);
    expect(metricsFor('full', true)).toBe(FULL_METRICS);
  });
});

describe('the fit of the diagram to its place', () => {
  const [, { model, report }] = PRESETS[2];
  const counts = countRowsByElement(model, report.riskRows);
  const width = computeDiagramLayout(model, COMPACT_METRICS).width;
  const props = { model, title: 'Device', elementCounts: counts, onSelectElement: () => undefined, density: 'compact' as const };

  it('is the drawing where it fits and the list where it does not, and never a smaller drawing', () => {
    observedWidth = width + 40;
    const { container } = render(<ArchitectureDiagram {...props} />);
    const svg = container.querySelector('.lab-diagram-svg');
    expect(svg?.getAttribute('width')).toBe(String(width));
    expect(container.querySelector('.lab-diagram')?.getAttribute('data-form')).toBe('drawing');

    resizeTo(width - 1);
    expect(container.querySelector('.lab-diagram-svg')).toBeNull();
    expect(container.querySelector('.lab-diagram')?.getAttribute('data-form')).toBe('list');
    expect(screen.getByRole('list', { name: 'Device' }).querySelectorAll('[data-element-id]')).toHaveLength(counts.length);

    resizeTo(width);
    expect(container.querySelector('.lab-diagram-svg')?.getAttribute('width')).toBe(String(width));
  });

  it('keeps the drawing of a picture for paper whatever the width', () => {
    observedWidth = 200;
    const { container } = render(<ArchitectureDiagram model={EIGHT_PART_MODEL} title="Device" isStatic />);
    expect(container.querySelector('.lab-diagram-svg')).not.toBeNull();
  });

  it('draws the eight-part device as a list at 1280px and as a drawing where it fits, with every part and connection either way', () => {
    const eightWidth = computeDiagramLayout(EIGHT_PART_MODEL, metricsFor('compact', false)).width;
    observedWidth = Math.min(1222, eightWidth - 1);
    const { container } = render(<ArchitectureDiagram model={EIGHT_PART_MODEL} title="Device" density="compact" onSelectElement={() => undefined} />);
    expect(container.querySelector('.lab-diagram-svg')).toBeNull();
    expect(container.querySelectorAll('.lab-diagram-row')).toHaveLength(EIGHT_PART_MODEL.components.length + EIGHT_PART_MODEL.links.length);
    resizeTo(eightWidth);
    expect(container.querySelectorAll('.lab-diagram-part')).toHaveLength(EIGHT_PART_MODEL.components.length);
  });
});

describe('what an edit added', () => {
  it('lists the ids that are new when the two lists share one, and nothing when the list was replaced', () => {
    expect(listEnteredIds(['a', 'b'], ['a', 'b', 'c'])).toEqual(['c']);
    expect(listEnteredIds(['a', 'b'], ['a'])).toEqual([]);
    expect(listEnteredIds(['a', 'b'], ['x', 'y'])).toEqual([]);
    expect(listEnteredIds([], ['a'])).toEqual([]);
  });

  it('reports nothing on the first render, the new id after an edit, and nothing once the device is replaced', () => {
    const { result, rerender } = renderHook(({ ids }) => useEnteredIds(ids), { initialProps: { ids: ['a', 'b'] } });
    expect([...result.current]).toEqual([]);
    rerender({ ids: ['a', 'b', 'c'] });
    expect([...result.current]).toEqual(['c']);
    rerender({ ids: ['a', 'b', 'c'] });
    expect([...result.current]).toEqual(['c']);
    rerender({ ids: ['x', 'y'] });
    expect([...result.current]).toEqual([]);
  });

  it('marks only the part an edit added, so the drawing does not move when it is first shown', () => {
    const [, { model }] = PRESETS[0];
    const { container, rerender } = render(<ArchitectureDiagram model={model} title="Device" onSelectElement={() => undefined} />);
    expect(container.querySelectorAll('[data-entered="true"]')).toHaveLength(0);
    const added = { ...model.components[1], id: 'added-part', label: 'Base station', isNeuralInterface: false };
    rerender(<ArchitectureDiagram model={{ ...model, components: [...model.components, added] }} title="Device" onSelectElement={() => undefined} />);
    const entered = [...container.querySelectorAll('[data-entered="true"]')];
    expect(entered.map((part) => part.getAttribute('data-element-id'))).toEqual(['added-part']);
  });
});
