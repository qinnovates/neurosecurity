/**
 * Joins the dossier's file to one region: what is filed under its band, the
 * devices that name it and the companies behind them, and what the techniques
 * shown for it carry. Each join says what it goes through, and none says more:
 * a hazard or a control is the band's, a company is there through a device, and
 * a CVE or a threat-model step is the technique's.
 *
 * Everything here reads null until the file has arrived, so an absent file can
 * never read as "none recorded".
 */

import type { IndexSubject, IndexTechnique } from '@/lib/anatomy/anatomy-index-types';
import type { IndexNeurorightCode } from '@/lib/anatomy/technique-tags';
import type { CatalogPathway } from './catalog-dsm';
import type {
  DeviceRelation, DossierBandControls, DossierChainStep, DossierCompany, DossierCondition, DossierDevice, DossierEvidenceTier, DossierHazard, EndpointNaming, RegionDossierFile,
} from './dossier-file';

/** How a technique's id is outlined. Never a colour: the mark must read in print and for a reader who sees no hue. */
export type TierMark = 'solid' | 'dashed' | 'dotted' | 'none';

const TIER_MARKS: Readonly<Record<DossierEvidenceTier, TierMark>> = {
  validated_rct: 'solid',
  validated_replication: 'solid',
  demonstrated_lab: 'solid',
  demonstrated_case: 'solid',
  theoretical_modeled: 'dashed',
  theoretical_proposed: 'dashed',
  speculative: 'dotted',
};

export interface TechniqueFacts {
  evidenceTier: DossierEvidenceTier | null;
  tierMark: TierMark;
  /** The catalog's detection guidance. Null is a coverage gap, and the page links the list of them. */
  control: string | null;
}

export interface DetailPathway {
  id: string;
  name: string;
  /** How the pathway file names this end. Null until the dossier's file has arrived. */
  naming: EndpointNaming | null;
}

export interface DetailNeuroright {
  techniqueId: string;
  code: string;
  name: string;
  /** The name of the right the registrar folds this code into, or null for a code that stands alone. Shown, never applied silently. */
  foldsInto: string | null;
}

export interface DetailCve {
  id: string;
  techniqueId: string;
}

export interface DetailCompany extends DossierCompany {
  /** The display names of its devices mapped to this region. */
  deviceNames: string[];
}

export type DetailDeviceGroup = { relation: DeviceRelation; devices: DossierDevice[] };

export interface DossierRecords {
  /** The name of the public layer the region's band belongs to. */
  layerName: string | null;
  controls: DossierBandControls[] | null;
  /** Names of the neural security layers filed under the region's band. */
  protectionLayers: string[] | null;
  hazards: DossierHazard[] | null;
  chainSteps: DossierChainStep[] | null;
  deviceGroups: DetailDeviceGroup[] | null;
  companies: DetailCompany[] | null;
  cves: DetailCve[] | null;
  conditions: DossierCondition[] | null;
}

const UNLOADED_RECORDS: DossierRecords = {
  layerName: null, controls: null, protectionLayers: null, hazards: null, chainSteps: null, deviceGroups: null, companies: null, cves: null, conditions: null,
};

/** The order a dossier lists devices in: what touches the tissue first. */
const DEVICE_GROUP_ORDER: readonly DeviceRelation[] = ['implanted_in', 'endovascular_adjacent_to', 'scalp_position_over', 'stimulates_afferent_to'];

export function readTechniqueFacts(file: RegionDossierFile | null, techniqueId: string): TechniqueFacts | null {
  const record = file?.techniques.find((technique) => technique.id === techniqueId);
  if (record === undefined) return null;
  return { evidenceTier: record.evidence_tier, tierMark: record.evidence_tier === null ? 'none' : TIER_MARKS[record.evidence_tier], control: record.detection };
}

export function readPathways(pathways: readonly CatalogPathway[], regionId: string, file: RegionDossierFile | null): DetailPathway[] {
  return pathways.map((pathway) => ({
    id: pathway.id,
    name: pathway.name,
    naming: file?.pathway_ends.find((end) => end.pathway_id === pathway.id && end.region_id === regionId)?.naming ?? null,
  }));
}

export function listTechniqueRights(techniques: readonly IndexTechnique[], taxonomy: readonly IndexNeurorightCode[]): DetailNeuroright[] {
  const rightsByCode = new Map(taxonomy.map((right) => [right.code, right]));
  return techniques.flatMap((technique) => (technique.neurorights?.affected ?? []).map((code) => {
    const right = rightsByCode.get(code);
    const foldsInto = right?.folds_into ?? null;
    return { techniqueId: technique.id, code, name: right?.name ?? code, foldsInto: foldsInto === null ? null : rightsByCode.get(foldsInto)?.name ?? foldsInto };
  }));
}

function groupDevices(devices: readonly DossierDevice[]): DetailDeviceGroup[] {
  return DEVICE_GROUP_ORDER.flatMap((relation) => {
    const inGroup = devices.filter((device) => device.relation === relation);
    return inGroup.length === 0 ? [] : [{ relation, devices: inGroup }];
  });
}

function listCompanies(devices: readonly DossierDevice[]): DetailCompany[] {
  const companies = new Map<string, DetailCompany>();
  for (const { company, name } of devices) {
    if (company === null) continue;
    const held = companies.get(company.name) ?? { ...company, deviceNames: [] };
    held.deviceNames.push(name);
    companies.set(company.name, held);
  }
  return [...companies.values()];
}

/**
 * @param techniqueIds every technique the dossier lists a row for, counted or not
 * @param pathwayIds the pathways whose record lists the region
 */
export function joinDossierRecords(file: RegionDossierFile | null, region: IndexSubject, techniqueIds: readonly string[], pathwayIds: readonly string[]): DossierRecords {
  if (file === null) return UNLOADED_RECORDS;
  const inRegionBand = (bandIds: readonly string[]): boolean => bandIds.some((bandId) => region.band_ids.includes(bandId));
  const devices = file.devices.filter((device) => device.region_ids.includes(region.id));
  const shownTechniques = new Set(techniqueIds);
  return {
    layerName: file.layers.find((layer) => layer.band_id === region.band_ids[0])?.layer_name ?? null,
    controls: file.controls.filter((controls) => region.band_ids.includes(controls.band_id)),
    protectionLayers: file.protection_layers.filter((layer) => inRegionBand(layer.band_ids)).map((layer) => layer.name),
    hazards: file.hazards.filter((hazard) => inRegionBand(hazard.band_ids)),
    chainSteps: file.chain_steps.filter((step) => shownTechniques.has(step.technique_id)),
    deviceGroups: groupDevices(devices),
    companies: listCompanies(devices),
    cves: file.techniques.filter((technique) => shownTechniques.has(technique.id)).flatMap((technique) => technique.cve_ids.map((id) => ({ id, techniqueId: technique.id }))),
    conditions: file.conditions.filter((condition) => condition.pathway_ids.some((pathwayId) => pathwayIds.includes(pathwayId))),
  };
}
