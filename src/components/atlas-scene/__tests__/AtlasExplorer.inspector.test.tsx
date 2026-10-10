// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import registrar from '@shared/qtara-registrar.json';
import type { AnatomyIndex } from '@/lib/anatomy/anatomy-index-types';
import { ANATOMY_EVIDENCE_PATH, ANATOMY_INDEX_PATH } from '@/lib/anatomy/anatomy-index-types';
import { H01_CARD_PATH } from '@/lib/anatomy/parse-h01-card';
import { REGION_EVIDENCE_PATH, type RegionEvidence } from '@/lib/anatomy/region-evidence-types';
import AtlasExplorer from '../AtlasExplorer';
import { buildServedFiles, requestedPaths, serveFiles, type ServedFile } from './explorer-test-server';

const REAL_FILES = buildServedFiles();
const REAL_INDEX = JSON.parse(REAL_FILES[ANATOMY_INDEX_PATH] as string) as AnatomyIndex;
const REAL_EVIDENCE = JSON.parse(REAL_FILES[REGION_EVIDENCE_PATH] as string) as RegionEvidence;
const UNREVIEWED = 'AI-drafted, unreviewed';
const SERVER_ERROR = { status: 500 };

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

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

describe('AtlasExplorer: the inspector', () => {
  it('fetches the quotes and the literature only once a region is opened', async () => {
    const { fetchMock } = await openRegion(litRegionId);
    expect(requestedPaths(fetchMock).filter((path) => path === ANATOMY_EVIDENCE_PATH || path === REGION_EVIDENCE_PATH).sort()).toEqual([ANATOMY_EVIDENCE_PATH, REGION_EVIDENCE_PATH]);
    expect(requestedPaths(fetchMock)).not.toContain(H01_CARD_PATH);
  });

  it('shows what the atlas file says, the geometry status with its limit, and the mark', async () => {
    const { inspector } = await openRegion(litRegionId);
    expect(inspector.querySelector('[data-limit-id="region_description"]')).not.toBeNull();
    expect(inspector.querySelector('[data-limit-id^="geometry_"]')).not.toBeNull();
    expect(within(inspector).getByRole('heading', { name: 'What stands for it' }).parentElement?.querySelector('[data-ai-drafted="true"]')?.textContent).toBe(UNREVIEWED);
  });

  it('shows each linked technique with the catalog\'s own quoted words and the AI-drafted mark', async () => {
    const { inspector } = await openRegion(litRegionId);
    const linked = [...inspector.querySelectorAll<HTMLElement>('.atlas-techniques')][0].querySelectorAll<HTMLElement>('.atlas-technique');
    expect(linked.length).toBeGreaterThan(0);
    for (const technique of linked) {
      expect(technique.querySelector('[data-ai-drafted="true"]')?.textContent, technique.dataset.techniqueId).toBe(UNREVIEWED);
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
    expect(named.inspector.querySelector('[data-limit-id="lens_stated_targets"]')).not.toBeNull();
    cleanup();
    const targeted = new Set(REAL_INDEX.devices.stated_targets.flatMap((device) => device.region_ids));
    const untargeted = REAL_INDEX.subjects.find((subject) => subject.kind === 'region' && !targeted.has(subject.id))?.id ?? '';
    expect((await openRegion(untargeted)).inspector.querySelector('[data-limit-id="stated_devices_none"]')).not.toBeNull();
  });
});

describe('AtlasExplorer: literature statements', () => {
  it('gives every statement its "filed under; the paper says" line, a quote, a citation link, a scope note and the mark', async () => {
    const { inspector } = await openRegion('ppc');
    const statements = [...inspector.querySelectorAll<HTMLElement>('.atlas-statement')];
    expect(statements).toHaveLength(3);
    for (const statement of statements) {
      expect(statement.querySelector('[data-anatomy-line="true"]')?.textContent).toMatch(/^Filed under Posterior Parietal Cortex; the paper says ".+"\. AI-drafted, unreviewed$/);
      expect(statement.querySelector('[data-limit-id^="evidence_match_"]')).not.toBeNull();
      expect(statement.querySelector('blockquote')?.textContent?.length).toBeGreaterThan(10);
      expect(statement.querySelector('a[href^="https://pubmed.ncbi.nlm.nih.gov/"]')?.getAttribute('rel')).toBe('noopener noreferrer');
      expect(statement.querySelector('.atlas-scope')?.textContent).toMatch(/^Scope\. .+/);
    }
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
    expect(inspector.querySelector('[data-limit-id="evidence_none"]')?.textContent).toContain('Only animal evidence found');
    expect(inspector.querySelector('.atlas-statement')).toBeNull();
  });
});

describe('AtlasExplorer: failures', () => {
  it('says the atlas data could not be loaded when the index fetch fails, shows nothing else, and recovers on retry', async () => {
    serveFiles({ ...REAL_FILES, [ANATOMY_INDEX_PATH]: SERVER_ERROR });
    const { container } = render(<AtlasExplorer />);
    const alert = await screen.findByRole('alert');
    expect(alert.dataset.failure).toBe('unavailable');
    expect(alert.textContent).toContain('The atlas data could not be loaded. Check your connection and try again.');
    expect(alert.textContent).toContain(ANATOMY_INDEX_PATH);
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
    ['is not an index at all', { hello: 'world' }],
  ])('shows nothing and says the data failed its checks when the index %s', async (_case, badIndex) => {
    serveFiles({ ...REAL_FILES, [ANATOMY_INDEX_PATH]: JSON.stringify(badIndex) });
    const { container } = render(<AtlasExplorer />);
    const alert = await screen.findByRole('alert');
    expect(alert.dataset.failure).toBe('invalid');
    expect(alert.textContent).toContain('arrived but failed its checks, so none of it is shown');
    expect(container.querySelector('button[data-region-id]')).toBeNull();
  });

  it('treats a file that is not JSON as not loaded', async () => {
    serveFiles({ ...REAL_FILES, [ANATOMY_INDEX_PATH]: '<html>not found</html>' });
    render(<AtlasExplorer />);
    expect((await screen.findByRole('alert')).dataset.failure).toBe('unavailable');
  });

  it('keeps the inspector working when the evidence files cannot be fetched, and says which part is missing', async () => {
    const { inspector } = await openRegion(litRegionId, { ...REAL_FILES, [ANATOMY_EVIDENCE_PATH]: SERVER_ERROR, [REGION_EVIDENCE_PATH]: SERVER_ERROR });
    const alerts = within(inspector).getAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent?.split('.')[0])).toEqual(['The quoted catalog text could not be loaded', 'The literature statements could not be loaded']);
    expect(inspector.querySelectorAll('.atlas-technique').length).toBeGreaterThan(0);
    expect(inspector.querySelector('.atlas-technique blockquote')).toBeNull();
    expect(inspector.querySelector('.atlas-statement')).toBeNull();
    expect(inspector.querySelector('[data-limit-id^="geometry_"]')).not.toBeNull();
  });

  it('refuses evidence that differs from the file the index pinned, and literature that fails its checks', async () => {
    const tampered = (REAL_FILES[ANATOMY_EVIDENCE_PATH] as string).replace('"schema_version":1', '"schema_version":1 ');
    const softened = JSON.stringify({ ...REAL_EVIDENCE, status: 'Peer reviewed.' });
    const { inspector } = await openRegion(litRegionId, { ...REAL_FILES, [ANATOMY_EVIDENCE_PATH]: tampered, [REGION_EVIDENCE_PATH]: softened });
    const alerts = within(inspector).getAllByRole('alert');
    expect(alerts.map((alert) => alert.dataset.failure)).toEqual(['unavailable', 'invalid']);
    expect(inspector.querySelector('.atlas-statement')).toBeNull();
    expect(inspector.querySelector('.atlas-technique blockquote')).toBeNull();
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
    expect(rail.textContent).toContain('65 techniques carry no brain band');
    expect(openEveryStage(rail)).toEqual(deviceOnlyIds);
    expect(deviceOnlyIds).toHaveLength(65);
    expect(rail.querySelector('[data-ai-drafted]')).toBeNull();
  });

  it('opens one stage at a time and marks every drafted link it shows once mixed techniques are listed', async () => {
    const rail = await renderRail();
    fireEvent.click(within(rail).getByRole('button', { name: /Also list the 77 techniques/ }));
    expect(openEveryStage(rail)).toHaveLength(142);
    expect(rail.querySelectorAll('[data-stage-id][data-active="true"]')).toHaveLength(1);
    const withLinks = [...rail.querySelectorAll<HTMLElement>('[data-mixed="true"]')].filter((item) => /\d+ region links? drafted/.test(item.textContent ?? ''));
    expect(withLinks.length).toBeGreaterThan(0);
    expect(withLinks.filter((item) => item.querySelector('[data-ai-drafted="true"]')?.textContent !== UNREVIEWED)).toEqual([]);
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
    expect(panel.querySelector('[data-ai-drafted="true"]')?.textContent).toBe(UNREVIEWED);
    expect(panel.textContent).toContain('Not a whole brain');
    fireEvent.click(within(panel).getAllByRole('button', { name: /^Sources for this sentence/ })[0]);
    expect(panel.querySelectorAll('.atlas-h01-sentences blockquote').length).toBeGreaterThan(0);
  });

  it('says the H01 card could not be loaded and keeps the rest of the page', async () => {
    serveFiles({ ...REAL_FILES, [H01_CARD_PATH]: SERVER_ERROR });
    const { container } = render(<AtlasExplorer />);
    const panel = (await screen.findByRole('heading', { name: 'A real sample at nanometre scale' })).parentElement as HTMLElement;
    fireEvent.click(within(panel).getByRole('button', { name: 'About the H01 sample' }));
    expect((await within(panel).findByRole('alert')).textContent).toContain('The H01 card could not be loaded');
    expect(container.querySelectorAll('button[data-region-id]')).toHaveLength(38);
  });
});
