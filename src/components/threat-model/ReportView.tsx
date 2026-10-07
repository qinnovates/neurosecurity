import type { ArchitectureView, CatalogCoverage, ThreatModelReport } from '@/lib/threat-model/report-types';
import ArchitectureDiagram from './ArchitectureDiagram';
import BeyondDevice from './BeyondDevice';
import ChainList from './ChainList';
import ComplianceChecklist from './ComplianceChecklist';
import RiskRegister from './RiskRegister';
import ThreatMatrix from './ThreatMatrix';

interface Props {
  report: ThreatModelReport;
  regionNames: readonly string[];
}

export const VIEW_LABELS: Record<ArchitectureView, string> = {
  global_system: 'Global system view',
  multi_patient_harm: 'Multi-patient harm view',
  updateability: 'Updateability and patchability view',
  security_use_case: 'Security use case view',
};

const NOT_PLACED_LABELS: Record<string, string> = {
  external_energy: 'delivered by an external energy source, not through the device',
  consumer_sensor: 'exploit consumer-device sensors this model does not capture',
  pharmacological: 'act through a chemical or dietary exposure',
  nanoparticle: 'need nanoparticles introduced into tissue',
  other_device_class: 'specific to device classes this tool does not model yet',
};

function CoverageStatement({ coverage, gaps }: { coverage: CatalogCoverage; gaps: readonly string[] }) {
  return (
    <>
      <p>
        The catalog holds {coverage.totalTechniques} techniques. {coverage.placedTechniques} have a placement decision and can appear in this report.
        {' '}{coverage.notReviewedTechniques} have weaker evidence and have not been reviewed for device applicability, so they are not assessed here.
      </p>
      <ul className="tm-list">
        {Object.entries(coverage.notPlacedByCategory).map(([category, count]) => (
          <li key={category}>{count} evidenced technique{count === 1 ? ' is' : 's are'} not placed: {NOT_PLACED_LABELS[category] ?? category}.</li>
        ))}
        {gaps.map((gap) => <li key={gap}>{gap} Nothing was assessed there.</li>)}
      </ul>
    </>
  );
}

/** The complete report on one page, laid out so the browser's print dialog produces the document. */
export default function ReportView({ report, regionNames }: Props) {
  const { model } = report;
  return (
    <div>
      <section className="tm-card tm-section">
        <h2 className="tm-heading">Threat model draft: {model.name}</h2>
        <p className="tm-muted">
          Generated {report.generatedAt}. Catalog version {report.registrarVersion}. Device category: {model.deviceCategory.replaceAll('_', ' ')};
          {' '}{model.invasiveness.replaceAll('_', ' ')}; {model.direction}. Target regions: {regionNames.join(', ')}.
        </p>
        <h3 className="tm-subheading">Read this first</h3>
        <ul className="tm-list">{report.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
      </section>

      <section className="tm-card tm-section">
        <h2 className="tm-heading">1. Security architecture views</h2>
        {report.architectureViews.map((selection) => (
          <div key={selection.view}>
            <h3 className="tm-subheading">{VIEW_LABELS[selection.view]}</h3>
            <p className="tm-muted">{selection.explanation}</p>
            <ArchitectureDiagram
              model={model} title={`${VIEW_LABELS[selection.view]} of ${model.name}`}
              highlight={{ componentIds: selection.highlightedComponentIds, linkIds: selection.highlightedLinkIds }}
            />
          </div>
        ))}
      </section>

      <section className="tm-card tm-section">
        <h2 className="tm-heading">2. Attack map</h2>
        <ThreatMatrix rows={report.riskRows} />
      </section>

      <section className="tm-card tm-section">
        <h2 className="tm-heading">3. Attack chain hypotheses</h2>
        <ChainList chainResult={report.chainResult} />
      </section>

      <section className="tm-card tm-section">
        <h2 className="tm-heading">4. Risk register</h2>
        <p className="tm-muted">
          Scores are the catalog's CVSS base vectors where one exists. NISS is a proposed, unadopted score shown as an annex.
          Rows from the STRIDE baseline are generic and carry no score.
        </p>
        <RiskRegister rows={report.riskRows} controlsInPlace={model.controlsInPlace} />
      </section>

      <section className="tm-card tm-section">
        <h2 className="tm-heading">5. Precedent vulnerabilities in similar products</h2>
        <p className="tm-muted">
          Mapping dated {report.precedentCvesAsOf}. These CVEs were found in other products and are linked to the techniques above by the catalog.
          They are not findings about this device, and this tool has not scanned it.
        </p>
        {report.precedentCves.length === 0 && <p className="tm-muted">None are linked to the placed techniques.</p>}
        {report.precedentCves.length > 0 && (
          <div className="tm-table-wrap">
            <table className="tm-table">
              <thead><tr><th>CVE</th><th>Product</th><th>CVSS</th><th>Linked through</th></tr></thead>
              <tbody>
                {report.precedentCves.map((cve) => (
                  <tr key={cve.cveId}>
                    <td className="tm-mono">{cve.cveId}</td>
                    <td>{cve.product}<div className="tm-muted tm-small">{cve.description}</div></td>
                    <td>{cve.cvssScore ?? 'Not recorded'}</td>
                    <td className="tm-mono">{cve.viaTechniqueIds.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="tm-card tm-section">
        <h2 className="tm-heading">6. US requirements checklist</h2>
        <ComplianceChecklist assessment={report.cyberDeviceAssessment} items={report.complianceItems} />
      </section>

      <section className="tm-card tm-section">
        <h2 className="tm-heading">7. Outside the device's architecture</h2>
        <BeyondDevice ambientThreats={report.ambientThreats} themes={report.themes} />
      </section>

      <section className="tm-card tm-section">
        <h2 className="tm-heading">8. Method and coverage</h2>
        <p>
          Method: a data-flow view of the device with trust zones; the STRIDE categories applied to each component and connection as a generic baseline;
          and neural-device techniques from the TARA catalog placed on the same elements by an authored placement table. Chains are assembled along paths in the model.
        </p>
        <CoverageStatement coverage={report.catalogCoverage} gaps={report.coverageGaps} />
      </section>
    </div>
  );
}
