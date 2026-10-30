import type { RegionEvidence } from '@/lib/anatomy/region-evidence-types';
import { buildRegionEvidenceView, type CitationView, type EvidenceStatement } from '@/lib/atlas-explorer/region-evidence-view';
import type { Loaded } from './explorer-data';
import LimitNote from './LimitNote';
import LoadNotice from './LoadNotice';

interface Props {
  regionId: string;
  regionName: string;
  evidence: Loaded<RegionEvidence>;
  onRetry: () => void;
}

/** The citation with links built from its DOI and PubMed id. They open the publisher or PubMed in a new tab. */
function Citation({ view }: { view: CitationView }) {
  return (
    <p className="atlas-citation">
      {view.citation}{' '}
      {view.doiAddress !== null && <a href={view.doiAddress} target="_blank" rel="noopener noreferrer">DOI</a>}{' '}
      <a href={view.pubmedAddress} target="_blank" rel="noopener noreferrer">PubMed</a>
    </p>
  );
}

function Statement({ statement }: { statement: EvidenceStatement }) {
  return (
    <li className="atlas-statement" data-contested={statement.contestedLimit !== null} data-about-region={statement.isAboutRegionItself}>
      <p className="atlas-filed" data-anatomy-line="true">{statement.filedUnderLine}</p>
      {statement.anatomyLimits.map((limit) => <LimitNote key={limit.id} limit={limit} />)}
      {statement.contestedLimit !== null && <><p className="atlas-flag">Contested</p><LimitNote limit={statement.contestedLimit} /></>}
      {statement.rivalLimit !== null && <LimitNote limit={statement.rivalLimit} />}
      <LimitNote limit={statement.checkLimit} />
      <p className="atlas-fact">{statement.claim}</p>
      <blockquote className="atlas-quote"><p>&ldquo;{statement.quote}&rdquo;</p></blockquote>
      <Citation view={statement.citation} />
      <p className="atlas-row-why" data-kind="true">
        {statement.kindLabel}. {statement.studyDesign}{statement.sampleSize !== null && `; ${statement.sampleSize} people`}. Only the abstract was read.
      </p>
      <p className="atlas-scope"><strong>Scope.</strong> {statement.scopeNote}</p>
      {statement.notices.map((notice) => <p key={notice} className="atlas-row-why">{notice}</p>)}
      {statement.requiredCitationLimit !== null && <LimitNote limit={statement.requiredCitationLimit} />}
      {statement.related.map((related) => (
        <div key={related.pubmedAddress} className="atlas-related" data-required={related.required}>
          <p className="atlas-row-why"><strong>{related.required ? 'Must be read with it' : 'Related paper'}:</strong> {related.relation}.</p>
          <blockquote className="atlas-quote"><p>&ldquo;{related.quote}&rdquo;</p></blockquote>
          <Citation view={related} />
        </div>
      ))}
    </li>
  );
}

/** Literature statements filed under the region. Each one says what the paper is actually about before it says anything else. */
export default function InspectorEvidence({ regionId, regionName, evidence, onRetry }: Props) {
  const view = evidence.status === 'ready' ? buildRegionEvidenceView(evidence.data, regionId, regionName) : null;
  return (
    <section className="atlas-section" aria-labelledby="atlas-inspector-evidence">
      <h3 className="atlas-subheading" id="atlas-inspector-evidence">Evidence from the literature</h3>
      <LoadNotice what="the literature statements" state={evidence} onRetry={onRetry} />
      {view !== null && (
        <>
          <LimitNote limit={view.intro} />
          {view.emptyLimit !== null && <LimitNote limit={view.emptyLimit} />}
          <ul className="atlas-statements">
            {view.statements.map((statement) => <Statement key={statement.key} statement={statement} />)}
          </ul>
        </>
      )}
    </section>
  );
}
