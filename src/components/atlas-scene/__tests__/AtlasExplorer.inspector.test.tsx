// @vitest-environment jsdom
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import registrar from '@shared/qtara-registrar.json';
import type { AnatomyIndex } from '@/lib/anatomy/anatomy-index-types';
import { ANATOMY_EVIDENCE_PATH, ANATOMY_INDEX_PATH } from '@/lib/anatomy/anatomy-index-types';
import { H01_CARD_PATH } from '@/lib/anatomy/parse-h01-card';
import { REGION_EVIDENCE_PATH, type RegionEvidence } from '@/lib/anatomy/region-evidence-types';
import { listLitLinks } from '@/lib/atlas-explorer/explorer-model';
import { loadRealModel } from '@/lib/atlas-explorer/__tests__/explorer-fixtures';
import AtlasExplorer from '../AtlasExplorer';
import { FETCH_TIMEOUT_MS } from '../fetch-atlas-json';
import { loadAnatomyBundle } from '../load-anatomy-data';
import { buildServedFiles, requestedPaths, serveFiles, type ServedFile } from './explorer-test-server';

const REAL_FILES = buildServedFiles();
const REAL_INDEX = JSON.parse(REAL_FILES[ANATOMY_INDEX_PATH] as string) as AnatomyIndex;
const REAL_EVIDENCE = JSON.parse(REAL_FILES[REGION_EVIDENCE_PATH] as string) as RegionEvidence;
/** Each test renders the whole explorer over the real data; on a loaded machine that can pass the default five seconds. */
const TEST_TIMEOUT_MS = 20_000;
vi.setConfig({ testTimeout: TEST_TIMEOUT_MS });
const SERVER_ERROR = { status: 500 };

/** React reports a duplicated list key, and every other misuse, through console.error. None is expected in any test here. */
let reactWarnings: ReturnType<typeof vi.spyOn>;
beforeEach(() => { reactWarnings = vi.spyOn(console, 'error').mockImplementation(() => undefined); });
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  const warnings = reactWarnings.mock.calls.map((call: unknown[]) => String(call[0]));
  reactWarnings.mockRestore();
  expect(warnings).toEqual([]);
});

async function openRegion(regionId: string, files: Record<string, ServedFile> = REAL_FILES): Promise<{ container: HTMLElement; inspector: HTMLElement; fetchMock: ReturnType<typeof vi.fn> }> {
  const fetchMock = serveFiles(files);
  const { container } = render(<AtlasExplorer />);
  await screen.findByRole('heading', { name: 'Regions' });
  fireEvent.click(container.querySelector<HTMLButtonElement>(`button[data-region-id="${regionId}"]`) as HTMLButtonElement);
  await waitFor(() => expect(container.querySelector('.atlas-inspector .atlas-loading')).toBeNull());
  return { container, inspector: container.querySelector('.atlas-inspector') as HTMLElement, fetchMock };
}

/** A region the real index links at least one technique to, and one it links none to. */
const litRegionId = REAL_INDEX.techniques.flatMap((technique) => technique.links).find((link) => link.lit)?.resolved_region_id ?? '';
const linkedIds = new Set(REAL_INDEX.techniques.flatMap((technique) => technique.links.map((link) => link.resolved_region_id)));
const unlinkedRegionId = REAL_INDEX.subjects.find((subject) => subject.kind === 'region' && !linkedIds.has(subject.id))?.id ?? '';
/**
 * A region no honest route reaches: no drafted technique link, no pathway listing it as an endpoint,
 * no device record naming it. 31 of 38 regions hold no technique link and four hold nothing at all,
 * which is why the pane's empty state is its main state and is tested as such.
 */
const emptyRegionId = (() => {
  const model = loadRealModel();
  const region = model.regions.find((candidate) => listLitLinks(model, candidate.id).length === 0
    && (model.pathwaysByRegion.get(candidate.id)?.length ?? 0) === 0
    && model.index.devices.stated_targets.every((device) => !device.region_ids.includes(candidate.id)));
  if (region === undefined) throw new Error('No region of the real atlas holds nothing, so the pane\'s empty state cannot be tested over real data.');
  return region.id;
})();

