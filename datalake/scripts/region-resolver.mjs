/**
 * Resolves a region id used in another datalake file to a region of
 * qif-brain-bci-atlas.json, and says how exact that resolution is.
 *
 * Pathway and neurotransmitter files name regions by long ids
 * (`prefrontal_cortex`); the atlas uses short ones (`pfc`). The atlas carries
 * `region_aliases` to bridge the two. Some aliases are not synonyms: they map
 * a larger structure onto one of its parts, or a sub-structure onto the region
 * that contains it. `region_alias_relations` in the atlas states the kind of
 * every alias, plain synonyms included, and the resolver reports it so a join
 * through an alias is never mistaken for an exact one. An alias with no stated
 * kind is `unclassified`: it is never assumed to be a synonym.
 */

/**
 * How an id was joined to an atlas region. It describes the join, not how
 * exact the anatomy is: `id` means the other file wrote the atlas id itself,
 * and that file may still have used a larger region as a stand-in (a pathway
 * that starts in the locus coeruleus is written with origin `pons`). Only the
 * two alias relations below are known to change anatomical scope; `id` and
 * `synonym` say nothing either way. `unclassified` means nobody has stated the
 * alias's kind, so nothing may be concluded from the join.
 */
export const REGION_MATCH = Object.freeze({
  ID: 'id',
  SYNONYM: 'synonym',
  PART_TO_WHOLE: 'part_to_whole',
  WHOLE_TO_PART: 'whole_to_part',
  UNCLASSIFIED: 'unclassified',
});

/** Most exact first. Used to pick one match when several endpoints reach a region. */
export const REGION_MATCH_PRECEDENCE = Object.freeze([
  REGION_MATCH.ID,
  REGION_MATCH.SYNONYM,
  REGION_MATCH.PART_TO_WHOLE,
  REGION_MATCH.WHOLE_TO_PART,
  REGION_MATCH.UNCLASSIFIED,
]);

/** The alias relations that change anatomical scope. */
export const SCOPE_CHANGING_MATCHES = Object.freeze([REGION_MATCH.PART_TO_WHOLE, REGION_MATCH.WHOLE_TO_PART]);

/** The kinds an alias can be given. Also the list keys of region_alias_relations in the atlas. */
export const ALIAS_KINDS = Object.freeze([REGION_MATCH.SYNONYM, ...SCOPE_CHANGING_MATCHES]);

/** The only matches that may light a region. Every other match is listed in the source's own word and lights nothing. */
export const LIGHTING_MATCHES = Object.freeze([REGION_MATCH.ID, REGION_MATCH.SYNONYM]);

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

export class AmbiguousAliasKindError extends Error {
  constructor(alias, firstKind, secondKind) {
    super(
      `Alias "${alias}" is listed under both "${firstKind}" and "${secondKind}" in region_alias_relations of `
      + 'qif-brain-bci-atlas.json. Keep it under exactly one kind.',
    );
    this.name = 'AmbiguousAliasKindError';
  }
}

export class UnclassifiedRegionAliasError extends Error {
  constructor(endpointId, context) {
    super(
      `Region id "${endpointId}" (${context}) is a region_aliases key in qif-brain-bci-atlas.json with no kind in `
      + `region_alias_relations. Add it to exactly one of ${ALIAS_KINDS.join(', ')}; an alias is never assumed to be a synonym.`,
    );
    this.name = 'UnclassifiedRegionAliasError';
  }
}

function indexAliasRelations(atlas) {
  const relationByAlias = new Map();
  for (const relation of ALIAS_KINDS) {
    for (const alias of atlas.region_alias_relations?.[relation] ?? []) {
      if (relationByAlias.has(alias)) throw new AmbiguousAliasKindError(alias, relationByAlias.get(alias), relation);
      relationByAlias.set(alias, relation);
    }
  }
  return relationByAlias;
}

function isAliasKey(aliases, key) {
  return Object.hasOwn(aliases, key) && !key.startsWith(ALIAS_METADATA_PREFIX);
}

/** Alias -> its kind, for every alias in the atlas, in file order. An alias in no kind list reads `unclassified`. */
export function listAliasKinds(atlas) {
  const relationByAlias = indexAliasRelations(atlas);
  const aliases = atlas.region_aliases ?? {};
  return Object.fromEntries(
    Object.keys(aliases)
      .filter((alias) => isAliasKey(aliases, alias))
      .map((alias) => [alias, relationByAlias.get(alias) ?? REGION_MATCH.UNCLASSIFIED]),
  );
}

/**
 * @returns {(endpointId: string, context: string) => { region: object, match: string }}
 *   A resolver that throws UnresolvedRegionError or DanglingRegionAliasError; `context`
 *   names the caller's record in the message. An alias of unstated kind resolves
 *   with match `unclassified`.
 */
export function createRegionResolver(atlas) {
  const regionsById = new Map((atlas.brain_regions ?? []).map((region) => [region.id, region]));
  const aliases = atlas.region_aliases ?? {};
  const relationByAlias = indexAliasRelations(atlas);

  return function resolveRegion(endpointId, context) {
    const exactRegion = regionsById.get(endpointId);
    if (exactRegion) return { region: exactRegion, match: REGION_MATCH.ID };
    if (!isAliasKey(aliases, endpointId)) throw new UnresolvedRegionError(endpointId, context);
    const aliasedRegion = regionsById.get(aliases[endpointId]);
    if (!aliasedRegion) throw new DanglingRegionAliasError(endpointId, aliases[endpointId], context);
    return { region: aliasedRegion, match: relationByAlias.get(endpointId) ?? REGION_MATCH.UNCLASSIFIED };
  };
}

/**
 * A resolver for joins that must keep every endpoint: it also throws
 * UnclassifiedRegionAliasError, because a join through an alias of unstated
 * kind can be neither kept nor quietly dropped.
 */
export function createClassifiedRegionResolver(atlas) {
  const resolveRegion = createRegionResolver(atlas);
  return function resolveClassifiedRegion(endpointId, context) {
    const resolution = resolveRegion(endpointId, context);
    if (resolution.match === REGION_MATCH.UNCLASSIFIED) throw new UnclassifiedRegionAliasError(endpointId, context);
    return resolution;
  };
}

/** Every region id a pathway names, origins first, in file order. */
export function listPathwayEndpoints(pathway) {
  return [...(pathway.origin ?? []), ...(pathway.targets ?? [])];
}
