// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { loadTaraChains } from '@/components/atlas/load-tara-chains';
import { FocusProvider, useFocus } from '@/components/workbench/FocusContext';
import { installMemoryLocalStorage } from '@/components/workbench/__tests__/memory-storage';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { modelFromArchetype } from '@/lib/threat-model/intake-to-model';
import { BLANK_DEVICE_NAME } from '@/lib/threat-model/model-edit';
import { findModelWarnings } from '@/lib/threat-model/model-warnings';
import { parseDeviceModelText } from '@/lib/threat-model/parse-device-model';
import { diffScope, summariseScope } from '@/lib/threat-model/scope-statement';
import { engineData, referenceData } from '@/lib/threat-model/__tests__/preset-reports';
import DeviceEditor from '../DeviceEditor';

const curatedChains = loadTaraChains();
const { archetypes } = referenceData;
const { registrarVersion } = engineData;
const regionIds = new Set(engineData.regions.map((region) => region.id));
const corticalClass = archetypes.find((archetype) => archetype.presentsStimuli && archetype.direction === 'read')!;
const stimulatorClass = archetypes.find((archetype) => archetype.direction === 'write')!;
const HOSTILE_NAME = '<script>alert(1)</script>';

/** Stands in for the rest of the Lab: puts a device in focus, records a decision, and shows the model. */
function Probe({ startFrom }: { startFrom: DeviceModel | null }) {
  const { state, dispatch, report } = useFocus();
  return (
    <>
      {startFrom !== null && <button type="button" onClick={() => dispatch({ type: 'model-imported', model: startFrom })}>Load the file</button>}
      <button type="button" onClick={() => dispatch({ type: 'risk-decided', riskId: report.riskRows[0].riskId, status: 'accepted', note: '' })}>Decide a risk</button>
      <button type="button" onClick={() => dispatch({ type: 'part-removed', partId: 'no-such-part' })}>Send a bad edit</button>
      <output data-testid="model">{JSON.stringify(state.model)}</output>
      <output data-testid="preset">{state.archetypeId ?? 'none'}</output>
    </>
  );
}

function renderEditor(startFrom: DeviceModel | null = null): void {
  render(
    <FocusProvider engineData={engineData} referenceData={referenceData} curatedChains={curatedChains}>
      <DeviceEditor />
      <Probe startFrom={startFrom} />
    </FocusProvider>,
  );
  if (startFrom !== null) fireEvent.click(screen.getByRole('button', { name: 'Load the file' }));
}

function currentModel(): DeviceModel {
  return JSON.parse(screen.getByTestId('model').textContent ?? '') as DeviceModel;
}

function commitName(name: string): void {
  const field = screen.getByLabelText('Name');
  fireEvent.change(field, { target: { value: name } });
  fireEvent.blur(field);
}

beforeEach(() => { installMemoryLocalStorage(); });
afterEach(cleanup);

