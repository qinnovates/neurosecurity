/**
 * Brain region coordinates for medial (sagittal) SVG view.
 * ViewBox: 0 0 440 480
 *
 * Anatomical positioning (medial view, left hemisphere):
 * - Cortex (N7): top arc, anterior to posterior
 * - Limbic (N6): deep interior, midline structures
 * - Basal ganglia (N5): deep center
 * - Diencephalon (N4): central core
 * - Cerebellum (N3): posterior-inferior
 * - Brainstem (N2): inferior center
 * - Spinal (N1): bottom
 */

export interface BrainRegionCoord {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  labelOffset: { dx: number; dy: number };
}

export const BRAIN_REGION_COORDS: Record<string, BrainRegionCoord> = {
  // ═══ N7 — Neocortex (top arc, anterior → posterior) ═══
  pfc:        { cx: 95,  cy: 95,  rx: 22, ry: 14, labelOffset: { dx: 0, dy: -18 } },
  pmc:        { cx: 140, cy: 65,  rx: 16, ry: 11, labelOffset: { dx: 0, dy: -16 } },
  sma:        { cx: 175, cy: 48,  rx: 16, ry: 11, labelOffset: { dx: 0, dy: -16 } },
  m1:         { cx: 210, cy: 42,  rx: 18, ry: 12, labelOffset: { dx: 0, dy: -16 } },
  s1_cortex:  { cx: 248, cy: 48,  rx: 18, ry: 12, labelOffset: { dx: 0, dy: -16 } },
  ppc:        { cx: 285, cy: 65,  rx: 18, ry: 12, labelOffset: { dx: 0, dy: -16 } },
  broca:      { cx: 108, cy: 140, rx: 14, ry: 10, labelOffset: { dx: -18, dy: 0 } },
  wernicke:   { cx: 310, cy: 100, rx: 16, ry: 11, labelOffset: { dx: 18, dy: 0 } },
  a1:         { cx: 330, cy: 130, rx: 14, ry: 10, labelOffset: { dx: 16, dy: 0 } },
  v1:         { cx: 345, cy: 165, rx: 16, ry: 12, labelOffset: { dx: 16, dy: 0 } },

  // ═══ N6 — Limbic System (deep interior) ═══
  acc:          { cx: 135, cy: 115, rx: 14, ry: 10, labelOffset: { dx: -16, dy: 0 } },
  cingulate:    { cx: 220, cy: 90,  rx: 14, ry: 9,  labelOffset: { dx: 0, dy: -14 } },
  insula:       { cx: 155, cy: 165, rx: 14, ry: 10, labelOffset: { dx: -16, dy: 0 } },
  hippocampus:  { cx: 260, cy: 195, rx: 18, ry: 11, labelOffset: { dx: 0, dy: 16 } },
  bla:          { cx: 200, cy: 200, rx: 13, ry: 10, labelOffset: { dx: -16, dy: 0 } },

  // ═══ N5 — Basal Ganglia (deep center) ═══
  striatum:         { cx: 180, cy: 145, rx: 16, ry: 11, labelOffset: { dx: 0, dy: -15 } },
  gpi:              { cx: 195, cy: 170, rx: 10, ry: 8,  labelOffset: { dx: 14, dy: 0 } },
  gpe:              { cx: 175, cy: 185, rx: 10, ry: 8,  labelOffset: { dx: -14, dy: 0 } },
  stn:              { cx: 210, cy: 195, rx: 10, ry: 8,  labelOffset: { dx: 14, dy: 0 } },
  substantia_nigra: { cx: 220, cy: 230, rx: 14, ry: 9,  labelOffset: { dx: 16, dy: 0 } },
  vta:              { cx: 195, cy: 235, rx: 11, ry: 8,  labelOffset: { dx: -14, dy: 0 } },
  cea:              { cx: 220, cy: 210, rx: 10, ry: 8,  labelOffset: { dx: 14, dy: 0 } },

  // ═══ N4 — Diencephalon (central relay) ═══
  thalamus:     { cx: 235, cy: 160, rx: 20, ry: 14, labelOffset: { dx: 0, dy: -18 } },
  hypothalamus: { cx: 175, cy: 220, rx: 16, ry: 10, labelOffset: { dx: -18, dy: 0 } },
  vim:          { cx: 250, cy: 178, rx: 10, ry: 7,  labelOffset: { dx: 14, dy: 0 } },
  ant:          { cx: 220, cy: 145, rx: 10, ry: 7,  labelOffset: { dx: 0, dy: -12 } },

  // ═══ N3 — Cerebellum (posterior-inferior) ═══
  cerebellum_cortex: { cx: 340, cy: 260, rx: 24, ry: 16, labelOffset: { dx: 0, dy: -20 } },
  cerebellum_nuclei: { cx: 310, cy: 255, rx: 12, ry: 9,  labelOffset: { dx: -16, dy: 0 } },
  vermis:            { cx: 325, cy: 285, rx: 14, ry: 10, labelOffset: { dx: 0, dy: 16 } },

  // ═══ N2 — Brainstem (inferior center) ═══
  midbrain:            { cx: 240, cy: 260, rx: 16, ry: 10, labelOffset: { dx: -18, dy: 0 } },
  pons:                { cx: 250, cy: 290, rx: 18, ry: 12, labelOffset: { dx: -20, dy: 0 } },
  medulla:             { cx: 245, cy: 320, rx: 16, ry: 11, labelOffset: { dx: -20, dy: 0 } },
  reticular_formation: { cx: 265, cy: 285, rx: 10, ry: 8,  labelOffset: { dx: 14, dy: 0 } },

  // ═══ N1 — Spinal Cord (bottom) ═══
  cervical_cord: { cx: 235, cy: 360, rx: 12, ry: 9,  labelOffset: { dx: -18, dy: 0 } },
  thoracic_cord: { cx: 228, cy: 390, rx: 10, ry: 8,  labelOffset: { dx: -16, dy: 0 } },
  lumbar_cord:   { cx: 222, cy: 415, rx: 10, ry: 8,  labelOffset: { dx: -16, dy: 0 } },
  sacral_cord:   { cx: 218, cy: 438, rx: 9,  ry: 7,  labelOffset: { dx: -14, dy: 0 } },
  cauda_equina:  { cx: 215, cy: 458, rx: 8,  ry: 6,  labelOffset: { dx: -14, dy: 0 } },
};

