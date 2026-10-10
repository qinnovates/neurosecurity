/**
 * Preset queries over the anatomy tables. The tables are AI-drafted and
 * unreviewed, so each preset projects `review_state`: a result never shows a
 * drafted row without it. A test runs every preset against the real tables.
 */

export interface PresetQuery {
  label: string;
  query: string;
  group?: string;
}

const GROUP = 'neuro';

export const ANATOMY_PRESETS: readonly PresetQuery[] = [
  {
    label: 'Terms resolving to one region',
    query: 'anatomy_technique_terms | where lights_region == true | join brain_regions on resolved_region_id == id | project technique_id, named_term, quoted_text, resolved_region_id, name, review_state',
    group: GROUP,
  },
  {
    label: 'Crosswalk with source licence',
    query: 'anatomy_crosswalk | where row_kind == "atlas_correspondence" | join anatomy_sources on atlas == source_id | project subject_id, atlas_label_names, extent_match, license_id, licence_read_by, review_state',
    group: GROUP,
  },
];
