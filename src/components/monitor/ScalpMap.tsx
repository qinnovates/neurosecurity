import { ELECTRODE_POSITIONS } from './electrode-positions';

interface Props {
  channelNames: readonly string[];
  /** The selected band's share of power at each channel, from 0 to 1, in channel order. */
  shares: readonly number[];
  bandLabel: string;
}

const HEAD_RADIUS = 1.08;
const SMALLEST_DOT = 0.035;
const DOT_GROWTH = 0.15;

/**
 * The electrodes seen from above, nose at the top. The area of each dot is the selected
 * band's share of that electrode's signal. It shows where the signal was measured on the
 * scalp. It says nothing about brain regions underneath, and no technique is drawn on it.
 */
export default function ScalpMap({ channelNames, shares, bandLabel }: Props) {
  const placed = channelNames.flatMap((name, index) => {
    const position = ELECTRODE_POSITIONS[name];
    return position === undefined ? [] : [{ name, x: position[0], y: position[1], share: shares[index] ?? 0 }];
  });
  const unplaced = channelNames.filter((name) => ELECTRODE_POSITIONS[name] === undefined);
  return (
    <div className="monitor-scalp">
      <svg viewBox="-1.45 -1.4 2.9 2.9" role="img" aria-label={`Scalp map of ${placed.length} electrodes. Dot area is the ${bandLabel} share of each electrode's signal.`}>
        <path className="monitor-scalp-outline" d="M -0.12 -1.07 L 0 -1.27 L 0.12 -1.07" />
        <circle className="monitor-scalp-outline" r={HEAD_RADIUS} />
        {placed.map((electrode) => (
          <g key={electrode.name}>
            <title>{`${electrode.name}: ${Math.round(electrode.share * 100)}% ${bandLabel}`}</title>
            <circle className="monitor-scalp-dot" cx={electrode.x} cy={electrode.y} r={SMALLEST_DOT + DOT_GROWTH * Math.sqrt(Math.max(0, electrode.share))} />
            <text className="monitor-scalp-label" x={electrode.x} y={electrode.y + 0.27} textAnchor="middle">{electrode.name}</text>
          </g>
        ))}
      </svg>
      <p className="lab-soft">Dot area: the {bandLabel} share of each electrode&rsquo;s signal over the last two seconds. Schematic 10-20 positions. This is where the signal was measured on the scalp, not a picture of brain regions.</p>
      {unplaced.length > 0 && <p className="lab-soft">Not drawn, because they are not standard 10-20 names: {unplaced.join(', ')}.</p>}
    </div>
  );
}
