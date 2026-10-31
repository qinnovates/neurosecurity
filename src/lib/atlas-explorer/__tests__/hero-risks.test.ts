import { describe, expect, it } from 'vitest';
import { UNREVIEWED } from '@/lib/anatomy/review-state';
import type { DetailTechnique } from '../region-detail';
import { HERO_RISK_CAP, rankRegionRisks, techniquePagePath } from '../hero-risks';

function technique(id: string, name: string, nissSeverity: string | null): DetailTechnique {
  return { id, name, bandNames: 'N1', nissSeverity, dsmCluster: null, term: name.toLowerCase(), evidenceKey: `${id}:${name}`, reviewState: { ...UNREVIEWED, mark: 'AI-drafted' }, uncountedReason: null, facts: null };
}

describe('rankRegionRisks', () => {
  it('puts the highest NISS step first, techniques with no step last, and breaks ties by name', () => {
    const linked = [
      technique('T4', 'Delta', null),
      technique('T2', 'Bravo', 'low'),
      technique('T1', 'Alpha', 'critical'),
      technique('T3', 'Charlie', 'high'),
      technique('T5', 'Able', 'high'),
    ];
    expect(rankRegionRisks(linked).shown.map((entry) => entry.id)).toEqual(['T1', 'T5', 'T3', 'T2', 'T4']);
  });

  it('cuts the list at the cap and counts the rest', () => {
    const linked = Array.from({ length: HERO_RISK_CAP + 3 }, (_, index) => technique(`T${index}`, `Technique ${index}`, 'medium'));
    const ranked = rankRegionRisks(linked);
    expect(ranked.shown).toHaveLength(HERO_RISK_CAP);
    expect(ranked.hiddenCount).toBe(3);
  });

  it('hides nothing when the list is within the cap, and does not mutate the input', () => {
    const linked = [technique('T2', 'Bravo', 'low'), technique('T1', 'Alpha', 'high')];
    const ranked = rankRegionRisks(linked);
    expect(ranked.hiddenCount).toBe(0);
    expect(linked.map((entry) => entry.id)).toEqual(['T2', 'T1']);
    expect(rankRegionRisks([])).toEqual({ shown: [], hiddenCount: 0 });
  });

  it('points at the technique\'s catalog page', () => {
    expect(techniquePagePath('QIF-T0001')).toBe('/atlas/tara/QIF-T0001/');
  });
});
