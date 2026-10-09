/**
 * Parses every anatomy data file in dependency order and returns one validated
 * bundle. Nothing here reads from disk: the raw file contents are passed in, so
 * the build and the tests run exactly the same checks.
 */

import { isRecord, isStringArray } from '@/lib/threat-model/guards';
import type { EngineData } from '@/lib/threat-model/catalog-types';
import { currentAddressingVersion } from './addressing-version';
import type { Crosswalk, CrosswalkContext, LabelTable, SubjectKind, TechniqueRegions } from './anatomy-types';
import { AnatomyDataError } from './errors';
import { LICENCE_FACTS, assessBuildability, effectiveLicenceId, type Buildability } from './licence-rules';
import type { AssetManifest } from './manifest-types';
import { parseCrosswalk } from './parse-crosswalk';
import { parseDeviceGeometry, type DeviceGeometry } from './parse-device-geometry';
import { parseLabelTable } from './parse-label-table';
import { parseManifest } from './parse-manifest';
import { parseReviewLedger, type ReviewLedger, type ReviewerRole } from './parse-review-ledger';
import { parseSources } from './parse-sources';
import { REGISTRAR_FILE, parseTechniqueRegions } from './parse-technique-regions';
import { findReview } from './review-state';
import { parseVerdicts } from './parse-verdicts';
import type { AnatomySources, LicenceId, LicenceVerdict, LicenceVerdicts } from './source-types';

export const ATLAS_FILE = 'datalake/qif-brain-bci-atlas.json';
export const PATHWAYS_FILE = 'datalake/qif-neural-pathways.json';
const NETWORK_PATHWAY_TYPE = 'cortical_network';
const AGREEMENT_ACCEPTING_ROLE: ReviewerRole = 'owner';
const NEURAL_BAND_PREFIX = 'N';
const LABEL_TABLE_FOLDER_PATTERN = /^src\/site\/atlas-assets\/(open|by-sa)\/labels-[a-z0-9_]+\.json$/;

/** The raw contents of every file the anatomy build reads. `engineData` is the already validated catalog. */
export interface RawAnatomyFiles {
  engineData: EngineData;
  registrar: unknown;
  atlas: unknown;
  pathways: unknown;
  sources: unknown;
  verdicts: unknown;
  reviewLedger: unknown;
  crosswalk: unknown;
  techniqueRegions: unknown;
  deviceGeometry: unknown;
  /** Null until the offline pipeline has written a manifest. */
  manifest: unknown | null;
  /** Repository path -> label table contents, one per atlas the pipeline has built. */
  labelTablesByPath: Readonly<Record<string, unknown>>;
}

export interface AnatomyData {
  engineData: EngineData;
  atlas: unknown;
  addressingVersion: number;
  subjectNames: Record<SubjectKind, Map<string, string>>;
  sources: AnatomySources;
  verdicts: LicenceVerdicts;
  verdictBySource: Map<string, LicenceVerdict>;
  buildabilityBySource: Map<string, Buildability>;
  effectiveLicenceBySource: Map<string, LicenceId>;
  ledger: ReviewLedger;
  manifest: AssetManifest | null;
  labelTables: Map<string, LabelTable>;
  crosswalk: Crosswalk;
  techniqueRegions: TechniqueRegions;
  deviceGeometry: DeviceGeometry;
  /** The files a source reference may quote, by repository path. */
  documentsByFile: Map<string, unknown>;
}

function readPathwaySubjects(pathways: unknown): Pick<Record<SubjectKind, Map<string, string>>, 'pathway' | 'network'> {
  const list = isRecord(pathways) ? pathways.pathways : undefined;
  if (!Array.isArray(list)) throw new AnatomyDataError(PATHWAYS_FILE, 'pathways', 'expected a list of pathways', 'Restore the pathways list.');
  const subjects = { pathway: new Map<string, string>(), network: new Map<string, string>() };
  for (const [index, pathway] of list.entries()) {
    if (!isRecord(pathway) || typeof pathway.id !== 'string' || typeof pathway.name !== 'string' || typeof pathway.type !== 'string') {
      throw new AnatomyDataError(PATHWAYS_FILE, `pathways[${index}]`, 'expected an id, a name and a type', 'Add the missing field.');
    }
    subjects[pathway.type === NETWORK_PATHWAY_TYPE ? 'network' : 'pathway'].set(pathway.id, pathway.name);
  }
  return subjects;
}

