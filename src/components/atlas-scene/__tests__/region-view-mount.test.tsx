// @vitest-environment jsdom
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ANATOMY_INDEX_PATH } from '@/lib/anatomy/anatomy-index-types';
import { LIMIT_TEMPLATES, isLimitId, limitSentence } from '@/lib/anatomy/limits-copy';
import { MOUNT_COPY } from '@/lib/anatomy/mount-copy';
import type { AtlasCanvasProps } from '../AtlasCanvas';
import { INITIAL_EXPLORER_STATE } from '../atlas-state';
import AtlasViewport, { type AtlasViewportProps } from '../AtlasViewport';
import OpenViewport, { type OpenViewportProps } from '../OpenViewport';
import RegionViewMount, { type RegionViewMountProps } from '../RegionViewMount';
import RegionViewPanel, { type RegionViewPanelProps } from '../RegionViewPanel';
import { GATE_NOTICES } from '../viewport-gate';
import { model, serveSite, writePin } from './region-view-test-kit';

// The test runner does not build stylesheets, so the two addresses the build would give are stood in for.
vi.mock('../atlas-scene.css?url', () => ({ default: '/_astro/atlas-scene.css' }));
vi.mock('../atlas-region-mount.css?url', () => ({ default: '/_astro/atlas-region-mount.css' }));

const TEST_TIMEOUT_MS = 20_000;
vi.setConfig({ testTimeout: TEST_TIMEOUT_MS });

const drawn = model.regions.filter((region) => region.geometry.state === 'drawn');
const shapeless = model.regions.find((region) => region.geometry.state === 'no_geometry');
const BAND_LENS = { kind: 'band' } as const;

let canvasProps: AtlasCanvasProps | null = null;
let fetchLog: string[] = [];
function CanvasStandIn(props: AtlasCanvasProps) {
  canvasProps = props;
  return <div data-canvas="stand-in" role="img" aria-label={props.description} />;
}
const loadCanvas = vi.fn(async () => ({ default: CanvasStandIn }));
const loadOpenView = vi.fn(async () => ({ default: (props: OpenViewportProps) => <OpenViewport {...props} loadCanvas={loadCanvas} /> }));

async function openViewport(props: Partial<AtlasViewportProps> = {}): Promise<AtlasCanvasProps> {
  const { container } = render(
    <AtlasViewport
      model={model} lens={BAND_LENS} layers={INITIAL_EXPLORER_STATE.layers} selectedRegionId={null} isIndexPinned isAsked onSelectRegion={() => undefined}
      probe={() => true} loadOpenView={loadOpenView} {...props}
    />,
  );
  await waitFor(() => {
    expect(container.querySelector('[data-asset-status]')).not.toBeNull();
    expect(container.querySelectorAll('[data-asset-status="loading"]')).toHaveLength(0);
    expect(canvasProps).not.toBeNull();
  });
  return canvasProps as AtlasCanvasProps;
}

beforeEach(() => {
  canvasProps = null;
  fetchLog = [];
  loadCanvas.mockClear();
  loadOpenView.mockClear();
  vi.stubGlobal('crypto', webcrypto);
  fetchLog = serveSite();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.body.replaceChildren(); document.head.querySelectorAll('link').forEach((link) => link.remove()); });

