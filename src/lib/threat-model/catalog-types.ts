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
}

export interface BandControls {
  detection: string[];
  prevention: string[];
  response: string[];
}

export interface EngineData {
  registrarVersion: string;
  techniques: CatalogTechnique[];
  regions: BrainRegion[];
  precedentCves: PrecedentCve[];
  /** Date the CVE mapping was generated; shown beside every precedent CVE. */
  precedentCvesAsOf: string;
  controlsByBand: Record<string, BandControls>;
}
