import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { buildRegionDsm, type RegionDsmReference } from '@/lib/atlas-explorer/region-dsm';
import Disclosure from './Disclosure';
import LimitNote from './LimitNote';
import ReviewMark, { UNREVIEWED_MARK } from './ReviewMark';

interface Props {
  model: ExplorerModel;
  regionId: string;
}

/** What a heading counts: entries (one per code and wording) and the distinct codes among them. */
export function describeReferenceCount(references: readonly RegionDsmReference[]): string {
  const codeCount = new Set(references.map((reference) => reference.code)).size;
  return `${references.length} ${references.length === 1 ? 'reference' : 'references'} to ${codeCount} ${codeCount === 1 ? 'code' : 'codes'}`;
}

/** Each reference with what it is filed with: technique ids under the first heading, pathway names under the second. */
function ReferenceList({ references }: { references: readonly RegionDsmReference[] }) {
  return (
    <ul className="atlas-techniques">
      {references.map((reference) => (
        <li key={`${reference.code} ${reference.name}`} className="atlas-technique" data-dsm-code={reference.code}>
          <p className="atlas-fact"><span className="atlas-id">{reference.code}</span> {reference.name}</p>
          <p className="atlas-row-why">Filed with: {reference.carriers.join(', ')}.</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * The DSM-5-TR category references that reach the region, by the way each arrives. The sentence under the heading says
 * what they are and are not; it stays on screen whether or not a list is opened.
 */
export default function InspectorDsm({ model, regionId }: Props) {
  const dsm = buildRegionDsm(model, regionId);
  return (
    <section className="atlas-section" aria-labelledby="atlas-inspector-dsm">
      <h3 className="atlas-subheading" id="atlas-inspector-dsm">DSM-5-TR category references</h3>
      <LimitNote limit={limitSentence('dsm_references')} />
      <h4 className="atlas-minor-heading">
        Through linked techniques ({describeReferenceCount(dsm.viaTechniques)}){' '}
        {dsm.linkReviewState !== null && <ReviewMark state={dsm.linkReviewState} />}
      </h4>
      {dsm.viaTechniques.length === 0 ? <LimitNote limit={limitSentence('dsm_none')} /> : (
        <>
          <LimitNote limit={limitSentence('dsm_via_techniques')} />
          <Disclosure label="Show them"><ReferenceList references={dsm.viaTechniques} /></Disclosure>
        </>
      )}
      <h4 className="atlas-minor-heading" data-dsm-group="pathways">
        Through pathways ({describeReferenceCount(dsm.viaPathways)}){' '}
        {dsm.pathwayNames.length > 0 && <ReviewMark state={UNREVIEWED_MARK} />}
      </h4>
      {dsm.pathwayNames.length === 0 ? <LimitNote limit={limitSentence('dsm_none')} /> : (
        <>
          <LimitNote limit={limitSentence('dsm_via_pathways', { pathways: dsm.pathwayNames.join(', ') })} />
          {dsm.viaPathways.length > 0 && (
            <Disclosure label="Show them"><ReferenceList references={dsm.viaPathways} /></Disclosure>
          )}
        </>
      )}
    </section>
  );
}
