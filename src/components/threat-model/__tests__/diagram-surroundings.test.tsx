// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import type { SequencePlayback } from '@/components/lab-kit/motion/use-sequence-playback';
import { EMPTY_LENS } from '@/lib/threat-model/lens';
import { listElementsInModelOrder } from '@/lib/threat-model/model-order';
import { countRowsByElement } from '@/lib/threat-model/register-counts';
import { countOpenRisksByElement } from '@/lib/threat-model/risk-register';
import { listTargetRegions } from '@/lib/threat-model/target-regions';
import { PRESETS, engineData } from '@/lib/threat-model/__tests__/preset-reports';
import DeviceCanvas, { DIAGRAM_TOGGLE_LABEL, LEGEND_TOGGLE_LABEL } from '../DeviceCanvas';
import { COMPACT_METRICS } from '../diagram/diagram-metrics';
import DeviceMiniDiagram from '../diagram/DeviceMiniDiagram';
import { ModelHighlightProvider, useModelHighlight } from '../model-highlight';
import PartStrip from '../PartStrip';
import TargetRegionsPanel from '../TargetRegionsPanel';

afterEach(cleanup);

const noop = (): void => undefined;
const STILL: SequencePlayback = { reached: 0, isPlaying: false, play: noop, pause: noop, stepForward: noop, stepBack: noop, showAll: noop };
const [, eeg] = PRESETS[0];
const [, cortical] = PRESETS[1];

