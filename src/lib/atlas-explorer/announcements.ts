/**
 * What the live region says when the selection or the lens changes. Closed
 * templates, so a screen reader hears the same facts the list shows and
 * nothing the data does not hold.
 */

import type { ExplorerModel } from './explorer-model';
import { LENS_LABELS, lensNeedsSubject, lensSubjectId, type Lens } from './lens-state';
import { GEOMETRY_LABELS, type LensTally } from './region-rows';

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** Names the region, its band, what stands for it and its review state. */
export function announceSelection(model: ExplorerModel, regionId: string): string {
  const region = model.regionsById.get(regionId);
  if (region === undefined) return 'Selection cleared.';
  const band = region.band_ids[0] ?? 'no band';
  return `${region.name} selected. Band ${band}. ${GEOMETRY_LABELS[region.geometry.state]}. ${region.review_state.mark}.`;
}

function describeSubject(model: ExplorerModel, lens: Lens): string {
  const subjectId = lensSubjectId(lens);
  if (subjectId === null) return '';
  if (lens.kind !== 'technique') return `: ${subjectId.replaceAll('_', ' ')}`;
  return `: ${model.techniquesById.get(subjectId)?.name ?? model.deviceOnlyTechniquesById.get(subjectId)?.name ?? subjectId}`;
}

/** Names the lens and counts what it shows. "No data" is counted on its own and is never folded into a low value. */
export function announceLens(model: ExplorerModel, lens: Lens, tally: LensTally): string {
  const label = `${LENS_LABELS[lens.kind]} lens${describeSubject(model, lens)}.`;
  if (lensNeedsSubject(lens.kind) && lensSubjectId(lens) === null) return `${label} Choose a subject to see regions.`;
  if (lens.kind === 'band') return `${label} ${plural(tally.withValue, 'region', 'regions')} grouped by band.`;
  // A device's regions come from QIF's atlas file, not from drafted links, so no count of drafted links is given.
  if (lens.kind === 'stated_targets') return `${label} ${plural(tally.withValue, 'region', 'regions')} listed in the device's QIF record, ${tally.noData} not listed.`;
  const parts = [
    `${plural(tally.withValue, 'region', 'regions')} with a value`,
    `${tally.drafted} AI-drafted`,
    ...(tally.namedNotCounted > 0 ? [`${tally.namedNotCounted} named but not counted`] : []),
    `${tally.noData} with no data`,
  ];
  return `${label} ${parts.join(', ')}.`;
}
