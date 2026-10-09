import type { SampleProperties } from '@/lib/signal/sample-properties';
import { formatHertz, formatMicrovolts, formatSeconds } from './monitor-format';

interface Props {
  properties: SampleProperties;
}

const NO_DOMINANT_BAND = 'Not computed';

/** What the sample is called: five figures computed from its own signal when it loaded. */
export default function SampleFacts({ properties }: Props) {
  const band = properties.dominantBand;
  const facts: readonly (readonly [string, string])[] = [
    ['Channels', String(properties.channelCount)],
    ['Sample rate', formatHertz(properties.sampleRateHz)],
    ['Duration', formatSeconds(properties.durationSeconds)],
    ['Dominant band', band === null ? NO_DOMINANT_BAND : `${band.label}, ${band.fromHz} to ${band.toHz} Hz`],
    ['Peak amplitude', formatMicrovolts(properties.peakMicrovolts)],
  ];
  return (
    <dl className="monitor-facts">
      {facts.map(([name, value]) => (
        <div key={name}>
          <dt className="lab-label">{name}</dt>
          <dd className="lab-figure">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
