// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { webcrypto } from 'node:crypto';
import { useImperativeHandle } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { isLimitId, matchesLimitTemplate, type LimitId } from '@/lib/anatomy/limits-copy';
import { loadRealModel } from '@/lib/atlas-explorer/__tests__/explorer-fixtures';
import { resolvePick } from '@/lib/atlas-explorer/resolve-pick';
import type { AtlasCanvasProps } from '../AtlasCanvas';
import AtlasRegionView from '../AtlasRegionView';
import { INITIAL_EXPLORER_STATE } from '../atlas-state';
import AtlasViewport, { type AtlasViewportProps } from '../AtlasViewport';
import OpenViewport, { type OpenViewportProps } from '../OpenViewport';
import { GATE_NOTICES } from '../viewport-gate';

const TEST_TIMEOUT_MS = 20_000;
vi.setConfig({ testTimeout: TEST_TIMEOUT_MS });

const model = loadRealModel();
const ASSET_ROOT = 'src/site/atlas-assets';
/** The geometry files the view fetches when opened with the layers that are on at the start. */
const DEFAULT_FILE_COUNT = 5;
const assetUrl = (assetPath: string): string => `/atlas-assets/${assetPath}`;
const realBytes = new Map(model.index.assets.map((asset) => [assetUrl(asset.path), new Uint8Array(fs.readFileSync(path.join(ASSET_ROOT, asset.path)))]));
const assetOf = (layer: string) => model.index.assets.find((asset) => asset.layer === layer) ?? model.index.assets[0];
const ownShapeKey = model.index.structures.find((structure) => resolvePick(model, structure.key)?.selectedRegionId !== null && structure.nodes.length > 0)?.key ?? '';
const sharedShapeKey = model.index.structures.find((structure) => (resolvePick(model, structure.key)?.regions.length ?? 0) > 1 && structure.nodes.length > 0)?.key ?? '';
const unownedShapeKey = model.index.structures.find((structure) => structure.owners.length === 0 && structure.nodes.length > 0)?.key ?? '';

/** What the stand-in canvas was last given, and what its buttons asked of it. */
let canvasProps: AtlasCanvasProps | null = null;
let commandLog: string[] = [];
let fetchLog: string[] = [];
const onSelectRegion = vi.fn();

function CanvasStandIn(props: AtlasCanvasProps) {
  canvasProps = props;
  useImperativeHandle(props.commands, () => ({
    setView: (viewId) => { commandLog.push(`view:${viewId}`); },
    zoom: (direction) => { commandLog.push(`zoom:${direction}`); },
    turn: (direction) => { commandLog.push(`turn:${direction}`); },
    tilt: (direction) => { commandLog.push(`tilt:${direction}`); },
  }), []);
  return <div data-canvas="stand-in" role="img" aria-label={props.description} />;
}
const loadCanvas = vi.fn(async () => ({ default: CanvasStandIn }));
const loadOpenView = vi.fn(async () => ({ default: (props: OpenViewportProps) => <OpenViewport {...props} loadCanvas={loadCanvas} /> }));

function serveAssets(overrides: Record<string, Uint8Array | number> = {}): void {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    fetchLog.push(String(input));
    const served = overrides[String(input)] ?? realBytes.get(String(input)) ?? 404;
    return typeof served === 'number' ? new Response('', { status: served }) : new Response(served as BodyInit);
  }));
}

function renderViewport(props: Partial<AtlasViewportProps> = {}) {
  return render(
    <AtlasViewport
      model={model} lens={{ kind: 'band' }} layers={INITIAL_EXPLORER_STATE.layers} selectedRegionId={null} isIndexPinned onSelectRegion={onSelectRegion}
      probe={() => true} loadOpenView={loadOpenView} {...props}
    />,
  );
}

