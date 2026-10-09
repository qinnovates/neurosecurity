import { useId } from 'react';
import type { IndexLayer } from '@/lib/anatomy/anatomy-index-types';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { LayerId } from '@/lib/anatomy/source-types';
import { limitForLayer } from '@/lib/atlas-explorer/limit-selection';
import LimitNote from './LimitNote';

export const LAYER_LABELS: Readonly<Record<LayerId, string>> = {
  outline: 'Brain outline',
  cortical: 'Cortical shapes',
  deep: 'Deep structures',
  tracts: 'Tracts',
  networks: 'Networks',
  devices: 'Devices',
};

interface Props {
  layers: readonly IndexLayer[];
  requested: Readonly<Record<LayerId, boolean>>;
  onToggle: (layerId: LayerId) => void;
}

interface RowProps {
  layer: IndexLayer;
  isRequested: boolean;
  onToggle: (layerId: LayerId) => void;
}

/**
 * One layer. A layer this build cannot show keeps its control, marked
 * unavailable but still reachable by keyboard, with the reason beside it.
 */
function LayerRow({ layer, isRequested, onToggle }: RowProps) {
  const reasonId = useId();
  const unavailable = limitForLayer(layer);
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

/** The layers of the 3D view. Present on this page so the controls and their reasons can be read without it. */
export default function LayerPanel({ layers, requested, onToggle }: Props) {
  return (
    <section className="atlas-panel atlas-layers" aria-labelledby="atlas-layers-heading">
      <h2 className="atlas-heading" id="atlas-layers-heading">Layers</h2>
      <LimitNote limit={limitSentence('layers_text_only')} />
      <ul className="atlas-layer-list">
        {layers.map((layer) => <LayerRow key={layer.id} layer={layer} isRequested={requested[layer.id]} onToggle={onToggle} />)}
      </ul>
    </section>
  );
}
