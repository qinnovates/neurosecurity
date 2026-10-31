// @vitest-environment jsdom
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { HERO_COPY } from '@/lib/anatomy/hero-copy';
import { HERO_RISK_CAP, rankRegionRisks, techniquePagePath } from '@/lib/atlas-explorer/hero-risks';
import { buildRegionDetail } from '@/lib/atlas-explorer/region-detail';
import { resolvePick } from '@/lib/atlas-explorer/resolve-pick';
import type { AtlasCanvasProps } from '../AtlasCanvas';
import { buildRegionDeepLink } from '../atlas-deep-link';
import BrainHeroMount from '../BrainHeroMount';
import BrainHeroPanel, { type BrainHeroPanelProps } from '../BrainHeroPanel';
import { HERO_DEFAULT_LENS, HERO_LAYERS } from '../BrainHeroView';
import OpenViewport, { type OpenViewportProps } from '../OpenViewport';
import { GATE_NOTICES } from '../viewport-gate';
import { model, serveSite, writePin } from './region-view-test-kit';

// The test runner does not build stylesheets, so the addresses the build would give are stood in for.
vi.mock('../atlas-scene.css?url', () => ({ default: '/_astro/atlas-scene.css' }));
vi.mock('../brain-hero.css?url', () => ({ default: '/_astro/brain-hero.css' }));

const TEST_TIMEOUT_MS = 20_000;
vi.setConfig({ testTimeout: TEST_TIMEOUT_MS });

/** A region drawn by a shape of its own, so a pick on that shape selects it. */
const ownRegion = model.regions.find((region) => region.geometry.state === 'drawn' && region.structure_keys.some((key) => resolvePick(model, key)?.selectedRegionId === region.id));
if (ownRegion === undefined) throw new Error('The real index holds no region with a shape of its own.');
const ownShapeKey = ownRegion.structure_keys.find((key) => resolvePick(model, key)?.selectedRegionId === ownRegion.id) ?? '';
const assetUrl = (assetPath: string): string => `/atlas-assets/${assetPath}`;

let canvasProps: AtlasCanvasProps | null = null;
let fetchLog: string[] = [];
function CanvasStandIn(props: AtlasCanvasProps) {
  canvasProps = props;
  return <div data-canvas="stand-in" role="img" aria-label={props.description} />;
}
/** Forgets the last stand-in render, through a call so the type checker does not narrow the variable where a test reads it again. */
const resetCanvasProps = (): void => { canvasProps = null; };
const loadCanvas = vi.fn(async () => ({ default: CanvasStandIn }));
const loadOpenView = vi.fn(async () => ({ default: (props: OpenViewportProps) => <OpenViewport {...props} loadCanvas={loadCanvas} /> }));
const probe = vi.fn(() => true);
const loadPanel = vi.fn(async () => ({ default: (props: BrainHeroPanelProps) => <BrainHeroPanel {...props} probe={probe} loadOpenView={loadOpenView} /> }));

async function renderHero(): Promise<HTMLElement> {
  const { container } = render(<BrainHeroMount loadPanel={loadPanel} />);
  await waitFor(() => expect(container.querySelector('[data-brain-hero]')?.getAttribute('data-brain-hero')).toMatch(/^(open|fallback)$/));
  return container;
}

async function openHero(): Promise<HTMLElement> {
  const container = await renderHero();
  await waitFor(() => {
    expect(container.querySelector('[data-asset-status]')).not.toBeNull();
    expect(container.querySelectorAll('[data-asset-status="loading"]')).toHaveLength(0);
    expect(canvasProps).not.toBeNull();
  });
  return container;
}

beforeEach(() => {
  resetCanvasProps();
  loadCanvas.mockClear();
  loadOpenView.mockClear();
  loadPanel.mockClear();
  probe.mockReset();
  probe.mockReturnValue(true);
  vi.stubGlobal('crypto', webcrypto);
  fetchLog = serveSite();
  writePin();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.body.replaceChildren(); document.head.querySelectorAll('link').forEach((link) => link.remove()); });

