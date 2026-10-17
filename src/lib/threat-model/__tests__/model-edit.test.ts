import { describe, it, expect } from 'vitest';
import {
  COMPONENT_KINDS, LINK_MEDIA, MODEL_LIMITS, TRUST_ZONES,
  type ComponentKind, type DeviceModel, type InterfaceDirection, type LinkMedium, type RiskDecision,
} from '../device-model';
import {
  BLANK_DEVICE_NAME, CONNECTION_ID_PREFIX, PART_ID_PREFIX, applyModelEdit, nextElementId, startBlankModel,
  type ConnectionFields, type ModelEdit, type NewPartFields,
} from '../model-edit';
import { isElementId } from '../model-guards';
import { parseDeviceModelText } from '../parse-device-model';
import { PRESET_IDS, engineData, modelFor, reportFor } from './preset-reports';

const knownRegionIds = new Set(engineData.regions.map((region) => region.id));
const implantModel = (): DeviceModel => modelFor('cortical-read-implant');
const NEW_PART: NewPartFields = { label: 'Wearable relay', kind: 'wearable_processor', trustZone: 'on_body', isSharedAcrossPatients: false };

function accept(model: DeviceModel, edit: ModelEdit): DeviceModel {
  const result = applyModelEdit(model, edit);
  if (!result.isAccepted) throw new Error(`test setup: the edit was refused: ${result.problem}`);
  return result.model;
}

function problemOf(model: DeviceModel, edit: ModelEdit): string {
  const result = applyModelEdit(model, edit);
  if (result.isAccepted) throw new Error('test setup: the edit was expected to be refused');
  return result.problem;
}

function connectionBetween(fromComponentId: string, toComponentId: string, medium: LinkMedium = 'usb'): ConnectionFields {
  return { fromComponentId, toComponentId, medium, carriesNeuralData: false, carriesStimulationCommands: true, carriesSoftwareUpdates: true };
}

function idsOf(model: DeviceModel): string[] {
  return [...model.components.map((component) => component.id), ...model.links.map((link) => link.id)];
}

describe('parts', () => {
  it('adds a part with a generated id that the model guards accept, never as the tissue-contact part', () => {
    const model = accept(implantModel(), { type: 'part-added', part: NEW_PART });
    const added = model.components[model.components.length - 1];
    expect(added).toEqual({ ...NEW_PART, id: `${PART_ID_PREFIX}-1`, isNeuralInterface: false });
    expect(isElementId(added.id)).toBe(true);
    expect(model.components.filter((component) => component.isNeuralInterface)).toHaveLength(1);
  });

  it('keeps the id when a part is renamed or changed, so the rows on it keep their risk ids', () => {
    const before = implantModel();
    const target = before.components.find((component) => !component.isNeuralInterface)!;
    const riskIdsBefore = reportFor(before).riskRows.filter((row) => row.elementId === target.id).map((row) => row.riskId);
    const after = accept(before, { type: 'part-changed', partId: target.id, changes: { label: 'Relay wand', isSharedAcrossPatients: true } });
    expect(idsOf(after)).toEqual(idsOf(before));
    expect(after.components.find((component) => component.id === target.id)?.label).toBe('Relay wand');
    expect(riskIdsBefore.length).toBeGreaterThan(0);
    expect(reportFor(after).riskRows.filter((row) => row.elementId === target.id).map((row) => row.riskId)).toEqual(riskIdsBefore);
  });

  it('moves the tissue-contact mark when another part takes it, and refuses to leave the model without one', () => {
    const before = implantModel();
    const [tissuePart, otherPart] = [before.components.find((component) => component.isNeuralInterface)!, before.components.find((component) => !component.isNeuralInterface)!];
    const moved = accept(before, { type: 'part-changed', partId: otherPart.id, changes: { isNeuralInterface: true } });
    expect(moved.components.filter((component) => component.isNeuralInterface).map((component) => component.id)).toEqual([otherPart.id]);
    expect(problemOf(before, { type: 'part-changed', partId: tissuePart.id, changes: { isNeuralInterface: false } }))
      .toBe('exactly one component must be marked as the neural interface');
    expect(problemOf(before, { type: 'part-removed', partId: tissuePart.id })).toBe('exactly one component must be marked as the neural interface');
  });

  it('removes the connections of a removed part and leaves every decision in place', () => {
    const base = implantModel();
    const removed = base.components.find((component) => !component.isNeuralInterface && base.links.some((link) => link.fromComponentId === component.id || link.toComponentId === component.id))!;
    const decisions: RiskDecision[] = [{ riskId: `${removed.id}::QIF-T0001`, status: 'accepted', note: 'Reviewed.' }];
    const after = accept({ ...base, riskDecisions: decisions }, { type: 'part-removed', partId: removed.id });
    expect(after.components.some((component) => component.id === removed.id)).toBe(false);
    expect(after.links.some((link) => link.fromComponentId === removed.id || link.toComponentId === removed.id)).toBe(false);
    expect(after.links.length).toBeLessThan(base.links.length);
    expect(after.riskDecisions).toEqual(decisions);
  });

  it('refuses a label, kind or zone the file parser would refuse, in the guard\'s words', () => {
    const model = implantModel();
    const partId = model.components[0].id;
    const tooLong = 'x'.repeat(MODEL_LIMITS.maxLabelLength + 1);
    expect(problemOf(model, { type: 'part-changed', partId, changes: { label: '' } })).toContain(`label must be 1 to ${MODEL_LIMITS.maxLabelLength} characters`);
    expect(problemOf(model, { type: 'part-changed', partId, changes: { label: tooLong } })).toContain('label must be');
    expect(problemOf(model, { type: 'part-changed', partId, changes: { kind: 'router' as ComponentKind } })).toContain('kind is not a known component kind');
    expect(problemOf(model, { type: 'part-added', part: { ...NEW_PART, label: tooLong } })).toContain('label must be');
    expect(problemOf(model, { type: 'part-changed', partId: 'no-such-part', changes: { label: 'X' } })).toBe('the part to change is not in the model');
  });

  it('refuses a part beyond the limit the model file holds', () => {
    let model = implantModel();
    while (model.components.length < MODEL_LIMITS.maxComponents) model = accept(model, { type: 'part-added', part: NEW_PART });
    expect(problemOf(model, { type: 'part-added', part: NEW_PART })).toBe(`at most ${MODEL_LIMITS.maxComponents} components are supported`);
  });
});

