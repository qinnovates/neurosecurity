/** Test-only: a made-up device with eight parts, two zones holding two parts, and connections of every routing kind. */

import { MODEL_SCHEMA_VERSION, type DeviceModel, type ModelComponent, type ModelLink } from '@/lib/threat-model/device-model';

function part(id: string, label: string, kind: ModelComponent['kind'], trustZone: ModelComponent['trustZone'], isNeuralInterface = false): ModelComponent {
  return { id, label, kind, trustZone, isSharedAcrossPatients: trustZone === 'cloud', isNeuralInterface };
}

function link(fromComponentId: string, toComponentId: string, medium: ModelLink['medium'], carried: Partial<Pick<ModelLink, 'carriesNeuralData' | 'carriesStimulationCommands' | 'carriesSoftwareUpdates'>> = {}): ModelLink {
  return {
    id: `${fromComponentId}-${toComponentId}-${medium}`, fromComponentId, toComponentId, medium,
    carriesNeuralData: false, carriesStimulationCommands: false, carriesSoftwareUpdates: false, ...carried,
  };
}

export const EIGHT_PART_MODEL: DeviceModel = {
  schemaVersion: MODEL_SCHEMA_VERSION,
  registrarVersion: 'test',
  name: 'Eight-part test device',
  deviceCategory: 'bci',
  invasiveness: 'cortical',
  direction: 'bidirectional',
  targetRegionIds: [],
  presentsStimuli: false,
  components: [
    part('implant', 'Implanted pulse generator with a deliberately long name', 'implant', 'in_body', true),
    part('processor', 'Wearable processor', 'wearable_processor', 'on_body'),
    part('charger', 'Charger', 'charger', 'on_body'),
    part('app', 'Patient app', 'patient_app', 'patient_controlled'),
    part('remote', 'Patient remote', 'patient_app', 'patient_controlled'),
    part('programmer', 'Clinician programmer', 'clinician_programmer', 'clinic'),
    part('cloud', 'Manufacturer cloud', 'cloud_service', 'cloud'),
    part('portal', 'Clinic portal', 'cloud_service', 'cloud'),
  ],
  links: [
    link('implant', 'processor', 'inductive', { carriesNeuralData: true, carriesStimulationCommands: true, carriesSoftwareUpdates: true }),
    link('processor', 'charger', 'usb'),
    link('processor', 'app', 'bluetooth_le', { carriesNeuralData: true }),
    link('charger', 'remote', 'nfc'),
    link('implant', 'programmer', 'proprietary_rf', { carriesStimulationCommands: true, carriesSoftwareUpdates: true }),
    link('app', 'cloud', 'internet', { carriesNeuralData: true, carriesSoftwareUpdates: true }),
    link('programmer', 'portal', 'internet', { carriesSoftwareUpdates: true }),
    link('remote', 'implant', 'bluetooth_le', { carriesStimulationCommands: true }),
    link('portal', 'implant', 'cellular'),
    link('cloud', 'portal', 'internet'),
    link('processor', 'app', 'wifi', { carriesSoftwareUpdates: true }),
  ],
  submissionType: 'none',
  patientState: null,
  riskDecisions: [],
  controlsInPlace: [],
};
