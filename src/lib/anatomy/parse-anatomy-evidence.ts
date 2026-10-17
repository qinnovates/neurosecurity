/**
 * Holds a fetched /atlas/anatomy-evidence.json to its shape before the page
 * shows a word of it. Only the parts the explorer shows are returned: the quoted
 * words and rationale behind each crosswalk row and technique link, and each
 * technique's rationale. The other parts must be present but are not read here,
 * so nothing unchecked can reach the screen through this parser.
 */

import { ANATOMY_EVIDENCE_PATH } from './anatomy-index-types';
import { ANATOMY_EVIDENCE_SCHEMA_VERSION, type AnatomyEvidence, type EvidenceItem } from './build-anatomy-evidence';
import { CHECK_STATUSES, CLAIM_BASES, EVIDENCE_METHODS } from './evidence';
import { readList, readRecord, rootOf } from './field-readers';
import { readSchemaVersion } from './format-readers';
import { checkShape, shapes } from './shape-check';
import { SOURCE_REF_STATES } from './source-ref';
import { ANATOMY_INDEX_STATUS, readStatus } from './status-sentences';

const FILE_KEYS = ['schema_version', 'status', 'verdicts', 'crosswalk_rows', 'no_geometry', 'technique_rationales', 'technique_links', 'device_rows', 'lead_sources'] as const;
const UNREAD_LIST_KEYS = ['verdicts', 'device_rows', 'lead_sources'] as const;
const MAX_KEY_LENGTH = 300;
const MAX_TEXT_LENGTH = 1200;

const text = shapes.text(MAX_TEXT_LENGTH);
const key = shapes.text(MAX_KEY_LENGTH);

const evidenceItem = shapes.record({
  key,
  digest: shapes.sha256,
  quote_state: shapes.word(Object.values(SOURCE_REF_STATES)),
  evidence: shapes.record({
    claim_basis: shapes.word(CLAIM_BASES),
    source_ref: shapes.record({ file: text, pointer: text, quote: text }),
    evidence_method: shapes.word(EVIDENCE_METHODS),
    check_status: shapes.word(CHECK_STATUSES),
    rationale: text,
  }, ['evidence_method']),
});

const SHOWN_PARTS = {
  crosswalk_rows: shapes.list(evidenceItem),
  technique_links: shapes.list(evidenceItem),
  technique_rationales: shapes.list(shapes.record({ technique_id: key, rationale: text })),
  no_geometry: shapes.list(shapes.record({ key, digest: shapes.sha256, reason: text, reason_source: text })),
} as const;

/** The parts of the evidence file the explorer shows. */
export type ShownAnatomyEvidence = Pick<AnatomyEvidence, keyof typeof SHOWN_PARTS>;

/** @throws AnatomyDataError naming the first field that is wrong */
export function parseAnatomyEvidence(raw: unknown): ShownAnatomyEvidence {
  const root = rootOf(ANATOMY_EVIDENCE_PATH);
  const record = readRecord(raw, root, { required: FILE_KEYS });
  readSchemaVersion(record, root, ANATOMY_EVIDENCE_SCHEMA_VERSION);
  readStatus(record, root, ANATOMY_INDEX_STATUS);
  for (const unreadKey of UNREAD_LIST_KEYS) readList(record, unreadKey, root);
  for (const [partKey, shape] of Object.entries(SHOWN_PARTS)) checkShape(record[partKey], shape, { dataFile: root.dataFile, path: partKey });
  return {
    crosswalk_rows: record.crosswalk_rows as EvidenceItem[],
    technique_links: record.technique_links as EvidenceItem[],
    technique_rationales: record.technique_rationales as ShownAnatomyEvidence['technique_rationales'],
    no_geometry: record.no_geometry as ShownAnatomyEvidence['no_geometry'],
  };
}
