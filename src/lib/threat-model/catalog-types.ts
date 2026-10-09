/**
 * The reference data the engine reasons over. The engine never imports data files;
 * callers build an EngineData value and pass it in, so the same code can run in the
 * browser, in tests, and later from a command line.
 */

export const DEFAULT_EVIDENCE_STATUSES = ['CONFIRMED', 'DEMONSTRATED'] as const;

/** Strongest first. Statuses not listed here rank below all of these. */
export const EVIDENCE_STATUS_RANK = ['CONFIRMED', 'DEMONSTRATED', 'EMERGING', 'THEORETICAL'] as const;

export const CATALOG_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
export type CatalogSeverity = typeof CATALOG_SEVERITIES[number];

export type TechniqueMode = 'R' | 'M' | 'D';

/** Hourglass bands from the silicon side to the neural side. */
export const BAND_ORDER = ['S3', 'S2', 'S1', 'I0', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7'] as const;
export type BandId = typeof BAND_ORDER[number];

export const SILICON_BANDS: readonly BandId[] = ['S3', 'S2', 'S1'];
export const INTERFACE_BAND: BandId = 'I0';

export interface CatalogTechnique {
  id: string;
  name: string;
  /** Tactic id such as QIF-N.IJ. */
  tactic: string;
  bandIds: string[];
  /** Evidence status as written in the catalog (CONFIRMED, DEMONSTRATED, EMERGING, THEORETICAL, ...). */
  evidenceStatus: string;
  /** The catalog's derived evidence tier code (see src/lib/evidence-tiers.ts), or null when a record has none. Shown in the interface; the engine's matching still reads the status. */
  evidenceTier: string | null;
  /** What the tier was derived from, as the catalog records it (`evidence.basis`). */
  evidenceBasis: string | null;
  /** What the supporting CVE records are about (`evidence.population`; see EvidencePopulation in src/lib/evidence-tiers.ts). */
  evidencePopulation: string | null;
  /** CVE records in neural-data products (`evidence.neural_product_cve_count`); null when not recorded. */
  neuralProductCveCount: number | null;
  /** CVE records in adjacent technology (`evidence.adjacent_cve_count`); null when not recorded. */
  adjacentCveCount: number | null;
  /**
   * The `category` of each NVD-verified record the CVE mapping links to this technique, one entry per record, in file order.
   * These are the records the two counts above were taken from.
   */
  cveRecordCategories: string[];
  /** The script that set the tier (`evidence.derived_by`), or null when none is named. */
  evidenceDerivedBy: string | null;
  /** The date the tier was set (`evidence.derived_on`). */
  evidenceDerivedOn: string | null;
  /** The catalog's source strings for the technique, verbatim. */
  sources: string[];
  severity: CatalogSeverity;
  mode: TechniqueMode | null;
  /** TARA's primary biological domain code (for example MEM, VIS, AUD), or SIL for silicon. */
  domain: string | null;
  coupling: string | null;
  /** CVSS v4.0 base vector. The catalog stores the vector, not a numeric score. */
  cvssBaseVector: string | null;
  nissScore: number | null;
  nissVector: string | null;
  alias: string | null;
  relatedTechniqueIds: string[];
  /** Detection approach from the catalog's engineering notes. */
  detection: string | null;
  /** FDA requirement codes from the catalog's own, unreviewed section 524B mapping. */
  fdaRequirementCodes: string[];
}

export interface BrainRegion {
  id: string;
  name: string;
  bandId: string;
  depthClass: string;
}

export interface PrecedentCve {
  cveId: string;
  product: string;
  description: string;
  cvssScore: number | null;
  techniqueIds: string[];
  /** The mapping's own `category` for the record; null when the record has none. */
  category: string | null;
  /** The mapping's `validation.nvd_verified` flag. The catalog's CVE counts include only records where it is true. */
  isNvdVerified: boolean;
}

/** A tactic as the catalog names it. */
export interface CatalogTactic {
  id: string;
  name: string;
  description: string;
}

export interface EngineData {
  registrarVersion: string;
  tactics: CatalogTactic[];
  techniques: CatalogTechnique[];
  regions: BrainRegion[];
  precedentCves: PrecedentCve[];
  /** Date the CVE mapping was generated; shown beside every precedent CVE. */
  precedentCvesAsOf: string;
}
