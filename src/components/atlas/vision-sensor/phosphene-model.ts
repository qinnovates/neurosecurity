/**
 * Phosphene perception model based on published neuroscience.
 *
 * Primary source: van der Grinten et al. (2024) "Towards biologically plausible
 * phosphene simulation for the differentiable optimization of visual cortical
 * prostheses." eLife 12:e85812. DOI: 10.7554/eLife.85812
 *
 * Additional: Bosking et al. (2017) J Neurosci — phosphene size saturation
 *             Fernández et al. (2021) JCI — 96-channel human intracortical
 *             Beauchamp et al. (2020) Cell — dynamic sequential stimulation
 *
 * DISCLAIMER: This is a research simulation for threat modeling purposes,
 * not a clinical instrument. All parameters are approximate.
 */

// --- Electrode Configurations (real devices) ---

export interface ElectrodeConfig {
  id: string;
  name: string;
  electrodeCount: number;
  type: 'surface' | 'intracortical';
  pitchMm: number; // inter-electrode distance
  thresholdUA: number; // mean threshold in microamps
  year: number;
  status: string;
  source: string;
}

export const ELECTRODE_CONFIGS: ElectrodeConfig[] = [
  {
    id: 'orion',
    name: 'Orion (Cortigent)',
    electrodeCount: 60,
    type: 'surface',
    pitchMm: 3.0,
    thresholdUA: 1200,
    year: 2018,
    status: 'EFS 6-year, investigational',
    source: 'Cortigent NANS 2026',
  },
  {
    id: 'cortivis',
    name: 'CORTIVIS (Utah Array)',
    electrodeCount: 96,
    type: 'intracortical',
    pitchMm: 0.4,
    thresholdUA: 67,
    year: 2018,
    status: 'Phase I, 3 patients',
    source: 'Fernández et al. 2021 JCI',
  },
  {
    id: 'icvp',
    name: 'ICVP (Wireless)',
    electrodeCount: 400,
    type: 'intracortical',
    pitchMm: 0.4,
    thresholdUA: 50,
    year: 2022,
    status: 'Phase I, 2 patients',
    source: 'IIT/Troyk 2024',
  },
  {
    id: 'gennaris',
    name: 'Gennaris (Monash)',
    electrodeCount: 172,
    type: 'intracortical',
    pitchMm: 0.5,
    thresholdUA: 60,
    year: 2026,
    status: 'Preclinical (sheep)',
    source: 'Guo et al. 2020 J Neural Eng',
  },
  {
    id: 'future1024',
    name: 'Research (1024ch)',
    electrodeCount: 1024,
    type: 'intracortical',
    pitchMm: 0.4,
    thresholdUA: 50,
    year: 2020,
    status: 'NHP only (Chen et al. 2020 Science)',
    source: 'Chen et al. 2020 Science',
  },
];

// --- Cortical Magnification (Schwartz 1977 / Polimeni 2006) ---

/**
 * Cortical magnification factor: mm of V1 cortex per degree of visual angle.
 * Follows inverse-linear model: M(e) = A / (e + e₂)
 * where e = eccentricity in degrees, A ≈ 29.8, e₂ ≈ 1.717
 * Source: Bosking et al. 2017, fitting Engel et al. 1997 data
 */
export function corticalMagnification(eccentricityDeg: number): number {
  const A = 29.8; // scaling factor (mm·deg)
  const e2 = 1.717; // eccentricity constant (deg)
  return A / (eccentricityDeg + e2);
}

/**
 * Areal cortical magnification: mm² of V1 per degree² of visual angle.
 * Ma(e) = A² / (e + e₂)⁴ — derived from linear CMF squared
 * At fovea (0°): ~300 mm²/deg²
 * At 10°:  ~0.5 mm²/deg²
 */
export function arealMagnification(eccentricityDeg: number): number {
  const A = 29.8;
  const e2 = 1.717;
  return (A * A) / Math.pow(eccentricityDeg + e2, 4);
}

// --- Phosphene Model (van der Grinten 2024) ---

/**
 * Phosphene angular size in degrees of visual angle.
 *
 * Model: P = D / M(e)
 * where D = activated cortex diameter (mm), M(e) = cortical magnification
 *
 * D scales with current: D = 2 * sqrt(I / K)
 * K = 675 µA/mm² (current-distance constant from Bosking 2017)
 *
 * Size saturates at ~3.1x threshold size (Bosking 2017)
 */
export function phospheneSize(
  currentUA: number,
  eccentricityDeg: number,
): number {
  const K = 675; // µA/mm²
  const activatedDiameterMm = 2 * Math.sqrt(currentUA / K);
  // Saturation: max ~5.3mm diameter regardless of current
  const clampedDiameter = Math.min(activatedDiameterMm, 5.3);
  const M = corticalMagnification(eccentricityDeg);
  return clampedDiameter / M;
}

/**
 * Phosphene brightness (0-1) based on current and adaptation.
 *
 * Brightness increases with pulse rate up to ~200Hz (saturation).
 * Continuous stimulation causes fading: τ_trace = 1,970s (van der Grinten 2024)
 * Fast activation dynamics: τ_act = 0.111s
 */
export function phospheneBrightness(
  currentUA: number,
  thresholdUA: number,
  stimulationDurationS: number,
): number {
  if (currentUA < thresholdUA) return 0;

  // Suprathreshold brightness (logarithmic, saturating)
  const ratio = currentUA / thresholdUA;
  const rawBrightness = Math.min(1, Math.log2(ratio) / 3);

  // Adaptation decay (fading after ~10-15s continuous)
  const tauTrace = 30; // simplified from 1,970s for visible demo effect
  const adaptation = Math.exp(-stimulationDurationS / tauTrace);

  return rawBrightness * (0.3 + 0.7 * adaptation);
}

