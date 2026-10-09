import { useId, useState, type ReactNode } from 'react';

export interface Facet {
  id: string;
  /** Shown above the control: "Evidence", "Band". */
  label: string;
  /** The chips, select, one-of-n control or search field for this facet. */
  control: ReactNode;
  /** How many choices are active in this facet, so a facet out of sight is still counted. */
  activeCount: number;
}

interface Props {
  /** Accessible name of the bar: "Filter techniques". */
  label: string;
  /** In the order they are shown. The same facet keeps the same place on every screen. */
  facets: readonly Facet[];
  /** How many facets sit in the first row. The rest wait behind "More filters". */
  visibleCount?: number;
}

const DEFAULT_VISIBLE_COUNT = 4;

function FacetGroup({ facet }: { facet: Facet }) {
  return (
    <fieldset className="lab-facet">
      <legend className="lab-label">{facet.label}</legend>
      <div className="lab-facet-control">{facet.control}</div>
    </fieldset>
  );
}

/** "More filters", with the number of active choices out of sight when there are any. */
function moreLabel(hiddenActiveCount: number): string {
  return hiddenActiveCount === 0 ? 'More filters' : `More filters (${hiddenActiveCount})`;
}

/** One row of facets. Facets past the first row are one press away, and their active choices are counted on the button. */
export default function FacetBar({ label, facets, visibleCount = DEFAULT_VISIBLE_COUNT }: Props) {
  const [isExpanded, setExpanded] = useState(false);
  const moreId = useId();
  const shown = facets.slice(0, visibleCount);
  const hidden = facets.slice(visibleCount);
  const hiddenActiveCount = hidden.reduce((sum, facet) => sum + facet.activeCount, 0);

  return (
    <div className="lab-facets" role="group" aria-label={label}>
      <div className="lab-facets-row">
        {shown.map((facet) => <FacetGroup key={facet.id} facet={facet} />)}
        {hidden.length > 0 && (
          <button type="button" className="lab-button lab-facets-more" aria-expanded={isExpanded} aria-controls={moreId} onClick={() => setExpanded((current) => !current)}>
            {moreLabel(hiddenActiveCount)}
          </button>
        )}
      </div>
      {hidden.length > 0 && (
        <div className="lab-facets-row" id={moreId} hidden={!isExpanded}>
          {hidden.map((facet) => <FacetGroup key={facet.id} facet={facet} />)}
        </div>
      )}
    </div>
  );
}
