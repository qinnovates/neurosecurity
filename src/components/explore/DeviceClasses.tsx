import { useMemo, useState, type ReactNode } from 'react';
import EvidenceBar from '@/components/lab-kit/EvidenceBar';
import { useSequencePlayback } from '@/components/lab-kit/motion/use-sequence-playback';
import ArchitectureDiagram from '@/components/threat-model/ArchitectureDiagram';
import ReplaceDeviceConfirm from '@/components/threat-model/ReplaceDeviceConfirm';
import { useFocus } from '@/components/workbench/FocusContext';
import type { ModeId } from '@/components/workbench/mode-registry';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import type { CatalogTechnique, EngineData } from '@/lib/threat-model/catalog-types';
import { countByEvidence } from '@/lib/threat-model/evidence-levels';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import { derivePayloadFlows } from '@/lib/threat-model/payload-flow';
import type { DeviceArchetype, ReferenceData } from '@/lib/threat-model/reference-data-types';

const DIRECTION_LABELS = { read: 'Records', write: 'Stimulates', bidirectional: 'Records and stimulates' } as const;
/** Pictures of a class are not tied to a moment in time, so the reports behind them carry no timestamp. */
const NO_TIMESTAMP = '';

interface CardProps {
  archetype: DeviceArchetype;
  engineData: EngineData;
  referenceData: ReferenceData;
  techniqueById: ReadonlyMap<string, CatalogTechnique>;
  isInFocus: boolean;
  isConfirming: boolean;
  onChoose: () => void;
  confirm: ReactNode;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** One class: its diagram with data moving on it, the facts that compare across classes, and one chain to play. */
function DeviceClassCard({ archetype, engineData, referenceData, techniqueById, isInFocus, isConfirming, onChoose, confirm }: CardProps) {
  const [isChainShown, setChainShown] = useState(false);
  const { model, report, payloadFlows, evidenceCounts } = useMemo(() => {
    const builtModel = buildModelFromIntake(defaultAnswersFor(archetype), archetype, engineData.registrarVersion);
    const builtReport = buildThreatModelReport({ model: builtModel, engineData, referenceData, generatedAt: NO_TIMESTAMP });
    const placedIds = new Set(builtReport.riskRows.flatMap((row) => (row.source === 'catalog' && row.techniqueId !== null ? [row.techniqueId] : [])));
    const placed = [...placedIds].flatMap((techniqueId) => { const technique = techniqueById.get(techniqueId); return technique === undefined ? [] : [technique]; });
    return { model: builtModel, report: builtReport, payloadFlows: derivePayloadFlows(builtModel), evidenceCounts: countByEvidence(placed) };
  }, [archetype, engineData, referenceData, techniqueById]);
  const chain = report.chainResult.chains[0];
  const playback = useSequencePlayback(chain?.steps.length ?? 0);
  const placedCount = evidenceCounts.reduce((sum, entry) => sum + entry.count, 0);
  const chainSteps = isChainShown && chain !== undefined ? chain.steps.map((step) => ({ elementId: step.elementId, position: step.position })) : [];

  const playChain = (): void => {
    setChainShown(true);
    playback.play();
  };

  return (
    <article className="lab-panel explore-class" data-in-focus={isInFocus}>
      <div className="explore-class-diagram">
        <ArchitectureDiagram
          model={model} title={`Architecture of a ${archetype.label}`} payloadFlows={payloadFlows}
          chainSteps={chainSteps} reachedStepCount={isChainShown && (playback.isPlaying || playback.reached < chainSteps.length) ? playback.reached : undefined}
          highlight={isChainShown ? { componentIds: chainSteps.map((step) => step.elementId), linkIds: chainSteps.map((step) => step.elementId) } : null}
        />
        {isChainShown && chain !== undefined && (
          <p className="explore-class-chain" role="status">
            <span className="tm-badge tm-badge--generated">Generated hypothesis</span> {chain.chain_name}. A path through this model exists; that is not evidence the attack has been carried out.
          </p>
        )}
      </div>
      <div className="explore-class-facts">
        <h2 className="lab-title">{archetype.label}</h2>
        <p className="lab-soft">{archetype.description}</p>
        <p>{DIRECTION_LABELS[archetype.direction]} · {plural(model.components.length, 'part', 'parts')} · {plural(model.links.length, 'connection', 'connections')}</p>
        <p className="lab-label">{plural(placedCount, 'technique placed', 'techniques placed')}, by evidence</p>
        <EvidenceBar counts={evidenceCounts} subject="techniques placed on this class" />
        {isConfirming ? confirm : (
          <div className="explore-class-actions">
            <button type="button" className="lab-button lab-button--primary" onClick={onChoose}>{isInFocus ? 'Continue in Model' : 'Model this device'}</button>
            {chain !== undefined && <button type="button" className="lab-button" onClick={playChain}>{isChainShown ? 'Play it again' : 'Play a chain'}</button>}
            {isChainShown && <button type="button" className="lab-button" onClick={() => { playback.showAll(); setChainShown(false); }}>Clear</button>}
          </div>
        )}
      </div>
    </article>
  );
}

/** Compare the device classes by their threat picture, then take one into Model. */
export default function DeviceClasses({ onOpenMode }: { onOpenMode: (modeId: ModeId) => void }) {
  const { engineData, referenceData, techniqueById, dispatch, state, hasWork } = useFocus();
  const [pendingArchetypeId, setPendingArchetypeId] = useState<string | null>(null);

  const replaceDevice = (archetype: DeviceArchetype): void => {
    setPendingArchetypeId(null);
    dispatch({ type: 'preset-selected', archetype, registrarVersion: engineData.registrarVersion });
    onOpenMode('model');
  };
  const chooseDevice = (archetype: DeviceArchetype): void => {
    // The class already in focus is opened as it is, with every answer and decision intact.
    if (state.archetypeId === archetype.id) onOpenMode('model');
    else if (hasWork) setPendingArchetypeId(archetype.id);
    else replaceDevice(archetype);
  };
  // The class in focus is listed first, so the reader's own device is the first thing on screen.
  const ordered = [...referenceData.archetypes].sort((left, right) => Number(right.id === state.archetypeId) - Number(left.id === state.archetypeId));

  return (
    <div className="explore-classes">
      <div className="explore-intro">
        <p>
          Threat analysis and risk assessment for neural devices. A drafting aid built on the TARA catalog, a proposed and not yet peer-reviewed catalog of attack techniques.
          Its output is a starting point for qualified review. It is not a compliance determination.
        </p>
        <p className="lab-soft">Device classes, not products. Each picture is drawn from a generic device of that kind, so nothing here describes a specific commercial device.</p>
      </div>
      {ordered.map((archetype) => (
        <DeviceClassCard
          key={archetype.id} archetype={archetype} engineData={engineData} referenceData={referenceData} techniqueById={techniqueById}
          isInFocus={state.archetypeId === archetype.id} isConfirming={pendingArchetypeId === archetype.id} onChoose={() => chooseDevice(archetype)}
          confirm={(
            <ReplaceDeviceConfirm
              currentName={state.model.name} decisionCount={state.model.riskDecisions.length} replacementLabel={`a new ${archetype.label}`}
              onReplace={() => replaceDevice(archetype)} onKeep={() => setPendingArchetypeId(null)}
            />
          )}
        />
      ))}
    </div>
  );
}
