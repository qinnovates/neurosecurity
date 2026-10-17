import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadRealModel } from '@/lib/atlas-explorer/__tests__/explorer-fixtures';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { loadAtlasChains } from '../explorer-companions';
import { OutOfStepError } from '../explorer-data';
import { buildServedFiles, serveFiles } from './explorer-test-server';

const signal = new AbortController().signal;
const realModel = loadRealModel();

beforeEach(() => { serveFiles(buildServedFiles()); });
afterEach(() => vi.unstubAllGlobals());

/** The same model with one technique taken out of both places a step's technique can be found. */
function modelWithout(techniqueId: string): ExplorerModel {
  const without = <Value>(held: ReadonlyMap<string, Value>): Map<string, Value> => new Map([...held].filter(([id]) => id !== techniqueId));
  return { ...realModel, techniquesById: without(realModel.techniquesById), deviceOnlyTechniquesById: without(realModel.deviceOnlyTechniquesById) };
}

describe('loadAtlasChains', () => {
  it('accepts the served threat models when every step names a technique this build holds', async () => {
    const chains = await loadAtlasChains(realModel, signal);
    expect(chains.chains).toHaveLength(7);
  });

  it('refuses the file in the browser when a step names a technique this build does not hold, and says which', async () => {
    const [{ steps }] = (await loadAtlasChains(realModel, signal)).chains;
    const unknownId = steps[0].technique_id;
    const refusal = loadAtlasChains(modelWithout(unknownId), signal);
    await expect(refusal).rejects.toBeInstanceOf(OutOfStepError);
    await expect(refusal).rejects.toThrow(unknownId);
  });
});
