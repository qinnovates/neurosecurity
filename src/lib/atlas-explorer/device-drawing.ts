/**
 * What the devices layer draws, decided here as plain data: the EEG electrode
 * layout as dots on the head surface, and the words that go with a picked dot.
 * The layout is drawn only when the visitor has turned the layer on and the
 * index says the head surface is the one the positions were placed on.
 *
 * Nothing here is computed from geometry. A dot has a name and a position and
 * no region: there is no "nearest region", no distance to the cortex and no
 * area under an electrode anywhere in this module.
 */

import type { AnatomyIndex, IndexReviewState } from '@/lib/anatomy/anatomy-index-types';
import { limitSentence, type LimitSentence } from '@/lib/anatomy/limits-copy';
import type { FiducialId } from '@/lib/anatomy/parse-device-geometry';
import { rasToScene, type Point3 } from '@/lib/anatomy/ras-to-scene';
import type { LayerId } from '@/lib/anatomy/source-types';
import { ELECTRODE_LAYER_NAME, isDevicesLayerShown, listDrawableLayouts } from './devices-layer';

export { DEVICES_LAYER, ELECTRODE_LAYER_NAME, isDevicesLayerShown, layersAtStart, listDrawableLayouts } from './devices-layer';

/** How much further back the camera stands once the head surface is drawn, so the whole head is in the picture. */
export const HEAD_VIEW_SCALE = 1.35;

export interface ElectrodeDot {
  id: string;
  positionScene: Point3;
  alsoCalled: string | null;
}

export interface DeviceDrawing {
  layoutId: string;
  layoutName: string;
  /** Shown with the drawing wherever it appears; a layout is never drawn without it. */
  reviewState: IndexReviewState;
  electrodes: ElectrodeDot[];
}

/** The dots to draw, or null while the layer is off, unavailable or holds no drawable layout. */
export function buildDeviceDrawing(index: AnatomyIndex, requested: Readonly<Record<LayerId, boolean>>): DeviceDrawing | null {
  const layout = isDevicesLayerShown(index, requested) ? listDrawableLayouts(index)[0] : undefined;
  if (layout === undefined) return null;
  return {
    layoutId: layout.id,
    layoutName: layout.name,
    reviewState: layout.review_state,
    electrodes: layout.electrodes.map((electrode) => ({ id: electrode.id, positionScene: rasToScene(electrode.position_mm), alsoCalled: electrode.also_called })),
  };
}

/** Each landmark as the landmark limit sentence names it. */
export const LANDMARK_WORDS: Readonly<Record<FiducialId, string>> = {
  nasion: 'The dip above the nose',
  inion: 'The bump at the back of the skull',
  left_preauricular: 'The point in front of the left ear',
  right_preauricular: 'The point in front of the right ear',
};

export interface LandmarkNote {
  id: FiducialId;
  words: string;
  /** How far the landmark's placement can be trusted, as the data file says it. Null when the file says nothing. */
  note: string | null;
  reviewState: IndexReviewState;
}

export function listLandmarkNotes(index: AnatomyIndex): LandmarkNote[] {
  return index.devices.fiducials.map((fiducial) => ({ id: fiducial.id, words: LANDMARK_WORDS[fiducial.id], note: fiducial.confidence_note, reviewState: fiducial.review_state }));
}

export interface ElectrodeDetail {
  id: string;
  alsoCalled: string | null;
  layoutName: string;
  reviewState: IndexReviewState;
  /** The layout's limit, that a pick selects no region, and the landmarks' limit, in that order. */
  limits: LimitSentence[];
  landmarks: LandmarkNote[];
}

/** What is shown for a picked electrode: its name, the limits and the landmark notes. No region, and nothing measured. */
export function describeElectrode(index: AnatomyIndex, electrodeId: string): ElectrodeDetail | null {
  for (const layout of listDrawableLayouts(index)) {
    const electrode = layout.electrodes.find((candidate) => candidate.id === electrodeId);
    if (electrode === undefined) continue;
    return {
      id: electrode.id, alsoCalled: electrode.also_called, layoutName: layout.name, reviewState: layout.review_state,
      limits: [limitSentence('device_electrodes'), limitSentence('device_electrode_pick'), limitSentence('device_landmarks')],
      landmarks: listLandmarkNotes(index),
    };
  }
  return null;
}

export interface DeviceCaption {
  /** "EEG electrode layout: 21 positions." */
  label: string;
  reviewState: IndexReviewState;
  limits: LimitSentence[];
}

/** The lines the picture's caption carries while the layout is drawn, so no picture of it lacks its review state or its limits. */
export function buildDeviceCaption(drawing: DeviceDrawing): DeviceCaption {
  return {
    label: `${ELECTRODE_LAYER_NAME}: ${drawing.electrodes.length} positions.`,
    reviewState: drawing.reviewState,
    limits: [limitSentence('device_electrodes'), limitSentence('device_head_surface')],
  };
}
