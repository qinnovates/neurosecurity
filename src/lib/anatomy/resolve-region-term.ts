/**
 * Resolves a word the catalog uses for a brain structure to a QIF region, and
 * says how. This is the datalake's own resolver (region-resolver.mjs), so a
 * technique link and an impact-chain row can never resolve one alias two ways.
 *
 * Catalog prose is not written in atlas ids, so a term is first normalised by
 * region-term.mjs (letter case, whitespace, hyphen or underscore, one plural
 * "s") and then looked up among the region ids and alias keys. Nothing looser
 * is tried: no stemming, no abbreviation the atlas does not list, no part of a
 * longer name. A region's display name resolves only where it is also an id or
 * an alias.
 */

import { LIGHTING_MATCHES, REGION_MATCH } from '@shared/scripts/region-resolver.mjs';
import { createCatalogTermResolver } from '@shared/scripts/region-term.mjs';
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
const LINK_CONTEXT = 'technique link';
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
  const resolveCatalogTerm = createCatalogTermResolver(atlas);
  return function resolveTerm(term: string): TermResolution {
    const resolved = resolveCatalogTerm(term, LINK_CONTEXT);
    return resolved === null ? UNRESOLVED_TERM : toTermResolution(resolved, term);
  };
}