describe('connections', () => {
  it('adds, changes and removes a connection, keeping its id through a change', () => {
    const base = implantModel();
    const [first, second] = base.components;
    const added = accept(base, { type: 'connection-added', connection: connectionBetween(first.id, second.id, 'nfc') });
    const connection = added.links[added.links.length - 1];
    expect(connection).toEqual({ ...connectionBetween(first.id, second.id, 'nfc'), id: `${CONNECTION_ID_PREFIX}-1` });
    const changed = accept(added, { type: 'connection-changed', connectionId: connection.id, changes: { medium: 'usb', carriesNeuralData: true } });
    expect(changed.links.find((link) => link.id === connection.id)).toMatchObject({ medium: 'usb', carriesNeuralData: true, carriesStimulationCommands: true });
    expect(accept(changed, { type: 'connection-removed', connectionId: connection.id }).links).toEqual(base.links);
  });

  it('refuses a connection to itself, to a part that is not there, or over a medium that does not exist', () => {
    const model = implantModel();
    const [first, second] = model.components;
    expect(problemOf(model, { type: 'connection-added', connection: connectionBetween(first.id, first.id) })).toContain('connects a component to itself');
    expect(problemOf(model, { type: 'connection-added', connection: connectionBetween(first.id, 'ghost') })).toContain('toComponentId does not name a component');
    expect(problemOf(model, { type: 'connection-added', connection: connectionBetween(first.id, second.id, 'zigbee' as LinkMedium) })).toContain('medium is not a known link type');
    expect(problemOf(model, { type: 'connection-removed', connectionId: 'ghost' })).toBe('the connection to change is not in the model');
  });

  it('refuses a connection beyond the limit the model file holds', () => {
    let model = implantModel();
    const [first, second] = model.components;
    while (model.links.length < MODEL_LIMITS.maxLinks) model = accept(model, { type: 'connection-added', connection: connectionBetween(first.id, second.id) });
    expect(problemOf(model, { type: 'connection-added', connection: connectionBetween(first.id, second.id) })).toBe(`at most ${MODEL_LIMITS.maxLinks} links are supported`);
  });
});

