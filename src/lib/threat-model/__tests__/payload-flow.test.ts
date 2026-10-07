import { describe, it, expect } from 'vitest';
import type { DeviceModel } from '../device-model';
import { buildModelFromIntake, defaultAnswersFor } from '../intake-to-model';
import { derivePayloadFlows } from '../payload-flow';
import { loadEngineBundle, loadReferenceData } from './load-test-data';

const bundle = loadEngineBundle();
const referenceData = loadReferenceData(bundle);

function modelFor(archetypeId: string): DeviceModel {
  const archetype = referenceData.archetypes.find((candidate) => candidate.id === archetypeId);
  if (archetype === undefined) throw new Error(`test setup: unknown archetype ${archetypeId}`);
  return buildModelFromIntake(defaultAnswersFor(archetype), archetype, bundle.engineData.registrarVersion);
}

describe('derivePayloadFlows', () => {
  it('sends neural data away from the neural interface and updates toward it, on every class', () => {
    for (const archetype of referenceData.archetypes) {
      const model = modelFor(archetype.id);
      const interfaceId = model.components.find((component) => component.isNeuralInterface)?.id;
      const flows = derivePayloadFlows(model);
      for (const link of model.links) {
        const touchesInterface = link.fromComponentId === interfaceId || link.toComponentId === interfaceId;
        if (!touchesInterface) continue;
        const leavesInterface = link.fromComponentId === interfaceId;
        for (const flow of flows.get(link.id) ?? []) {
          expect(flow.sense).toBe(flow.payload === 'neuralData' ? 'away' : 'toward');
          expect(flow.isFromTo).toBe(flow.payload === 'neuralData' ? leavesInterface : !leavesInterface);
        }
      }
    }
  });

  it('lists only links that carry something, and one flow per payload carried', () => {
    for (const archetype of referenceData.archetypes) {
      const model = modelFor(archetype.id);
      const flows = derivePayloadFlows(model);
      for (const link of model.links) {
        const carriedCount = [link.carriesNeuralData, link.carriesStimulationCommands, link.carriesSoftwareUpdates].filter(Boolean).length;
        expect(flows.get(link.id)?.length ?? 0).toBe(carriedCount);
      }
    }
  });

  it('gives no direction when the rule cannot decide', () => {
    const base = modelFor(referenceData.archetypes[0].id);
    const [first, second] = base.components.filter((component) => !component.isNeuralInterface);
    const island: DeviceModel = {
      ...base,
      links: [{ id: 'island', fromComponentId: first.id, toComponentId: second.id, medium: 'internet', carriesNeuralData: true, carriesStimulationCommands: false, carriesSoftwareUpdates: false }],
    };
    expect(derivePayloadFlows(island).get('island')).toEqual([{ payload: 'neuralData', sense: null, isFromTo: null }]);
  });
});
