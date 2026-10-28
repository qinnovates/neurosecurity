/**
 * A threat model's steps as the explorer shows them: each step's technique,
 * the device stages the catalog tags that technique with, and the regions the
 * technique lens lights for it. Everything is read from the index and the
 * catalog; a step lights exactly what the technique lens would, no more.
 *
 * The steps have an order and nothing else between them. No function here
 * returns a path, a line, a direction or anything that joins one step's
 * regions to the next step's.
 */

import type { IndexReviewState } from '@/lib/anatomy/anatomy-index-types';
import type { LayerId } from '@/lib/anatomy/source-types';
import type { AtlasChain, StepEvidenceLabel } from './chain-file';
import { DEVICE_STAGE_BAND_IDS } from './explorer-catalog';
import type { ExplorerModel } from './explorer-model';
import { FILL_KINDS, buildSceneShapes, describeFill, type SceneShape, type SceneTheme } from './scene-shapes';

export interface ChainStepView {
  position: number;
  techniqueId: string;
  techniqueName: string;
  /** The datalake file's own wording of the step. */
  action: string;
  evidenceLabel: StepEvidenceLabel | null;
  /** The device stages the catalog tags the technique with, application first. Empty when it carries none. */
  stageIds: string[];
  /** The regions whose link to the technique counts under the technique lens. Empty when none does. */
  litRegions: Array<{ id: string; name: string; reviewState: IndexReviewState }>;
}

/** What the viewport and the rail show of a threat model at one moment: one step, or every step at once. */
export interface ChainFrame {
  chainId: string;
  chainName: string;
  stepCount: number;
  /** The steps on screen, in order. */
  steps: ChainStepView[];
  /** Every step is shown at once, numbered: the reduced-motion form. */
  isWhole: boolean;
}

export const EVIDENCE_LABEL_WORDS: Readonly<Record<StepEvidenceLabel, string>> = {
  demonstrated: 'Demonstrated', partly_demonstrated: 'Partly demonstrated', projected: 'Projected',
};

function litRegionsOf(model: ExplorerModel, techniqueId: string): ChainStepView['litRegions'] {
  const byRegion = new Map<string, ChainStepView['litRegions'][number]>();
  for (const link of model.techniquesById.get(techniqueId)?.links ?? []) {
    if (!link.lit || link.resolved_region_id === null || byRegion.has(link.resolved_region_id)) continue;
    byRegion.set(link.resolved_region_id, { id: link.resolved_region_id, name: model.regionsById.get(link.resolved_region_id)?.name ?? link.resolved_region_id, reviewState: link.review_state });
  }
  return [...byRegion.values()];
}

function bandIdsOf(model: ExplorerModel, techniqueId: string): readonly string[] {
  return model.techniquesById.get(techniqueId)?.band_ids ?? model.deviceOnlyTechniquesById.get(techniqueId)?.band_ids ?? [];
}

export function buildChainSteps(model: ExplorerModel, chain: AtlasChain): ChainStepView[] {
  return chain.steps.map((step) => {
    const bandIds = bandIdsOf(model, step.technique_id);
    return {
      position: step.position,
      techniqueId: step.technique_id,
      techniqueName: model.techniquesById.get(step.technique_id)?.name ?? model.deviceOnlyTechniquesById.get(step.technique_id)?.name ?? step.technique_id,
      action: step.action,
      evidenceLabel: step.evidence_label,
      stageIds: DEVICE_STAGE_BAND_IDS.filter((bandId) => bandIds.includes(bandId)),
      litRegions: litRegionsOf(model, step.technique_id),
    };
  });
}

/** How many of the steps light a region, carry a device stage, or have neither, counted and never typed. */
export function tallyChainSteps(steps: readonly ChainStepView[]): { total: number; lit: number; staged: number; neither: number } {
  return {
    total: steps.length,
    lit: steps.filter((step) => step.litRegions.length > 0).length,
    staged: steps.filter((step) => step.stageIds.length > 0).length,
    neither: steps.filter((step) => step.litRegions.length === 0 && step.stageIds.length === 0).length,
  };
}