describe('DeviceCanvas', () => {
  const baseProps = { lens: EMPTY_LENS, onLensChange: noop, selectedChain: null, chainPlayback: STILL, onClearChain: noop };

  it.each(PRESETS)('badges every part and connection of %s from the report', (_presetId, { model, report }) => {
    const { container } = render(<DeviceCanvas report={report} {...baseProps} />);
    const expected = countRowsByElement(model, report.riskRows);
    for (const given of expected) {
      const badge = container.querySelector(`:is(.lab-diagram-part, .lab-diagram-link)[data-element-id="${given.id}"] [data-badge]`);
      expect(badge?.getAttribute('data-badge'), given.id).toBe(given.catalogRows === 0 ? 'not-assessed' : 'split');
      if (given.catalogRows > 0) expect(badge?.getAttribute('data-open')).toBe(String(given.openCatalogRows));
    }
    expect(container.querySelectorAll('[data-selected="true"], [aria-pressed="true"]')).toHaveLength(0);
  });

  it.each(PRESETS)('draws %s on the compact grid at the same type sizes: every part is the compact size and nothing is scaled', (_presetId, { report }) => {
    const { container } = render(<DeviceCanvas report={report} {...baseProps} />);
    const svg = container.querySelector('.lab-diagram-svg');
    expect(svg?.getAttribute('viewBox')).toBe(`0 0 ${svg?.getAttribute('width')} ${svg?.getAttribute('height')}`);
    const boxes = [...container.querySelectorAll('.lab-diagram-part > .lab-diagram-box')];
    expect(boxes.length).toBe(report.model.components.length);
    for (const box of boxes) {
      expect(box.getAttribute('width')).toBe(String(COMPACT_METRICS.nodeWidth));
      expect(box.getAttribute('height')).toBe(String(COMPACT_METRICS.nodeHeight));
    }
  });

  it('keeps the legend and the sentence about the view behind "Legend", and remembers that it was opened', () => {
    const { container } = render(<DeviceCanvas report={eeg.report} {...baseProps} />);
    const legendToggle = screen.getByRole('button', { name: LEGEND_TOGGLE_LABEL });
    expect(legendToggle.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('.lab-diagram-legend')?.hasAttribute('hidden')).toBe(true);
    expect(container.textContent).not.toContain('Select a part or a connection');
    fireEvent.click(legendToggle);
    expect(legendToggle.getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('.lab-diagram-legend')?.hasAttribute('hidden')).toBe(false);
    expect(container.textContent).toContain('Select a part or a connection to narrow the rows to it');
    expect(screen.getByRole('list', { name: 'Diagram legend' })).toBeTruthy();
    expect(legendToggle.getAttribute('aria-controls')).toBe(container.querySelector('.lab-diagram-legend')?.id);
  });

  it('cannot be folded where no fold is offered, and where one is, folds to what stands in for the drawing', () => {
    const onToggleOpen = vi.fn();
    const { container, rerender } = render(<DeviceCanvas report={eeg.report} {...baseProps} />);
    expect(screen.queryByRole('button', { name: DIAGRAM_TOGGLE_LABEL })).toBeNull();
    rerender(<DeviceCanvas report={eeg.report} {...baseProps} isOpen onToggleOpen={onToggleOpen} folded={<span data-testid="stand-in" />} />);
    const toggle = screen.getByRole('button', { name: DIAGRAM_TOGGLE_LABEL });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.queryByTestId('stand-in')).toBeNull();
    fireEvent.click(toggle);
    expect(onToggleOpen).toHaveBeenCalledOnce();
    rerender(<DeviceCanvas report={eeg.report} {...baseProps} isOpen={false} onToggleOpen={onToggleOpen} folded={<span data-testid="stand-in" />} />);
    expect(screen.getByRole('button', { name: DIAGRAM_TOGGLE_LABEL }).getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('.lab-diagram-svg')).toBeNull();
    expect(screen.getByTestId('stand-in')).toBeTruthy();
    // Folded, there is no drawing to choose a view of or to explain.
    expect(screen.queryByRole('radiogroup', { name: 'Architecture view' })).toBeNull();
    expect(screen.queryByRole('button', { name: LEGEND_TOGGLE_LABEL })).toBeNull();
  });

  it('draws the counts it is given through elementCounts, and keeps "not assessed" from the whole register', () => {
    const { model, report } = cortical;
    const given = countRowsByElement(model, []);
    const { container } = render(<DeviceCanvas report={report} {...baseProps} elementCounts={given} />);
    const kinds = [...container.querySelectorAll('.lab-diagram-svg [data-badge]')].map((badge) => badge.getAttribute('data-badge'));
    const unplaced = countRowsByElement(model, report.riskRows).filter((counts) => counts.catalogRows === 0).length;
    expect(kinds.filter((kind) => kind === 'not-assessed')).toHaveLength(unplaced);
    expect(kinds.filter((kind) => kind === 'split')).toHaveLength(given.length - unplaced);
  });

  it('selects a part into the lens, and selecting it again shows the whole device', () => {
    const { report, model } = eeg;
    const onLensChange = vi.fn();
    const first = model.components[0];
    const { rerender } = render(<DeviceCanvas report={report} {...baseProps} onLensChange={onLensChange} />);
    fireEvent.click(within(screen.getByRole('group', { name: /Global system view/ })).getByRole('button', { name: new RegExp(`^${first.label}, part`) }));
    expect(onLensChange).toHaveBeenLastCalledWith({ ...EMPTY_LENS, elementId: first.id });
    rerender(<DeviceCanvas report={report} {...baseProps} lens={{ ...EMPTY_LENS, elementId: first.id }} onLensChange={onLensChange} />);
    const pressed = screen.getByRole('button', { pressed: true });
    expect(pressed.getAttribute('data-element-id')).toBe(first.id);
    fireEvent.click(pressed);
    expect(onLensChange).toHaveBeenLastCalledWith({ ...EMPTY_LENS, elementId: null });
  });

  it('offers the architecture views as a quiet one-of-n control and steps the rest back when one is chosen', () => {
    const { report } = eeg;
    const onClearChain = vi.fn();
    const { container } = render(<DeviceCanvas report={report} {...baseProps} onClearChain={onClearChain} />);
    const options = within(screen.getByRole('radiogroup', { name: 'Architecture view' })).getAllByRole('radio');
    expect(options).toHaveLength(report.architectureViews.length);
    expect(container.querySelectorAll('[data-dimmed="true"]')).toHaveLength(0);
    fireEvent.click(options[1]);
    expect(onClearChain).toHaveBeenCalled();
    const view = report.architectureViews[1];
    const dimmedParts = [...container.querySelectorAll('.lab-diagram-part[data-dimmed="true"]')].map((part) => part.getAttribute('data-element-id'));
    expect(dimmedParts.sort()).toEqual(report.model.components.map((component) => component.id).filter((id) => !view.highlightedComponentIds.includes(id)).sort());
  });

  it('labels a selected chain as a generated hypothesis and marks its steps', () => {
    const { report } = cortical;
    const chain = report.chainResult.chains[0];
    const { container } = render(<DeviceCanvas report={report} {...baseProps} selectedChain={chain} chainPlayback={{ ...STILL, reached: chain.steps.length }} />);
    expect(screen.getByText('Generated hypothesis')).toBeTruthy();
    expect(new Set([...container.querySelectorAll('[data-step]')].map((mark) => mark.getAttribute('data-step')))).toEqual(new Set(['reached']));
    fireEvent.click(screen.getByRole('button', { name: LEGEND_TOGGLE_LABEL }));
    expect(container.textContent).toContain('that is not evidence the attack has been carried out');
  });

  it('carries the chain\'s playback controls in its own bar, beside the label and the chain\'s name, in place of the view control', () => {
    const { report } = cortical;
    const chain = report.chainResult.chains[0];
    const play = vi.fn();
    const onClearChain = vi.fn();
    const { container } = render(<DeviceCanvas report={report} {...baseProps} selectedChain={chain} chainPlayback={{ ...STILL, play }} onClearChain={onClearChain} />);
    const bar = container.querySelector('.lab-diagram-bar');
    if (!(bar instanceof HTMLElement)) throw new Error('test setup: the diagram has no bar');
    const transport = within(bar).getByRole('group', { name: 'Chain playback' });
    fireEvent.click(within(transport).getByRole('button', { name: 'Play' }));
    expect(play).toHaveBeenCalledOnce();
    expect(within(transport).getByRole('status').textContent).toBe(`Step 0 of ${chain.steps.length}`);
    expect(within(bar).getByText(chain.chain_name)).toBeTruthy();
    expect(within(bar).queryByRole('radiogroup', { name: 'Architecture view' })).toBeNull();
    fireEvent.click(within(bar).getByRole('button', { name: 'Clear' }));
    expect(onClearChain).toHaveBeenCalledOnce();
  });
});

