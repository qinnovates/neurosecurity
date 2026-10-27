/**
 * The six NISS metrics as a shape, drawn through the shared `RadarChart`.
 *
 * The reading is a union, not a bag of nullable fields, because the registrar's
 * three scoring states are not three amounts of the same thing:
 *
 * - `scored` carries a vector, a score, a severity word and the PINS flag, and
 *   is the only state that is ever plotted.
 * - `provisional` carries a bound over the metrics its sources support. A bound
 *   is not an estimate, so nothing is drawn.
 * - `unscored` carries the registrar's own reason. 47 of the catalog's 178
 *   techniques are in one of the two unplotted states: they are unmeasured, not
 *   zero, and a chart that drew them at the origin would publish an absence of
 *   measurement as a measured floor.
 *
 * The score and the flags are drawn beside the shape and never into it. The
 * registrar's `niss_spec.annotations` is explicit about why: the weighted mean
 * lets a critical biological impact average down to a low score, which is what
 * `harm_flag` and `cognitive_flag` exist to say out loud.
 *
 * Neuromodesty: NISS is a proposed, unvalidated extension to CVSS. A shape here
 * is a framework's reading of a published technique, not a measurement of a
 * device, a patient or an outcome.
 */

import { METRIC_VALUES, METRIC_NAMES, CODE_LABELS, parseNiss, type NissSeverity } from '@/lib/niss-parser';
import { METRIC_KEYS } from '@/components/niss/niss-display-utils';
import RadarChart, { type PlottedRadarAxis, type RadarAxis, type RadarBody } from './RadarChart';
import { shareOf } from './radar-geometry';

/** `niss_spec.severity_scale` runs 0.0 to 10.0, and so does every metric. */
const METRIC_SCALE_MAXIMUM = 10;

export type NissReading =
  | {
      state: 'scored';
      /** The registrar's vector string, verbatim. */
      vector: string;
      severity: NissSeverity;
      score: number;
      pins: boolean;
      /** `niss_spec.annotations.harm_flag`: biological impact is High or Critical. Beside the score, never folded into it. */
      harmFlag?: boolean;
      /** `niss_spec.annotations.cognitive_flag`: CR or CD is High or Critical, which half weighting can average down. */
      cognitiveFlag?: boolean;
      /** `niss_spec.annotations.np_support`: NP:S on an entry whose evidence does not demonstrate lasting structural change. */
      isNeuroplasticityUnsupported?: boolean;
    }
  | {
      state: 'provisional';
      /** The stored bound, already formatted by the caller (`formatNissScore`). */
      rangeLabel: string | null;
      /** How many of the six metrics the entry's sources support. */
      supportedMetricCount: number;
    }
  | { state: 'unscored'; reason: string | null };

interface Props {
  /** What the figure is of, e.g. "QIF-T0001 Thought decoding". Used as the chart's accessible name. */
  title: string;
  reading: NissReading;
  size?: number;
}

const UNSCORED_FALLBACK_REASON = 'The registrar records no reason for this one.';

/** The six axes with no value on them: the frame a withheld chart still draws. */
function emptyAxes(): RadarAxis[] {
  return METRIC_KEYS.map((key) => ({ key, shortLabel: key.toUpperCase(), name: METRIC_NAMES[key] ?? key, valueLabel: '' }));
}

/**
 * The axes of a scored vector, or the name of the first metric that carries no
 * value. `X` (undefined) is a legal code in the parser and has no position on
 * an axis, so a vector that uses one is not plotted at all.
 */
function plottedAxes(vector: string): PlottedRadarAxis[] | { unreadable: string } {
  let parsed;
  try {
    parsed = parseNiss(vector);
  } catch (error) {
    return { unreadable: error instanceof Error ? error.message : 'The stored vector could not be read.' };
  }
  const axes: PlottedRadarAxis[] = [];
  for (const key of METRIC_KEYS) {
    const code = parsed[key];
    const value = METRIC_VALUES[key]?.[code];
    if (value === undefined) return { unreadable: `${METRIC_NAMES[key] ?? key} carries code ${code}, which has no value on the scale.` };
    axes.push({
      key,
      shortLabel: key.toUpperCase(),
      name: METRIC_NAMES[key] ?? key,
      valueLabel: CODE_LABELS[key]?.[code] ?? code,
      share: shareOf(value, METRIC_SCALE_MAXIMUM),
    });
  }
  return axes;
}

function bodyFor(reading: NissReading): RadarBody {
  if (reading.state === 'provisional') {
    const bound = reading.rangeLabel === null ? 'The entry stores no range.' : `The stored bound is ${reading.rangeLabel}.`;
    return {
      kind: 'withheld',
      word: 'Provisional',
      reason: `${reading.supportedMetricCount} of the 6 metrics are supported by this entry's sources. ${bound} A bound is what the formula allows for the rest, not an estimate, so no shape is drawn.`,
      axes: emptyAxes(),
    };
  }
  if (reading.state === 'unscored') {
    return { kind: 'withheld', word: 'Not scored', reason: reading.reason ?? UNSCORED_FALLBACK_REASON, axes: emptyAxes() };
  }
  const axes = plottedAxes(reading.vector);
  if ('unreadable' in axes) {
    return { kind: 'withheld', word: 'Not drawn', reason: `${axes.unreadable} The entry is scored, so this is a fault in the stored vector rather than a gap in its sources.`, axes: emptyAxes() };
  }
  return { kind: 'plotted', fill: reading.severity, axes };
}

const SEVERITY_WORDS: Record<NissSeverity, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

function flagsFor(reading: Extract<NissReading, { state: 'scored' }>): string[] {
  const flags: string[] = [];
  if (reading.pins) flags.push('PINS');
  if (reading.harmFlag === true) flags.push('Biological impact High or above');
  if (reading.cognitiveFlag === true) flags.push('Cognitive metric High or above');
  if (reading.isNeuroplasticityUnsupported === true) flags.push('NP:S not supported by cited evidence');
  return flags;
}

function Reading({ reading }: { reading: Extract<NissReading, { state: 'scored' }> }) {
  const flags = flagsFor(reading);
  return (
    <>
      <span className="radar-reading-figure">{reading.score.toFixed(1)}</span>
      <span className="radar-reading-label">
        NISS score, {SEVERITY_WORDS[reading.severity]} on a 0–10 scale
      </span>
      {flags.length > 0 && (
        <ul className="radar-reading-flags">
          {flags.map((flag) => (
            <li key={flag}>{flag}</li>
          ))}
        </ul>
      )}
    </>
  );
}

const SCORED_CAPTION =
  'NISS is a proposed, unvalidated extension to CVSS v4.0. The score is a weighted mean of the six metrics, so a critical biological impact can average down; read the flags beside it rather than the number alone.';
const WITHHELD_CAPTION = 'NISS is a proposed, unvalidated extension to CVSS v4.0. Nothing is plotted here, and nothing on these axes is zero.';

export default function NissVectorRadar({ title, reading, size }: Props) {
  const body = bodyFor(reading);
  return (
    <RadarChart
      title={`NISS metrics for ${title}`}
      body={body}
      size={size}
      aside={reading.state === 'scored' && body.kind === 'plotted' ? <Reading reading={reading} /> : undefined}
      caption={body.kind === 'plotted' ? SCORED_CAPTION : WITHHELD_CAPTION}
    />
  );
}
