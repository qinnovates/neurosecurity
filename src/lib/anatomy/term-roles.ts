/**
 * Reads the role each drafted technique link was given in the curation record
 * (datalake/scripts/technique-region-curation.json) and names it for export.
 * The data file holds only the sentence a role renders to, so the role is read
 * from where it was written and never guessed back from the sentence. A test
 * renders every role with the generator's own function and compares it to the
 * data file.
 *
 * A role is an AI's reading of how the catalog text uses a word. The exported
 * names say that the text names a structure in some way; none says what the
 * technique does to it.
 */

import { isRecord } from '@/lib/threat-model/guards';
import { AnatomyDataError } from './errors';
import { show } from './field-readers';
import { techniqueLinkKey } from './row-digest';

export const CURATION_FILE = 'datalake/scripts/technique-region-curation.json';

/**
 * Curation role -> the name it is exported under. The keys are LINK_ROLES in
 * datalake/scripts/draft-technique-regions.mjs; a test holds the two equal.
 * `named_in_catalog_target_field` keeps the word because the registrar's own
 * field is called `target`.
 */
export const EXPORTED_TERM_ROLES = {
  action_target: 'named_as_acted_on',
  recording_site: 'named_as_recorded_from',
  delivery_route: 'named_as_delivery_route',
  pathway_stage: 'named_as_pathway_stage',
  target_field: 'named_in_catalog_target_field',
  adjective: 'adjective_for_named_structure',
} as const;
export type CurationRole = keyof typeof EXPORTED_TERM_ROLES;
export type ExportedTermRole = typeof EXPORTED_TERM_ROLES[CurationRole];

const REDRAFT_REMEDY = 'Edit the curation record, then run node datalake/scripts/draft-technique-regions.mjs.';

function fail(location: string, problem: string): never {
  throw new AnatomyDataError(CURATION_FILE, location, problem, REDRAFT_REMEDY);
}

function isCurationRole(value: unknown): value is CurationRole {
  return typeof value === 'string' && Object.hasOwn(EXPORTED_TERM_ROLES, value);
}

function readRole(link: unknown, location: string): [term: string, role: ExportedTermRole] {
  if (!isRecord(link) || typeof link.term !== 'string') return fail(location, 'expected a link with a term');
  if (!isCurationRole(link.role)) return fail(location, `"${show(link.role)}" is not a role this build can export`);
  return [link.term, EXPORTED_TERM_ROLES[link.role]];
}

/**
 * @param curation the parsed curation record
 * @returns the exported role of each curated link, by its ledger key (`technique_id:term`)
 */
export function readTermRoles(curation: unknown): Map<string, ExportedTermRole> {
  const techniques = isRecord(curation) && isRecord(curation.techniques) ? curation.techniques : fail('techniques', 'expected an object keyed by technique id');
  const roles = new Map<string, ExportedTermRole>();
  for (const [techniqueId, entry] of Object.entries(techniques)) {
    const links = isRecord(entry) && Array.isArray(entry.links) ? entry.links : [];
    for (const [position, link] of links.entries()) {
      const [term, role] = readRole(link, `techniques.${techniqueId}.links[${position}]`);
      roles.set(techniqueLinkKey(techniqueId, term), role);
    }
  }
  return roles;
}

/** The role of one drafted link. A link the curation record does not hold stops the build: the two files have drifted. */
export function findTermRole(roles: ReadonlyMap<string, ExportedTermRole>, techniqueId: string, term: string): ExportedTermRole {
  return roles.get(techniqueLinkKey(techniqueId, term)) ?? fail(`techniques.${techniqueId}.links`, `no curated link holds the term "${show(term)}"`);
}
