#!/usr/bin/env node
/**
 * Audits datalake/qif-anatomy-technique-regions.json against the registrar text it
 * quotes. It answers four questions a reviewer would otherwise check by hand:
 *
 *   1. What does each drafted term resolve to, and does that region's band
 *      agree with the technique's band tags? (Reported, never enforced: the
 *      band tags are hand-entered and may be the side that is wrong.)
 *   2. Is every place the registrar text writes a word the atlas resolves
 *      either linked or recorded as skipped with a reason? A mention that is
 *      neither is unaccounted, and a test fails on it, so the file cannot pass
 *      by leaving techniques at band level.
 *   3. Which dsm5.pathway strings are generated boilerplate, and how many
 *      techniques carry each?
 *   4. Where does a technique's own pathway text label a stage with a band the
 *      technique is not tagged with?
 *
 * Usage:
 *   node datalake/scripts/audit-technique-regions.mjs                  # the report, as JSON
 *   node datalake/scripts/audit-technique-regions.mjs --candidates     # every mechanical candidate
 *   node datalake/scripts/audit-technique-regions.mjs --candidates QIF-T0127
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { DATALAKE_DIR, runAsCli } from './datalake-cli.mjs';
import { CURATION_PATH, CurationError, REGISTRAR_PATH, TECHNIQUE_REGIONS_PATH, readTechniqueField } from './draft-technique-regions.mjs';
import { LIGHTING_MATCHES, REGION_MATCH, SCOPE_CHANGING_MATCHES } from './region-resolver.mjs';
import { createCatalogTermResolver } from './region-term.mjs';
import {
  NEURAL_BAND_PREFIX, TEMPLATED_POINTER_SUFFIX, TERM_KIND,
  buildMentionPattern, buildRegionLexicon, findCandidates, hasNeuralBand, isTemplatedPathway,
} from './technique-region-candidates.mjs';

const ATLAS_PATH = path.join(DATALAKE_DIR, 'qif-brain-bci-atlas.json');
const AUDIT_CONTEXT = 'technique region audit';
const UNRESOLVED = 'unresolved';
const BAND_LABEL = /\bN[1-7]\b/g;
const REASON_SEPARATOR = ':';
const JSON_INDENT = 2;

/** Why a mention was read and not linked. Closed, so a new kind of exclusion is a reviewed change. */
export const SKIP_CATEGORIES = Object.freeze([
  'negation', 'other_technique', 'clinical_analog', 'citation', 'not_a_structure',
  'same_structure_other_wording', 'functional_system', 'cell_class', 'organ_or_site', 'explanatory_context',
]);

/** A word for exactly one region: its id, its name, or an alias the atlas states is a synonym. */
export const SAME_REGION_KINDS = Object.freeze([TERM_KIND.ID, TERM_KIND.NAME, TERM_KIND.NAME_HEAD, REGION_MATCH.SYNONYM]);

/** Every word that must be linked or skipped: the above, and an alias for a whole or a part. */
export const ACCOUNTED_KINDS = Object.freeze([...SAME_REGION_KINDS, ...SCOPE_CHANGING_MATCHES]);

export const TECHNIQUE_OUTCOME = Object.freeze({
  LIT: 'at_least_one_lighting_link',
  BAND_DISAGREES: 'resolves_but_band_tags_disagree',
  ALIAS_SCOPE: 'alias_scope_links_only',
  UNRESOLVED: 'unresolved_terms_only',
  BAND_LEVEL: 'band_level',
});

function relativeField(techniqueId, pointer) {
  return pointer.slice(`/techniques/${techniqueId}`.length);
}

/** Every drafted link with what its term resolves to. `lights` repeats the build's rule: an id or synonym whose band is among the tags. */
export function describeLinks(techniqueRegions, registrar, atlas) {
  const resolveTerm = createCatalogTermResolver(atlas);
  return registrar.techniques.flatMap((technique) => (techniqueRegions.techniques[technique.id]?.links ?? []).map((link) => {
    const resolved = resolveTerm(link.term, AUDIT_CONTEXT);
    const bandAgrees = resolved !== null && technique.band_ids.includes(resolved.region.qif_band);
    return {
      technique_id: technique.id,
      term: link.term,
      field: relativeField(technique.id, link.evidence.source_ref.pointer),
      resolution: resolved?.match ?? UNRESOLVED,
      region_id: resolved?.region.id ?? null,
      region_band: resolved?.region.qif_band ?? null,
      technique_bands: technique.band_ids.filter((bandId) => bandId.startsWith(NEURAL_BAND_PREFIX)),
      band_agrees: bandAgrees,
      lights: resolved !== null && LIGHTING_MATCHES.includes(resolved.match) && bandAgrees,
    };
  }));
}

