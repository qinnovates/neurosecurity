/**
 * Maps the repository's raw data files onto the EngineData the engine consumes.
 * The raw files are passed in already parsed; nothing here reads from disk.
 */

import { CATALOG_SEVERITIES, type BrainRegion, type CatalogTactic, type CatalogTechnique, type EngineData, type PrecedentCve, type TechniqueMode } from './catalog-types';
import { ThreatModelDataError } from './errors';
import { isOneOf, isRecord, isStringArray } from './guards';

const REGISTRAR_FILE = 'datalake/qtara-registrar.json';
const ATLAS_FILE = 'datalake/qif-brain-bci-atlas.json';
const CVE_FILE = 'datalake/cve-technique-mapping.json';
const TECHNIQUE_MODES: readonly TechniqueMode[] = ['R', 'M', 'D'];

export interface RawEngineSources {
  registrar: unknown;
  atlas: unknown;
  cveMapping: unknown;
}

export interface EngineDataBundle {
  engineData: EngineData;
  tacticIds: Set<string>;
}

function requireList(container: unknown, key: string, dataFile: string): Record<string, unknown>[] {
  const list = isRecord(container) ? container[key] : undefined;
  if (!Array.isArray(list) || !list.every(isRecord)) {
    throw new ThreatModelDataError(dataFile, `expected a "${key}" list of objects`);
  }
  return list;
}

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  return asText(record[key]);
}

function readNested(record: Record<string, unknown>, ...path: string[]): unknown {
  return path.reduce<unknown>((current, key) => (isRecord(current) ? current[key] : undefined), record);
}

function asCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

type EvidenceFields = Pick<CatalogTechnique,
  'evidenceTier' | 'evidenceBasis' | 'evidencePopulation' | 'neuralProductCveCount' | 'adjacentCveCount' | 'evidenceDerivedBy' | 'evidenceDerivedOn'>;

/** The catalog's `evidence` record, field for field. Nothing is filled in when a field is absent. */
function toEvidenceFields(raw: Record<string, unknown>): EvidenceFields {
  const evidence = isRecord(raw.evidence) ? raw.evidence : {};
  return {
    evidenceTier: asText(evidence.tier),
    evidenceBasis: asText(evidence.basis),
    evidencePopulation: asText(evidence.population),
    neuralProductCveCount: asCount(evidence.neural_product_cve_count),
    adjacentCveCount: asCount(evidence.adjacent_cve_count),
    evidenceDerivedBy: asText(evidence.derived_by),
    evidenceDerivedOn: asText(evidence.derived_on),
  };
}

function toTechnique(raw: Record<string, unknown>, index: number): CatalogTechnique {
  const id = readString(raw, 'id');
  const tactic = readString(raw, 'tactic');
  if (id === null || tactic === null || !isStringArray(raw.band_ids) || !isOneOf(raw.severity, CATALOG_SEVERITIES)) {
    throw new ThreatModelDataError(REGISTRAR_FILE, `techniques[${index}] is missing id, tactic, band_ids, or a known severity`);
  }
  const nissScore = readNested(raw, 'niss', 'score');
  const relatedIds = readNested(raw, 'cross_references', 'related_ids');
  const requirementCodes = readNested(raw, 'regulatory', 'fdora_524b', 'applicable_requirements');
  const detection = readNested(raw, 'tara', 'engineering', 'detection');
  const cvssVector = readNested(raw, 'cvss', 'base_vector');
  const nissVector = readNested(raw, 'niss', 'vector');
  return {
    id,
    name: readString(raw, 'attack') ?? id,
    tactic,
    bandIds: raw.band_ids,
    evidenceStatus: readString(raw, 'status') ?? 'UNSPECIFIED',
    ...toEvidenceFields(raw),
    sources: isStringArray(raw.sources) ? raw.sources : [],
    severity: raw.severity,
    mode: isOneOf(raw.tara_mode, TECHNIQUE_MODES) ? raw.tara_mode : null,
    domain: readString(raw, 'tara_domain_primary'),
    coupling: readString(raw, 'coupling'),
    cvssBaseVector: asText(cvssVector),
    nissScore: typeof nissScore === 'number' ? nissScore : null,
    nissVector: asText(nissVector),
    alias: readString(raw, 'tara_alias'),
    relatedTechniqueIds: isStringArray(relatedIds) ? relatedIds : [],
    detection: asText(detection),
    fdaRequirementCodes: isStringArray(requirementCodes) ? requirementCodes : [],
  };
}

function toRegion(raw: Record<string, unknown>, index: number): BrainRegion {
  const id = readString(raw, 'id');
  const name = readString(raw, 'name');
  const bandId = readString(raw, 'qif_band');
  if (id === null || name === null || bandId === null) {
    throw new ThreatModelDataError(ATLAS_FILE, `brain_regions[${index}] is missing id, name, or qif_band`);
  }
  return { id, name, bandId, depthClass: readString(raw, 'depth_class') ?? 'unspecified' };
}

function toPrecedentCve(raw: Record<string, unknown>, index: number): PrecedentCve {
  const cveId = readString(raw, 'cve_id');
  if (cveId === null || !isStringArray(raw.tara_techniques)) {
    throw new ThreatModelDataError(CVE_FILE, `mappings[${index}] is missing cve_id or tara_techniques`);
  }
  const cvssScore = readNested(raw, 'cvss', 'score');
  return {
    cveId,
    product: readString(raw, 'product') ?? 'Unspecified product',
    description: readString(raw, 'description') ?? '',
    cvssScore: typeof cvssScore === 'number' ? cvssScore : null,
    techniqueIds: raw.tara_techniques,
  };
}

export function buildEngineData(sources: RawEngineSources): EngineDataBundle {
  const { registrar, atlas, cveMapping } = sources;
  const registrarVersion = isRecord(registrar) ? readString(registrar, 'version') : null;
  const cveGenerated = isRecord(cveMapping) ? readString(cveMapping, 'generated') : null;
  if (registrarVersion === null) throw new ThreatModelDataError(REGISTRAR_FILE, 'expected a "version" string');
  if (cveGenerated === null) throw new ThreatModelDataError(CVE_FILE, 'expected a "generated" date');

  const tactics = requireList(registrar, 'tactics', REGISTRAR_FILE).flatMap((tactic): CatalogTactic[] => {
    const id = readString(tactic, 'id');
    return id === null ? [] : [{ id, name: readString(tactic, 'name') ?? id, description: readString(tactic, 'description') ?? '' }];
  });
  const tacticIds = tactics.map((tactic) => tactic.id);

  return {
    tacticIds: new Set(tacticIds),
    engineData: {
      registrarVersion,
      tactics,
      techniques: requireList(registrar, 'techniques', REGISTRAR_FILE).map(toTechnique),
      regions: requireList(atlas, 'brain_regions', ATLAS_FILE).map(toRegion),
      precedentCves: requireList(cveMapping, 'mappings', CVE_FILE).map(toPrecedentCve),
      precedentCvesAsOf: cveGenerated,
    },
  };
}