/**
 * @param position the step on screen, from 1; ignored when every step is shown
 * @param isWhole show every step at once, numbered
 */
export function buildChainFrame(chain: AtlasChain, steps: readonly ChainStepView[], position: number, isWhole: boolean): ChainFrame {
  const shown = isWhole ? [...steps] : steps.filter((step) => step.position === position);
  return { chainId: chain.chain_id, chainName: chain.chain_name, stepCount: steps.length, steps: shown, isWhole };
}

/** The steps on screen in words, for the picture's caption: which threat model, and which step or that all are shown. */
export function describeChainFrame(frame: ChainFrame): string {
  const [step] = frame.steps;
  if (frame.isWhole || step === undefined) return `Threat model ${frame.chainId}, ${frame.chainName}: all ${frame.stepCount} steps, numbered in order.`;
  return `Threat model ${frame.chainId}, ${frame.chainName}: step ${step.position} of ${frame.stepCount}, ${step.techniqueId}, ${step.techniqueName}.`;
}

/** Which step numbers each device stage carries, for the rail. A stage no step is tagged with is absent. */
export function stageStepNumbers(frame: ChainFrame | null): ReadonlyMap<string, number[]> {
  const numbers = new Map<string, number[]>();
  for (const step of frame?.steps ?? []) {
    for (const stageId of step.stageIds) numbers.set(stageId, [...(numbers.get(stageId) ?? []), step.position]);
  }
  return numbers;
}

/** A shape drawn for a threat model: the technique lens's own mark, and the numbers of the steps that mark it. */
export interface ChainShape extends SceneShape {
  /** The steps whose technique the lens fills this shape for, or holds somewhere inside it (a pale shape), in order. Empty otherwise. */
  stepNumbers: number[];
}

/** The technique lens's marks that say a step's region is this shape or lies inside it. Lines and neutral fills say nothing. */
const MARKED_FILLS: readonly SceneShape['fill'][] = ['solid', 'translucent'];

type Look = Pick<SceneShape, 'fill' | 'colour' | 'step' | 'words'>;

/** The strongest of the technique lens's marks among the steps on screen: a fill before a pale shape, a pale shape before lines. */
function strongestLook(looks: readonly Look[]): Look {
  return [...looks].sort((first, second) => FILL_KINDS.indexOf(first.fill) - FILL_KINDS.indexOf(second.fill))[0];
}

/**
 * The shapes for the steps on screen. Each shape gets the technique lens's own
 * mark for each step, from the same style function the lens uses, and keeps
 * the strongest; a filled or pale shape remembers which steps mark it.
 *
 * @param theme the surface the canvas is drawn on, threaded through to the same
 * style function the lens uses, so the steps are drawn on the surface they are
 * actually on. Without it this path drew from whatever palette the default named
 * and a threat model on screen was the one view the theme could not reach.
 */
export function buildChainShapes(model: ExplorerModel, frame: ChainFrame, requested: Readonly<Record<LayerId, boolean>>, theme: SceneTheme): ChainShape[] {
  const looksByKey = new Map<string, { look: Look; stepNumbers: number[] }>();
  return buildSceneShapes(model, null, requested, theme).map((shape) => {
    let entry = looksByKey.get(shape.structureKey);
    if (entry === undefined) {
      const looks = frame.steps.map((step) => ({ position: step.position, look: describeFill(model, shape.structureKey, { kind: 'technique', techniqueId: step.techniqueId }, theme) }));
      entry = { look: looks.length === 0 ? shape : strongestLook(looks.map((item) => item.look)), stepNumbers: looks.filter((item) => MARKED_FILLS.includes(item.look.fill)).map((item) => item.position) };
      looksByKey.set(shape.structureKey, entry);
    }
    return { ...shape, ...entry.look, stepNumbers: entry.stepNumbers };
  });
}
