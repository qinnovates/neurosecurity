import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { DossierEvidenceTier } from '@/lib/atlas-explorer/dossier-file';
import type { DetailTechnique, RegionDetail } from '@/lib/atlas-explorer/region-detail';
import Disclosure from './Disclosure';
import LimitNote from './LimitNote';

interface Props {
  detail: RegionDetail;
  onChooseTechnique: (techniqueId: string) => void;
}

const COVERAGE_GAPS_HREF = '/atlas/tara/coverage-gaps/';
const TECHNIQUE_PAGES_PATH = '/atlas/tara/';

const TIER_WORDS: Readonly<Record<DossierEvidenceTier, string>> = {
  validated_rct: 'validated in a randomised trial',
  validated_replication: 'independently replicated',
  demonstrated_lab: 'demonstrated in a lab',
  demonstrated_case: 'demonstrated in a case report',
  theoretical_modeled: 'theoretical, modelled',
  theoretical_proposed: 'theoretical, proposed',
  speculative: 'speculative',
};

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

function TechniqueControl({ technique }: { technique: DetailTechnique }) {
  if (technique.facts === null) return null;
  if (technique.facts.control !== null) return <p className="atlas-row-why" data-fact="control">Recorded control: {technique.facts.control}</p>;
  return <p className="atlas-row-why" data-fact="control"><a className="atlas-link-button" href={COVERAGE_GAPS_HREF}>No control recorded</a></p>;
}

/** What the catalog ties to a technique, each line only where something is recorded. Counts are entries, never scores. */
function TechniqueLinks({ technique, detail }: { technique: DetailTechnique; detail: RegionDetail }) {
  const cveCount = detail.cves?.filter((cve) => cve.techniqueId === technique.id).length ?? 0;
  const rights = detail.neurorights.filter((right) => right.techniqueId === technique.id);
  const steps = detail.chainSteps?.filter((step) => step.technique_id === technique.id) ?? [];
  return (
    <>
      {cveCount > 0 && <p className="atlas-row-why" data-fact="cves"><a className="atlas-link-button" href={`${TECHNIQUE_PAGES_PATH}${technique.id}/`}>{plural(cveCount, 'CVE precedent', 'CVE precedents')}</a></p>}
      {rights.length > 0 && (
        <p className="atlas-row-why" data-fact="neurorights">
          Scored against: {rights.map((right) => (right.foldsInto === null ? right.name : `${right.name} (folded into ${right.foldsInto})`)).join(', ')}.
        </p>
      )}
      {steps.map((step) => (
        <p className="atlas-row-why" data-fact="chain" key={`${step.chain_id} ${step.position}`}>
          Step {step.position} of {step.step_count}, {step.role.replaceAll('_', ' ')}, in {step.chain_name}.
        </p>
      ))}
    </>
  );
}

function TechniqueRow({ technique, detail, onChooseTechnique }: Props & { technique: DetailTechnique }) {
  const tier = technique.facts?.evidenceTier ?? null;
  return (
    <li className="atlas-dossier-row" data-dossier-technique={technique.id}>
      <p className="atlas-fact">
        <span className="atlas-tier" data-tier-mark={technique.facts?.tierMark ?? 'none'}>{technique.id}</span>
        <button type="button" className="atlas-link-button" onClick={() => onChooseTechnique(technique.id)}>{technique.name}</button>
      </p>
      <p className="atlas-row-why">
        NISS step: {technique.nissSeverity ?? 'no data'}.
        {tier !== null && ` Evidence: ${TIER_WORDS[tier]}.`}
        {technique.uncountedReason !== null && ` Not counted: ${technique.uncountedReason}.`}
      </p>
      <TechniqueControl technique={technique} />
      <TechniqueLinks technique={technique} detail={detail} />
    </li>
  );
}

function TechniqueRows({ techniques, ...props }: Props & { techniques: readonly DetailTechnique[] }) {
  return <ul className="atlas-dossier-rows">{techniques.map((technique) => <TechniqueRow key={technique.evidenceKey} technique={technique} {...props} />)}</ul>;
}

/** The controls filed under the region's band, by kind, and the neural security layers that cover it. Folded away: they are the band's, not this region's. */
function BandControls({ detail }: Pick<Props, 'detail'>) {
  const [controls] = detail.controls ?? [];
  if (controls === undefined) return null;
  const kinds = [['Detection', controls.detection], ['Prevention', controls.prevention], ['Response', controls.response]] as const;
  const count = kinds.reduce((total, [, entries]) => total + entries.length, 0);
  return (
    <>
      <h4 className="atlas-minor-heading">Controls recorded for band {controls.band_id}</h4>
      <LimitNote limit={limitSentence('controls_pair')} />
      <Disclosure label={`Show the ${plural(count, 'control', 'controls')}`}>
        {kinds.map(([kind, entries]) => <p className="atlas-row-why" key={kind} data-control-kind={kind}>{kind}: {entries.join(', ')}.</p>)}
        {(detail.protectionLayers?.length ?? 0) > 0 && <p className="atlas-row-why" data-fact="protection-layers">Security layers covering this band: {detail.protectionLayers?.join(', ')}.</p>}
      </Disclosure>
    </>
  );
}

/**
 * Techniques in the order of their standing: linked first, then named but not counted, and then one line for what
 * only shares the region's band. That line is a count and never a list: a band holds up to every region in the atlas.
 * A region no technique names is a real state of most of this atlas, and says so in place of the rows.
 */
export default function DossierTechniques({ detail, onChooseTechnique }: Props) {
  const band = detail.region.band_ids[0] ?? '';
  const count = detail.bandInheritedCount;
  const isEmpty = detail.linked.length === 0 && detail.namedNotCounted.length === 0;
  return (
    <section className="atlas-section" aria-labelledby="atlas-dossier-techniques">
      <h3 className="atlas-subheading" id="atlas-dossier-techniques">Techniques</h3>
      {isEmpty
        ? <LimitNote limit={limitSentence('dossier_no_technique', { tagged: count === 1 ? '1 is tagged' : `${count} are tagged` })} />
        : <><LimitNote limit={limitSentence('tier_mark')} /><LimitNote limit={limitSentence('niss_badge_region')} /></>}
      {detail.linked.length > 0 && <TechniqueRows techniques={detail.linked} detail={detail} onChooseTechnique={onChooseTechnique} />}
      {detail.namedNotCounted.length > 0 && (
        <>
          <h4 className="atlas-minor-heading">Named, not counted</h4>
          <LimitNote limit={limitSentence('techniques_named_not_counted')} />
          <TechniqueRows techniques={detail.namedNotCounted} detail={detail} onChooseTechnique={onChooseTechnique} />
        </>
      )}
      {!isEmpty && count > 0 && <LimitNote limit={limitSentence('dossier_band_count', { techniques_tagged: count === 1 ? '1 technique is tagged' : `${count} techniques are tagged`, band })} />}
      <LimitNote limit={limitSentence('count_excludes_band_level')} />
      <LimitNote limit={limitSentence('count_mark')} />
      {(detail.cves?.length ?? 0) > 0 && <LimitNote limit={limitSentence('cve_precedent')} />}
      <LimitNote limit={limitSentence('silicon_absent', { count: String(detail.classicalOnlyCount) })} />
      <BandControls detail={detail} />
    </section>
  );
}
