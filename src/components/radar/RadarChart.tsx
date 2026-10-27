/**
 * RadarChart — the one radar on the site. The NISS metric chart and the
 * neurorights chart are both expressed through it; neither owns polar maths or
 * a palette of its own any more.
 *
 * Two states, and they are types, not flags:
 *
 * - `plotted` carries one share per axis, and the compiler will not let a share
 *   be absent. A chart that cannot measure an axis cannot be plotted at all.
 * - `withheld` draws no polygon, no edge and no vertex. It hatches the plot,
 *   dashes the frame, prints the state as a word in the middle and an em dash
 *   on every axis, and says why underneath. An absence of measurement must not
 *   look like a measured floor, so the two do not share a shape, a fill, an
 *   edge or a caption.
 *
 * Neuromodesty: a shape here is what a framework proposes about a technique. No
 * axis is a measurement of a person, and nothing the chart says is causal or
 * diagnostic. Callers pass the words; the chart does not invent any.
 */

import { useId, type ReactNode } from 'react';
import { axisAngle, polarPoint, ringPolygon, ringRadii, sharePolygon, type Point } from './radar-geometry';
import { COUNT_TONE, markPath, patternFor, WITHHELD_PATTERN, type PatternSpec, type RadarFillKind } from './radar-patterns';
import './radar-palette.css';
import './radar.css';

export interface RadarAxis {
  /** Stable within one chart; used for React keys only. */
  key: string;
  /** Two or three characters at the axis tip (BI, CR, MI). */
  shortLabel: string;
  /** The full name, for the accessible description. */
  name: string;
  /** What sits on this axis, in words ("High", "114 techniques"). Printed and read out; never computed here. */
  valueLabel: string;
  /** A second line under the axis tip, for a statement the reader has to see (which code folded into this one). */
  note?: string;
}

export interface PlottedRadarAxis extends RadarAxis {
  /** A fraction of the axis, 0 to 1. Build it with `shareOf`, which refuses a value it cannot place. */
  share: number;
}

export type RadarBody =
  | { kind: 'plotted'; fill: RadarFillKind; axes: readonly PlottedRadarAxis[] }
  | {
      kind: 'withheld';
      /** The state as the data owner words it, two or three words: "Not scored", "Provisional". */
      word: string;
      /** Why, in the data owner's own words. Shown under the chart, never guessed at. */
      reason: string;
      axes: readonly RadarAxis[];
    };

export interface RadarChartProps {
  /** The accessible name of the figure, e.g. "NISS metrics for QIF-T0001". */
  title: string;
  body: RadarBody;
  /** The side of the square plot in CSS pixels, before the stylesheet scales it down. */
  size?: number;
  /** How many grid rings, the outermost being the full axis. */
  rings?: number;
  /** A figure, a word and any flags that belong beside the shape rather than inside it. */
  aside?: ReactNode;
  /** One or two sentences under the chart: what the shape is, and what it is not. */
  caption?: ReactNode;
}

const DEFAULT_SIZE = 240;
const DEFAULT_RINGS = 4;
/** Share of the box taken by the plot itself; the rest is the labels' margin. */
const PLOT_SHARE = 0.66;
/** Where the axis labels sit. Low enough that a label and its note stay inside the box, which not every container lets overflow. */
const LABEL_SHARE = 0.84;
const NOTE_OFFSET = 10;
const NO_VALUE = '—';

