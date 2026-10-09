/** Hand-built index pieces for the colour-mode and index-parser tests. Atlas and label ids are invented. */

import type { ExtentMatch } from '../anatomy-types';
import type {
  AnatomyIndex, IndexOwner, IndexReviewState, IndexStructure, IndexSubject, IndexTechnique, IndexTechniqueLink, OwnerVia,
} from '../anatomy-index-types';
import { ANATOMY_INDEX_STATUS } from '../status-sentences';
import { FIXTURE_ATLAS_ID, FIXTURE_SHA256, FIXTURE_SPACE } from './anatomy-fixtures';

export const UNREVIEWED_MARK: IndexReviewState = { state: 'ai_drafted_unreviewed', mark: 'AI-drafted, unreviewed' };

export function buildOwner(subjectId: string, via: OwnerVia = 'row', extentMatch: ExtentMatch | null = 'approximate'): IndexOwner {
  return { subject_kind: 'region', subject_id: subjectId, via, extent_match: via === 'row' ? extentMatch : null, review_state: UNREVIEWED_MARK, check_status: 'unchecked' };
}

export function buildStructure(labelId: string, owners: IndexOwner[]): IndexStructure {
  return { key: `${FIXTURE_ATLAS_ID}:${labelId}`, atlas: FIXTURE_ATLAS_ID, label_id: labelId, name: `Label ${labelId}`, nodes: [], owners, review_state: UNREVIEWED_MARK, check_status: 'unchecked' };
}

export function buildSubject(id: string, bandIds: string[]): IndexSubject {
  return {
    kind: 'region', id, name: id, band_ids: bandIds, geometry: { state: 'drawn', reason: null, reason_source: null },
    structure_keys: [], declared_children: [], review_state: UNREVIEWED_MARK, check_status: 'unchecked',
  };
}

export function buildIndexLink(regionId: string, lit: boolean): IndexTechniqueLink {
  return {
    term: regionId, resolved_region_id: regionId, resolution: lit ? 'id' : 'whole_to_part', band_agrees: true, valid_for_current_addressing: true,
    quote_state: 'quote_found', lit, claim_basis: 'catalog_text', review_state: UNREVIEWED_MARK, check_status: 'unchecked',
  };
}

export function buildTechnique(id: string, overrides: Partial<IndexTechnique> = {}): IndexTechnique {
  return { id, name: id, band_ids: ['N5'], severity: 'high', niss_severity: 'medium', dsm_cluster: 'mood_trauma', scope: 'regions', links: [], ...overrides };
}

export function buildIndex(overrides: Partial<AnatomyIndex> = {}): AnatomyIndex {
  return {
    schema_version: 1,
    status: ANATOMY_INDEX_STATUS,
    addressing_version: 1,
    template_space: FIXTURE_SPACE,
    evidence: { path: '/atlas/anatomy-evidence.json', bytes: 2, sha256: FIXTURE_SHA256 },
    layers: [{ id: 'deep', available: false, reason: 'No asset has been built for this layer yet.', source_ids: [FIXTURE_ATLAS_ID], asset_ids: [] }],
    sources: [],
    assets: [],
    structures: [],
    subjects: [],
    techniques: [],
    tracts: { index_asset_id: null, proximity_asset_id: null, group_asset_ids: [] },
    devices: { fiducial_space: null, fiducials: [], leads: [], stated_targets: [] },
    stale_evidence_keys: [],
    ...overrides,
  };
}
