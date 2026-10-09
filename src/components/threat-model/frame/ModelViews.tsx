import type { DataTableHandle } from '@/components/lab-kit/DataTable';
import type { SequencePlayback } from '@/components/lab-kit/motion/use-sequence-playback';
import { useFocus } from '@/components/workbench/FocusContext';
import type { GeneratedChain } from '@/lib/threat-model/chain-types';
import type { RiskStatus } from '@/lib/threat-model/device-model';
import type { RiskRow } from '@/lib/threat-model/report-types';
import type { ReactNode, RefObject } from 'react';
import BeyondDevice from '../BeyondDevice';
import ChainsSection from '../ChainsSection';
import ComplianceChecklist from '../ComplianceChecklist';
import OverviewView from '../overview/OverviewView';
import ReportView from '../ReportView';
import RisksSection from '../RisksSection';
import ThreatMatrix from '../ThreatMatrix';
import { MODEL_VIEWS } from './model-view-keys';
import OrphanDecisions from './OrphanDecisions';
import type { ModelData } from './use-model-data';

export interface ModelViewActions {
  onSelectElement: (elementId: string) => void;
  /** Opens the risk's detail; from a view without the register, it opens the register first. */
  onOpenRisk: (riskId: string) => void;
  onDecideOnRow: (row: RiskRow, status: RiskStatus) => void;
  onOpenTechnique: (techniqueId: string) => void;
  onSelectView: (viewId: string) => void;
  onSelectChain: (chainId: string | null) => void;
}

interface Props {
  viewId: string;
  data: ModelData;
  actions: ModelViewActions;
  /** The device diagram, for the view that places it inside its own layout. */
  diagram: ReactNode;
  openedRiskId: string | null;
  tableRef: RefObject<DataTableHandle | null>;
  selectedChain: GeneratedChain | null;
  chainPlayback: SequencePlayback;
}

/** Views this folder draws; their results region is marked here. The checklist and the report mark their own. */
const OWN_VIEW_IDS: readonly string[] = [MODEL_VIEWS.overview, MODEL_VIEWS.risks, MODEL_VIEWS.techniquesByPart, MODEL_VIEWS.chains, MODEL_VIEWS.around];

function ReportScreen() {
  const { report, engineData } = useFocus();
  const nameByRegionId = new Map(engineData.regions.map((region) => [region.id, region.name]));
  const regionNames = report.model.targetRegionIds.map((regionId) => nameByRegionId.get(regionId) ?? regionId);
  return (
    <>
      <div className="model-actions model-no-print">
        <button type="button" className="lab-button lab-button--primary" onClick={() => window.print()}>Print or save as PDF</button>
      </div>
      <ReportView report={report} regionNames={regionNames} />
    </>
  );
}

function OwnView({ viewId, data, actions, diagram, openedRiskId, tableRef, selectedChain, chainPlayback }: Props) {
  const { state, report, referenceData, techniqueById } = useFocus();
  const { model } = state;
  switch (viewId) {
    case MODEL_VIEWS.overview:
      return (
        <OverviewView
          model={model} rows={data.currentRows} scope={data.scope} severityCoverage={data.severityCoverage} goalCoverage={report.goalCoverage}
          gaps={data.gaps} placementTable={referenceData.placementTable} diagram={diagram}
          onSelectElement={actions.onSelectElement} onOpenRisk={actions.onOpenRisk} onOpenTechnique={actions.onOpenTechnique}
          onOpenScopeLists={() => actions.onSelectView(MODEL_VIEWS.report)}
        />
      );
    case MODEL_VIEWS.risks:
      return (
        <>
          <RisksSection
            rows={data.rowsInView} elements={data.elements} openedRiskId={openedRiskId} tableRef={tableRef}
            onDecide={actions.onDecideOnRow} onOpenRisk={actions.onOpenRisk} onOpenTechnique={actions.onOpenTechnique}
          />
          <OrphanDecisions orphans={data.orphans} onOpenTechnique={actions.onOpenTechnique} />
        </>
      );
    case MODEL_VIEWS.techniquesByPart:
      return (
        <section className="lab-panel" aria-label="Techniques by part">
          <ThreatMatrix
            rows={data.rowsInView} elements={data.elements} isCoverageIncomplete={data.gaps.isAnyIncomplete}
            onOpenRow={actions.onOpenRisk} onOpenTechnique={actions.onOpenTechnique}
          />
        </section>
      );
    case MODEL_VIEWS.chains:
      return (
        <ChainsSection
          model={model} chainResult={data.chainsInView} deviceChainCount={report.chainResult.chains.length} techniqueById={techniqueById}
          selectedChain={selectedChain} onSelectChain={actions.onSelectChain} playback={chainPlayback} onOpenTechnique={actions.onOpenTechnique}
        />
      );
    default:
      return <BeyondDevice ambientThreats={report.ambientThreats} themes={report.themes} onOpenTechnique={actions.onOpenTechnique} />;
  }
}

/** The view the address names. Adding a view is one entry in `view-registry.ts` and a branch here. */
export default function ModelViews(props: Props) {
  const { report } = useFocus();
  const { viewId } = props;
  if (OWN_VIEW_IDS.includes(viewId)) return <div className="model-results" id="lab-results" tabIndex={-1}><OwnView {...props} /></div>;
  if (viewId === MODEL_VIEWS.requirements) return <ComplianceChecklist assessment={report.cyberDeviceAssessment} items={report.complianceItems} />;
  return <ReportScreen />;
}
