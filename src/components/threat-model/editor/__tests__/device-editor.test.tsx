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
import DeviceEditor, { EDITOR_SECTIONS } from '../DeviceEditor';
import { filterRegions } from '../DeviceFactsForm';

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

/** Brings one section of the editor to the front, as the reader does from the control at its top. */
function openSection(name: 'Device' | 'Parts' | 'Connections' | 'Warnings'): void {
  fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Editor section' })).getByRole('radio', { name: new RegExp(`^${name}`) }));
}

function commitName(name: string): void {
  openSection('Device');
  const field = screen.getByLabelText('Name');
  fireEvent.change(field, { target: { value: name } });
  fireEvent.blur(field);
}

beforeEach(() => { installMemoryLocalStorage(); });
afterEach(cleanup);

describe('DeviceEditor', () => {
  it('opens on the device in focus with "None yet" as the planned submission', () => {
    renderEditor();
    openSection('Device');
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
    openSection('Parts');
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
    openSection('Device');
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
    openSection('Warnings');
    expect(screen.getByRole('heading', { name: 'Warnings (0)' })).toBeTruthy();
    // With nothing to warn about the section's own name carries no count.
    expect(screen.getByRole('radio', { name: 'Warnings' })).toBeTruthy();
    openSection('Device');
    fireEvent.change(screen.getByLabelText('Records or stimulates'), { target: { value: 'read' } });
    const model = currentModel();
    expect(model.direction).toBe('read');
    const warnings = findModelWarnings(model, engineData.regions);
    expect(warnings.length).toBeGreaterThan(0);
    // The count is on the section's name, so a warning is seen from any section.
    expect(screen.getByRole('radio', { name: `Warnings (${warnings.length})` })).toBeTruthy();
    openSection('Warnings');
    expect(screen.getByRole('heading', { name: `Warnings (${warnings.length})` })).toBeTruthy();
    for (const warning of warnings) expect(screen.getByText(warning.message)).toBeTruthy();
  });

  it('keeps one target region ticked and says why', () => {
    renderEditor();
    openSection('Device');
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
    openSection('Device');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(stimulatorClass.label) }));
    expect(screen.getByTestId('preset').textContent).toBe(stimulatorClass.id);
    // After a start the parts are in front again: they are the next thing to do.
    expect(screen.getByRole('radio', { name: 'Parts' }).getAttribute('aria-checked')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Decide a risk' }));
    openSection('Device');
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
    openSection('Device');
    fireEvent.click(screen.getByRole('button', { name: /^Start blank/ }));
    const model = currentModel();
    expect(model.name).toBe(BLANK_DEVICE_NAME);
    expect(model.components).toHaveLength(1);
    expect(model.links).toEqual([]);
    expect(screen.getByTestId('preset').textContent).toBe('none');
    openSection('Warnings');
    expect(screen.getByText(`"${model.components[0].label}" has no connection to another part.`)).toBeTruthy();
    openSection('Connections');
    expect(screen.queryByRole('form', { name: 'Add a connection' })).toBeNull();
    expect(screen.getByText('A connection runs between two parts. Add a second part to connect them.')).toBeTruthy();
  });

  it('builds a device from blank through the two tables', () => {
    renderEditor();
    openSection('Device');
    fireEvent.click(screen.getByRole('button', { name: /^Start blank/ }));
    const partForm = screen.getByRole('form', { name: 'Add a part' });
    fireEvent.change(within(partForm).getByLabelText('Label of the new part'), { target: { value: 'Wearable relay' } });
    fireEvent.change(within(partForm).getByLabelText('Kind'), { target: { value: 'wearable_processor' } });
    fireEvent.change(within(partForm).getByLabelText('Zone'), { target: { value: 'on_body' } });
    fireEvent.click(within(partForm).getByRole('button', { name: 'Add part' }));

    const [tissuePart, relay] = currentModel().components;
    openSection('Connections');
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
    openSection('Warnings');
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

describe('the editor\'s sections', () => {
  it('are one quiet control of four, with the parts in front and one section drawn at a time', () => {
    renderEditor();
    const options = within(screen.getByRole('radiogroup', { name: 'Editor section' })).getAllByRole('radio');
    expect(options.map((option) => option.textContent)).toEqual(['Device', 'Parts', 'Connections', 'Warnings']);
    expect(options).toHaveLength(EDITOR_SECTIONS.length);
    expect(options[1].getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('form', { name: 'Add a part' })).toBeTruthy();
    expect(screen.queryByLabelText('Name')).toBeNull();
    expect(screen.queryByRole('form', { name: 'Add a connection' })).toBeNull();
    openSection('Connections');
    expect(screen.queryByRole('form', { name: 'Add a part' })).toBeNull();
    expect(screen.getByRole('form', { name: 'Add a connection' })).toBeTruthy();
  });

  it('keeps what the last edit did, and a refused edit, in view under every section', () => {
    renderEditor();
    commitName('Our headset');
    fireEvent.click(screen.getByRole('button', { name: 'Send a bad edit' }));
    for (const section of ['Device', 'Parts', 'Connections', 'Warnings'] as const) {
      openSection(section);
      expect(screen.getByRole('status', { name: 'What the last change did' })).toBeTruthy();
      expect(screen.getByText('That change was not applied: the part to change is not in the model.')).toBeTruthy();
    }
  });
});

describe('target regions in the editor', () => {
  it('shows each ticked region as a chip that unticks it, and counts them from the model', () => {
    renderEditor();
    openSection('Device');
    const model = currentModel();
    const ticked = engineData.regions.filter((region) => model.targetRegionIds.includes(region.id));
    const chips = within(screen.getByRole('list', { name: 'Ticked regions' })).getAllByRole('button');
    expect(chips.map((chip) => chip.getAttribute('aria-label'))).toEqual(ticked.map((region) => `Untick ${region.name}`));
    expect(screen.getByText(`Target brain regions (${ticked.length} of ${engineData.regions.length} ticked)`)).toBeTruthy();
    expect(ticked.length).toBeGreaterThan(1);
    fireEvent.click(chips[0]);
    expect(currentModel().targetRegionIds).toEqual(model.targetRegionIds.filter((regionId) => regionId !== ticked[0].id));
    expect(within(screen.getByRole('list', { name: 'Ticked regions' })).getAllByRole('button')).toHaveLength(ticked.length - 1);
  });

  it('narrows the list of regions by what is typed, says how many are shown, and keeps the ticked chips', () => {
    renderEditor();
    openSection('Device');
    const all = engineData.regions;
    const wanted = all[0].name.slice(0, 4);
    const expected = filterRegions(all, wanted);
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.length).toBeLessThan(all.length);
    const chipsBefore = within(screen.getByRole('list', { name: 'Ticked regions' })).getAllByRole('button').length;
    fireEvent.change(screen.getByLabelText(`Filter regions (${all.length} of ${all.length} shown)`), { target: { value: wanted } });
    expect(screen.getByLabelText(`Filter regions (${expected.length} of ${all.length} shown)`)).toBeTruthy();
    const group = screen.getByRole('group', { name: /^Target brain regions/ });
    expect(within(group).getAllByRole('checkbox')).toHaveLength(expected.length);
    expect(within(screen.getByRole('list', { name: 'Ticked regions' })).getAllByRole('button')).toHaveLength(chipsBefore);
  });

  it('filters by name without regard to case, and returns every region when nothing is typed', () => {
    const regions = [{ name: 'Primary Motor Cortex' }, { name: 'Thalamus' }, { name: 'Motor thalamus' }];
    expect(filterRegions(regions, '  ')).toEqual(regions);
    expect(filterRegions(regions, 'MOTOR').map((region) => region.name)).toEqual(['Primary Motor Cortex', 'Motor thalamus']);
    expect(filterRegions(regions, 'zzz')).toEqual([]);
  });
});
