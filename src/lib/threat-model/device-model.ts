/**
 * The saved description of one neural device. This is the file a user exports and
 * re-imports, so every field here is also an untrusted-input surface (see parse-device-model.ts).
 */

export const MODEL_SCHEMA_VERSION = 1;

export const DEVICE_CATEGORIES = ['bci', 'neurostimulator', 'eeg_system', 'sensory_prosthesis'] as const;
export type DeviceCategory = typeof DEVICE_CATEGORIES[number];

/** Mirrors the `i0_depth` values in datalake/qif-brain-bci-atlas.json. */
export const INVASIVENESS_LEVELS = ['noninvasive', 'cortical', 'subcortical', 'spinal_peripheral'] as const;
export type Invasiveness = typeof INVASIVENESS_LEVELS[number];

/** Mirrors the `interface_type` values in datalake/qif-brain-bci-atlas.json. */
export const INTERFACE_DIRECTIONS = ['read', 'write', 'bidirectional'] as const;
export type InterfaceDirection = typeof INTERFACE_DIRECTIONS[number];

export const COMPONENT_KINDS = [
  'implant', 'headset', 'wearable_processor', 'clinician_programmer',
  'patient_app', 'cloud_service', 'charger',
] as const;
export type ComponentKind = typeof COMPONENT_KINDS[number];

/** Ordered from the patient outward; the diagram lays zones out in this order. */
export const TRUST_ZONES = ['in_body', 'on_body', 'patient_controlled', 'clinic', 'cloud'] as const;
export type TrustZone = typeof TRUST_ZONES[number];

export const LINK_MEDIA = [
  'wired_lead', 'inductive', 'proprietary_rf', 'bluetooth_le', 'nfc', 'usb', 'wifi', 'cellular', 'internet',
] as const;
export type LinkMedium = typeof LINK_MEDIA[number];

export const SUBMISSION_TYPES = ['510k', 'de_novo', 'pma', 'hde', 'pdp', 'ide', 'none'] as const;
export type SubmissionType = typeof SUBMISSION_TYPES[number];

export const RISK_STATUSES = ['open', 'mitigated', 'accepted', 'not_applicable'] as const;
export type RiskStatus = typeof RISK_STATUSES[number];

export const MODEL_LIMITS = {
  maxFileBytes: 1_000_000,
  maxComponents: 24,
  maxLinks: 60,
  maxTargetRegions: 38,
  maxRiskDecisions: 2_000,
  maxControlsInPlace: 200,
  maxLabelLength: 80,
  maxNoteLength: 500,
  maxIdLength: 64,
} as const;

export interface ModelComponent {
  id: string;
  kind: ComponentKind;
  label: string;
  trustZone: TrustZone;
  /** One compromise here reaches many patients (FDA multi-patient harm view). */
  isSharedAcrossPatients: boolean;
  /** The component in contact with neural tissue or the scalp. Exactly one per model. */
  isNeuralInterface: boolean;
}

export interface ModelLink {
  id: string;
  fromComponentId: string;
  toComponentId: string;
  medium: LinkMedium;
  carriesNeuralData: boolean;
  carriesStimulationCommands: boolean;
  carriesSoftwareUpdates: boolean;
}

/** The user's disposition of one risk register row. */
export interface RiskDecision {
  riskId: string;
  status: RiskStatus;
  note: string;
}

export interface DeviceModel {
  schemaVersion: typeof MODEL_SCHEMA_VERSION;
  /** Catalog version the model was last evaluated against; drives reconciliation on load. */
  registrarVersion: string;
  name: string;
  deviceCategory: DeviceCategory;
  invasiveness: Invasiveness;
  direction: InterfaceDirection;
  /** Region ids from the brain atlas. */
  targetRegionIds: string[];
  /** The system shows images or plays sounds to the patient as part of how it works. */
  presentsStimuli: boolean;
  components: ModelComponent[];
  links: ModelLink[];
  submissionType: SubmissionType;
  /** Two-letter US state code, or null when not provided. */
  patientState: string | null;
  riskDecisions: RiskDecision[];
  /** Control names the user has marked as implemented. */
  controlsInPlace: string[];
}