describe('DeviceMiniDiagram', () => {
  it.each(PRESETS)('draws every part and connection of %s with no text, and names the counts', (_presetId, { model }) => {
    const { container } = render(<DeviceMiniDiagram model={model} />);
    const picture = screen.getByRole('img');
    expect(picture.getAttribute('aria-label')).toContain(`${model.components.length} parts`);
    expect(picture.getAttribute('aria-label')).toContain(String(model.links.length));
    expect(container.querySelectorAll('.lab-diagram-mini-part')).toHaveLength(model.components.length);
    expect(container.querySelectorAll('.lab-diagram-mini-line')).toHaveLength(model.links.length);
    expect(container.querySelectorAll('text')).toHaveLength(0);
    expect(container.querySelectorAll('[tabindex], [role="button"]')).toHaveLength(0);
    expect(container.querySelectorAll('.lab-diagram-mini-part[data-tissue-contact="true"]')).toHaveLength(1);
  });

  it('draws a part at one size on every card, in a slot of one height, so two devices compare', () => {
    const sizes = PRESETS.map(([, { model }]) => {
      const { container } = render(<DeviceMiniDiagram model={model} />);
      const slot = container.querySelector('.lab-diagram-mini-slot');
      expect(slot?.querySelector('svg.lab-diagram-mini')).not.toBeNull();
      const svg = container.querySelector('svg');
      // One CSS pixel per unit: the picture is as wide as its own layout, not as wide as the card.
      expect(svg?.getAttribute('viewBox')).toBe(`0 0 ${svg?.getAttribute('width')} ${svg?.getAttribute('height')}`);
      const partSizes = [...container.querySelectorAll('.lab-diagram-mini-part > rect:first-child')].map((rect) => `${rect.getAttribute('width')}x${rect.getAttribute('height')}`);
      cleanup();
      return new Set(partSizes);
    });
    expect(new Set(sizes.flatMap((set) => [...set])).size).toBe(1);
  });
});

