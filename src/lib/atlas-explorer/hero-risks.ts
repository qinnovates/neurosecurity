/**
 * What the homepage hero shows of a region's risks: its linked techniques,
 * the highest NISS step first, cut to a few so the card beside the picture
 * stays a summary and not the inspector. The inspector on the explorer page
 * lists them all.
 */

import { NISS_STEPS } from '@/lib/anatomy/colour-modes';
import type { DetailTechnique } from './region-detail';

/** How many linked techniques the hero card lists before it says how many more the full atlas holds. */
export const HERO_RISK_CAP = 5;

const TECHNIQUE_CATALOG_PATH = '/atlas/tara/';

export interface RankedRisks {
  shown: DetailTechnique[];
  /** Linked techniques past the cap, which the card counts rather than lists. */
  hiddenCount: number;
}

function rankStep(severity: string | null): number {
  return severity === null ? -1 : (NISS_STEPS as readonly string[]).indexOf(severity);
}

/** The highest NISS step first; techniques with no step last; ties by name, so the order is stable across renders. */
export function rankRegionRisks(linked: readonly DetailTechnique[], cap: number = HERO_RISK_CAP): RankedRisks {
  const ranked = [...linked].sort((first, second) => rankStep(second.nissSeverity) - rankStep(first.nissSeverity) || first.name.localeCompare(second.name));
  return { shown: ranked.slice(0, cap), hiddenCount: Math.max(ranked.length - cap, 0) };
}

/** The catalog page of one technique. */
export function techniquePagePath(techniqueId: string): string {
  return `${TECHNIQUE_CATALOG_PATH}${techniqueId}/`;
}
