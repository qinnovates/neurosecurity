import type { CatalogSeverity } from './catalog-types';
import type { ChainGenerationResult } from './chain-types';
import type { DeviceModel, RiskStatus } from './device-model';
import type { NotPlacedCategory, PlacedEntryPath } from './reference-data-types';

export const STRIDE_CATEGORIES = [
  'spoofing', 'tampering', 'repudiation', 'information_disclosure', 'denial_of_service', 'elevation_of_privilege',
] as const;
export type StrideCategory = typeof STRIDE_CATEGORIES[number];

/** What a technique does, in the confidentiality, integrity, availability sense. From the catalog's own mode. */
export const THREAT_GOALS = ['read', 'change', 'deny'] as const;
export type ThreatGoal = typeof THREAT_GOALS[number];

/** A rule's machine-readable explanation for including or excluding a technique. */
export interface MatchReason {
  ruleId: string;
  detail: string;
}

export interface TechniqueMatch {
  techniqueId: string;
  elementId: string;
  reasons: MatchReason[];
}

/**
 * Every element gets exactly one outcome, so an empty result can never read as "no threats":
 * `not_applicable` means rules ran and excluded everything; `not_modelled` means no rule covers it.
 */
export type ElementOutcome =
  | { elementId: string; kind: 'matched'; matches: TechniqueMatch[] }
  | { elementId: string; kind: 'not_applicable'; exclusions: MatchReason[] }
  | { elementId: string; kind: 'not_modelled'; detail: string };

/**
 * Whether a saved row's technique still exists in the current catalog. The catalog keeps no
 * per-technique deprecation list, so a retired technique shows up as missing.
 */
export type CatalogState = 'current' | 'missing';

export interface RiskRow {
  riskId: string;
  elementId: string;
  elementLabel: string;
  /** `catalog` rows come from TARA; `stride` rows are the generic per-element baseline. */
  source: 'catalog' | 'stride';
  techniqueId: string | null;
  title: string;
  strideCategories: StrideCategory[];
  /** How the technique gets in. Null on baseline rows, which are not tied to a technique. */
  entryPath: PlacedEntryPath | null;
  goal: ThreatGoal | null;
  catalogSeverity: CatalogSeverity | null;
  /** Null means not scored. It must never be displayed or sorted as low. */
  cvssBaseVector: string | null;
  nissScore: number | null;
  evidenceStatus: string | null;
  precedentCveIds: string[];
  controls: string[];
  fdaRequirementCodes: string[];
  status: RiskStatus;
  note: string;
  catalogState: CatalogState;
}

export const ARCHITECTURE_VIEWS = [
  'global_system', 'multi_patient_harm', 'updateability', 'security_use_case',
] as const;
export type ArchitectureView = typeof ARCHITECTURE_VIEWS[number];

export interface ArchitectureViewSelection {
  view: ArchitectureView;
  highlightedComponentIds: string[];
  highlightedLinkIds: string[];
  explanation: string;
}

export type RequirementApplicability = 'required' | 'recommended' | 'not_required';
export type RequirementEvidence = 'draft_in_this_report' | 'user_must_supply';

export interface ComplianceItem {
  requirementId: string;
  title: string;
  /** The statute or guidance document the requirement comes from. */
  instrument: string;
  applicability: RequirementApplicability;
  applicabilityReason: string;
  evidence: RequirementEvidence;
  suggestedFix: string;
  sourceUrl: string;
  dateRead: string;
  supportingQuote: string;
}

/** Whether the model meets the statutory definition of a cyber device, with the assumptions made. */
export interface CyberDeviceAssessment {
  isCyberDevice: boolean;
  internetCapableLinkIds: string[];
  explanation: string;
}

/** How much of the catalog the placement table covers, so the report can state what was not considered. */
export interface CatalogCoverage {
  totalTechniques: number;
  placedTechniques: number;
  /** Evidenced techniques deliberately not placed, counted by the reason category. */
  notPlacedByCategory: Record<string, number>;
  /** Techniques with no placement decision yet (weaker evidence). */
  notReviewedTechniques: number;
}

/** An evidenced technique that does not pass through the device, so it is listed and never placed. */
export interface AmbientThreat {
  techniqueId: string;
  name: string;
  category: NotPlacedCategory;
  reason: string;
  goal: ThreatGoal | null;
  evidenceStatus: string;
}

export interface ThemeTechnique {
  techniqueId: string;
  name: string;
  evidenceStatus: string;
  /** Whether this technique is part of this device's threat model, listed beside it, or not yet reviewed. */
  standing: 'in_this_model' | 'placed_elsewhere' | 'around_device' | 'not_reviewed';
}

/** A subject beyond one device's architecture, with the catalog techniques that speak to it. */
export interface ThemeSummary {
  id: string;
  label: string;
  description: string;
  techniques: ThemeTechnique[];
  catalogGap: string | null;
}

export interface PrecedentCveEntry {
  cveId: string;
  product: string;
  description: string;
  cvssScore: number | null;
  viaTechniqueIds: string[];
}

export interface ThreatModelReport {
  /** Supplied by the caller; the engine never reads the clock. */
  generatedAt: string;
  registrarVersion: string;
  model: DeviceModel;
  elementOutcomes: ElementOutcome[];
  architectureViews: ArchitectureViewSelection[];
  chainResult: ChainGenerationResult;
  riskRows: RiskRow[];
  precedentCves: PrecedentCveEntry[];
  precedentCvesAsOf: string;
  cyberDeviceAssessment: CyberDeviceAssessment;
  complianceItems: ComplianceItem[];
  ambientThreats: AmbientThreat[];
  themes: ThemeSummary[];
  catalogCoverage: CatalogCoverage;
  /** Element kinds that no placement decision covers, stated so gaps in the tool are visible. */
  coverageGaps: string[];
  /** Standing caveats printed with every report. */
  limitations: string[];
}