describe('AtlasExplorer: the inspector', () => {
  it('fetches the quotes and the literature only once a region is opened', async () => {
    const { fetchMock } = await openRegion(litRegionId);
    expect(requestedPaths(fetchMock).filter((path) => path === ANATOMY_EVIDENCE_PATH || path === REGION_EVIDENCE_PATH).sort()).toEqual([ANATOMY_EVIDENCE_PATH, REGION_EVIDENCE_PATH]);
    expect(requestedPaths(fetchMock)).not.toContain(H01_CARD_PATH);
  });

  it('shows what the atlas file says and the geometry status with its limit', async () => {
    const { inspector } = await openRegion(litRegionId);
    expect(inspector.querySelector('[data-limit-id="region_description"]')).not.toBeNull();
    expect(inspector.querySelector('[data-limit-id^="geometry_"]')).not.toBeNull();
  });

  it('shows each linked technique with the catalog\'s own quoted words', async () => {
    const { inspector } = await openRegion(litRegionId);
    const linked = [...inspector.querySelectorAll<HTMLElement>('.atlas-techniques')][0].querySelectorAll<HTMLElement>('.atlas-technique');
    expect(linked.length).toBeGreaterThan(0);
    for (const technique of linked) {
      expect(technique.querySelector('blockquote')?.textContent?.length, technique.dataset.techniqueId).toBeGreaterThan(10);
    }
    expect(inspector.querySelector('[data-limit-id="technique_quote"]')).not.toBeNull();
  });

  it('lists band-only techniques apart from linked ones, under words that say they are not links', async () => {
    const { inspector } = await openRegion(litRegionId);
    const heading = within(inspector).getByRole('heading', { name: /^Tagged with this band only \(\d+\)$/ });
    expect(heading.nextElementSibling?.textContent).toMatch(/^Tagged with band N\d; the catalog's text names no structure\. This is not a link to this region\.$/);
    const bandOnlyNames = [...(heading.nextElementSibling?.nextElementSibling?.querySelectorAll('button') ?? [])].map((button) => button.textContent);
    const linkedNames = [...inspector.querySelectorAll('.atlas-technique .atlas-link-button')].map((button) => button.textContent);
    expect(bandOnlyNames.length).toBeGreaterThan(0);
    expect(bandOnlyNames.filter((name) => linkedNames.includes(name))).toEqual([]);
  });

  it('says plainly when nothing is linked to a region, and reads its NISS and DSM facts as no data', async () => {
    const { inspector } = await openRegion(unlinkedRegionId);
    expect(inspector.querySelector('[data-limit-id="techniques_none"]')?.textContent).toContain('it does not mean the region is safe');
    expect(inspector.querySelector('.atlas-technique')).toBeNull();
    expect(inspector.querySelector('[data-fact="niss"]')?.textContent).toBe('Highest NISS step among linked techniques: no data.');
    expect(inspector.querySelector('[data-fact="dsm"]')?.textContent).toBe('DSM cluster tags on linked techniques: no data.');
  });

  it('names the devices whose record states the region as a target, or says there are none', async () => {
    const named = await openRegion('m1');
    expect(within(named.inspector).getByRole('button', { name: 'neuralink-n1' })).toBeTruthy();
    expect(named.inspector.querySelector('[data-limit-id="qif_file_fact"]')?.textContent).toContain('which no expert has reviewed');
    cleanup();
    const targeted = new Set(REAL_INDEX.devices.stated_targets.flatMap((device) => device.region_ids));
    const untargeted = REAL_INDEX.subjects.find((subject) => subject.kind === 'region' && !targeted.has(subject.id))?.id ?? '';
    expect((await openRegion(untargeted)).inspector.querySelector('[data-limit-id="stated_devices_none"]')).not.toBeNull();
  });
});

describe('AtlasExplorer: the inspector through a change of lens', () => {
  const lensButton = (label: string): HTMLButtonElement => [...document.querySelectorAll<HTMLButtonElement>('button.atlas-lens')].find((button) => button.textContent === label) as HTMLButtonElement;
  const regionName = (regionId: string): string => REAL_INDEX.subjects.find((subject) => subject.id === regionId)?.name ?? '';

  it('stays on the region and says beside its name that this lens holds no value for it, which is not a low one', async () => {
    const { container } = await openRegion(unlinkedRegionId);
    expect(container.querySelector('[data-inspector-lens]')).toBeNull();
    fireEvent.click(lensButton('NISS severity'));
    await waitFor(() => expect(container.querySelector('.atlas-root')?.getAttribute('data-lens')).toBe('niss'));
    const inspector = container.querySelector('.atlas-inspector') as HTMLElement;
    expect(within(inspector).getByRole('heading', { level: 2 }).textContent).toBe(regionName(unlinkedRegionId));
    expect(inspector.querySelector('[data-empty]')).toBeNull();
    const note = inspector.querySelector('[data-inspector-lens="niss"] [data-limit-id="region_no_value"]');
    expect(note?.textContent).toBe('No value under the NISS severity lens: no technique is linked to this region. This is not a low value.');
  });

  it('says nothing of the kind for a region the lens holds a value for', async () => {
    const { container } = await openRegion(litRegionId);
    fireEvent.click(lensButton('NISS severity'));
    await waitFor(() => expect(container.querySelector('.atlas-root')?.getAttribute('data-lens')).toBe('niss'));
    expect(within(container.querySelector('.atlas-inspector') as HTMLElement).getByRole('heading', { level: 2 }).textContent).toBe(regionName(litRegionId));
    expect(container.querySelector('[data-inspector-lens]')).toBeNull();
  });
});

describe('AtlasExplorer: literature statements', () => {
  it('gives every statement its "filed under; the paper says" line, a quote, a citation link, a scope note and the mark', async () => {
    const { inspector } = await openRegion('ppc');
    const statements = [...inspector.querySelectorAll<HTMLElement>('.atlas-statement')];
    expect(statements).toHaveLength(3);
    for (const statement of statements) {
      expect(statement.querySelector('[data-anatomy-line="true"]')?.textContent).toMatch(/^Filed under Posterior Parietal Cortex; the paper says ".+"\.$/);
      expect(statement.querySelector('[data-limit-id^="evidence_match_"]')).not.toBeNull();
      expect(statement.querySelector('blockquote')?.textContent?.length).toBeGreaterThan(10);
      expect(statement.querySelector('a[href^="https://pubmed.ncbi.nlm.nih.gov/"]')?.getAttribute('rel')).toBe('noopener noreferrer');
      expect(statement.querySelector('.atlas-scope')?.textContent).toMatch(/^Scope\. .+/);
    }
    const aboutRegion = REAL_EVIDENCE.rows.filter((row) => row.region_id === 'ppc').map((row) => String(row.anatomy_match === 'equal' && !row.anatomy_inferred));
    expect(statements.map((statement) => statement.dataset.aboutRegion)).toEqual(aboutRegion);
    expect(aboutRegion).toContain('false');
    expect(inspector.querySelector('[data-limit-id="evidence_intro"]')).not.toBeNull();
  });

  it('never shows a row filed as outside or larger than its region without saying so', async () => {
    const qualifiedRegions = [...new Set(REAL_EVIDENCE.rows.filter((row) => row.anatomy_match === 'outside_region' || row.anatomy_match === 'larger_structure').map((row) => row.region_id))];
    expect(qualifiedRegions.length).toBeGreaterThan(3);
    for (const regionId of qualifiedRegions) {
      const { inspector } = await openRegion(regionId);
      const expected = REAL_EVIDENCE.rows.filter((row) => row.region_id === regionId);
      const statements = [...inspector.querySelectorAll<HTMLElement>('.atlas-statement')];
      expect(statements, regionId).toHaveLength(expected.length);
      expected.forEach((row, index) => {
        const statement = statements[index];
        expect(statement.querySelector('[data-anatomy-line="true"]')?.textContent, regionId).toContain(`the paper says "${row.anatomy_as_stated}"`);
        expect(statement.querySelector(`[data-limit-id="evidence_match_${row.anatomy_match}"]`), `${regionId} ${row.pmid}`).not.toBeNull();
        if (row.anatomy_match !== 'equal') expect(statement.querySelector('[data-limit-id="evidence_match_equal"]'), `${regionId} ${row.pmid}`).toBeNull();
      });
      cleanup();
    }
  });

  it('flags contested statements in words and shows a paper that must be read with a statement', async () => {
    const ppc = await openRegion('ppc');
    expect([...ppc.inspector.querySelectorAll('.atlas-statement[data-contested="true"]')].map((statement) => statement.querySelector('.atlas-flag')?.textContent)).toEqual(['Contested', 'Contested']);
    cleanup();
    const vermis = await openRegion('vermis');
    const required = vermis.inspector.querySelector('.atlas-related[data-required="true"]');
    expect(required?.textContent).toContain('Must be read with it');
    expect(required?.querySelector('blockquote')).not.toBeNull();
    expect(vermis.inspector.querySelector('[data-limit-id="evidence_required_citation"]')).not.toBeNull();
  });

  it('gives a region with no statement its recorded reason and no statement', async () => {
    const { inspector } = await openRegion('cea');
    expect(inspector.querySelector('[data-limit-id="evidence_none_animal_evidence_only"]')?.textContent).toContain('only animal studies were found');
    expect(inspector.textContent).not.toMatch(/this session|filed under bla/);
    expect(inspector.querySelector('.atlas-statement')).toBeNull();
  });
});

describe('AtlasExplorer: failures', () => {
  it('says the atlas data could not be loaded when the index fetch fails, shows nothing else, and recovers on retry', async () => {
    serveFiles({ ...REAL_FILES, [ANATOMY_INDEX_PATH]: SERVER_ERROR });
    const { container } = render(<AtlasExplorer />);
    const alert = await screen.findByRole('alert');
    expect(alert.dataset.failure).toBe('unavailable');
    expect(alert.textContent).toContain('Not shown: the atlas data. Loading failed. Check your connection and try again.');
    expect(alert.textContent).not.toContain(ANATOMY_INDEX_PATH);
    expect(alert.dataset.failureFile).toBe(ANATOMY_INDEX_PATH);
    expect(container.querySelector('button[data-region-id]')).toBeNull();
    serveFiles(REAL_FILES);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByRole('heading', { name: 'Regions' });
    expect(container.querySelectorAll('button[data-region-id]')).toHaveLength(38);
  });

  it.each([
    ['has lost a review state', { ...REAL_INDEX, subjects: REAL_INDEX.subjects.map(({ review_state: _dropped, ...subject }) => subject) }],
    ['carries a softened status', { ...REAL_INDEX, status: 'Reviewed by experts.' }],
    ['lists no region', { ...REAL_INDEX, subjects: [] }],
    ['holds a region with no band the list can place it under', { ...REAL_INDEX, subjects: REAL_INDEX.subjects.map((subject) => (subject.id === 'pfc' ? { ...subject, band_ids: [] } : subject)) }],
    ['is not an index at all', { hello: 'world' }],
  ])('shows nothing and says the data failed its checks when the index %s', async (_case, badIndex) => {
    serveFiles({ ...REAL_FILES, [ANATOMY_INDEX_PATH]: JSON.stringify(badIndex) });
    const { container } = render(<AtlasExplorer />);
    const alert = await screen.findByRole('alert');
    expect(alert.dataset.failure).toBe('invalid');
    expect(alert.textContent).toContain('The file arrived but failed its checks, so none of it is shown');
    expect(container.querySelector('button[data-region-id]')).toBeNull();
  });

  it('ends a request the server never answers with a notice, not an endless wait', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })));
    render(<AtlasExplorer />);
    expect(screen.getByRole('status').textContent).toBe('Loading the atlas data…');
    await vi.advanceTimersByTimeAsync(FETCH_TIMEOUT_MS + 1);
    vi.useRealTimers();
    const alert = await screen.findByRole('alert');
    expect(alert.dataset.failure).toBe('unavailable');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('treats a file that is not JSON as not loaded', async () => {
    serveFiles({ ...REAL_FILES, [ANATOMY_INDEX_PATH]: '<html>not found</html>' });
    render(<AtlasExplorer />);
    expect((await screen.findByRole('alert')).dataset.failure).toBe('unavailable');
  });

  it('keeps the inspector working when the evidence files cannot be fetched, and says which part is missing', async () => {
    const { inspector } = await openRegion(litRegionId, { ...REAL_FILES, [ANATOMY_EVIDENCE_PATH]: SERVER_ERROR, [REGION_EVIDENCE_PATH]: SERVER_ERROR });
    const alerts = within(inspector).getAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent?.split('.')[0])).toEqual(['Not shown: the quoted catalog text', 'Not shown: the literature statements']);
    expect(inspector.querySelectorAll('.atlas-technique').length).toBeGreaterThan(0);
    expect(inspector.querySelector('.atlas-technique blockquote')).toBeNull();
    expect(inspector.querySelector('.atlas-statement')).toBeNull();
    expect(inspector.querySelector('[data-limit-id^="geometry_"]')).not.toBeNull();
  });

  it('refuses evidence that differs from the file the index pinned, and literature that fails its checks', async () => {
    const tampered = (REAL_FILES[ANATOMY_EVIDENCE_PATH] as string).replace('"schema_version":1', '"schema_version":1 ');
    const softened = JSON.stringify({ ...REAL_EVIDENCE, status: 'Peer reviewed.' });
    const softenedIndex = JSON.stringify({ ...REAL_INDEX, companions: REAL_INDEX.companions.map((pin) => (pin.path === REGION_EVIDENCE_PATH ? { ...pin, bytes: new TextEncoder().encode(softened).length, sha256: createHash('sha256').update(softened).digest('hex') } : pin)) });
    const { inspector } = await openRegion(litRegionId, { ...REAL_FILES, [ANATOMY_INDEX_PATH]: softenedIndex, [ANATOMY_EVIDENCE_PATH]: tampered, [REGION_EVIDENCE_PATH]: softened });
    const alerts = within(inspector).getAllByRole('alert');
    expect(alerts.map((alert) => alert.dataset.failure)).toEqual(['out_of_step', 'invalid']);
    expect(alerts[0].textContent).toContain('The page\'s data files are out of step with each other');
    expect(alerts[0].textContent).not.toContain('connection');
    expect(inspector.querySelector('.atlas-statement')).toBeNull();
    expect(inspector.querySelector('.atlas-technique blockquote')).toBeNull();
  });
});

