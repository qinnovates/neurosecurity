/** Types for parse-atlas-map.mjs: the atlas feature map after parsing. */

export type Owner = 'kevin' | 'data' | 'engineering' | 'domain-review';
export type FollowupStatus = 'open' | 'done';

/** Records whose paths live on an open framing PR carry its number and are exempt from the existence check. */
interface MayBePending {
  pending_pr?: number;
}

export interface AtlasModule extends MayBePending {
  id: string;
  path: string;
  responsibility: string;
  entry_files: string[];
  depends_on: string[];
  map_file: string;
}

export interface AtlasDataFile extends MayBePending {
  id: string;
  path: string;
  holds: string;
  validated_by: string;
  /** "source" for a hand-edited file, otherwise the command that writes it. */
  generator: string;
  consumers: string[];
}

export interface CiReference {
  workflow: string;
  job: string;
  /** Text that appears in the job's steps, proving the job runs the check. */
  runs: string;
}

export interface AtlasCheck extends MayBePending {
  id: string;
  script: string;
  guards: string;
  ci: CiReference | null;
}

export interface RecipeReference {
  map: string;
  number: number;
}

export interface AtlasChange extends MayBePending {
  id: string;
  summary: string;
  keywords: string[];
  recipe: RecipeReference | null;
  edit: string[];
  note: string;
  commands: string[];
  checks: string[];
}

export interface AtlasFollowup {
  id: string;
  what: string;
  ref: string;
  owner: Owner;
  status: FollowupStatus;
  from: string;
}

export interface AtlasProvenance {
  id: string;
  path: string;
  justifies: string;
}

export interface AtlasMap {
  schema_version: 1;
  summary: string;
  modules: AtlasModule[];
  data: AtlasDataFile[];
  checks: AtlasCheck[];
  changes: AtlasChange[];
  followups: AtlasFollowup[];
  provenance: AtlasProvenance[];
}

export const ATLAS_MAP_FILE: string;
export const SCHEMA_VERSION: 1;
export const OWNERS: readonly Owner[];
export const STATUSES: readonly FollowupStatus[];

export class AtlasMapError extends Error {
  readonly location: string;
  constructor(location: string, problem: string, remedy: string);
}

export function parseAtlasMap(value: unknown): AtlasMap;
