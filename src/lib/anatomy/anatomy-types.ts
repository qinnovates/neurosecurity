/**
 * The shared vocabulary of the anatomy data files, and the parsed shape of the
 * AI-drafted files. Field names are the files' own, so a parsed value is the
 * validated file content with nothing renamed.
 */

import type { EvidenceBlock } from './evidence';

export const SUBJECT_KINDS = ['region', 'pathway', 'network'] as const;
export type SubjectKind = typeof SUBJECT_KINDS[number];

/** Whether the atlas's name for a shape is the QIF record's name. */
export const NAME_MATCHES = ['same', 'synonym', 'none'] as const;
export type NameMatch = typeof NAME_MATCHES[number];

/**
 * Whether the shape is the structure. `contained` means the subject lies
 * somewhere inside a larger shape that has no boundary for it; such a subject
 * does not count as having geometry.
 */
export const EXTENT_MATCHES = ['same', 'atlas_covers_part', 'contained', 'approximate', 'none'] as const;
export type ExtentMatch = typeof EXTENT_MATCHES[number];

export const DELINEATION_BASES = ['histology', 'manual_mri', 'fmri_gradient', 'tractography', 'expert_drawing_on_template'] as const;
export type DelineationBasis = typeof DELINEATION_BASES[number];

/** A shape an expert drew onto a template is never the structure itself, so no row on it may be graded `same`. */
export const EXPERT_DRAWN_BASIS: DelineationBasis = 'expert_drawing_on_template';

/** Every row is AI-drafted today. A second value needs a schema change, so the review mark's wording is decided first. */
export const DRAFTERS = ['ai'] as const;
export type Drafter = typeof DRAFTERS[number];

export const HEMISPHERES = ['left', 'right', 'both'] as const;
export type Hemisphere = typeof HEMISPHERES[number];

/** The value a part's `expected_v2_id` holds until someone decides what the part becomes. */
export const UNDECIDED_PART = 'undecided';

export interface CrosswalkPart {
  id: string;
  expected_v2_id: string;
}

/** A declared subject-contains-subject relation. Nothing infers containment. */
export interface ContainsRelation {
  parent: string;
  child: string;
}

/** One per subject: no buildable atlas has geometry for it, with the reason and where the reason comes from. */
export interface NoGeometryRecord {
  subject_kind: SubjectKind;
  subject_id: string;
  reason: string;
  reason_source: string;
  drafted_by: Drafter;
}

export interface CrosswalkRow {
  subject_kind: SubjectKind;
  subject_id: string;
  subject_name_at_draft: string;
  valid_for_addressing: number[];
  part: string | null;
  atlas: string;
  atlas_ids: string[];
  name_match: NameMatch;
  extent_match: ExtentMatch;
  definition_contested: boolean;
  draws: boolean;
  delineation_basis: DelineationBasis;
  evidence: EvidenceBlock;
  drafted_by: Drafter;
}

export interface Crosswalk {
  schema_version: number;
  status: string;
  parts: CrosswalkPart[];
  contains: ContainsRelation[];
  no_geometry: NoGeometryRecord[];
  rows: CrosswalkRow[];
}

export const TECHNIQUE_SCOPES = ['regions', 'band_level'] as const;
export type TechniqueScope = typeof TECHNIQUE_SCOPES[number];

/** The reason a `band_level` entry's rationale must start with. */
export const BAND_LEVEL_REASONS = ['no_structure_named', 'only_whole_structures_named', 'text_contradicts_band_tags'] as const;
export type BandLevelReason = typeof BAND_LEVEL_REASONS[number];

/** A link holds the catalog's own word and the quoted text, and nothing derived from them. */
export interface TechniqueLink {
  term: string;
  valid_for_addressing: number[];
  evidence: EvidenceBlock;
  drafted_by: Drafter;
}

export interface TechniqueRegionEntry {
  scope: TechniqueScope;
  rationale: string;
  links: TechniqueLink[];
}

export interface TechniqueRegions {
  schema_version: number;
  status: string;
  techniques: Record<string, TechniqueRegionEntry>;
}

export interface AtlasLabel {
  id: string;
  name: string;
  hemisphere: Hemisphere;
}

/** One atlas's label table, written by the offline pipeline beside that atlas's assets. */
export interface LabelTable {
  schema_version: number;
  atlas: string;
  labels: AtlasLabel[];
}

/** What a crosswalk row is checked against: the QIF records it may name and the atlases it may point into. */
export interface CrosswalkContext {
  /** Canonical id -> current name, per subject kind. */
  subjectNames: Readonly<Record<SubjectKind, ReadonlyMap<string, string>>>;
  /** Keys of region_aliases, so an alias used as a subject id gets its own message. */
  regionAliases: ReadonlySet<string>;
  /** Atlas (source) id -> its delineation basis, or null when nobody has read it yet. */
  delineationBasisByAtlas: ReadonlyMap<string, DelineationBasis | null>;
  buildableAtlasIds: ReadonlySet<string>;
  labelTables: ReadonlyMap<string, LabelTable>;
}