describe('AtlasExplorer: files that are out of step', () => {
  const flipped = JSON.stringify({ ...REAL_EVIDENCE, rows: REAL_EVIDENCE.rows.map((row) => ({ ...row, anatomy_match: 'equal', anatomy_inferred: false })) });

  it('refuses a literature file that is valid but is not the one the index pins: a flipped anatomy match never reaches the screen', async () => {
    const { inspector } = await openRegion('ppc', { ...REAL_FILES, [REGION_EVIDENCE_PATH]: flipped });
    expect(within(inspector).getAllByRole('alert').map((alert) => alert.dataset.failure)).toEqual(['out_of_step']);
    expect(inspector.querySelector('.atlas-statement')).toBeNull();
  });

  it('refuses a catalog from another build whole, and a replaced H01 card', async () => {
    const catalog = JSON.parse(REAL_FILES['/atlas/anatomy-catalog.json'] as string) as { device_stage_techniques: unknown[] };
    serveFiles({ ...REAL_FILES, '/atlas/anatomy-catalog.json': JSON.stringify({ ...catalog, device_stage_techniques: catalog.device_stage_techniques.slice(1) }) });
    const first = render(<AtlasExplorer />);
    expect((await screen.findByRole('alert')).dataset.failure).toBe('out_of_step');
    expect(first.container.querySelector('button[data-region-id]')).toBeNull();
    cleanup();
    const card = JSON.parse(REAL_FILES[H01_CARD_PATH] as string) as { card: { sentences: Array<{ text: string }> } };
    card.card.sentences[0].text = 'H01 is a map of the whole human brain.';
    serveFiles({ ...REAL_FILES, [H01_CARD_PATH]: JSON.stringify(card) });
    render(<AtlasExplorer />);
    const panel = (await screen.findByRole('heading', { name: 'A real sample at nanometre scale' })).parentElement as HTMLElement;
    fireEvent.click(within(panel).getByRole('button', { name: 'About the H01 sample' }));
    expect((await within(panel).findByRole('alert')).dataset.failure).toBe('out_of_step');
    expect(panel.textContent).not.toContain('whole human brain');
  });

  it('refuses an index that has lost a technique the catalog still gives a brain band, and never calls that technique device-only', async () => {
    const dropped = REAL_INDEX.techniques.find((technique) => technique.band_ids.some((bandId) => !bandId.startsWith('N')));
    const staleIndex = JSON.stringify({ ...REAL_INDEX, techniques: REAL_INDEX.techniques.filter((technique) => technique.id !== dropped?.id) });
    serveFiles({ ...REAL_FILES, [ANATOMY_INDEX_PATH]: staleIndex });
    const { container } = render(<AtlasExplorer />);
    expect((await screen.findByRole('alert')).dataset.failure).toBe('out_of_step');
    expect(container.textContent).not.toContain('device stages only');
    expect(container.querySelector('button[data-region-id]')).toBeNull();
  });

  it('refuses a catalog whose band tags for a technique differ from the index\'s, even when its pin matches', async () => {
    const catalog = JSON.parse(REAL_FILES['/atlas/anatomy-catalog.json'] as string) as { device_stage_techniques: Array<{ id: string; band_ids: string[] }> };
    const mixed = catalog.device_stage_techniques.find((technique) => technique.band_ids.some((bandId) => bandId.startsWith('N')));
    if (mixed !== undefined) mixed.band_ids = mixed.band_ids.filter((bandId) => !bandId.startsWith('N'));
    const changed = JSON.stringify(catalog);
    const repinned = { ...REAL_INDEX, companions: REAL_INDEX.companions.map((pin) => (pin.path === '/atlas/anatomy-catalog.json' ? { ...pin, bytes: new TextEncoder().encode(changed).length, sha256: createHash('sha256').update(changed).digest('hex') } : pin)) };
    serveFiles({ ...REAL_FILES, [ANATOMY_INDEX_PATH]: JSON.stringify(repinned), '/atlas/anatomy-catalog.json': changed });
    render(<AtlasExplorer />);
    expect(mixed).toBeDefined();
    expect((await screen.findByRole('alert')).dataset.failure).toBe('out_of_step');
  });

  it('refuses an index that pins no catalog', async () => {
    serveFiles({ ...REAL_FILES, [ANATOMY_INDEX_PATH]: JSON.stringify({ ...REAL_INDEX, companions: [] }) });
    render(<AtlasExplorer />);
    expect((await screen.findByRole('alert')).dataset.failure).toBe('invalid');
  });
});

