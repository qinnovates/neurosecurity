// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ANATOMY_INDEX_PATH } from '@/lib/anatomy/anatomy-index-types';
import { isLimitId } from '@/lib/anatomy/limits-copy';
import { loadRealModel } from '@/lib/atlas-explorer/__tests__/explorer-fixtures';
import type { AtlasCanvasProps } from '../AtlasCanvas';
import { INITIAL_EXPLORER_STATE } from '../atlas-state';
import AtlasViewport, { type AtlasViewportProps } from '../AtlasViewport';
import { loadAnatomyBundle } from '../load-anatomy-data';
import OpenViewport, { type OpenViewportProps } from '../OpenViewport';
import { INDEX_PIN_ATTRIBUTE } from '../read-index-pin';
import RegionViewMount from '../RegionViewMount';
import RegionViewPanel, { type RegionViewPanelProps } from '../RegionViewPanel';
import { GATE_NOTICES } from '../viewport-gate';
import { buildServedFiles, type ServedFile } from './explorer-test-server';

// The test runner does not build stylesheets, so the two addresses the build would give are stood in for.
vi.mock('../atlas-scene.css?url', () => ({ default: '/_astro/atlas-scene.css' }));
vi.mock('../atlas-region-mount.css?url', () => ({ default: '/_astro/atlas-region-mount.css' }));

const TEST_TIMEOUT_MS = 20_000;
vi.setConfig({ testTimeout: TEST_TIMEOUT_MS });

const model = loadRealModel();
const bundle = loadAnatomyBundle();
const ASSET_ROOT = 'src/site/atlas-assets';
const assetBytes = new Map(model.index.assets.map((asset) => [`/atlas-assets/${asset.path}`, new Uint8Array(fs.readFileSync(path.join(ASSET_ROOT, asset.path)))]));
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

/** Serves the site's data files and geometry, or whatever a test puts in their place. */
function serve(overrides: Record<string, ServedFile> = {}): void {
  const files = { ...buildServedFiles(), ...overrides };
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    fetchLog.push(String(input));
    const bytes = assetBytes.get(String(input));
    if (bytes !== undefined) return new Response(bytes as BodyInit);
    const served = files[String(input)] ?? { status: 404 };
    return typeof served === 'string' ? new Response(served) : new Response('', { status: served.status });
  }));
}

function writePin(): void {
  const holder = document.createElement('div');
  holder.hidden = true;
  holder.setAttribute(INDEX_PIN_ATTRIBUTE, JSON.stringify(bundle.indexPin));
  document.body.append(holder);
}

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
  serve();
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

  it('draws without animation when the visitor prefers less motion', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('prefers-reduced-motion'), addEventListener: () => undefined, removeEventListener: () => undefined }));
    expect((await openViewport()).prefersLessMotion).toBe(true);
  });
});

describe('the visitor\'s selection in the picture', () => {
  it('brackets each chosen group and changes no fill, colour or step of any shape', async () => {
    const plain = await openViewport();
    const plainShapes = plain.shapes.map((shape) => ({ ...shape }));
    cleanup();
    canvasProps = null;
    const groups = [[drawn[0].id], [drawn[1].id, drawn[2].id]];
    const chosen = await openViewport({ selectedRegionGroups: groups });
    expect(chosen.shapes).toEqual(plainShapes);
    expect(chosen.bracketGroups).toEqual([drawn[0].structure_keys, [...new Set([...drawn[1].structure_keys, ...drawn[2].structure_keys])]]);
    expect([...chosen.selectedKeys].sort()).toEqual([...new Set(groups.flat().flatMap((regionId) => model.regionsById.get(regionId)?.structure_keys ?? []))].sort());
    expect(plain.bracketGroups).toEqual([]);
  });

  it('draws no mark for a region that has no shape, and none for an id the index does not hold', async () => {
    const chosen = await openViewport({ selectedRegionGroups: [[shapeless?.id ?? ''], ['not-a-region']] });
    expect(chosen.bracketGroups).toEqual([]);
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

  it('says so and keeps the page when the view\'s script does not arrive, and can be tried again', async () => {
    const loadPanel = vi.fn<() => Promise<{ default: typeof Panel }>>().mockRejectedValueOnce(new Error('chunk failed')).mockResolvedValue({ default: Panel });
    const { container } = render(<RegionViewMount lens={BAND_LENS} loadPanel={loadPanel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show the 3D view' }));
    expect((await screen.findByRole('alert')).textContent).toBe('The 3D view could not be loaded. The list on this page is unchanged and has everything the view would show.');
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
    serve(overrides);
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