function classifyTechnique(links) {
  if (links.some((link) => link.lights)) return TECHNIQUE_OUTCOME.LIT;
  if (links.some((link) => LIGHTING_MATCHES.includes(link.resolution))) return TECHNIQUE_OUTCOME.BAND_DISAGREES;
  if (links.some((link) => link.resolution !== UNRESOLVED)) return TECHNIQUE_OUTCOME.ALIAS_SCOPE;
  return TECHNIQUE_OUTCOME.UNRESOLVED;
}

function countBy(values) {
  return values.reduce((counts, value) => ({ ...counts, [value]: (counts[value] ?? 0) + 1 }), {});
}

/** How the techniques ended up, the band-level reasons, and how the links resolved. Each technique is counted once, by its best link. */
export function summariseDistribution(techniqueRegions, describedLinks) {
  const entries = Object.entries(techniqueRegions.techniques);
  const bandLevel = entries.filter(([, entry]) => entry.links.length === 0);
  const linked = entries.filter(([, entry]) => entry.links.length > 0);
  return {
    techniques: entries.length,
    linked: linked.length,
    band_level: bandLevel.length,
    outcomes: countBy(linked.map(([techniqueId]) => classifyTechnique(describedLinks.filter((link) => link.technique_id === techniqueId)))),
    band_level_reasons: countBy(bandLevel.map(([, entry]) => entry.rationale.split(REASON_SEPARATOR)[0])),
    links: describedLinks.length,
    link_resolutions: countBy(describedLinks.map((link) => link.resolution)),
    lighting_links: describedLinks.filter((link) => link.lights).length,
  };
}

/** Links that resolve to a region whose band is not among the technique's band tags. Kept, listed, never dropped. */
export function listBandDisagreements(describedLinks) {
  return describedLinks.filter((link) => link.region_id !== null && !link.band_agrees);
}

function listSpans(text, phrase) {
  return [...text.matchAll(buildMentionPattern(phrase))].map((match) => ({ start: match.index, end: match.index + match[0].length }));
}

function isInsideAny(candidate, spans) {
  return spans.some((span) => span.start <= candidate.start && candidate.end <= span.end);
}

function rejectStaleSkips(technique, skips) {
  for (const skip of skips) {
    if (!SKIP_CATEGORIES.includes(skip.category)) {
      throw new CurationError(technique.id, `skip category "${skip.category}" is not one of: ${SKIP_CATEGORIES.join(', ')}`, 'Use a listed category.');
    }
    const { text } = readTechniqueField(technique, skip.field);
    if (text === undefined || listSpans(text, skip.text).length === 0) {
      throw new CurationError(technique.id, `the skipped mention "${skip.text}" is not in ${skip.field}`,
        'The registrar text changed or the record is wrong. Read the field again.');
    }
  }
}

/**
 * The mentions of an atlas word in a technique's text that are neither linked
 * nor recorded as skipped. A mention is accounted for when it lies inside an
 * occurrence of a linked term, when it is another word for exactly the region
 * an id or synonym link already resolves to, or when a skip covers it. A word
 * for a whole or a part ("cortex", "amygdala") is never excused by a link to
 * the one region its alias points at.
 */
export function findUnaccountedMentions(technique, entry, skips, context) {
  rejectStaleSkips(technique, skips);
  const linkedRegionIds = new Set(entry.links
    .map((link) => context.resolveTerm(link.term, AUDIT_CONTEXT))
    .filter((resolved) => resolved !== null && LIGHTING_MATCHES.includes(resolved.match))
    .map((resolved) => resolved.region.id));
  return findCandidates(technique, context.lexicon)
    .filter((candidate) => ACCOUNTED_KINDS.includes(candidate.kind) && !candidate.templated)
    .filter((candidate) => {
      const field = relativeField(technique.id, candidate.pointer);
      const { text } = readTechniqueField(technique, field);
      const linkSpans = entry.links.flatMap((link) => listSpans(text, link.term));
      const skipSpans = skips.filter((skip) => skip.field === field).flatMap((skip) => listSpans(text, skip.text));
      const isOtherWordForLinkedRegion = SAME_REGION_KINDS.includes(candidate.kind) && linkedRegionIds.has(candidate.region_id);
      return !isInsideAny(candidate, linkSpans) && !isInsideAny(candidate, skipSpans) && !isOtherWordForLinkedRegion;
    });
}