describe('AtlasExplorer: the page\'s pin of the index', () => {
  const indexPin = loadAnatomyBundle().indexPin;

  it('accepts the index the page was built with and shows no notice', async () => {
    serveFiles(REAL_FILES);
    const { container } = render(<AtlasExplorer indexPin={indexPin} />);
    await screen.findByRole('heading', { name: 'Regions' });
    expect(container.querySelector('[data-index-pin]')).toBeNull();
  });

  it('keeps the list when the served index is not the pinned one, says the 3D view is unavailable, and draws nothing', async () => {
    const otherBuild = (REAL_FILES[ANATOMY_INDEX_PATH] as string).replace('"schema_version":1', '"schema_version": 1');
    const fetchMock = serveFiles({ ...REAL_FILES, [ANATOMY_INDEX_PATH]: otherBuild });
    const { container } = render(<AtlasExplorer indexPin={indexPin} />);
    await screen.findByRole('heading', { name: 'Regions' });
    expect(container.querySelectorAll('button[data-region-id]')).toHaveLength(38);
    expect(container.querySelector('[data-index-pin="mismatched"]')?.textContent).toContain('The 3D view is not available.');
    fireEvent.click(screen.getByRole('button', { name: 'Show the 3D view' }));
    // The page does carry a pin, so the view says the files are out of step, and never that the page records no data.
    expect(container.querySelector('.atlas-viewport')?.getAttribute('data-gate')).toBe('out_of_step');
    const notices = [...container.querySelectorAll('[role="alert"]')].map((notice) => notice.textContent ?? '');
    expect(notices).toHaveLength(2);
    expect(notices.every((notice) => notice.includes('out of step'))).toBe(true);
    expect(container.textContent).not.toContain('does not record which data it was built with');
    expect(requestedPaths(fetchMock).filter((path) => path.includes('atlas-assets') || path.includes('OpenViewport'))).toEqual([]);
    expect(requestedPaths(fetchMock).filter((path) => path === ANATOMY_INDEX_PATH).length).toBeGreaterThanOrEqual(3);
  });

  it('still refuses an index that fails its checks, pinned or not', async () => {
    serveFiles({ ...REAL_FILES, [ANATOMY_INDEX_PATH]: JSON.stringify({ ...REAL_INDEX, status: 'Reviewed.' }) });
    const { container } = render(<AtlasExplorer indexPin={indexPin} />);
    expect((await screen.findByRole('alert')).dataset.failure).toBe('invalid');
    expect(container.querySelector('button[data-region-id]')).toBeNull();
  });
});

