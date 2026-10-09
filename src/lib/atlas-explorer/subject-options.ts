/**
 * The subjects a lens can be about: every technique in the catalog, the DSM
 * cluster tags, and the devices the atlas file records. Filtering is plain
 * substring matching on what is shown, so a visitor can predict it.
 */

import type { IndexReviewState, IndexTechniqueScope } from '@/lib/anatomy/anatomy-index-types';
import { weakestReviewState, type ExplorerModel } from './explorer-model';
import type { LensKind } from './lens-state';

/** `device_only`: the technique has no neural band, so it can be linked to no region. */
export type TechniqueOptionKind = IndexTechniqueScope | 'device_only';

export interface SubjectOption {
  id: string;
  label: string;
  /** A short fact shown beside the label: bands, or how many regions. */
  detail: string;
  /** The review state of the AI-drafted links choosing it shows, so the option carries the mark. Null when it shows none. */
  reviewState: IndexReviewState | null;
  /** Present on technique options only. */
  techniqueKind?: TechniqueOptionKind;
}

const KIND_DETAILS: Readonly<Record<TechniqueOptionKind, string>> = {
  regions: 'names brain structures',
  band_level: 'band tag only',
  not_drafted: 'no links drafted',
  device_only: 'acts on the device',
};

function countRegions(count: number): string {
  return count === 1 ? '1 region linked' : `${count} regions linked`;
}

/** Every technique of the catalog, in id order: those with a neural band from the index, the rest from the catalog. */
export function listTechniqueOptions(model: ExplorerModel): SubjectOption[] {
  const neural = model.index.techniques.map((technique): SubjectOption => {
    const litCount = new Set(technique.links.filter((link) => link.lit).map((link) => link.resolved_region_id)).size;
    const detail = technique.scope === 'regions' ? `${countRegions(litCount)}; ${technique.band_ids.join(', ')}` : `${KIND_DETAILS[technique.scope]}; ${technique.band_ids.join(', ')}`;
    return { id: technique.id, label: technique.name, detail, reviewState: weakestReviewState(technique.links.map((link) => link.review_state)), techniqueKind: technique.scope };
  });
  const deviceOnly = [...model.deviceOnlyTechniquesById.values()].map((technique): SubjectOption => (
    { id: technique.id, label: technique.name, detail: `${KIND_DETAILS.device_only}; ${technique.band_ids.join(', ')}`, reviewState: null, techniqueKind: 'device_only' }
  ));
  return [...neural, ...deviceOnly].sort((first, second) => first.id.localeCompare(second.id));
}

/** The DSM cluster tags the catalog's techniques carry, as written. They are category names, not diagnoses. */
export function listClusterOptions(model: ExplorerModel): SubjectOption[] {
  const clusters = [...new Set(model.index.techniques.flatMap((technique) => technique.dsm_cluster ?? []))].sort();
  return clusters.map((cluster) => {
    const tagged = model.index.techniques.filter((technique) => technique.dsm_cluster === cluster);
    const reviewState = weakestReviewState(tagged.flatMap((technique) => technique.links.map((link) => link.review_state)));
    return { id: cluster, label: cluster.replaceAll('_', ' '), detail: `${tagged.length} catalog entries`, reviewState };
  });
}

export function listDeviceOptions(model: ExplorerModel): SubjectOption[] {
  return model.index.devices.stated_targets.map((device) => (
    { id: device.device_id, label: device.device_id, detail: device.region_ids.length === 1 ? '1 region named' : `${device.region_ids.length} regions named`, reviewState: null }
  ));
}

export function listSubjectOptions(model: ExplorerModel, kind: LensKind): SubjectOption[] {
  if (kind === 'technique') return listTechniqueOptions(model);
  if (kind === 'dsm') return listClusterOptions(model);
  if (kind === 'stated_targets') return listDeviceOptions(model);
  return [];
}

/**
 * The options matching every word of the query, in their given order, with an
 * exact id first. An empty query keeps everything.
 */
export function filterSubjectOptions(options: readonly SubjectOption[], query: string): SubjectOption[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) return [...options];
  const haystack = (option: SubjectOption): string => `${option.id} ${option.label} ${option.detail}`.toLowerCase();
  const matches = options.filter((option) => words.every((word) => haystack(option).includes(word)));
  const exactId = query.trim().toLowerCase();
  return [...matches.filter((option) => option.id.toLowerCase() === exactId), ...matches.filter((option) => option.id.toLowerCase() !== exactId)];
}
