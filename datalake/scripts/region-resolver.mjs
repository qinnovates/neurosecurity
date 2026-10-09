/**
 * Resolves a region id used in another datalake file to a region of
 * qif-brain-bci-atlas.json, and says how exact that resolution is.
 *
 * Pathway and neurotransmitter files name regions by long ids
 * (`prefrontal_cortex`); the atlas uses short ones (`pfc`). The atlas carries
 * `region_aliases` to bridge the two. Some aliases are not synonyms: they map
 * a larger structure onto one of its parts, or a sub-structure onto the region
 * that contains it. `region_alias_relations` in the atlas lists those, and the
 * resolver reports the relation so a join through an alias is never mistaken
 * for an exact one.
 */

export const REGION_MATCH = Object.freeze({
  ID: 'id',
  SYNONYM: 'synonym',
  PART_TO_WHOLE: 'part_to_whole',
  WHOLE_TO_PART: 'whole_to_part',
});

/** Most exact first. Used to pick one match when several endpoints reach a region. */
export const REGION_MATCH_PRECEDENCE = Object.freeze([
  REGION_MATCH.ID,
  REGION_MATCH.SYNONYM,
  REGION_MATCH.PART_TO_WHOLE,
  REGION_MATCH.WHOLE_TO_PART,
]);

const INEXACT_RELATIONS = Object.freeze([REGION_MATCH.PART_TO_WHOLE, REGION_MATCH.WHOLE_TO_PART]);

export class UnresolvedRegionError extends Error {
  constructor(endpointId, context) {
    super(
      `Region id "${endpointId}" (${context}) is neither a brain_regions id nor a region_aliases key `
      + 'in qif-brain-bci-atlas.json. Add the region or an alias for it; do not drop the endpoint.',
    );
    this.name = 'UnresolvedRegionError';
    this.endpointId = endpointId;
  }
}

function indexAliasRelations(atlas) {
  const relationByAlias = new Map();
  for (const relation of INEXACT_RELATIONS) {
    for (const alias of atlas.region_alias_relations?.[relation] ?? []) {
      relationByAlias.set(alias, relation);
    }
  }
  return relationByAlias;
}

/**
 * @returns {{ canResolve: (endpointId: string) => boolean,
 *             resolve: (endpointId: string, context: string) => { region: object, match: string } }}
 */
export function createRegionResolver(atlas) {
  const regionsById = new Map((atlas.brain_regions ?? []).map((region) => [region.id, region]));
  const aliases = atlas.region_aliases ?? {};
  const relationByAlias = indexAliasRelations(atlas);

  function findMatch(endpointId) {
    const exactRegion = regionsById.get(endpointId);
    if (exactRegion) return { region: exactRegion, match: REGION_MATCH.ID };
    const aliasedRegion = Object.hasOwn(aliases, endpointId) ? regionsById.get(aliases[endpointId]) : undefined;
    if (!aliasedRegion) return undefined;
    return { region: aliasedRegion, match: relationByAlias.get(endpointId) ?? REGION_MATCH.SYNONYM };
  }

  return {
    canResolve: (endpointId) => findMatch(endpointId) !== undefined,
    resolve(endpointId, context) {
      const found = findMatch(endpointId);
      if (!found) throw new UnresolvedRegionError(endpointId, context);
      return found;
    },
  };
}

/** Every region id a pathway names, origins first, in file order. */
export function listPathwayEndpoints(pathway) {
  return [...(pathway.origin ?? []), ...(pathway.targets ?? [])];
}
