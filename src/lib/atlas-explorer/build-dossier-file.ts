/**
 * Build time only. Copies what the region dossier shows out of the datalake
 * files into the one static file the page fetches. Nothing is inferred here: a
 * band keeps its own controls and hazards, a technique its own tier, detection
 * guidance and CVE ids, and a pathway end the naming word the pathway file gives
 * it. The result is held to the served file's shape, so a wrong type in a
 * datalake file stops the build.
 */

import { PATHWAYS_FILE } from '@/lib/anatomy/datalake-files';
import { AnatomyDataError } from '@/lib/anatomy/errors';
import { createTermResolver } from '@/lib/anatomy/resolve-region-term';
import { BAND_ORDER, type EngineData } from '@/lib/threat-model/catalog-types';
import { isRecord } from '@/lib/threat-model/guards';
import { buildDossierDevices } from './build-dossier-devices';
import type { AtlasChains } from './chain-file';
import {
  ENDPOINT_NAMINGS, REGION_DOSSIER_SCHEMA_VERSION, parseRegionDossier,
  type DossierBandControls, type DossierChainStep, type DossierCondition, type DossierHazard, type DossierPathwayEnd, type DossierProtectionLayer, type DossierTechnique, type EndpointNaming, type RegionDossierFile,
} from './dossier-file';

const CONTROLS_FILE = 'datalake/qif-security-controls.json';
const HAZARDS_FILE = 'datalake/qif-hazards.json';
const NEUROLOGICAL_FILE = 'datalake/qif-neurological-mappings.json';

export interface DossierSources {
  atlas: unknown;
  landscape: unknown;
  controls: unknown;
  hazards: unknown;
  pathways: unknown;
  neurological: unknown;
  chains: AtlasChains;
}

/** The public layer (or the seam) of a band id, as `layerOf` in src/lib/qif-constants.ts answers it. Passed in, because that module imports data files. */
export type DescribeBandLayer = (bandId: string) => { id: string; name: string };

function fail(file: string, location: string, problem: string, fix: string): never {
  throw new AnatomyDataError(file, location, problem, fix);
}

function readList(record: unknown, key: string, file: string): Record<string, unknown>[] {
  const list = isRecord(record) ? record[key] : undefined;
  return Array.isArray(list) && list.every(isRecord) ? list : fail(file, key, 'expected a list of objects', `Restore the ${key} list.`);
}

function readText(record: Record<string, unknown>, key: string, file: string, location: string): string {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : fail(file, `${location}.${key}`, 'expected text', `Add "${key}".`);
}

function readTextList(value: unknown, file: string, location: string): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : fail(file, location, 'expected a list of text', 'Restore the list.');
}

function readBandControls(controls: unknown): DossierBandControls[] {
  const byBand = isRecord(controls) && isRecord(controls.controls_by_band) ? controls.controls_by_band : fail(CONTROLS_FILE, 'controls_by_band', 'expected an object', 'Restore controls_by_band.');
  return BAND_ORDER.map((bandId) => {
    const kinds = byBand[bandId];
    const location = `controls_by_band.${bandId}`;
    if (!isRecord(kinds)) fail(CONTROLS_FILE, location, 'the band has no controls entry', 'Add the band; write an empty list where nothing is recorded.');
    return {
      band_id: bandId,
      detection: readTextList(kinds.detection, CONTROLS_FILE, `${location}.detection`),
      prevention: readTextList(kinds.prevention, CONTROLS_FILE, `${location}.prevention`),
      response: readTextList(kinds.response, CONTROLS_FILE, `${location}.response`),
    };
  });
}

function readProtectionLayers(controls: unknown): DossierProtectionLayer[] {
  return readList(controls, 'nsp_layers', CONTROLS_FILE).map((layer, index) => ({
    name: readText(layer, 'name', CONTROLS_FILE, `nsp_layers[${index}]`),
    band_ids: readTextList(layer.bands, CONTROLS_FILE, `nsp_layers[${index}].bands`),
  }));
}

function readHazards(hazards: unknown): DossierHazard[] {
  return readList(hazards, 'hazards', HAZARDS_FILE).map((hazard, index) => ({
    id: readText(hazard, 'id', HAZARDS_FILE, `hazards[${index}]`),
    name: readText(hazard, 'name', HAZARDS_FILE, `hazards[${index}]`),
    band_ids: readTextList(hazard.bands, HAZARDS_FILE, `hazards[${index}].bands`),
  }));
}

function readConditions(neurological: unknown): DossierCondition[] {
  return readList(neurological, 'conditions', NEUROLOGICAL_FILE).map((condition, index) => ({
    code: readText(condition, 'code', NEUROLOGICAL_FILE, `conditions[${index}]`),
    name: readText(condition, 'name', NEUROLOGICAL_FILE, `conditions[${index}]`),
    pathway_ids: readTextList(condition.pathway_ids, NEUROLOGICAL_FILE, `conditions[${index}].pathway_ids`),
  }));
}

