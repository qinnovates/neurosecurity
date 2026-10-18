/**
 * Which parts and connections each generated chain acts on, laid out for a lane view: one
 * column per element in model order, one lane per chain. A chain is a hypothesis; a lane
 * shows where its steps sit in the model and nothing more.
 */

import type { ChainGenerationResult, ChainRole, GeneratedChain } from './chain-types';
import type { DeviceModel } from './device-model';
import { listElementsInModelOrder, type ModelElement } from './model-order';

export interface ChainLaneStep {
  position: number;
  techniqueId: string;
  role: ChainRole;
  elementId: string;
}

export interface ChainLane {
  chainId: string;
  chainName: string;
  /** Steps in chain order. */
  steps: ChainLaneStep[];
  /** Ids of the elements the chain's steps act on, in model order. */
  elementIds: string[];
}

export interface ChainLanes {
  /** Every part and connection, in model order. */
  elements: ModelElement[];
  lanes: ChainLane[];
  /** Chain ids per element id; an element no chain acts on has an empty list. */
  chainIdsByElement: Record<string, string[]>;
  /** Chains the search built, of which `lanes` may be only the first few. */
  chainsFound: number;
  wasCapped: boolean;
}

function toLane(chain: GeneratedChain, elementOrder: readonly string[]): ChainLane {
  const steps = chain.steps.map((step): ChainLaneStep => ({
    position: step.position, techniqueId: step.technique_id, role: step.role, elementId: step.elementId,
  }));
  const actedOn = new Set(steps.map((step) => step.elementId));
  return { chainId: chain.chain_id, chainName: chain.chain_name, steps, elementIds: elementOrder.filter((elementId) => actedOn.has(elementId)) };
}

export function summariseChainLanes(model: DeviceModel, chainResult: ChainGenerationResult): ChainLanes {
  const elements = listElementsInModelOrder(model);
  const lanes = chainResult.chains.map((chain) => toLane(chain, elements.map((element) => element.id)));
  const chainIdsByElement = Object.fromEntries(elements.map((element) =>
    [element.id, lanes.filter((lane) => lane.elementIds.includes(element.id)).map((lane) => lane.chainId)]));
  return { elements, lanes, chainIdsByElement, chainsFound: chainResult.chainsFound, wasCapped: chainResult.wasCapped };
}
