/**
 * The device editor. It edits the model itself through the shared dispatch, so a preset, a
 * blank start and a model read from a file are all edited the same way, and every screen
 * sees the same device.
 */

import { useCallback, useMemo } from 'react';
import { useFocus } from '@/components/workbench/FocusContext';
import type { DeviceFacts, ModelEdit } from '@/lib/threat-model/model-edit';
import { findModelWarnings } from '@/lib/threat-model/model-warnings';
import type { DeviceArchetype } from '@/lib/threat-model/reference-data-types';
import ConnectionsTable from './ConnectionsTable';
import DeviceFactsForm from './DeviceFactsForm';
import ModelWarningList from './ModelWarningList';
import PartsTable from './PartsTable';
import ScopeChangeList from './ScopeChangeList';
import StartFrom from './StartFrom';
import { useScopeChanges } from './use-scope-changes';
import './device-editor.css';

export default function DeviceEditor() {
  const { state, dispatch, engineData, referenceData, hasWork } = useFocus();
  const { model, editProblem } = state;
  const { registrarVersion, regions } = engineData;
  const knownRegionIds = useMemo(() => new Set(regions.map((region) => region.id)), [regions]);
  const warnings = useMemo(() => findModelWarnings(model, regions), [model, regions]);
  const scopeChanges = useScopeChanges(model, engineData, referenceData);

  const edit = useCallback((modelEdit: ModelEdit): void => dispatch(modelEdit), [dispatch]);
  const changeFacts = useCallback(
    (changes: Partial<DeviceFacts>): void => dispatch({ type: 'device-facts-changed', changes, knownRegionIds }),
    [dispatch, knownRegionIds],
  );
  const selectPreset = (archetype: DeviceArchetype): void => dispatch({ type: 'preset-selected', archetype, registrarVersion });

  return (
    <div className="lab-editor">
      <StartFrom
        archetypes={referenceData.archetypes} currentArchetypeId={state.archetypeId} deviceName={model.name} hasWork={hasWork}
        decisionCount={model.riskDecisions.length} onSelectPreset={selectPreset} onStartBlank={() => dispatch({ type: 'blank-started' })}
      />
      <DeviceFactsForm model={model} regions={regions} onChange={changeFacts} />
      <PartsTable model={model} onEdit={edit} />
      <ConnectionsTable model={model} onEdit={edit} />
      <ModelWarningList warnings={warnings} />
      {editProblem !== null && <p role="alert" className="lab-notice">That change was not applied: {editProblem}.</p>}
      <ScopeChangeList changes={scopeChanges} />
    </div>
  );
}