describe('the brain hero: the way in', () => {
  it('asks for nothing: the chunk is fetched as the shell mounts, and the frame says it is loading until then', async () => {
    let release: () => void = () => undefined;
    const slowPanel = vi.fn(() => new Promise<{ default: typeof BrainHeroPanel }>((resolve) => { release = () => resolve({ default: BrainHeroPanel }); }));
    const { container } = render(<BrainHeroMount loadPanel={slowPanel} />);
    expect(slowPanel).toHaveBeenCalledTimes(1);
    expect(within(container).queryAllByRole('button')).toEqual([]);
    expect(screen.getByRole('status').textContent).toBe(HERO_COPY.loading);
    expect(container.querySelector('[data-brain-hero]')?.getAttribute('data-brain-hero')).toBe('loading');
    release();
    await waitFor(() => expect(container.querySelector('[data-brain-hero]')?.getAttribute('data-brain-hero')).not.toBe('loading'));
  });

  it('says so, in place, when the chunk does not arrive', async () => {
    render(<BrainHeroMount loadPanel={vi.fn(async () => { throw new Error('offline'); })} />);
    expect((await screen.findByRole('alert')).textContent).toBe(HERO_COPY.failed);
  });

  it('opens the 3D view without a second button, fetching the outline and cortex and not the deep shapes', async () => {
    const container = await openHero();
    expect(screen.queryByRole('button', { name: 'Show the 3D view' })).toBeNull();
    expect(loadOpenView).toHaveBeenCalledTimes(1);
    const fetchedGeometry = fetchLog.filter((url) => url.startsWith('/atlas-assets/'));
    const expected = model.index.assets.filter((asset) => HERO_LAYERS[asset.layer]).map((asset) => assetUrl(asset.path));
    expect(fetchedGeometry.sort()).toEqual(expected.sort());
    expect(HERO_LAYERS.deep).toBe(false);
    expect(new Set(canvasProps?.shapes.map((shape) => shape.layer))).toEqual(new Set(['outline', 'cortical']));
    // The view's own words stay in the picture: the caption, its sources link and the lens it colours by. Band first: every region holds a value under it.
    expect(container.querySelector('[data-viewport-caption]')?.textContent).toContain('Band lens.');
    expect(container.querySelector('[data-viewport-caption] a')?.getAttribute('href')).toBe('/atlas/attribution/');
    // The lens switch in the view's header, above the picture: two choices, the pressed one first, and the picture follows the choice.
    const lensSwitch = container.querySelector('[data-viewport-header] .brain-hero-lenses') as HTMLElement;
    expect(lensSwitch.compareDocumentPosition(container.querySelector('figure') as HTMLElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const lensButtons = within(lensSwitch).getAllByRole('button');
    expect(lensButtons.map((button) => [button.textContent, button.getAttribute('aria-pressed')])).toEqual([['Band', 'true'], ['NISS severity', 'false']]);
    act(() => { lensButtons[1].click(); });
    await waitFor(() => expect(container.querySelector('[data-viewport-caption]')?.textContent).toContain('NISS severity lens.'));
    expect(lensButtons[1].getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('[data-brain-hero]')?.getAttribute('data-hero-lens')).toBe('niss');
    // The picture carries the three moves as a hint until the first touch, and with nothing selected nothing is bracketed.
    expect(container.querySelector('[data-picture-hint]')?.textContent).toContain('Drag to turn');
    expect(canvasProps?.bracketGroups).toEqual([]);
    // The view's heading is kept for assistive technology and the keyboard proxy still moves the camera.
    expect(screen.getByRole('heading', { name: '3D view' })).not.toBeNull();
    expect(container.querySelector('[data-viewport-proxy]')).not.toBeNull();
    // Before a pick the card says what to do, and offers no way on yet.
    const card = container.querySelector('[data-hero-card]') as HTMLElement;
    expect(card.getAttribute('data-hero-card')).toBe('idle');
    expect(card.textContent).toContain(HERO_COPY.idle);
    expect(within(card).queryByRole('link')).toBeNull();
  });
});

describe('the brain hero: a pick and the way on', () => {
  it('names the picked region in the picture and in the card, with one link into the full atlas at that region', async () => {
    const container = await openHero();
    act(() => canvasProps?.onPick(ownShapeKey));
    const card = await waitFor(() => { const found = container.querySelector('[data-hero-card="selected"]'); expect(found).not.toBeNull(); return found as HTMLElement; });
    expect(card.getAttribute('data-hero-selected')).toBe(ownRegion.id);
    expect(within(card).getByRole('heading', { level: 3 }).textContent).toContain(ownRegion.name);
    // One primary action, into the full atlas at this region.
    const ctas = [...card.querySelectorAll<HTMLAnchorElement>('a.brain-hero-cta')];
    expect(ctas).toHaveLength(1);
    expect(ctas[0].textContent).toBe(HERO_COPY.see_details);
    // The way on carries the lens the visitor was looking through, so the explorer opens on the same picture.
    expect(ctas[0].getAttribute('href')).toBe(buildRegionDeepLink(ownRegion.id, HERO_DEFAULT_LENS));
    expect(ctas[0].getAttribute('href')).toBe(`/atlas/anatomy/?region=${ownRegion.id}&lens=band`);
    // The explorer has its own layout without the client router, so the link asks for a full page load.
    expect(ctas[0].hasAttribute('data-astro-reload')).toBe(true);
    act(() => { within(container.querySelector('.brain-hero-lenses') as HTMLElement).getAllByRole('button')[1].click(); });
    await waitFor(() => expect(card.querySelector('a.brain-hero-cta')?.getAttribute('href')).toBe(`/atlas/anatomy/?region=${ownRegion.id}&lens=niss`));
    // The dashboard: the region's risks, highest NISS step first and cut at the cap, from the same detail the inspector shows.
    const detail = buildRegionDetail(model, ownRegion.id);
    if (detail === null) throw new Error('The picked region is not in the index.');
    const { shown, hiddenCount } = rankRegionRisks(detail.linked, HERO_RISK_CAP);
    const risks = [...card.querySelectorAll('[data-hero-risk]')];
    expect(risks.map((risk) => risk.getAttribute('data-hero-risk'))).toEqual(shown.map((technique) => technique.id));
    expect(risks.length).toBeLessThanOrEqual(HERO_RISK_CAP);
    for (const technique of shown) {
      const risk = card.querySelector(`[data-hero-risk="${technique.id}"]`) as HTMLElement;
      const link = risk.querySelector('a');
      if (model.catalogTechniqueIds.has(technique.id)) expect(link?.getAttribute('href')).toBe(techniquePagePath(technique.id));
      else expect(link).toBeNull();
    }
    if (shown.length === 0) expect(card.textContent).toContain(HERO_COPY.risks_none);
    else expect(card.textContent).toContain(HERO_COPY.risks_note);
    if (hiddenCount > 0) expect(card.textContent).toContain(HERO_COPY.risks_more(hiddenCount));
    else expect(card.textContent).not.toContain('more in the full atlas');
    if (detail.nissStep !== null) expect(card.textContent).toContain(HERO_COPY.risk_step(detail.nissStep, detail.linked.length));
    // The devices whose records name the region, as the inspector lists them.
    const devices = [...card.querySelectorAll('[data-hero-device]')].map((chip) => chip.getAttribute('data-hero-device'));
    expect(devices).toEqual(detail.deviceIds);
    if (detail.deviceIds.length === 0) expect(card.textContent).toContain(HERO_COPY.devices_none);
    // Every link in the card is the one CTA or a technique's catalog page: the card offers no other way on.
    for (const link of card.querySelectorAll('a')) {
      expect(link.classList.contains('brain-hero-cta') || /^\/atlas\/tara\/[^/]+\/$/.test(link.getAttribute('href') ?? '')).toBe(true);
    }
    expect(card.textContent).toContain(HERO_COPY.selected_bands);
    // The picture names the selection too, and holds no second way on: the card's link is the one action.
    expect(container.querySelector('[data-picture-selected]')?.getAttribute('data-picture-selected')).toBe(ownRegion.name);
    expect(within(container.querySelector('figure') as HTMLElement).queryByRole('button', { name: 'See its details' })).toBeNull();
    expect(canvasProps?.selectedKeys.has(ownShapeKey)).toBe(true);
    expect(container.querySelector('[data-hero-card] [role="status"]')?.textContent).toBe(HERO_COPY.selected_announcement(ownRegion.name));
  });

  it('hands the renderer the visitor\'s motion preference, so the idle turn and the eased moves stop under reduced motion', async () => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)', media: query, addEventListener: () => undefined, removeEventListener: () => undefined })));
    await openHero();
    expect(canvasProps?.prefersLessMotion).toBe(true);
    cleanup();
    resetCanvasProps();
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined })));
    await openHero();
    expect(canvasProps?.prefersLessMotion).toBe(false);
  });
});

