import type { CatalogSeverity } from './catalog-types';
import type { ChainGenerationResult } from './chain-types';
import type { DeviceModel, RiskStatus } from './device-model';
import type { ScopeTerm } from './lab-terms';
import type { ComplianceSource, NotPlacedCategory, PlacedEntryPath } from './reference-data-types';

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

/** A technique the placement table puts on an element, kept off it by a condition the device does not meet. */
export interface TechniqueExclusion {
  techniqueId: string;
  elementId: string;
  /** The unmet condition, in the engine's words. */
  reason: MatchReason;
}

/**
 * Every element gets exactly one outcome, so an empty result can never read as "no threats":
 * `not_applicable` means rules ran and excluded everything; `not_modelled` means no rule covers it.
 * `excluded` keeps, per technique, each condition that kept a technique off the element, whatever the outcome.
 */
export type ElementOutcome =
  | { elementId: string; kind: 'matched'; matches: TechniqueMatch[]; excluded: TechniqueExclusion[] }
  | { elementId: string; kind: 'not_applicable'; exclusions: MatchReason[]; excluded: TechniqueExclusion[] }
  | { elementId: string; kind: 'not_modelled'; detail: string; excluded: TechniqueExclusion[] };

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
  /** The legacy status the engine's eligibility gate reads. Never shown; wording goes through describeEvidence. */
  evidenceStatus: string | null;
  /** The catalog's evidence tier code; null on baseline rows and on records with no tier. */
  evidenceTier: string | null;
  precedentCveIds: string[];
  /** The catalog's own note on how the technique might be noticed. Not a control, and not chosen for this device. */
  detectionNote: string | null;
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

/**
 * `not_evaluated`: no submission type is chosen, so nothing was checked.
 * `not_determined`: the model cannot settle the statutory definition, and the tool does not guess.
 */
export type RequirementApplicability = 'required' | 'recommended' | 'not_required' | 'not_evaluated' | 'not_determined';
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

/** `not_determined` is never a "no": the tool cannot rule the definition out from a model. */
export type CyberDeviceConnectivity = 'meets' | 'not_determined';

/**
 * What the model shows about the connectivity part of the cyber device definition, with the
 * assumptions made, and what the checklist file says about itself.
 */
export interface CyberDeviceAssessment {
  connectivity: CyberDeviceConnectivity;
  /** Links on a connection type FDA lists that carry data, commands or updates in the model. */
  internetCapableLinkIds: string[];
  explanation: string;
  /** FDA's own words on which features count, quoted from the checklist file. */
  connectivityQuote: string;
  /** The checklist file's statement of its own review status. */
  checklistStatus: string;
  /** Every source the checklist was built from. Nothing outside them is covered. */
  checklistSources: ComplianceSource[];
}

/** How much of the catalog's techniques of one goal can appear in a model at all. */
export interface GoalCoverage {
  placedTechniques: number;
  catalogTechniques: number;
  /** True when some technique of this goal has no placement decision. A zero for the goal must then never be shown bare. */
  isIncomplete: boolean;
}

export interface CatalogCoverage {
  totalTechniques: number;
  placedTechniques: number;
  /** Evidenced techniques deliberately not placed, counted by the reason category. */
  notPlacedByCategory: Record<string, number>;
  /** Techniques with no placement decision recorded. */
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
  evidenceTier: string | null;
}

export interface ThemeTechnique {
  techniqueId: string;
  name: string;
  evidenceStatus: string;
  evidenceTier: string | null;
  /** Where the technique stands against this device, in the Lab's four terms. */
  standing: ScopeTerm;
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
  /** Per goal, so an empty lens can say it means "not assessed" and not "no risk". */
  goalCoverage: Record<ThreatGoal, GoalCoverage>;
  /** Element kinds that no placement decision covers, stated so gaps in the tool are visible. */
  coverageGaps: string[];
  /** Standing caveats printed with every report. */
  limitations: string[];
}
