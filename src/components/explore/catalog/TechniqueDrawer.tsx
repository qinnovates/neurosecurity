import type { ReactNode } from 'react';
import Drawer from '@/components/lab-kit/Drawer';
import EvidenceMark from '@/components/lab-kit/EvidenceMark';
import SeverityMark from '@/components/lab-kit/SeverityMark';
import TechniqueLink from '@/components/lab-kit/TechniqueLink';
import type { CatalogTactic, CatalogTechnique, PrecedentCve } from '@/lib/threat-model/catalog-types';
import { describeEvidence } from '@/lib/threat-model/evidence-levels';
import { TECHNIQUE_FAMILY_HEADING, effectLabelForMode } from '@/lib/threat-model/lab-terms';
import type { ScopeEntry } from '@/lib/threat-model/scope-statement';
import { ON_THIS_DEVICE_HEADING } from './CatalogFacetBar';
import TechniqueScope from './TechniqueScope';

interface Props {
  /** Undefined when nothing is open. */
  technique: CatalogTechnique | undefined;
  tactic: CatalogTactic | undefined;
  scopeEntry: ScopeEntry | undefined;
  deviceName: string;
  elementLabelOf: (elementId: string) => string;
  /** CVE records the catalog links to this technique. They are about other products. */
  cves: readonly PrecedentCve[];
  cvesAsOf: string;
  relatedTechniques: readonly CatalogTechnique[];
  onOpenTechnique: (techniqueId: string) => void;
  onShowInModel: () => void;
  onClose: () => void;
}

export const SOURCE_NOT_RECORDED = 'Source not recorded';
export const CVES_HEADING = 'CVEs in other products';
const SCORE_NOT_RECORDED = 'Not recorded';

function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="explore-drawer-section">
      <h3 className="lab-label">{heading}</h3>
      {children}
    </section>
  );
}

function EvidenceLines({ technique }: { technique: CatalogTechnique }) {
  const evidence = describeEvidence(technique);
  return (
    <Section heading="Evidence">
      <p><EvidenceMark tier={technique.evidenceTier} status={technique.evidenceStatus} /></p>
      {evidence.provenanceLine !== null && <p className="lab-soft">{evidence.provenanceLine}</p>}
      {evidence.cveLine !== null && <p className="lab-soft">{evidence.cveLine}</p>}
    </Section>
  );
}

function Sources({ sources }: { sources: readonly string[] }) {
  return (
    <Section heading="Sources">
      {sources.length === 0 ? <p className="lab-soft">{SOURCE_NOT_RECORDED}</p> : (
        <ul className="explore-list">{sources.map((source, index) => <li key={`${index}-${source}`}>{source}</li>)}</ul>
      )}
    </Section>
  );
}

/** Identifier, product and score. A CVE's description is not printed. */
function CveRecords({ cves, asOf }: { cves: readonly PrecedentCve[]; asOf: string }) {
  if (cves.length === 0) return <Section heading={CVES_HEADING}><p className="lab-soft">No CVE is linked to this technique in the mapping dated {asOf}.</p></Section>;
  return (
    <Section heading={CVES_HEADING}>
      <p className="lab-soft">Found in other products and linked to this technique by the catalog, as of {asOf}. These are precedents, not findings about any device here.</p>
      <table className="explore-cves">
        <thead><tr><th scope="col">ID</th><th scope="col">Product</th><th scope="col">CVSS</th></tr></thead>
        <tbody>
          {cves.map((cve) => (
            <tr key={cve.cveId}>
              <td className="lab-id">{cve.cveId}</td>
              <td>{cve.product}</td>
              <td>{cve.cvssScore === null ? <span className="lab-soft">{SCORE_NOT_RECORDED}</span> : <span className="lab-figure">{cve.cvssScore}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

function Scores({ technique }: { technique: CatalogTechnique }) {
  return (
    <Section heading="Scores">
      <p className="lab-id explore-vector">{technique.cvssBaseVector ?? 'No CVSS vector recorded'}</p>
      {technique.nissScore !== null && (
        <p className="lab-soft">NISS {technique.nissScore}{technique.nissVector !== null && <> <span className="lab-id explore-vector">{technique.nissVector}</span></>}. NISS is a proposed score and is not peer reviewed.</p>
      )}
    </Section>
  );
}

function TechniqueBody({ technique, tactic, scopeEntry, deviceName, elementLabelOf, cves, cvesAsOf, relatedTechniques, onOpenTechnique, onShowInModel }: Omit<Props, 'technique' | 'onClose'> & { technique: CatalogTechnique }) {
  return (
    <div className="explore-drawer">
      <p><span className="lab-id">{technique.id}</span>{technique.alias !== null && <> · <span className="lab-id">{technique.alias}</span></>}</p>
      <p className="explore-drawer-marks">
        <SeverityMark severity={technique.severity} />
        {technique.mode !== null && <span>{effectLabelForMode(technique.mode)}</span>}
      </p>
      <EvidenceLines technique={technique} />
      <Sources sources={technique.sources} />
      {scopeEntry !== undefined && (
        <Section heading={`${ON_THIS_DEVICE_HEADING}: ${deviceName}`}>
          <TechniqueScope entry={scopeEntry} elementLabelOf={elementLabelOf} onShowInModel={onShowInModel} />
        </Section>
      )}
      <Section heading={TECHNIQUE_FAMILY_HEADING}>
        <p>{tactic?.name ?? technique.tactic} <span className="lab-id">{technique.tactic}</span></p>
        {tactic !== undefined && tactic.description !== '' && <p className="lab-soft">{tactic.description}</p>}
      </Section>
      <Section heading="Bands"><p className="lab-id">{technique.bandIds.length === 0 ? 'None recorded' : technique.bandIds.join(' · ')}</p></Section>
      <Scores technique={technique} />
      {technique.detection !== null && <Section heading="Detection, from the catalog"><p>{technique.detection}</p></Section>}
      <CveRecords cves={cves} asOf={cvesAsOf} />
      {relatedTechniques.length > 0 && (
        <Section heading="Related techniques">
          <ul className="explore-list explore-list--plain">
            {relatedTechniques.map((related) => <li key={related.id}><TechniqueLink techniqueId={related.id} techniqueName={related.name} onOpen={onOpenTechnique} /> {related.name}</li>)}
          </ul>
        </Section>
      )}
    </div>
  );
}

/** One technique in the inspector beside the catalog. The table stays usable; Escape or Close returns to the row. */
export default function TechniqueDrawer({ technique, onClose, ...rest }: Props) {
  return (
    <Drawer isOpen={technique !== undefined} title={technique?.name ?? ''} onClose={onClose} isFocusTrapped={false}>
      {technique !== undefined && <TechniqueBody technique={technique} {...rest} />}
    </Drawer>
  );
}
