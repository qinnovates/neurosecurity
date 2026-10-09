/**
 * The crosswalk rules that span more than one row: who may share an atlas
 * label, which atlas a subject draws from, and how containment and
 * no-geometry records must agree with the rows.
 */

import type { ContainsRelation, Crosswalk, CrosswalkRow, SubjectKind } from './anatomy-types';
import { childOf, failAt, type FieldLocation } from './field-readers';

const SAME = 'same';

export function subjectKey(subject: { subject_kind: SubjectKind; subject_id: string }): string {
  return `${subject.subject_kind}:${subject.subject_id}`;
}

export function structureKey(atlas: string, labelId: string): string {
  return `${atlas}:${labelId}`;
}

/** True when one region is the declared parent or the declared child of the other. */
export function areDeclaredRelatives(contains: readonly ContainsRelation[], firstId: string, secondId: string): boolean {
  return contains.some((relation) =>
    (relation.parent === firstId && relation.child === secondId) || (relation.parent === secondId && relation.child === firstId));
}

function groupRowsByStructure(rows: readonly CrosswalkRow[]): Map<string, CrosswalkRow[]> {
  const rowsByStructure = new Map<string, CrosswalkRow[]>();
  for (const row of rows) {
    for (const labelId of row.atlas_ids) {
      const key = structureKey(row.atlas, labelId);
      rowsByStructure.set(key, [...(rowsByStructure.get(key) ?? []), row]);
    }
  }
  return rowsByStructure;
}

/**
 * One atlas label cannot be `same` for two subjects, and `same` is refused on
 * a label that a second subject also names unless that subject is the first
 * one's declared parent or child.
 */
function rejectSharedSame(crosswalk: Crosswalk, location: FieldLocation): void {
  for (const [key, rows] of groupRowsByStructure(crosswalk.rows)) {
    const sameRow = rows.find((row) => row.extent_match === SAME);
    if (sameRow === undefined) continue;
    const others = rows.filter((row) => subjectKey(row) !== subjectKey(sameRow));
    const secondSame = others.find((row) => row.extent_match === SAME);
    if (secondSame !== undefined) {
      return failAt(location, `label "${key}" is graded "same" for both "${sameRow.subject_id}" and "${secondSame.subject_id}"`,
        'A shape can be the same thing as one record only. Regrade one row, or declare the relation and grade the inner one "contained".');
    }
    const stranger = others.find((row) => !areDeclaredRelatives(crosswalk.contains, sameRow.subject_id, row.subject_id));
    if (stranger !== undefined) {
      return failAt(location, `label "${key}" is graded "same" for "${sameRow.subject_id}" but "${stranger.subject_id}" also names it and is not its declared parent or child`,
        'Regrade the "same" row, or declare the containment in "contains".');
    }
  }
}

/** All of a subject's drawing rows must name one atlas, so parts are never mixed across atlases. */
function rejectMixedDrawingAtlases(rows: readonly CrosswalkRow[], location: FieldLocation): void {
  const drawingAtlasBySubject = new Map<string, string>();
  for (const row of rows.filter((candidate) => candidate.draws)) {
    const drawingAtlas = drawingAtlasBySubject.get(subjectKey(row));
    if (drawingAtlas !== undefined && drawingAtlas !== row.atlas) {
      return failAt(location, `${row.subject_kind} "${row.subject_id}" draws from both "${drawingAtlas}" and "${row.atlas}"`,
        'Choose one drawing atlas for the subject and set draws to false on the other rows.');
    }
    drawingAtlasBySubject.set(subjectKey(row), row.atlas);
  }
}

function rejectContainmentLoops(contains: readonly ContainsRelation[], location: FieldLocation): void {
  const seen = new Set<string>();
  for (const relation of contains) {
    if (relation.parent === relation.child) failAt(location, `"${relation.parent}": a region cannot contain itself`, 'Remove the relation.');
    const pair = `${relation.parent}>${relation.child}`;
    if (seen.has(pair)) failAt(location, `containment "${pair}" appears twice`, 'Keep one and remove the other.');
    if (seen.has(`${relation.child}>${relation.parent}`)) {
      failAt(location, `"${relation.parent}" and "${relation.child}" contain each other`, 'Keep the relation that is true and remove the other.');
    }
    seen.add(pair);
  }
}

/** A no_geometry record says no buildable atlas has geometry for the subject, so the subject cannot also have a drawing row. */
function rejectDrawnNoGeometry(crosswalk: Crosswalk, location: FieldLocation): void {
  const drawnSubjects = new Set(crosswalk.rows.filter((row) => row.draws).map(subjectKey));
  const contradicted = crosswalk.no_geometry.find((record) => drawnSubjects.has(subjectKey(record)));
  if (contradicted === undefined) return;
  failAt(location, `${contradicted.subject_kind} "${contradicted.subject_id}" has a no_geometry record and a drawing row`,
    'Remove the no_geometry record now that an atlas draws the subject, or set draws to false.');
}

export function rejectCrossRowProblems(crosswalk: Crosswalk, root: FieldLocation): void {
  rejectContainmentLoops(crosswalk.contains, childOf(root, 'contains'));
  rejectSharedSame(crosswalk, childOf(root, 'rows'));
  rejectMixedDrawingAtlases(crosswalk.rows, childOf(root, 'rows'));
  rejectDrawnNoGeometry(crosswalk, childOf(root, 'no_geometry'));
}
