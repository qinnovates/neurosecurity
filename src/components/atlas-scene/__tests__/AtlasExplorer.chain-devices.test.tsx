// @vitest-environment jsdom
import fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { LIMIT_TEMPLATES } from '@/lib/anatomy/limits-copy';
import { ATLAS_CHAINS_PATH } from '@/lib/atlas-explorer/chain-file';
import { STEP_DWELL_MS } from '@/lib/atlas-explorer/chain-playback';
import AtlasExplorer from '../AtlasExplorer';
import { buildServedFiles, requestedPaths, serveFiles } from './explorer-test-server';

const REAL_FILES = buildServedFiles();
const UNREVIEWED = 'AI-drafted, unreviewed';
/** The one curated threat model with a step that lights a region today (step 4), and one with none. */
const LIT_CHAIN_ID = 'CHAIN-VIS-002';
const UNLIT_CHAIN_ID = 'CHAIN-EEG-001';
/** The one threat model whose data carries no evidence object, on the chain or on any step. */
const NO_EVIDENCE_CHAIN_ID = 'CHAIN-VIS-001';
const TEST_TIMEOUT_MS = 20_000;
vi.setConfig({ testTimeout: TEST_TIMEOUT_MS });

let fetchMock: ReturnType<typeof vi.fn>;

function setReducedMotion(isReduced: boolean): void {
  window.matchMedia = ((query: string) => ({ matches: isReduced && query.includes('prefers-reduced-motion'), media: query, addEventListener: () => undefined, removeEventListener: () => undefined })) as unknown as typeof window.matchMedia;
}

