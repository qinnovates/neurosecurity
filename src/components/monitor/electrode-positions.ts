/**
 * Where the standard 10-20 scalp electrodes sit, seen from above with the nose at the top.
 * Coordinates are on a unit circle: x to the wearer's right, y toward the back of the head.
 * These are the conventional schematic positions, not measurements of any head.
 */
export const ELECTRODE_POSITIONS: Readonly<Record<string, readonly [number, number]>> = {
  Fp1: [-0.31, -0.81], Fp2: [0.31, -0.81],
  F7: [-0.81, -0.59], F3: [-0.4, -0.45], Fz: [0, -0.42], F4: [0.4, -0.45], F8: [0.81, -0.59],
  T3: [-1, 0], C3: [-0.5, 0], Cz: [0, 0], C4: [0.5, 0], T4: [1, 0],
  T5: [-0.81, 0.59], P3: [-0.4, 0.45], Pz: [0, 0.48], P4: [0.4, 0.45], T6: [0.81, 0.59],
  O1: [-0.31, 0.81], Oz: [0, 0.9], O2: [0.31, 0.81],
};