export default function RadarChart({ title, body, size = DEFAULT_SIZE, rings = DEFAULT_RINGS, aside, caption }: RadarChartProps) {
  const patternId = useId();
  const axisCount = body.axes.length;
  const centre: Point = { x: size / 2, y: size / 2 };
  const radius = (size / 2) * PLOT_SHARE;
  const labelRadius = (size / 2) * LABEL_SHARE;
  const isPlotted = body.kind === 'plotted';
  /* A withheld chart has no severity to carry, so it takes the ink tone; its own fill is the withheld hatch. */
  const fillKind: RadarFillKind = isPlotted ? body.fill : COUNT_TONE;
  const pattern: PatternSpec = isPlotted ? patternFor(body.fill) : WITHHELD_PATTERN;
  const tips = body.axes.map((_axis, index) => polarPoint(axisAngle(index, axisCount), radius, centre));
  const labels = body.axes.map((_axis, index) => polarPoint(axisAngle(index, axisCount), labelRadius, centre));
  const outerRing = ringPolygon(axisCount, radius, centre);
  const shape = isPlotted ? sharePolygon(body.axes.map((axis) => axis.share), radius, centre) : null;

  const valueSentence = body.axes.map((axis) => `${axis.name} ${isPlotted ? axis.valueLabel : NO_VALUE}`).join(', ');
  const description = isPlotted
    ? `${title}. A shape over ${axisCount} axes: ${valueSentence}.`
    : `${title}. No shape is drawn: ${body.word}. ${body.reason} Every axis reads as no value.`;

  return (
    <figure className="radar" data-radar-fill={fillKind} data-state={body.kind}>
      <svg className="radar-plot" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={description} focusable="false">
        <defs>
          <pattern
            id={patternId}
            className={isPlotted ? 'radar-pattern--tone' : 'radar-pattern--withheld'}
            width={pattern.tile}
            height={pattern.tile}
            patternUnits="userSpaceOnUse"
          >
            {pattern.marks.map((mark, index) => (
              <path
                key={index}
                d={markPath(mark)}
                fill={mark.kind === 'dot' ? 'currentColor' : 'none'}
                stroke={mark.kind === 'dot' ? 'none' : 'currentColor'}
                strokeWidth={mark.kind === 'dot' ? undefined : mark.width}
              />
            ))}
          </pattern>
        </defs>

        {ringRadii(rings, radius).map((ringRadius, index) => (
          <polygon
            key={ringRadius}
            className={index === rings - 1 ? 'radar-ring radar-ring--outer' : 'radar-ring'}
            points={ringPolygon(axisCount, ringRadius, centre)}
          />
        ))}

        {tips.map((tip, index) => (
          <line key={body.axes[index].key} className="radar-spoke" x1={centre.x} y1={centre.y} x2={tip.x} y2={tip.y} />
        ))}

        {isPlotted && shape !== null && (
          <>
            <polygon className="radar-wash" points={shape} />
            <polygon className="radar-fill" points={shape} fill={`url(#${patternId})`} />
            <polygon className="radar-edge" points={shape} />
            {body.axes.map((axis, index) => {
              const vertex = polarPoint(axisAngle(index, axisCount), axis.share * radius, centre);
              return <circle key={axis.key} className="radar-vertex" cx={vertex.x} cy={vertex.y} r={3.5} />;
            })}
          </>
        )}

        {!isPlotted && (
          <>
            <polygon className="radar-withheld-fill" points={outerRing} fill={`url(#${patternId})`} />
            <polygon className="radar-withheld-frame" points={outerRing} />
            <text className="radar-withheld-word" x={centre.x} y={centre.y} textAnchor="middle" dominantBaseline="central">
              {body.word}
            </text>
          </>
        )}

        {body.axes.map((axis, index) => (
          <g key={`label-${axis.key}`}>
            <text className="radar-axis-label" x={labels[index].x} y={labels[index].y} textAnchor="middle" dominantBaseline="central">
              {axis.shortLabel}
            </text>
            {axis.note !== undefined && (
              <text className="radar-axis-note" x={labels[index].x} y={labels[index].y + NOTE_OFFSET} textAnchor="middle" dominantBaseline="central">
                {axis.note}
              </text>
            )}
          </g>
        ))}
      </svg>

      {aside !== undefined && <div className="radar-reading">{aside}</div>}

      <figcaption className="radar-caption">
        {/* The value channel. It is printed rather than hovered: a pointer is not a channel on a touch screen. */}
        <dl className="radar-values">
          {body.axes.map((axis) => (
            <div key={`value-${axis.key}`}>
              <dt>
                <span className="radar-values-code">{axis.shortLabel}</span> {axis.name}
              </dt>
              <dd>{isPlotted ? axis.valueLabel : NO_VALUE}</dd>
            </div>
          ))}
        </dl>
        {body.kind === 'withheld' && <p className="radar-note">{body.reason}</p>}
        {caption !== undefined && <p className="radar-note">{caption}</p>}
      </figcaption>
    </figure>
  );
}
