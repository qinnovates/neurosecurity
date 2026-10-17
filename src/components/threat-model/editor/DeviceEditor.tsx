/**
 * The device editor. It edits the model itself through the shared dispatch, so a preset, a
 * blank start and a model read from a file are all edited the same way, and every screen
 * sees the same device. One section is in front at a time, the parts first, so the main
 * task is never two screens down; what the last edit did stays in view under every section.
 */

import { useCallback, useMemo } from 'react';
import Segmented, { type SegmentedOption } from '@/components/lab-kit/Segmented';
import { useFocus } from '@/components/workbench/FocusContext';
import { useViewState } from '@/components/workbench/ViewStateContext';
import type { DeviceFacts, ModelEdit } from '@/lib/threat-model/model-edit';
import { findModelWarnings } from '@/lib/threat-model/model-warnings';
import type { DeviceArchetype } from '@/lib/threat-model/reference-data-types';
import { MODEL_STATE_KEYS } from '../frame/model-view-keys';
import ConnectionsTable from './ConnectionsTable';
import DeviceFactsForm from './DeviceFactsForm';
import ModelWarningList from './ModelWarningList';
import PartsTable from './PartsTable';
import ScopeChangeList from './ScopeChangeList';
import StartFrom from './StartFrom';
import { useScopeChanges } from './use-scope-changes';
import './device-editor.css';

export const EDITOR_SECTIONS = ['device', 'parts', 'connections', 'warnings'] as const;
export type EditorSection = typeof EDITOR_SECTIONS[number];
/** The parts are the main task, so they are in front until the reader chooses another section, and again after a new start. */
const FIRST_SECTION: EditorSection = 'parts';
const SECTION_LABELS: Readonly<Record<EditorSection, string>> = { device: 'Device', parts: 'Parts', connections: 'Connections', warnings: 'Warnings' };

function isEditorSection(value: unknown): value is EditorSection {
  return EDITOR_SECTIONS.some((section) => section === value);
}

/** The sections as the reader picks them; the warnings carry their count so one out of sight is still seen. */
function listSectionOptions(warningCount: number): SegmentedOption<EditorSection>[] {
  return EDITOR_SECTIONS.map((section) => ({
    value: section, label: section === 'warnings' && warningCount > 0 ? `${SECTION_LABELS[section]} (${warningCount})` : SECTION_LABELS[section],
  }));
}

export default function DeviceEditor() {
  const [section, setSection] = useViewState<EditorSection>(MODEL_STATE_KEYS.editorSection, FIRST_SECTION, isEditorSection);
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
  const selectPreset = (archetype: DeviceArchetype): void => {
    dispatch({ type: 'preset-selected', archetype, registrarVersion });
    setSection(FIRST_SECTION);
  };
  const startBlank = (): void => {
    dispatch({ type: 'blank-started' });
    setSection(FIRST_SECTION);
  };

  return (
    <div className="lab-editor">
      <div className="lab-editor-sections">
        <Segmented label="Editor section" options={listSectionOptions(warnings.length)} value={section} onChange={setSection} />
      </div>
      {section === 'device' && (
        <>
          <StartFrom
            archetypes={referenceData.archetypes} currentArchetypeId={state.archetypeId} deviceName={model.name} hasWork={hasWork}
            decisionCount={model.riskDecisions.length} onSelectPreset={selectPreset} onStartBlank={startBlank}
          />
          <DeviceFactsForm model={model} regions={regions} onChange={changeFacts} />
        </>
      )}
      {section === 'parts' && <PartsTable model={model} onEdit={edit} />}
      {section === 'connections' && <ConnectionsTable model={model} onEdit={edit} />}
      {section === 'warnings' && <ModelWarningList warnings={warnings} />}
      {editProblem !== null && <p role="alert" className="lab-notice">That change was not applied: {editProblem}.</p>}
      <ScopeChangeList changes={scopeChanges} />
    </div>
  );
}
