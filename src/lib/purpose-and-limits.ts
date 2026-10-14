/**
 * Typed access to the purpose and limits statement and the catalog coverage
 * figures that site copy quotes. Every figure is computed from the registrar at
 * build time so copy such as "{detected} of {N}" cannot drift from the data.
 */
import statement from '@/data/purpose-and-limits.json';
import { THREAT_VECTORS, TECHNIQUE_COUNT, type ThreatVector } from '@/lib/threat-data';

export type StatementLinkKey = keyof typeof statement.links;

export interface StatementSegment {
  text: string;
  link?: StatementLinkKey;
}

export interface StatementSection {
  label: string;
  segments: StatementSegment[];
}

export const PURPOSE_SUMMARY: string = statement.summary;
export const FRAMEWORK_STATUS = statement.status;
export const STATEMENT_LINKS = statement.links;
export const PURPOSE_AND_LIMITS = statement.purposeAndLimits as {
  heading: string;
  anchor: string;
  sections: StatementSection[];
};

/** Detection guidance lives in the registrar at `tara.engineering.detection`. */
export function hasDetectionGuidance(technique: ThreatVector): boolean {
  const detection = technique.tara?.engineering?.detection;
  return typeof detection === 'string' && detection.trim().length > 0;
}

function hasDsm5CategoryReference(technique: ThreatVector): boolean {
  return (technique.tara?.dsm5?.primary?.length ?? 0) > 0;
}

export interface CatalogCoverage {
  /** {N}: techniques in the registrar */
  total: number;
  /** {scored}: techniques carrying a draft NISS score */
  scored: number;
  /** {detected}: techniques with detection guidance text */
  detected: number;
  /** {dsm5Count}: techniques with at least one DSM-5-TR category reference */
  dsm5Count: number;
  /** Techniques without detection guidance, in registrar order (the published gap list) */
  withoutDetection: ThreatVector[];
}

export function getCatalogCoverage(): CatalogCoverage {
  const withoutDetection = THREAT_VECTORS.filter((technique) => !hasDetectionGuidance(technique));
  return {
    total: TECHNIQUE_COUNT,
    scored: THREAT_VECTORS.filter((technique) => technique.nissScored).length,
    detected: TECHNIQUE_COUNT - withoutDetection.length,
    dsm5Count: THREAT_VECTORS.filter(hasDsm5CategoryReference).length,
    withoutDetection,
  };
}
