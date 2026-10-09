/**
 * Chooses which limit sentence goes beside which thing. The wording lives in
 * limits-copy.ts; this only picks the template and hands it the values, all of
 * them read from data.
 */

import type { GeometryState, IndexLayer, IndexSubject } from '@/lib/anatomy/anatomy-index-types';
import { limitSentence, type LimitSentence } from '@/lib/anatomy/limits-copy';
import type { AnatomyMatch, RegionEvidenceRow } from '@/lib/anatomy/region-evidence-types';
import type { ExplorerModel } from './explorer-model';
import type { Lens } from './lens-state';

const ALLEN_SOURCE_IDS: readonly string[] = ['allen_hra_3d_2020'];
const DEEP_AVERAGE_SOURCE_IDS: readonly string[] = ['cit168_rl', 'neudorfer_hypothalamus'];
const AROUSAL_SOURCE_IDS: readonly string[] = ['harvard_aan_v2'];
const UNRECORDED_REASON = 'none is recorded.';

/** The sentence beside a region's geometry status. A region with no shape carries the recorded reason. */
export function limitForGeometry(region: Pick<IndexSubject, 'geometry'>): LimitSentence {
  const state: GeometryState = region.geometry.state;
  if (state === 'no_geometry') return limitSentence('geometry_no_geometry', { reason: region.geometry.reason ?? UNRECORDED_REASON });
  return limitSentence(`geometry_${state}`);
}

/** How the shapes of one source were made. An unlisted source says only where the shape comes from. */
export function limitForSource(sourceId: string, sourceName: string): LimitSentence {
  if (ALLEN_SOURCE_IDS.includes(sourceId)) return limitSentence('source_allen');
  if (DEEP_AVERAGE_SOURCE_IDS.includes(sourceId)) return limitSentence('source_deep_average');
  if (AROUSAL_SOURCE_IDS.includes(sourceId)) return limitSentence('source_arousal_nuclei');
  return limitSentence('source_other', { source_name: sourceName });
}

/** The reason shown beside a disabled layer control, or null for a layer that is available. */
export function limitForLayer(layer: IndexLayer): LimitSentence | null {
  if (layer.available) return null;
  return limitSentence('layer_unavailable', { reason: layer.reason ?? UNRECORDED_REASON });
}

function limitsForTechnique(model: ExplorerModel, techniqueId: string): LimitSentence[] {
  const technique = model.techniquesById.get(techniqueId);
  if (technique === undefined) return [limitSentence('lens_technique_device_only')];
  if (technique.scope === 'not_drafted') return [limitSentence('lens_technique_not_drafted')];
  if (technique.scope === 'band_level') return [limitSentence('lens_technique_band_only', { bands: `band ${technique.band_ids.join(', ')}` })];
  return [limitSentence('lens_technique')];
}

/** The sentences shown beside the lens controls for the lens as it stands. Never empty. */
export function limitsForLens(model: ExplorerModel, lens: Lens): LimitSentence[] {
  switch (lens.kind) {
    case 'band': return [limitSentence('lens_band')];
    case 'niss': return [limitSentence('lens_niss'), limitSentence('counts_are_entries')];
    case 'technique': return lens.techniqueId === null ? [limitSentence('lens_technique'), limitSentence('lens_needs_subject')] : limitsForTechnique(model, lens.techniqueId);
    case 'dsm': return lens.cluster === null ? [limitSentence('lens_dsm'), limitSentence('lens_needs_subject')] : [limitSentence('lens_dsm'), limitSentence('counts_are_entries')];
    case 'stated_targets': return lens.deviceId === null ? [limitSentence('lens_stated_targets'), limitSentence('lens_needs_subject')] : [limitSentence('lens_stated_targets')];
  }
}

const MATCH_LIMITS: Readonly<Record<Exclude<AnatomyMatch, 'equal'>, 'evidence_match_part' | 'evidence_match_larger_structure' | 'evidence_match_adjacent_or_overlapping' | 'evidence_match_uncertain' | 'evidence_match_outside_region'>> = {
  part: 'evidence_match_part',
  larger_structure: 'evidence_match_larger_structure',
  adjacent_or_overlapping: 'evidence_match_adjacent_or_overlapping',
  uncertain: 'evidence_match_uncertain',
  outside_region: 'evidence_match_outside_region',
};

/**
 * How the paper's own anatomy relates to the region the row is filed under.
 * Every row gets this line, so a paper about a part, a larger structure or a
 * place outside the region never reads as a plain statement about the region.
 */
export function limitsForEvidenceAnatomy(row: Pick<RegionEvidenceRow, 'anatomy_match' | 'anatomy_inferred' | 'anatomy_as_stated'>): LimitSentence[] {
  const match = row.anatomy_match === 'equal' ? limitSentence('evidence_match_equal') : limitSentence(MATCH_LIMITS[row.anatomy_match], { anatomy: row.anatomy_as_stated });
  return row.anatomy_inferred ? [match, limitSentence('evidence_inferred')] : [match];
}
