import { describe, expect, it } from 'vitest';
import atlas from '@shared/qif-brain-bci-atlas.json';
import { AnatomyDataError } from '@/lib/anatomy/errors';
import { announceLens, announceSelection } from '../announcements';
import { buildExplorerCatalog, parseExplorerCatalog } from '../explorer-catalog';
import { buildBandGroups, tallyLens } from '../region-rows';
import { FIXTURE_IDS, buildFixtureModel, loadRealCatalog } from './explorer-fixtures';

const ENGINE_DATA = { registrarVersion: '1', tactics: [], techniques: [], regions: [], precedentCves: [], precedentCvesAsOf: '2026-01-01' };
const NO_DSM = { registrar: { techniques: [] }, pathways: { pathways: [] } };

describe('explorer catalog', () => {
  it('copies band names and region descriptions from the atlas file, and lists every technique with a device band (guard)', () => {
    const catalog = loadRealCatalog();
    expect(catalog.bands.map((band) => band.id).sort()).toEqual(['I0', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'S1', 'S2', 'S3']);
    expect(catalog.regions).toHaveLength(38);
    expect(catalog.regions[0].function).toBe(atlas.brain_regions[0].function);
    expect(catalog.device_stage_techniques).toHaveLength(142);
  });

  it('stops the build when the atlas file lacks a band name or a description', () => {
    expect(() => buildExplorerCatalog(ENGINE_DATA, { qif_bands: [{ id: 'N7' }], brain_regions: [] }, NO_DSM)).toThrow(AnatomyDataError);
    expect(() => buildExplorerCatalog(ENGINE_DATA, { qif_bands: [], brain_regions: [{ id: 'pfc', function: ' ' }] }, NO_DSM)).toThrow(/brain_regions\[0\]\.function: expected text/);
    expect(() => buildExplorerCatalog(ENGINE_DATA, { qif_bands: 'none', brain_regions: [] }, NO_DSM)).toThrow(/qif_bands: expected a list/);
  });

  it('refuses a fetched catalog that is not the catalog', () => {
    const served = JSON.parse(JSON.stringify(loadRealCatalog())) as Record<string, unknown>;
    expect(parseExplorerCatalog(served)).toEqual(loadRealCatalog());
    expect(() => parseExplorerCatalog({ ...served, extra: 1 })).toThrow(/unexpected key "extra"/);
    expect(() => parseExplorerCatalog({ ...served, schema_version: 2 })).toThrow(/schema_version/);
    expect(() => parseExplorerCatalog({ ...served, bands: [{ id: 'N9', name: 'x', description: 'y' }] })).toThrow(/bands\[0\]\.id/);
  });
});

describe('announcements', () => {
  const model = buildFixtureModel();
  const tallyFor = (mode: Parameters<typeof buildBandGroups>[1]) => tallyLens(buildBandGroups(model, mode));

  it('name the region, its band, what stands for it and its review state', () => {
    expect(announceSelection(model, 'm1')).toBe('m1 selected. Band N7. inside a larger shape. AI-drafted, unreviewed.');
    expect(announceSelection(model, 'nowhere')).toBe('Selection cleared.');
  });

  it('count what the lens shows, with no data counted on its own', () => {
    const mode = { kind: 'technique', techniqueId: FIXTURE_IDS.linkedTechnique } as const;
    expect(announceLens(model, mode, tallyFor(mode))).toBe('Technique lens: Fixture injection. 1 region with a value, 2 AI-drafted, 1 named but not counted, 3 with no data.');
    expect(announceLens(model, { kind: 'niss' }, tallyFor({ kind: 'niss' }))).toBe('NISS severity lens. 1 region with a value, 1 AI-drafted, 4 with no data.');
    expect(announceLens(model, { kind: 'band' }, tallyFor({ kind: 'band' }))).toBe('Band lens. 5 regions grouped by band.');
    expect(announceLens(model, { kind: 'dsm', cluster: null }, tallyFor(null))).toBe('DSM cluster lens. Choose a subject to see regions.');
  });
});
