import { useId } from 'react';
import type { IndexLayer, IndexSource } from '@/lib/anatomy/anatomy-index-types';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { LayerId } from '@/lib/anatomy/source-types';
import { ELECTRODE_LAYER_NAME } from '@/lib/atlas-explorer/device-drawing';
import { limitForLayer } from '@/lib/atlas-explorer/limit-selection';
import Disclosure from './Disclosure';
import LimitNote from './LimitNote';

export const LAYER_LABELS: Readonly<Record<LayerId, string>> = {
  outline: 'Brain outline',
  cortical: 'Cortical shapes',
  deep: 'Deep structures',
  tracts: 'Tracts',
  networks: 'Networks',
  devices: ELECTRODE_LAYER_NAME,
};

interface Props {
  layers: readonly IndexLayer[];
  /** The index's sources, whose blocker codes choose the sentence beside an unavailable layer. */
  sources: readonly IndexSource[];
  requested: Readonly<Record<LayerId, boolean>>;
  onToggle: (layerId: LayerId) => void;
}

interface RowProps {
  layer: IndexLayer;
  sources: readonly IndexSource[];
  isRequested: boolean;
  onToggle: (layerId: LayerId) => void;
}

/**
 * One layer. A layer this build cannot show keeps its control, marked
 * unavailable but still reachable by keyboard, with the reason beside it.
 */
function LayerRow({ layer, sources, isRequested, onToggle }: RowProps) {
  const reasonId = useId();
  const unavailable = limitForLayer(layer, sources);
  return (
    <li className="atlas-layer" data-available={layer.available}>
      <button
        type="button" className="atlas-toggle" aria-pressed={layer.available && isRequested}
        aria-disabled={!layer.available} aria-describedby={unavailable === null ? undefined : reasonId}
        onClick={() => { if (layer.available) onToggle(layer.id); }}
      >
        <span className="atlas-toggle-box" aria-hidden="true" />
        {LAYER_LABELS[layer.id]}
      </button>
      {unavailable !== null && <LimitNote limit={unavailable} id={reasonId} />}
    </li>
  );
}

/**
 * The layers of the 3D view, behind one button so that controls for a view this page does not draw are not the first
 * thing a visitor meets. Opened, every layer is there with its reason, including the ones this build cannot show.
 */
export default function LayerPanel({ layers, sources, requested, onToggle }: Props) {
  const availableCount = layers.filter((layer) => layer.available).length;
  return (
    <section className="atlas-panel atlas-layers" aria-labelledby="atlas-layers-heading">
      <h2 className="atlas-heading" id="atlas-layers-heading">Layers</h2>
      <LimitNote limit={limitSentence('layers_text_only')} />
      <Disclosure label={`Show the ${layers.length} layers (${availableCount} available in this build)`}>
        <ul className="atlas-layer-list">
          {layers.map((layer) => <LayerRow key={layer.id} layer={layer} sources={sources} isRequested={requested[layer.id]} onToggle={onToggle} />)}
        </ul>
      </Disclosure>
    </section>
  );
}
