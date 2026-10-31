/**
 * Build time only. The atlas file's device records with what the landscape file
 * says about them. The two files share no key: the atlas names a device by a
 * slug and the landscape by a company and a product name, and `bci_devices` in
 * the atlas is a pointer string, not a list. So a record is matched by rule, and
 * a record the rule does not match keeps its id, made readable. No name is
 * written by hand and none is guessed.
 *
 * The rule: the slug's first word must be a word of exactly one company's name,
 * and the slug's words that are not in the company's name must all be in exactly
 * one of that company's device names. A slug that is all company name is matched
 * against the device names on its first word.
 */

import { ATLAS_FILE } from '@/lib/anatomy/datalake-files';
import { AnatomyDataError } from '@/lib/anatomy/errors';
import { isRecord } from '@/lib/threat-model/guards';
import { DEVICE_RELATIONS, INTERFACE_TYPES, type DeviceRelation, type DossierCompany, type DossierDevice, type InterfaceType } from './dossier-file';

const LANDSCAPE_FILE = 'datalake/bci-landscape.json';
const SLUG_SEPARATOR = '-';
const NOT_ALPHANUMERIC = /[^a-z0-9]+/;
const PUNCTUATION_INSIDE_A_WORD = /\./g;
/** Below this a slug word is matched as a whole word: "s" in "Muse S" must not match the "s" of "Muse 2 headset". */
const SUBSTRING_MATCH_MIN_LENGTH = 3;
/** A slug word this short reads as an abbreviation: "pc" as PC, "dbs" as DBS. */
const ABBREVIATION_MAX_LENGTH = 3;

interface LandscapeCompany extends DossierCompany {
  deviceNames: string[];
}

interface DeviceMatch {
  company: DossierCompany | null;
  deviceName: string | null;
}

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

function readLandscapeCompanies(landscape: unknown): LandscapeCompany[] {
  return readList(landscape, 'companies', LANDSCAPE_FILE).map((company, index) => {
    const location = `companies[${index}]`;
    const devices = Array.isArray(company.devices) ? company.devices.filter(isRecord) : [];
    return {
      name: readText(company, 'name', LANDSCAPE_FILE, location),
      type: readText(company, 'type', LANDSCAPE_FILE, location),
      status: readText(company, 'status', LANDSCAPE_FILE, location),
      deviceNames: devices.map((device, at) => readText(device, 'name', LANDSCAPE_FILE, `${location}.devices[${at}]`)),
    };
  });
}

function nameHoldsWord(name: string, slugWord: string): boolean {
  const words = toWords(name);
  return slugWord.length < SUBSTRING_MATCH_MIN_LENGTH ? words.includes(slugWord) : words.join('').includes(slugWord);
}

/** The company and the device name a slug matches. An ambiguous match is no match: nothing is chosen between two candidates. */
export function matchLandscapeDevice(deviceId: string, companies: readonly LandscapeCompany[]): DeviceMatch {
  const slugWords = deviceId.split(SLUG_SEPARATOR);
  const [firstWord] = slugWords;
  const candidates = companies.filter((company) => toWords(company.name).includes(firstWord));
  if (candidates.length !== 1) return { company: null, deviceName: null };
  const [{ deviceNames, ...company }] = candidates;
  const companyWords = toWords(company.name);
  const productWords = slugWords.filter((word) => !companyWords.includes(word));
  const wanted = productWords.length > 0 ? productWords : [firstWord];
  const names = deviceNames.filter((name) => wanted.every((word) => nameHoldsWord(name, word)));
  return { company, deviceName: names.length === 1 ? names[0] : null };
}

/** `medtronic-percept-pc` as "Medtronic Percept PC". Says only what the id says. */
export function humaniseDeviceId(deviceId: string): string {
  return deviceId.split(SLUG_SEPARATOR).map((word) => (word.length <= ABBREVIATION_MAX_LENGTH ? word.toUpperCase() : `${word[0].toUpperCase()}${word.slice(1)}`)).join(' ');
}

function readChoice<Choice extends string>(record: Record<string, unknown>, key: string, allowed: readonly Choice[], location: string): Choice {
  const value = readText(record, key, ATLAS_FILE, location);
  return (allowed as readonly string[]).includes(value) ? value as Choice : fail(ATLAS_FILE, `${location}.${key}`, `"${value}" is not one of ${allowed.join(', ')}`, 'Use one of the listed words.');
}

function readRegionIds(mapping: Record<string, unknown>, location: string): string[] {
  const { target_regions: regionIds } = mapping;
  return Array.isArray(regionIds) && regionIds.every((regionId) => typeof regionId === 'string') ? regionIds : fail(ATLAS_FILE, `${location}.target_regions`, 'expected a list of region ids', 'Restore the list.');
}

/** @throws AnatomyDataError when a device record or a company lacks a field, or a record's relation or interface is not a known word */
export function buildDossierDevices(atlas: unknown, landscape: unknown): DossierDevice[] {
  const companies = readLandscapeCompanies(landscape);
  return readList(atlas, 'device_region_mappings', ATLAS_FILE).map((mapping, index) => {
    const location = `device_region_mappings[${index}]`;
    const id = readText(mapping, 'device_id', ATLAS_FILE, location);
    const { company, deviceName } = matchLandscapeDevice(id, companies);
    const relation: DeviceRelation = readChoice(mapping, 'region_relation', DEVICE_RELATIONS, location);
    const interfaceType: InterfaceType = readChoice(mapping, 'interface_type', INTERFACE_TYPES, location);
    return { id, name: deviceName ?? humaniseDeviceId(id), has_listed_name: deviceName !== null, relation, interface_type: interfaceType, region_ids: readRegionIds(mapping, location), company };
  });
}
