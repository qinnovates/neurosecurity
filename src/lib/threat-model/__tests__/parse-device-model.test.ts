import { describe, it, expect } from 'vitest';
import { MODEL_LIMITS, MODEL_SCHEMA_VERSION, type DeviceModel } from '../device-model';
import { DeviceModelFormatError } from '../errors';
import { parseDeviceModelText } from '../parse-device-model';

const KNOWN_REGION_IDS = new Set(['m1', 'stn']);

function buildModel(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const model: DeviceModel = {
    schemaVersion: MODEL_SCHEMA_VERSION,
    registrarVersion: '4.0',
    name: 'Test implant',
    deviceCategory: 'bci',
    invasiveness: 'cortical',
    direction: 'read',
    targetRegionIds: ['m1'],
    presentsStimuli: true,
    components: [
      { id: 'implant', kind: 'implant', label: 'Implant', trustZone: 'in_body', isSharedAcrossPatients: false, isNeuralInterface: true },
      { id: 'app', kind: 'patient_app', label: 'App', trustZone: 'patient_controlled', isSharedAcrossPatients: false, isNeuralInterface: false },
    ],
    links: [
      { id: 'implant-app', fromComponentId: 'implant', toComponentId: 'app', medium: 'bluetooth_le', carriesNeuralData: true, carriesStimulationCommands: false, carriesSoftwareUpdates: false },
    ],
    submissionType: '510k',
    patientState: null,
    riskDecisions: [{ riskId: 'implant::QIF-T0001', status: 'open', note: '' }],
    controlsInPlace: [],
  };
  return { ...model, ...overrides };
}

function parse(model: unknown): DeviceModel {
  return parseDeviceModelText(JSON.stringify(model), KNOWN_REGION_IDS);
}

describe('parseDeviceModelText', () => {
  it('accepts a well-formed model and returns it unchanged', () => {
    const model = buildModel();
    expect(parse(model)).toEqual(model);
  });

  it('rejects text that is not JSON without echoing it', () => {
    const hostileText = '<script>alert(1)</script>';
    expect(() => parseDeviceModelText(hostileText, KNOWN_REGION_IDS)).toThrow(DeviceModelFormatError);
    expect(() => parseDeviceModelText(hostileText, KNOWN_REGION_IDS)).not.toThrow(/script/);
  });

  it('rejects an oversized file before parsing it', () => {
    const oversized = `{"name":"${'a'.repeat(MODEL_LIMITS.maxFileBytes)}"}`;
    expect(() => parseDeviceModelText(oversized, KNOWN_REGION_IDS)).toThrow(/larger than/);
  });

  it('rejects an unknown schema version', () => {
    expect(() => parse(buildModel({ schemaVersion: 2 }))).toThrow(/schema version 2/);
  });

  it('rejects unknown top-level fields, including prototype keys', () => {
    expect(() => parse(buildModel({ extra: true }))).toThrow(/does not recognise/);
    const polluted = `{"__proto__":{"isAdmin":true},${JSON.stringify(buildModel()).slice(1)}`;
    expect(() => parseDeviceModelText(polluted, KNOWN_REGION_IDS)).toThrow(/does not recognise/);
    expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
  });

  it('rejects unknown fields inside a component', () => {
    const text = JSON.stringify(buildModel()).replace('"id":"implant",', '"id":"implant","constructor":"x",');
    expect(() => parseDeviceModelText(text, KNOWN_REGION_IDS)).toThrow(/unexpected field/);
  });

  it('rejects a region that is not in the atlas without echoing it', () => {
    const hostileRegion = '<img src=x onerror=alert(1)>';
    expect(() => parse(buildModel({ targetRegionIds: [hostileRegion] }))).toThrow(/not in the atlas/);
    expect(() => parse(buildModel({ targetRegionIds: [hostileRegion] }))).not.toThrow(/onerror/);
  });

  it('rejects labels and notes over the length limits', () => {
    expect(() => parse(buildModel({ name: 'n'.repeat(MODEL_LIMITS.maxLabelLength + 1) }))).toThrow(/name must be/);
    const longNote = { riskId: 'implant::QIF-T0001', status: 'open', note: 'n'.repeat(MODEL_LIMITS.maxNoteLength + 1) };
    expect(() => parse(buildModel({ riskDecisions: [longNote] }))).toThrow(/note must be/);
  });

  it('rejects more components than the limit', () => {
    const components = Array.from({ length: MODEL_LIMITS.maxComponents + 1 }, (_, index) => ({
      id: `component-${index}`, kind: 'patient_app', label: 'App', trustZone: 'patient_controlled',
      isSharedAcrossPatients: false, isNeuralInterface: index === 0,
    }));
    expect(() => parse(buildModel({ components, links: [] }))).toThrow(/at most/);
  });

  it('rejects a model with two neural interfaces, a dangling link, or a duplicate id', () => {
    const twoInterfaces = buildModel();
    (twoInterfaces.components as Record<string, unknown>[])[1].isNeuralInterface = true;
    expect(() => parse(twoInterfaces)).toThrow(/exactly one/);

    const danglingLink = buildModel();
    (danglingLink.links as Record<string, unknown>[])[0].toComponentId = 'ghost';
    expect(() => parse(danglingLink)).toThrow(/does not name a component/);

    const duplicateId = buildModel();
    (duplicateId.links as Record<string, unknown>[])[0].id = 'app';
    expect(() => parse(duplicateId)).toThrow(/more than once/);
  });

  it('rejects a malformed patient state and an unknown risk status', () => {
    expect(() => parse(buildModel({ patientState: 'California' }))).toThrow(/two-letter/);
    const badStatus = { riskId: 'implant::QIF-T0001', status: 'ignored', note: '' };
    expect(() => parse(buildModel({ riskDecisions: [badStatus] }))).toThrow(/status/);
  });
});
