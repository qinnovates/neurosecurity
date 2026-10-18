import { useMemo } from 'react';
import EmptyState from '@/components/lab-kit/EmptyState';
import Panel from '@/components/lab-kit/Panel';
import Segmented from '@/components/lab-kit/Segmented';
import { useViewState } from '@/components/workbench/ViewStateContext';
import { ANALYSIS_WINDOW_SAMPLES, analyseWindow, analysisWindowSeconds } from '@/lib/signal/analysis-window';
import { FREQUENCY_BANDS } from '@/lib/signal/band-power';
import type { SignalSample } from '@/lib/signal/sample-csv';
import { findChannelSpans, findThresholdEvents, mergeSamplesFor } from '@/lib/signal/threshold-events';
import BandComposition from './BandComposition';
import EventList from './EventList';
import { formatHertz, formatMicrovolts, formatPercent, formatSeconds, formatTime } from './monitor-format';
import ScalpCells from './ScalpCells';
import { isThresholdDrawable } from './signal-plot-draw';
import SignalPlot from './SignalPlot';
import { usePlayhead } from './use-playhead';

/** The plot shows this many seconds at a time. */
const PLOT_PAGE_SECONDS = 8;
/** The analysis is recomputed this many times a second of signal; more would not be readable. */
const ANALYSIS_UPDATES_PER_SECOND = 8;
const SCALE_OPTIONS_MICROVOLTS = [25, 50, 100, 200];
/** Large enough that the default threshold is drawn inside a row. */
const DEFAULT_SCALE_MICROVOLTS = 100;
const THRESHOLD_OPTIONS_MICROVOLTS = [50, 75, 100, 150];
const DEFAULT_THRESHOLD_MICROVOLTS = 75;
const DEFAULT_BAND_ID = 'alpha';
const SLIDER_STEP_SECONDS = 0.1;
const SCALP_QUANTITIES = [{ value: 'amplitude', label: 'Amplitude, µV RMS' }, { value: 'share', label: 'Share of the electrode' }] as const;
type ScalpQuantity = typeof SCALP_QUANTITIES[number]['value'];

function isScalpQuantity(value: unknown): value is ScalpQuantity {
  return SCALP_QUANTITIES.some((option) => option.value === value);
}

const toOptions = (values: readonly number[]) => values.map((value) => ({ value: String(value), label: `${value} µV` }));
const SCALE_OPTIONS = toOptions(SCALE_OPTIONS_MICROVOLTS);
const THRESHOLD_OPTIONS = toOptions(THRESHOLD_OPTIONS_MICROVOLTS);

/** What the analysis window is, in the terms it is computed in. */
export function describeAnalysisWindow(sampleRateHz: number): string {
  return `Analysis window: ${ANALYSIS_WINDOW_SAMPLES} samples at ${formatHertz(sampleRateHz)}, ${formatSeconds(analysisWindowSeconds(sampleRateHz))}, ending at the playhead.`;
}

/** The rule as it is evaluated: the threshold, and how near two crossings must be to count as one. */
export function describeThresholdRule(thresholdMicrovolts: number, sampleRateHz: number): string {
  const mergeSamples = mergeSamplesFor(sampleRateHz);
  return `Rule: any channel beyond ${formatMicrovolts(thresholdMicrovolts)}. Crossings no more than ${mergeSamples} sample${mergeSamples === 1 ? '' : 's'} apart (${formatSeconds(mergeSamples / sampleRateHz)} at ${formatHertz(sampleRateHz)}) are reported as one, so a bar or a duration can include samples under the threshold.`;
}

const PLOT_KEY = 'On the plot, a row has dashed threshold lines where its channel is beyond the threshold on the page shown, and under the pointer; the bar under a trace is where that channel is beyond it.';

interface Props {
  sample: SignalSample;
  /** What the sample is called on screen, for example "Synthetic sample 3". */
  sampleLabel: string;
}