function readRegionAliases(atlas: unknown): Set<string> {
  const aliases = isRecord(atlas) && isRecord(atlas.region_aliases) ? atlas.region_aliases : {};
  return new Set(Object.keys(aliases));
}

/**
 * A source behind an access agreement counts as accepted only when the ledger
 * holds an entry for that exact text made in the owner's role. Nobody else can
 * accept an agreement on the owner's behalf.
 */
export function isAgreementAccepted(verdict: LicenceVerdict, ledger: ReviewLedger): boolean {
  const textDigest = verdict.access_agreement?.text_sha256 ?? null;
  if (textDigest === null) return false;
  const acceptance = findReview(ledger, 'agreement', verdict.source_id, textDigest);
  return acceptance.state === 'reviewed' && acceptance.reviewer_role === AGREEMENT_ACCEPTING_ROLE;
}

function parseLabelTables(
  tablesByPath: Readonly<Record<string, unknown>>, sources: AnatomySources, effectiveLicence: ReadonlyMap<string, LicenceId>, buildability: ReadonlyMap<string, Buildability>,
): Map<string, LabelTable> {
  const sourceIds = new Set(sources.sources.map((source) => source.id));
  const tables = new Map<string, LabelTable>();
  for (const [filePath, raw] of Object.entries(tablesByPath)) {
    const table = parseLabelTable(raw, filePath, sourceIds);
    const folder = LABEL_TABLE_FOLDER_PATTERN.exec(filePath)?.[1];
    const requiredFolder = LICENCE_FACTS[effectiveLicence.get(table.atlas) as LicenceId].output_folder;
    if (buildability.get(table.atlas)?.buildable !== true || folder === undefined || folder !== requiredFolder) {
      throw new AnatomyDataError(filePath, 'atlas', `a label table for "${table.atlas}" may not ship from this folder`,
        `Label tables ship only for buildable sources, from the folder their licence requires ("${String(requiredFolder)}/").`);
    }
    tables.set(table.atlas, table);
  }
  return tables;
}

function listNeuralTechniqueIds(engineData: EngineData): Set<string> {
  return new Set(engineData.techniques.filter((technique) => technique.bandIds.some((bandId) => bandId.startsWith(NEURAL_BAND_PREFIX))).map((technique) => technique.id));
}

function readManifestInputs(sources: AnatomySources): Map<string, LicenceId> {
  return new Map(sources.sources.map((source) => [source.id, source.licence_id]));
}

function buildCrosswalkContext(
  raw: RawAnatomyFiles, sources: AnatomySources, buildability: ReadonlyMap<string, Buildability>, labelTables: Map<string, LabelTable>,
  subjectNames: Record<SubjectKind, Map<string, string>>,
): CrosswalkContext {
  return {
    subjectNames,
    regionAliases: readRegionAliases(raw.atlas),
    delineationBasisByAtlas: new Map(sources.sources.map((source) => [source.id, source.delineation.basis])),
    buildableAtlasIds: new Set([...buildability].filter(([, result]) => result.buildable).map(([sourceId]) => sourceId)),
    labelTables,
  };
}

function listDocuments(raw: RawAnatomyFiles): Map<string, unknown> {
  return new Map<string, unknown>([
    [REGISTRAR_FILE, raw.registrar], [ATLAS_FILE, raw.atlas], [PATHWAYS_FILE, raw.pathways], ...Object.entries(raw.labelTablesByPath),
  ]);
}

