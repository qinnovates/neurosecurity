// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi, type Mock } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { MODEL_LIMITS, type DeviceModel, type RiskDecision } from '@/lib/threat-model/device-model';
import { applyModelEdit, type ModelEdit } from '@/lib/threat-model/model-edit';
import { describeLink } from '@/lib/threat-model/stride';
import { modelFor } from '@/lib/threat-model/__tests__/preset-reports';
import ConnectionsTable from '../ConnectionsTable';
import PartsTable from '../PartsTable';
import { describeRemovalImpact, measureConnectionRemoval, measurePartRemoval } from '../removal-impact';

type OnEdit = Mock<(edit: ModelEdit) => void>;

const implantModel = (): DeviceModel => modelFor('cortical-read-implant');
const HOSTILE_LABEL = '<img src=x onerror=alert(1)>';

function grow(model: DeviceModel, edit: ModelEdit): DeviceModel {
  const result = applyModelEdit(model, edit);
  if (!result.isAccepted) throw new Error(`test setup: ${result.problem}`);
  return result.model;
}

function renderParts(model: DeviceModel): OnEdit {
  const onEdit: OnEdit = vi.fn<(edit: ModelEdit) => void>();
  render(<PartsTable model={model} onEdit={onEdit} />);
  return onEdit;
}

function renderConnections(model: DeviceModel): OnEdit {
  const onEdit: OnEdit = vi.fn<(edit: ModelEdit) => void>();
  render(<ConnectionsTable model={model} onEdit={onEdit} />);
  return onEdit;
}

afterEach(cleanup);

