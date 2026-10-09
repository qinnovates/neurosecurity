/**
 * Resolves a word the catalog uses for a brain structure to a QIF region, and
 * says how. This is the datalake's own resolver (region-resolver.mjs), so a
 * technique link and an impact-chain row can never resolve one alias two ways.
 */

import { LIGHTING_MATCHES, REGION_MATCH, UnresolvedRegionError, createRegionResolver } from '@shared/scripts/region-resolver.mjs';
import { isOneOf, isRecord } from '@/lib/threat-model/guards';
import { AnatomyDataError } from './errors';

export const RESOLUTIONS = ['id', 'synonym', 'part_to_whole', 'whole_to_part', 'unclassified'] as const;
export type Resolution = typeof RESOLUTIONS[number];

/** Computed at build time and never stored in a data file, so it cannot disagree with the alias table. */
export interface TermResolution {
  resolved_region_id: string | null;
  resolution: Resolution;
}

const ATLAS_FILE = 'datalake/qif-brain-bci-atlas.json';
const UNRESOLVED_TERM: TermResolution = { resolved_region_id: null, resolution: REGION_MATCH.UNCLASSIFIED };

/** Only an id or a synonym lights a region. Every other resolution is listed in the catalog's own word and lights nothing. */
export function lightsRegion(resolution: Resolution): boolean {
  return (LIGHTING_MATCHES as readonly string[]).includes(resolution);
}

function toTermResolution(resolved: { region: unknown; match: unknown }, term: string): TermResolution {
  const regionId = isRecord(resolved.region) ? resolved.region.id : undefined;
  if (typeof regionId !== 'string' || !isOneOf(resolved.match, RESOLUTIONS)) {
    throw new AnatomyDataError(ATLAS_FILE, `term "${term}"`, 'the region resolver returned a match this build does not know',
      'Add the new match value to RESOLUTIONS in resolve-region-term.ts and decide whether it may light a region.');
  }
  return { resolved_region_id: regionId, resolution: resolved.match };
}

/**
 * @param atlas the parsed qif-brain-bci-atlas.json
 * @returns a resolver that never throws for an unknown word: that word is `unclassified` and lights nothing
 */
export function createTermResolver(atlas: unknown): (term: string) => TermResolution {
  const resolveRegion = createRegionResolver(atlas);
  return function resolveTerm(term: string): TermResolution {
    try {
      return toTermResolution(resolveRegion(term, 'technique link'), term);
    } catch (error) {
      if (error instanceof UnresolvedRegionError) return UNRESOLVED_TERM;
      throw error;
    }
  };
}
