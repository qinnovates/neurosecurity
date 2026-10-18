/**
 * The one normalisation applied to a word for a brain structure before it is
 * looked up among the atlas's region ids and alias keys. Catalog prose writes
 * "spinal cord" and "Prefrontal Cortex"; the atlas writes `spinal_cord` and
 * `prefrontal_cortex`. The normalisation closes exactly that gap and nothing
 * more: letter case, surrounding and repeated whitespace, hyphen versus
 * underscore versus space, and one plural "s". It does no stemming, expands no
 * abbreviation and matches no part of a word.
 *
 * The datalake joins (impact chains, pathway bands) stay exact: they compare
 * ids written by this repository, not prose. Only prose terms pass through here.
 */

import { createRegionResolver, listAliasKinds } from './region-resolver.mjs';

const SEPARATOR_RUN = /[\s_-]+/g;
const CANONICAL_SEPARATOR = '_';
const PLURAL_SUFFIX = 's';

export class AmbiguousRegionTermError extends Error {
  constructor(normalisedKey, firstKey, secondKey) {
    super(
      `Region keys "${firstKey}" and "${secondKey}" in qif-brain-bci-atlas.json both normalise to "${normalisedKey}", `
      + 'so a catalog term could not tell them apart. Rename one of them; do not let lookup order decide.',
    );
    this.name = 'AmbiguousRegionTermError';
  }
}

/** Lower case, trimmed, with every run of spaces, hyphens and underscores written as one underscore. */
export function normaliseRegionTerm(term) {
  return term.trim().toLowerCase().replace(SEPARATOR_RUN, CANONICAL_SEPARATOR);
}

function listRegionKeys(atlas) {
  const regionIds = (atlas.brain_regions ?? []).map((region) => region.id);
  return [...regionIds, ...Object.keys(listAliasKinds(atlas))];
}

/**
 * Normalised key -> the region id or alias key exactly as the atlas writes it.
 * Throws AmbiguousRegionTermError when two keys normalise to the same text.
 */
export function indexRegionKeys(atlas) {
  const keyByNormalised = new Map();
  for (const key of listRegionKeys(atlas)) {
    const normalisedKey = normaliseRegionTerm(key);
    const existingKey = keyByNormalised.get(normalisedKey);
    if (existingKey !== undefined && existingKey !== key) throw new AmbiguousRegionTermError(normalisedKey, existingKey, key);
    keyByNormalised.set(normalisedKey, key);
  }
  return keyByNormalised;
}

/**
 * The atlas key a catalog term names, or undefined when it names none. The
 * term as written wins; only when that finds nothing is one trailing "s" read
 * as a plural, so "pons" and "thalamus" are never shortened.
 */
export function findRegionKey(term, keyByNormalised) {
  const normalisedTerm = normaliseRegionTerm(term);
  const exactKey = keyByNormalised.get(normalisedTerm);
  if (exactKey !== undefined || !normalisedTerm.endsWith(PLURAL_SUFFIX)) return exactKey;
  return keyByNormalised.get(normalisedTerm.slice(0, -PLURAL_SUFFIX.length));
}

/**
 * @returns {(term: string, context: string) => { region: object, match: string } | null}
 *   The region a catalog term names and how it was joined, or null when the
 *   atlas has no word for it. An alias that points at a missing region still
 *   throws: that is a broken atlas, not an unknown word.
 */
export function createCatalogTermResolver(atlas) {
  const resolveRegion = createRegionResolver(atlas);
  const keyByNormalised = indexRegionKeys(atlas);
  return function resolveCatalogTerm(term, context) {
    const regionKey = findRegionKey(term, keyByNormalised);
    return regionKey === undefined ? null : resolveRegion(regionKey, context);
  };
}