describe('AtlasExplorer: what each statement and section says', () => {
  it('renders every quote of a region word for word, with its check state, its kind and the paper\'s own term', async () => {
    const { inspector } = await openRegion('ppc');
    const expected = REAL_EVIDENCE.rows.filter((row) => row.region_id === 'ppc');
    const statements = [...inspector.querySelectorAll<HTMLElement>('.atlas-statement')];
    expected.forEach((row, index) => {
      expect(statements[index].querySelector(':scope > blockquote')?.textContent).toBe(`\u201c${row.quote}\u201d`);
      expect(statements[index].querySelector(`[data-limit-id="evidence_check_${row.verifier_verdict}"]`), row.pmid).not.toBeNull();
      expect(statements[index].querySelector('[data-kind="true"]')?.textContent).toMatch(/^Finding from /);
      expect(statements[index].querySelector('[data-anatomy-line="true"]')?.textContent).toContain(row.anatomy_as_stated);
      expect(statements[index].querySelector('[data-limit-id="evidence_rival_view"]') !== null).toBe(row.rival_view_row);
    });
    expect(expected.map((row) => row.verifier_verdict)).toContain('added_in_round_2_not_seen_by_verifier');
    expect(expected.some((row) => row.rival_view_row)).toBe(true);
    expect(inspector.querySelector('[data-limit-id="evidence_intro"]')?.textContent).toContain('A second AI checked most quotes');
  });

  it('keeps the NISS and DSM limits beside their facts, and band-only techniques in a section of their own, folded away', async () => {
    const { inspector } = await openRegion(litRegionId);
    expect(inspector.querySelector('[data-fact="niss"] + [data-limit-id="lens_niss"]')).not.toBeNull();
    expect(inspector.querySelector('[data-fact="dsm"] + [data-limit-id="lens_dsm"]')).not.toBeNull();
    const linkedSection = within(inspector).getByRole('heading', { name: 'Techniques linked to this region' }).parentElement as HTMLElement;
    expect(linkedSection.textContent).not.toContain('Tagged with this band only');
    const bandOnly = within(inspector).getByRole('heading', { name: /^Tagged with this band only/ }).parentElement as HTMLElement;
    expect(bandOnly.querySelectorAll('.atlas-chip')).toHaveLength(0);
    fireEvent.click(within(bandOnly).getByRole('button', { name: /^Show the \d+ techniques$/ }));
    expect(bandOnly.querySelectorAll('.atlas-chip').length).toBeGreaterThan(0);
  });

  /**
   * The pane's order is the design's, not a convenience: a reader must know how much the atlas holds,
   * and out of what, before reading anything derived from it, and must never meet band-sourced material
   * mixed into the region's own claims. The band holds up to every region in the atlas, so it is last
   * and fenced off.
   */
  it('orders the pane by what a reader needs first: coverage, the region\'s own words, the techniques, then the mappings', async () => {
    const { inspector } = await openRegion(litRegionId);
    const headings = [...inspector.querySelectorAll('h3')].map((heading) => heading.textContent ?? '');
    const at = (text: string): number => {
      const index = headings.findIndex((heading) => heading.startsWith(text));
      expect(index, text).toBeGreaterThan(-1);
      return index;
    };
    expect(at('What we hold for this region')).toBe(0);
    expect(at('What we hold for this region')).toBeLessThan(at('What the QIF atlas file says it does'));
    expect(at('What the QIF atlas file says it does')).toBeLessThan(at('Techniques linked to this region'));
    expect(at('Techniques linked to this region')).toBeLessThan(at('DSM-5-TR category references'));
    expect(at('DSM-5-TR category references')).toBeLessThan(at('Evidence from the literature'));
    // Band context is last, inside its own fence, and nothing above it is inside that fence.
    const bandContext = inspector.querySelector('[data-band-context="true"]') as HTMLElement;
    expect(bandContext.querySelector('h3')?.textContent).toMatch(/^Tagged with this band only \(\d+\)$/);
    expect(at('Tagged with this band only')).toBe(headings.length - 1);
    expect(bandContext.querySelector('.atlas-coverage')).toBeNull();
  });

  /**
   * 31 of the atlas's 38 regions hold no technique link at all, so a pane that is informative only
   * when full would be uninformative on most of the atlas. The empty case must state what was looked
   * for, out of what, and that nothing linked is not nothing there.
   */
  it('reads as a full answer for a region that holds nothing: every route, its denominator, and no word that reads as safe', async () => {
    const { inspector } = await openRegion(emptyRegionId);
    const coverage = inspector.querySelector('.atlas-coverage') as HTMLElement;
    expect(coverage.dataset.holdsNothing).toBe('true');
    const routes = [...coverage.querySelectorAll<HTMLElement>('.atlas-coverage-row')];
    expect(routes.map((row) => row.dataset.route)).toEqual(['technique', 'pathway', 'device']);
    for (const row of routes) {
      expect(row.querySelector('.atlas-coverage-count')?.textContent, row.dataset.route).toMatch(/^\d+ .+ of \d+ .+$/);
      expect(row.querySelector('.atlas-route')?.textContent, row.dataset.route).toMatch(/^via .+/);
    }
    expect(coverage.querySelector('[data-fact="niss-coverage"]')?.textContent).toBe('0 of 0 links carry a NISS severity.');
    expect(coverage.querySelector('[data-coverage-note="lens_no_data_not_safe"]')?.textContent)
      .toBe('Nothing is linked to this region. That is not a finding that the region is safe, or low: it means nobody has drafted a link to it, on any of the routes above.');
    expect(coverage.textContent).not.toMatch(/\b(safe|secure|low risk|no risk)\b(?!,)/);
    // Nothing linked means no NISS shape can be drawn, but the neurorights chart still mounts and says plainly that it holds no record.
    const chartSeam = coverage.querySelector('[data-seam="lane4-radars"]') as HTMLElement;
    expect(chartSeam.querySelectorAll('figure.radar')).toHaveLength(1);
    expect(chartSeam.querySelectorAll('figure.radar[data-state="plotted"]')).toHaveLength(0);
    expect(within(chartSeam).getByText('No records')).toBeTruthy();
  });

  it('mounts a NISS shape for every distinct scored technique linked to the region, and the neurorights chart beside them', async () => {
    const { inspector } = await openRegion(litRegionId);
    const coverage = inspector.querySelector('.atlas-coverage') as HTMLElement;
    const chartSeam = coverage.querySelector('[data-seam="lane4-radars"]') as HTMLElement;
    const model = loadRealModel();
    const linkedTechniques = [...new Set(listLitLinks(model, litRegionId).map((regionLink) => regionLink.technique))];
    const scoredCount = linkedTechniques.filter((technique) => technique.niss.scoring_state === 'scored').length;
    const hasNeurorightsRecord = linkedTechniques.some((technique) => technique.neurorights !== null);
    // One NISS figure per distinct scored technique (a technique linked by two terms gets one shape), plus one neurorights figure, plotted only once a linked technique carries a record.
    expect(chartSeam.querySelectorAll('figure.radar')).toHaveLength(scoredCount + 1);
    expect(chartSeam.querySelectorAll('figure.radar[data-state="plotted"]')).toHaveLength(scoredCount + (hasNeurorightsRecord ? 1 : 0));
  });

  it('says across the whole atlas how little it holds, before a region is chosen, and offers the regions that hold a link', async () => {
    serveFiles(REAL_FILES);
    const { container } = render(<AtlasExplorer />);
    await screen.findByRole('heading', { name: 'Regions' });
    const inspector = container.querySelector('.atlas-inspector') as HTMLElement;
    expect(inspector.dataset.empty).toBe('true');
    const rows = [...inspector.querySelectorAll<HTMLElement>('[data-coverage-row]')];
    expect(rows.map((row) => row.dataset.coverageRow)).toEqual(['linked', 'niss', 'unlinked', 'reviewed']);
    const held = (key: string): number => Number(rows.find((row) => row.dataset.coverageRow === key)?.querySelector('strong')?.textContent);
    expect(held('linked') + held('unlinked')).toBe(REAL_INDEX.subjects.filter((subject) => subject.kind === 'region').length);
    expect(held('unlinked')).toBeGreaterThan(held('linked'));
    expect(held('niss')).toBeLessThanOrEqual(held('linked'));
    expect(held('reviewed')).toBe(0);
    // The chips are the shortest path to the only regions that hold anything, and there is one per counted region.
    const chips = [...inspector.querySelectorAll<HTMLButtonElement>('.atlas-chip')];
    expect(chips).toHaveLength(held('linked'));
    fireEvent.click(chips[0]);
    await waitFor(() => expect(container.querySelector('.atlas-inspector')?.getAttribute('data-empty')).toBeNull());
    expect(container.querySelector('.atlas-coverage [data-fact="niss-coverage"]')?.textContent).toMatch(/^\d+ of [1-9]\d* links? carr(y|ies) a NISS severity/);
  });
});

