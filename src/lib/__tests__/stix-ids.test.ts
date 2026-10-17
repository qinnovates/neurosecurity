import { describe, expect, it } from 'vitest';
import goldenIds from '@shared/qtara/tests/fixtures/stix_ids.json';
import registrar from '@shared/qtara-registrar.json';
import { STIX_ID_NAMESPACE, STIX_IDENTITY_ID, StixIdError, attackPatternStixId, tacticPhaseName } from '@/lib/stix-ids';

const UUID_V5_STIX_ID = /^(attack-pattern|identity)--[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('STIX ids agree with the Python SDK', () => {
  it('uses the namespace the SDK fixture records', () => {
    expect(STIX_ID_NAMESPACE).toBe(goldenIds.namespace);
  });

  it('gives the identity and each golden technique the id the SDK gives it', () => {
    expect(STIX_IDENTITY_ID).toBe(goldenIds.identity);
    for (const [entryId, sdkStixId] of Object.entries(goldenIds.attack_patterns)) {
      expect(attackPatternStixId(entryId)).toBe(sdkStixId);
    }
  });

  it('produces a distinct UUIDv5 id for every technique in the registrar', () => {
    const stixIds = registrar.techniques.map((technique) => attackPatternStixId(technique.id));
    expect(new Set(stixIds).size).toBe(registrar.techniques.length);
    for (const stixId of [STIX_IDENTITY_ID, ...stixIds]) expect(stixId).toMatch(UUID_V5_STIX_ID);
  });

  it('rejects an id that is not a technique or variant id', () => {
    expect(() => attackPatternStixId('QIF-T0001"; DROP')).toThrow(StixIdError);
  });

  it('derives kill-chain phase names from tactic ids', () => {
    expect(tacticPhaseName('QIF-N.IJ')).toBe('qif-n-ij');
  });
});