export function parseAnatomyFiles(raw: RawAnatomyFiles): AnatomyData {
  const sources = parseSources(raw.sources);
  const verdicts = parseVerdicts(raw.verdicts, sources);
  const ledger = parseReviewLedger(raw.reviewLedger);
  const verdictBySource = new Map(verdicts.verdicts.map((verdict) => [verdict.source_id, verdict]));
  const judged = sources.sources.map((source) => ({ source, verdict: verdictBySource.get(source.id) as LicenceVerdict }));
  const buildabilityBySource = new Map(judged.map(({ source, verdict }) =>
    [source.id, assessBuildability(source, verdict, { agreementAccepted: isAgreementAccepted(verdict, ledger) })]));
  const effectiveLicenceBySource = new Map(judged.map(({ source, verdict }) => [source.id, effectiveLicenceId(source, verdict)]));
  const labelTables = parseLabelTables(raw.labelTablesByPath, sources, effectiveLicenceBySource, buildabilityBySource);
  const subjectNames = { region: new Map(raw.engineData.regions.map((region) => [region.id, region.name])), ...readPathwaySubjects(raw.pathways) };
  const crosswalkContext = buildCrosswalkContext(raw, sources, buildabilityBySource, labelTables, subjectNames);
  const manifest = raw.manifest === null ? null : parseManifest(raw.manifest, {
    declaredSpace: sources.declared_space,
    statedLicenceBySource: readManifestInputs(sources),
    effectiveLicenceBySource,
    buildableSourceIds: crosswalkContext.buildableAtlasIds,
  });
  return {
    engineData: raw.engineData,
    atlas: raw.atlas,
    addressingVersion: currentAddressingVersion(raw.atlas),
    subjectNames,
    sources,
    verdicts,
    verdictBySource,
    buildabilityBySource,
    effectiveLicenceBySource,
    ledger,
    manifest,
    labelTables,
    crosswalk: parseCrosswalk(raw.crosswalk, crosswalkContext),
    techniqueRegions: parseTechniqueRegions(raw.techniqueRegions, listNeuralTechniqueIds(raw.engineData)),
    deviceGeometry: parseDeviceGeometry(raw.deviceGeometry, sources.declared_space),
    documentsByFile: listDocuments(raw),
  };
}

/** The registrar's own fields that the engine catalog does not carry: NISS's severity word and the DSM cluster tag. */
export function readTechniqueTags(registrar: unknown, techniqueId: string): { niss_severity: string | null; dsm_cluster: string | null } {
  const techniques = isRecord(registrar) && Array.isArray(registrar.techniques) ? registrar.techniques : [];
  const technique = techniques.find((candidate) => isRecord(candidate) && candidate.id === techniqueId);
  const niss = isRecord(technique) && isRecord(technique.niss) ? technique.niss.severity : undefined;
  const tara = isRecord(technique) && isRecord(technique.tara) && isRecord(technique.tara.dsm5) ? technique.tara.dsm5.cluster : undefined;
  return { niss_severity: typeof niss === 'string' ? niss : null, dsm_cluster: typeof tara === 'string' ? tara : null };
}

/** The regions each device's own record in the atlas file names. An id that is not a region stops the build. */
export function readStatedTargets(atlas: unknown, regionIds: ReadonlySet<string>): Array<{ device_id: string; region_ids: string[] }> {
  const mappings = isRecord(atlas) && Array.isArray(atlas.device_region_mappings) ? atlas.device_region_mappings : [];
  return mappings.map((mapping, index) => {
    const location = `device_region_mappings[${index}]`;
    if (!isRecord(mapping) || typeof mapping.device_id !== 'string' || !isStringArray(mapping.target_regions)) {
      throw new AnatomyDataError(ATLAS_FILE, location, 'expected a device_id and a target_regions list', 'Add the missing field.');
    }
    const strayId = mapping.target_regions.find((regionId) => !regionIds.has(regionId));
    if (strayId !== undefined) throw new AnatomyDataError(ATLAS_FILE, location, `"${strayId}" is not a region id`, 'Use a canonical id from brain_regions.');
    return { device_id: mapping.device_id, region_ids: mapping.target_regions };
  });
}
