/**
 * The `anatomy_sources` table: one row per registered upstream source, with the
 * licence reading that decides whether it may ship. The reading was made by AI
 * and not by a lawyer, so the columns that carry it say so in their names, and
 * each row holds the publisher's quoted terms, who read them and that no
 * person has confirmed them.
 */

import type { AnatomyData } from './anatomy-inputs';
import type { IndexSource } from './anatomy-index-types';
import { buildSources } from './build-index-sources';
import { AnatomyDataError } from './errors';
import { VERDICTS_FILE } from './parse-verdicts';
import { reviewStateOfLicenceReading, toIndexReviewState } from './review-state';
import type { AnatomySource, LicenceVerdict, LicenceVerdicts } from './source-types';
import { draftColumns, joinIds, joinText, type AnatomyRow } from './table-columns';

const TABLE = 'anatomy_sources';
const NOT_READ = '';
const STATUS_SEPARATOR = ' ';

/** The kinds of reader behind a verdict, for example `ai`. A reader the verdict file does not list contributes nothing. */
function listReaderKinds(verdict: LicenceVerdict, verdicts: LicenceVerdicts): string[] {
  const kinds = verdict.verified_by.flatMap((verifierId) => verdicts.verifiers.filter((verifier) => verifier.id === verifierId).map((verifier) => verifier.kind));
  return [...new Set<string>(kinds)];
}

function registryColumns(source: AnatomySource, declaredSpace: string): AnatomyRow {
  return {
    template_space: declaredSpace,
    delineated_in: source.delineated_in,
    arrives_in: source.arrives_in,
    route_kind: source.route.kind,
    route_status: source.route.status,
    route_note: source.route.note,
    delineation_basis: source.delineation.basis ?? NOT_READ,
    layers: joinIds(source.layers),
    urls: joinText(source.urls),
  };
}

function licenceColumns(entry: IndexSource, verdict: LicenceVerdict, verdicts: LicenceVerdicts): AnatomyRow {
  return {
    stated_license_id: entry.stated_license_id,
    handled_as_license_id: entry.license_id,
    ai_verdict: entry.verdict,
    grant: entry.grant,
    quoted_terms: joinText(verdict.quoted_terms),
    terms_url: verdict.terms_url ?? NOT_READ,
    license_read_on: verdict.read_on,
    license_read_by: joinIds(listReaderKinds(verdict, verdicts)),
    human_confirmed: entry.human_confirmed,
    ai_reading_permits_shipping: verdict.clearance.cleared,
    clearance_reason: entry.clearance_reason,
    unlocks_when: joinText(verdict.clearance.unlocks_when),
    buildable: entry.buildable,
    pipeline_only: entry.pipeline_only,
    blockers: joinIds(entry.blockers),
  };
}

/** The source's own registry record and verdict, found by id. A source the index lists and the files do not stops the build. */
function findRecords(entry: IndexSource, data: AnatomyData): { source: AnatomySource; verdict: LicenceVerdict } {
  const source = data.sources.sources.find((candidate) => candidate.id === entry.id);
  const verdict = data.verdictBySource.get(entry.id);
  if (source === undefined || verdict === undefined) {
    throw new AnatomyDataError(VERDICTS_FILE, `source ${entry.id}`, 'the index lists a source that has no registry record or no verdict',
      'Give every registered source exactly one verdict.');
  }
  return { source, verdict };
}

/** One row per source, in registry order. Verdict, licence and buildability are the index's own entries. */
export function buildSourceTable(data: AnatomyData): AnatomyRow[] {
  const statusSentence = [data.sources.status, data.verdicts.status].join(STATUS_SEPARATOR);
  return buildSources(data).map((entry) => {
    const { source, verdict } = findRecords(entry, data);
    return {
      ...draftColumns(TABLE, [verdict.clearance.drafted_by], toIndexReviewState(reviewStateOfLicenceReading(verdict, data.ledger)), statusSentence),
      source_id: entry.id,
      name: entry.name,
      ...licenceColumns(entry, verdict, data.verdicts),
      ...registryColumns(source, data.sources.declared_space),
    };
  });
}