function buildTechniques(engineData: EngineData, linkedTechniqueIds: ReadonlySet<string>): DossierTechnique[] {
  const verifiedCves = engineData.precedentCves.filter((cve) => cve.isNvdVerified);
  return engineData.techniques.filter((technique) => linkedTechniqueIds.has(technique.id)).map((technique) => ({
    id: technique.id,
    evidence_tier: technique.evidenceTier as DossierTechnique['evidence_tier'],
    detection: technique.detection,
    cve_ids: verifiedCves.filter((cve) => cve.techniqueIds.includes(technique.id)).map((cve) => cve.cveId),
  }));
}

function buildChainSteps(chains: AtlasChains, linkedTechniqueIds: ReadonlySet<string>): DossierChainStep[] {
  return chains.chains.flatMap((chain) => chain.steps.filter((step) => linkedTechniqueIds.has(step.technique_id)).map((step) => ({
    technique_id: step.technique_id, chain_id: chain.chain_id, chain_name: chain.chain_name, position: step.position, step_count: chain.steps.length, role: step.role,
  })));
}

function readEndNames(pathway: Record<string, unknown>, side: 'origin' | 'targets', location: string): Array<[string, EndpointNaming]> {
  const names = readTextList(pathway[side], PATHWAYS_FILE, `${location}.${side}`);
  const namings = isRecord(pathway.endpoint_naming) ? readTextList(pathway.endpoint_naming[side], PATHWAYS_FILE, `${location}.endpoint_naming.${side}`) : [];
  if (namings.length !== names.length) fail(PATHWAYS_FILE, `${location}.endpoint_naming.${side}`, `${namings.length} naming words for ${names.length} names`, 'Give every end one word.');
  return names.map((name, at) => {
    const naming = namings[at] as EndpointNaming;
    if (!ENDPOINT_NAMINGS.includes(naming)) fail(PATHWAYS_FILE, `${location}.endpoint_naming.${side}[${at}]`, `"${naming}" is not a naming word`, `Use one of ${ENDPOINT_NAMINGS.join(', ')}.`);
    return [name, naming];
  });
}

/** One row per pathway and region. A region named at both ends keeps the weaker word, so one exact end cannot vouch for the other. */
function buildPathwayEnds(pathways: unknown, atlas: unknown): DossierPathwayEnd[] {
  const resolveTerm = createTermResolver(atlas);
  return readList(pathways, 'pathways', PATHWAYS_FILE).flatMap((pathway, index) => {
    const location = `pathways[${index}]`;
    const ends = new Map<string, EndpointNaming>();
    for (const [name, naming] of [...readEndNames(pathway, 'origin', location), ...readEndNames(pathway, 'targets', location)]) {
      const regionId = resolveTerm(name).resolved_region_id;
      if (regionId === null) continue;
      const held = ends.get(regionId);
      if (held === undefined || ENDPOINT_NAMINGS.indexOf(naming) > ENDPOINT_NAMINGS.indexOf(held)) ends.set(regionId, naming);
    }
    const pathwayId = readText(pathway, 'id', PATHWAYS_FILE, location);
    return [...ends].map(([regionId, naming]) => ({ pathway_id: pathwayId, region_id: regionId, naming }));
  });
}

/**
 * @param linkedTechniqueIds the techniques with a drafted link: the only ones a dossier lists a row for, so the others stay out of the file
 * @throws AnatomyDataError when a datalake file lacks a list or a field, or the result does not hold its shape
 */
export function buildRegionDossierFile(engineData: EngineData, sources: DossierSources, describeLayer: DescribeBandLayer, linkedTechniqueIds: ReadonlySet<string>): RegionDossierFile {
  const file: RegionDossierFile = {
    schema_version: REGION_DOSSIER_SCHEMA_VERSION,
    layers: BAND_ORDER.map((bandId) => { const layer = describeLayer(bandId); return { band_id: bandId, layer_id: layer.id, layer_name: layer.name }; }),
    controls: readBandControls(sources.controls),
    protection_layers: readProtectionLayers(sources.controls),
    hazards: readHazards(sources.hazards),
    devices: buildDossierDevices(sources.atlas, sources.landscape),
    techniques: buildTechniques(engineData, linkedTechniqueIds),
    chain_steps: buildChainSteps(sources.chains, linkedTechniqueIds),
    pathway_ends: buildPathwayEnds(sources.pathways, sources.atlas),
    conditions: readConditions(sources.neurological),
  };
  return parseRegionDossier(JSON.parse(JSON.stringify(file)));
}
