/**
 * Reads the role each drafted technique link was given in the curation record
 * (datalake/scripts/technique-region-curation.json). The data file holds only
 * the sentence a role renders to, so the role itself is read from where it was
 * written and never guessed back from the sentence. A test renders every role
 * with the generator's own function and compares it to the data file.
 */

import { isRecord } from '@/lib/threat-model/guards';
import { AnatomyDataError } from './errors';
import { show } from './field-readers';
import { techniqueLinkKey } from './row-digest';

export const CURATION_FILE = 'datalake/scripts/technique-region-curation.json';
const ROLE_PATTERN = /^[a-z][a-z_]*$/;
const REDRAFT_REMEDY = 'Edit the curation record, then run node datalake/scripts/draft-technique-regions.mjs.';

function fail(location: string, problem: string): never {
  throw new AnatomyDataError(CURATION_FILE, location, problem, REDRAFT_REMEDY);
}

function readRole(link: unknown, location: string): [term: string, role: string] {
  if (!isRecord(link) || typeof link.term !== 'string') return fail(location, 'expected a link with a term');
  if (typeof link.role !== 'string' || !ROLE_PATTERN.test(link.role)) return fail(location, `"${show(link.role)}" is not a role`);
  return [link.term, link.role];
}

/**
 * @param curation the parsed curation record
 * @returns the role of each curated link, by its ledger key (`technique_id:term`)
 */
export function readTermRoles(curation: unknown): Map<string, string> {
  const techniques = isRecord(curation) && isRecord(curation.techniques) ? curation.techniques : fail('techniques', 'expected an object keyed by technique id');
  const roles = new Map<string, string>();
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
export function findTermRole(roles: ReadonlyMap<string, string>, techniqueId: string, term: string): string {
  return roles.get(techniqueLinkKey(techniqueId, term)) ?? fail(`techniques.${techniqueId}.links`, `no curated link holds the term "${show(term)}"`);
}
