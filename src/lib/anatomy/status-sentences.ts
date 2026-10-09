/**
 * The status sentence each anatomy file must carry, word for word. The
 * sentences live in code so that softening one takes a reviewed code change as
 * well as a data edit; a file whose `status` differs stops the build.
 */

import { childOf, failAt, type FieldLocation } from './field-readers';

export const SOURCES_STATUS = 'AI-drafted source registry. Routes and delineation records are unconfirmed until they are read from the publishers\' own files.';
export const VERDICTS_STATUS = 'AI-drafted licence readings, made by AI and not by a lawyer. No person has confirmed them. They are not legal advice.';
export const CROSSWALK_STATUS = 'AI-drafted. No neuroanatomist has checked these correspondences.';
export const TECHNIQUE_REGIONS_STATUS = 'AI-drafted. Links are a reading of the catalog\'s own words, not new evidence.';
export const REVIEW_LEDGER_STATUS = 'Review ledger. Only the repository owner adds entries. An entry counts only while its digest matches what was reviewed.';
export const DEVICE_GEOMETRY_STATUS = 'AI-drafted. No fiducial or lead dimension is drawn until a review ledger entry covers it.';
export const ANATOMY_INDEX_STATUS = 'AI-drafted and unreviewed unless an item says otherwise. No neuroanatomist has checked the anatomy. Licence readings were made by AI, not by a lawyer.';

export function readStatus(record: Record<string, unknown>, location: FieldLocation, expected: string): string {
  if (record.status !== expected) {
    failAt(childOf(location, 'status'), 'the status sentence differs from the one this file must carry', `Restore it to: "${expected}"`);
  }
  return expected;
}