/** Brain outline path for medial (sagittal) view — simplified silhouette */
export const BRAIN_OUTLINE_PATH = `
  M 80 130
  C 65 110 60 80 80 55
  C 100 25 140 15 180 15
  C 220 15 270 20 310 40
  C 340 55 365 85 370 120
  C 375 155 365 195 350 220
  C 340 240 365 250 375 275
  C 380 300 355 320 330 305
  C 310 295 295 310 280 330
  C 270 345 260 355 250 370
  L 240 460
  C 235 468 225 468 220 460
  L 210 370
  C 190 340 170 310 155 285
  C 130 260 100 240 80 210
  C 60 180 60 155 80 130
  Z
`;

/** Spinal cord path (extends below the brain) */
export const SPINAL_CORD_PATH = `
  M 242 345
  C 240 365 238 385 235 405
  C 232 425 228 445 225 460
  L 220 460
  C 217 445 214 425 212 405
  C 210 385 212 365 215 345
`;

/** Cerebellum outline (posterior-inferior) */
export const CEREBELLUM_PATH = `
  M 290 235
  C 300 230 330 225 360 245
  C 380 260 375 295 350 310
  C 335 320 310 315 295 305
  C 280 295 275 265 290 235
  Z
`;

/** Brainstem outline */
export const BRAINSTEM_PATH = `
  M 230 240
  C 235 235 260 235 270 245
  C 280 265 285 290 278 315
  C 272 335 260 350 248 360
  L 240 360
  C 225 345 215 325 212 305
  C 208 285 210 260 220 245
  Z
`;
