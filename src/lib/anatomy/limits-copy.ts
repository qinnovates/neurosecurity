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
  region_matching: 'Where a shape is shown it only roughly marks the QIF region: an AI drafted the matching, no expert has checked it, and real borders differ from person to person.',
  list_terms: 'A catalog entry is one attack technique in the TARA catalog. "Filed under" means an AI placed a paper\'s finding beside a region; each statement says what the paper itself is about.',
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
  layers_text_only: 'Layers choose what the 3D view draws. The list always shows every region.',
  layer_unavailable: 'This layer is not available in this build.',
  layer_blocked_route_not_settled: 'Not available in this build. The shapes cannot yet be placed reliably in the brain model this site uses.',
  layer_blocked_grant_not_explicit: 'Not available in this build. It is unclear whether the source\'s licence allows this site to show it.',
  layer_blocked_not_cleared: 'Not available in this build. The terms for showing this source on this site are not yet settled.',
  layer_blocked_verdict_not_ship: 'Not available in this build. As its licence was read, this source may not be shown on this site.',
  layer_blocked_license_not_commercial: 'Not available in this build. The source\'s licence does not allow commercial use.',
  layer_blocked_not_redistributable: 'Not available in this build. The source may be used for calculation but not shown or passed on.',
  layer_blocked_agreement_not_accepted: 'Not available in this build. The source is behind an access agreement that has not been accepted for this site.',
  networks_names_only: 'These are names researchers give to groups of brain areas whose activity tends to rise and fall together. No shapes are shown, because no network map\'s licence clearly allows this site to show it.',

  // Lenses.
  lens_band: 'Bands are QIF\'s own way of grouping brain regions; QIF is a proposed framework that has not been peer reviewed.',
  lens_technique: 'A linked region means an AI found it named in the catalog\'s description of this technique; no expert has checked the link. It does not mean the attack has been done to anyone, or that it would work.',
  lens_technique_band_only: 'The catalog ties this technique to {bands} and names no region. The regions there are marked "no data", which does not mean they are safe or that they are targets.',
  lens_technique_not_drafted: 'No region links have been drafted for this technique yet, so every region reads "no data".',
  lens_technique_device_only: 'The catalog tags this technique with device stages only and no brain band, so no region link was drafted. This describes the tags, not what the technique could affect in the body.',
  lens_technique_unknown: 'This build holds no data for this technique, so every region reads "no data".',
  lens_niss: 'The steps show the highest score that NISS, a proposed and unreviewed scale, gives to any technique an AI has linked to this region. Regions with no linked technique are marked "no data", not "low". It is not a measurement of risk to this part of the brain.',
  niss_meaning: 'NISS is a proposed, unreviewed severity score for attack techniques, in steps from none to critical. A region shows the highest step among the techniques an AI has linked to it.',
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
  evidence_none_no_abstract_found: 'No statement is filed under this region: the search found no paper whose abstract ties a finding to this structure itself. That does not mean no such paper exists.',
  evidence_none_animal_evidence_only: 'No statement is filed under this region: only animal studies were found for it, and the statements here come from studies in people.',
  evidence_none_unrecorded: 'No statement is filed under this region, and no reason is recorded.',
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
  evidence_check_downgrade: 'The second AI checked this quote and judged that it supports less than first drafted; the statement was narrowed or qualified.',
  evidence_check_added_in_round_2_not_seen_by_verifier: 'Not seen by the second AI: this statement was added after its check.',
  evidence_rival_view: 'Shown as a rival view: it argues against another statement filed here.',
  stated_devices_none: 'No device record in QIF\'s atlas file lists this region.',
  qif_file_fact: 'From QIF\'s own atlas file, which no expert has reviewed. QIF is a proposed framework.',

  // The 3D view.
  whole_scene: 'The layers come from different studies and were lined up to one average brain by computer. Do not read meaning into shapes that only just touch or miss.',
  outline_shape: 'This is the outer shape of an average made from many people\'s brain scans, not anyone\'s real brain. Much of the brain\'s surface lies inside folds that averaging smooths away, so only the outside is shown.',
  mirrored_scene: 'The {source} shapes were drawn on one side of the brain and mirrored to make the other. A difference between left and right in them means nothing.',
  marker_ring: 'A ring alone marks a structure too small to draw as a shape here. It shows roughly where the structure is, not its size or shape.',
  coarse_ring: 'A shape with a ring on it is only a few scan pixels wide, so its size and edges are rough.',
  unfilled_shape: 'A shape drawn as lines with no fill has no data under this lens. That is not the same as a low value.',
  inside_shape: 'A pale shape holds what the lens shows somewhere inside it, or holds records that differ. It is not filled, because the shape is not any one of them.',
  lens_fills_nothing: 'Nothing is filled under this lens. Where it holds a value, the value lies somewhere inside a larger shape, which is drawn pale and darker than the shapes with no record.',
  slice_view: 'The cut shows the average template and the atlas shapes, not a scan of anyone.',
  slice_position: 'Cut at {position} mm, {axis}. Everything beyond the cut is hidden.',
  position_checked: 'The position of the {layer} was independently checked.',
  position_checked_in_aggregate: 'The position of the {layer} was checked as a whole against an independent measure, not shape by shape. Some folds score lower than others.',
  position_not_checked: 'The position of the {layer} has not been independently checked.',
  position_not_checked_with_range: 'The position of the {layer} has not been independently checked. Where two atlases draw the same deep structure, their surfaces differ by about {range} mm.',
  position_failed: 'A position check failed for the {layer}. Treat that position as unreliable.',
  picked_shape_shared: 'This shape holds more than one QIF region. Picking it selects the shape, not any one of them.',
  picked_shape_larger: 'This shape is larger than the QIF region it holds. Picking it selects the shape, not the region.',
  picked_shape_unowned: 'No QIF record maps to this shape. It is drawn for context and no lens colours it.',
  view_hint: 'Drag to turn. Hold Ctrl or Command and scroll to zoom. A click picks the filled or selected shape under the pointer, even through pale shapes in front of it.',

  // The rail, networks and the H01 card.
  device_stages: 'The catalog tags these techniques with device stages only and no brain band, so no region link was drafted. This describes the tags, not what a technique could affect in the body.',
  stage_tags: 'The stage tags come from the TARA catalog as written, a proposed catalog that no expert has reviewed.',
  band_order: 'The order is the catalog\'s band order. It does not show which way a signal travels.',
  device_stages_mixed: 'Some techniques carry a brain band as well as a device band. Their region links, where an AI has drafted any, are in the region list.',
  h01_sample: 'This is one small sample from one person. It is not linked to any region here and says nothing about what any part of the brain does.',
  licence_readings: 'Licence readings were made by an AI, not by a lawyer, and no person has confirmed them.',

  // Threat-model steps on the brain.
  chain_order: 'The steps follow the order of this threat model, one after another. Nothing here shows a signal moving through the brain.',
  chain_not_incident: 'Each threat model here is a sequence of catalog techniques put together for this site. None is a report of something that happened.',
  chain_step_tally: '{lit} of this threat model\'s {total} steps light a region. A step that lights none has no single region linked to its technique; that does not mean it leaves the brain alone.',
  chain_overall_tally: '{lit} of the {total} steps in these {chains} threat models light a region. For the others the picture of the brain does not change; the device stages their techniques are tagged with are marked under Device stages.',
  chain_all_at_once: 'Your device asks for less motion, so every step is shown at once, numbered in the threat model\'s order.',

  // The electrode layout, the head surface and the lead drawings.
  device_electrodes: 'These dots show the standard 10-20 electrode layout fitted to an average head by a computer program. The four points it is measured from are rough guesses, so a dot may be a centimetre or so from where a technician would put it. On a real head the positions shift, and the brain area under each one differs between people.',
  device_landmarks: 'The layout is measured from four points: the dip above the nose, the bump at the back of the skull, and a point in front of each ear. A program guessed them on an average head. No person has checked them, and three of the four are weak guesses.',
  device_lead: 'The contacts and the lead\'s thickness are drawn to scale from published figures; the tip and the rest are not. It is shown beside the brain, not in it: surgeons choose the position and angle for each patient from that patient\'s own scans.',
  device_lead_panel: 'Numbers marked \'review paper\' come from a journal article, not from an FDA document.',
  device_head_surface: 'The head shape is the outer surface of an average of 152 people\'s MRI scans, so it is smooth and is no one\'s real head. The scan stops just below the nose and before its tip, so the shape is cut flat there.',
  device_electrode_pick: 'Picking a dot shows the electrode\'s name. It selects no brain region: this atlas does not say what lies under an electrode.',
  device_lead_scale: 'Every lead here is drawn at one scale. The bar is {length} mm long at that scale.',
  device_fact_abstract_only: 'An AI wrote this sentence from the paper\'s abstract alone. The full paper was not read, and no person has checked it.',
  device_fact_full_text: 'An AI wrote this sentence from the paper. No person has checked it.',
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
