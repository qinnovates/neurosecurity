/**
 * What the fills mean: the five severity fills in order, then the hatch that
 * means nothing is plotted. The patterns, not the hues, carry the order (see
 * `radar-patterns.ts`), so a reader needs to be told which is which once.
 *
 * The last entry is not a sixth severity. It is on the list because a reader
 * who meets a hatched chart has to be able to find out that it means the
 * registrar has not scored that technique, rather than that it scored zero.
 */

import { useId } from 'react';
import { markPath, patternFor, RADAR_TONES, WITHHELD_PATTERN, type PatternSpec } from './radar-patterns';
import './radar-palette.css';
import './radar.css';

const SWATCH_PX = 16;

const TONE_WORDS: Record<(typeof RADAR_TONES)[number], string> = {
  none: 'None, 0.0',
  low: 'Low, 0.1 to 3.9',
  medium: 'Medium, 4.0 to 6.9',
  high: 'High, 7.0 to 8.9',
  critical: 'Critical, 9.0 to 10.0',
};

function Swatch({ spec, isWithheld }: { spec: PatternSpec; isWithheld: boolean }) {
  const patternId = useId();
  return (
    <svg className="radar-legend-swatch" width={SWATCH_PX} height={SWATCH_PX} viewBox={`0 0 ${SWATCH_PX} ${SWATCH_PX}`} aria-hidden="true" focusable="false">
      <defs>
        <pattern
          id={patternId}
          className={isWithheld ? 'radar-pattern--withheld' : 'radar-pattern--tone'}
          width={spec.tile}
          height={spec.tile}
          patternUnits="userSpaceOnUse"
        >
          {spec.marks.map((mark, index) => (
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
      <rect x="0.5" y="0.5" width={SWATCH_PX - 1} height={SWATCH_PX - 1} fill={`url(#${patternId})`} className={isWithheld ? 'radar-legend-edge--withheld' : 'radar-legend-edge'} />
    </svg>
  );
}

export default function RadarFillLegend() {
  return (
    <ul className="radar-legend">
      {RADAR_TONES.map((tone) => (
        <li key={tone} data-radar-fill={tone}>
          <Swatch spec={patternFor(tone)} isWithheld={false} />
          <span>{TONE_WORDS[tone]}</span>
        </li>
      ))}
      <li data-radar-fill="count">
        <Swatch spec={WITHHELD_PATTERN} isWithheld />
        <span>Not scored, or provisional: no shape is drawn</span>
      </li>
    </ul>
  );
}
