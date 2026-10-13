/**
 * What the explorer needs to know about the devices layer before the visitor
 * turns it on: its name, whether it is shown, and whether it starts on. The
 * drawing itself and the words for a picked electrode are in device-drawing.ts,
 * which only the layout panel and the 3D view load.
 */

import type { AnatomyIndex, IndexElectrodeLayout } from '@/lib/anatomy/anatomy-index-types';
import type { LayerId } from '@/lib/anatomy/source-types';

export const DEVICES_LAYER: LayerId = 'devices';
/** The layer's name wherever it is shown. It says what is drawn, and nothing about what an electrode picks up. */
export const ELECTRODE_LAYER_NAME = 'EEG electrode layout';

/** Whether the index lets the devices layer be shown and the visitor has asked for it. */
export function isDevicesLayerShown(index: AnatomyIndex, requested: Readonly<Record<LayerId, boolean>>): boolean {
  return requested[DEVICES_LAYER] && index.layers.some((layer) => layer.id === DEVICES_LAYER && layer.available);
}

/** The layouts the index says may be drawn: each sits on the head surface it was placed on. */
export function listDrawableLayouts(index: AnatomyIndex): IndexElectrodeLayout[] {
  return index.devices.electrode_layouts.filter((layout) => layout.drawable);
}

/**
 * The layers that are on when the explorer starts. The devices layer follows
 * the data: it starts on only if a drawable layout says it is shown by default.
 */
export function layersAtStart(index: AnatomyIndex, base: Readonly<Record<LayerId, boolean>>): Record<LayerId, boolean> {
  return { ...base, [DEVICES_LAYER]: listDrawableLayouts(index).some((layout) => layout.shown_by_default) };
}