describe('DeviceEditor', () => {
  it('opens on the device in focus with "None yet" as the planned submission', () => {
    renderEditor();
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(archetypes[0].label);
    const submission = screen.getByLabelText('Planned FDA submission') as HTMLSelectElement;
    expect(submission.value).toBe('none');
    expect(submission.selectedOptions[0].textContent).toBe('None yet');
    expect(screen.getByRole('button', { name: new RegExp(archetypes[0].label), pressed: true })).toBeTruthy();
  });

  it('edits a model read from a file like any other: fields, both tables, and the same ids afterwards', () => {
    const file = parseDeviceModelText(JSON.stringify(modelFromArchetype(stimulatorClass, registrarVersion)), regionIds);
    renderEditor(file);
    expect(screen.queryByText(/loaded from a file/i)).toBeNull();
    expect(screen.getByTestId('preset').textContent).toBe('none');

    commitName('Our stimulator');
    const part = file.components.find((candidate) => !candidate.isNeuralInterface)!;
    const label = screen.getByLabelText(`Label of ${part.label}`);
    fireEvent.change(label, { target: { value: 'Relay wand' } });
    fireEvent.blur(label);

    const edited = currentModel();
    expect(edited.name).toBe('Our stimulator');
    expect(edited.components.map((component) => component.id)).toEqual(file.components.map((component) => component.id));
    expect(edited.components.find((component) => component.id === part.id)?.label).toBe('Relay wand');
    expect(parseDeviceModelText(JSON.stringify(edited), regionIds)).toEqual(edited);
  });

  it('lists what left and why after an edit, exactly as diffScope gives it', () => {
    renderEditor(modelFromArchetype(corticalClass, registrarVersion));
    const before = currentModel();
    fireEvent.click(screen.getByLabelText(/Shows images or plays sounds to the patient/));
    const after = currentModel();
    expect(after.presentsStimuli).toBe(false);

    const expected = diffScope(summariseScope(before, engineData, referenceData), summariseScope(after, engineData, referenceData));
    expect(expected.length).toBeGreaterThan(0);
    const outcome = screen.getByRole('status', { name: 'What the last change did' });
    const leftCount = expected.filter((change) => change.direction === 'left').length;
    expect(outcome.textContent).toContain(`${expected.length - leftCount} arrived, ${leftCount} left`);
    for (const change of expected) {
      expect(outcome.textContent).toContain(change.techniqueId);
      expect(outcome.textContent).toContain(change.name);
      expect(outcome.textContent).toContain(change.reason);
      for (const condition of change.conditions) expect(outcome.textContent).toContain(condition.restoringAnswer);
    }
  });

  it('says so when an edit moved no technique, and does not treat a decision as an edit', () => {
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Decide a risk' }));
    expect(screen.queryByRole('status', { name: 'What the last change did' })).toBeNull();
    commitName('Our headset');
    expect(screen.getByRole('status', { name: 'What the last change did' }).textContent).toBe('The last change did not add or remove any technique.');
  });

  it('warns without blocking: a records-only device with a connection carrying stimulation commands', () => {
    renderEditor(modelFromArchetype(stimulatorClass, registrarVersion));
    expect(screen.getByRole('heading', { name: 'Warnings (0)' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Records or stimulates'), { target: { value: 'read' } });
    const model = currentModel();
    expect(model.direction).toBe('read');
    const warnings = findModelWarnings(model, engineData.regions);
    expect(warnings.length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: `Warnings (${warnings.length})` })).toBeTruthy();
    for (const warning of warnings) expect(screen.getByText(warning.message)).toBeTruthy();
  });

  it('keeps one target region ticked and says why', () => {
    renderEditor();
    const model = currentModel();
    const names = model.targetRegionIds.map((regionId) => engineData.regions.find((region) => region.id === regionId)!.name);
    for (const name of names) fireEvent.click(screen.getByRole('checkbox', { name: new RegExp(`^${name} `) }));
    expect(currentModel().targetRegionIds).toHaveLength(1);
    expect(screen.getByText('One target region stays ticked: the model file needs at least one.')).toBeTruthy();
  });

  it('shows the guard\'s message when an edit is refused, and leaves the model as it was', () => {
    renderEditor();
    const before = screen.getByTestId('model').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Send a bad edit' }));
    expect(screen.getByText('That change was not applied: the part to change is not in the model.')).toBeTruthy();
    expect(screen.getByTestId('model').textContent).toBe(before);
  });

  it('starts from another preset at once when nothing would be lost, and asks first when work exists', () => {
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(stimulatorClass.label) }));
    expect(screen.getByTestId('preset').textContent).toBe(stimulatorClass.id);

    fireEvent.click(screen.getByRole('button', { name: 'Decide a risk' }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(archetypes[0].label) }));
    expect(screen.getByTestId('preset').textContent).toBe(stimulatorClass.id);
    const confirm = screen.getByRole('alertdialog', { name: `Replace ${stimulatorClass.label} with ${archetypes[0].label}?` });
    expect(confirm.textContent).toContain('1 recorded decision and the edits to this device');
    fireEvent.click(within(confirm).getByRole('button', { name: 'Replace it' }));
    expect(screen.getByTestId('preset').textContent).toBe(archetypes[0].id);
    expect(currentModel().riskDecisions).toEqual([]);
  });

  it('starts blank: one tissue-contact part, no connection, and a warning that it is not connected', () => {
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: /^Start blank/ }));
    const model = currentModel();
    expect(model.name).toBe(BLANK_DEVICE_NAME);
    expect(model.components).toHaveLength(1);
    expect(model.links).toEqual([]);
    expect(screen.getByTestId('preset').textContent).toBe('none');
    expect(screen.getByText(`"${model.components[0].label}" has no connection to another part.`)).toBeTruthy();
    expect(screen.queryByRole('form', { name: 'Add a connection' })).toBeNull();
  });

  it('builds a device from blank through the two tables', () => {
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: /^Start blank/ }));
    const partForm = screen.getByRole('form', { name: 'Add a part' });
    fireEvent.change(within(partForm).getByLabelText('Label of the new part'), { target: { value: 'Wearable relay' } });
    fireEvent.change(within(partForm).getByLabelText('Kind'), { target: { value: 'wearable_processor' } });
    fireEvent.change(within(partForm).getByLabelText('Zone'), { target: { value: 'on_body' } });
    fireEvent.click(within(partForm).getByRole('button', { name: 'Add part' }));

    const [tissuePart, relay] = currentModel().components;
    const connectionForm = screen.getByRole('form', { name: 'Add a connection' });
    fireEvent.change(within(connectionForm).getByLabelText('From'), { target: { value: relay.id } });
    fireEvent.change(within(connectionForm).getByLabelText('To'), { target: { value: tissuePart.id } });
    fireEvent.change(within(connectionForm).getByLabelText('Medium'), { target: { value: 'nfc' } });
    fireEvent.click(within(connectionForm).getByRole('button', { name: 'Add connection' }));

    const built = currentModel();
    expect(built.links).toEqual([{
      id: built.links[0].id, fromComponentId: relay.id, toComponentId: tissuePart.id, medium: 'nfc',
      carriesNeuralData: false, carriesStimulationCommands: false, carriesSoftwareUpdates: false,
    }]);
    expect(parseDeviceModelText(JSON.stringify(built), regionIds)).toEqual(built);
    expect(screen.getByRole('heading', { name: 'Warnings (0)' })).toBeTruthy();
  });

  it('renders a device name made of markup as text', () => {
    renderEditor();
    commitName(HOSTILE_NAME);
    expect(currentModel().name).toBe(HOSTILE_NAME);
    expect(document.querySelector('script')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Decide a risk' }));
    fireEvent.click(screen.getByRole('button', { name: /^Start blank/ }));
    expect(screen.getByRole('alertdialog').getAttribute('aria-label')).toBe(`Replace ${HOSTILE_NAME} with a blank device?`);
    expect(document.querySelector('script')).toBeNull();
  });
});
