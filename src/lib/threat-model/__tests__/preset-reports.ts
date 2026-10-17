/** Test-only: the three device presets with the report each one builds, from the real data files. */

import { buildThreatModelReport } from '../build-report';
import type { EngineData } from '../catalog-types';
import type { DeviceModel } from '../device-model';
import { buildModelFromIntake, defaultAnswersFor, type IntakeAnswers } from '../intake-to-model';
import type { ReferenceData } from '../reference-data-types';
import type { ThreatModelReport } from '../report-types';
import { loadEngineBundle, loadReferenceData } from './load-test-data';

const bundle = loadEngineBundle();
export const engineData: EngineData = bundle.engineData;
export const referenceData: ReferenceData = loadReferenceData(bundle);

export const PRESET_IDS = ['noninvasive-eeg-headset', 'cortical-read-implant', 'subcortical-stimulator'] as const;
export type PresetId = typeof PRESET_IDS[number];

export function modelFor(presetId: PresetId, overrides: Partial<IntakeAnswers> = {}): DeviceModel {
  const archetype = referenceData.archetypes.find((candidate) => candidate.id === presetId);
  if (archetype === undefined) throw new Error(`test setup: unknown preset ${presetId}`);
  return buildModelFromIntake({ ...defaultAnswersFor(archetype), ...overrides }, archetype, engineData.registrarVersion);
}

export function reportFor(model: DeviceModel): ThreatModelReport {
  return buildThreatModelReport({ model, engineData, referenceData, generatedAt: '' });
}

export interface Preset {
  model: DeviceModel;
  report: ThreatModelReport;
}

export const PRESETS: readonly (readonly [PresetId, Preset])[] = PRESET_IDS.map((presetId) => {
  const model = modelFor(presetId);
  return [presetId, { model, report: reportFor(model) }] as const;
});
