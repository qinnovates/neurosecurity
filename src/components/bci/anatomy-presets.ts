/**
 * Preset queries over the anatomy tables. The tables are AI-drafted and
 * unreviewed, so each preset projects the review state, how the row matches
 * and the quoted words it rests on: a result never shows a drafted row without
 * them. A test runs every preset against the real tables.
 */

export interface PresetQuery {
  label: string;
  query: string;
  group?: string;
}

const GROUP = 'neuro';

export const ANATOMY_PRESETS: readonly PresetQuery[] = [
  {
    label: 'Words matching one listed region',
    query: 'anatomy_technique_terms | where single_region_match == true | join brain_regions on single_region_id == id | project review_state, technique_id, named_term, match_kind, quoted_text, single_region_id, name',
    group: GROUP,
  },
  {
    label: 'Words by match kind',
    query: 'anatomy_technique_terms | project review_state, technique_id, named_term, match_kind, quoted_text, single_region_id, other_match_region_id | sort by match_kind asc',
    group: GROUP,
  },
  {
    label: 'Crosswalk with source license',
    query: 'anatomy_crosswalk | where row_kind == "atlas_correspondence" | join anatomy_sources on atlas == source_id | project review_state, subject_id, atlas_label_names, extent_match, quoted_text, handled_as_license_id, license_read_by',
    group: GROUP,
  },
];
