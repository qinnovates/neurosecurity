/**
 * What the explorer needs from the catalog beyond the anatomy index: the name
 * of each QIF band, each region's description in the atlas file's own words,
 * the techniques that carry a device-side band, and the DSM-5-TR category
 * references the registrar files with techniques and the pathway file files
 * with pathways. Built once at build time, served as its own static file, and
 * parsed again by the page that fetches it.
 *
 * None of this is new anatomy: every word is copied from a datalake file.
 */

import { ATLAS_FILE } from '@/lib/anatomy/datalake-files';
import { AnatomyDataError } from '@/lib/anatomy/errors';
import { rootOf } from '@/lib/anatomy/field-readers';
import { readSchemaVersion } from '@/lib/anatomy/format-readers';
import { checkShape, shapes } from '@/lib/anatomy/shape-check';
import { BAND_ORDER, CATALOG_SEVERITIES, INTERFACE_BAND, SILICON_BANDS, type CatalogSeverity, type EngineData } from '@/lib/threat-model/catalog-types';
import { isRecord } from '@/lib/threat-model/guards';
import { DSM_TIERS, readPathways, readTechniqueDsm, type CatalogPathway, type CatalogTechniqueDsm } from './catalog-dsm';

export const EXPLORER_CATALOG_PATH = '/atlas/anatomy-catalog.json';
export const EXPLORER_CATALOG_SCHEMA_VERSION = 1;

/** The device side of the hourglass, application first, as the rail shows it. */
export const DEVICE_STAGE_BAND_IDS: readonly string[] = [...SILICON_BANDS, INTERFACE_BAND];

const MAX_ID_LENGTH = 120;
const MAX_TEXT_LENGTH = 600;

export interface CatalogBand {
  id: string;
  name: string;
  description: string;
}

export interface CatalogRegionText {
  id: string;
  /** The atlas file's own `function` field, word for word. */
  function: string;
}

export interface DeviceStageTechnique {
  id: string;
  name: string;
  band_ids: string[];
  severity: CatalogSeverity;
}

export interface ExplorerCatalog {
  schema_version: number;
  registrar_version: string;
  bands: CatalogBand[];
  regions: CatalogRegionText[];
  /** Every technique that carries a device-side band, whether or not it also carries a neural one. */
  device_stage_techniques: DeviceStageTechnique[];
  /** The references the registrar files with each technique that has a brain band. A technique with none is absent. */
  technique_dsm: CatalogTechniqueDsm[];
  /** Every pathway of the pathway file, with the regions it lists as a start or end and the references it files. */
  pathways: CatalogPathway[];
}

/** The datalake files the catalog copies its DSM-5-TR references from, as parsed JSON. */
export interface CatalogDsmSources {
  registrar: unknown;
  pathways: unknown;
}

const id = shapes.text(MAX_ID_LENGTH);
const text = shapes.text(MAX_TEXT_LENGTH);
const EXPLORER_CATALOG_SHAPE = shapes.record({
  schema_version: shapes.integer(EXPLORER_CATALOG_SCHEMA_VERSION),
  registrar_version: id,
  bands: shapes.list(shapes.record({ id: shapes.word(BAND_ORDER), name: text, description: text })),
  regions: shapes.list(shapes.record({ id, function: text })),
  device_stage_techniques: shapes.list(shapes.record({ id, name: text, band_ids: shapes.list(shapes.word(BAND_ORDER)), severity: shapes.word(CATALOG_SEVERITIES) })),
  technique_dsm: shapes.list(shapes.record({ id, references: shapes.list(shapes.record({ code: id, name: text, tier: shapes.word(DSM_TIERS), confidence: id })) })),
  pathways: shapes.list(shapes.record({ id, name: text, region_ids: shapes.list(id), dsm_references: shapes.list(shapes.record({ code: id, name: text })) })),
});

function readAtlasList(atlas: unknown, key: string): Record<string, unknown>[] {
  const list = isRecord(atlas) ? atlas[key] : undefined;
  if (!Array.isArray(list) || !list.every(isRecord)) throw new AnatomyDataError(ATLAS_FILE, key, 'expected a list of objects', `Restore the ${key} list.`);
  return list;
}

function readAtlasText(record: Record<string, unknown>, key: string, location: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim().length === 0) throw new AnatomyDataError(ATLAS_FILE, `${location}.${key}`, 'expected text', `Add "${key}".`);
  return value;
}

const NEURAL_BAND_PREFIX = 'N';

/** @throws AnatomyDataError when the atlas file lacks a band's name or a region's description, a filed reference is incomplete, or the result does not hold its shape */
export function buildExplorerCatalog(engineData: EngineData, atlas: unknown, dsmSources: CatalogDsmSources): ExplorerCatalog {
  const catalog: ExplorerCatalog = {
    schema_version: EXPLORER_CATALOG_SCHEMA_VERSION,
    registrar_version: engineData.registrarVersion,
    bands: readAtlasList(atlas, 'qif_bands').map((band, index) => ({
      id: readAtlasText(band, 'id', `qif_bands[${index}]`), name: readAtlasText(band, 'name', `qif_bands[${index}]`), description: readAtlasText(band, 'description', `qif_bands[${index}]`),
    })),
    regions: readAtlasList(atlas, 'brain_regions').map((region, index) => ({
      id: readAtlasText(region, 'id', `brain_regions[${index}]`), function: readAtlasText(region, 'function', `brain_regions[${index}]`),
    })),
    device_stage_techniques: engineData.techniques
      .filter((technique) => technique.bandIds.some((bandId) => DEVICE_STAGE_BAND_IDS.includes(bandId)))
      .map((technique) => ({ id: technique.id, name: technique.name, band_ids: technique.bandIds, severity: technique.severity })),
    technique_dsm: readTechniqueDsm(dsmSources.registrar, engineData.techniques.filter((technique) => technique.bandIds.some((bandId) => bandId.startsWith(NEURAL_BAND_PREFIX))).map((technique) => technique.id)),
    pathways: readPathways(dsmSources.pathways, atlas),
  };
  return parseExplorerCatalog(JSON.parse(JSON.stringify(catalog)));
}

/** @throws AnatomyDataError naming the first field that is wrong */
export function parseExplorerCatalog(raw: unknown): ExplorerCatalog {
  const root = rootOf(EXPLORER_CATALOG_PATH);
  checkShape(raw, EXPLORER_CATALOG_SHAPE, root);
  const catalog = raw as ExplorerCatalog;
  readSchemaVersion({ schema_version: catalog.schema_version }, root, EXPLORER_CATALOG_SCHEMA_VERSION);
  return catalog;
}
