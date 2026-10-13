import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import atlas from '@shared/qif-brain-bci-atlas.json';
import techniqueRegions from '@shared/qif-anatomy-technique-regions.json';
import pathwayFile from '@shared/qif-neural-pathways.json';
import registrar from '@shared/qtara-registrar.json';
import taraChains from '@shared/tara-chains.json';
import { loadCompanionJson } from '@/components/atlas-scene/load-anatomy-data';
import { ATLAS_CHAINS_PATH, parseAtlasChains } from '../chain-file';
import { buildChainSteps } from '../chain-steps';
import { buildRegionDetail, type RegionDetail } from '../region-detail';
import { buildRegionDsm, type RegionDsm } from '../region-dsm';
import { listClusterOptions, listDeviceOptions, listTechniqueOptions } from '../subject-options';
import { loadRealModel } from './explorer-fixtures';

/**
 * Mapping completeness, on the data the site serves. For each kind of mapping the datalake holds for a region, the set
 * the explorer's view model exposes must equal the set computed here straight from the datalake files, with none of
 * the explorer's own lookups. A mapping that stops surfacing fails the kind it belongs to; every kind also asserts it
 * is not empty, so nothing passes on missing data.
 *
 * DSM-5-TR entries are diagnostic category references used for threat modelling, not diagnostic claims.
 */

const SEPARATOR = ' | ';
const NEURAL_BAND_PREFIX = 'N';
const IMPACT_CHAINS_FILE = path.resolve(import.meta.dirname, '../../../../datalake/impact-chains.json');

interface RawDsm { code: string; name: string; confidence: string }
interface RawTechnique {
  id: string;
  band_ids: string[];
  niss?: { severity?: string } | null;
  tara?: { dsm5?: { cluster?: string; primary?: RawDsm[]; secondary?: RawDsm[] } } | null;
}
interface RawPathway { id: string; name: string; origin: string[]; targets: string[]; dsm_conditions: string[]; dsm_names: string[] }
interface RawImpactRow { region_id: string; dsm_code: string }

const model = loadRealModel();
const rawTechniques = (registrar as unknown as { techniques: RawTechnique[] }).techniques;
const neuralTechniques = rawTechniques.filter((technique) => technique.band_ids.some((bandId) => bandId.startsWith(NEURAL_BAND_PREFIX)));
const rawRegions = atlas.brain_regions.map((region) => ({ id: region.id, band: region.qif_band }));
const details = new Map(rawRegions.map((region) => [region.id, buildRegionDetail(model, region.id)]));

const join = (...parts: Array<string | number>): string => parts.join(SEPARATOR);
const sorted = (values: Iterable<string>): string[] => [...new Set(values)].sort();

function detailOf(regionId: string): RegionDetail {
  const detail = details.get(regionId);
  if (detail === null || detail === undefined) throw new Error(`The explorer holds no detail for region "${regionId}".`);
  return detail;
}

/** Every DSM-5-TR pair the view model exposes, over all 38 regions. */
function exposedDsm(pick: (dsm: RegionDsm, regionId: string) => string[]): string[] {
  return sorted(rawRegions.flatMap((region) => pick(buildRegionDsm(model, region.id), region.id)));
}

/** Every pair the view model exposes for a kind, over all 38 regions. */
function exposed(pick: (detail: RegionDetail, regionId: string) => string[]): string[] {
  return sorted(rawRegions.flatMap((region) => pick(detailOf(region.id), region.id)));
}

/** The atlas file's own alias table, read here without the site's resolver: an id, or an alias the file classes as a synonym. */
const synonymAliases = new Set(atlas.region_alias_relations.synonym);
const aliasTargets = atlas.region_aliases as unknown as Record<string, string>;
const regionIds = new Set(rawRegions.map((region) => region.id));
const normalise = (term: string): string => term.trim().toLowerCase().replace(/[\s_-]+/g, '_');
const namesByNormalForm = new Map<string, string>([...regionIds, ...Object.keys(aliasTargets).filter((key) => !key.startsWith('_'))].map((name) => [normalise(name), name]));

/** The region a word of the catalog or an endpoint of a pathway stands for, with whether the atlas file lets it count. */
function resolveIndependently(term: string): { regionId: string; counts: boolean } | null {
  const form = normalise(term);
  const name = namesByNormalForm.get(form) ?? (form.endsWith('s') ? namesByNormalForm.get(form.slice(0, -1)) : undefined);
  if (name === undefined) return null;
  return regionIds.has(name) ? { regionId: name, counts: true } : { regionId: aliasTargets[name], counts: synonymAliases.has(name) };
}

const draftedLinks = Object.entries((techniqueRegions as unknown as { techniques: Record<string, { scope: string; links: Array<{ term: string }> }> }).techniques);
const rawBandsByTechnique = new Map(rawTechniques.map((technique) => [technique.id, technique.band_ids]));
const rawBandByRegion = new Map(rawRegions.map((region) => [region.id, region.band]));
/**
 * The techniques whose link to a region counts, worked out here from the data files and not read from the model: the
 * drafted word is the region's id or an alias the atlas file classes as a synonym, and the registrar puts the technique
 * in the region's band. The builder also asks that the link's quote was found and that it is valid for the current
 * addressing; the test below fails if a link ever falls short on those, which is the moment to restate them here.
 */
