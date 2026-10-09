/**
 * Holds an anatomy index to its type and to the rules that tie its fields
 * together. The build runs it on the index it is about to emit: an index that
 * has lost its status, a review state, a layer's reason, or that marks lit a
 * link its own fields say may not light, never ships.
 *
 * At run time the page does not need this: it checks the index's bytes against
 * the length and digest it was built with, and those bytes passed here.
 */

import { ANATOMY_INDEX_SCHEMA_VERSION, type AnatomyIndex, type IndexLayer, type IndexOwner, type IndexReviewState, type IndexTechniqueLink } from './anatomy-index-types';
import { ANATOMY_INDEX_SHAPE } from './anatomy-index-schema';
import { UNCHECKED } from './evidence';
import { childOf, failAt, itemOf, rootOf, show, type FieldLocation } from './field-readers';
import { readSchemaVersion } from './format-readers';
import { lightsRegion } from './resolve-region-term';
import { describeReviewState } from './review-state';
import { checkShape } from './shape-check';
import { ANATOMY_INDEX_STATUS, readStatus } from './status-sentences';

const INDEX_NAME = 'anatomy index';

/** A review state carries a role and a date exactly when it is `reviewed`, and exactly the mark its state shows. */
function checkReviewState(reviewState: IndexReviewState, location: FieldLocation): void {
  const hasReviewer = 'reviewer_role' in reviewState && 'reviewed_on' in reviewState;
  const hasPartialReviewer = ('reviewer_role' in reviewState || 'reviewed_on' in reviewState) && !hasReviewer;
  if (hasPartialReviewer || hasReviewer !== (reviewState.state === 'reviewed')) {
    failAt(location, 'a review state names a role and a date exactly when it is "reviewed"', 'Build the state with toIndexReviewState.');
  }
  if (reviewState.mark !== describeReviewState(reviewState)) {
    failAt(childOf(location, 'mark'), `the mark must read "${describeReviewState(reviewState)}"`, 'Build the state with toIndexReviewState; never write a mark by hand.');
  }
}

function checkLayer(layer: IndexLayer, location: FieldLocation): void {
  if (!layer.available && layer.reason === null) {
    failAt(childOf(location, 'reason'), 'an unavailable layer must say why', 'Carry the reason from the source\'s clearance record.');
  }
}

/** A row owner carries its row's grade, never `none`; an owner reached through a containment carries no grade. */
function checkOwner(owner: IndexOwner, location: FieldLocation): void {
  const gradeLocation = childOf(location, 'extent_match');
  if (owner.extent_match === 'none') failAt(gradeLocation, 'an owner graded "none" owns nothing', 'A row graded "none" names no label, so it cannot be an owner.');
  if ((owner.via === 'row') !== (owner.extent_match !== null)) {
    failAt(gradeLocation, 'a row owner carries its row\'s grade and a containment owner carries none', 'Build owners with buildOwnerMap.');
  }
  checkReviewState(owner.review_state, childOf(location, 'review_state'));
  checkVouchedStatus(owner, location);
}

/** A check status other than `unchecked` is a claim that only a covering review can make. */
function checkVouchedStatus(entry: Pick<IndexOwner, 'review_state' | 'check_status'>, location: FieldLocation): void {
  if (entry.review_state.state !== 'reviewed' && entry.check_status !== UNCHECKED) {
    failAt(childOf(location, 'check_status'), 'an entry no review covers can only read "unchecked"', 'Derive the status with checkEvidence; never copy a file\'s own claim.');
  }
}

/** `lit` is derived. It may be true only when every field it is derived from allows it, and only for a region the index holds. */
function checkLink(link: IndexTechniqueLink, location: FieldLocation, regionIds: ReadonlySet<string>): void {
  const mayLight = lightsRegion(link.resolution) && link.resolved_region_id !== null && link.band_agrees
    && link.valid_for_current_addressing && link.quote_state === 'quote_found';
  if (link.lit && !mayLight) {
    failAt(childOf(location, 'lit'), 'a link may be lit only when it resolves by id or synonym, agrees with the band tags, is current and is still quoted',
      'Derive lit in build-index-techniques.ts; never set it by hand.');
  }
  if (link.lit && !regionIds.has(link.resolved_region_id ?? '')) {
    failAt(childOf(location, 'resolved_region_id'), `a lit link must resolve to a region in the index; "${show(link.resolved_region_id)}" is not one`, 'Resolve terms with createTermResolver.');
  }
  checkReviewState(link.review_state, childOf(location, 'review_state'));
  checkVouchedStatus(link, location);
}

function checkEach<T>(items: readonly T[], location: FieldLocation, key: string, check: (item: T, itemLocation: FieldLocation) => void): void {
  items.forEach((item, index) => check(item, itemOf(location, key, index)));
}

function checkDraftedThings(index: AnatomyIndex, root: FieldLocation): void {
  checkEach(index.layers, root, 'layers', checkLayer);
  checkEach(index.structures, root, 'structures', (structure, location) => {
    checkReviewState(structure.review_state, childOf(location, 'review_state'));
    checkEach(structure.owners, location, 'owners', checkOwner);
    if (structure.review_state.state === 'reviewed' && structure.owners.some((owner) => owner.review_state.state !== 'reviewed')) {
      failAt(childOf(location, 'review_state'), 'a structure cannot read reviewed while one of its owners is unreviewed', 'Take the worst state among the owners with worstReviewState.');
    }
  });
  checkEach(index.subjects, root, 'subjects', (subject, location) => checkReviewState(subject.review_state, childOf(location, 'review_state')));
  const regionIds = new Set(index.subjects.filter((subject) => subject.kind === 'region').map((subject) => subject.id));
  checkEach(index.techniques, root, 'techniques', (technique, location) =>
    checkEach(technique.links, location, 'links', (link, linkLocation) => checkLink(link, linkLocation, regionIds)));
  checkEach(index.devices.fiducials, childOf(root, 'devices'), 'fiducials', (fiducial, location) => checkReviewState(fiducial.review_state, childOf(location, 'review_state')));
  checkEach(index.devices.leads, childOf(root, 'devices'), 'leads', (lead, location) => checkReviewState(lead.review_state, childOf(location, 'review_state')));
}

/** Throws AnatomyDataError unless `raw` has the whole index shape, every field of the right type, and consistent derived fields. */
export function parseAnatomyIndex(raw: unknown): AnatomyIndex {
  const root = rootOf(INDEX_NAME);
  checkShape(raw, ANATOMY_INDEX_SHAPE, root);
  const index = raw as AnatomyIndex;
  readSchemaVersion({ schema_version: index.schema_version }, root, ANATOMY_INDEX_SCHEMA_VERSION);
  readStatus({ status: index.status }, root, ANATOMY_INDEX_STATUS);
  checkDraftedThings(index, root);
  return index;
}
