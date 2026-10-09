/**
 * Parser for datalake/qif-anatomy-verdicts.json: the committed copy of the
 * licence verification, one verdict per registry source, each with an
 * AI-drafted clearance record. Nothing here is legal advice.
 */

import { rejectBandKeys } from './band-key-scan';
import {
  childOf, failAt, itemOf, readBoolean, readEnum, readList, readNullable, readRecord, readString, readStringList,
  rejectDuplicates, rootOf, type FieldLocation,
} from './field-readers';
import { readDate, readId, readSchemaVersion, readSha256, readWebUrl } from './format-readers';
import { isAtLeastAsStrict } from './licence-rules';
import {
  GRANTS, LICENCE_IDS, VERDICTS, VERIFIER_KINDS,
  type AccessAgreement, type AnatomySources, type Clearance, type LicenceVerdict, type LicenceVerdicts, type Verifier,
} from './source-types';
import { VERDICTS_STATUS, readStatus } from './status-sentences';

export const VERDICTS_FILE = 'datalake/qif-anatomy-verdicts.json';
const VERDICTS_SCHEMA_VERSION = 1;
const AI_DRAFTER = 'ai';
const MAX_NAME_LENGTH = 200;
const MAX_TEXT_LENGTH = 1200;
const VERDICT_KEYS = [
  'source_id', 'verdict', 'grant', 'treat_as', 'terms_url', 'quoted_terms', 'read_on',
  'verified_by', 'human_confirmed', 'access_agreement', 'clearance',
] as const;

function parseClearance(value: unknown, location: FieldLocation): Clearance {
  const record = readRecord(value, location, { required: ['cleared', 'reason', 'unlocks_when', 'drafted_by'] });
  const cleared = readBoolean(record, 'cleared', location);
  const unlocksWhen = readStringList(record, 'unlocks_when', location, MAX_TEXT_LENGTH);
  if (!cleared && unlocksWhen.length === 0) {
    failAt(childOf(location, 'unlocks_when'), 'an uncleared source must say what would clear it', 'List at least one condition.');
  }
  return {
    cleared,
    reason: readString(record, 'reason', location, MAX_TEXT_LENGTH),
    unlocks_when: unlocksWhen,
    drafted_by: readEnum(record, 'drafted_by', location, [AI_DRAFTER]),
  };
}

function parseAgreement(value: unknown, location: FieldLocation): AccessAgreement {
  const record = readRecord(value, location, { required: ['name', 'terms_url', 'text_sha256'] });
  return {
    name: readString(record, 'name', location, MAX_NAME_LENGTH),
    terms_url: readWebUrl(record, 'terms_url', location),
    text_sha256: readNullable(record, 'text_sha256', () => readSha256(record, 'text_sha256', location)),
  };
}

function readHumanConfirmed(record: Record<string, unknown>, location: FieldLocation): false {
  if (record.human_confirmed !== false) {
    failAt(childOf(location, 'human_confirmed'), 'no person has confirmed any licence reading',
      'Keep it false. Recording a confirmation needs a review-ledger entry kind that does not exist yet; add that first.');
  }
  return false;
}

function parseVerdict(value: unknown, location: FieldLocation, verifierIds: ReadonlySet<string>): LicenceVerdict {
  const record = readRecord(value, location, { required: VERDICT_KEYS });
  const verifiedBy = readStringList(record, 'verified_by', location, MAX_NAME_LENGTH);
  const unlistedVerifier = verifiedBy.find((verifierId) => !verifierIds.has(verifierId));
  if (verifiedBy.length === 0 || unlistedVerifier !== undefined) {
    failAt(childOf(location, 'verified_by'), `"${String(unlistedVerifier)}" is not in this file's verifiers list`,
      'Name at least one verifier, each by an id from the top-level verifiers list.');
  }
  return {
    source_id: readId(record, 'source_id', location),
    verdict: readEnum(record, 'verdict', location, VERDICTS),
    grant: readEnum(record, 'grant', location, GRANTS),
    treat_as: readNullable(record, 'treat_as', () => readEnum(record, 'treat_as', location, LICENCE_IDS)),
    terms_url: readNullable(record, 'terms_url', () => readWebUrl(record, 'terms_url', location)),
    quoted_terms: readStringList(record, 'quoted_terms', location, MAX_TEXT_LENGTH),
    read_on: readDate(record, 'read_on', location),
    verified_by: verifiedBy,
    human_confirmed: readHumanConfirmed(record, location),
    access_agreement: readNullable(record, 'access_agreement', () => parseAgreement(record.access_agreement, childOf(location, 'access_agreement'))),
    clearance: parseClearance(record.clearance, childOf(location, 'clearance')),
  };
}

function parseVerifier(value: unknown, location: FieldLocation): Verifier {
  const record = readRecord(value, location, { required: ['id', 'kind'] });
  return { id: readString(record, 'id', location, MAX_NAME_LENGTH), kind: readEnum(record, 'kind', location, VERIFIER_KINDS) };
}

/** One verdict per registry source, no more and no fewer, and no treat_as looser than the stated licence. */
function rejectRegistryMismatch(verdicts: readonly LicenceVerdict[], sources: AnatomySources, root: FieldLocation): void {
  const location = childOf(root, 'verdicts');
  const licenceBySource = new Map(sources.sources.map((source) => [source.id, source.licence_id]));
  rejectDuplicates(verdicts.map((verdict) => verdict.source_id), location, 'verdict for source');
  for (const verdict of verdicts) {
    const statedLicence = licenceBySource.get(verdict.source_id);
    if (statedLicence === undefined) {
      return failAt(location, `"${verdict.source_id}" is not a source in the registry`, 'Add the source to qif-anatomy-sources.json or remove this verdict.');
    }
    if (verdict.treat_as !== null && (verdict.treat_as === statedLicence || !isAtLeastAsStrict(verdict.treat_as, statedLicence))) {
      return failAt(childOf(location, `${verdict.source_id}.treat_as`), `"${verdict.treat_as}" is not stricter than the stated licence "${statedLicence}"`,
        'treat_as may only tighten a licence. Set it to null or to a stricter id.');
    }
  }
  const verdictIds = new Set(verdicts.map((verdict) => verdict.source_id));
  const unjudged = sources.sources.find((source) => !verdictIds.has(source.id));
  if (unjudged !== undefined) failAt(location, `source "${unjudged.id}" has no verdict`, 'Add its licence verdict; a source with no verdict cannot be assessed.');
}

export function parseVerdicts(raw: unknown, sources: AnatomySources): LicenceVerdicts {
  const root = rootOf(VERDICTS_FILE);
  rejectBandKeys(raw, VERDICTS_FILE);
  const record = readRecord(raw, root, { required: ['schema_version', 'status', 'verifiers', 'verdicts'] });
  const verifiers = readList(record, 'verifiers', root).map((verifier, index) => parseVerifier(verifier, itemOf(root, 'verifiers', index)));
  rejectDuplicates(verifiers.map((verifier) => verifier.id), childOf(root, 'verifiers'), 'verifier id');
  const verifierIds = new Set(verifiers.map((verifier) => verifier.id));
  const verdicts = readList(record, 'verdicts', root).map((verdict, index) => parseVerdict(verdict, itemOf(root, 'verdicts', index), verifierIds));
  rejectRegistryMismatch(verdicts, sources, root);
  return {
    schema_version: readSchemaVersion(record, root, VERDICTS_SCHEMA_VERSION),
    status: readStatus(record, root, VERDICTS_STATUS),
    verifiers,
    verdicts,
  };
}
