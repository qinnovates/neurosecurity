// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import type { SequencePlayback } from '@/components/lab-kit/motion/use-sequence-playback';
import { summariseChainLanes } from '@/lib/threat-model/chain-lanes';
import type { ChainGenerationResult } from '@/lib/threat-model/chain-types';
import { listElementsInModelOrder } from '@/lib/threat-model/model-order';
import { SCOPE_TERM_LABELS } from '@/lib/threat-model/lab-terms';
import type { ElementOutcome, RiskRow } from '@/lib/threat-model/report-types';
import { isRiskAddressed } from '@/lib/threat-model/risk-register';
import { PRESETS, engineData } from '@/lib/threat-model/__tests__/preset-reports';
import BeyondDevice from '../BeyondDevice';
import ChainsSection, { HYPOTHESIS_LABEL } from '../ChainsSection';
import ElementPanel from '../ElementPanel';
import { NONE_SHOWN_LABEL } from '../frame/ChainLaneTable';
import ReplaceDeviceConfirm from '../ReplaceDeviceConfirm';
import ThreatMatrix from '../ThreatMatrix';

afterEach(cleanup);

const [, { model, report }] = PRESETS[2];
const elements = listElementsInModelOrder(model);
const catalogRows = report.riskRows.filter((row) => row.source === 'catalog' && row.catalogState === 'current');
const techniqueById = new Map(engineData.techniques.map((technique) => [technique.id, technique]));

describe('Techniques by part', () => {
  it('draws one line per technique, a column per part and connection in model order, and a mark per row that opens it', () => {
    const onOpenRow = vi.fn();
    render(<ThreatMatrix rows={report.riskRows} elements={elements} onOpenRow={onOpenRow} onOpenTechnique={() => undefined} />);
    const heads = screen.getAllByRole('columnheader').map((header) => header.textContent);
    expect(heads).toEqual(['Technique', ...elements.map((element) => element.label), 'Open rows']);
    expect(screen.getAllByRole('row')).toHaveLength(new Set(catalogRows.map((row) => row.techniqueId)).size + 2);
    const [first] = catalogRows;
    fireEvent.click(screen.getByRole('button', { name: `${first.title} on ${first.elementLabel}: Open` }));
    expect(onOpenRow).toHaveBeenCalledWith(first.riskId);
  });

  it('tells an open row from a decided one in the mark\'s name, and totals both ways', () => {
    const [first] = catalogRows;
    const rows = report.riskRows.map((row): RiskRow => (row.riskId === first.riskId ? { ...row, status: 'mitigated' } : row));
    render(<ThreatMatrix rows={rows} elements={elements} onOpenRow={() => undefined} />);
    expect(screen.getByRole('button', { name: `${first.title} on ${first.elementLabel}: Decision recorded, Mitigated` })).toBeTruthy();
    const footer = screen.getAllByRole('row').at(-1) as HTMLElement;
    const onElement = catalogRows.filter((row) => row.elementId === first.elementId);
    const columnIndex = elements.findIndex((element) => element.id === first.elementId);
    expect(within(footer).getAllByRole('cell')[columnIndex].textContent).toBe(`${onElement.length - 1} of ${onElement.length}`);
  });

  it('says "not assessed" under a part with no row where the placement table is incomplete, never a bare zero', () => {
    const emptyElementIds = elements.filter((element) => !catalogRows.some((row) => row.elementId === element.id)).map((element) => element.id);
    const kept = catalogRows.filter((row) => row.elementId !== catalogRows[0].elementId);
    render(<ThreatMatrix rows={kept} elements={elements} isCoverageIncomplete />);
    expect(screen.getAllByRole('img', { name: 'Not assessed' })).toHaveLength(emptyElementIds.length + 1);
    const footer = screen.getAllByRole('row').at(-1) as HTMLElement;
    expect(footer.textContent).not.toContain('0 of 0');
  });

  it('says why it is empty and what to do, and prints as plain marks when nothing can be opened', () => {
    render(<ThreatMatrix rows={[]} elements={elements} />);
    expect(screen.getByRole('status').textContent).toContain('No risk of this kind matches the part and lenses chosen.');
    cleanup();
    render(<ThreatMatrix rows={report.riskRows} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getAllByRole('img', { name: /: Open$/ })).toHaveLength(catalogRows.filter((row) => !isRiskAddressed(row)).length);
  });
});