describe('the viewport once the page\'s own control has asked for it', () => {
  it('opens without a second button', async () => {
    await openViewport();
    expect(screen.queryByRole('button', { name: 'Show the 3D view' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Hide the 3D view' })).toBeTruthy();
  });

  it.each([
    ['the browser gives no WebGL context', { probe: () => false }, 'no_webgl'],
    ['the page carries no index pin', { isIndexPinned: false }, 'unpinned'],
    ['the page and the served index are out of step', { isOutOfStep: true }, 'out_of_step'],
  ] as const)('says why and fetches nothing 3D when %s', (_case, props, gate) => {
    render(<AtlasViewport model={model} lens={BAND_LENS} layers={INITIAL_EXPLORER_STATE.layers} selectedRegionId={null} isIndexPinned isAsked onSelectRegion={() => undefined} probe={() => true} loadOpenView={loadOpenView} {...props} />);
    expect(screen.getByRole('alert').textContent).toBe(GATE_NOTICES[gate]);
    expect(loadOpenView).not.toHaveBeenCalled();
    expect(fetchLog).toEqual([]);
  });

  it('returns focus to "Show the 3D view" when the visitor hides the view, and opens again from there', async () => {
    await openViewport();
    fireEvent.click(screen.getByRole('button', { name: 'Hide the 3D view' }));
    const show = screen.getByRole('button', { name: 'Show the 3D view' });
    expect(document.activeElement).toBe(show);
    expect(screen.queryByRole('button', { name: 'Hide the 3D view' })).toBeNull();
    fireEvent.click(show);
    expect(await screen.findByRole('button', { name: 'Hide the 3D view' })).toBeTruthy();
  });

  it('does not take focus for a view the visitor has not opened and hidden', () => {
    render(<AtlasViewport model={model} lens={BAND_LENS} layers={INITIAL_EXPLORER_STATE.layers} selectedRegionId={null} isIndexPinned onSelectRegion={() => undefined} probe={() => true} loadOpenView={loadOpenView} />);
    expect(document.activeElement).toBe(document.body);
  });

  it('draws without animation when the visitor prefers less motion', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('prefers-reduced-motion'), addEventListener: () => undefined, removeEventListener: () => undefined }));
    expect((await openViewport()).prefersLessMotion).toBe(true);
  });
});

describe('the visitor\'s selection in the picture', () => {
  it('selects every shape of each chosen group, lit from within, and changes no fill, colour or step of any shape', async () => {
    const plain = await openViewport();
    const plainShapes = plain.shapes.map((shape) => ({ ...shape }));
    cleanup();
    canvasProps = null;
    const groups = [[drawn[0].id], [drawn[1].id, drawn[2].id]];
    const chosen = await openViewport({ selectedRegionGroups: groups });
    expect(chosen.shapes).toEqual(plainShapes);
    expect([...chosen.selectedKeys].sort()).toEqual([...new Set(groups.flat().flatMap((regionId) => model.regionsById.get(regionId)?.structure_keys ?? []))].sort());
    expect(plain.selectedKeys.size).toBe(0);
    // Nothing is handed to the picture to draw around the selection: no groups, no label. The name stands beside it.
    expect(Object.keys(chosen)).not.toContain('bracketGroups');
    expect(Object.keys(chosen)).not.toContain('selectionLabel');
  });

  it('selects nothing for a region that has no shape, and nothing for an id the index does not hold', async () => {
    const chosen = await openViewport({ selectedRegionGroups: [[shapeless?.id ?? ''], ['not-a-region']] });
    expect(chosen.selectedKeys.size).toBe(0);
  });
});

