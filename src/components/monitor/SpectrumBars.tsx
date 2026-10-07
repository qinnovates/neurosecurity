import { FREQUENCY_BANDS } from '@/lib/signal/band-power';

interface Props {
  /** Share of power per band, in the order of FREQUENCY_BANDS, each from 0 to 1. */
  shares: readonly number[];
  selectedBandId: string;
  onSelectBand: (bandId: string) => void;
}

const GRID_STEPS = [25, 50, 75, 100];

function percent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/**
 * How the last two seconds of signal divide between the frequency bands, averaged over
 * the channels. The axis is fixed at 0 to 100%, so a bar's height means the same in every
 * sample. Choosing a bar draws that band on the scalp map.
 */
export default function SpectrumBars({ shares, selectedBandId, onSelectBand }: Props) {
  return (
    <div className="monitor-spectrum" role="group" aria-label="Share of signal power by frequency band. Choose a band to map it on the scalp.">
      <div className="monitor-spectrum-plot">
        {GRID_STEPS.map((step) => <span key={step} className="monitor-spectrum-grid" style={{ bottom: `${step}%` }}><span>{step}%</span></span>)}
        {FREQUENCY_BANDS.map((band, index) => (
          <button
            key={band.id} type="button" className="monitor-band" aria-pressed={band.id === selectedBandId}
            title={`${band.label}, ${band.fromHz} to ${band.toHz} Hz: ${percent(shares[index] ?? 0)} of power`} onClick={() => onSelectBand(band.id)}
          >
            <span className="monitor-band-value lab-figure">{percent(shares[index] ?? 0)}</span>
            <span className="monitor-band-bar" style={{ height: `${Math.max(0, Math.min(1, shares[index] ?? 0)) * 100}%` }} />
          </button>
        ))}
      </div>
      <div className="monitor-spectrum-axis" aria-hidden="true">
        {FREQUENCY_BANDS.map((band) => <span key={band.id}><strong>{band.label}</strong><span className="lab-soft">{band.fromHz}–{band.toHz} Hz</span></span>)}
      </div>
    </div>
  );
}
