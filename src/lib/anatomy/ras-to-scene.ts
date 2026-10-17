/**
 * The one mapping from the atlas's axes to the screen's. The atlas files are in
 * millimetres with x to the person's right, y to the front and z up (RAS). The
 * scene has x to the right, y up and z towards the viewer. No other code
 * converts axes, so the brain cannot be drawn mirrored by a second convention.
 */

export type Point3 = readonly [number, number, number];

/** Rows of the mapping. Its determinant is +1: a rotation, never a reflection. */
export const RAS_TO_SCENE_MATRIX: readonly [Point3, Point3, Point3] = [[1, 0, 0], [0, 0, 1], [0, -1, 0]];

export function rasToScene([x, y, z]: Point3): [number, number, number] {
  return [x, z, -y];
}

export function determinantOf([[a, b, c], [d, e, f], [g, h, i]]: readonly [Point3, Point3, Point3]): number {
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

/** Converts a flat x, y, z list in place-order to scene axes, into a new array. */
export function positionsToScene(positionsMm: Float32Array): Float32Array {
  const scene = new Float32Array(positionsMm.length);
  for (let offset = 0; offset < positionsMm.length; offset += 3) {
    scene[offset] = positionsMm[offset];
    scene[offset + 1] = positionsMm[offset + 2];
    scene[offset + 2] = -positionsMm[offset + 1];
  }
  return scene;
}