describe('RegionViewMount: the button a page ships with', () => {
  const Panel = (props: RegionViewPanelProps) => <div data-panel={JSON.stringify(props)} />;

  it('is one button and a sentence until asked: no panel, no data and nothing 3D is fetched', () => {
    const loadPanel = vi.fn(async () => ({ default: Panel }));
    const { container } = render(<RegionViewMount lens={BAND_LENS} selectedRegionIds={['pfc']} loadPanel={loadPanel} />);
    expect(within(container).getAllByRole('button').map((button) => button.textContent)).toEqual(['Show the 3D view']);
    expect(container.textContent).toContain('Nothing is fetched until you ask.');
    expect(loadPanel).not.toHaveBeenCalled();
    expect(fetchLog).toEqual([]);
  });

  it('stays a button under reduced motion until the visitor asks', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: () => undefined, removeEventListener: () => undefined }));
    const loadPanel = vi.fn(async () => ({ default: Panel }));
    render(<RegionViewMount lens={BAND_LENS} loadPanel={loadPanel} />);
    expect(loadPanel).not.toHaveBeenCalled();
  });

  it('hands the panel the lens and the visitor\'s selection, and nothing else', async () => {
    const { container } = render(<RegionViewMount lens={{ kind: 'technique', techniqueId: 'QIF-T0001' }} selectedRegionIds={['pfc']} selectedBandId="N7" loadPanel={async () => ({ default: Panel })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show the 3D view' }));
    await waitFor(() => expect(container.querySelector('[data-panel]')).not.toBeNull());
    expect(JSON.parse(container.querySelector('[data-panel]')?.getAttribute('data-panel') ?? '{}')).toEqual({ lens: { kind: 'technique', techniqueId: 'QIF-T0001' }, selectedRegionIds: ['pfc'], selectedBandId: 'N7' });
  });

  it('keeps the page\'s sentence about colouring to itself: the panel is handed the lens and the selection only', async () => {
    const { container } = render(<RegionViewMount lens={{ kind: 'technique', techniqueId: 'QIF-T0001' }} nothingColoured={limitSentence('view_nothing_coloured_none_named')} loadPanel={async () => ({ default: Panel })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show the 3D view' }));
    await waitFor(() => expect(container.querySelector('[data-panel]')).not.toBeNull());
    expect(JSON.parse(container.querySelector('[data-panel]')?.getAttribute('data-panel') ?? '{}')).toEqual({ lens: { kind: 'technique', techniqueId: 'QIF-T0001' } });
  });

  it.each([
    ['colour a shape', null, null],
    ['name only regions with no shape of their own', limitSentence('view_nothing_coloured_no_own_shape'), 'No region is coloured for this technique: its drafted links name no region that has a shape of its own in this atlas.'],
    ['name no region', limitSentence('view_nothing_coloured_none_named'), 'No region is coloured for this technique: its drafted links name no single region.'],
  ] as const)('for a technique whose links %s, keeps the button and says beside it what the picture will not show', (_case, nothingColoured, sentence) => {
    const { container } = render(<RegionViewMount lens={{ kind: 'technique', techniqueId: 'QIF-T0001' }} nothingColoured={nothingColoured} loadPanel={async () => ({ default: Panel })} />);
    expect(screen.getByRole('button', { name: 'Show the 3D view' })).toBeTruthy();
    expect(container.querySelector('[data-mount-note="nothing-coloured"]')?.textContent ?? null).toBe(sentence);
    expect(sentence === null || [LIMIT_TEMPLATES.view_nothing_coloured_no_own_shape, LIMIT_TEMPLATES.view_nothing_coloured_none_named].includes(sentence)).toBe(true);
    expect(container.textContent).toContain(MOUNT_COPY.ask);
  });

  it('sends the visitor to the page\'s list only when nothing is chosen there and the page has a list that chooses', () => {
    const hint = (props: Partial<RegionViewMountProps>): string | null => {
      const { container } = render(<RegionViewMount lens={BAND_LENS} loadPanel={async () => ({ default: Panel })} {...props} />);
      const text = container.querySelector('[data-mount-note="choose-in-list"]')?.textContent ?? null;
      cleanup();
      return text;
    };
    const onRegionPick = (): void => undefined;
    expect(hint({ onRegionPick })).toBe('Choose a band or region in the list on this page to mark it in the picture.');
    const technique = { kind: 'technique', techniqueId: 'QIF-T0001' } as const;
    expect(hint({ onRegionPick, selectedRegionIds: [], selectedBandId: null, lens: technique, nothingColoured: limitSentence('view_nothing_coloured_none_named') })).toBe(MOUNT_COPY.choose_in_list);
    expect(hint({ onRegionPick, selectedBandId: 'N7' })).toBeNull();
    expect(hint({ onRegionPick, selectedRegionIds: ['pfc'] })).toBeNull();
    // The view lists the regions a technique's links name, so there is something to pick inside it.
    expect(hint({ onRegionPick, lens: technique, nothingColoured: limitSentence('view_nothing_coloured_no_own_shape') })).toBeNull();
    expect(hint({ onRegionPick, lens: technique, nothingColoured: null })).toBeNull();
    // The Lab's panel restates a choice made elsewhere on the page and has no list to choose in.
    expect(hint({})).toBeNull();
  });

  it('says so and keeps the page when the view\'s script does not arrive, and can be tried again', async () => {
    const loadPanel = vi.fn<() => Promise<{ default: typeof Panel }>>().mockRejectedValueOnce(new Error('chunk failed')).mockResolvedValue({ default: Panel });
    const { container } = render(<RegionViewMount lens={BAND_LENS} loadPanel={loadPanel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show the 3D view' }));
    expect((await screen.findByRole('alert')).textContent).toBe('The 3D view could not be loaded. The list on this page is unchanged.');
    fireEvent.click(screen.getByRole('button', { name: 'Try the 3D view again' }));
    await waitFor(() => expect(container.querySelector('[data-panel]')).not.toBeNull());
  });
});

describe('RegionViewPanel: the view with its words, on a page', () => {
  const chosenIds = [drawn[0].id, shapeless?.id ?? ''];

  it('shows the notice and the whole of the words when the browser cannot draw (jsdom has no WebGL)', async () => {
    writePin();
    const { container } = render(<RegionViewPanel lens={BAND_LENS} selectedRegionIds={chosenIds} />);
    expect((await screen.findByRole('alert')).textContent).toBe(GATE_NOTICES.no_webgl);
    const group = screen.getByRole('group', { name: '3D view and what it shows' });
    // The mark and every limit sentence stand in the same group as the view.
    expect(group.querySelector('[data-ai-drafted="true"]')?.textContent).toContain('AI-drafted, unreviewed');
    const limitIds = [...group.querySelectorAll('[data-limit-id]')].map((note) => note.getAttribute('data-limit-id') ?? '');
    expect(limitIds).toEqual(['view_chosen_regions', 'lens_band', 'view_regions_without_shape', 'region_matching', 'outline_shape']);
    expect(limitIds.every(isLimitId)).toBe(true);
    expect(within(group).getByRole('heading', { name: 'Regions you chose (2)' })).toBeTruthy();
    expect(within(group).getAllByRole('button').filter((button) => button.classList.contains('atlas-chip')).map((button) => button.textContent)).toEqual(chosenIds.map((regionId) => model.regionsById.get(regionId)?.name));
    expect(fetchLog.some((url) => url.endsWith('.glb'))).toBe(false);
    expect(container.querySelector('.atlas-root')?.getAttribute('data-region-mount')).toBe('ready');
  });

  it('opens a picked region\'s name, band and shape status, tells the page, and can be reached from the keyboard', async () => {
    writePin();
    const onRegionPick = vi.fn();
    render(<RegionViewPanel lens={BAND_LENS} selectedRegionIds={chosenIds} onRegionPick={onRegionPick} />);
    const button = await screen.findByRole('button', { name: shapeless?.name });
    fireEvent.click(button);
    const detail = document.querySelector(`[data-picked-region="${shapeless?.id}"]`);
    expect(detail?.textContent).toContain('In this atlas: no shape.');
    expect(detail?.querySelector('[data-limit-id="geometry_no_geometry"]')).not.toBeNull();
    expect(detail?.querySelector('a')?.getAttribute('href')).toBe('/atlas/anatomy/');
    expect(document.activeElement).toBe(detail?.querySelector('h3'));
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(onRegionPick).toHaveBeenCalledWith({ regionId: shapeless?.id, bandIds: shapeless?.band_ids });
  });

  it('says the page is unpinned and draws nothing when the page carries no pin', async () => {
    render(<RegionViewPanel lens={BAND_LENS} />);
    expect((await screen.findByRole('alert')).textContent).toBe(GATE_NOTICES.unpinned);
  });

  it.each([
    ['cannot be fetched', { [ANATOMY_INDEX_PATH]: { status: 503 } }, 'unavailable'],
    ['fails its checks', { [ANATOMY_INDEX_PATH]: '{"schema_version":"0"}' }, 'invalid'],
  ] as const)('says the list is unchanged and shows no view when the atlas data %s', async (_case, overrides, kind) => {
    fetchLog = serveSite(overrides);
    const { container } = render(<RegionViewPanel lens={BAND_LENS} />);
    const alert = await screen.findByRole('alert');
    expect(alert.getAttribute('data-failure')).toBe(kind);
    expect(alert.textContent).toContain('the list on this page is unchanged');
    expect(container.querySelector('.atlas-viewport')).toBeNull();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('links its two stylesheets from this site once, however many views the page holds', async () => {
    writePin();
    render(<><RegionViewPanel lens={BAND_LENS} /><RegionViewPanel lens={BAND_LENS} /></>);
    await screen.findAllByRole('alert');
    const links = [...document.head.querySelectorAll('link[data-atlas-view-styles]')].map((link) => link.getAttribute('href') ?? '');
    expect(links).toEqual(['/_astro/atlas-scene.css', '/_astro/atlas-region-mount.css']);
  });

  it('takes focus when it appears, so the keyboard is not left on a button that is gone', async () => {
    writePin();
    const { container } = render(<RegionViewPanel lens={BAND_LENS} />);
    await screen.findByRole('alert');
    expect(document.activeElement).toBe(container.querySelector('.atlas-region-mount'));
  });
});
