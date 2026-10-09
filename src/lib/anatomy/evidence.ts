/**
 * The one evidence block every AI-drafted anatomy row carries. It says where a
 * claim comes from and whether it was checked against that source. It is owned
 * by this repository and by neither staged anatomy proposal.
 */

import { childOf, failAt, readEnum, readRecord, readString, type FieldLocation } from './field-readers';
import { parseSourceRef, type SourceRef } from './source-ref';

export const CLAIM_BASES = ['atlas_label', 'catalog_text', 'catalog_parameter', 'analyst_inference', 'literature'] as const;
export type ClaimBasis = typeof CLAIM_BASES[number];

/** An experimental method. Present only on a claim from the literature. */
export const EVIDENCE_METHODS = ['tracing', 'physiology', 'review', 'lesion'] as const;
export type EvidenceMethod = typeof EVIDENCE_METHODS[number];

/** Was the claim checked against its cited source. AI-drafted rows start `unchecked`. */
export const CHECK_STATUSES = ['supports', 'partial', 'contradicts', 'unchecked'] as const;
export type CheckStatus = typeof CHECK_STATUSES[number];

export const UNCHECKED: CheckStatus = 'unchecked';
export const MAX_RATIONALE_LENGTH = 200;

const LITERATURE: ClaimBasis = 'literature';
const BASE_KEYS = ['claim_basis', 'source_ref', 'check_status', 'rationale'] as const;
const METHOD_KEY = 'evidence_method';
/** Fields of the staged anatomical-projection model. They would read as claims about people on these rows. */
const PROJECTION_ONLY_KEYS = ['human_status', 'evidence_species'] as const;

export interface EvidenceBlock {
  claim_basis: ClaimBasis;
  source_ref: SourceRef;
  evidence_method?: EvidenceMethod;
  check_status: CheckStatus;
  rationale: string;
}

function rejectProjectionKeys(value: unknown, location: FieldLocation): void {
  if (typeof value !== 'object' || value === null) return;
  const projectionKey = PROJECTION_ONLY_KEYS.find((key) => Object.hasOwn(value, key));
  if (projectionKey === undefined) return;
  failAt(childOf(location, projectionKey), `"${projectionKey}" describes an anatomical projection, not this kind of claim`,
    'Remove it; say where the claim comes from with claim_basis and source_ref.');
}

function rejectMisplacedMethod(value: unknown, location: FieldLocation): void {
  const hasMethod = typeof value === 'object' && value !== null && Object.hasOwn(value, METHOD_KEY);
  const claimBasis = hasMethod ? (value as Record<string, unknown>).claim_basis : undefined;
  if (!hasMethod || claimBasis === LITERATURE) return;
  failAt(childOf(location, METHOD_KEY), 'only a claim whose claim_basis is "literature" has a method',
    'Remove evidence_method, or change claim_basis if the claim really rests on a paper.');
}

/** One line of at most MAX_RATIONALE_LENGTH characters saying why the drafter made the claim. */
export function readRationale(record: Record<string, unknown>, location: FieldLocation): string {
  const rationale = readString(record, 'rationale', location, MAX_RATIONALE_LENGTH);
  if (/[\r\n]/.test(rationale)) failAt(childOf(location, 'rationale'), 'must be one line', 'Remove the line break.');
  return rationale;
}

export function parseEvidence(value: unknown, location: FieldLocation): EvidenceBlock {
  rejectProjectionKeys(value, location);
  rejectMisplacedMethod(value, location);
  const isLiterature = typeof value === 'object' && value !== null && (value as Record<string, unknown>).claim_basis === LITERATURE;
  const record = readRecord(value, location, { required: isLiterature ? [...BASE_KEYS, METHOD_KEY] : BASE_KEYS });
  const evidence: EvidenceBlock = {
    claim_basis: readEnum(record, 'claim_basis', location, CLAIM_BASES),
    source_ref: parseSourceRef(record.source_ref, childOf(location, 'source_ref')),
    check_status: readEnum(record, 'check_status', location, CHECK_STATUSES),
    rationale: readRationale(record, location),
  };
  return isLiterature ? { ...evidence, evidence_method: readEnum(record, METHOD_KEY, location, EVIDENCE_METHODS) } : evidence;
}