async function openViewport(props: Partial<AtlasViewportProps> = {}): Promise<HTMLElement> {
  const { container } = renderViewport(props);
  fireEvent.click(screen.getByRole('button', { name: 'Show the 3D view' }));
  await waitFor(() => {
    expect(container.querySelector('[data-asset-status]')).not.toBeNull();
    expect(container.querySelectorAll('[data-asset-status="loading"]')).toHaveLength(0);
  });
  return container;
}

beforeEach(() => {
  canvasProps = null;
  commandLog = [];
  fetchLog = [];
  onSelectRegion.mockClear();
  loadCanvas.mockClear();
  loadOpenView.mockClear();
  vi.stubGlobal('crypto', webcrypto);
  serveAssets();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('AtlasViewport: the gate', () => {
  it('is one button and a sentence until asked: nothing 3D is loaded, probed or fetched', () => {
    const probe = vi.fn(() => true);
    const { container } = renderViewport({ probe });
    expect(within(container).getAllByRole('button').map((button) => button.textContent)).toEqual(['Show the 3D view']);
    expect(container.textContent).toMatch(/It fetches about \d\.\d MB of shapes, and nothing until you ask\./);
    expect(probe).not.toHaveBeenCalled();
    expect(loadOpenView).not.toHaveBeenCalled();
    expect(loadCanvas).not.toHaveBeenCalled();
    expect(fetchLog).toEqual([]);
  });

  it.each([
    ['the browser gives no WebGL context', { probe: () => false }, 'no_webgl'],
    ['the page is not pinned to its index', { isIndexPinned: false }, 'unpinned'],
  ] as const)('says why and loads nothing 3D when %s', async (_case, props, gate) => {
    const { container } = renderViewport(props);
    fireEvent.click(screen.getByRole('button', { name: 'Show the 3D view' }));
    expect((await screen.findByRole('alert')).textContent).toBe(GATE_NOTICES[gate]);
    expect(container.querySelector('.atlas-viewport')?.getAttribute('data-gate')).toBe(gate);
    expect(loadOpenView).not.toHaveBeenCalled();
    expect(loadCanvas).not.toHaveBeenCalled();
    expect(fetchLog).toEqual([]);
  });

  it('draws nothing where the browser offers no digest, and does not call that a mismatch', async () => {
    vi.stubGlobal('crypto', {});
    const probe = vi.fn(() => true);
    renderViewport({ probe });
    fireEvent.click(screen.getByRole('button', { name: 'Show the 3D view' }));
    expect((await screen.findByRole('alert')).textContent).toBe(GATE_NOTICES.integrity_unavailable);
    expect(probe).not.toHaveBeenCalled();
    expect(loadOpenView).not.toHaveBeenCalled();
    expect(fetchLog).toEqual([]);
  });
});

describe('AtlasViewport: open', () => {
  it('fetches each file once, draws only checked shapes, and describes the picture in words', async () => {
    const container = await openViewport();
    // The head surface belongs to the devices layer, which is off until asked for: its file is not fetched.
    const defaultAssets = model.index.assets.filter((asset) => asset.layer !== 'devices');
    expect(defaultAssets).toHaveLength(DEFAULT_FILE_COUNT);
    expect(fetchLog.sort()).toEqual(defaultAssets.map((asset) => assetUrl(asset.path)).sort());
    expect([...container.querySelectorAll('[data-asset-status]')].map((item) => item.getAttribute('data-asset-status'))).toEqual(defaultAssets.map(() => 'ready'));
    expect(canvasProps?.shapes.length).toBeGreaterThan(150);
    expect(canvasProps?.shapes.every((shape) => shape.sizeMark === 'ring_only' || canvasProps?.nodesByShapeId.has(shape.id))).toBe(true);
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/^3D picture of an average brain outline with \d+ atlas shapes drawn inside it\. Band lens\. View: from behind and above\. Every fact it shows is in the region list\.$/);
  });

  it('fetches the head surface only when the electrode layout is turned on, and then draws the dots with their review state in the caption', async () => {
    const container = await openViewport({ layers: { ...INITIAL_EXPLORER_STATE.layers, devices: true } });
    const headSurface = assetOf('devices');
    expect(fetchLog.filter((url) => url === assetUrl(headSurface.path))).toHaveLength(1);
    expect(fetchLog).toHaveLength(DEFAULT_FILE_COUNT + 1);
    expect(canvasProps?.devices?.electrodes).toHaveLength(21);
    expect(canvasProps?.shapes.filter((shape) => shape.layer === 'devices')).toHaveLength(1);
    const deviceCaption = container.querySelector('[data-viewport-caption] [data-device-caption]') as HTMLElement;
    expect(deviceCaption.textContent).toContain('EEG electrode layout: 21 positions.');
    expect(deviceCaption.querySelector('[data-ai-drafted="true"]')?.textContent).toBe('AI-drafted, unreviewed');
    expect([...deviceCaption.querySelectorAll('[data-limit-id]')].map((note) => note.getAttribute('data-limit-id'))).toEqual(['device_electrodes', 'device_head_surface']);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('EEG electrode layout: 21 positions. Each dot is named in the electrode layout panel below the picture.');
  });

  it('draws no dot while the head surface they sit on is missing, and none with the layer off', async () => {
    await openViewport();
    expect(canvasProps?.devices).toBeNull();
    cleanup();
    serveAssets({ [assetUrl(assetOf('devices').path)]: 404 });
    const container = await openViewport({ layers: { ...INITIAL_EXPLORER_STATE.layers, devices: true } });
    expect(canvasProps?.devices).toBeNull();
    expect(container.querySelector('[data-device-caption]')).toBeNull();
  });

  it('passes an electrode pick on as an electrode and selects no region', async () => {
    const onPickElectrode = vi.fn();
    await openViewport({ layers: { ...INITIAL_EXPLORER_STATE.layers, devices: true }, onPickElectrode });
    act(() => canvasProps?.onPickElectrode('Cz'));
    expect(onPickElectrode).toHaveBeenCalledWith('Cz');
    expect(onSelectRegion).not.toHaveBeenCalled();
  });

  it('says what the order of a threat model\'s steps means inside the picture, and names the step, while steps are shown', async () => {
    const [technique] = model.index.techniques;
    const step = { position: 2, techniqueId: technique.id, techniqueName: technique.name, action: 'Fixture action', evidenceLabel: null, stageIds: [], litRegions: [] };
    const container = await openViewport({ chain: { chainId: 'CHAIN-FIX-001', chainName: 'Fixture chain', stepCount: 5, steps: [step], isWhole: false } });
    const caption = container.querySelector('[data-viewport-caption]') as HTMLElement;
    expect(caption.querySelector('[data-limit-id="chain_order"]')?.textContent).toBe('The steps follow the order of this threat model, one after another. Nothing here shows a signal moving through the brain.');
    expect(caption.textContent).toContain(`Threat model CHAIN-FIX-001, Fixture chain: step 2 of 5, ${technique.id}, ${technique.name}.`);
    expect(canvasProps?.shapes.every((shape) => Array.isArray(shape.stepNumbers))).toBe(true);
  });

  it('keeps the caption inside the picture, with the mark, the lens limit and a position sentence per layer', async () => {
    const container = await openViewport({ lens: { kind: 'niss' } });
    const caption = container.querySelector('[data-viewport-stage] [data-viewport-caption]') as HTMLElement;
    expect(caption.querySelector('[data-ai-drafted="true"]')?.textContent).toBe('AI-drafted, unreviewed');
    expect(caption.textContent).toContain('NISS severity lens.');
    const captionLimitIds = [...caption.querySelectorAll('[data-limit-id]')].map((note) => note.getAttribute('data-limit-id'));
    expect(captionLimitIds.slice(0, 2)).toEqual(['lens_niss', 'whole_scene']);
    expect(captionLimitIds.slice(2).filter((id) => id?.startsWith('position_')).length).toBe(3);
    expect(captionLimitIds).toContain('mirrored_scene');
    expect(caption.querySelector('[data-limit-id="mirrored_scene"]')?.textContent).toMatch(/^The Allen .+ shapes were drawn on one side of the brain and mirrored/);
    expect(caption.querySelector('a')?.getAttribute('href')).toBe('/atlas/attribution/');
    const notes = [...container.querySelectorAll<HTMLElement>('[data-limit-id]')];
    expect(notes.length).toBeGreaterThan(6);
    expect(notes.filter((note) => !isLimitId(note.dataset.limitId ?? '') || !matchesLimitTemplate(note.dataset.limitId as LimitId, note.textContent ?? ''))).toEqual([]);
  });

  it('drops a layer the visitor turns off, from the picture and from the caption', async () => {
    const container = await openViewport({ layers: { ...INITIAL_EXPLORER_STATE.layers, cortical: false, deep: false } });
    expect(new Set(canvasProps?.shapes.map((shape) => shape.layer))).toEqual(new Set(['outline']));
    expect(container.querySelectorAll('[data-asset-status]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-viewport-caption] [data-limit-id^="position_"]')).toHaveLength(1);
    expect(fetchLog).toEqual([assetUrl(assetOf('outline').path)]);
  });

  it('selects a region when the picked shape is one region\'s own, and outlines that region\'s shapes', async () => {
    const container = await openViewport();
    const regionId = resolvePick(model, ownShapeKey)?.selectedRegionId ?? '';
    canvasProps?.onPick(ownShapeKey);
    await waitFor(() => expect(onSelectRegion).toHaveBeenCalledWith(regionId));
    expect(container.querySelector('[data-picked-key]')?.getAttribute('data-picked-key')).toBe(ownShapeKey);
    await waitFor(() => expect(canvasProps?.selectedKeys.has(ownShapeKey)).toBe(true));
  });

  it('selects the shape, not a region, when the shape holds several regions or none', async () => {
    const container = await openViewport();
    canvasProps?.onPick(sharedShapeKey);
    await waitFor(() => expect(container.querySelector('[data-limit-id="picked_shape_shared"]')).not.toBeNull());
    expect(container.querySelector('[data-limit-id="picked_shape_larger"]')).toBeNull();
    expect(onSelectRegion).not.toHaveBeenCalled();
    const regionButtons = within(container.querySelector('[data-picked-key]') as HTMLElement).getAllByRole('button').filter((button) => button.className === 'atlas-chip');
    expect(regionButtons.length).toBeGreaterThan(1);
    fireEvent.click(regionButtons[0]);
    expect(onSelectRegion).toHaveBeenCalledTimes(1);
    canvasProps?.onPick(unownedShapeKey);
    await waitFor(() => expect(container.querySelector('[data-limit-id="picked_shape_unowned"]')).not.toBeNull());
    canvasProps?.onPick(null);
    await waitFor(() => expect(container.querySelector('[data-picked-key]')).toBeNull());
  });

  it('follows a selection made in the list: its shapes are outlined and the camera is given its place', async () => {
    const regionId = resolvePick(model, ownShapeKey)?.selectedRegionId ?? '';
    await openViewport({ selectedRegionId: regionId });
    expect(model.regionsById.get(regionId)?.structure_keys.every((key) => canvasProps?.selectedKeys.has(key))).toBe(true);
    expect(canvasProps?.focusMm?.every((value) => Number.isFinite(value))).toBe(true);
  });

  it('names the selection in the picture and beside it, and offers the way to its details where the page has them', async () => {
    const regionId = resolvePick(model, ownShapeKey)?.selectedRegionId ?? '';
    const regionName = model.regionsById.get(regionId)?.name ?? '';
    const onShowDetails = vi.fn();
    const container = await openViewport({ selectedRegionId: regionId, onShowDetails });
    expect(canvasProps?.selectionLabel).toBe(regionName);
    const row = container.querySelector('[data-picture-selected]');
    expect(row?.getAttribute('data-picture-selected')).toBe(regionName);
    expect(container.querySelector('figure')?.contains(row)).toBe(true);
    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'See its details' }));
    expect(onShowDetails).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/corner marks with a name above them: selected/)).not.toBeNull();
  });

  it('names a picked shape above its brackets when the pick selects no region, and says nothing beside the picture', async () => {
    const container = await openViewport();
    expect(container.querySelector('[data-picture-selected]')).toBeNull();
    canvasProps?.onPick(sharedShapeKey);
    await waitFor(() => expect(canvasProps?.selectionLabel).toBe(resolvePick(model, sharedShapeKey)?.label));
    expect(container.querySelector('[data-picture-selected]')).toBeNull();
    expect(container.querySelector('button[name="See its details"]')).toBeNull();
  });

  it('moves the view only through real buttons, and marks which named view is current', async () => {
    await openViewport();
    fireEvent.click(screen.getByRole('button', { name: 'Left side' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Turn right' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tilt up' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bottom' }));
    expect(commandLog).toEqual(['view:left', 'zoom:in', 'turn:right', 'tilt:up', 'view:bottom']);
    fireEvent.click(screen.getByRole('button', { name: 'Turn right' }));
    expect(screen.getByRole('button', { name: 'Left side' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('turned by hand');
    expect(screen.getByRole('button', { name: 'Bottom' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('img').hasAttribute('tabindex')).toBe(false);
  });

  it('cuts through everything along an axis, says it is not a scan, and lists what the cut passes through', async () => {
    const container = await openViewport();
    expect(canvasProps?.slice).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cut through the brain' }));
    const cutCaption = container.querySelector('[data-viewport-caption]') as HTMLElement;
    expect(cutCaption.querySelector('[data-limit-id="slice_view"]')?.textContent).toBe('The cut shows the average template and the atlas shapes, not a scan of anyone.');
    expect(cutCaption.querySelector('[data-limit-id="slice_position"]')?.textContent).toMatch(/^Cut at -?\d+ mm, back to front\. Everything beyond the cut is hidden\.$/);
    expect(canvasProps?.slice).toMatchObject({ axis: 'back_front' });
    const start = canvasProps?.slice?.positionMm ?? 0;
    fireEvent.click(screen.getByRole('button', { name: 'Move the cut forward' }));
    expect(canvasProps?.slice?.positionMm).toBe(start + 5);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '9999' } });
    expect(canvasProps?.slice?.positionMm).toBeLessThan(120);
    fireEvent.click(screen.getByRole('button', { name: 'Left to right' }));
    expect(canvasProps?.slice?.axis).toBe('left_right');
    expect(container.textContent).toMatch(/It passes through \d+ shapes\./);
    fireEvent.click(screen.getByRole('button', { name: 'Cut through the brain' }));
    expect(canvasProps?.slice).toBeNull();
  });

  it('hides again on request and starts fresh the next time', async () => {
    const container = await openViewport();
    fireEvent.click(screen.getByRole('button', { name: 'Hide the 3D view' }));
    expect(container.querySelector('[data-canvas]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Show the 3D view' })).toBeTruthy();
  });
});

describe('AtlasViewport: failures', () => {
  it('says the browser stopped the view when the context is lost, and offers to start again', async () => {
    const container = await openViewport();
    canvasProps?.onContextLost();
    expect((await screen.findByRole('alert')).textContent).toBe(GATE_NOTICES.context_lost);
    expect(container.querySelector('[data-canvas]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Start the 3D view again' }));
    await waitFor(() => expect(container.querySelector('[data-canvas]')).not.toBeNull());
  });

  it('falls back to the notice when the canvas finds no WebGL after all', async () => {
    await openViewport();
    canvasProps?.onUnavailable();
    expect((await screen.findByRole('alert')).textContent).toBe(GATE_NOTICES.no_webgl);
  });

  it('draws the other layers when one file is missing, says which is not drawn, and tries again on request', async () => {
    const missing = assetOf('cortical');
    serveAssets({ [assetUrl(missing.path)]: 404 });
    const container = await openViewport();
    const status = container.querySelector(`[data-asset-id="${missing.id}"]`);
    expect(status?.getAttribute('data-asset-status')).toBe('failed');
    expect(status?.textContent).toContain('Not drawn: the file could not be fetched.');
    expect(canvasProps?.shapes.some((shape) => shape.layer === 'cortical')).toBe(false);
    expect(canvasProps?.shapes.some((shape) => shape.layer === 'deep')).toBe(true);
    expect(container.querySelectorAll('[data-viewport-caption] [data-limit-id^="position_"]')).toHaveLength(2);
    serveAssets();
    fireEvent.click(screen.getByRole('button', { name: 'Try the files again' }));
    await waitFor(() => expect(container.querySelector(`[data-asset-id="${missing.id}"]`)?.getAttribute('data-asset-status')).toBe('ready'));
    expect(canvasProps?.shapes.some((shape) => shape.layer === 'cortical')).toBe(true);
  });

  it.each([
    ['changed in one byte', (bytes: Uint8Array) => { const copy = new Uint8Array(bytes); copy[copy.length - 1] ^= 1; return copy; }],
    ['of a different length', (bytes: Uint8Array) => bytes.subarray(0, bytes.length - 8)],
    ['from another build (a different, valid file)', () => realBytes.get(assetUrl(assetOf('outline').path)) as Uint8Array],
  ])('refuses a file %s, after one more fetch past the cache, and never draws it', async (_case, corrupt) => {
    const target = assetOf('deep');
    serveAssets({ [assetUrl(target.path)]: corrupt(realBytes.get(assetUrl(target.path)) as Uint8Array) });
    const container = await openViewport();
    const status = container.querySelector(`[data-asset-id="${target.id}"]`);
    expect(status?.textContent).toContain('Not drawn: the file is not the one this page was built with. Reload the page.');
    expect(fetchLog.filter((url) => url === assetUrl(target.path))).toHaveLength(2);
    expect(canvasProps?.shapes.some((shape) => shape.assetId === target.id)).toBe(false);
    expect(canvasProps?.shapes.some((shape) => shape.layer === 'outline')).toBe(true);
  });

  it('shows each file as loading while a slow network holds it, and draws nothing of it yet', async () => {
    const release: Array<() => void> = [];
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => new Promise<Response>((resolve) => { release.push(() => resolve(new Response(realBytes.get(String(input)) as BodyInit))); })));
    const { container } = renderViewport();
    fireEvent.click(screen.getByRole('button', { name: 'Show the 3D view' }));
    await waitFor(() => expect(container.querySelector('[data-asset-status="loading"]')?.textContent).toContain('Loading…'));
    expect(canvasProps?.shapes ?? []).toEqual([]);
    release[0]();
    await waitFor(() => expect(container.querySelector('[data-asset-status="ready"]')).not.toBeNull());
    expect(new Set(canvasProps?.shapes.map((shape) => shape.layer))).toEqual(new Set(['outline']));
  });
});

describe('AtlasRegionView', () => {
  it('draws what a lens shows and takes no list of regions to highlight', async () => {
    const view = <AtlasRegionView model={model} lens={{ kind: 'niss' }} selectedRegionId={null} isIndexPinned onRegionSelect={onSelectRegion} />;
    // @ts-expect-error a list of region ids is not a prop: what is filled is always worked out from the lens.
    const refused = <AtlasRegionView model={model} lens={{ kind: 'band' }} selectedRegionId={null} isIndexPinned onRegionSelect={onSelectRegion} highlightedRegionIds={['pfc']} />;
    expect(refused.props.lens).toEqual({ kind: 'band' });
    const { container } = render(view);
    expect(within(container).getByRole('button', { name: 'Show the 3D view' })).toBeTruthy();
    expect(container.querySelector('.atlas-viewport')?.getAttribute('data-gate')).toBe('closed');
  });
});
