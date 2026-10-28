/**
 * The polar arithmetic every radar on the site shares. It was written out three
 * times before this file existed (the NISS radar, the neurorights polygon and
 * the grid rings inside each of them), so the angle convention and the ring
 * maths now have one home and one test.
 *
 * A share is a fraction of an axis, 0 to 1. `shareOf` is the only way to make
 * one, and it refuses a value it cannot place: a chart that drew an unreadable
 * number at the origin would show an absence of measurement as a measured
 * floor, which is the defect this whole module exists to prevent.
 */

export interface Point {
  x: number;
  y: number;
}

/** The first axis points at 12 o'clock, and the rest run clockwise from it. */
export const FIRST_AXIS_ANGLE = -Math.PI / 2;
/** Fewer than three axes is a line or a point, not a radar. */
export const MINIMUM_AXES = 3;

export class RadarGeometryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RadarGeometryError';
  }
}

/** The angle of axis `index` of `count`, in radians. */
export function axisAngle(index: number, count: number): number {
  if (!Number.isInteger(count) || count < MINIMUM_AXES) {
    throw new RadarGeometryError(`A radar needs at least ${MINIMUM_AXES} axes, not ${count}.`);
  }
  if (!Number.isInteger(index) || index < 0 || index >= count) {
    throw new RadarGeometryError(`Axis ${index} is outside a chart of ${count} axes.`);
  }
  return FIRST_AXIS_ANGLE + (index * 2 * Math.PI) / count;
}

export function polarPoint(angle: number, radius: number, centre: Point): Point {
  return { x: centre.x + radius * Math.cos(angle), y: centre.y + radius * Math.sin(angle) };
}

/**
 * A fraction of an axis, from a measured value and the top of its scale.
 * A value outside the scale is held at its end; a value that is not a finite
 * number, or a scale that cannot divide, throws rather than reading as zero.
 */
export function shareOf(value: number, scaleMaximum: number): number {
  if (!Number.isFinite(value)) throw new RadarGeometryError(`"${value}" is not a value a radar can place on an axis.`);
  if (!Number.isFinite(scaleMaximum) || scaleMaximum <= 0) throw new RadarGeometryError(`A radar axis needs a positive scale, not ${scaleMaximum}.`);
  return Math.min(Math.max(value / scaleMaximum, 0), 1);
}

/** The `points` attribute of the polygon through one point per axis, at `shares[i]` of `radius`. */
export function sharePolygon(shares: readonly number[], radius: number, centre: Point): string {
  return shares
    .map((share, index) => {
      if (!Number.isFinite(share) || share < 0 || share > 1) throw new RadarGeometryError(`Share ${share} on axis ${index} is not a fraction between 0 and 1. Build it with shareOf.`);
      return polarPoint(axisAngle(index, shares.length), share * radius, centre);
    })
    .map((point) => `${round(point.x)},${round(point.y)}`)
    .join(' ');
}

/** The `points` attribute of one grid ring: the full polygon at `radius`. */
export function ringPolygon(axisCount: number, radius: number, centre: Point): string {
  return Array.from({ length: axisCount }, (_unused, index) => polarPoint(axisAngle(index, axisCount), radius, centre))
    .map((point) => `${round(point.x)},${round(point.y)}`)
    .join(' ');
}

/** The radii of `count` evenly spaced rings, the outermost at `radius`. */
export function ringRadii(count: number, radius: number): number[] {
  if (!Number.isInteger(count) || count < 1) throw new RadarGeometryError(`A radar needs at least one grid ring, not ${count}.`);
  return Array.from({ length: count }, (_unused, index) => (radius * (index + 1)) / count);
}

/** Two decimals: enough for a 320px chart, and it keeps the markup readable and stable between renders. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}
