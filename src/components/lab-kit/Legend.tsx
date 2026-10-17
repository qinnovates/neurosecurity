import type { ReactNode } from 'react';

export interface LegendItem {
  id: string;
  /** The drawing being explained: a mark, a stripe, a swatch. */
  mark: ReactNode;
  name: string;
  /** Longer words for the same thing, shown after the name. */
  detail?: string;
  /** How many there are, when the legend also counts. */
  count?: number;
}

interface Props {
  /** Accessible name of the list, for example "Evidence marks". */
  label: string;
  items: readonly LegendItem[];
  /** One item per line, for legends whose details are sentences. */
  isStacked?: boolean;
  /** A sentence under the list. */
  note?: ReactNode;
}

/** What each mark on screen means. Sits beside or under the thing it explains. */
export default function Legend({ label, items, isStacked = false, note }: Props) {
  return (
    <div>
      <ul className={`lab-legend${isStacked ? ' lab-legend--stacked' : ''}`} aria-label={label}>
        {items.map((item) => (
          <li key={item.id}>
            {item.count !== undefined && <span className="lab-figure">{item.count}</span>}
            {item.mark}
            <span className="lab-legend-name">{item.name}</span>
            {item.detail !== undefined && <span>{item.detail}</span>}
          </li>
        ))}
      </ul>
      {note !== undefined && <p className="lab-legend-note">{note}</p>}
    </div>
  );
}