// --- Retinotopic Mapping (log-polar transform) ---

/**
 * Map visual field position (degrees) to V1 cortical surface coordinates (mm).
 * Uses the complex logarithmic (wedge-dipole) model.
 *
 * w = k * log(z + a)
 * where z = eccentricity * e^(i*polar_angle)
 *
 * Parameters from Polimeni et al. 2006 / van der Grinten 2024:
 *   k = 17.3, a = 0.75
 */
export function visualFieldToV1(
  eccentricityDeg: number,
  polarAngleRad: number,
): { x: number; y: number } {
  const k = 17.3;
  const a = 0.75;

  const zReal = eccentricityDeg * Math.cos(polarAngleRad) + a;
  const zImag = eccentricityDeg * Math.sin(polarAngleRad);

  const mag = Math.sqrt(zReal * zReal + zImag * zImag);
  const phase = Math.atan2(zImag, zReal);

  return {
    x: k * Math.log(mag),
    y: k * phase,
  };
}

// --- Electrode Grid Generation ---

export interface Phosphene {
  id: number;
  /** Visual field eccentricity in degrees */
  eccentricity: number;
  /** Visual field polar angle in radians */
  polarAngle: number;
  /** Screen x position (normalized 0-1) */
  x: number;
  /** Screen y position (normalized 0-1) */
  y: number;
  /** Angular size in degrees */
  sizeDeg: number;
  /** Brightness 0-1 */
  brightness: number;
  /** Whether this electrode is currently active */
  active: boolean;
}

/**
 * Generate a phosphene map for a given electrode configuration.
 * Places electrodes across the accessible V1 surface (occipital pole),
 * covering roughly the central 10° of visual field.
 */
export function generatePhospheneMap(
  config: ElectrodeConfig,
  currentUA?: number,
): Phosphene[] {
  const n = config.electrodeCount;
  const current = currentUA ?? config.thresholdUA * 1.5;
  const phosphenes: Phosphene[] = [];

  // Approximate grid layout: sqrt(n) x sqrt(n)
  const cols = Math.ceil(Math.sqrt(n * 1.5)); // wider than tall
  const rows = Math.ceil(n / cols);

  // Cover central ~10° of visual field (accessible V1 at occipital pole)
  const maxEccentricity = 10;

  let id = 0;
  for (let r = 0; r < rows && id < n; r++) {
    for (let c = 0; c < cols && id < n; c++) {
      // Map grid position to visual field coordinates
      const nx = (c + 0.5) / cols; // 0-1
      const ny = (r + 0.5) / rows; // 0-1

      // Convert to eccentricity and polar angle
      // Foveal center = (0.5, 0.5), eccentricity increases outward
      const dx = (nx - 0.5) * 2 * maxEccentricity;
      const dy = (ny - 0.5) * 2 * maxEccentricity;
      const ecc = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      if (ecc <= maxEccentricity) {
        const sizeDeg = phospheneSize(current, ecc);

        phosphenes.push({
          id: id++,
          eccentricity: ecc,
          polarAngle: angle,
          x: nx,
          y: ny,
          sizeDeg,
          brightness: 0,
          active: false,
        });
      } else {
        id++;
      }
    }
  }

  return phosphenes;
}

// --- RF Signal Mapping ---

/**
 * Simulated WiFi CSI resolution limits.
 * Source: DensePose from WiFi (CMU, arXiv 2301.00250)
 */
export const RF_LIMITS = {
  wifi_2_4ghz: {
    bandwidth_mhz: 72,
    rangeResolutionM: 2.0,
    poseAccuracy: 'keypoint-level (17 COCO joints)',
    wallPenetration: true,
  },
  wifi_5ghz: {
    bandwidth_mhz: 160,
    rangeResolutionM: 1.0,
    poseAccuracy: 'DensePose-level (24 body regions)',
    wallPenetration: true,
  },
  ble_5_1: {
    angularAccuracyDeg: 3,
    positionAccuracyM: 0.5,
    method: 'AoA (Angle of Arrival)',
    wallPenetration: false,
  },
};

/**
 * Convert RF-inferred scene information to a phosphene activation pattern.
 * This is the novel pipeline: RF sensing → scene model → phosphene stimulation.
 *
 * RESEARCH NOTE: No published work connects RF sensing to cortical prosthetic
 * input pipelines. This is a proposed research direction visualized as simulation.
 */
export function rfSceneToPhosphenes(
  phosphenes: Phosphene[],
  sceneObjects: Array<{ x: number; y: number; radius: number; intensity: number }>,
  currentUA: number,
  thresholdUA: number,
  time: number,
): Phosphene[] {
  return phosphenes.map(p => {
    let totalIntensity = 0;

    for (const obj of sceneObjects) {
      const dx = p.x - obj.x;
      const dy = p.y - obj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < obj.radius) {
        totalIntensity += obj.intensity * (1 - dist / obj.radius);
      }
    }

    const active = totalIntensity > 0.1;
    // Scale brightness by intensity, but keep current above threshold so phosphenes activate
    const effectiveCurrent = active ? Math.max(thresholdUA * 1.1, currentUA * Math.min(1, totalIntensity)) : 0;
    const brightness = active
      ? phospheneBrightness(effectiveCurrent, thresholdUA, time) * Math.min(1, totalIntensity * 1.5)
      : 0;

    return { ...p, active, brightness };
  });
}
