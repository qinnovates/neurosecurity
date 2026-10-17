/**
 * The DSM-5-TR category references the datalake already files, copied for the
 * explorer: the ones the registrar files with each technique, and the ones the
 * pathway file files with each pathway, with the regions that file lists as a
 * pathway's start or end. Nothing is added, inferred or renamed here.
 *
 * They are diagnostic category references used for threat modelling, not
 * diagnostic claims. No function here ties a reference to a region: a region
 * reaches one only through a technique linked to it or a pathway listing it.
 */

import { PATHWAYS_FILE as PATHWAY_FILE, REGISTRAR_FILE } from '@/lib/anatomy/datalake-files';
import { AnatomyDataError } from '@/lib/anatomy/errors';
import { createTermResolver, lightsRegion } from '@/lib/anatomy/resolve-region-term';
import { isRecord } from '@/lib/threat-model/guards';


export const DSM_TIERS = ['primary', 'secondary'] as const;
export type DsmTier = typeof DSM_TIERS[number];

/** One reference as the registrar files it with a technique. `confidence` is the registrar's own word. */
export interface CatalogDsmReference {
  code: string;
  name: string;
  tier: DsmTier;
  confidence: string;
}

export interface CatalogTechniqueDsm {
  id: string;
  references: CatalogDsmReference[];
}

export interface CatalogPathwayDsm {
  code: string;
  name: string;
}

export interface CatalogPathway {
  id: string;
  name: string;
  /** The regions the pathway file names as the pathway's start or end, by id or by an alias the atlas file classes as a synonym. */
  region_ids: string[];
  dsm_references: CatalogPathwayDsm[];
}

function readText(record: Record<string, unknown>, key: string, file: string, location: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim().length === 0) throw new AnatomyDataError(file, `${location}.${key}`, 'expected text', `Add "${key}".`);
  return value;
}

function readTextList(record: Record<string, unknown>, key: string, file: string, location: string): string[] {
  const value = record[key];
  if (!Array.isArray(value) || !value.every((item): item is string => typeof item === 'string' && item.trim().length > 0)) {
    throw new AnatomyDataError(file, `${location}.${key}`, 'expected a list of text', `Restore the "${key}" list.`);
  }
  return value;
}

function readTier(dsm5: Record<string, unknown>, tier: DsmTier, location: string): CatalogDsmReference[] {
  const entries = dsm5[tier] ?? [];
  if (!Array.isArray(entries)) throw new AnatomyDataError(REGISTRAR_FILE, `${location}.${tier}`, 'expected a list', `Restore the "${tier}" list.`);
  return entries.map((entry, index) => {
    const entryLocation = `${location}.${tier}[${index}]`;
    if (!isRecord(entry)) throw new AnatomyDataError(REGISTRAR_FILE, entryLocation, 'expected an object', 'Give the reference a code, a name and a confidence.');
    return { code: readText(entry, 'code', REGISTRAR_FILE, entryLocation), name: readText(entry, 'name', REGISTRAR_FILE, entryLocation), tier, confidence: readText(entry, 'confidence', REGISTRAR_FILE, entryLocation) };
  });
}

/**
 * The references the registrar files with each of the given techniques, primary first, in file order. A technique the
 * registrar files none with is left out, so an entry always has at least one reference.
 *
 * @throws AnatomyDataError when a filed reference lacks its code, name or confidence
 */
export function readTechniqueDsm(registrar: unknown, techniqueIds: readonly string[]): CatalogTechniqueDsm[] {
  const techniques = isRecord(registrar) && Array.isArray(registrar.techniques) ? registrar.techniques.filter(isRecord) : [];
  const wanted = new Set(techniqueIds);
  return techniques.flatMap((technique) => {
    const { id } = technique;
    if (typeof id !== 'string' || !wanted.has(id)) return [];
    const dsm5 = isRecord(technique.tara) && isRecord(technique.tara.dsm5) ? technique.tara.dsm5 : null;
    const references = dsm5 === null ? [] : DSM_TIERS.flatMap((tier) => readTier(dsm5, tier, `technique ${id}.tara.dsm5`));
    return references.length === 0 ? [] : [{ id, references }];
  });
}

function resolveEndpoints(names: readonly string[], resolveTerm: ReturnType<typeof createTermResolver>, location: string): string[] {
  return names.map((name) => {
    const { resolved_region_id: regionId, resolution } = resolveTerm(name);
    if (regionId === null || !lightsRegion(resolution)) {
      throw new AnatomyDataError(PATHWAY_FILE, location, `"${name}" is not a region id or a synonym of one (it resolves as ${resolution})`,
        'Use a region id from the atlas file, or decide how a broader or narrower name should be shown before listing it.');
    }
    return regionId;
  });
}

function readPathway(pathway: Record<string, unknown>, index: number, resolveTerm: ReturnType<typeof createTermResolver>): CatalogPathway {
  const location = `pathways[${index}]`;
  const codes = readTextList(pathway, 'dsm_conditions', PATHWAY_FILE, location);
  const names = readTextList(pathway, 'dsm_names', PATHWAY_FILE, location);
  if (codes.length !== names.length) throw new AnatomyDataError(PATHWAY_FILE, location, 'dsm_conditions and dsm_names differ in length', 'Give every code its name, in the same order.');
  const endpoints = [...readTextList(pathway, 'origin', PATHWAY_FILE, location), ...readTextList(pathway, 'targets', PATHWAY_FILE, location)];
  return {
    id: readText(pathway, 'id', PATHWAY_FILE, location),
    name: readText(pathway, 'name', PATHWAY_FILE, location),
    region_ids: [...new Set(resolveEndpoints(endpoints, resolveTerm, location))],
    dsm_references: codes.map((code, at) => ({ code, name: names[at] })),
  };
}

/**
 * Every pathway of the pathway file with the regions it lists and the references it files, in file order.
 *
 * @throws AnatomyDataError when a pathway lacks a field, or names a start or end that is not a region id or a synonym of one
 */
export function readPathways(pathwayFile: unknown, atlas: unknown): CatalogPathway[] {
  const pathways = isRecord(pathwayFile) ? pathwayFile.pathways : undefined;
  if (!Array.isArray(pathways) || !pathways.every(isRecord)) throw new AnatomyDataError(PATHWAY_FILE, 'pathways', 'expected a list of objects', 'Restore the pathways list.');
  const resolveTerm = createTermResolver(atlas);
  return pathways.map((pathway, index) => readPathway(pathway, index, resolveTerm));
}
