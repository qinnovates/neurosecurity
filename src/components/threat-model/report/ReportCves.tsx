import type { PrecedentCveEntry } from '@/lib/threat-model/report-types';
import { ReportSection, ReportTable, type ReportColumn } from './ReportSection';

interface Props {
  cves: readonly PrecedentCveEntry[];
  /** The date the catalog's CVE mapping was generated. */
  mappingDate: string;
}

const NOT_RECORDED = 'Not recorded';

/** Identifier, product and score only. A CVE's description is never printed. */
const CVE_COLUMNS: readonly ReportColumn<PrecedentCveEntry>[] = [
  { id: 'cve', header: 'CVE', render: (cve) => <span className="lab-id">{cve.cveId}</span> },
  { id: 'product', header: 'Product', render: (cve) => cve.product },
  { id: 'score', header: 'CVSS', isFigure: true, render: (cve) => cve.cvssScore ?? NOT_RECORDED },
  { id: 'via', header: 'Linked through', render: (cve) => <span className="lab-id report-wrap">{cve.viaTechniqueIds.join(', ')}</span> },
];

export default function ReportCves({ cves, mappingDate }: Props) {
  return (
    <ReportSection id="cves">
      <p>
        Mapping dated {mappingDate}. These CVEs were found in other products and are linked to the techniques above by the catalog.
        They are not findings about this device, and this tool has not scanned it.
      </p>
      <ReportTable caption={`${cves.length} CVEs in other products`} columns={CVE_COLUMNS} rows={cves} rowKey={(cve) => cve.cveId} emptyMessage="None are linked to the placed techniques." />
    </ReportSection>
  );
}
