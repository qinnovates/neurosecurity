/**
 * Builds the three.js objects for the EEG electrode layout: one dot and one
 * name per electrode, at the position the index gives. It decides nothing:
 * which dots exist and where each is arrive already chosen (device-drawing.ts).
 * A dot is a dot. No line, cone or patch runs from it to the brain.
 */

import { BackSide, Group, Mesh, MeshBasicMaterial, SphereGeometry } from 'three';
import type { DeviceDrawing, ElectrodeDot } from '@/lib/atlas-explorer/device-drawing';
import { DRAW_ORDER, SELECTION_COLOUR } from '@/lib/atlas-explorer/scene-drawing';
import { buildLabelSprite } from './scene-marks';

/** Nominal sizes in millimetres. A dot marks a place on the head surface; its size says nothing about an electrode's. */
const DOT_RADIUS_MM = 2.6;
const RIM_RADIUS_MM = 3.4;
const DOT_SEGMENTS = 16;
/** What a click is tested against: larger than the dot, so a finger can pick it. It is never drawn. */
const PICK_RADIUS_MM = 6;
const PICK_SEGMENTS = 8;
const LABEL_HEIGHT_MM = 7;
/** How far outside its dot a name sits, so the two do not cover each other. */
const LABEL_OFFSET_MM = 8;
const DOT_COLOUR = '#ffffff';
const RIM_COLOUR = '#1c1e26';
/**
 * The picked dot's ink takes no theme, and that is deliberate rather than
 * overlooked. A dot is white with a dark rim on both surfaces, so what the
 * picked one has to stand out against is the dot beside it, not the page: this
 * ink reads 17.8:1 against the white dot, where the dark surface's selection ink
 * (`#fcfcfb`) would be the white dot. That is why this takes the one ink on both
 * surfaces rather than a surface ink: it stands against the dot, not the page.
 * See `SELECTION_COLOUR` in scene-drawing.ts.
 */
const PICKED_DOT_COLOUR = SELECTION_COLOUR;

export interface DeviceObjects {
  group: Group;
  /** One unseen sphere around each dot, carrying its electrode's id. A click on one picks the electrode and no shape. */
  pickTargets: Mesh[];
}

/** The middle of the dots, used only to push each name outward from its dot. It is a layout aid and stands for nothing. */
function middleOfDots(electrodes: readonly ElectrodeDot[]): [number, number, number] {
  const mean = (axis: number): number => electrodes.reduce((total, electrode) => total + electrode.positionScene[axis], 0) / Math.max(electrodes.length, 1);
  return [mean(0), mean(1), mean(2)];
}

function labelPlace(electrode: ElectrodeDot, middle: readonly [number, number, number]): [number, number, number] {
  const away = [0, 1, 2].map((axis) => electrode.positionScene[axis] - middle[axis]);
  const length = Math.hypot(away[0], away[1], away[2]) || 1;
  return [0, 1, 2].map((axis) => electrode.positionScene[axis] + (away[axis] / length) * LABEL_OFFSET_MM) as [number, number, number];
}

/** A white dot with a dark rim, so it reads on a light page and a dark one; the picked dot takes the selection colour. */
export function buildDeviceObjects(drawing: DeviceDrawing, selectedElectrodeId: string | null, fontFamily: string): DeviceObjects {
  const objects: DeviceObjects = { group: new Group(), pickTargets: [] };
  const middle = middleOfDots(drawing.electrodes);
  for (const electrode of drawing.electrodes) {
    const [x, y, z] = electrode.positionScene;
    const isPicked = electrode.id === selectedElectrodeId;
    const rim = new Mesh(new SphereGeometry(RIM_RADIUS_MM, DOT_SEGMENTS, DOT_SEGMENTS), new MeshBasicMaterial({ color: RIM_COLOUR, side: BackSide }));
    const dot = new Mesh(new SphereGeometry(DOT_RADIUS_MM, DOT_SEGMENTS, DOT_SEGMENTS), new MeshBasicMaterial({ color: isPicked ? PICKED_DOT_COLOUR : DOT_COLOUR }));
    const target = new Mesh(new SphereGeometry(PICK_RADIUS_MM, PICK_SEGMENTS, PICK_SEGMENTS), new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    for (const part of [rim, dot, target]) {
      part.position.set(x, y, z);
      part.renderOrder = DRAW_ORDER.mark;
    }
    dot.userData = { electrodeDot: electrode.id };
    target.userData = { electrodeId: electrode.id };
    objects.pickTargets.push(target);
    objects.group.add(rim, dot, target);
    // A name is hidden by a filled shape in front of it, as its dot is: a name never floats over the brain without its dot.
    const label = buildLabelSprite(electrode.id, labelPlace(electrode, middle), LABEL_HEIGHT_MM, fontFamily, false);
    if (label !== null) objects.group.add(label);
  }
  return objects;
}
