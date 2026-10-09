/**
 * Builds /atlas/anatomy-evidence.json: the quotes, rationales and licence
 * readings behind the index, fetched only when a visitor opens the inspector.
 * Each drafted item carries the ledger key and the digest a review of it must
 * carry, so the repository owner copies them from here.
 */

import type { AnatomyData } from './anatomy-inputs';
import type { ReviewedDeviceRow } from './build-index-devices';
import type { ReviewedLink } from './build-index-techniques';
import type { EvidenceBlock } from './evidence';
import type { DimensionSource } from './parse-device-geometry';
import type { CheckedEvidence, ReviewedCrosswalk, ReviewedNoGeometry } from './review-rows';
import type { SourceRefState } from './source-ref';
import type { LicenceVerdict } from './source-types';
import { ANATOMY_INDEX_STATUS } from './status-sentences';

export const ANATOMY_EVIDENCE_SCHEMA_VERSION = 1;

interface ReviewTarget {
  key: string;
  digest: string;
}

export interface EvidenceItem extends ReviewTarget {
  evidence: EvidenceBlock;
  quote_state: SourceRefState;
}

export interface AnatomyEvidence {
  schema_version: number;
  status: string;
  /** Licence readings made by AI, not by a lawyer. */
  verdicts: LicenceVerdict[];
  crosswalk_rows: EvidenceItem[];
  no_geometry: Array<ReviewTarget & { reason: string; reason_source: string }>;
  technique_rationales: Array<{ technique_id: string; rationale: string }>;
  technique_links: EvidenceItem[];
  device_rows: ReviewTarget[];
  lead_sources: Array<{ lead_id: string; sources: DimensionSource[] }>;
}

export interface EvidenceParts {
  crosswalk: ReviewedCrosswalk;
  noGeometry: readonly ReviewedNoGeometry[];
  links: readonly ReviewedLink[];
  deviceRows: readonly ReviewedDeviceRow[];
}

/** The evidence as it may be shown: with the check status the build derived, never the file's own unvouched claim. */
function toEvidenceItem(reviewed: ReviewTarget & CheckedEvidence, evidence: EvidenceBlock): EvidenceItem {
  return { key: reviewed.key, digest: reviewed.digest, evidence: { ...evidence, check_status: reviewed.check_status }, quote_state: reviewed.quote_state };
}

export function buildAnatomyEvidence(data: AnatomyData, parts: EvidenceParts): AnatomyEvidence {
  return {
    schema_version: ANATOMY_EVIDENCE_SCHEMA_VERSION,
    status: ANATOMY_INDEX_STATUS,
    verdicts: data.verdicts.verdicts,
    crosswalk_rows: parts.crosswalk.current.map((reviewed) => toEvidenceItem(reviewed, reviewed.row.evidence)),
    no_geometry: parts.noGeometry.map((reviewed) => ({ key: reviewed.key, digest: reviewed.digest, reason: reviewed.record.reason, reason_source: reviewed.record.reason_source })),
    technique_rationales: Object.entries(data.techniqueRegions.techniques).map(([techniqueId, entry]) => ({ technique_id: techniqueId, rationale: entry.rationale })),
    technique_links: parts.links.map((reviewed) => toEvidenceItem(reviewed, reviewed.link.evidence)),
    device_rows: [...parts.deviceRows],
    lead_sources: data.deviceGeometry.leads.map((lead) => ({ lead_id: lead.id, sources: lead.sources })),
  };
}
