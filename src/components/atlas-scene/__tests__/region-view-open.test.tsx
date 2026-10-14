// @vitest-environment jsdom
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LIMIT_TEMPLATES } from '@/lib/anatomy/limits-copy';
import { MOUNT_COPY } from '@/lib/anatomy/mount-copy';
import { NAMED_REGIONS_HEADING } from '@/lib/atlas-explorer/region-view-notes';
import { classifyTechniqueColouring, listNamedRegionIds } from '@/lib/atlas-explorer/technique-colouring';
import type { AtlasCanvasProps } from '../AtlasCanvas';
import { readUncolouredLimit } from '../build-technique-colouring';
import RegionViewMount, { BAND_LENS, type RegionViewMountProps } from '../RegionViewMount';
import { model, serveSite, writePin } from './region-view-test-kit';

/**
 * The mounted view from the button to the open picture, as a page has it: the real panel, gate, open view and
 * notes. Only two things are stood in for, because jsdom has neither: the WebGL probe and the canvas.
 */
const canvas = vi.hoisted(() => ({ props: null as AtlasCanvasProps | null }));
vi.mock('../AtlasCanvas', async () => {
  const { createElement } = await import('react');
  return { default: (props: AtlasCanvasProps) => { canvas.props = props; return createElement('div', { 'data-canvas': 'stand-in', role: 'img', 'aria-label': props.description }); } };
});
vi.mock('../viewport-gate', async (importOriginal) => ({ ...(await importOriginal<typeof import('../viewport-gate')>()), probeWebGL: () => true }));
vi.mock('../atlas-scene.css?url', () => ({ default: '/_astro/atlas-scene.css' }));
vi.mock('../atlas-region-mount.css?url', () => ({ default: '/_astro/atlas-region-mount.css' }));

const TEST_TIMEOUT_MS = 20_000;
vi.setConfig({ testTimeout: TEST_TIMEOUT_MS });

const REVIEW_MARK = 'AI-drafted, unreviewed';
const GROUP_NAME = '3D view and what it shows';
const techniqueIds = model.index.techniques.map((technique) => technique.id);
const findTechnique = (colouring: ReturnType<typeof classifyTechniqueColouring>): string => techniqueIds.find((techniqueId) => classifyTechniqueColouring(model, techniqueId) === colouring) ?? '';
const LIT_TECHNIQUE = findTechnique('coloured');
/** Names one region, which lies inside a larger shape: the technique the verifier saw draw an all-grey brain. */
const CONTAINED_TECHNIQUE = 'QIF-T0034';
const UNNAMED_TECHNIQUE = findTechnique('none_named');
const drawnRegion = model.regions.find((region) => region.geometry.state === 'drawn');
const onRegionPick = (): void => undefined;
/** The mount as a technique page builds it: the lens, and the sentence the page was built with. */
const asTechniquePage = (techniqueId: string): RegionViewMountProps => ({ lens: { kind: 'technique', techniqueId }, nothingColoured: readUncolouredLimit(techniqueId), onRegionPick });

const group = (): HTMLElement => screen.getByRole('group', { name: GROUP_NAME });
const hints = (): string[] => [...group().querySelectorAll('[data-view-hint="choose-in-list"]')].map((hint) => hint.textContent ?? '');
const limitTexts = (id: string): string[] => [...group().querySelectorAll(`[data-limit-id="${id}"]`)].map((note) => note.textContent ?? '');
const everyLimitText = (): string[] => [...group().querySelectorAll('[data-limit-id]')].map((note) => note.textContent ?? '');
const reviewMarks = (): string[] => [...group().querySelectorAll('[data-ai-drafted="true"]')].map((mark) => mark.textContent ?? '');
const countOf = (texts: readonly string[], text: string): number => texts.filter((candidate) => candidate === text).length;

