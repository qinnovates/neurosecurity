/**
 * Build time only. The atlas file's device records with what the hardware
 * inventory and the landscape file say about them. The inventory shares the
 * atlas's ids, so a device's name is the inventory's and a record it does not
 * hold stops the build. The landscape file shares no key with the atlas: it
 * names a company, and `bci_devices` in the atlas is a pointer string, not a
 * list. So a company is matched by rule, and a record the rule does not match
 * has no company. No name is written by hand and none is guessed.
 *
 * The rule: the slug's first word must be a word of exactly one company's name.
 */

import { ATLAS_FILE } from '@/lib/anatomy/datalake-files';
import { AnatomyDataError } from '@/lib/anatomy/errors';
import { isRecord } from '@/lib/threat-model/guards';
import { DEVICE_RELATIONS, INTERFACE_TYPES, type DeviceRelation, type DossierCompany, type DossierDevice, type InterfaceType } from './dossier-file';

const LANDSCAPE_FILE = 'datalake/bci-landscape.json';
const HARDWARE_FILE = 'src/site/bci-hardware-inventory.json';
const SLUG_SEPARATOR = '-';
const NOT_ALPHANUMERIC = /[^a-z0-9]+/;
const PUNCTUATION_INSIDE_A_WORD = /\./g;

function fail(file: string, location: string, problem: string, fix: string): never {
  throw new AnatomyDataError(file, location, problem, fix);
}

function readText(record: Record<string, unknown>, key: string, file: string, location: string): string {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : fail(file, `${location}.${key}`, 'expected text', `Add "${key}".`);
}

function readList(record: unknown, key: string, file: string): Record<string, unknown>[] {
  const list = isRecord(record) ? record[key] : undefined;
  return Array.isArray(list) && list.every(isRecord) ? list : fail(file, key, 'expected a list of objects', `Restore the ${key} list.`);
}

function toWords(name: string): string[] {
  return name.toLowerCase().replace(PUNCTUATION_INSIDE_A_WORD, '').split(NOT_ALPHANUMERIC).filter((word) => word.length > 0);
}

function readLandscapeCompanies(landscape: unknown): DossierCompany[] {
  return readList(landscape, 'companies', LANDSCAPE_FILE).map((company, index) => {
    const location = `companies[${index}]`;
    return {
      name: readText(company, 'name', LANDSCAPE_FILE, location),
      type: readText(company, 'type', LANDSCAPE_FILE, location),
      status: readText(company, 'status', LANDSCAPE_FILE, location),
    };
  });
}

function readInventoryNames(hardware: unknown): Map<string, string> {
  return new Map(readList(hardware, 'devices', HARDWARE_FILE).map((device, index) => {
    const location = `devices[${index}]`;
    return [readText(device, 'id', HARDWARE_FILE, location), readText(device, 'device_name', HARDWARE_FILE, location)];
  }));
}

/** The company a slug matches. An ambiguous match is no match: nothing is chosen between two candidates. */
export function matchLandscapeCompany(deviceId: string, companies: readonly DossierCompany[]): DossierCompany | null {
  const [firstWord] = deviceId.split(SLUG_SEPARATOR);
  const candidates = companies.filter((company) => toWords(company.name).includes(firstWord));
  return candidates.length === 1 ? candidates[0] : null;
}

function readChoice<Choice extends string>(record: Record<string, unknown>, key: string, allowed: readonly Choice[], location: string): Choice {
  const value = readText(record, key, ATLAS_FILE, location);
  return (allowed as readonly string[]).includes(value) ? value as Choice : fail(ATLAS_FILE, `${location}.${key}`, `"${value}" is not one of ${allowed.join(', ')}`, 'Use one of the listed words.');
}

function readRegionIds(mapping: Record<string, unknown>, location: string): string[] {
  const { target_regions: regionIds } = mapping;
  return Array.isArray(regionIds) && regionIds.every((regionId) => typeof regionId === 'string') ? regionIds : fail(ATLAS_FILE, `${location}.target_regions`, 'expected a list of region ids', 'Restore the list.');
}

/** @throws AnatomyDataError when a device record or a company lacks a field, the inventory does not hold a record's id, or a record's relation or interface is not a known word */
export function buildDossierDevices(atlas: unknown, landscape: unknown, hardware: unknown): DossierDevice[] {
  const companies = readLandscapeCompanies(landscape);
  const namesById = readInventoryNames(hardware);
  return readList(atlas, 'device_region_mappings', ATLAS_FILE).map((mapping, index) => {
    const location = `device_region_mappings[${index}]`;
    const id = readText(mapping, 'device_id', ATLAS_FILE, location);
    const name = namesById.get(id) ?? fail(HARDWARE_FILE, 'devices', `no device has the id "${id}" that ${ATLAS_FILE} uses`, 'Add the device to the inventory or correct the id.');
    const relation: DeviceRelation = readChoice(mapping, 'region_relation', DEVICE_RELATIONS, location);
    const interfaceType: InterfaceType = readChoice(mapping, 'interface_type', INTERFACE_TYPES, location);
    return { id, name, relation, interface_type: interfaceType, region_ids: readRegionIds(mapping, location), company: matchLandscapeCompany(id, companies) };
  });
}
