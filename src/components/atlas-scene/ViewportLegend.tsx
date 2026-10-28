import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { PickedShape } from '@/lib/atlas-explorer/resolve-pick';
import { listLegendSteps, type SceneShape } from '@/lib/atlas-explorer/scene-shapes';
import type { ViewportCaption } from '@/lib/atlas-explorer/viewport-caption';
import { LAYER_NOUNS } from '@/lib/atlas-explorer/viewport-caption';
import type { IndexAsset } from '@/lib/anatomy/anatomy-index-types';
import Disclosure from './Disclosure';
import LimitNote from './LimitNote';
import MarkGlyph from './MarkGlyph';
import { ASSET_FAILURE_SENTENCES } from './scene-assets';
import type { SceneAssetStates } from './use-scene-assets';

interface Props {
  caption: ViewportCaption;
  drawnShapes: readonly SceneShape[];
  /** The files asked for, in the order they load. */
  assets: readonly IndexAsset[];
  assetStates: SceneAssetStates;
  picked: PickedShape | null;
  onRetryAssets: () => void;
  onSelectRegion: (regionId: string) => void;
  onClearPick: () => void;
}

const KILOBYTE = 1000;

function describeAsset(asset: IndexAsset, states: SceneAssetStates): string {
  const state = states[asset.id];
  if (state === undefined || state.status === 'loading') return 'Loading…';
  return state.status === 'ready' ? 'Drawn.' : ASSET_FAILURE_SENTENCES[state.reason];
}

/** Each file's state, in words, so a layer that is slow or refused is never just missing. */
function AssetStatuses({ assets, assetStates, onRetryAssets }: Pick<Props, 'assets' | 'assetStates' | 'onRetryAssets'>) {
  const hasFailure = assets.some((asset) => assetStates[asset.id]?.status === 'failed');
  return (
    <div className="atlas-asset-states" role="status">
      <ul className="atlas-plain-list">
        {assets.map((asset) => (
          <li key={asset.id} className="atlas-fact" data-asset-id={asset.id} data-asset-status={assetStates[asset.id]?.status ?? 'loading'}>
            <strong>{LAYER_NOUNS[asset.layer]}</strong> ({asset.id}), {Math.round(asset.bytes / KILOBYTE)} kB: {describeAsset(asset, assetStates)}
          </li>
        ))}
      </ul>
      {hasFailure && <button type="button" className="atlas-button" onClick={onRetryAssets}>Try the files again</button>}
      <Disclosure label="How each file was made and checked">
        <ul className="atlas-plain-list">
          {assets.map((asset) => (
            <li key={asset.id} className="atlas-fact" data-asset-note={asset.id}>
              <strong>{LAYER_NOUNS[asset.layer]}</strong> ({asset.id}). Position: {asset.position_check}. {asset.modification_note}
            </li>
          ))}
        </ul>
      </Disclosure>
    </div>
  );
}

function PickedPanel({ picked, onSelectRegion, onClearPick }: Pick<Props, 'onSelectRegion' | 'onClearPick'> & { picked: PickedShape }) {
  return (
    <div className="atlas-picked" data-picked-key={picked.structureKey}>
      <p className="atlas-fact">Picked shape: <strong>{picked.label}</strong>, from {picked.sourceName}.</p>
      {picked.regions.length === 0 && <LimitNote limit={limitSentence('picked_shape_unowned')} />}
      {picked.regions.length > 0 && picked.selectedRegionId === null && <LimitNote limit={limitSentence(picked.regions.length === 1 ? 'picked_shape_larger' : 'picked_shape_shared')} />}
      {picked.regions.length > 0 && (
        <ul className="atlas-chips" aria-label="QIF regions with a record on this shape">
          {picked.regions.map((region) => <li key={region.id}><button type="button" className="atlas-chip" onClick={() => onSelectRegion(region.id)}>{region.name}</button></li>)}
        </ul>
      )}
      <button type="button" className="atlas-link-button" onClick={onClearPick}>Clear the picked shape</button>
    </div>
  );
}

/** What the marks in the picture mean, in words beside each, with the limit of every mark on screen. */
export default function ViewportLegend({ caption, drawnShapes, assets, assetStates, picked, onRetryAssets, onSelectRegion, onClearPick }: Props) {
  const steps = listLegendSteps(drawnShapes);
  // Each ring line, and the sentence under them, is shown only while that ring is on screen, so the legend never explains a mark the picture does not hold.
  const hasCoarseRing = drawnShapes.some((shape) => shape.sizeMark === 'mesh_and_ring');
  const hasPlaceOnlyRing = drawnShapes.some((shape) => shape.sizeMark === 'ring_only');
  return (
    <div className="atlas-legend">
      <AssetStatuses assets={assets} assetStates={assetStates} onRetryAssets={onRetryAssets} />
      {picked !== null && <PickedPanel picked={picked} onSelectRegion={onSelectRegion} onClearPick={onClearPick} />}
      <ul className="atlas-legend-marks" aria-label="What the marks mean">
        <li><MarkGlyph mark="solid" /> filled: the lens holds a value for this shape</li>
        <li><MarkGlyph mark="inside_or_mixed" /> pale: somewhere inside, or records differ</li>
        <li><MarkGlyph mark="no_data" /> lines only: no data</li>
        {hasCoarseRing && <li><span className="atlas-ring-swatch" data-ring="coarse_outline" aria-hidden="true" /> ring: the shape it sits on is outlined only roughly</li>}
        {hasPlaceOnlyRing && <li><span className="atlas-ring-swatch" data-ring="place_only" aria-hidden="true" /> ring with a centre: no outline at all, only a place</li>}
        <li><span className="atlas-selection-swatch" aria-hidden="true" /> corner marks with a name above them: selected</li>
        {steps.map((entry) => <li key={entry.step}><span className="atlas-step-swatch" style={{ background: entry.colour }} aria-hidden="true" /> {entry.step.replaceAll('_', ' ')}</li>)}
      </ul>
      {/* How a ring reads under the lens is a limit sentence like the others now: it arrives in caption.markLimits, from limits-copy.ts, rather than being typed here. */}
      {caption.markLimits.map((limit) => <LimitNote key={limit.id} limit={limit} />)}
    </div>
  );
}