beforeEach(() => { fetchMock = serveFiles(REAL_FILES); setReducedMotion(false); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

async function renderExplorer(): Promise<HTMLElement> {
  const { container } = render(<AtlasExplorer />);
  await screen.findByRole('heading', { name: 'Regions' });
  return container;
}
const chainPanel = (container: HTMLElement): HTMLElement => container.querySelector('.atlas-chain') as HTMLElement;
const currentSteps = (container: HTMLElement): string[] => [...chainPanel(container).querySelectorAll('[data-chain-step][data-current="true"]')].map((step) => step.getAttribute('data-chain-step') ?? '');
const railMarks = (container: HTMLElement): Array<[string, string]> => [...container.querySelectorAll<HTMLElement>('.atlas-stage[data-chain-steps]')].map((stage) => [stage.dataset.stageId ?? '', stage.dataset.chainSteps ?? '']);

async function openChain(container: HTMLElement, chainId: string): Promise<void> {
  fireEvent.click(within(chainPanel(container)).getByRole('button', { name: 'Show the threat models' }));
  const select = await within(chainPanel(container)).findByLabelText('Threat model');
  fireEvent.change(select, { target: { value: chainId } });
}

describe('AtlasExplorer: threat model steps', () => {
  it('fetches no threat model until asked, and always carries the sentence about what the order means', async () => {
    const container = await renderExplorer();
    expect(requestedPaths(fetchMock)).not.toContain(ATLAS_CHAINS_PATH);
    expect(chainPanel(container).querySelector('[data-limit-id="chain_order"]')?.textContent).toBe('The steps follow the order of this threat model, one after another. Nothing here shows a signal moving through the brain.');
    await openChain(container, UNLIT_CHAIN_ID);
    expect(requestedPaths(fetchMock).filter((path) => path === ATLAS_CHAINS_PATH)).toHaveLength(1);
    expect(chainPanel(container).querySelector('[data-limit-id="chain_order"]')).not.toBeNull();
    expect(chainPanel(container).querySelector('[data-limit-id="chain_not_incident"]')).not.toBeNull();
  });

  it('says how few steps light a region, counted from the data: across every threat model and for the one chosen', async () => {
    const container = await renderExplorer();
    await openChain(container, UNLIT_CHAIN_ID);
    expect(chainPanel(container).querySelector('[data-limit-id="chain_overall_tally"]')?.textContent).toMatch(/^1 of the 35 steps in these 7 threat models light a region\. For the others the picture of the brain does not change\. Where a step's technique is tagged with a device stage, that stage is marked under Device stages; 4 steps have neither\.$/);
    expect(chainPanel(container).querySelector('[data-limit-id="chain_step_tally"]')?.textContent).toMatch(/^0 of this threat model's 5 steps light a region\./);
    expect([...chainPanel(container).querySelectorAll('[data-step-regions]')].map((line) => line.textContent)).toEqual(Array.from({ length: 5 }, () => 'Lights no region.'));
    fireEvent.change(within(chainPanel(container)).getByLabelText('Threat model'), { target: { value: LIT_CHAIN_ID } });
    expect(chainPanel(container).querySelector('[data-limit-id="chain_step_tally"]')?.textContent).toMatch(/^1 of this threat model's 5 steps light a region\./);
  });

  it('steps by the visitor\'s hand: previous, next and position move one step, light it with the technique lens, and mark its device stages', async () => {
    const container = await renderExplorer();
    await openChain(container, LIT_CHAIN_ID);
    const panel = within(chainPanel(container));
    expect(currentSteps(container)).toEqual(['1']);
    expect((panel.getByRole('button', { name: 'Previous step' }) as HTMLButtonElement).disabled).toBe(true);
    expect(railMarks(container).every(([, steps]) => steps === '1')).toBe(true);
    expect(railMarks(container).length).toBeGreaterThan(0);
    fireEvent.change(panel.getByRole('slider'), { target: { value: '4' } });
    expect(currentSteps(container)).toEqual(['4']);
    expect(panel.getByText('Step 4 of 5')).not.toBeNull();
    // Step 4 is the technique lens on its technique: the list shows that lens's marks, and the one region it counts.
    expect(container.querySelector('.atlas-root')?.getAttribute('data-lens')).toBe('technique');
    expect(chainPanel(container).querySelector('[data-chain-step="4"] [data-step-regions]')?.getAttribute('data-step-regions')).toBe('v1');
    expect(container.querySelector('button[data-region-id="v1"]')?.getAttribute('data-standing')).toBe('value');
    expect(railMarks(container)).toEqual([['S3', '4'], ['I0', '4']]);
    fireEvent.click(panel.getByRole('button', { name: 'Next step' }));
    expect(currentSteps(container)).toEqual(['5']);
    expect((panel.getByRole('button', { name: 'Next step' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(panel.getByRole('button', { name: 'Previous step' }));
    expect(currentSteps(container)).toEqual(['4']);
    expect(chainPanel(container).querySelector('[data-announce="chain-step"]')?.textContent).toMatch(/^Step 4 of 5: /);
  });

  it('plays only when the visitor presses play, one step at a time, pauses on request and stops at the last step', async () => {
    const container = await renderExplorer();
    await openChain(container, UNLIT_CHAIN_ID);
    vi.useFakeTimers();
    const panel = within(chainPanel(container));
    act(() => { vi.advanceTimersByTime(STEP_DWELL_MS * 3); });
    expect(currentSteps(container)).toEqual(['1']);
    fireEvent.click(panel.getByRole('button', { name: 'Play the steps' }));
    act(() => { vi.advanceTimersByTime(STEP_DWELL_MS); });
    expect(currentSteps(container)).toEqual(['2']);
    fireEvent.click(panel.getByRole('button', { name: 'Pause' }));
    act(() => { vi.advanceTimersByTime(STEP_DWELL_MS * 3); });
    expect(currentSteps(container)).toEqual(['2']);
    fireEvent.click(panel.getByRole('button', { name: 'Play the steps' }));
    for (let step = 0; step < 6; step += 1) act(() => { vi.advanceTimersByTime(STEP_DWELL_MS); });
    expect(currentSteps(container)).toEqual(['5']);
    expect(panel.getByRole('button', { name: 'Play the steps' })).not.toBeNull();
  });

  it('shows the whole threat model at once, numbered, with no playback, when the device asks for less motion', async () => {
    setReducedMotion(true);
    const container = await renderExplorer();
    await openChain(container, LIT_CHAIN_ID);
    expect(chainPanel(container).getAttribute('data-chain-whole')).toBe('true');
    expect(chainPanel(container).querySelector('[data-limit-id="chain_all_at_once"]')).not.toBeNull();
    expect(within(chainPanel(container)).queryByRole('slider')).toBeNull();
    expect(within(chainPanel(container)).queryByRole('button', { name: /Play|Pause|Next|Previous/ })).toBeNull();
    expect([...chainPanel(container).querySelectorAll('.atlas-chain-number')].map((number) => number.textContent)).toEqual(['1', '2', '3', '4', '5']);
    expect(currentSteps(container)).toEqual([]);
    // Every step's stages are marked at once, each with its numbers; the visitor's own lens is left alone.
    expect(railMarks(container).flatMap(([, steps]) => steps.split(' ')).sort()).toEqual(expect.arrayContaining(['1', '2', '3', '4']));
    expect(container.querySelector('.atlas-stage[data-stage-id="S3"] .atlas-step-badge')?.textContent).toMatch(/^Threat model steps \d(, \d)*$/);
    expect(container.querySelector('.atlas-root')?.getAttribute('data-lens')).toBe('band');
  });

  it('puts the review mark and the technique lens limit on every step that lights a region', async () => {
    const container = await renderExplorer();
    await openChain(container, LIT_CHAIN_ID);
    const litSteps = [...chainPanel(container).querySelectorAll<HTMLElement>('[data-chain-step]')].filter((step) => (step.querySelector('[data-step-regions]')?.getAttribute('data-step-regions') ?? '') !== '');
    expect(litSteps).toHaveLength(1);
    const [litStep] = litSteps;
    expect(litStep.querySelector('[data-step-regions] [data-review-state][data-ai-drafted="true"]')?.textContent).toBe(UNREVIEWED);
    expect(litStep.querySelector('[data-limit-id="lens_technique"]')?.textContent).toBe(LIMIT_TEMPLATES.lens_technique);
    for (const unlit of [...chainPanel(container).querySelectorAll<HTMLElement>('[data-chain-step]')].filter((step) => step !== litStep)) expect(unlit.querySelector('[data-step-regions] [data-review-state]')).toBeNull();
  });

  it('says so, on the chain and on every step, when the data file gives no evidence label, and only then', async () => {
    const container = await renderExplorer();
    await openChain(container, NO_EVIDENCE_CHAIN_ID);
    const panel = chainPanel(container);
    expect(panel.querySelector('[data-limit-id="chain_no_evidence_chain"]')?.textContent).toBe('The data file gives this chain no evidence label.');
    const stepSentences = [...panel.querySelectorAll('[data-chain-step] [data-limit-id="chain_no_evidence_step"]')];
    expect(stepSentences.length).toBeGreaterThan(0);
    for (const sentence of stepSentences) expect(sentence.textContent).toBe('The data file gives this step no evidence label.');
    fireEvent.change(within(panel).getByLabelText('Threat model'), { target: { value: UNLIT_CHAIN_ID } });
    expect(panel.querySelector('[data-limit-id="chain_no_evidence_chain"]')).toBeNull();
    expect(panel.querySelector('[data-limit-id="chain_no_evidence_step"]')).toBeNull();
  });

  it('writes nothing that points from one step to the next: no arrow, and no words for travelling, in the panel or its code', async () => {
    const container = await renderExplorer();
    await openChain(container, LIT_CHAIN_ID);
    expect(chainPanel(container).textContent).not.toMatch(/[→⟶➔➜►▶]|->|flows? (to|into)|travels|propagat|spreads to/);
    expect([...chainPanel(container).querySelectorAll('svg, canvas, line, path')].filter((drawn) => drawn.closest('.atlas-mark') === null)).toEqual([]);
    for (const file of ['ChainView.tsx', 'use-chain-view.ts']) expect(fs.readFileSync(`src/components/atlas-scene/${file}`, 'utf-8'), file).not.toMatch(/from 'three'|<svg|<line|<path|marker-end|arrow/i);
    expect(fs.readFileSync('src/lib/atlas-explorer/chain-steps.ts', 'utf-8')).not.toMatch(/from 'three'|centroid|lerp|interpolat/i);
  });
});

describe('AtlasExplorer: the electrode layout and the leads', () => {
  /** Turns the layer on and waits for its panel, which is fetched only then. */
  const turnOnLayout = async (container: HTMLElement): Promise<HTMLElement> => {
    fireEvent.click(within(openLayers()).getByRole('button', { name: 'EEG electrode layout' }));
    await screen.findByRole('heading', { name: 'EEG electrode layout' });
    return container.querySelector('.atlas-devices') as HTMLElement;
  };
  const openLayers = (): HTMLElement => {
    const layers = screen.getByRole('heading', { name: 'Layers' }).closest('section') as HTMLElement;
    fireEvent.click(within(layers).getByRole('button', { name: /^Show the 6 layers/ }));
    return layers;
  };

  it('is off until turned on, keeps the tracts control disabled with its reason, and shows nothing of either before then', async () => {
    const container = await renderExplorer();
    const layers = openLayers();
    const toggle = within(layers).getByRole('button', { name: 'EEG electrode layout' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('.atlas-devices')).toBeNull();
    const tracts = within(layers).getByRole('button', { name: 'Tracts' });
    expect(tracts.getAttribute('aria-disabled')).toBe('true');
    expect(document.getElementById(tracts.getAttribute('aria-describedby') ?? '')?.getAttribute('data-limit-id')).toMatch(/^layer_blocked_/);
    fireEvent.click(tracts);
    expect(tracts.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(await screen.findByRole('heading', { name: 'EEG electrode layout' })).not.toBeNull();
    expect(container.querySelector('.atlas-devices')).not.toBeNull();
  });

  it('names the 21 electrodes, and a picked one shows its name, the limits and the landmark notes and selects no region', async () => {
    const container = await renderExplorer();
    const panel = await turnOnLayout(container);
    expect(panel.querySelectorAll('[data-electrode-id]')).toHaveLength(21);
    fireEvent.click(within(panel).getByRole('button', { name: 'Cz' }));
    const picked = panel.querySelector('[data-picked-electrode="Cz"]') as HTMLElement;
    expect(picked.textContent).toContain('Picked electrode: Cz');
    expect(picked.querySelector('[data-review-state]')?.textContent).toBe(UNREVIEWED);
    expect(picked.querySelector(':scope > p > [data-review-state][data-ai-drafted="true"]')?.textContent).toBe(UNREVIEWED);
    expect([...picked.querySelectorAll('[data-limit-id]')].map((note) => note.textContent)).toEqual([LIMIT_TEMPLATES.device_electrodes, LIMIT_TEMPLATES.device_electrode_pick, LIMIT_TEMPLATES.device_landmarks]);
    expect([...picked.querySelectorAll('[data-landmark]')].map((landmark) => landmark.getAttribute('data-landmark'))).toEqual(['nasion', 'inion', 'left_preauricular', 'right_preauricular']);
    expect(picked.querySelectorAll('[data-landmark] [data-review-state]')).toHaveLength(4);
    // No region is selected, in the list, the inspector or the announcement.
    expect(container.querySelector('button[data-region-id][aria-current="true"], button[data-region-id][aria-pressed="true"]')).toBeNull();
    expect(container.querySelector('[data-announce="selection"]')?.textContent).toBe('');
    expect(picked.querySelector('[data-region-id]')).toBeNull();
    fireEvent.click(within(picked).getByRole('button', { name: 'Clear the picked electrode' }));
    expect(panel.querySelector('[data-picked-electrode]')).toBeNull();
  });

  it('draws each lead beside the brain with a scale bar, its review state, and a table giving every number its source and kind', async () => {
    const container = await renderExplorer();
    await turnOnLayout(container);
    const leads = [...container.querySelectorAll<HTMLElement>('.atlas-devices [data-lead-id]')];
    expect(leads.length).toBeGreaterThan(0);
    expect(container.querySelector('.atlas-viewport [data-lead-id]')).toBeNull();
    for (const lead of leads) {
      expect(lead.querySelector('[data-review-state]')?.textContent, lead.dataset.leadId).toBe(UNREVIEWED);
      expect(lead.querySelector('svg[data-lead-drawing] [data-scale-bar-mm]')).not.toBeNull();
      expect(lead.querySelector('svg[data-lead-drawing]')?.getAttribute('aria-label')).toContain(UNREVIEWED);
      const rows = [...lead.querySelectorAll('tbody tr')];
      expect(rows.map((row) => row.getAttribute('data-dimension'))).toEqual(['contacts', 'contact_length_mm', 'contact_spacing_mm', 'spacing_measure', 'diameter_mm']);
      for (const row of rows) {
        expect(row.querySelector('a')?.getAttribute('href')).toMatch(/^https:\/\//);
        expect(row.lastElementChild?.textContent).toMatch(/^(FDA document|review paper)(, (FDA document|review paper))?$/);
      }
    }
    const leadPanel = container.querySelector('[data-leads="beside-the-brain"]') as HTMLElement;
    expect([...leadPanel.querySelectorAll('[data-limit-id]')].map((note) => note.getAttribute('data-limit-id'))).toEqual(['device_lead', 'device_lead_scale', 'device_lead_panel']);
  });

  it('claims nothing the data does not hold: no reach, coverage, nearest region or distance, and every device drawing is marked unreviewed', async () => {
    const container = await renderExplorer();
    const panel = await turnOnLayout(container);
    fireEvent.click(within(panel).getByRole('button', { name: 'Oz' }));
    const ownWords = [...panel.querySelectorAll('h2, h3, button, th, figcaption strong, [data-limit-id]')].map((node) => node.textContent ?? '').join(' ');
    expect(ownWords).not.toMatch(/\breach|coverage|nearest|closest|distance to|picks up activity/i);
    expect(panel.querySelectorAll('[data-layout-id] [data-review-state]').length).toBeGreaterThan(0);
    expect(panel.querySelectorAll('[data-review-state="reviewed"]')).toHaveLength(0);
    for (const file of ['DeviceGeometry.tsx', 'LeadFigure.tsx', 'ViewportStage.tsx']) expect(fs.readFileSync(`src/components/atlas-scene/${file}`, 'utf-8'), file).toMatch(/ReviewMark|reviewState/);
  });
});
