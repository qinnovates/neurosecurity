/**
 * How much of the catalog has a placement decision. The interface states this wherever
 * it shows risks, so an absence reads as "not assessed" and never as "clean".
 */

import type { CatalogTechnique } from './catalog-types';
import type { PlacementRules } from './reference-data-types';

export interface PlacementCoverage {
  /** Placed, and on the device being looked at. Equals `placed` when no device is given. */
  placedHere: number;
  /** Placed in the table, but the device does not meet the technique's conditions. */
  placedElsewhere: number;
  /** Reviewed and not placed, each with a recorded reason. */
  notPlaced: number;
  /** No decision recorded. */
  notAssessed: number;
  total: number;
}

/**
 * @param techniqueIdsOnDevice ids of techniques placed on the device in focus; omit to describe the catalog alone
 */
export function summarisePlacementCoverage(
  techniques: readonly CatalogTechnique[],
  rules: PlacementRules,
  techniqueIdsOnDevice?: ReadonlySet<string>,
): PlacementCoverage {
  let placed = 0;
  let placedHere = 0;
  let notPlaced = 0;
  for (const technique of techniques) {
    if (technique.id in rules.placements) {
      placed += 1;
      if (techniqueIdsOnDevice === undefined || techniqueIdsOnDevice.has(technique.id)) placedHere += 1;
    } else if (technique.id in rules.notPlaced) {
      notPlaced += 1;
    }
  }
  return {
    placedHere,
    placedElsewhere: placed - placedHere,
    notPlaced,
    notAssessed: techniques.length - placed - notPlaced,
    total: techniques.length,
  };
}