/** One loaded sample: its plot and transport, and everything computed at the playhead. It opens paused. */
export default function SampleMonitor({ sample, sampleLabel }: Props) {
  const windowSeconds = analysisWindowSeconds(sample.sampleRateHz);
  // The first position at which a whole analysis window has passed, so the first picture is complete.
  const playhead = usePlayhead(sample.durationSeconds, windowSeconds);
  const [scaleText, setScaleText] = useViewState('monitor/signal/row-scale', String(DEFAULT_SCALE_MICROVOLTS));
  const [thresholdText, setThresholdText] = useViewState('monitor/signal/threshold', String(DEFAULT_THRESHOLD_MICROVOLTS));
  const [bandId, setBandId] = useViewState('monitor/signal/band', DEFAULT_BAND_ID);
  const [quantity, setQuantity] = useViewState<ScalpQuantity>('monitor/signal/scalp-quantity', 'amplitude', isScalpQuantity);
  const scale = SCALE_OPTIONS_MICROVOLTS.find((option) => String(option) === scaleText) ?? DEFAULT_SCALE_MICROVOLTS;
  const threshold = THRESHOLD_OPTIONS_MICROVOLTS.find((option) => String(option) === thresholdText) ?? DEFAULT_THRESHOLD_MICROVOLTS;

  const events = useMemo(() => findThresholdEvents(sample.channelNames, sample.channels, sample.sampleRateHz, threshold), [sample, threshold]);
  const spans = useMemo(() => findChannelSpans(sample.channels, sample.sampleRateHz, threshold), [sample, threshold]);
  const tickSeconds = Math.floor(playhead.time * ANALYSIS_UPDATES_PER_SECOND + 1e-6) / ANALYSIS_UPDATES_PER_SECOND;
  // Stepping back to the last tick must not undo a window the playhead has already passed, or the opening picture is empty.
  const analysisSeconds = tickSeconds < windowSeconds && playhead.time >= windowSeconds ? windowSeconds : tickSeconds;
  const analysis = useMemo(() => analyseWindow(sample, analysisSeconds), [sample, analysisSeconds]);
  const bandIndex = Math.max(0, FREQUENCY_BANDS.findIndex((band) => band.id === bandId));
  const band = FREQUENCY_BANDS[bandIndex];
  const sampleIndex = Math.min(sample.channels[0].length - 1, Math.floor(playhead.time * sample.sampleRateHz));
  const seek = (time: number): void => { playhead.pause(); playhead.seek(time); };
  const notFull = <EmptyState reason="nothing-shown" title="The analysis window is not full yet" action={`Move the playhead past ${formatSeconds(windowSeconds)}.`} />;

  return (
    <div className="monitor-body" id="lab-results">
      <div className="monitor-stage">
        <Panel title="Signal" actions={<Segmented label="Row scale, plus and minus" options={SCALE_OPTIONS} value={String(scale)} onChange={setScaleText} />}>
          <SignalPlot
            sample={sample} time={playhead.time} pageSeconds={PLOT_PAGE_SECONDS} scaleMicrovolts={scale} thresholdMicrovolts={threshold} spans={spans}
            label={`${sampleLabel}: ${sample.channelNames.length} channels, ${PLOT_PAGE_SECONDS} seconds at a time, playhead at ${formatTime(playhead.time)}. Not a recording from a person.`}
          />
          <div className="monitor-transport">
            <button type="button" className="lab-button lab-button--primary" onClick={playhead.isPlaying ? playhead.pause : playhead.play}>{playhead.isPlaying ? 'Pause' : 'Play'}</button>
            <span className="lab-figure" role="timer">{formatTime(playhead.time)} of {formatTime(sample.durationSeconds)}</span>
            <input
              type="range" min={0} max={sample.durationSeconds} step={SLIDER_STEP_SECONDS} value={playhead.time} aria-label="Playhead, in seconds"
              aria-valuetext={formatTime(playhead.time)} onChange={(event) => seek(Number(event.target.value))}
            />
          </div>
          <details className="monitor-values">
            <summary>Values at the playhead</summary>
            <table className="lab-table" aria-label={`Value of each channel at ${formatTime(playhead.time)}`}>
              <thead><tr><th scope="col"><span className="lab-table-head">Channel</span></th><th scope="col"><span className="lab-table-head">Microvolts</span></th></tr></thead>
              <tbody>{sample.channelNames.map((name, index) => <tr key={name}><th scope="row">{name}</th><td className="lab-figure">{sample.channels[index][sampleIndex].toFixed(1)}</td></tr>)}</tbody>
            </table>
          </details>
        </Panel>
        <div className="monitor-rail">
          <Panel title={`Band composition over the last ${formatSeconds(windowSeconds)}`}>
            <p className="lab-soft">{describeAnalysisWindow(sample.sampleRateHz)}</p>
            {analysis === null ? notFull : (
              <>
                <BandComposition composition={analysis.composition} selectedBandId={band.id} onSelectBand={setBandId} />
                <p>All channels over the window: <span className="lab-figure">{formatMicrovolts(analysis.rmsMicrovolts)}</span> RMS.</p>
              </>
            )}
          </Panel>
          <Panel title={`Scalp cells: ${band.label}`} actions={<Segmented label="Figure in each cell" options={SCALP_QUANTITIES} value={quantity} onChange={setQuantity} />}>
            {analysis === null ? notFull : (
              <ScalpCells
                channelNames={sample.channelNames} quantity={quantity === 'amplitude' ? `${band.label} amplitude in microvolts RMS` : `${band.label} share of its own band power`}
                values={(quantity === 'amplitude' ? analysis.amplitudesByChannel : analysis.sharesByChannel).map((bands) => bands[bandIndex])}
                formatValue={quantity === 'amplitude' ? (value) => value.toFixed(1) : formatPercent}
              />
            )}
          </Panel>
        </div>
      </div>
      <Panel title="Threshold rule" actions={<Segmented label="Rule: any channel beyond" options={THRESHOLD_OPTIONS} value={String(threshold)} onChange={setThresholdText} />}>
        <p className="lab-soft monitor-rule">
          {describeThresholdRule(threshold, sample.sampleRateHz)} {PLOT_KEY}
          {!isThresholdDrawable(threshold, scale) && ` The threshold is outside the row scale of ${formatMicrovolts(scale)}, so its lines are not drawn.`}
        </p>
        <EventList events={events} markers={sample.markers} onSeek={seek} />
      </Panel>
    </div>
  );
}