describe('the brain hero: when the view cannot open', () => {
  it('lists every region as a link into the full atlas where the browser cannot draw, and fetches no geometry', async () => {
    probe.mockReturnValue(false);
    const container = await renderHero();
    expect(container.querySelector('[data-brain-hero]')?.getAttribute('data-brain-hero')).toBe('fallback');
    expect(screen.getByRole('alert').textContent).toBe(GATE_NOTICES.no_webgl);
    const links = [...container.querySelectorAll<HTMLAnchorElement>('.brain-hero-regions a')];
    expect(links.map((link) => link.textContent)).toEqual(model.regions.map((region) => region.name));
    expect(links.map((link) => link.getAttribute('href'))).toEqual(model.regions.map((region) => buildRegionDeepLink(region.id)));
    expect(links.every((link) => link.hasAttribute('data-astro-reload'))).toBe(true);
    expect(loadOpenView).not.toHaveBeenCalled();
    expect(fetchLog.filter((url) => url.startsWith('/atlas-assets/'))).toEqual([]);
    expect(container.querySelector('[data-hero-card]')).toBeNull();
  });

  it('draws nothing on a page without the index pin, and says that rather than guessing', async () => {
    document.body.replaceChildren();
    probe.mockReturnValue(true);
    const container = await renderHero();
    expect(screen.getByRole('alert').textContent).toBe(GATE_NOTICES.unpinned);
    expect(container.querySelectorAll('.brain-hero-regions a').length).toBe(model.regions.length);
    expect(probe).not.toHaveBeenCalled();
    expect(loadOpenView).not.toHaveBeenCalled();
  });
});
