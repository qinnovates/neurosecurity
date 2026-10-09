/** Shapes of the authored reference data in datalake/threat-model/. */

import type { TechniqueMode } from './catalog-types';
import type { ChainRole } from './chain-types';
import type {
  ComponentKind, DeviceCategory, InterfaceDirection, Invasiveness,
  LinkMedium, ModelComponent, ModelLink, SubmissionType,
} from './device-model';
import type { StrideCategory } from './report-types';

export interface DeviceArchetype {
  id: string;
  label: string;
  description: string;
  deviceCategory: DeviceCategory;
  invasiveness: Invasiveness;
  direction: InterfaceDirection;
  defaultRegionIds: string[];
  presentsStimuli: boolean;
  components: ModelComponent[];
  links: ModelLink[];
}

export const LINK_PAYLOADS = ['neuralData', 'stimulationCommands', 'softwareUpdates'] as const;
export type LinkPayload = typeof LINK_PAYLOADS[number];

/**
 * How a technique gets in. The first three apply to placed techniques. `around_device`
 * covers evidenced techniques that never pass through the device at all.
 */
export const PLACED_ENTRY_PATHS = ['device_systems', 'neural_interface', 'senses'] as const;
export type PlacedEntryPath = typeof PLACED_ENTRY_PATHS[number];
export type EntryPath = PlacedEntryPath | 'around_device';

/** Where one catalog technique acts on a device model, and what the device must be for it to apply. */
export interface TechniquePlacement {
  entryPath: PlacedEntryPath;
  onNeuralInterface: boolean;
  componentKinds: ComponentKind[];
  linkMedia: LinkMedium[];
  onLinksCarrying: LinkPayload[];
  /** Device directions the technique needs; null means any. */
  requiresDirection: InterfaceDirection[] | null;
  /** True when the technique needs recording from, or a target in, cortex. */
  requiresCorticalTarget: boolean;
  /** The part the technique usually plays in an attack chain. */
  chainRole: ChainRole;
  /** One-line rationale for the placement. */
  basis: string;
}

export const NOT_PLACED_CATEGORIES = [
  'external_energy', 'consumer_sensor', 'pharmacological', 'nanoparticle', 'other_device_class',
] as const;
export type NotPlacedCategory = typeof NOT_PLACED_CATEGORIES[number];

export interface NotPlacedDecision {
  category: NotPlacedCategory;
  reason: string;
}

/**
 * One decision per evidenced catalog technique: placed, or not placed with a reason.
 * Techniques in neither map have not been reviewed for device applicability.
 */
export interface PlacementRules {
  placements: Record<string, TechniquePlacement>;
  notPlaced: Record<string, NotPlacedDecision>;
}

/** What the placement table says about itself, and how much of it a person has reviewed. */
export interface PlacementTableInfo {
  version: string;
  /** The file's own statement of its review status, verbatim. */
  status: string;
  placementCount: number;
  /** Placements whose record carries a review field. The file defines none today, so this is 0 until it does. */
  reviewedPlacementCount: number;
  notPlacedCount: number;
}

/** A subject area beyond one device's architecture, mapped onto existing catalog techniques. */
export interface ThreatTheme {
  id: string;
  label: string;
  description: string;
  techniqueIds: string[];
  /** What a name search of the catalog did not find, or null when nothing was noted. */
  catalogGap: string | null;
}

export interface StrideMap {
  strideByComponentKind: Record<ComponentKind, StrideCategory[]>;
  strideForLink: StrideCategory[];
  strideByMode: Record<TechniqueMode, StrideCategory[]>;
  strideByTactic: Record<string, StrideCategory[]>;
}

export interface ComplianceSource {
  id: string;
  title: string;
  url: string;
  dateRead: string;
}

export const REQUIREMENT_FORCES = ['statutory', 'guidance'] as const;
export type RequirementForce = typeof REQUIREMENT_FORCES[number];

export const REQUIREMENT_AUDIENCES = ['marketing', 'ide'] as const;
export type RequirementAudience = typeof REQUIREMENT_AUDIENCES[number];

export const REQUIREMENT_EVIDENCE_KINDS = ['draft_in_this_report', 'user_must_supply'] as const;
export type RequirementEvidenceKind = typeof REQUIREMENT_EVIDENCE_KINDS[number];

export interface ComplianceRequirement {
  id: string;
  title: string;
  sourceId: string;
  force: RequirementForce;
  appliesTo: RequirementAudience;
  evidence: RequirementEvidenceKind;
  suggestedFix: string;
  /** Verbatim text from the source that supports the requirement. */
  quote: string;
}

export interface ComplianceData {
  jurisdiction: 'US';
  /** The checklist file's version. */
  version: string;
  /** The file's own statement of how far it has been reviewed. */
  status: string;
  sources: ComplianceSource[];
  marketingSubmissionTypes: SubmissionType[];
  internetCapableMedia: LinkMedium[];
  /** The passage the media list was read from, in the source's words. */
  internetCapableMediaQuote: string;
  requirements: ComplianceRequirement[];
}

export interface ReferenceData {
  archetypes: DeviceArchetype[];
  placementRules: PlacementRules;
  placementTable: PlacementTableInfo;
  strideMap: StrideMap;
  themes: ThreatTheme[];
  compliance: ComplianceData;
}
