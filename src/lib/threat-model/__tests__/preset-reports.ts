/** Test-only: the three device presets with the report each one builds, from the real data files. */

import { buildThreatModelReport } from '../build-report';
import type { EngineData } from '../catalog-types';
import type { DeviceModel } from '../device-model';
import { buildModelFromIntake, defaultAnswersFor, type IntakeAnswers } from '../intake-to-model';
import type { ReferenceData } from '../reference-data-types';
import { GOAL_BY_MODE } from '../lab-terms';
import type { ThreatGoal, ThreatModelReport } from '../report-types';
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

/**
 * Test-only: the reference data with every placement of one effect turned into a reviewed
 * exclusion. The effect keeps its decisions but none applies to any device, which is the state
 * "none on this device" describes. The real catalog no longer has such an effect on any preset.
 */
export function referenceWithEffectReviewedOutside(goal: ThreatGoal): ReferenceData {
  const modeById = new Map(engineData.techniques.map((technique) => [technique.id, technique.mode]));
  const placements = { ...referenceData.placementRules.placements };
  const notPlaced = { ...referenceData.placementRules.notPlaced };
  for (const techniqueId of Object.keys(placements)) {
    const mode = modeById.get(techniqueId);
    if (mode === undefined || mode === null || GOAL_BY_MODE[mode] !== goal) continue;
    delete placements[techniqueId];
    notPlaced[techniqueId] = { category: 'other_device_class', reason: 'Test fixture: reviewed and left outside the device.' };
  }
  return { ...referenceData, placementRules: { ...referenceData.placementRules, placements, notPlaced } };
}