describe('AtlasExplorer: device stages and the H01 card', () => {
  const deviceOnlyIds = registrar.techniques.filter((technique) => !technique.band_ids.some((bandId) => bandId.startsWith('N'))).map((technique) => technique.id).sort();

  async function renderRail(): Promise<HTMLElement> {
    serveFiles(REAL_FILES);
    render(<AtlasExplorer />);
    return (await screen.findByRole('heading', { name: 'Device stages' })).parentElement as HTMLElement;
  }

  function openEveryStage(rail: HTMLElement): string[] {
    const ids = new Set<string>();
    for (const stageId of ['S3', 'S2', 'S1', 'I0']) {
      fireEvent.click(rail.querySelector(`[data-stage-id="${stageId}"] .atlas-stage-button`) as HTMLElement);
      rail.querySelectorAll<HTMLElement>(`[data-stage-id="${stageId}"] [data-technique-id]`).forEach((item) => ids.add(item.dataset.techniqueId ?? ''));
    }
    return [...ids].sort();
  }

  it('lists exactly the techniques with no brain band across its four stages', async () => {
    const rail = await renderRail();
    expect([...rail.querySelectorAll<HTMLElement>('[data-stage-id]')].map((stage) => stage.dataset.stageId)).toEqual(['S3', 'S2', 'S1', 'I0']);
    expect(rail.textContent).toContain('67 techniques carry no brain band.');
    expect(rail.textContent).not.toMatch(/not on a brain region|act on the device/);
    expect(['device_stages', 'stage_tags', 'band_order'].filter((id) => rail.querySelector(`[data-limit-id="${id}"]`) === null)).toEqual([]);
    expect(openEveryStage(rail)).toEqual(deviceOnlyIds);
    expect(deviceOnlyIds).toHaveLength(67);
    expect(rail.querySelectorAll('[data-mixed="true"]')).toHaveLength(0);
    expect(rail.textContent).not.toContain('Also carries');
  });

  it('opens one stage at a time and counts every drafted link it shows once mixed techniques are listed', async () => {
    const rail = await renderRail();
    fireEvent.click(within(rail).getByRole('button', { name: /Also list the 77 techniques/ }));
    expect(openEveryStage(rail)).toHaveLength(144);
    expect(rail.querySelectorAll('[data-stage-id][data-active="true"]')).toHaveLength(1);
    const withLinks = [...rail.querySelectorAll<HTMLElement>('[data-mixed="true"]')].filter((item) => /\d+ region links? drafted/.test(item.textContent ?? ''));
    expect(withLinks.length).toBeGreaterThan(0);
    expect(rail.querySelector('[data-limit-id="device_stages_mixed"]')).not.toBeNull();
  });

  it('fetches the H01 card only when it is opened, with a source behind every sentence and what it must not imply', async () => {
    const fetchMock = serveFiles(REAL_FILES);
    render(<AtlasExplorer />);
    const panel = (await screen.findByRole('heading', { name: 'A real sample at nanometre scale' })).parentElement as HTMLElement;
    expect(requestedPaths(fetchMock)).not.toContain(H01_CARD_PATH);
    fireEvent.click(within(panel).getByRole('button', { name: 'About the H01 sample' }));
    await within(panel).findByRole('heading', { name: /One cubic millimetre, one patient/ });
    expect(requestedPaths(fetchMock).filter((path) => path === H01_CARD_PATH)).toHaveLength(1);
    expect(panel.querySelectorAll('.atlas-h01-sentences > li')).toHaveLength(5);
    expect(within(panel).getAllByRole('button', { name: /^Sources for this sentence \(\d\)$/ })).toHaveLength(5);
    const caveats = [...panel.querySelectorAll('[data-caveats="true"] li')].map((item) => item.textContent ?? '');
    expect(caveats).toHaveLength(10);
    expect(caveats[0]).toBe('This sample is not a whole brain: it is about one cubic millimetre.');
    expect(panel.textContent).not.toMatch(/must not|Do not state|the card must/);
    fireEvent.click(within(panel).getAllByRole('button', { name: /^Sources for this sentence/ })[0]);
    expect(panel.querySelectorAll('.atlas-h01-sentences blockquote').length).toBeGreaterThan(0);
  });

  it('says the H01 card could not be loaded and keeps the rest of the page', async () => {
    serveFiles({ ...REAL_FILES, [H01_CARD_PATH]: SERVER_ERROR });
    const { container } = render(<AtlasExplorer />);
    const panel = (await screen.findByRole('heading', { name: 'A real sample at nanometre scale' })).parentElement as HTMLElement;
    fireEvent.click(within(panel).getByRole('button', { name: 'About the H01 sample' }));
    expect((await within(panel).findByRole('alert')).textContent).toContain('Not shown: the H01 card. Loading failed.');
    expect(container.querySelectorAll('button[data-region-id]')).toHaveLength(38);
  });
});
