// Fixture for legacy-geometry-ratchet.test.ts: numeric tuples that are not keyed by brain regions.
export const CAMERA_PRESETS: Record<string, { position: [number, number, number]; fov: number }> = {
  overview: { position: [0, 3, 16], fov: 42 },
  close: { position: [0, 0, 10], fov: 35 },
};
export const MARGINS = { top: [4, 8], bottom: [4, 8] };
