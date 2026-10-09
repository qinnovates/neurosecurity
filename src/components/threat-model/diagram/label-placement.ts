/**
 * Settles each connection's label where no other connection runs under it. A label a
 * foreign line passes through reads as that line's label, so a label on a lane slides along
 * its own run to the nearest clear place. Nothing else about the drawing moves.
 */

import { doesSegmentEnterBox, segmentsOf, type Box, type Point } from './diagram-geometry';

export interface LabelledLine {
  id: string;
  points: Point[];
  card: Box;
}

/** How far a label moves between two places tried along its run. */
const SLIDE_STEP = 4;

/** Runs of other connections that pass through this label. */
export function countRunsUnder(card: Box, ownId: string, lines: readonly LabelledLine[]): number {
  return lines.filter((line) => line.id !== ownId).reduce(
    (count, line) => count + segmentsOf(line.points).filter(([from, to]) => doesSegmentEnterBox(from, to, card)).length,
    0,
  );
}

/** The horizontal run of the line that the label sits on: the one through the label's centre line that covers its middle. */
function findRunUnder(line: LabelledLine): [Point, Point] | null {
  const middle = { x: line.card.x + line.card.width / 2, y: line.card.y + line.card.height / 2 };
  return segmentsOf(line.points).find(([from, to]) => from.y === to.y && from.y === middle.y
    && middle.x >= Math.min(from.x, to.x) && middle.x <= Math.max(from.x, to.x)) ?? null;
}

/** Places for the label along its run, nearest its present place first, each wholly on the run with `stub` of line showing at both ends. */
function listPlacesAlong(run: [Point, Point], card: Box, stub: number): number[] {
  const lowest = Math.min(run[0].x, run[1].x) + stub;
  const highest = Math.max(run[0].x, run[1].x) - stub - card.width;
  const places: number[] = [];
  for (let offset = SLIDE_STEP; card.x - offset >= lowest || card.x + offset <= highest; offset += SLIDE_STEP) {
    if (card.x - offset >= lowest) places.push(card.x - offset);
    if (card.x + offset <= highest) places.push(card.x + offset);
  }
  return places;
}

/**
 * The same lines with each label clear of the others' runs where its own run has room.
 * A label that cannot be cleared stays where it was.
 * @param stub the length of line that must show on each side of a label
 */
export function settleLabels<Line extends LabelledLine>(lines: readonly Line[], stub: number): Line[] {
  return lines.map((line) => {
    if (line.card.width === 0 || countRunsUnder(line.card, line.id, lines) === 0) return line;
    const run = findRunUnder(line);
    if (run === null) return line;
    const clearX = listPlacesAlong(run, line.card, stub).find((x) => countRunsUnder({ ...line.card, x }, line.id, lines) === 0);
    return clearX === undefined ? line : { ...line, card: { ...line.card, x: clearX } };
  });
}