function stillPlayback(reached: number): SequencePlayback {
  return { reached, isPlaying: false, play: vi.fn(), pause: vi.fn(), stepForward: vi.fn(), stepBack: vi.fn(), showAll: vi.fn() };
}

describe('Chains', () => {
  const { chainResult } = report;
  const lanes = summariseChainLanes(model, chainResult);
  const [chain] = chainResult.chains;

  type ChainsOverrides = Partial<Parameters<typeof ChainsSection>[0]>;
  const quiet = { onSelectChain: (): void => undefined, onOpenTechnique: (): void => undefined };

  function chainsElement(overrides: ChainsOverrides, handlers: Pick<Parameters<typeof ChainsSection>[0], 'onSelectChain' | 'onOpenTechnique'> = quiet) {
    return (
      <ChainsSection
        model={model} chainResult={chainResult} deviceChainCount={chainResult.chains.length} techniqueById={techniqueById}
        selectedChain={null} playback={stillPlayback(0)} {...handlers} {...overrides}
      />
    );
  }

  function renderChains(overrides: ChainsOverrides = {}) {
    const handlers = { onSelectChain: vi.fn(), onOpenTechnique: vi.fn() };
    const view = render(chainsElement(overrides, handlers));
    return { ...handlers, ...view };
  }

  it('has a chain to show on the preset', () => {
    expect(chain).toBeDefined();
  });

  it('draws one lane per chain across the parts in model order, with a step number where each step acts', () => {
    const { onSelectChain } = renderChains();
    const heads = screen.getAllByRole('columnheader').map((header) => header.textContent);
    expect(heads).toEqual(['Chain', ...lanes.elements.map((element) => element.label), 'Weakest step']);
    const bodyRows = screen.getAllByRole('row').slice(1, -1);
    expect(bodyRows).toHaveLength(lanes.lanes.length);
    lanes.lanes.forEach((lane, index) => {
      const numbers = Array.from(bodyRows[index].querySelectorAll('.model-lane-step')).map((step) => Number(step.textContent)).sort((left, right) => left - right);
      expect(numbers).toEqual(lane.steps.map((step) => step.position).sort((left, right) => left - right));
    });
    fireEvent.click(within(bodyRows[0]).getByRole('button'));
    expect(onSelectChain).toHaveBeenCalledWith(lanes.lanes[0].chainId);
  });

  it('counts the chains shown under each part, and never prints a bare zero there', () => {
    renderChains();
    const footer = screen.getAllByRole('row').at(-1) as HTMLElement;
    const cells = within(footer).getAllByRole('cell');
    lanes.elements.forEach((element, index) => {
      const count = lanes.chainIdsByElement[element.id].length;
      expect(cells[index].textContent).toBe(count === 0 ? NONE_SHOWN_LABEL : String(count));
    });
  });

  it('always says the chains are hypotheses, and labels the selected one', () => {
    renderChains({ selectedChain: chain });
    expect(screen.getByText(/Every chain is a hypothesis for review/)).toBeTruthy();
    expect(screen.getByText(HYPOTHESIS_LABEL)).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(chain.steps.length);
    // The playback controls sit in the diagram's bar, which stays in view; the steps panel does not repeat them.
    expect(screen.queryByRole('group', { name: 'Chain playback' })).toBeNull();
  });

  it('brings the step being played into view once per step, and scrolls nothing when a chain is only opened', () => {
    const scrolled: (string | null)[] = [];
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function scrollIntoView(this: Element) { scrolled.push(this.getAttribute('data-state')); };
    try {
      const view = renderChains({ selectedChain: chain, playback: stillPlayback(0) });
      expect(scrolled).toEqual([]);
      view.rerender(chainsElement({ selectedChain: chain, playback: stillPlayback(1) }));
      expect(scrolled).toEqual(['now']);
      view.rerender(chainsElement({ selectedChain: chain, playback: stillPlayback(1) }));
      expect(scrolled).toEqual(['now']);
      view.rerender(chainsElement({ selectedChain: chain, playback: stillPlayback(2) }));
      expect(scrolled).toEqual(['now', 'now']);
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it('lights the steps playback has reached, in the lane and in the list alike', () => {
    renderChains({ selectedChain: chain, playback: stillPlayback(1) });
    const lane = screen.getAllByRole('row').find((row) => row.getAttribute('aria-current') === 'true') as HTMLElement;
    const states = Array.from(lane.querySelectorAll('.model-lane-step')).map((step) => [Number(step.textContent), step.getAttribute('data-state')]);
    for (const [position, state] of states) expect(state).toBe(position === 1 ? 'now' : 'ahead');
    expect(screen.getAllByRole('listitem').map((item) => item.getAttribute('data-state'))).toEqual(chain.steps.map((step) => (step.position === 1 ? 'now' : 'ahead')));
  });

  it('says so when the list was capped, with both counts, and when the search stopped early', () => {
    const capped: ChainGenerationResult = { ...chainResult, chainsFound: chainResult.chains.length + 4, wasCapped: true, wasTruncated: true };
    renderChains({ chainResult: capped });
    expect(screen.getByText(`${capped.chains.length} of ${capped.chainsFound} chains found are shown.`)).toBeTruthy();
    expect(screen.getByText('The search stopped at its limit. Other chains may exist.')).toBeTruthy();
  });

  it('gives the generator\'s reason when the device has no chain, and says the part is the cause when only the part emptied the list', () => {
    const none: ChainGenerationResult = { chains: [], wasTruncated: false, chainsFound: 0, wasCapped: false, emptyReason: 'No technique on this device meets the evidence gate.' };
    renderChains({ chainResult: none, deviceChainCount: 0 });
    expect(screen.getByText('No chains to show. No technique on this device meets the evidence gate.')).toBeTruthy();
    cleanup();
    renderChains({ chainResult: { ...chainResult, chains: [] } });
    expect(screen.getByRole('status').textContent).toContain('No chain shown acts on the selected part.');
  });
});

describe('Around the device', () => {
  it('keeps its standing notice and lists each technique with its evidence, as a link when it can be opened', () => {
    const onOpenTechnique = vi.fn();
    render(<BeyondDevice ambientThreats={report.ambientThreats} themes={report.themes} onOpenTechnique={onOpenTechnique} />);
    expect(screen.getByText(/Nothing on this page is part of the device's threat model\./)).toBeTruthy();
    // Every group starts folded to its title, its count and one line; nothing is listed until one is opened.
    const groups = [...new Set(report.ambientThreats.map((threat) => threat.category))];
    const toggles = screen.getAllByRole('button', { expanded: false });
    expect(toggles).toHaveLength(groups.length + report.themes.length);
    expect(screen.queryAllByRole('button', { name: /^Open technique / })).toHaveLength(0);
    expect(screen.queryAllByRole('table')).toHaveLength(0);
    const counts = toggles.map((toggle) => toggle.querySelector('.model-fold-count')?.textContent ?? null);
    expect(counts.slice(0, groups.length).map(Number).reduce((sum, count) => sum + count, 0)).toBe(report.ambientThreats.length);
    expect(counts.slice(groups.length)).toEqual(report.themes.map((theme) => (theme.techniques.length > 0 ? String(theme.techniques.length) : null)));

    const firstGroup = report.ambientThreats.filter((threat) => threat.category === groups[0]);
    fireEvent.click(toggles[0]);
    expect(toggles[0].getAttribute('aria-expanded')).toBe('true');
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(firstGroup.length);
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Technique', 'ID', 'Evidence']);
    const links = screen.getAllByRole('button', { name: /^Open technique / });
    expect(links).toHaveLength(firstGroup.length);
    fireEvent.click(links[0]);
    expect(onOpenTechnique).toHaveBeenCalledWith(firstGroup[0].techniqueId);
    fireEvent.click(toggles[0]);
    expect(screen.queryAllByRole('table')).toHaveLength(0);
  });

  it('says where each technique of a theme stands against the device, and keeps a theme\'s gap notice in view while folded', () => {
    render(<BeyondDevice ambientThreats={report.ambientThreats} themes={report.themes} onOpenTechnique={() => undefined} />);
    for (const theme of report.themes) if (theme.catalogGap !== null) expect(screen.getByText(theme.catalogGap)).toBeTruthy();
    const theme = report.themes.find((candidate) => candidate.techniques.length > 0);
    if (theme === undefined) throw new Error('test setup: no theme names a technique');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${theme.label}`) }));
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Technique', 'ID', 'Evidence', 'On this device']);
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    theme.techniques.forEach((technique, index) => expect(rows[index].textContent).toContain(SCOPE_TERM_LABELS[technique.standing]));
  });

  it('keeps every folded panel\'s content in the page, so paper prints it', () => {
    const { container } = render(<BeyondDevice ambientThreats={report.ambientThreats} themes={report.themes} />);
    const listed = report.ambientThreats.length + report.themes.reduce((sum, theme) => sum + theme.techniques.length, 0);
    expect(container.querySelectorAll('.model-fold-body[hidden] tbody tr')).toHaveLength(listed);
    // With nothing to open, ids are plain text.
    expect(container.querySelectorAll('.model-fold-body .lab-link')).toHaveLength(0);
  });
});

describe('ElementPanel', () => {
  it('says "Not assessed" for a part no placement decision covers, and that this is a gap in the tool', () => {
    const outcome: ElementOutcome = { elementId: 'part', kind: 'not_modelled', detail: 'No placement decision covers a part of this kind.', excluded: [] };
    render(<ElementPanel elementLabel="Dock" outcome={outcome} />);
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Not assessed');
    expect(status.textContent).toContain('Nothing was assessed here; treat it as a gap in this tool, not as an absence of threats.');
  });

  it('lists why techniques were excluded, and is silent for a part that has rows', () => {
    const excluded: ElementOutcome = { elementId: 'part', kind: 'not_applicable', exclusions: [{ ruleId: 'rule', detail: 'The device cannot stimulate.' }], excluded: [] };
    render(<ElementPanel elementLabel="Dock" outcome={excluded} />);
    expect(screen.getByText(/This is not the same as no threat\./)).toBeTruthy();
    expect(screen.getByText('The device cannot stimulate.')).toBeTruthy();
    cleanup();
    const { container } = render(<ElementPanel elementLabel="Dock" outcome={{ elementId: 'part', kind: 'matched', matches: [], excluded: [] }} />);
    expect(container.textContent).toBe('');
  });
});

describe('ReplaceDeviceConfirm', () => {
  it('names what would be lost, points to "Save file" in the device menu, and keeps by default', () => {
    const onKeep = vi.fn();
    render(<ReplaceDeviceConfirm currentName="Headset" decisionCount={2} replacementLabel="Cortical implant" onReplace={() => undefined} onKeep={onKeep} />);
    const dialog = screen.getByRole('alertdialog', { name: 'Replace Headset?' });
    expect(dialog.textContent).toContain('its answers and 2 recorded decisions');
    expect(dialog.textContent).toContain('Use "Save file" in the device menu first');
    expect(dialog.textContent).not.toContain('Save model file');
    expect(document.activeElement?.textContent).toBe('Keep Headset');
    fireEvent.click(screen.getByRole('button', { name: 'Keep Headset' }));
    expect(onKeep).toHaveBeenCalledOnce();
  });
});
