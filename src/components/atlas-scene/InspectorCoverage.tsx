import type { CoverageCount, RegionCoverage } from './region-coverage';

/*
 * Copy owned by `src/lib/anatomy/limits-copy.ts`, which this lane may not edit.
 * The three sentences below are written here verbatim for Lane 6 to route into
 * that file under the keys named beside them, after which they must be read
 * through `limitSentence` and rendered by `LimitNote` like every other limit.
 * They are deliberately not given the `.atlas-limit` class while they live
 * here, so the guard that every limit sentence comes from the closed templates
 * keeps telling the truth.
 */
/** limits-copy key `coverage_counts_not_risk`. */
const COUNTS_NOT_RISK = 'These are the records the catalog holds for this region. A count is not a measure of risk, and nothing here is ranked by it.';
/** limits-copy key `lens_no_data_not_safe`. */
const NOTHING_LINKED = 'Nothing is linked to this region. That is not a finding that the region is safe, or low: it means nobody has drafted a link to it, on any of the routes above.';
/** limits-copy key `niss_unscored`. */
const NISS_PARTLY_SCORED = 'The rest carry no NISS severity at all. This build cannot yet say whether the registrar left them unscored or scored them provisionally, so this pane scores none of them.';

/** A region's share of the best-covered region in the atlas. Decorative: the count and its words carry the meaning. */
function Bar({ held, bestInAtlas }: Pick<CoverageCount, 'held' | 'bestInAtlas'>) {
  const share = bestInAtlas === 0 ? 0 : Math.round((held / bestInAtlas) * 100);
  return (
    <span className="atlas-coverage-bar" data-held={held > 0} aria-hidden="true">
      <span className="atlas-coverage-fill" style={{ width: `${share}%` }} />
    </span>
  );
}

function CountRow({ count }: { count: CoverageCount }) {
  return (
    <li className="atlas-coverage-row" data-route={count.route} data-held={count.held > 0}>
      <Bar held={count.held} bestInAtlas={count.bestInAtlas} />
      <span className="atlas-coverage-count">
        <strong>{count.held}</strong> {count.label} <span className="atlas-coverage-of">{count.outOf}</span>
      </span>
      <span className="atlas-route">via {count.via}</span>
    </li>
  );
}

/**
 * What the atlas holds for the chosen region, before anything derived from it:
 * one row per route with its count, what the count is out of, and the join it
 * arrived through. It is the first block of the pane on purpose. Most regions
 * hold nothing, and a reader has to know that before reading a severity.
 */
export default function InspectorCoverage({ coverage }: { coverage: RegionCoverage }) {
  const { niss, dsm } = coverage;
  return (
    <section className="atlas-section atlas-coverage" aria-labelledby="atlas-inspector-coverage" data-holds-nothing={coverage.holdsNothing}>
      <h3 className="atlas-subheading" id="atlas-inspector-coverage">What we hold for this region</h3>
      <ul className="atlas-coverage-rows">
        {coverage.counts.map((count) => <CountRow key={count.route} count={count} />)}
      </ul>
      <p className="atlas-coverage-line" data-fact="niss-coverage">
        <strong>{niss.withSeverity} of {niss.links}</strong> {niss.links === 1 ? 'link carries' : 'links carry'} a NISS severity
        {niss.worstStep !== null && <>, the worst of them <strong>{niss.worstStep}</strong></>}.
      </p>
      {niss.withSeverity < niss.links && <p className="atlas-coverage-note" data-coverage-note="niss_unscored">{NISS_PARTLY_SCORED}</p>}
      <p className="atlas-coverage-line" data-fact="dsm-coverage">
        <strong>{dsm.viaTechniques}</strong> DSM-5-TR category {dsm.viaTechniques === 1 ? 'reference' : 'references'} arrive through linked techniques and{' '}
        <strong>{dsm.viaPathways}</strong> through {dsm.pathwayNames.length === 0 ? 'no pathway' : `the pathway file (${dsm.pathwayNames.join(', ')})`}.
      </p>
      {coverage.holdsNothing
        ? <p className="atlas-coverage-note" data-coverage-note="lens_no_data_not_safe">{NOTHING_LINKED}</p>
        : <p className="atlas-coverage-note" data-coverage-note="coverage_counts_not_risk">{COUNTS_NOT_RISK}</p>}
      {/*
        * Seam for Lane 4's charts, and for the index fields Lane 2 adds.
        * `NissVectorRadar` needs `techniques[].niss.vector` and `NeurorightsRadar` needs
        * `techniques[].neurorights.affected` and the index's `neurorights_taxonomy`; this
        * branch's index carries neither, so neither chart is mounted and no axis is drawn
        * from a value this build does not hold. Once both land, the two charts mount here,
        * inline and in this order (decisions 14 and 15), each under this block's coverage
        * line so the denominator is read before the shape.
        */}
      <div className="atlas-coverage-charts" data-seam="lane4-radars" />
    </section>
  );
}
