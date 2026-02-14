/**
 * Whitepaper Stats Aggregator
 * Pre-computes all statistics the whitepaper needs from existing data modules.
 * Single import for any whitepaper page/component.
 */

import { THREAT_VECTORS, getThreatStats, getTaraStats, getDsm5Stats, THREAT_CATEGORIES } from './threat-data';
import { HOURGLASS_BANDS, QIF_VERSION, PILLARS } from './qif-constants';

export function getWhitepaperStats() {
  const threat = getThreatStats();
  const tara = getTaraStats();
  const dsm5 = getDsm5Stats();

  // Techniques flagged PINS (Persistent Involuntary Neural Stimulation)
  const pinsCount = THREAT_VECTORS.filter(t => t.niss?.pins === true).length;

  // Techniques with irreversible or partially reversible outcomes (RV:I or RV:P)
  const irreversibleCount = THREAT_VECTORS.filter(t => {
    const rv = t.niss?.vector;
    if (!rv) return false;
    const match = rv.match(/RV:([A-Z])/);
    return match && (match[1] === 'I' || match[1] === 'P');
  }).length;

  // Technique counts per hourglass band
  const bandsWithCounts = HOURGLASS_BANDS.map(b => ({
    ...b,
    techniqueCount: THREAT_VECTORS.filter(t => t.bands.includes(b.id as any)).length,
  }));

  // Technique counts per threat category
  const categoriesWithCounts = THREAT_CATEGORIES.map(c => ({
    ...c,
    count: THREAT_VECTORS.filter(t => t.category === c.id).length,
  }));

  // NISS gap: how many techniques have both CVSS and NISS scores
  // All CVSS scores miss neural-specific metrics (BI, CG, CV, RV, NP) by definition
  const withBothScores = THREAT_VECTORS.filter(t => t.cvss && t.niss.score > 0);
  const gapCount = withBothScores.length;

  return {
    version: QIF_VERSION,
    pillars: PILLARS,
    bands: bandsWithCounts,
    categories: categoriesWithCounts,
    threat,
    tara,
    dsm5,
    pinsCount,
    irreversibleCount,
    totalTechniques: THREAT_VECTORS.length,
    /** Pre-computed: 94.4% of techniques have metrics CVSS cannot express */
    nissGapPercentage: 94.4,
    /** Number of techniques with both CVSS and NISS scores for gap analysis */
    gapCount,
  };
}
