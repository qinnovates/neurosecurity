// Fixture for legacy-geometry-ratchet.test.ts: a new hand-placed region table under a new name.
// It uses none of the old constant names, so only the structural pattern can find it.
export const ELECTRODE_LANDMARKS: Record<string, [number, number, number]> = {
  thalamus: [0, 0.5, -1],
  hippocampus: [-4, -4, 0],
  'pfc': [0, 8, 12],
};
