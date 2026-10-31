import { ATLAS_EXPLORER_PATH } from '../brain/AtlasExplorerLink';
import RegionViewMount, { BAND_LENS } from '../atlas-scene/RegionViewMount';
import type { SignalBenchEvent, SignalBenchPlacement } from './signal-bench-events';

function describePlacement(placement: SignalBenchPlacement): string {
  switch (placement.kind) {
    case 'neural':
      return `Bracketed: the ${placement.layerName} layer.`;
    case 'classical':
      return 'Nothing to bracket on the brain: this technique sits in the classical stack, the device and software security already models.';
    case 'seam':
      return 'Nothing to bracket inside a layer: this technique sits on the seam, where tissue meets electrode.';
  }
}

/** What one chosen event means on the layers, with the brain beside it. The mount stays put so an open view survives a new choice. */
export default function SignalBenchSelection({ event }: { event: SignalBenchEvent }) {
  const { placement } = event;
  const atlasHref = `${ATLAS_EXPLORER_PATH}?highlight=${encodeURIComponent(event.id)}`;
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] mt-3 text-sm">
      <div>
        <p aria-live="polite" className="text-[var(--color-text-primary)]">
          {event.id}. {describePlacement(placement)}
        </p>
        {placement.alsoTagged.length > 0 && (
          <p className="text-[var(--color-text-muted)] mt-1">Also tags {placement.alsoTagged.join(', ')}.</p>
        )}
        <a href={atlasHref} data-astro-reload className="inline-flex items-center min-h-[44px] text-[var(--color-accent-primary)] hover:underline">
          Open the atlas
        </a>
      </div>
      <RegionViewMount lens={BAND_LENS} selectedBandId={placement.kind === 'neural' ? placement.bandId : null} />
    </div>
  );
}