describe('device facts', () => {
  it('changes only the answers named, and leaves parts, connections and decisions alone', () => {
    const base: DeviceModel = { ...implantModel(), riskDecisions: [{ riskId: 'implant::QIF-T0001', status: 'mitigated', note: '' }] };
    const after = accept(base, { type: 'device-facts-changed', changes: { name: 'Our implant', presentsStimuli: false }, knownRegionIds });
    expect(after).toEqual({ ...base, name: 'Our implant', presentsStimuli: false });
  });

  it('does not rewrite connections when the direction changes', () => {
    const base = modelFor('subcortical-stimulator');
    const after = accept(base, { type: 'device-facts-changed', changes: { direction: 'read' }, knownRegionIds });
    expect(after.links).toEqual(base.links);
    expect(after.links.some((link) => link.carriesStimulationCommands)).toBe(true);
  });

  it('refuses what the file parser refuses: no name, no region, an unknown region, an unknown value', () => {
    const model = implantModel();
    const refuse = (changes: Extract<ModelEdit, { type: 'device-facts-changed' }>['changes']): string => problemOf(model, { type: 'device-facts-changed', changes, knownRegionIds });
    expect(refuse({ name: '' })).toBe(`name must be 1 to ${MODEL_LIMITS.maxLabelLength} characters`);
    expect(refuse({ name: 'x'.repeat(MODEL_LIMITS.maxLabelLength + 1) })).toBe(`name must be 1 to ${MODEL_LIMITS.maxLabelLength} characters`);
    expect(refuse({ targetRegionIds: [] })).toBe('targetRegionIds must list at least one region');
    expect(refuse({ targetRegionIds: ['<script>'] })).toBe('targetRegionIds names a region that is not in the atlas');
    expect(refuse({ targetRegionIds: [model.targetRegionIds[0], model.targetRegionIds[0]] })).toBe('targetRegionIds lists a region twice');
    expect(refuse({ direction: 'sideways' as InterfaceDirection })).toBe('direction is not recognised');
  });

  it('cannot reach the parts or the decisions through a field that is not a device fact', () => {
    const model = implantModel();
    const smuggled = { name: 'Renamed', components: [], riskDecisions: [{ riskId: 'x', status: 'accepted', note: '' }] } as Extract<ModelEdit, { type: 'device-facts-changed' }>['changes'];
    const after = accept(model, { type: 'device-facts-changed', changes: smuggled, knownRegionIds });
    expect(after).toEqual({ ...model, name: 'Renamed' });
  });
});

describe('element ids', () => {
  it('never reuses an id that a recorded decision still points at', () => {
    const base = implantModel();
    const withPart = accept(base, { type: 'part-added', part: NEW_PART });
    const addedId = withPart.components[withPart.components.length - 1].id;
    const decided: DeviceModel = { ...withPart, riskDecisions: [{ riskId: `${addedId}::QIF-T0001`, status: 'accepted', note: '' }] };
    const without = accept(decided, { type: 'part-removed', partId: addedId });
    expect(nextElementId(without, PART_ID_PREFIX)).not.toBe(addedId);
    const again = accept(without, { type: 'part-added', part: NEW_PART });
    expect(again.components[again.components.length - 1].id).not.toBe(addedId);
  });
});

describe('blank start', () => {
  it.each(PRESET_IDS)('from %s keeps the device facts and the tissue-contact part, and drops the rest', (presetId) => {
    const base: DeviceModel = { ...modelFor(presetId), submissionType: 'pma', riskDecisions: [{ riskId: 'implant::QIF-T0001', status: 'accepted', note: '' }] };
    const result = startBlankModel(base);
    if (!result.isAccepted) throw new Error(result.problem);
    const blank = result.model;
    expect(blank.name).toBe(BLANK_DEVICE_NAME);
    expect(blank.components).toEqual([base.components.find((component) => component.isNeuralInterface)]);
    expect(blank.links).toEqual([]);
    expect(blank.riskDecisions).toEqual([]);
    expect(blank.submissionType).toBe('none');
    expect({ invasiveness: blank.invasiveness, direction: blank.direction, targetRegionIds: blank.targetRegionIds })
      .toEqual({ invasiveness: base.invasiveness, direction: base.direction, targetRegionIds: base.targetRegionIds });
    expect(parseDeviceModelText(JSON.stringify(blank), knownRegionIds)).toEqual(blank);
  });

  it('builds up to a seven-part device with a wearable relay and an NFC connection, which the file parser accepts', () => {
    const start = startBlankModel(implantModel());
    if (!start.isAccepted) throw new Error(start.problem);
    let model = start.model;
    const kinds: ComponentKind[] = ['wearable_processor', 'charger', 'patient_app', 'clinician_programmer', 'cloud_service', 'headset'];
    for (const kind of kinds) model = accept(model, { type: 'part-added', part: { ...NEW_PART, label: kind, kind } });
    const relay = model.components.find((component) => component.kind === 'wearable_processor')!;
    model = accept(model, { type: 'connection-added', connection: connectionBetween(relay.id, model.components[0].id, 'nfc') });
    expect(model.components).toHaveLength(7);
    expect(parseDeviceModelText(JSON.stringify(model), knownRegionIds)).toEqual(model);
  });
});

