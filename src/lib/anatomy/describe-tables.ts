/**
 * What Data Studio says about each anatomy table. Every count in a description
 * is computed from the rows it describes, so none can go stale, and every
 * description says the table is AI-drafted and unreviewed and what it must not
 * be read as.
 *
 * Reads rows and names only, so it is safe wherever the rows already are.
 */

import { AnatomyDataError } from './errors';
import { CROSSWALK_ROW_KINDS, MATCH_KINDS, ONE_REGION_MATCH_KINDS, type AnatomyTableName } from './table-names';

export interface DatasetDescription {
  label: string;
  description: string;
  category: string;
}

type Row = Readonly<Record<string, unknown>>;

const CATEGORY = 'Anatomy';
const QUERY_TABLES_FILE = 'src/lib/kql-tables.ts';
const ONE_REGION_KINDS: readonly unknown[] = ONE_REGION_MATCH_KINDS;
const NO_REGION_MATCH_KIND = MATCH_KINDS.unclassified;

const countWhere = (rows: readonly Row[], test: (row: Row) => boolean): number => rows.filter(test).length;
const countDistinct = (rows: readonly Row[], column: string): number => new Set(rows.map((row) => row[column])).size;

function describeSources(rows: readonly Row[]): string {
  return `The ${rows.length} upstream sources registered for the TARA Brain Atlas (atlases, templates and position sets), each with its stated license, the publisher's quoted terms and the AI's reading of whether it may ship. `
    + 'AI-drafted and unreviewed: the license readings were made by AI, not by a lawyer, no person has confirmed them, and they are not legal advice or a clearance for your own use.';
}

function describeStructures(rows: readonly Row[]): string {
  const markers = countWhere(rows, (row) => row.has_drawn_shape === false);
  return `The ${countDistinct(rows, 'structure_key')} atlas labels shipped in the TARA Brain Atlas, one row per drawn side (${markers} rows are location markers with no drawn shape), with the publisher's label name, size class, position check and mesh file digest. `
    + 'AI-drafted and unreviewed: the shapes come from an AI-written pipeline and the QIF records each label is mapped to are an unchecked reading, so a row is not a statement of where a QIF region is. The mapping_ columns describe that mapping only; visual_check_state and position_check describe the shape.';
}

function describeSameExtent(sameExtent: number, rowCount: number): string {
  return sameExtent === 0
    ? `none of the ${rowCount} rows grades the shape as the same structure`
    : `only ${sameExtent} of ${rowCount} rows grade the shape as the same structure`;
}

function describeCrosswalk(rows: readonly Row[]): string {
  const correspondences = rows.filter((row) => row.row_kind === CROSSWALK_ROW_KINDS.CORRESPONDENCE);
  const sameExtent = countWhere(correspondences, (row) => row.extent_match === 'same');
  return `Correspondences between the ${countDistinct(rows, 'subject_id')} QIF brain regions and atlas labels: ${countDistinct(correspondences, 'subject_id')} regions have a row and ${rows.length - correspondences.length} have a record saying no buildable atlas has geometry for them. `
    + `AI-drafted and unreviewed; no neuroanatomist has checked them. Read extent_match before treating a label as the region: ${describeSameExtent(sameExtent, correspondences.length)}.`;
}

function describeTerms(rows: readonly Row[]): string {
  const namesOneRegion = (row: Row): boolean => ONE_REGION_KINDS.includes(row.match_kind);
  const single = countWhere(rows, (row) => row.single_region_match === true);
  const otherBand = countWhere(rows, (row) => namesOneRegion(row) && row.region_band_in_technique_bands === false);
  const none = countWhere(rows, (row) => row.match_kind === NO_REGION_MATCH_KIND);
  const broaderOrNarrower = countWhere(rows, (row) => !namesOneRegion(row) && row.match_kind !== NO_REGION_MATCH_KIND);
  const stale = rows.length - single - otherBand - none - broaderOrNarrower;
  const staleClause = stale === 0 ? '' : `, ${stale} match a region on a row that is out of date`;
  return 'The words each technique\'s own catalog text uses for a brain structure, with the quoted text and how each word matches the QIF region table. '
    + 'AI-drafted and unreviewed, and not a list of targets: a row says the text uses the word, not that the technique acts on a region. '
    + `Only ${single} of ${rows.length} words match exactly one listed region whose band the technique also carries; ${otherBand} match a region in a band the technique does not carry, `
    + `${broaderOrNarrower} match only a broader or narrower region${staleClause}, and ${none} match none.`
    + ' other_match_region_id is never a single-region match: it says only that the word matches a region id or alias that does not count, for the reason in match_kind and region_band_in_technique_bands.';
}

function describeSummary(rows: readonly Row[]): string {
  const withSingle = countWhere(rows, (row) => Number(row.single_region_term_count) > 0);
  const withoutTerms = countWhere(rows, (row) => row.named_term_count === 0);
  return 'One row per technique with a neural band: counts of how the words its catalog text uses for brain structures match the QIF region table, and the stated reason where no word could be drafted. '
    + `AI-drafted and unreviewed: only ${withSingle} of ${rows.length} techniques have a word that matches exactly one listed region whose band the technique also carries, and ${withoutTerms} have no word drafted, so a missing region is not evidence that a technique spares it. `
    + 'named_term_count is every drafted word; single_region_term_count is the words that match exactly one listed region in a band the technique carries; region_in_other_band_term_count, broader_or_narrower_term_count and no_region_term_count are the rest, by reason; stale_region_term_count is words on a row that is out of date.';
}

const DESCRIBERS: Readonly<Record<AnatomyTableName, { label: string; describe: (rows: readonly Row[]) => string }>> = {
  anatomy_sources: { label: 'Atlas Sources', describe: describeSources },
  anatomy_structures: { label: 'Atlas Structures', describe: describeStructures },
  anatomy_crosswalk: { label: 'Region-to-Atlas Crosswalk', describe: describeCrosswalk },
  anatomy_technique_terms: { label: 'Technique Region Terms', describe: describeTerms },
  anatomy_technique_term_summary: { label: 'Technique Region Term Summary', describe: describeSummary },
};

/**
 * @param tables the query tables, by name; every anatomy table must be among them
 * @returns a description per anatomy table, keyed by table name
 * @throws AnatomyDataError when an anatomy table is missing, so a page never shows one without its caveat
 */
export function describeAnatomyTables(tables: Readonly<Record<string, readonly Row[]>>): Record<AnatomyTableName, DatasetDescription> {
  const describeOne = (name: AnatomyTableName): DatasetDescription => {
    const rows = tables[name];
    if (rows === undefined || rows.length === 0) {
      throw new AnatomyDataError(QUERY_TABLES_FILE, name, 'the query tables hold no rows for this anatomy table', 'Build the tables with getKqlTables() before describing them.');
    }
    return { label: DESCRIBERS[name].label, description: DESCRIBERS[name].describe(rows), category: CATEGORY };
  };
  return {
    anatomy_sources: describeOne('anatomy_sources'),
    anatomy_structures: describeOne('anatomy_structures'),
    anatomy_crosswalk: describeOne('anatomy_crosswalk'),
    anatomy_technique_terms: describeOne('anatomy_technique_terms'),
    anatomy_technique_term_summary: describeOne('anatomy_technique_term_summary'),
  };
}
