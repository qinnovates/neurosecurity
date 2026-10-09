import type { CSSProperties } from 'react';
import { ELECTRODE_POSITIONS, HEAD_RADIUS } from './electrode-positions';

interface Props {
  channelNames: readonly string[];
  /** One figure per channel, in channel order. */
  values: readonly number[];
  /** Turns a figure into the text printed in its cell. */
  formatValue: (value: number) => string;
  /** What the figures are, for the accessible name: "alpha amplitude". */
  quantity: string;
}

/**
 * The electrodes seen from above, nose at the top: one cell of fixed size per electrode, with
 * its name and its figure printed. The bar under each figure starts at zero. This shows where
 * the signal was measured on the scalp. It says nothing about brain regions underneath, and no
 * technique is drawn on it.
 */
export default function ScalpCells({ channelNames, values, formatValue, quantity }: Props) {
  const placed = channelNames.flatMap((name, index) => {
    const position = ELECTRODE_POSITIONS[name];
    return position === undefined ? [] : [{ name, x: position[0], y: position[1], value: values[index] ?? 0 }];
  });
  const unplaced = channelNames.filter((name) => ELECTRODE_POSITIONS[name] === undefined);
  const largest = Math.max(0, ...placed.map((electrode) => electrode.value));
  return (
    <div className="monitor-scalp">
      <div className="monitor-scalp-field" role="group" aria-label={`${placed.length} electrodes, each with its ${quantity}`} style={{ '--monitor-head-radius': HEAD_RADIUS } as CSSProperties}>
        <span className="monitor-scalp-side" data-side="front">Front</span>
        <span className="monitor-scalp-side" data-side="left">Left</span>
        <span className="monitor-scalp-side" data-side="right">Right</span>
        <span className="monitor-scalp-head" aria-hidden="true" />
        {placed.map((electrode) => (
          <span key={electrode.name} className="monitor-cell" style={{ '--cell-x': electrode.x, '--cell-y': electrode.y } as CSSProperties}>
            <span className="lab-label">{electrode.name}</span>
            <span className="lab-figure">{formatValue(electrode.value)}</span>
            <span className="monitor-cell-bar" aria-hidden="true"><span style={{ width: `${largest === 0 ? 0 : (electrode.value / largest) * 100}%` }} /></span>
          </span>
        ))}
      </div>
      <p className="lab-soft">Each bar runs from zero to the largest figure shown. Schematic 10-20 positions. This is where the signal was measured on the scalp, not a picture of brain regions.</p>
      {unplaced.length > 0 && <p className="lab-soft">Not drawn, because they are not standard 10-20 names: {unplaced.join(', ')}.</p>}
    </div>
  );
}