const litPairs = new Set(draftedLinks.flatMap(([techniqueId, entry]) => entry.links.flatMap((link) => {
  const resolved = resolveIndependently(link.term);
  const regionBand = resolved === null ? undefined : rawBandByRegion.get(resolved.regionId);
  const bandAgrees = regionBand !== undefined && (rawBandsByTechnique.get(techniqueId) ?? []).includes(regionBand);
  return resolved !== null && resolved.counts && bandAgrees ? [join(resolved.regionId, techniqueId)] : [];
})));
const litTechniquesOf = (regionId: string): string[] => rawTechniques.map((technique) => technique.id).filter((techniqueId) => litPairs.has(join(regionId, techniqueId)));
const dsmEntriesOf = (technique: RawTechnique): RawDsm[] => [...(technique.tara?.dsm5?.primary ?? []), ...(technique.tara?.dsm5?.secondary ?? [])];
const rawTechniqueById = new Map(rawTechniques.map((technique) => [technique.id, technique]));

describe('mapping completeness: what the datalake maps to a region, the explorer exposes', () => {
  it('covers the 38 regions of the atlas file, each under its own band', () => {
    expect(rawRegions).toHaveLength(38);
    expect(model.regions.map((region) => join(region.id, region.band_ids.join(',')))).toEqual(rawRegions.map((region) => join(region.id, region.band)));
  });

  it('techniques naming a region: every drafted link whose word is a region or an alias of one, counted or not', () => {
    const neuralIds = new Set(neuralTechniques.map((technique) => technique.id));
    const expected = sorted(draftedLinks.filter(([techniqueId]) => neuralIds.has(techniqueId)).flatMap(([techniqueId, entry]) => entry.links.flatMap((link) => {
      const resolved = resolveIndependently(link.term);
      return resolved === null ? [] : [join(resolved.regionId, techniqueId, link.term)];
    })));
    const shown = exposed((detail, regionId) => [...detail.linked, ...detail.namedNotCounted].map((technique) => join(regionId, technique.id, technique.term)));
    expect(expected.length).toBeGreaterThan(20);
    expect(shown).toEqual(expected);
    expect(exposed((detail, regionId) => detail.linked.map((technique) => join(regionId, technique.id))).length).toBeGreaterThan(0);
  });

  it('techniques linked to a region: the model\'s linked set is the one the data files give', () => {
    expect(litPairs.size).toBeGreaterThan(0);
    expect(exposed((detail, regionId) => detail.linked.map((technique) => join(regionId, technique.id)))).toEqual(sorted(litPairs));
  });

  it('techniques reaching a region through its band only: every band-level technique of the region\'s band', () => {
    const bandLevelIds = new Set(draftedLinks.filter(([, entry]) => entry.scope === 'band_level').map(([techniqueId]) => techniqueId));
    const expected = sorted(rawRegions.flatMap((region) => neuralTechniques.filter((technique) => bandLevelIds.has(technique.id) && technique.band_ids.includes(region.band)).map((technique) => join(region.id, technique.id))));
    expect(expected.length).toBeGreaterThan(500);
    expect(exposed((detail, regionId) => detail.bandLevel.map((technique) => join(regionId, technique.id)))).toEqual(expected);
  });

  it('every technique of the registrar is a subject the technique lens offers', () => {
    expect(rawTechniques.length).toBeGreaterThan(150);
    expect(listTechniqueOptions(model).map((option) => option.id)).toEqual(sorted(rawTechniques.map((technique) => technique.id)));
  });

  it('NISS: every step the registrar holds for a technique with a brain band, and on each linked technique of a region', () => {
    const expected = sorted(neuralTechniques.flatMap((technique) => (typeof technique.niss?.severity === 'string' ? [join(technique.id, technique.niss.severity)] : [])));
    expect(expected.length).toBeGreaterThan(50);
    expect(sorted(model.index.techniques.flatMap((technique) => (technique.niss_severity === null ? [] : [join(technique.id, technique.niss_severity)])))).toEqual(expected);
    const expectedOnRegions = sorted(rawRegions.flatMap((region) => litTechniquesOf(region.id).flatMap((techniqueId) => {
      const severity = rawTechniqueById.get(techniqueId)?.niss?.severity;
      return typeof severity === 'string' ? [join(region.id, techniqueId, severity)] : [];
    })));
    expect(expectedOnRegions.length).toBeGreaterThan(0);
    expect(exposed((detail, regionId) => detail.linked.flatMap((technique) => (technique.nissSeverity === null ? [] : [join(regionId, technique.id, technique.nissSeverity)])))).toEqual(expectedOnRegions);
  });

  it('DSM cluster tags: every tag the registrar files with a technique, as a lens subject and on each linked technique', () => {
    const expected = sorted(neuralTechniques.flatMap((technique) => (typeof technique.tara?.dsm5?.cluster === 'string' ? [join(technique.id, technique.tara.dsm5.cluster)] : [])));
    expect(expected.length).toBeGreaterThan(50);
    expect(sorted(model.index.techniques.flatMap((technique) => (technique.dsm_cluster === null ? [] : [join(technique.id, technique.dsm_cluster)])))).toEqual(expected);
    expect(listClusterOptions(model).map((option) => option.id)).toEqual(sorted(expected.map((pair) => pair.split(SEPARATOR)[1])));
  });

  it('DSM-5-TR category references filed with techniques: all of the registrar\'s, and on a region for each linked technique', () => {
    const expected = sorted(neuralTechniques.flatMap((technique) => dsmEntriesOf(technique).map((entry) => join(technique.id, entry.code, entry.name, entry.confidence))));
    expect(expected.length).toBeGreaterThan(500);
    expect(sorted([...model.dsmByTechnique].flatMap(([techniqueId, references]) => references.map((reference) => join(techniqueId, reference.code, reference.name, reference.confidence))))).toEqual(expected);
    const expectedOnRegions = sorted(rawRegions.flatMap((region) => litTechniquesOf(region.id).flatMap((techniqueId) =>
      dsmEntriesOf(rawTechniqueById.get(techniqueId) as RawTechnique).map((entry) => join(region.id, entry.code, entry.name, techniqueId)))));
    expect(expectedOnRegions.length).toBeGreaterThan(0);
    expect(exposedDsm((dsm, regionId) => dsm.viaTechniques.flatMap((reference) => reference.carriers.map((techniqueId) => join(regionId, reference.code, reference.name, techniqueId))))).toEqual(expectedOnRegions);
  });

  it('DSM-5-TR category references filed with pathways: on every region a pathway lists, matching the impact chains file', () => {
    const pathways = (pathwayFile as unknown as { pathways: RawPathway[] }).pathways;
    const memberships = pathways.flatMap((pathway) => sorted([...pathway.origin, ...pathway.targets].flatMap((endpoint) => {
      const resolved = resolveIndependently(endpoint);
      return resolved !== null && resolved.counts ? [resolved.regionId] : [];
    })).map((regionId) => ({ regionId, pathway })));
    const expected = sorted(memberships.flatMap(({ regionId, pathway }) => pathway.dsm_conditions.map((code, at) => join(regionId, code, pathway.dsm_names[at], pathway.name))));
    expect(expected.length).toBeGreaterThan(300);
    expect(exposedDsm((dsm, regionId) => dsm.viaPathways.flatMap((reference) => reference.carriers.map((pathwayName) => join(regionId, reference.code, reference.name, pathwayName))))).toEqual(expected);
    expect(exposedDsm((dsm, regionId) => dsm.pathwayNames.map((name) => join(regionId, name)))).toEqual(sorted(memberships.map(({ regionId, pathway }) => join(regionId, pathway.name))));

    const impactRows = JSON.parse(readFileSync(IMPACT_CHAINS_FILE, 'utf8')) as RawImpactRow[];
    const impactPairs = sorted(impactRows.map((row) => join(row.region_id, row.dsm_code)));
    expect(impactPairs.length).toBeGreaterThan(300);
    expect(exposedDsm((dsm, regionId) => dsm.viaPathways.map((reference) => join(regionId, reference.code)))).toEqual(impactPairs);
  });

  it('devices: every region a device record of the atlas file lists, in the inspector and as a lens subject', () => {
    const expected = sorted(atlas.device_region_mappings.flatMap((device) => device.target_regions.map((regionId) => join(regionId, device.device_id))));
    expect(expected.length).toBeGreaterThan(40);
    expect(exposed((detail, regionId) => detail.deviceIds.map((deviceId) => join(regionId, deviceId)))).toEqual(expected);
    expect(listDeviceOptions(model).map((option) => option.id)).toEqual(atlas.device_region_mappings.map((device) => device.device_id));
  });

  it('curated threat models: every step of every chain, lighting exactly the regions its technique is linked to', () => {
    const served = parseAtlasChains(JSON.parse(loadCompanionJson(ATLAS_CHAINS_PATH)));
    const steps = served.chains.flatMap((chain) => buildChainSteps(model, chain).map((step) => ({ chainId: chain.chain_id, step })));
    const expectedSteps = taraChains.chains.flatMap((chain) => chain.steps.map((step) => join(chain.chain_id, step.position, step.technique_id, step.action)));
    expect(expectedSteps.length).toBeGreaterThan(30);
    expect(steps.map(({ chainId, step }) => join(chainId, step.position, step.techniqueId, step.action))).toEqual(expectedSteps);
    const expectedLit = sorted(taraChains.chains.flatMap((chain) => chain.steps.flatMap((step) =>
      rawRegions.filter((region) => litTechniquesOf(region.id).includes(step.technique_id)).map((region) => join(chain.chain_id, step.position, region.id)))));
    expect(expectedLit.length).toBeGreaterThan(0);
    expect(sorted(steps.flatMap(({ chainId, step }) => step.litRegions.map((region) => join(chainId, step.position, region.id))))).toEqual(expectedLit);
  });
});
