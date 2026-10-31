/**
 * What the region dossier shows beyond the index and the catalog: each band's
 * public layer, the controls and hazards filed by band, the device records with
 * their relation to a region, and the evidence tier, control and CVE precedents
 * of each technique that has a drafted link. Built once at build time, served
 * as its own static file, pinned by the anatomy index, and fetched only once a
 * region is opened. Every word is copied from a datalake file.
 *
 * A device's name is the landscape file's where one of its devices matches the
 * record, and otherwise the record's id made readable: `has_listed_name` says
 * which. No product name of a CVE is carried, only its id.
 */

import { rootOf } from '@/lib/anatomy/field-readers';
import { readSchemaVersion } from '@/lib/anatomy/format-readers';
import { checkShape, shapes } from '@/lib/anatomy/shape-check';
import type { EvidenceTierCode } from '@/lib/evidence-tiers';
import { CHAIN_ROLES, type ChainRole } from '@/lib/threat-model/chain-types';

export const REGION_DOSSIER_PATH = '/atlas/anatomy-dossier.json';
export const REGION_DOSSIER_SCHEMA_VERSION = 1;

export const EVIDENCE_TIER_CODES = [
  'validated_rct', 'validated_replication', 'demonstrated_lab', 'demonstrated_case', 'theoretical_modeled', 'theoretical_proposed', 'speculative',
] as const satisfies readonly EvidenceTierCode[];
export type DossierEvidenceTier = typeof EVIDENCE_TIER_CODES[number];

/** The atlas file's `device_region_relation_kinds`: what a device's region list means. */
export const DEVICE_RELATIONS = ['implanted_in', 'scalp_position_over', 'stimulates_afferent_to', 'endovascular_adjacent_to'] as const;
export type DeviceRelation = typeof DEVICE_RELATIONS[number];

export const INTERFACE_TYPES = ['read', 'write', 'bidirectional'] as const;
export type InterfaceType = typeof INTERFACE_TYPES[number];

/** How the pathway file names one end of a pathway. The file's own three words. */
export const ENDPOINT_NAMINGS = ['exact', 'container_stand_in', 'unreviewed'] as const;
export type EndpointNaming = typeof ENDPOINT_NAMINGS[number];

export interface DossierLayer {
  band_id: string;
  layer_id: string;
  layer_name: string;
}

export interface DossierBandControls {
  band_id: string;
  detection: string[];
  prevention: string[];
  response: string[];
}

export interface DossierProtectionLayer {
  name: string;
  band_ids: string[];
}

export interface DossierHazard {
  id: string;
  name: string;
  band_ids: string[];
}

export interface DossierCompany {
  name: string;
  type: string;
  status: string;
}

export interface DossierDevice {
  id: string;
  name: string;
  /** True when `name` is a device name from the landscape file; false when it is only `id` made readable. */
  has_listed_name: boolean;
  relation: DeviceRelation;
  interface_type: InterfaceType;
  region_ids: string[];
  /** Null when no company in the landscape file matches the record. */
  company: DossierCompany | null;
}

export interface DossierTechnique {
  id: string;
  evidence_tier: DossierEvidenceTier | null;
  /** The catalog's detection guidance, the one control recorded against a technique itself. */
  detection: string | null;
  /** NVD-verified CVE records mapped to the technique, ids only. */
  cve_ids: string[];
}

export interface DossierChainStep {
  technique_id: string;
  chain_id: string;
  chain_name: string;
  position: number;
  step_count: number;
  role: ChainRole;
}

export interface DossierPathwayEnd {
  pathway_id: string;
  region_id: string;
  naming: EndpointNaming;
}

export interface DossierCondition {
  code: string;
  name: string;
  pathway_ids: string[];
}

export interface RegionDossierFile {
  schema_version: number;
  layers: DossierLayer[];
  controls: DossierBandControls[];
  protection_layers: DossierProtectionLayer[];
  hazards: DossierHazard[];
  devices: DossierDevice[];
  techniques: DossierTechnique[];
  chain_steps: DossierChainStep[];
  pathway_ends: DossierPathwayEnd[];
  conditions: DossierCondition[];
}

const MAX_ID_LENGTH = 120;
const MAX_TEXT_LENGTH = 600;
const id = shapes.text(MAX_ID_LENGTH);
const text = shapes.text(MAX_TEXT_LENGTH);
const ids = shapes.list(id);
const texts = shapes.list(text);
const company = shapes.record({ name: text, type: id, status: id });

const REGION_DOSSIER_SHAPE = shapes.record({
  schema_version: shapes.integer(REGION_DOSSIER_SCHEMA_VERSION),
  layers: shapes.list(shapes.record({ band_id: id, layer_id: id, layer_name: text })),
  controls: shapes.list(shapes.record({ band_id: id, detection: texts, prevention: texts, response: texts })),
  protection_layers: shapes.list(shapes.record({ name: text, band_ids: ids })),
  hazards: shapes.list(shapes.record({ id, name: text, band_ids: ids })),
  devices: shapes.list(shapes.record({
    id, name: text, has_listed_name: shapes.boolean, relation: shapes.word(DEVICE_RELATIONS), interface_type: shapes.word(INTERFACE_TYPES), region_ids: ids, company: shapes.nullable(company),
  })),
  techniques: shapes.list(shapes.record({ id, evidence_tier: shapes.nullable(shapes.word(EVIDENCE_TIER_CODES)), detection: shapes.nullable(text), cve_ids: ids })),
  chain_steps: shapes.list(shapes.record({
    technique_id: id, chain_id: id, chain_name: text, position: shapes.integer(1), step_count: shapes.integer(1), role: shapes.word(CHAIN_ROLES),
  })),
  pathway_ends: shapes.list(shapes.record({ pathway_id: id, region_id: id, naming: shapes.word(ENDPOINT_NAMINGS) })),
  conditions: shapes.list(shapes.record({ code: id, name: text, pathway_ids: ids })),
});

/** @throws AnatomyDataError naming the first field that is wrong */
export function parseRegionDossier(raw: unknown): RegionDossierFile {
  const root = rootOf(REGION_DOSSIER_PATH);
  checkShape(raw, REGION_DOSSIER_SHAPE, root);
  const file = raw as RegionDossierFile;
  readSchemaVersion({ schema_version: file.schema_version }, root, REGION_DOSSIER_SCHEMA_VERSION);
  return file;
}