function LitKeyProbe() {
  return <output data-testid="lit-key">{useModelHighlight().litKey ?? 'none'}</output>;
}

describe('PartStrip', () => {
  const { model, report } = cortical;
  const openCounts = countOpenRisksByElement(report.riskRows);

  it('lists every connection when given the register counts, with "not assessed" where nothing is placed', () => {
    const counts = countRowsByElement(model, report.riskRows);
    render(<PartStrip model={model} lens={EMPTY_LENS} openRiskCounts={openCounts} elementCounts={counts} onLensChange={noop} />);
    const chips = within(screen.getByRole('group', { name: 'Parts of the device' })).getAllByRole('button');
    expect(chips).toHaveLength(model.components.length + model.links.length);
    const unplaced = counts.filter((element) => element.catalogRows === 0);
    expect(unplaced.length).toBeGreaterThan(0);
    for (const element of unplaced) expect(screen.getByRole('button', { name: `${element.label} not assessed` })).toBeTruthy();
  });

  it('lights the shared highlight from a chip', () => {
    const { container } = render(<ModelHighlightProvider><PartStrip model={model} lens={EMPTY_LENS} openRiskCounts={openCounts} onLensChange={noop} /><LitKeyProbe /></ModelHighlightProvider>);
    const first = listElementsInModelOrder(model)[0];
    const item = container.querySelector('.lab-diagram-strip-item');
    if (item === null) throw new Error('test setup: the strip is empty');
    fireEvent.pointerEnter(item);
    expect(screen.getByTestId('lit-key').textContent).toBe(first.id);
  });
});

describe('TargetRegionsPanel', () => {
  const summaryOf = (preset: typeof eeg) => listTargetRegions(preset.model, engineData.regions);

  it('heads a non-invasive device "Electrode coverage (description only)" and draws nothing inside a brain', () => {
    const { container } = render(<TargetRegionsPanel summary={summaryOf(eeg)} interfaceLabel="EEG headset" invasiveness={eeg.model.invasiveness} />);
    expect(eeg.model.invasiveness).toBe('noninvasive');
    expect(screen.getByRole('heading').textContent).toBe('Electrode coverage (description only)');
    expect(container.querySelector('svg')).toBeNull();
    expect(container.textContent).not.toMatch(/records from/i);
  });

  it.each(PRESETS)('prints no band beside a region and nothing that pulses for %s', (_presetId, preset) => {
    const summary = summaryOf(preset);
    const { container } = render(<TargetRegionsPanel summary={summary} interfaceLabel="the interface" invasiveness={preset.model.invasiveness} />);
    expect(summary.regions.length).toBeGreaterThan(0);
    for (const region of summary.regions) {
      expect(container.textContent).toContain(region.name);
      expect(container.textContent).not.toContain(`band ${region.bandId}`);
    }
    expect(container.textContent).not.toMatch(/records from/i);
    expect(container.querySelectorAll('[class*="halo"], animate, animateTransform')).toHaveLength(0);
  });

  it('keeps the schematic for an implanted device, and leaves it out when it is not told how the device contacts the body', () => {
    const { container, rerender } = render(<TargetRegionsPanel summary={summaryOf(cortical)} interfaceLabel="Cortical implant" invasiveness={cortical.model.invasiveness} />);
    expect(screen.getByRole('heading').textContent).toBe('Target regions');
    expect(container.querySelectorAll('svg[role="img"]')).toHaveLength(1);
    rerender(<TargetRegionsPanel summary={summaryOf(cortical)} interfaceLabel="Cortical implant" />);
    expect(container.querySelector('svg')).toBeNull();
  });
});