/** Renders the mount as a page does, presses its button, and waits for the picture with every shape file in. */
async function openMount(props: RegionViewMountProps): Promise<AtlasCanvasProps> {
  writePin();
  const { container } = render(<RegionViewMount {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Show the 3D view' }));
  await waitFor(() => {
    expect(container.querySelector('[data-asset-status]')).not.toBeNull();
    expect(container.querySelectorAll('[data-asset-status="loading"]')).toHaveLength(0);
    expect(canvas.props).not.toBeNull();
    expect(limitTexts('outline_shape')).toHaveLength(1);
  });
  return canvas.props as AtlasCanvasProps;
}

beforeEach(() => {
  canvas.props = null;
  vi.stubGlobal('crypto', webcrypto);
  serveSite();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.body.replaceChildren(); document.head.querySelectorAll('link').forEach((link) => link.remove()); });

describe('one copy of each sentence and of the review mark, per mount', () => {
  it('finds a technique of each kind and a drawn region in the real data, so no case below is empty', () => {
    expect([LIT_TECHNIQUE, UNNAMED_TECHNIQUE, drawnRegion?.id ?? ''].every((id) => id.length > 0)).toBe(true);
    expect(classifyTechniqueColouring(model, CONTAINED_TECHNIQUE)).toBe('named_none_coloured');
  });

  it('shows the lens limit, the outline sentence and the review mark once each while the picture is open, in its caption', async () => {
    await openMount({ lens: BAND_LENS, selectedRegionIds: [drawnRegion?.id ?? ''] });
    expect(limitTexts('lens_band')).toHaveLength(1);
    expect(limitTexts('outline_shape')).toHaveLength(1);
    expect(reviewMarks()).toEqual([REVIEW_MARK]);
    // Nearest the picture: the lens limit and the mark are inside the figure's own caption.
    const caption = group().querySelector('[data-viewport-caption="true"]');
    expect(caption?.querySelector('[data-limit-id="lens_band"]')).not.toBeNull();
    expect(caption?.querySelector('[data-ai-drafted="true"]')).not.toBeNull();
    expect(group().querySelector('[data-view-notes="true"] [data-ai-drafted="true"]')).toBeNull();
    // And no sentence at all stands twice in the group.
    expect(new Set(everyLimitText()).size).toBe(everyLimitText().length);
    expect(limitTexts('view_chosen_regions')).toHaveLength(1);
    expect(limitTexts('region_matching')).toHaveLength(1);
  });

  it('still shows each once after "Hide", now beside the button, and puts focus on "Show the 3D view"', async () => {
    await openMount({ lens: BAND_LENS, selectedRegionIds: [drawnRegion?.id ?? ''] });
    fireEvent.click(screen.getByRole('button', { name: 'Hide the 3D view' }));
    const show = screen.getByRole('button', { name: 'Show the 3D view' });
    expect(document.activeElement).toBe(show);
    expect(group().querySelector('[data-viewport-caption="true"]')).toBeNull();
    expect(limitTexts('lens_band')).toHaveLength(1);
    expect(limitTexts('outline_shape')).toHaveLength(1);
    expect(reviewMarks()).toEqual([REVIEW_MARK]);
    expect(new Set(everyLimitText()).size).toBe(everyLimitText().length);
  });
});

describe('a technique page: what the links name, and whether anything is coloured', () => {
  it('lit: fills a shape, lists the named regions under "name", and says nothing about an empty picture', async () => {
    const named = listNamedRegionIds(model.techniquesById.get(LIT_TECHNIQUE));
    const shown = await openMount(asTechniquePage(LIT_TECHNIQUE));
    expect(readUncolouredLimit(LIT_TECHNIQUE)).toBeNull();
    expect(shown.shapes.some((shape) => shape.fill === 'solid')).toBe(true);
    expect(screen.getByRole('heading', { name: `${NAMED_REGIONS_HEADING} (${named.length})` })).toBeTruthy();
    expect(everyLimitText().filter((text) => text.startsWith('No region is coloured'))).toEqual([]);
    expect(hints()).toEqual([]);
    expect(reviewMarks()).toEqual([REVIEW_MARK]);
  });

  it('named but contained: fills nothing, and says so beside the button and then once in the caption, with the mark by the list', async () => {
    writePin();
    const { container, unmount } = render(<RegionViewMount {...asTechniquePage(CONTAINED_TECHNIQUE)} />);
    expect(screen.getByRole('button', { name: 'Show the 3D view' })).toBeTruthy();
    expect(container.querySelector('[data-mount-note="nothing-coloured"]')?.textContent).toBe('No region is coloured for this technique: its drafted links name no region that has a shape of its own in this atlas.');
    expect(container.querySelector('[data-mount-note="choose-in-list"]')).toBeNull();
    unmount();
    document.body.replaceChildren();

    const shown = await openMount(asTechniquePage(CONTAINED_TECHNIQUE));
    expect(shown.shapes.some((shape) => shape.fill === 'solid')).toBe(false);
    expect(screen.getByRole('heading', { name: `${NAMED_REGIONS_HEADING} (1)` })).toBeTruthy();
    expect(countOf(everyLimitText(), LIMIT_TEMPLATES.view_nothing_coloured_no_own_shape)).toBe(1);
    expect(group().querySelector('[data-viewport-caption="true"] [data-limit-id="view_nothing_coloured_no_own_shape"]')).not.toBeNull();
    expect(reviewMarks()).toEqual([REVIEW_MARK]);
    // With the picture hidden the sentence and the mark stand beside the list and the button, once.
    fireEvent.click(screen.getByRole('button', { name: 'Hide the 3D view' }));
    expect(countOf(everyLimitText(), LIMIT_TEMPLATES.view_nothing_coloured_no_own_shape)).toBe(1);
    expect([...group().querySelectorAll('[data-view-notes="true"] [data-ai-drafted="true"]')].map((mark) => mark.textContent)).toEqual([REVIEW_MARK]);
  });

  it('none: fills nothing, lists no region, says its links name no single region, and where to choose', async () => {
    writePin();
    const closed = render(<RegionViewMount {...asTechniquePage(UNNAMED_TECHNIQUE)} />);
    expect(closed.container.querySelector('[data-mount-note="nothing-coloured"]')?.textContent).toBe('No region is coloured for this technique: its drafted links name no single region.');
    expect(closed.container.querySelector('[data-mount-note="choose-in-list"]')?.textContent).toBe(MOUNT_COPY.choose_in_list);
    closed.unmount();
    document.body.replaceChildren();

    const shown = await openMount(asTechniquePage(UNNAMED_TECHNIQUE));
    expect(shown.shapes.some((shape) => shape.fill === 'solid')).toBe(false);
    expect(screen.queryByRole('heading', { name: new RegExp(`^${NAMED_REGIONS_HEADING}`) })).toBeNull();
    expect(countOf(everyLimitText(), LIMIT_TEMPLATES.view_nothing_coloured_none_named)).toBe(1);
    expect(hints()).toEqual([MOUNT_COPY.choose_in_list]);
    expect(group().querySelectorAll('.atlas-chip')).toHaveLength(0);
  });
});

describe('with nothing selected', () => {
  it('tells the visitor to choose in the page\'s list, on a page that has one, and stops once a band is chosen', async () => {
    await openMount({ lens: BAND_LENS, onRegionPick });
    expect(hints()).toEqual(['Choose a band or region in the list on this page to mark it in the picture.']);
    cleanup();
    document.body.replaceChildren();
    canvas.props = null;
    await openMount({ lens: BAND_LENS, selectedBandId: 'N7', onRegionPick });
    expect(hints()).toEqual([]);
    expect(group().querySelectorAll('.atlas-chip').length).toBeGreaterThan(0);
  });

  it('does not send the visitor to a list on a page that has none to choose in', async () => {
    await openMount({ lens: BAND_LENS });
    expect(hints()).toEqual([]);
  });
});