describe('PartsTable', () => {
  it('shows one labelled line per part and how many the file can hold', () => {
    const model = implantModel();
    renderParts(model);
    expect(screen.getByText(`${model.components.length} of at most ${MODEL_LIMITS.maxComponents} parts`)).toBeTruthy();
    for (const part of model.components) {
      expect((screen.getByLabelText(`Label of ${part.label}`) as HTMLInputElement).value).toBe(part.label);
      expect((screen.getByLabelText(`Kind of ${part.label}`) as HTMLSelectElement).value).toBe(part.kind);
      expect((screen.getByLabelText(`Zone of ${part.label}`) as HTMLSelectElement).value).toBe(part.trustZone);
    }
  });

  it('renames a part when the field is left or Enter is pressed, by id, with text capped at the file limit', () => {
    const model = implantModel();
    const part = model.components[1];
    const onEdit = renderParts(model);
    const field = screen.getByLabelText(`Label of ${part.label}`) as HTMLInputElement;
    expect(field.maxLength).toBe(MODEL_LIMITS.maxLabelLength);
    fireEvent.change(field, { target: { value: 'Relay wand' } });
    expect(onEdit).not.toHaveBeenCalled();
    fireEvent.blur(field);
    expect(onEdit).toHaveBeenCalledWith({ type: 'part-changed', partId: part.id, changes: { label: 'Relay wand' } });

    fireEvent.change(field, { target: { value: 'y'.repeat(MODEL_LIMITS.maxLabelLength + 20) } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onEdit).toHaveBeenLastCalledWith({ type: 'part-changed', partId: part.id, changes: { label: 'y'.repeat(MODEL_LIMITS.maxLabelLength) } });
  });

  it('never commits an empty label, and says the saved text was kept', () => {
    const model = implantModel();
    const part = model.components[1];
    const onEdit = renderParts(model);
    const field = screen.getByLabelText(`Label of ${part.label}`) as HTMLInputElement;
    fireEvent.change(field, { target: { value: '   ' } });
    fireEvent.blur(field);
    expect(onEdit).not.toHaveBeenCalled();
    expect(field.value).toBe(part.label);
    expect(screen.getByRole('alert').textContent).toContain(`Needs 1 to ${MODEL_LIMITS.maxLabelLength} characters`);
  });

  it('changes kind, zone, sharing and the tissue-contact mark from the keyboard-reachable controls in the row', () => {
    const model = implantModel();
    const part = model.components.find((candidate) => !candidate.isNeuralInterface)!;
    const onEdit = renderParts(model);
    fireEvent.change(screen.getByLabelText(`Kind of ${part.label}`), { target: { value: 'wearable_processor' } });
    fireEvent.change(screen.getByLabelText(`Zone of ${part.label}`), { target: { value: 'on_body' } });
    fireEvent.click(screen.getByLabelText(`${part.label} is shared across patients`));
    fireEvent.click(screen.getByLabelText(`${part.label} contacts tissue or the scalp`));
    expect(onEdit.mock.calls.map(([edit]) => edit)).toEqual([
      { type: 'part-changed', partId: part.id, changes: { kind: 'wearable_processor' } },
      { type: 'part-changed', partId: part.id, changes: { trustZone: 'on_body' } },
      { type: 'part-changed', partId: part.id, changes: { isSharedAcrossPatients: !part.isSharedAcrossPatients } },
      { type: 'part-changed', partId: part.id, changes: { isNeuralInterface: true } },
    ]);
    const marks = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(marks.filter((mark) => mark.checked)).toHaveLength(1);
  });

  it('asks before removing a part, with the counts of what goes and what stays', () => {
    const base = implantModel();
    const part = base.components.find((candidate) => !candidate.isNeuralInterface && base.links.some((link) => link.fromComponentId === candidate.id))
      ?? base.components.find((candidate) => !candidate.isNeuralInterface)!;
    const decisions: RiskDecision[] = [{ riskId: `${part.id}::QIF-T0001`, status: 'accepted', note: '' }, { riskId: `${part.id}::QIF-T0002`, status: 'mitigated', note: '' }];
    const model = { ...base, riskDecisions: decisions };
    const impact = measurePartRemoval(model, part.id);
    expect(impact.decisionCount).toBe(decisions.length);
    const onEdit = renderParts(model);

    fireEvent.click(screen.getByRole('button', { name: `Remove ${part.label}` }));
    expect(onEdit).not.toHaveBeenCalled();
    const confirm = screen.getByRole('alertdialog', { name: `Remove ${part.label}?` });
    expect(confirm.textContent).toContain(describeRemovalImpact(impact));
    expect(document.activeElement).toBe(within(confirm).getByRole('button', { name: `Keep ${part.label}` }));

    fireEvent.click(within(confirm).getByRole('button', { name: `Keep ${part.label}` }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: `Remove ${part.label}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove it' }));
    expect(onEdit).toHaveBeenCalledWith({ type: 'part-removed', partId: part.id });
  });

  it('does not offer to remove the tissue-contact part, and says why', () => {
    const model = implantModel();
    const tissuePart = model.components.find((candidate) => candidate.isNeuralInterface)!;
    const onEdit = renderParts(model);
    fireEvent.click(screen.getByRole('button', { name: `Remove ${tissuePart.label}` }));
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('cannot be removed');
  });

  it('adds a part only when a label, a kind and a zone are given, and names what is missing', () => {
    const onEdit = renderParts(implantModel());
    const form = screen.getByRole('form', { name: 'Add a part' });
    fireEvent.click(within(form).getByRole('button', { name: 'Add part' }));
    expect(onEdit).not.toHaveBeenCalled();
    expect(within(form).getByRole('alert').textContent).toBe('A new part needs a label, a kind, a zone.');

    fireEvent.change(within(form).getByLabelText('Label of the new part'), { target: { value: '  Wearable relay  ' } });
    fireEvent.change(within(form).getByLabelText('Kind'), { target: { value: 'wearable_processor' } });
    fireEvent.change(within(form).getByLabelText('Zone'), { target: { value: 'on_body' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Add part' }));
    expect(onEdit).toHaveBeenCalledWith({ type: 'part-added', part: { label: 'Wearable relay', kind: 'wearable_processor', trustZone: 'on_body', isSharedAcrossPatients: false } });
    expect((within(form).getByLabelText('Label of the new part') as HTMLInputElement).value).toBe('');
  });

  it('replaces the add row with the limit, in words, when the file can hold no more parts', () => {
    let model = implantModel();
    while (model.components.length < MODEL_LIMITS.maxComponents) {
      model = grow(model, { type: 'part-added', part: { label: 'Spare', kind: 'charger', trustZone: 'on_body', isSharedAcrossPatients: false } });
    }
    renderParts(model);
    expect(screen.queryByRole('form', { name: 'Add a part' })).toBeNull();
    expect(screen.getByText(`The model file holds at most ${MODEL_LIMITS.maxComponents} parts. Remove one to add another.`)).toBeTruthy();
  });

  it('shows a label made of markup as text, and builds no element from it', () => {
    const base = implantModel();
    const model = grow(base, { type: 'part-changed', partId: base.components[1].id, changes: { label: HOSTILE_LABEL } });
    const { container } = render(<PartsTable model={model} onEdit={vi.fn()} />);
    expect((screen.getByLabelText(`Label of ${HOSTILE_LABEL}`) as HTMLInputElement).value).toBe(HOSTILE_LABEL);
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('ConnectionsTable', () => {
  it('shows one labelled line per connection, and never offers a part as both of its ends', () => {
    const model = implantModel();
    renderConnections(model);
    expect(screen.getByText(`${model.links.length} of at most ${MODEL_LIMITS.maxLinks} connections`)).toBeTruthy();
    for (const connection of model.links) {
      const name = describeLink(model, connection.id);
      const from = screen.getByLabelText(`From, ${name}`) as HTMLSelectElement;
      expect(from.value).toBe(connection.fromComponentId);
      expect([...from.options].map((option) => option.value)).not.toContain(connection.toComponentId);
      expect((screen.getByLabelText(`Medium, ${name}`) as HTMLSelectElement).value).toBe(connection.medium);
      expect((screen.getByLabelText(`${name} carries stimulation commands`) as HTMLInputElement).checked).toBe(connection.carriesStimulationCommands);
    }
  });

  it('changes an end, the medium and what the connection carries, by id', () => {
    const model = implantModel();
    const connection = model.links[0];
    const name = describeLink(model, connection.id);
    const spare = model.components.find((part) => part.id !== connection.fromComponentId && part.id !== connection.toComponentId)!;
    const onEdit = renderConnections(model);
    fireEvent.change(screen.getByLabelText(`To, ${name}`), { target: { value: spare.id } });
    fireEvent.change(screen.getByLabelText(`Medium, ${name}`), { target: { value: 'nfc' } });
    fireEvent.click(screen.getByLabelText(`${name} carries software updates`));
    expect(onEdit.mock.calls.map(([edit]) => edit)).toEqual([
      { type: 'connection-changed', connectionId: connection.id, changes: { toComponentId: spare.id } },
      { type: 'connection-changed', connectionId: connection.id, changes: { medium: 'nfc' } },
      { type: 'connection-changed', connectionId: connection.id, changes: { carriesSoftwareUpdates: !connection.carriesSoftwareUpdates } },
    ]);
  });

  it('removes a connection at once when no decision is on it, and asks first when one is', () => {
    const base = implantModel();
    const [plain, decided] = base.links;
    const model = { ...base, riskDecisions: [{ riskId: `${decided.id}::QIF-T0001`, status: 'accepted' as const, note: '' }] };
    const onEdit = renderConnections(model);
    fireEvent.click(screen.getByRole('button', { name: `Remove ${describeLink(model, plain.id)}` }));
    expect(onEdit).toHaveBeenCalledWith({ type: 'connection-removed', connectionId: plain.id });

    fireEvent.click(screen.getByRole('button', { name: `Remove ${describeLink(model, decided.id)}` }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    const confirm = screen.getByRole('alertdialog');
    expect(confirm.textContent).toContain(describeRemovalImpact(measureConnectionRemoval(model, decided.id)));
    fireEvent.click(within(confirm).getByRole('button', { name: 'Remove it' }));
    expect(onEdit).toHaveBeenLastCalledWith({ type: 'connection-removed', connectionId: decided.id });
  });

  it('adds a connection only between two different parts over a chosen medium', () => {
    const model = implantModel();
    const [first, second] = model.components;
    const onEdit = renderConnections(model);
    const form = screen.getByRole('form', { name: 'Add a connection' });
    fireEvent.click(within(form).getByRole('button', { name: 'Add connection' }));
    expect(within(form).getByRole('alert').textContent).toBe('A new connection needs a part it runs from, a part it runs to, a medium.');

    fireEvent.change(within(form).getByLabelText('From'), { target: { value: first.id } });
    fireEvent.change(within(form).getByLabelText('To'), { target: { value: first.id } });
    fireEvent.change(within(form).getByLabelText('Medium'), { target: { value: 'nfc' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Add connection' }));
    expect(within(form).getByRole('alert').textContent).toBe('A connection runs between two different parts.');
    expect(onEdit).not.toHaveBeenCalled();

    fireEvent.change(within(form).getByLabelText('To'), { target: { value: second.id } });
    fireEvent.click(within(form).getByLabelText('Software updates'));
    fireEvent.click(within(form).getByRole('button', { name: 'Add connection' }));
    expect(onEdit).toHaveBeenCalledWith({
      type: 'connection-added',
      connection: { fromComponentId: first.id, toComponentId: second.id, medium: 'nfc', carriesNeuralData: false, carriesStimulationCommands: false, carriesSoftwareUpdates: true },
    });
  });

  it('says why there is no add row: one part only, or the file limit reached', () => {
    const base = implantModel();
    const single: DeviceModel = { ...base, components: base.components.filter((part) => part.isNeuralInterface), links: [] };
    renderConnections(single);
    expect(screen.getByText('A connection runs between two parts. Add a second part to connect them.')).toBeTruthy();
    expect(screen.getByText('No connections. A part with no connection is listed under Warnings.')).toBeTruthy();
    cleanup();

    let full = base;
    const [first, second] = base.components;
    while (full.links.length < MODEL_LIMITS.maxLinks) {
      full = grow(full, { type: 'connection-added', connection: { fromComponentId: first.id, toComponentId: second.id, medium: 'usb', carriesNeuralData: false, carriesStimulationCommands: false, carriesSoftwareUpdates: false } });
    }
    renderConnections(full);
    expect(screen.queryByRole('form', { name: 'Add a connection' })).toBeNull();
    expect(screen.getByText(`The model file holds at most ${MODEL_LIMITS.maxLinks} connections. Remove one to add another.`)).toBeTruthy();
  });
});
