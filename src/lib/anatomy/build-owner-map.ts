/**
 * Builds the owner map: for each atlas structure, every QIF subject whose rows
 * name it, plus the subjects that reach it through a declared containment. One
 * map covers meshes and bundles. Styling reads the full owner set from here.
 */

import type { IndexOwner, IndexReviewState } from './anatomy-index-types';
import type { ContainsRelation, CrosswalkRow } from './anatomy-types';
import { structureKey } from './crosswalk-rules';
import type { CheckStatus } from './evidence';

/** A crosswalk row with the state the build derived for it. */
export interface ReviewedRow {
  row: CrosswalkRow;
  key: string;
  digest: string;
  review_state: IndexReviewState;
  check_status: CheckStatus;
}

function toRowOwner(reviewed: ReviewedRow): IndexOwner {
  const { row } = reviewed;
  return { subject_kind: row.subject_kind, subject_id: row.subject_id, via: 'row', extent_match: row.extent_match, review_state: reviewed.review_state, check_status: reviewed.check_status };
}

/** The declared parents and children of one row owner. They inherit the state of the row they reach the structure through. */
function listRelatives(owner: IndexOwner, contains: readonly ContainsRelation[]): IndexOwner[] {
  if (owner.subject_kind !== 'region') return [];
  const viaContainment = (subjectId: string, via: IndexOwner['via']): IndexOwner => ({ ...owner, subject_id: subjectId, via, extent_match: null });
  return contains.flatMap((relation) => {
    if (relation.child === owner.subject_id) return [viaContainment(relation.parent, 'declared_parent')];
    if (relation.parent === owner.subject_id) return [viaContainment(relation.child, 'declared_child')];
    return [];
  });
}

function addOwner(owners: IndexOwner[], candidate: IndexOwner): void {
  const isListed = owners.some((owner) => owner.subject_kind === candidate.subject_kind && owner.subject_id === candidate.subject_id);
  if (!isListed) owners.push(candidate);
}

/**
 * @param rows only the rows valid for the current addressing; any other row owns nothing
 * @returns structure key -> owners, row owners first, in row order
 */
export function buildOwnerMap(rows: readonly ReviewedRow[], contains: readonly ContainsRelation[]): Map<string, IndexOwner[]> {
  const ownersByStructure = new Map<string, IndexOwner[]>();
  for (const reviewed of rows) {
    for (const labelId of reviewed.row.atlas_ids) {
      const key = structureKey(reviewed.row.atlas, labelId);
      const owners = ownersByStructure.get(key) ?? [];
      addOwner(owners, toRowOwner(reviewed));
      ownersByStructure.set(key, owners);
    }
  }
  for (const owners of ownersByStructure.values()) {
    const rowOwners = [...owners];
    rowOwners.flatMap((owner) => listRelatives(owner, contains)).forEach((relative) => addOwner(owners, relative));
  }
  return ownersByStructure;
}
