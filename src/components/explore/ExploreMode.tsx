import { useMemo, useState } from 'react';
import ArchitectureDiagram from '@/components/threat-model/ArchitectureDiagram';
import ReplaceDeviceConfirm from '@/components/threat-model/ReplaceDeviceConfirm';
import { useFocus } from '@/components/workbench/FocusContext';
import type { ModeProps } from '@/components/workbench/mode-registry';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import type { DeviceArchetype } from '@/lib/threat-model/reference-data-types';
import '@/components/threat-model/threat-model.css';

const DIRECTION_LABELS = { read: 'Records', write: 'Stimulates', bidirectional: 'Records and stimulates' } as const;
/** Thumbnails are not tied to a moment in time, so the reports behind them carry no timestamp. */
const NO_TIMESTAMP = '';

/** The Explore mode: compare device classes by their threat picture, then take one into Model. */
export default function ExploreMode({ onOpenMode }: ModeProps) {
  const { engineData, referenceData, dispatch, state, hasWork } = useFocus();
  const [pendingArchetypeId, setPendingArchetypeId] = useState<string | null>(null);

  const classes = useMemo(() => referenceData.archetypes.map((archetype) => {
    const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, engineData.registrarVersion);
    const report = buildThreatModelReport({ model, engineData, referenceData, generatedAt: NO_TIMESTAMP });
    const placedTechniques = new Set(report.riskRows.filter((row) => row.source === 'catalog').map((row) => row.techniqueId)).size;
    return { archetype, model, placedTechniques, chainCount: report.chainResult.chains.length };
  }), [engineData, referenceData]);

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

  return (
    <div className="tm-root">
      <p className="tm-muted" style={{ marginBottom: '1rem' }}>
        Device classes, not products. Each picture is drawn from a generic device of that kind, so nothing here describes a specific commercial device.
      </p>
      <div className="explore-grid">
        {classes.map(({ archetype, model, placedTechniques, chainCount }) => (
          <article key={archetype.id} className="tm-card explore-card">
            <ArchitectureDiagram model={model} title={`Architecture of a ${archetype.label}`} />
            <h2 className="tm-heading" style={{ marginTop: '0.75rem' }}>{archetype.label}</h2>
            <p className="tm-muted">{archetype.description}</p>
            <div className="tm-actions" style={{ margin: '0.75rem 0' }}>
              <span className="tm-badge">{DIRECTION_LABELS[archetype.direction]}</span>
              <span className="tm-badge">{model.components.length} parts</span>
              <span className="tm-badge">{placedTechniques} techniques placed</span>
              <span className="tm-badge">{chainCount} chain hypotheses</span>
            </div>
            {pendingArchetypeId === archetype.id ? (
              <ReplaceDeviceConfirm
                currentName={state.model.name} decisionCount={state.model.riskDecisions.length} replacementLabel={`a new ${archetype.label}`}
                onReplace={() => replaceDevice(archetype)} onKeep={() => setPendingArchetypeId(null)}
              />
            ) : (
              <button type="button" className="tm-button tm-button--primary" onClick={() => chooseDevice(archetype)}>
                {state.archetypeId === archetype.id ? 'Continue in Model' : 'Model this device'}
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