/** A small seeded generator, so a failing sequence can be replayed from its seed. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

const HOSTILE_TEXTS = [
  '', ' ', '<img src=x onerror=alert(1)>', '"; DROP TABLE parts; --', '__proto__', 'x'.repeat(MODEL_LIMITS.maxLabelLength),
  'x'.repeat(MODEL_LIMITS.maxLabelLength + 1), 'Relay wand', '‮gnp.exe', 'part-1',
];
const REGION_IDS = engineData.regions.map((region) => region.id);

function pick<Item>(random: () => number, items: readonly Item[]): Item {
  return items[Math.floor(random() * items.length)];
}

/** A value from the list most of the time, and now and then one the model does not allow. */
function pickOrInvalid<Item extends string>(random: () => number, items: readonly Item[]): Item {
  return random() < 0.1 ? ('not-a-value' as Item) : pick(random, items);
}

function randomEdit(random: () => number, model: DeviceModel): ModelEdit {
  const partIds = [...model.components.map((component) => component.id), 'ghost'];
  const connectionIds = [...model.links.map((link) => link.id), 'ghost'];
  const connection = (): ConnectionFields => ({
    fromComponentId: pick(random, partIds), toComponentId: pick(random, partIds), medium: pickOrInvalid(random, LINK_MEDIA),
    carriesNeuralData: random() < 0.5, carriesStimulationCommands: random() < 0.5, carriesSoftwareUpdates: random() < 0.5,
  });
  const part = (): NewPartFields => ({
    label: pick(random, HOSTILE_TEXTS), kind: pickOrInvalid(random, COMPONENT_KINDS), trustZone: pickOrInvalid(random, TRUST_ZONES), isSharedAcrossPatients: random() < 0.5,
  });
  const makers: readonly (() => ModelEdit)[] = [
    () => ({ type: 'part-added', part: part() }),
    () => ({ type: 'part-changed', partId: pick(random, partIds), changes: { ...part(), isNeuralInterface: random() < 0.5 } }),
    () => ({ type: 'part-changed', partId: pick(random, partIds), changes: { label: pick(random, HOSTILE_TEXTS) } }),
    () => ({ type: 'part-removed', partId: pick(random, partIds) }),
    () => ({ type: 'connection-added', connection: connection() }),
    () => ({ type: 'connection-changed', connectionId: pick(random, connectionIds), changes: connection() }),
    () => ({ type: 'connection-removed', connectionId: pick(random, connectionIds) }),
    () => ({
      type: 'device-facts-changed', knownRegionIds,
      changes: {
        name: pick(random, HOSTILE_TEXTS), direction: pickOrInvalid(random, ['read', 'write', 'bidirectional'] as const), presentsStimuli: random() < 0.5,
        targetRegionIds: REGION_IDS.filter(() => random() < 0.1).concat(random() < 0.05 ? ['ghost-region'] : []),
      },
    }),
  ];
  return pick(random, makers)();
}

describe('any sequence of edits', () => {
  const SEED_COUNT = 60;
  const EDITS_PER_SEED = 80;

  it('always leaves a model the file parser accepts, with every decision and every surviving id unchanged', () => {
    let acceptedCount = 0;
    let refusedCount = 0;
    for (let seed = 1; seed <= SEED_COUNT; seed += 1) {
      const random = createRandom(seed);
      const base = modelFor(PRESET_IDS[seed % PRESET_IDS.length]);
      const decisions: RiskDecision[] = idsOf(base).map((elementId) => ({ riskId: `${elementId}::QIF-T0001`, status: 'accepted', note: 'Kept.' }));
      let model: DeviceModel = { ...base, riskDecisions: decisions };

      for (let step = 0; step < EDITS_PER_SEED; step += 1) {
        const edit = randomEdit(random, model);
        const result = applyModelEdit(model, edit);
        const where = `seed ${seed}, step ${step}, ${edit.type}`;
        if (!result.isAccepted) {
          refusedCount += 1;
          expect(result.problem.length, where).toBeGreaterThan(0);
          continue;
        }
        acceptedCount += 1;
        const text = JSON.stringify(result.model);
        expect(() => parseDeviceModelText(text, knownRegionIds), where).not.toThrow();
        expect(result.model.riskDecisions, where).toEqual(decisions);
        const idsBefore = new Set(idsOf(model));
        const newIds = idsOf(result.model).filter((elementId) => !idsBefore.has(elementId));
        expect(newIds.length, where).toBeLessThanOrEqual(1);
        // A new id is never one a decision points at, so a decision cannot attach to a part it was not made on.
        expect(newIds.some((elementId) => decisions.some((decision) => decision.riskId.startsWith(`${elementId}::`))), where).toBe(false);
        if (edit.type === 'part-changed' || edit.type === 'connection-changed' || edit.type === 'device-facts-changed') {
          expect(idsOf(result.model), where).toEqual(idsOf(model));
        }
        model = result.model;
      }
    }
    // The generator must exercise both outcomes, or the property proves nothing.
    expect(acceptedCount).toBeGreaterThan(SEED_COUNT);
    expect(refusedCount).toBeGreaterThan(SEED_COUNT);
  });
});
