/** Plain geometry for the device diagram: points, boxes, and the tests the layout is held to. */

export interface Point { x: number; y: number }
export interface Box { x: number; y: number; width: number; height: number }

/** Which way a connection runs across its label, from its `from` part to its `to` part. */
export type Heading = 'right' | 'left' | 'down' | 'up';

export const OPPOSITE_HEADING: Readonly<Record<Heading, Heading>> = { right: 'left', left: 'right', down: 'up', up: 'down' };

export function centreOf(box: Box): Point {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

export function boxAround(centre: Point, width: number, height: number): Box {
  return { x: centre.x - width / 2, y: centre.y - height / 2, width, height };
}

export function headingOf(from: Point, to: Point): Heading {
  if (from.y === to.y) return to.x >= from.x ? 'right' : 'left';
  return to.y >= from.y ? 'down' : 'up';
}

/** True when the point lies on the box's outline, within half a pixel. */
export function isOnBoxEdge(point: Point, box: Box): boolean {
  const tolerance = 0.5;
  const isWithinX = point.x >= box.x - tolerance && point.x <= box.x + box.width + tolerance;
  const isWithinY = point.y >= box.y - tolerance && point.y <= box.y + box.height + tolerance;
  const isOnVerticalSide = Math.abs(point.x - box.x) <= tolerance || Math.abs(point.x - box.x - box.width) <= tolerance;
  const isOnHorizontalSide = Math.abs(point.y - box.y) <= tolerance || Math.abs(point.y - box.y - box.height) <= tolerance;
  return (isOnVerticalSide && isWithinY) || (isOnHorizontalSide && isWithinX);
}

/**
 * True when a horizontal or vertical segment passes through the inside of the box. Touching
 * the outline does not count, so a connection may end on the edge of a part.
 */
export function doesSegmentEnterBox(from: Point, to: Point, box: Box): boolean {
  const left = Math.min(from.x, to.x);
  const right = Math.max(from.x, to.x);
  const top = Math.min(from.y, to.y);
  const bottom = Math.max(from.y, to.y);
  return left < box.x + box.width && right > box.x && top < box.y + box.height && bottom > box.y;
}

export function doBoxesOverlap(first: Box, second: Box): boolean {
  return first.x < second.x + second.width && second.x < first.x + first.width
    && first.y < second.y + second.height && second.y < first.y + first.height;
}

/** Consecutive pairs of a polyline. */
export function segmentsOf(points: readonly Point[]): [Point, Point][] {
  return points.slice(1).map((point, index): [Point, Point] => [points[index], point]);
}

function towards(from: Point, to: Point, distance: number): Point {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length === 0) return from;
  const share = Math.min(distance, length / 2) / length;
  return { x: from.x + (to.x - from.x) * share, y: from.y + (to.y - from.y) * share };
}

/** An SVG path along the points, with each corner rounded. The curve stays inside the corner it replaces. */
export function roundedPath(points: readonly Point[], radius: number): string {
  if (points.length === 0) return '';
  const commands = [`M ${points[0].x} ${points[0].y}`];
  for (let index = 1; index < points.length - 1; index += 1) {
    const corner = points[index];
    const entry = towards(corner, points[index - 1], radius);
    const exit = towards(corner, points[index + 1], radius);
    commands.push(`L ${entry.x} ${entry.y}`, `Q ${corner.x} ${corner.y} ${exit.x} ${exit.y}`);
  }
  const last = points[points.length - 1];
  if (points.length > 1) commands.push(`L ${last.x} ${last.y}`);
  return commands.join(' ');
}
