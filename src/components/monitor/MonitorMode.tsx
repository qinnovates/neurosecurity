import { useEffect, useMemo, useState } from 'react';
import Panel from '@/components/lab-kit/Panel';
import { useMediaQuery } from '@/components/lab-kit/use-media-query';
import { useFocus } from '@/components/workbench/FocusContext';
import type { ModeProps } from '@/components/workbench/mode-registry';
import { FREQUENCY_BANDS, bandShares, largestPowerOfTwoAtMost } from '@/lib/signal/band-power';
import type { SignalSample } from '@/lib/signal/sample-csv';
import { findThresholdEvents } from '@/lib/signal/threshold-events';
import EventList from './EventList';
import ScalpMap from './ScalpMap';
import SignalPlot from './SignalPlot';
import SpectrumBars from './SpectrumBars';
import { usePlayhead } from './use-playhead';
import { useSampleList, useSignalSample } from './use-signal-sample';
import '@/components/threat-model/threat-model.css';
import '@/components/explore/explore.css';
import './monitor.css';

/** The plot spans this many seconds, ending at the playhead. */
const PLOT_WINDOW_SECONDS = 8;
/** The spectrum and the scalp map describe this much signal before the playhead. */
const ANALYSIS_SECONDS = 2;
/** The spectrum is recomputed this many times a second; more would not be readable. */
const ANALYSIS_UPDATES_PER_SECOND = 8;
const MIN_ANALYSIS_SAMPLES = 64;
const SCALE_OPTIONS_MICROVOLTS = [25, 50, 100, 200];
const DEFAULT_SCALE_MICROVOLTS = 50;
const THRESHOLD_OPTIONS_MICROVOLTS = [50, 75, 100, 150];
const DEFAULT_THRESHOLD_MICROVOLTS = 75;
const DEFAULT_BAND_ID = 'alpha';
const SLIDER_STEP_SECONDS = 0.1;
/** Below this width the sample list becomes a menu, so the signal is the first thing on screen. */
const NARROW_SCREEN_QUERY = '(max-width: 1100px)';

