/** Shapes shared by the pieces of the device diagram. */

/** The parts and connections a view or a chain picks out; everything else steps back. */
export interface DiagramHighlight {
  componentIds: readonly string[];
  linkIds: readonly string[];
}

/** One step of a chain, on the part or connection it acts on. */
export interface ChainMarker {
  elementId: string;
  position: number;
}

export interface ElementState {
  isSelected: boolean;
  /** Under the pointer or holding focus, here or in a linked view. */
  isLit: boolean;
  /** Outside the highlight. Shown in a softer colour, never by transparency. */
  isDimmed: boolean;
}

/** Where playback stands for the steps on one element. */
export type StepState = 'reached' | 'now' | 'ahead';

export interface StepMark {
  /** The step numbers on the element, for example "2,3". */
  text: string;
  state: StepState;
}

/**
 * The step mark for each element a chain acts on. With no playback (`reachedStepCount`
 * undefined) every step is shown as reached: the still picture is complete.
 */
export function buildStepMarks(chainSteps: readonly ChainMarker[], reachedStepCount: number | undefined): Map<string, StepMark> {
  const positionsByElement = new Map<string, number[]>();
  for (const marker of chainSteps) positionsByElement.set(marker.elementId, [...(positionsByElement.get(marker.elementId) ?? []), marker.position]);
  const marks = new Map<string, StepMark>();
  for (const [elementId, positions] of positionsByElement) {
    marks.set(elementId, { text: positions.join(','), state: stepStateOf(positions, reachedStepCount) });
  }
  return marks;
}

function stepStateOf(positions: readonly number[], reachedStepCount: number | undefined): StepState {
  if (reachedStepCount === undefined) return 'reached';
  if (positions.includes(reachedStepCount)) return 'now';
  return Math.min(...positions) <= reachedStepCount ? 'reached' : 'ahead';
}

/** The element the newest step reached acts on, or null when nothing is playing. */
export function currentStepElementId(chainSteps: readonly ChainMarker[], reachedStepCount: number | undefined): string | null {
  if (reachedStepCount === undefined) return null;
  return chainSteps.find((marker) => marker.position === reachedStepCount)?.elementId ?? null;
}
