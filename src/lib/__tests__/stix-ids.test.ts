import { describe, expect, it } from 'vitest';
import goldenIds from '@shared/qtara/tests/fixtures/stix_ids.json';
import registrar from '@shared/qtara-registrar.json';
import {
  STIX_ID_NAMESPACE,
  STIX_IDENTITY_ID,
  StixIdError,
  attackPatternStixId,
  tacticPhaseName,
  variantRelationshipStixId,
} from '@/lib/stix-ids';

const UUID_V5_STIX_ID = /^(attack-pattern|identity|relationship)--[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('STIX ids agree with the Python SDK', () => {
  it('uses the namespace the SDK fixture records', () => {
    expect(STIX_ID_NAMESPACE).toBe(goldenIds.namespace);
  });

  it('gives the identity and each golden technique and variant the id the SDK gives it', () => {
    expect(STIX_IDENTITY_ID).toBe(goldenIds.identity);
    for (const [entryId, sdkStixId] of Object.entries(goldenIds.attack_patterns)) {
      expect(attackPatternStixId(entryId)).toBe(sdkStixId);
    }
  });

  it('gives each golden variant relationship the id the SDK gives it', () => {
    for (const relationship of goldenIds.variant_relationships) {
      expect(variantRelationshipStixId(relationship.variant, relationship.parent)).toBe(relationship.id);
    }
  });

  it('produces a distinct UUIDv5 id for every technique and variant in the registrar', () => {
    const entryIds = [...registrar.techniques, ...registrar.variants].map((entry) => entry.id);
    const stixIds = entryIds.map(attackPatternStixId);
    expect(new Set(stixIds).size).toBe(entryIds.length);
    for (const stixId of [STIX_IDENTITY_ID, ...stixIds]) expect(stixId).toMatch(UUID_V5_STIX_ID);
  });

  it('rejects an id that is not a technique or variant id', () => {
    expect(() => attackPatternStixId('QIF-T0001"; DROP')).toThrow(StixIdError);
    expect(() => variantRelationshipStixId('QIF-T0024-V01', 'T0024')).toThrow(StixIdError);
  });

  it('derives kill-chain phase names from tactic ids', () => {
    expect(tacticPhaseName('QIF-N.IJ')).toBe('qif-n-ij');
  });
});
