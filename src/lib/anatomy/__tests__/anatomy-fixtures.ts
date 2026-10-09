/**
 * Small, valid fixtures for the anatomy parsers. Every name here is invented
 * for tests: "fixture_atlas" is no real atlas, and no label id is a real one.
 */

import type { EvidenceBlock } from '../evidence';
import type { AnatomySource, LicenceVerdict } from '../source-types';
import { SOURCES_STATUS, VERDICTS_STATUS } from '../status-sentences';

export const FIXTURE_ATLAS_ID = 'fixture_atlas';
export const FIXTURE_DRAWN_ATLAS_ID = 'fixture_drawn_atlas';
export const FIXTURE_SPACE = 'FixtureSpace';
export const FIXTURE_SHA256 = 'a'.repeat(64);
export const OTHER_SHA256 = 'b'.repeat(64);

export function buildSource(overrides: Partial<AnatomySource> = {}): AnatomySource {
  return {
    id: FIXTURE_ATLAS_ID,
    name: 'Fixture atlas',
    attribution_text: 'Fixture authors (2020).',
    urls: ['https://example.org/fixture'],
    licence_id: 'cc-by-4.0',
    redistribute: true,
    layers: ['deep'],
    delineated_in: 'its own template',
    arrives_in: FIXTURE_SPACE,
    route: { kind: 'publisher_registered', status: 'settled', note: 'Fixture.', publisher_registration: { target: FIXTURE_SPACE, method: 'not stated' } },
    delineation: { basis: 'manual_mri', subjects: 10 },
    required_text: [],
    files: [{ name: 'labels.nii.gz', url: 'https://example.org/labels.nii.gz', sha256: null, bytes: null, digest_origin: null }],
    ...overrides,
  };
}

export function buildSourcesFile(sources: AnatomySource[] = [buildSource()]): Record<string, unknown> {
  return { schema_version: 1, status: SOURCES_STATUS, declared_space: FIXTURE_SPACE, sources, considered_and_refused: [] };
}

export function buildVerdict(overrides: Partial<LicenceVerdict> = {}): LicenceVerdict {
  return {
    source_id: FIXTURE_ATLAS_ID,
    verdict: 'SHIP',
    grant: 'explicit',
    treat_as: null,
    terms_url: 'https://example.org/licence',
    quoted_terms: ['Licensed under CC BY 4.0.'],
    read_on: '2026-10-09',
    verified_by: ['ai-pass-1'],
    human_confirmed: false,
    access_agreement: null,
    clearance: { cleared: true, reason: 'The grant is in the publisher\'s words.', unlocks_when: [], drafted_by: 'ai' },
    ...overrides,
  };
}

export function buildVerdictsFile(verdicts: LicenceVerdict[] = [buildVerdict()]): Record<string, unknown> {
  return { schema_version: 1, status: VERDICTS_STATUS, verifiers: [{ id: 'ai-pass-1', kind: 'ai' }], verdicts };
}

export function buildEvidence(overrides: Partial<EvidenceBlock> = {}): EvidenceBlock {
  return {
    claim_basis: 'atlas_label',
    source_ref: { file: `src/site/atlas-assets/open/labels-${FIXTURE_ATLAS_ID}.json`, pointer: '/labels/7/name', quote: 'Fixture Nucleus' },
    check_status: 'unchecked',
    rationale: 'The atlas label and the QIF record carry the same name.',
    ...overrides,
  };
}
