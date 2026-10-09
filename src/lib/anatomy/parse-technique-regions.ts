/**
 * Parser for datalake/qif-technique-regions.json: for each technique with a
 * neural band, the words the catalog itself uses for brain structures. A link
 * holds the catalog's term and the quoted text and nothing derived from them;
 * what a term resolves to is computed at build time by the one region resolver.
 */

import { isRecord } from '@/lib/threat-model/guards';
import { readValidForAddressing } from './addressing-version';
import {
  BAND_LEVEL_REASONS, DRAFTERS, TECHNIQUE_SCOPES,
  type TechniqueLink, type TechniqueRegionEntry, type TechniqueRegions,
} from './anatomy-types';
import { rejectBandKeys } from './band-key-scan';
import { parseEvidence, readRationale } from './evidence';
import { childOf, failAt, itemOf, readEnum, readList, readRecord, readString, rejectDuplicates, rootOf, type FieldLocation } from './field-readers';
import { readSchemaVersion } from './format-readers';
import { TECHNIQUE_REGIONS_STATUS, readStatus } from './status-sentences';

export const TECHNIQUE_REGIONS_FILE = 'datalake/qif-technique-regions.json';
export const REGISTRAR_FILE = 'datalake/qtara-registrar.json';
const TECHNIQUE_REGIONS_SCHEMA_VERSION = 2;
const MAX_TERM_LENGTH = 120;
const REASON_SEPARATOR = ':';
/** Derived at build time. A stored copy could disagree with the alias table, so none is allowed. */
const DERIVED_LINK_KEYS = ['resolved_region_id', 'resolution', 'region_id'] as const;

function rejectStoredResolution(value: unknown, location: FieldLocation): void {
  if (typeof value !== 'object' || value === null) return;
  const derivedKey = DERIVED_LINK_KEYS.find((key) => Object.hasOwn(value, key));
  if (derivedKey === undefined) return;
  failAt(childOf(location, derivedKey), 'a link stores the catalog\'s word, never what it resolves to',
    'Remove the key; the build resolves the term through region_aliases and region_alias_relations.');
}

/** Catalog text must be quoted from the technique's own registrar entry, and the quote must contain the term. */
function rejectUnsupportedTerm(link: TechniqueLink, techniqueId: string, location: FieldLocation): void {
  const { source_ref: sourceRef, claim_basis: claimBasis } = link.evidence;
  const citesOwnEntry = sourceRef.file === REGISTRAR_FILE && sourceRef.pointer.startsWith(`/techniques/${techniqueId}/`);
  if (claimBasis === 'catalog_text' && !citesOwnEntry) {
    failAt(childOf(location, 'evidence.source_ref'), 'catalog text must be cited from this technique\'s own registrar entry',
      `Point at ${REGISTRAR_FILE} with a pointer that starts /techniques/${techniqueId}/.`);
  }
  if (claimBasis === 'catalog_text' && !sourceRef.quote.includes(link.term)) {
    failAt(childOf(location, 'term'), `the quoted words "${sourceRef.quote}" do not contain the term "${link.term}"`,
      'Write the term exactly as the catalog writes it, or quote the words that contain it.');
  }
}

function parseLink(value: unknown, location: FieldLocation, techniqueId: string): TechniqueLink {
  rejectStoredResolution(value, location);
  const record = readRecord(value, location, { required: ['term', 'valid_for_addressing', 'evidence', 'drafted_by'] });
  const link: TechniqueLink = {
    term: readString(record, 'term', location, MAX_TERM_LENGTH),
    valid_for_addressing: readValidForAddressing(record, location),
    evidence: parseEvidence(record.evidence, childOf(location, 'evidence')),
    drafted_by: readEnum(record, 'drafted_by', location, DRAFTERS),
  };
  rejectUnsupportedTerm(link, techniqueId, location);
  return link;
}

/** A band_level entry cannot hold links, and must open its rationale with a reason from the closed list. */
function rejectScopeMismatch(entry: TechniqueRegionEntry, location: FieldLocation): void {
  const linksLocation = childOf(location, 'links');
  if (entry.scope === 'regions' && entry.links.length === 0) {
    failAt(linksLocation, 'a regions entry must hold at least one link', 'Add the links the text supports, or make the entry band_level with a reason.');
  }
  if (entry.scope !== 'band_level') return;
  if (entry.links.length > 0) {
    failAt(linksLocation, 'a band_level entry says no region could be drafted, so it cannot hold links', 'Remove the links, or change scope to "regions".');
  }
  const statedReason = entry.rationale.split(REASON_SEPARATOR)[0];
  if (!(BAND_LEVEL_REASONS as readonly string[]).includes(statedReason)) {
    failAt(childOf(location, 'rationale'), `a band_level rationale must start with one of: ${BAND_LEVEL_REASONS.join(', ')}`,
      'Write the reason, a colon, then the explanation.');
  }
}

function parseEntry(value: unknown, location: FieldLocation, techniqueId: string): TechniqueRegionEntry {
  const record = readRecord(value, location, { required: ['scope', 'rationale', 'links'] });
  const entry: TechniqueRegionEntry = {
    scope: readEnum(record, 'scope', location, TECHNIQUE_SCOPES),
    rationale: readRationale(record, location),
    links: readList(record, 'links', location).map((link, index) => parseLink(link, itemOf(location, 'links', index), techniqueId)),
  };
  rejectDuplicates(entry.links.map((link) => link.term), childOf(location, 'links'), 'term');
  rejectScopeMismatch(entry, location);
  return entry;
}

/** The entries by technique id. A technique with no neural band acts on the device, not a region, and has no entry. */
function readEntries(value: unknown, location: FieldLocation, neuralTechniqueIds: ReadonlySet<string>): Record<string, unknown> {
  if (!isRecord(value)) return failAt(location, 'expected an object keyed by technique id', 'Write a JSON object.');
  const strayId = Object.keys(value).find((techniqueId) => !neuralTechniqueIds.has(techniqueId));
  if (strayId !== undefined) {
    return failAt(childOf(location, strayId), `"${strayId}" is not a registrar technique with a neural band`, 'Remove the entry or correct the id.');
  }
  return value;
}

/**
 * @param neuralTechniqueIds the registrar techniques that have a neural band; only they may have an entry
 */
export function parseTechniqueRegions(raw: unknown, neuralTechniqueIds: ReadonlySet<string>): TechniqueRegions {
  const root = rootOf(TECHNIQUE_REGIONS_FILE);
  rejectBandKeys(raw, TECHNIQUE_REGIONS_FILE);
  const record = readRecord(raw, root, { required: ['schema_version', 'status', 'techniques'] });
  const techniquesLocation = childOf(root, 'techniques');
  const rawEntries = readEntries(record.techniques, techniquesLocation, neuralTechniqueIds);
  return {
    schema_version: readSchemaVersion(record, root, TECHNIQUE_REGIONS_SCHEMA_VERSION),
    status: readStatus(record, root, TECHNIQUE_REGIONS_STATUS),
    techniques: Object.fromEntries(
      Object.entries(rawEntries).map(([techniqueId, entry]) => [techniqueId, parseEntry(entry, childOf(techniquesLocation, techniqueId), techniqueId)]),
    ),
  };
}
