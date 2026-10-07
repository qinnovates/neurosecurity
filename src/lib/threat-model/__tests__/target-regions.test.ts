import { describe, it, expect } from 'vitest';
import { BRAIN_REGION_COORDS } from '@/components/atlas/brainmap/brain-regions';
import type { DeviceModel } from '../device-model';
import { buildModelFromIntake, defaultAnswersFor } from '../intake-to-model';
import { isNeuralInterfaceElement, listTargetRegions } from '../target-regions';
import { loadEngineBundle, loadReferenceData } from './load-test-data';

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);

function modelFor(archetypeId: string): DeviceModel {
  const archetype = referenceData.archetypes.find((candidate) => candidate.id === archetypeId);
  if (archetype === undefined) throw new Error(`test setup: unknown archetype ${archetypeId}`);
  return buildModelFromIntake(defaultAnswersFor(archetype), archetype, engineData.registrarVersion);
}

describe('listTargetRegions', () => {
  it('returns the regions the model targets, in the model\'s order', () => {
    const model = modelFor('noninvasive-eeg-headset');
    const summary = listTargetRegions(model, engineData.regions);
    expect(summary.regions.map((region) => region.id)).toEqual(model.targetRegionIds);
    expect(summary.unknownRegionIds).toEqual([]);
    expect(summary.regions.every((region) => region.name.length > 0 && region.bandId.length > 0)).toBe(true);
  });

  it('reports a region the atlas does not have and keeps the ones it does', () => {
    const model: DeviceModel = { ...modelFor('subcortical-stimulator'), targetRegionIds: ['stn', 'not-a-region'] };
    const summary = listTargetRegions(model, engineData.regions);
    expect(summary.regions.map((region) => region.id)).toEqual(['stn']);
    expect(summary.unknownRegionIds).toEqual(['not-a-region']);
  });

  it('lists a repeated region once', () => {
    const model: DeviceModel = { ...modelFor('cortical-read-implant'), targetRegionIds: ['m1', 'm1'] };
    expect(listTargetRegions(model, engineData.regions).regions).toHaveLength(1);
  });
});

describe('isNeuralInterfaceElement', () => {
  it('is true only for the component marked as the neural interface', () => {
    for (const archetype of referenceData.archetypes) {
      const model = modelFor(archetype.id);
      const interfaceIds = model.components.filter((component) => component.isNeuralInterface).map((component) => component.id);
      expect(interfaceIds.length, archetype.id).toBeGreaterThan(0);
      for (const component of model.components) {
        expect(isNeuralInterfaceElement(model, component.id), component.id).toBe(interfaceIds.includes(component.id));
      }
      for (const link of model.links) expect(isNeuralInterfaceElement(model, link.id), link.id).toBe(false);
      expect(isNeuralInterfaceElement(model, null)).toBe(false);
    }
  });
});

describe('the schematic region map', () => {
  it('has a position for every atlas region, so any target region can be drawn', () => {
    const withoutPosition = engineData.regions.filter((region) => !(region.id in BRAIN_REGION_COORDS)).map((region) => region.id);
    expect(withoutPosition).toEqual([]);
  });
});
