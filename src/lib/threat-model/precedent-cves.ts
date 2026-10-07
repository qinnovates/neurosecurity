import type { PrecedentCve } from './catalog-types';
import type { PrecedentCveEntry } from './report-types';

/** CVE ids recorded against each technique in the catalog's CVE mapping. */
export function indexCveIdsByTechnique(cves: readonly PrecedentCve[]): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const cve of cves) {
    for (const techniqueId of cve.techniqueIds) {
      index.set(techniqueId, [...(index.get(techniqueId) ?? []), cve.cveId]);
    }
  }
  return index;
}

/**
 * CVEs in similar products that the catalog links to the matched techniques.
 * These are precedents. They are not findings about the modelled device.
 */
export function collectPrecedentCves(matchedTechniqueIds: ReadonlySet<string>, cves: readonly PrecedentCve[]): PrecedentCveEntry[] {
  return cves
    .map((cve): PrecedentCveEntry => ({
      cveId: cve.cveId,
      product: cve.product,
      description: cve.description,
      cvssScore: cve.cvssScore,
      viaTechniqueIds: cve.techniqueIds.filter((techniqueId) => matchedTechniqueIds.has(techniqueId)),
    }))
    .filter((entry) => entry.viaTechniqueIds.length > 0)
    .sort((left, right) => (right.cvssScore ?? -1) - (left.cvssScore ?? -1) || left.cveId.localeCompare(right.cveId));
}
