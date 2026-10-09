/**
 * The words the editor shows for the model's own codes. Each list covers exactly the values
 * in device-model.ts; the type makes a missing or extra value a compile error.
 */

import type {
  ComponentKind, InterfaceDirection, Invasiveness, LinkMedium, SubmissionType, TrustZone,
} from '@/lib/threat-model/device-model';

export const INVASIVENESS_LABELS: Readonly<Record<Invasiveness, string>> = {
  noninvasive: 'Non-invasive',
  cortical: 'Invasive, cortical',
  subcortical: 'Invasive, subcortical',
  spinal_peripheral: 'Invasive, spinal or peripheral',
};

export const DIRECTION_LABELS: Readonly<Record<InterfaceDirection, string>> = {
  read: 'Records only',
  write: 'Stimulates only',
  bidirectional: 'Records and stimulates',
};

export const SUBMISSION_LABELS: Readonly<Record<SubmissionType, string>> = {
  '510k': '510(k)',
  de_novo: 'De Novo',
  pma: 'PMA',
  hde: 'HDE',
  pdp: 'PDP',
  ide: 'IDE (clinical trial)',
  none: 'None yet',
};

export const KIND_LABELS: Readonly<Record<ComponentKind, string>> = {
  implant: 'Implant',
  headset: 'Headset',
  wearable_processor: 'Wearable processor',
  clinician_programmer: 'Clinician programmer',
  patient_app: 'Patient app',
  cloud_service: 'Cloud service',
  charger: 'Charger',
};

export const ZONE_LABELS: Readonly<Record<TrustZone, string>> = {
  in_body: 'In the body',
  on_body: 'On the body',
  patient_controlled: 'Patient-controlled',
  clinic: 'Clinic',
  cloud: 'Cloud',
};

export const MEDIUM_LABELS: Readonly<Record<LinkMedium, string>> = {
  wired_lead: 'Wired lead',
  inductive: 'Inductive',
  proprietary_rf: 'Proprietary RF',
  bluetooth_le: 'Bluetooth LE',
  nfc: 'NFC',
  usb: 'USB',
  wifi: 'Wi-Fi',
  cellular: 'Cellular',
  internet: 'Internet',
};

/** The model's three "carries" fields, in the order the table shows them. */
export const CARRIES_FIELDS = [
  { field: 'carriesNeuralData', label: 'Neural data' },
  { field: 'carriesStimulationCommands', label: 'Stimulation commands' },
  { field: 'carriesSoftwareUpdates', label: 'Software updates' },
] as const;

export type CarriesField = typeof CARRIES_FIELDS[number]['field'];
