/**
 * Every sentence the atlas shows about what its content can and cannot tell a
 * visitor. They live here, as closed templates, so a change to any wording is
 * one visible diff; a snapshot test holds the whole table. Values in braces are
 * filled from data, never typed at a call site, and no component writes a
 * limit sentence of its own.
 *
 * Written for a reader who is not a specialist: plain words, one or two
 * sentences each, placed beside the thing they limit.
 */

export const LIMIT_TEMPLATES = {
  // What stands for a region.
  region_matching: 'The shapes only roughly mark the QIF regions: an AI drafted the matching and no expert has checked it, and real borders differ from person to person.',
  geometry_drawn: 'The atlas draws a shape for this region.',
  geometry_contained: 'The atlas has no shape for this area alone. It lies somewhere inside the shape shown, which holds other areas too.',
  geometry_marker_only: 'The source gives only a point for this structure, not an outline. The marker shows roughly where it is, not its size or shape.',
  geometry_not_built: 'A matching to an atlas shape has been drafted, but no shape has been built for it yet.',
  geometry_no_geometry: 'No atlas cleared for this site draws this structure. The recorded reason: {reason}',
  geometry_predates_addressing: 'The drafted matching was made for an older version of QIF\'s region list and is not used.',
  geometry_not_mapped: 'Nobody has drafted a matching between this region and an atlas shape yet.',
  shared_shape: 'This atlas draws one shape here and does not divide it. The QIF regions listed sit somewhere inside it; the shape is not any one of them.',
  mirrored_shape: 'The atlas drew one side of the brain and the other side is its mirror image. A difference between left and right in this shape means nothing.',
  source_allen: 'An anatomist drew these shapes onto an average brain, guided by an atlas of one donated brain. They are not measured from a group of people.',
  source_deep_average: 'These shapes are averages from many people\'s MRI scans, placed in the average brain. The smallest are only a few scan pixels wide, so their size and edges here are rough.',
  source_arousal_nuclei: 'Experts drew these nuclei onto the average brain using one donated brainstem and a reference atlas. They are not measured from a group of people, so treat each as an approximate location.',
  source_other: 'This shape comes from {source_name}. How it was drawn is not described here yet.',
  region_description: 'Copied from QIF\'s own atlas file, which no expert has checked. It is a rough summary, not an established fact, and in places it differs from the papers under Evidence.',

  // Layers.
  layers_text_only: 'Layers change the 3D view, which this page does not have yet. The list always shows every region.',
  layer_unavailable: 'Not available in this build. {reason}',
  networks_names_only: 'These are names researchers give to groups of brain areas whose activity tends to rise and fall together. No shapes are shown, because no network map\'s licence clearly allows this site to show it.',

  // Lenses.
  lens_band: 'Bands are QIF\'s own way of grouping brain regions; QIF is a proposed framework that has not been peer reviewed.',
  lens_technique: 'A linked region means an AI found it named in the catalog\'s description of this technique; no expert has checked the link. It does not mean the attack has been done to anyone, or that it would work.',
  lens_technique_band_only: 'The catalog ties this technique to {bands} and names no region. The regions there are marked "no data", which does not mean they are safe or that they are targets.',
  lens_technique_not_drafted: 'No region links have been drafted for this technique yet, so every region reads "no data".',
  lens_technique_device_only: 'The catalog tags this technique with device stages only and no brain band, so no region link was drafted. This describes the tags, not what the technique could affect in the body.',
  lens_technique_unknown: 'This build holds no data for this technique, so every region reads "no data".',
  lens_niss: 'The steps show the highest score that NISS, a proposed and unreviewed scale, gives to any technique an AI has linked to this region. Regions with no linked technique are marked "no data", not "low". It is not a measurement of risk to this part of the brain.',
  lens_dsm: 'These are category names from a psychiatric manual that the catalog attaches to techniques for threat modelling; the links are unreviewed. They are not diagnoses and say nothing about any person.',
  lens_stated_targets: 'These are the regions QIF\'s own atlas file lists for this device; no expert has reviewed the list, and QIF is a proposed framework. Where a device sits and what it affects is different in every person and is not shown here.',
  lens_needs_subject: 'Choose one from the list to see which regions it is linked to.',
  lens_no_data: 'No region has data under this lens. "No data" means nothing has been linked; it does not mean low.',
  counts_are_entries: 'Counts are catalog entries, not measurements, and nothing is ranked by them.',

  // The inspector.
  technique_quote: 'Quoted from this technique\'s entry in the TARA catalog, a proposed catalog that has not been peer reviewed. The link to this region was drafted by an AI.',
  techniques_named_not_counted: 'The catalog\'s text names this region for these techniques, but the link is not counted, for the reason beside each.',
  techniques_band_level: 'Tagged with band {band}; the catalog\'s text names no structure. This is not a link to this region.',
  techniques_none: 'No technique is linked to this region. That means nothing has been linked; it does not mean the region is safe.',
  evidence_intro: 'Each statement is one finding from one published paper, chosen and summarised by an AI; no scientist has reviewed it, and it is not medical advice. A second AI checked most quotes against the paper\'s abstract; a statement says so where it did not.',
  evidence_none: 'No statement is filed under this region. The recorded reason: {reason}',
  evidence_match_equal: 'The drafter judged the paper\'s wording to mean this same region.',
  evidence_match_part: 'The paper is about {anatomy}, a part of this region. It may not hold for the rest of it.',
  evidence_match_larger_structure: 'The paper is about {anatomy}, a larger structure that contains this region. It is not a finding about this region alone.',
  evidence_match_adjacent_or_overlapping: 'The paper is about {anatomy}, which lies next to or partly overlaps this region. It is not a finding about this region itself.',
  evidence_match_uncertain: 'The paper is about {anatomy}. Whether that is this region is not clear from what was read.',
  evidence_match_outside_region: 'The paper is about {anatomy}, which is outside this region. It is shown as a rival view, not as a finding about this region.',
  evidence_inferred: 'Linking the paper\'s wording to this region is the drafter\'s reading, not something the paper says.',
  evidence_contested: 'Researchers disagree about this. Read it beside the other statements here.',
  evidence_required_citation: 'This statement must be read together with the other paper cited with it.',
  evidence_check_keep: 'The second AI checked this quote against the paper\'s abstract.',
  evidence_check_keep_with_corrected_claim: 'The second AI checked this quote and corrected the summary.',
  evidence_check_downgrade: 'The second AI checked this quote and moved it under a larger or different structure than first drafted.',
  evidence_check_added_in_round_2_not_seen_by_verifier: 'Not seen by the second AI: this statement was added after its check.',
  evidence_rival_view: 'Shown as a rival view: it argues against another statement filed here.',
  stated_devices_none: 'No device record in QIF\'s atlas file lists this region.',
  qif_file_fact: 'From QIF\'s own atlas file, which no expert has reviewed. QIF is a proposed framework.',

  // The rail, networks and the H01 card.
  device_stages: 'The catalog tags these techniques with device stages only and no brain band, so no region link was drafted. This describes the tags, not what a technique could affect in the body.',
  stage_tags: 'The stage tags were entered by hand in the TARA catalog, a proposed catalog that no expert has reviewed.',
  band_order: 'The order is the catalog\'s band order. It does not show which way a signal travels.',
  device_stages_mixed: 'Some techniques carry a brain band as well as a device band. Their region links, where an AI has drafted any, are in the region list.',
  h01_sample: 'This is one small sample from one person. It is not linked to any region here and says nothing about what any part of the brain does.',
  licence_readings: 'Licence readings were made by an AI, not by a lawyer, and no person has confirmed them.',
} as const;