/** Minutes, seconds and tenths. Rounds through whole tenths so 11.1 never prints as 11.0. */
export function formatTime(seconds: number): string {
  const tenths = Math.floor(seconds * 10 + 1e-6);
  const whole = Math.floor(tenths / 10);
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}.${tenths % 10}`;
}

/** Band shares for every channel over the stretch that ends at `time`; all zero until enough signal has passed. */
function analyse(sample: SignalSample, time: number): number[][] {
  const end = Math.min(sample.channels[0].length, Math.floor(time * sample.sampleRateHz));
  const size = largestPowerOfTwoAtMost(Math.min(end, Math.round(ANALYSIS_SECONDS * sample.sampleRateHz)));
  if (size < MIN_ANALYSIS_SAMPLES) return sample.channels.map(() => FREQUENCY_BANDS.map(() => 0));
  return sample.channels.map((channel) => bandShares(channel.subarray(end - size, end), sample.sampleRateHz));
}

function SampleMonitor({ sample, sampleName }: { sample: SignalSample; sampleName: string }) {
  const playhead = usePlayhead(sample.durationSeconds, PLOT_WINDOW_SECONDS);
  const [scale, setScale] = useState(DEFAULT_SCALE_MICROVOLTS);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD_MICROVOLTS);
  const [bandId, setBandId] = useState(DEFAULT_BAND_ID);

  const events = useMemo(() => findThresholdEvents(sample.channelNames, sample.channels, sample.sampleRateHz, threshold), [sample, threshold]);
  const analysisTick = Math.floor(playhead.time * ANALYSIS_UPDATES_PER_SECOND);
  const sharesByChannel = useMemo(() => analyse(sample, analysisTick / ANALYSIS_UPDATES_PER_SECOND), [sample, analysisTick]);
  const meanShares = FREQUENCY_BANDS.map((_, band) => sharesByChannel.reduce((sum, shares) => sum + shares[band], 0) / sharesByChannel.length);
  const bandIndex = Math.max(0, FREQUENCY_BANDS.findIndex((band) => band.id === bandId));
  const band = FREQUENCY_BANDS[bandIndex];
  const sampleIndex = Math.min(sample.channels[0].length - 1, Math.floor(playhead.time * sample.sampleRateHz));

  return (
    <>
      <div className="monitor-middle">
        <Panel title={`${sampleName}: ${sample.channelNames.length} channels at ${Math.round(sample.sampleRateHz)} Hz`}>
          <SignalPlot
            sample={sample} time={playhead.time} windowSeconds={PLOT_WINDOW_SECONDS} scaleMicrovolts={scale} events={events}
            label={`Synthetic sample ${sampleName}: ${sample.channelNames.length} channels over the ${PLOT_WINDOW_SECONDS} seconds before ${formatTime(playhead.time)}. Not a recording from a person.`}
          />
          <div className="monitor-transport">
            <button type="button" className="lab-button lab-button--primary" onClick={playhead.isPlaying ? playhead.pause : playhead.play}>{playhead.isPlaying ? 'Pause' : 'Play'}</button>
            <span className="lab-figure" role="timer">{formatTime(playhead.time)} of {formatTime(sample.durationSeconds)}</span>
            <input
              type="range" min={0} max={sample.durationSeconds} step={SLIDER_STEP_SECONDS} value={playhead.time} aria-label="Playhead, in seconds"
              aria-valuetext={formatTime(playhead.time)} onChange={(event) => { playhead.pause(); playhead.seek(Number(event.target.value)); }}
            />
            <label className="monitor-rule">
              <span className="lab-label">Row height</span>
              <select className="catalog-select" style={{ width: 'auto' }} value={scale} onChange={(event) => setScale(Number(event.target.value))}>
                {SCALE_OPTIONS_MICROVOLTS.map((option) => <option key={option} value={option}>±{option} µV</option>)}
              </select>
            </label>
          </div>
          <details className="monitor-values">
            <summary>Values at the playhead</summary>
            <table className="lab-table">
              <thead><tr><th scope="col"><span className="lab-table-head">Channel</span></th><th scope="col"><span className="lab-table-head">Microvolts</span></th></tr></thead>
              <tbody>{sample.channelNames.map((name, index) => <tr key={name}><td>{name}</td><td className="lab-figure">{sample.channels[index][sampleIndex].toFixed(1)}</td></tr>)}</tbody>
            </table>
          </details>
        </Panel>
        <Panel title={`Spectrum, last ${ANALYSIS_SECONDS} seconds`}>
          <SpectrumBars shares={meanShares} selectedBandId={band.id} onSelectBand={setBandId} />
        </Panel>
      </div>
      <div className="monitor-side">
        <Panel title={`Scalp map: ${band.label}`}>
          <ScalpMap channelNames={sample.channelNames} shares={sharesByChannel.map((shares) => shares[bandIndex])} bandLabel={band.label.toLowerCase()} />
        </Panel>
        <Panel title="Events in this sample">
          <EventList
            events={events} markers={sample.markers} thresholdMicrovolts={threshold} thresholdOptions={THRESHOLD_OPTIONS_MICROVOLTS}
            onThresholdChange={setThreshold} time={playhead.time} onSeek={(time) => { playhead.pause(); playhead.seek(time); }} formatTime={formatTime}
          />
        </Panel>
      </div>
    </>
  );
}

/**
 * The Monitor mode: what a neural signal looks like while it is being watched. It plays
 * computer-generated samples. Nothing here is connected to a device, and nothing is detected.
 */
export default function MonitorMode(_props: ModeProps) {
  const { state } = useFocus();
  const { listings, error: listError } = useSampleList();
  const [file, setFile] = useState<string | null>(null);
  const { sample, error: sampleError } = useSignalSample(file);
  const isNarrowScreen = useMediaQuery(NARROW_SCREEN_QUERY);

  useEffect(() => {
    if (file === null && listings !== null && listings.length > 0) setFile(listings[0].file);
  }, [file, listings]);

  const selected = listings?.find((listing) => listing.file === file);
  const recordsSignal = state.model.direction !== 'write';
  return (
    <div className="monitor">
      <section className="lab-panel monitor-banner" aria-label="About these signals">
        <span className="monitor-stamp">Synthetic sample</span>
        <p>
          Computer-generated signals shaped like EEG. Not recordings from people, and not connected to any device. Marked events are demonstrations of one stated rule, not detections.{' '}
          {recordsSignal
            ? `${state.model.name} records, so a signal of this general kind would leave its neural interface. These samples are generic and are not its signal.`
            : `${state.model.name} only stimulates, so it produces no signal like this. The samples are generic EEG, shown for orientation.`}
        </p>
      </section>
      <Panel title={listings === null ? 'Samples' : `${listings.length} samples`}>
        {listError !== null && <p className="tm-error" role="alert">{listError}</p>}
        {listings === null && listError === null && <p className="lab-soft" role="status">Loading the sample list…</p>}
        {listings !== null && listings.length === 0 && <p className="lab-soft">The sample folder lists no samples.</p>}
        {isNarrowScreen ? (
          <select className="catalog-select" aria-label="Sample" value={file ?? ''} onChange={(event) => setFile(event.target.value)}>
            {listings?.map((listing) => <option key={listing.file} value={listing.file}>{listing.name}: {listing.description}</option>)}
          </select>
        ) : (
          <ul className="lab-pick-list">
            {listings?.map((listing) => (
              <li key={listing.file}>
                <button type="button" className="lab-pick" aria-pressed={listing.file === file} onClick={() => setFile(listing.file)}>
                  <strong>{listing.name}</strong>
                  <span className="lab-soft lab-pick-sub">{listing.description}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {sampleError !== null && <p className="tm-error" role="alert">{sampleError}</p>}
      {sample === null && sampleError === null && file !== null && <p className="lab-soft" role="status">Loading the sample…</p>}
      {sample !== null && selected !== undefined && <SampleMonitor key={selected.file} sample={sample} sampleName={selected.name} />}
    </div>
  );
}
