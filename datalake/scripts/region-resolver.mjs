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

/**
 * How an id was joined to an atlas region. It describes the join, not how
 * exact the anatomy is: `id` means the other file wrote the atlas id itself,
 * and that file may still have used a larger region as a stand-in (a pathway
 * that starts in the locus coeruleus is written with origin `pons`). Only the
 * two alias relations below are known to change anatomical scope; `id` and
 * `synonym` say nothing either way.
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

/** The alias relations that change anatomical scope. Also the keys of region_alias_relations in the atlas. */
export const SCOPE_CHANGING_MATCHES = Object.freeze([REGION_MATCH.PART_TO_WHOLE, REGION_MATCH.WHOLE_TO_PART]);

/** Keys of region_aliases that hold notes, not aliases. */
const ALIAS_METADATA_PREFIX = '_';

export class UnresolvedRegionError extends Error {
  constructor(endpointId, context) {
    super(
      `Region id "${endpointId}" (${context}) is neither a brain_regions id nor a region_aliases key `
      + 'in qif-brain-bci-atlas.json. Add the region or an alias for it; do not drop the endpoint.',
    );
    this.name = 'UnresolvedRegionError';
  }
}

export class DanglingRegionAliasError extends Error {
  constructor(endpointId, aliasTarget, context) {
    super(
      `Region id "${endpointId}" (${context}) is a region_aliases key in qif-brain-bci-atlas.json, but it points at `
      + `"${aliasTarget}", which is not a brain_regions id. Point the alias at an existing region or add that region.`,
    );
    this.name = 'DanglingRegionAliasError';
  }
}

function indexAliasRelations(atlas) {
  const relationByAlias = new Map();
  for (const relation of SCOPE_CHANGING_MATCHES) {
    for (const alias of atlas.region_alias_relations?.[relation] ?? []) {
      relationByAlias.set(alias, relation);
    }
  }
  return relationByAlias;
}

/**
 * @returns {(endpointId: string, context: string) => { region: object, match: string }}
 *   A resolver that throws UnresolvedRegionError or DanglingRegionAliasError; `context`
 *   names the caller's record in the message.
 */
export function createRegionResolver(atlas) {
  const regionsById = new Map((atlas.brain_regions ?? []).map((region) => [region.id, region]));
  const aliases = atlas.region_aliases ?? {};
  const relationByAlias = indexAliasRelations(atlas);

  return function resolveRegion(endpointId, context) {
    const exactRegion = regionsById.get(endpointId);
    if (exactRegion) return { region: exactRegion, match: REGION_MATCH.ID };
    if (!Object.hasOwn(aliases, endpointId) || endpointId.startsWith(ALIAS_METADATA_PREFIX)) {
      throw new UnresolvedRegionError(endpointId, context);
    }
    const aliasedRegion = regionsById.get(aliases[endpointId]);
    if (!aliasedRegion) throw new DanglingRegionAliasError(endpointId, aliases[endpointId], context);
    return { region: aliasedRegion, match: relationByAlias.get(endpointId) ?? REGION_MATCH.SYNONYM };
  };
}

/** Every region id a pathway names, origins first, in file order. */
export function listPathwayEndpoints(pathway) {
  return [...(pathway.origin ?? []), ...(pathway.targets ?? [])];
}