export type LimitId = keyof typeof LIMIT_TEMPLATES;

const PLACEHOLDER_PATTERN = /\{([a-z_]+)\}/g;
const REGEX_SPECIAL_PATTERN = /[.*+?^${}()|[\]\\]/g;

type PlaceholdersOf<Template extends string> = Template extends `${string}{${infer Name}}${infer Rest}` ? Name | PlaceholdersOf<Rest> : never;

/** The values a template needs: one string per placeholder, and none for a template without any. */
export type LimitValues<Id extends LimitId> = { [Name in PlaceholdersOf<typeof LIMIT_TEMPLATES[Id]>]: string };

/** A limit sentence ready to show. Only `limitSentence` makes one, so a component cannot show wording of its own. */
export interface LimitSentence {
  readonly id: LimitId;
  readonly text: string;
}

/** A template was asked for with a value missing or empty. */
export class LimitValueError extends Error {
  constructor(id: LimitId, placeholder: string) {
    super(`Limit sentence "${id}" needs a non-empty value for {${placeholder}}. Pass it from the data; do not leave a gap in the sentence.`);
    this.name = 'LimitValueError';
  }
}

/** @throws LimitValueError when a placeholder has no value, so a sentence with a hole in it is never shown */
export function limitSentence<Id extends LimitId>(id: Id, ...values: keyof LimitValues<Id> extends never ? [] : [LimitValues<Id>]): LimitSentence {
  const given: Readonly<Record<string, string>> = values[0] ?? {};
  const text = LIMIT_TEMPLATES[id].replace(PLACEHOLDER_PATTERN, (_placeholder, name: string) => {
    const value = given[name];
    if (value === undefined || value.trim().length === 0) throw new LimitValueError(id, name);
    return value;
  });
  return { id, text };
}

/** Whether `text` is the template `id` with its placeholders filled. Used to prove that what is on screen came from here. */
export function matchesLimitTemplate(id: LimitId, text: string): boolean {
  const pattern = LIMIT_TEMPLATES[id]
    .split(PLACEHOLDER_PATTERN)
    .map((piece, index) => (index % 2 === 1 ? '(.+)' : piece.replace(REGEX_SPECIAL_PATTERN, '\\$&')))
    .join('');
  return new RegExp(`^${pattern}$`, 's').test(text);
}

export function isLimitId(value: string): value is LimitId {
  return Object.hasOwn(LIMIT_TEMPLATES, value);
}