/** Unaccounted mentions across every technique with an entry, with the field and the matched words. */
export function auditMentions(techniqueRegions, curation, registrar, atlas) {
  const context = { lexicon: buildRegionLexicon(atlas), resolveTerm: createCatalogTermResolver(atlas) };
  return registrar.techniques
    .filter((technique) => techniqueRegions.techniques[technique.id] !== undefined)
    .flatMap((technique) => findUnaccountedMentions(
      technique, techniqueRegions.techniques[technique.id], curation.techniques[technique.id]?.skipped ?? [], context,
    ).map((candidate) => ({
      technique_id: technique.id,
      field: relativeField(technique.id, candidate.pointer),
      matched: candidate.matched,
      kind: candidate.kind,
      region_id: candidate.region_id,
    })));
}

/** Each distinct generated pathway string among the neural-band techniques, most common first, with the techniques that carry it. */
export function listTemplatedStrings(registrar) {
  const idsByText = new Map();
  for (const technique of registrar.techniques.filter(hasNeuralBand)) {
    const pathwayText = readTechniqueField(technique, TEMPLATED_POINTER_SUFFIX).text;
    if (pathwayText === undefined || !isTemplatedPathway(pathwayText)) continue;
    idsByText.set(pathwayText, [...(idsByText.get(pathwayText) ?? []), technique.id]);
  }
  return [...idsByText]
    .map(([text, techniqueIds]) => ({ text, techniques: techniqueIds.length, technique_ids: techniqueIds }))
    .sort((left, right) => right.techniques - left.techniques);
}

/** A technique's own (not generated) pathway text that labels a stage with a neural band the technique is not tagged with. */
export function listPathwayBandConflicts(registrar) {
  return registrar.techniques.filter(hasNeuralBand).flatMap((technique) => {
    const pathwayText = readTechniqueField(technique, TEMPLATED_POINTER_SUFFIX).text;
    if (pathwayText === undefined || isTemplatedPathway(pathwayText)) return [];
    const untaggedBands = [...new Set(pathwayText.match(BAND_LABEL) ?? [])].filter((bandId) => !technique.band_ids.includes(bandId));
    return untaggedBands.length === 0 ? [] : [{ technique_id: technique.id, band_ids: technique.band_ids, untagged_bands_in_text: untaggedBands, text: pathwayText }];
  });
}

function listSkips(curation) {
  return Object.entries(curation.techniques).flatMap(([techniqueId, entry]) => (entry.skipped ?? []).map((skip) => ({ technique_id: techniqueId, ...skip })));
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function printCandidates(registrar, atlas, techniqueId) {
  const lexicon = buildRegionLexicon(atlas);
  const techniques = registrar.techniques.filter(hasNeuralBand).filter((technique) => techniqueId === undefined || technique.id === techniqueId);
  const candidates = techniques.flatMap((technique) => findCandidates(technique, lexicon).map((candidate) => ({ technique_id: technique.id, ...candidate })));
  process.stdout.write(`${JSON.stringify(candidates, null, JSON_INDENT)}\n`);
}

function runCli() {
  const [registrar, atlas] = [readJson(REGISTRAR_PATH), readJson(ATLAS_PATH)];
  const candidatesFlag = process.argv.indexOf('--candidates');
  if (candidatesFlag !== -1) return printCandidates(registrar, atlas, process.argv[candidatesFlag + 1]);
  const [techniqueRegions, curation] = [readJson(TECHNIQUE_REGIONS_PATH), readJson(CURATION_PATH)];
  const describedLinks = describeLinks(techniqueRegions, registrar, atlas);
  const skips = listSkips(curation);
  process.stdout.write(`${JSON.stringify({
    distribution: summariseDistribution(techniqueRegions, describedLinks),
    band_disagreements: listBandDisagreements(describedLinks),
    unresolved_terms: describedLinks.filter((link) => link.resolution === UNRESOLVED),
    alias_scope_links: describedLinks.filter((link) => link.region_id !== null && !LIGHTING_MATCHES.includes(link.resolution)),
    unaccounted_mentions: auditMentions(techniqueRegions, curation, registrar, atlas),
    skipped_by_category: countBy(skips.map((skip) => skip.category)),
    skipped: skips,
    templated_strings: listTemplatedStrings(registrar),
    pathway_band_conflicts: listPathwayBandConflicts(registrar),
  }, null, JSON_INDENT)}\n`);
}

runAsCli(import.meta.url, 'audit-technique-regions', runCli);
