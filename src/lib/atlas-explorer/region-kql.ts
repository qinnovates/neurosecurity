/**
 * The prefilled query a region's dossier ends with. Only tables with a column
 * that holds a region id or a band can join on a region: `anatomy_technique_terms`
 * through `single_region_id`, `controls` through the region's band. `devices` and
 * `hazards` hold neither as a single value, so they are not in the join.
 */

const DATA_STUDIO_PATH = '/data-studio/';
/** The query string `src/components/data-studio/prefilled-kql.ts` reads. */
export const KQL_QUERY_PARAM = 'kql';

/** A region's id as a KQL string. Region ids come from the validated index; quoting here keeps the query well formed whatever they hold. */
const quote = (value: string): string => JSON.stringify(value);

/**
 * @param hasLitLinks whether a technique names the region. Without one the technique join returns nothing, so the query
 * stops at what the region's band holds and the link never opens on an empty table.
 */
export function buildRegionKqlQuery(regionId: string, hasLitLinks: boolean): string {
  const region = `brain_regions | where id == ${quote(regionId)}`;
  if (!hasLitLinks) return `${region} | join controls on qif_band == band | project name, qif_band, type, control`;
  return `${region} | join anatomy_technique_terms on id == single_region_id | join techniques on technique_id == id | join controls on qif_band == band | project name, qif_band, technique_id, technique_name, niss_severity, type, control`;
}

/** The link to the data studio with the query filled in. */
export function regionKqlHref(kqlQuery: string): string {
  return `${DATA_STUDIO_PATH}?${new URLSearchParams({ [KQL_QUERY_PARAM]: kqlQuery }).toString()}`;
}
