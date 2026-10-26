import type { RefObject } from 'react';
import type { AtlasCoverage } from './region-coverage';

/*
 * Copy owned by `src/lib/anatomy/limits-copy.ts`, which this lane may not
 * edit. Written here verbatim for Lane 6 to route under the key named beside
 * it, and kept off the `.atlas-limit` class until it has.
 */
/** limits-copy key `lens_no_data_not_safe`. */
const NO_LINK_NOT_NO_RISK = 'A region with no link is not a region with low risk. It is a region nobody has drafted a link to.';

interface Props {
  coverage: AtlasCoverage;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onSelectRegion: (regionId: string) => void;
}

/**
 * The pane with nothing chosen. Its job is to say how sparse the atlas is
 * before the reader clicks anything, so a region that turns out to hold
 * nothing is the expected case and not a failure of the page. The counts are
 * computed over the index, never written down, and the chips are the shortest
 * way to the only regions that hold a link.
 */
export default function InspectorEmpty({ coverage, headingRef, onSelectRegion }: Props) {
  const rows: Array<{ key: string; held: number; what: string }> = [
    { key: 'linked', held: coverage.withTechniqueLink, what: 'hold at least one drafted technique link' },
    { key: 'niss', held: coverage.withNissSeverity, what: 'hold a link that carries a NISS severity, so the NISS lens can colour them' },
    { key: 'unlinked', held: coverage.withoutTechniqueLink, what: 'hold no technique link at all' },
    { key: 'reviewed', held: coverage.withReviewedLink, what: 'hold a link a person has reviewed' },
  ];
  return (
    <section className="atlas-panel atlas-inspector" aria-labelledby="atlas-inspector-heading" data-empty="true">
      <h2 className="atlas-heading" id="atlas-inspector-heading" ref={headingRef} tabIndex={-1}>Region details</h2>
      <p className="atlas-fact">Choose a region, in the list or in the picture, to see what the atlas holds for it. Most regions hold little.</p>
      <section className="atlas-section" aria-labelledby="atlas-inspector-across">
        <h3 className="atlas-subheading" id="atlas-inspector-across">Across all {coverage.regions} regions</h3>
        <ul className="atlas-coverage-rows" data-atlas-coverage="true">
          {rows.map((row) => (
            <li key={row.key} className="atlas-coverage-row" data-coverage-row={row.key} data-held={row.held > 0}>
              <span className="atlas-coverage-count"><strong>{row.held}</strong> of {coverage.regions} {row.what}</span>
            </li>
          ))}
        </ul>
        {coverage.linkedRegions.length > 0 && (
          <>
            <p className="atlas-label">The {coverage.linkedRegions.length} regions that hold a link</p>
            <ul className="atlas-chips">
              {coverage.linkedRegions.map((region) => (
                <li key={region.id}><button type="button" className="atlas-chip" onClick={() => onSelectRegion(region.id)}>{region.name}</button></li>
              ))}
            </ul>
          </>
        )}
        <p className="atlas-coverage-note" data-coverage-note="lens_no_data_not_safe">{NO_LINK_NOT_NO_RISK}</p>
      </section>
    </section>
  );
}
