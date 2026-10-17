import { FREQUENCY_BANDS } from '@/lib/signal/band-power';
import { formatPercent } from './monitor-format';

interface Props {
  /** Each band's share of the band power of all channels together, in the order of FREQUENCY_BANDS, each from 0 to 1. */
  composition: readonly number[];
  selectedBandId: string;
  onSelectBand: (bandId: string) => void;
}

function describeComposition(composition: readonly number[]): string {
  return `Share of band power: ${FREQUENCY_BANDS.map((band, index) => `${band.label} ${formatPercent(composition[index] ?? 0)}`).join(', ')}.`;
}

/**
 * How the analysis window's power divides between the frequency bands: one bar split into
 * five shares, with each figure printed. The shares are parts of one whole, so they are drawn
 * as one bar and not as five. Choosing a band shows it on the scalp cells.
 */
export default function BandComposition({ composition, selectedBandId, onSelectBand }: Props) {
  return (
    <div className="monitor-bands">
      <div className="monitor-bands-track" role="img" aria-label={describeComposition(composition)}>
        {FREQUENCY_BANDS.map((band, index) => (
          <span key={band.id} className="monitor-bands-share" data-selected={band.id === selectedBandId} style={{ flexGrow: composition[index] ?? 0 }} />
        ))}
      </div>
      <div className="monitor-bands-keys" role="group" aria-label="Band shown on the scalp cells">
        {FREQUENCY_BANDS.map((band, index) => (
          <button key={band.id} type="button" className="monitor-band" aria-pressed={band.id === selectedBandId} onClick={() => onSelectBand(band.id)}>
            <span className="lab-figure">{formatPercent(composition[index] ?? 0)}</span>
            <span>{band.label}</span>
            <span className="lab-label">{band.fromHz} to {band.toHz} Hz</span>
          </button>
        ))}
      </div>
    </div>
  );
}
