import type { EvidenceItem } from '@/lib/anatomy/build-anatomy-evidence';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { ShownAnatomyEvidence } from '@/lib/anatomy/parse-anatomy-evidence';
import type { DetailTechnique, RegionDetail } from '@/lib/atlas-explorer/region-detail';
import type { Loaded } from './explorer-data';
import Disclosure from './Disclosure';
import LimitNote from './LimitNote';
import LoadNotice from './LoadNotice';

interface Props {
  detail: RegionDetail;
  evidence: Loaded<ShownAnatomyEvidence>;
  onRetryEvidence: () => void;
  onChooseTechnique: (techniqueId: string) => void;
}

interface TechniqueItemProps {
  technique: DetailTechnique;
  /** The quoted catalog words behind the link, once the evidence file has loaded. */
  item: EvidenceItem | undefined;
  onChooseTechnique: (techniqueId: string) => void;
}

function TechniqueItem({ technique, item, onChooseTechnique }: TechniqueItemProps) {
  return (
    <li className="atlas-technique" data-technique-id={technique.id}>
      <p className="atlas-fact">
        <button type="button" className="atlas-link-button" onClick={() => onChooseTechnique(technique.id)}>{technique.name}</button>
        <span className="atlas-id">{technique.id}</span>
      </p>
      <p className="atlas-row-why">
        The catalog&rsquo;s word: &ldquo;{technique.term}&rdquo;. Bands: {technique.bandNames}.
        {technique.nissSeverity !== null && ` NISS severity: ${technique.nissSeverity}.`}
        {technique.dsmCluster !== null && ` DSM cluster tag: ${technique.dsmCluster.replaceAll('_', ' ')}.`}
        {technique.uncountedReason !== null && ` Not counted: ${technique.uncountedReason}.`}
      </p>
      {item !== undefined && (
        <blockquote className="atlas-quote" cite={item.evidence.source_ref.file}>
          <p>&ldquo;{item.evidence.source_ref.quote}&rdquo;</p>
          <footer>The drafter&rsquo;s reason: {item.evidence.rationale}</footer>
        </blockquote>
      )}
    </li>
  );
}

function listItems(techniques: readonly DetailTechnique[], evidence: Loaded<ShownAnatomyEvidence>, onChooseTechnique: (techniqueId: string) => void) {
  const itemsByKey = new Map(evidence.status === 'ready' ? evidence.data.technique_links.map((item) => [item.key, item]) : []);
  return (
    <ul className="atlas-techniques">
      {techniques.map((technique) => <TechniqueItem key={technique.evidenceKey} technique={technique} item={itemsByKey.get(technique.evidenceKey)} onChooseTechnique={onChooseTechnique} />)}
    </ul>
  );
}

/** NISS and DSM as facts about the linked techniques, each with the sentence that limits it. */
function ScoreFacts({ detail }: Pick<Props, 'detail'>) {
  return (
    <>
      <p className="atlas-fact" data-fact="niss">
        Highest NISS step among linked techniques: <strong>{detail.nissStep ?? 'no data'}</strong>
        {detail.nissStep !== null && ` (${detail.linked.length} catalog ${detail.linked.length === 1 ? 'entry' : 'entries'})`}.
      </p>
      <LimitNote limit={limitSentence('lens_niss')} />
      <p className="atlas-fact" data-fact="dsm">
        DSM cluster tags on linked techniques:{' '}
        <strong>{detail.clusters.length === 0 ? 'no data' : detail.clusters.map((entry) => `${entry.cluster.replaceAll('_', ' ')} (${entry.entryCount})`).join(', ')}</strong>.
      </p>
      <LimitNote limit={limitSentence('lens_dsm')} />
    </>
  );
}

/**
 * The techniques tied to the region: counted links with the catalog's own
 * quoted words, and links the catalog names but that may not count. Techniques
 * that only share the region's band are not links and have their own section.
 */
export default function InspectorTechniques({ detail, evidence, onRetryEvidence, onChooseTechnique }: Props) {
  return (
    <section className="atlas-section" aria-labelledby="atlas-inspector-techniques">
      <h3 className="atlas-subheading" id="atlas-inspector-techniques">Techniques linked to this region</h3>
      {detail.linked.length === 0
        ? <LimitNote limit={limitSentence('techniques_none')} />
        : <><LimitNote limit={limitSentence('technique_quote')} />{listItems(detail.linked, evidence, onChooseTechnique)}</>}
      <LoadNotice what="the quoted catalog text" state={evidence} onRetry={onRetryEvidence} />
      {detail.namedNotCounted.length > 0 && (
        <>
          <h4 className="atlas-minor-heading">Named in the catalog, not counted</h4>
          <LimitNote limit={limitSentence('techniques_named_not_counted')} />
          {listItems(detail.namedNotCounted, evidence, onChooseTechnique)}
        </>
      )}
      <ScoreFacts detail={detail} />
    </section>
  );
}

/**
 * Techniques tagged with the region's band whose text names no structure. They are not links to the region, so they
 * sit outside "techniques linked to this region", and stay folded away until asked for: there can be dozens.
 */
export function InspectorBandOnly({ detail, onChooseTechnique }: Pick<Props, 'detail' | 'onChooseTechnique'>) {
  const band = detail.region.band_ids[0];
  if (detail.bandLevel.length === 0 || band === undefined) return null;
  return (
    <section className="atlas-section" aria-labelledby="atlas-inspector-band-only">
      <h3 className="atlas-subheading" id="atlas-inspector-band-only">Tagged with this band only ({detail.bandLevel.length})</h3>
      <LimitNote limit={limitSentence('techniques_band_level', { band })} />
      <Disclosure label={`Show the ${detail.bandLevel.length} techniques`}>
        <ul className="atlas-chips">
          {detail.bandLevel.map((technique) => (
            <li key={technique.id}><button type="button" className="atlas-chip" onClick={() => onChooseTechnique(technique.id)}>{technique.name}</button></li>
          ))}
        </ul>
      </Disclosure>
    </section>
  );
}
