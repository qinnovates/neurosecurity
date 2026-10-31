// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import { REGION_DOSSIER_PATH } from '@/lib/atlas-explorer/dossier-file';
import { createExplorerModel, listLitLinks, type ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { loadRealCatalog, loadRealModel } from '@/lib/atlas-explorer/__tests__/explorer-fixtures';
import { buildRegionDetail } from '@/lib/atlas-explorer/region-detail';
import DossierTechniques from '../DossierTechniques';
import RegionDossier from '../RegionDossier';
import { buildServedFiles, requestedPaths, serveFiles, type ServedFile } from './explorer-test-server';

const REAL_FILES = buildServedFiles();
const baseModel = loadRealModel();
/** A new model for each test: the dossier's file is held once per model. */
const freshModel = (): ExplorerModel => createExplorerModel(baseModel.index, loadRealCatalog());
const litRegionId = baseModel.regions.find((region) => listLitLinks(baseModel, region.id).length > 0)?.id ?? '';
const emptyN7Region = baseModel.regions.find((region) => (baseModel.linksByRegion.get(region.id) ?? []).length === 0 && region.band_ids[0] === 'N7');
const n7TaggedCount = baseModel.index.techniques.filter((technique) => technique.band_ids.includes('N7')).length;
const LOADED_SELECTOR = '[data-device-relation], [data-limit-id="stated_devices_none"]';

function mount(regionId: string, { model = freshModel(), files = REAL_FILES }: { model?: ExplorerModel; files?: Record<string, ServedFile> } = {}) {
  const fetchMock = serveFiles(files);
  const onChooseTechnique = vi.fn();
  const onChooseDevice = vi.fn();
  const view = render(<RegionDossier model={model} regionId={regionId} anatomyEvidence={{ status: 'idle' }} onRetryAnatomyEvidence={vi.fn()} onChooseTechnique={onChooseTechnique} onChooseDevice={onChooseDevice} />);
  return { ...view, fetchMock, onChooseTechnique, onChooseDevice, model };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('RegionDossier', () => {
  it('reads in the neurosecurity order, signal first, and ends on one query link', async () => {
    const { container } = mount('m1');
    await waitFor(() => expect(container.querySelector(LOADED_SELECTOR)).not.toBeNull());
    expect([...container.querySelectorAll('h3')].map((heading) => heading.textContent)).toEqual(['Layer and function', 'Techniques', 'Devices', 'Hazards for this layer', 'Connections', 'Conditions referenced']);
    expect(within(container).getAllByRole('link', { name: 'Query this in KQL' })).toHaveLength(1);
    expect(container.querySelector('[data-fact="layer"]')?.textContent).toBe('Neocortex N7');
  });

  it('lists a linked technique with its id outlined by tier, its NISS step, and a way to the coverage gaps or its control', async () => {
    const { container, onChooseTechnique } = mount(litRegionId);
    await waitFor(() => expect(container.querySelector(LOADED_SELECTOR)).not.toBeNull());
    const row = container.querySelector<HTMLElement>('[data-dossier-technique]') as HTMLElement;
    const techniqueId = row.dataset.dossierTechnique ?? '';
    expect(techniqueId).toMatch(/^QIF-T\d{4}$/);
    expect(row.querySelector('.atlas-tier')?.textContent).toBe(techniqueId);
    expect(['solid', 'dashed', 'dotted']).toContain(row.querySelector<HTMLElement>('.atlas-tier')?.dataset.tierMark);
    expect(row.textContent).toContain('NISS step:');
    const control = row.querySelector('[data-fact="control"]') as HTMLElement;
    const gapLink = within(control).queryByRole('link', { name: 'No control recorded' });
    if (gapLink === null) expect(control.textContent).toContain('Recorded control:');
    else expect(gapLink.getAttribute('href')).toBe('/atlas/tara/coverage-gaps/');
    fireEvent.click(within(row).getByRole('button'));
    expect(onChooseTechnique).toHaveBeenCalledWith(techniqueId);
  });

  it('gives a technique with CVE precedents a count that links to its page, and says what a precedent is', () => {
    const detail = buildRegionDetail(baseModel, litRegionId);
    const [technique] = detail?.linked ?? [];
    if (detail === null || technique === undefined) throw new Error('The real index holds no linked technique.');
    render(<DossierTechniques detail={{ ...detail, cves: [{ id: 'CVE-2000-0001', techniqueId: technique.id }, { id: 'CVE-2000-0002', techniqueId: technique.id }] }} evidence={{ status: 'idle' }} onRetryEvidence={vi.fn()} onChooseTechnique={vi.fn()} />);
    expect(screen.getByRole('link', { name: '2 CVE precedents' }).getAttribute('href')).toBe(`/atlas/tara/${technique.id}/`);
    expect(document.querySelector('[data-limit-id="cve_precedent"]')?.textContent).toBe(limitSentence('cve_precedent').text);
  });

  it('treats a region no technique names as a first-class state, with one count line and no rows', async () => {
    const { container } = mount(emptyN7Region?.id ?? '');
    await waitFor(() => expect(container.querySelector(LOADED_SELECTOR)).not.toBeNull());
    expect(container.querySelector('[data-limit-id="dossier_no_technique"]')?.textContent).toBe(`No technique names this structure yet. ${n7TaggedCount} are tagged with its layer.`);
    expect(container.querySelector('[data-dossier-technique]')).toBeNull();
    expect(container.querySelector('[data-limit-id="tier_mark"]')).toBeNull();
  });

  it('gives a region with rows the band-inherited line, as a count and never a list', async () => {
    const { container } = mount(litRegionId);
    await waitFor(() => expect(container.querySelector(LOADED_SELECTOR)).not.toBeNull());
    expect(container.querySelector('[data-limit-id="dossier_band_count"]')?.textContent).toMatch(/^\d+ techniques are tagged N\d; none names this structure\.$/);
    expect(container.querySelector('[data-limit-id="dossier_no_technique"]')).toBeNull();
  });

  it('groups devices by the relation their record states, and hands a choice back by id', async () => {
    const { container, onChooseDevice } = mount('m1');
    await waitFor(() => expect(container.querySelector(LOADED_SELECTOR)).not.toBeNull());
    expect(container.querySelector('[data-device-relation="implanted_in"] [data-dossier-device="neuralink-n1"]')?.textContent).toContain('N1 Implant (Link)');
    expect(container.querySelector('[data-device-relation="endovascular_adjacent_to"] [data-dossier-device="synchron-stentrode"]')).not.toBeNull();
    expect(container.querySelector('[data-device-relation="scalp_position_over"] [data-dossier-device="emotiv-epoc-x"]')).not.toBeNull();
    expect(container.querySelector('[data-dossier-company="Neuralink"]')?.textContent).toBe('Neuralink: invasive, active.');
    expect(container.querySelector('[data-limit-id="company_is_context"]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'N1 Implant (Link)' }));
    expect(onChooseDevice).toHaveBeenCalledWith('neuralink-n1');
  });

  it('states each join\'s limit beside it', async () => {
    const { container } = mount('m1');
    await waitFor(() => expect(container.querySelector(LOADED_SELECTOR)).not.toBeNull());
    for (const id of ['hazards_by_layer', 'pathway_unreviewed', 'dsm_references', 'controls_pair', 'nothing_live', 'scene_review_state'] as const) {
      expect(container.querySelector(`[data-limit-id="${id}"]`)?.textContent, id).toBe(limitSentence(id).text);
    }
  });

  it('shows what the index holds at once and fetches its own file once, for every region of a model', async () => {
    const model = freshModel();
    const { container, fetchMock, rerender, onChooseDevice, onChooseTechnique } = mount('m1', { model });
    expect(container.querySelector('h3')?.textContent).toBe('Layer and function');
    await waitFor(() => expect(container.querySelector(LOADED_SELECTOR)).not.toBeNull());
    rerender(<RegionDossier key="pfc" model={model} regionId="pfc" anatomyEvidence={{ status: 'idle' }} onRetryAnatomyEvidence={vi.fn()} onChooseTechnique={onChooseTechnique} onChooseDevice={onChooseDevice} />);
    expect(container.querySelector('.atlas-loading')).toBeNull();
    expect(container.querySelector(LOADED_SELECTOR)).not.toBeNull();
    expect(requestedPaths(fetchMock).filter((path) => path === REGION_DOSSIER_PATH)).toHaveLength(1);
  });

  it('says what is missing when the file cannot load, keeps what it has, and fetches again on request', async () => {
    const { container, fetchMock } = mount('m1', { files: { ...REAL_FILES, [REGION_DOSSIER_PATH]: { status: 500 } } });
    await screen.findByRole('alert');
    expect(container.querySelector('[data-failure-file="/atlas/anatomy-dossier.json"]')).not.toBeNull();
    expect(container.querySelector('[data-dossier-query]')).not.toBeNull();
    expect(container.querySelector('[data-device-relation]')).toBeNull();
    serveFiles(REAL_FILES);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(container.querySelector(LOADED_SELECTOR)).not.toBeNull());
    expect(requestedPaths(fetchMock).filter((path) => path === REGION_DOSSIER_PATH)).toHaveLength(1);
  });
});
