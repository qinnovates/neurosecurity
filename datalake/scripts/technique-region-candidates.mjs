/**
 * Finds, mechanically, every place a technique's own registrar text writes a
 * word the atlas knows for a brain structure: a region id, a region name, an
 * abbreviation, an alias or a sub-structure name. The result is a candidate
 * list for a reader to curate. It decides nothing: a hit may be an example, a
 * negation or a different sense of the word, and a structure the atlas has no
 * word for (cochlea, retina) is never found here and must be read for.
 *
 * It also states the one rule for generated text. `tara.dsm5.pathway` is
 * written for most techniques by build_pathway() in populate-dsm5.py from the
 * band tags alone: for each of the top two bands it prints that band's first
 * two example structures. Such a string names what a band contains, not what
 * the technique targets, so a hit inside it does not count as the technique
 * naming a structure.
 */

import { normaliseRegionTerm } from './region-term.mjs';
import { listAliasKinds } from './region-resolver.mjs';

export const REGISTRAR_FILE = 'datalake/qtara-registrar.json';
export const NEURAL_BAND_PREFIX = 'N';
export const TEMPLATED_POINTER_SUFFIX = '/tara/dsm5/pathway';
const TEMPLATED_CLAUSE_SEPARATOR = '; ';

/**
 * Every clause build_pathway() can print, one per band profile in
 * populate-dsm5.py (BAND_DSM_PROFILES: first two structures, first function).
 * A pathway string is generated when every one of its clauses is in this list.
 */
export const TEMPLATED_PATHWAY_CLAUSES = Object.freeze([
  'N7 (PFC/M1) → executive function',
  'N6 (hippocampus/amygdala) → emotion regulation',
  'N5 (striatum/STN) → motor selection',
  'N4 (thalamus/hypothalamus) → sensory gating',
  'N3 (cerebellar cortex/deep cerebellar nuclei) → motor coordination',
  'N2 (medulla/pons) → vital functions',
  'N1 (spinal cord) → reflexes',
  'I0 (electrode-tissue boundary) → measurement',
]);

/** How a lexicon entry relates to its region. `STRONG_KINDS` are the ones a no-structure claim is tested against. */
export const TERM_KIND = Object.freeze({
  ID: 'id',
  NAME: 'name',
  NAME_HEAD: 'name_head',
  SYNONYM: 'synonym',
  WHOLE_TO_PART: 'whole_to_part',
  PART_TO_WHOLE: 'part_to_whole',
  UNCLASSIFIED_ALIAS: 'unclassified',
  PARENT_STRUCTURE: 'parent_structure',
  SUB_STRUCTURE: 'sub_structure',
  ABBREVIATION: 'abbreviation',
});

/** A region's own id or name, or a word the atlas states is a synonym for it. */
export const STRONG_KINDS = Object.freeze([TERM_KIND.ID, TERM_KIND.NAME, TERM_KIND.NAME_HEAD, TERM_KIND.SYNONYM]);
/** Short forms are matched in their written case only: "RF" is not "rf", and "AM" is not "am". */
const CASE_SENSITIVE_KINDS = Object.freeze([TERM_KIND.ABBREVIATION]);

const PARENTHESISED_GLOSS = /^(.*?)\s*\(([^)]*)\)\s*$/;
const REGEX_SPECIAL_CHARACTER = /[.*+?^${}()|[\]\\]/g;
const WORD_CHARACTER = 'A-Za-z0-9';
const SEPARATOR_PATTERN = '[\\s_-]+';
const SEPARATOR_SPLIT = /[\s_-]+/;
const POINTER_SEPARATOR = '/';
const MINIMUM_TERM_LENGTH = 2;

export function isTemplatedPathway(text) {
  return text.split(TEMPLATED_CLAUSE_SEPARATOR).every((clause) => TEMPLATED_PATHWAY_CLAUSES.includes(clause));
}

/** Whether the text at `pointer` is generated band boilerplate rather than this technique's own words. */
export function isTemplatedField(pointer, text) {
  return pointer.endsWith(TEMPLATED_POINTER_SUFFIX) && isTemplatedPathway(text);
}

export function hasNeuralBand(technique) {
  return (technique.band_ids ?? []).some((bandId) => bandId.startsWith(NEURAL_BAND_PREFIX));
}

function escapePointerToken(token) {
  return token.replaceAll('~', '~0').replaceAll('/', '~1');
}

function collectTextFields(value, pointer, isCitable, fields) {
  if (typeof value === 'string') {
    fields.push({ pointer, text: value, citable: isCitable });
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => collectTextFields(item, `${pointer}${POINTER_SEPARATOR}${index}`, false, fields));
  } else if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      collectTextFields(child, `${pointer}${POINTER_SEPARATOR}${escapePointerToken(key)}`, isCitable, fields);
    }
  }
  return fields;
}

/**
 * Every string anywhere in a technique's registrar entry, with a pointer to it.
 * `citable` is false for a string inside a list: a source reference addresses a
 * list item by its `id`, and a plain string has none, so it cannot be quoted.
 */
export function listTextFields(technique) {
  return collectTextFields(technique, `/techniques/${technique.id}`, true, []);
}

function splitGloss(name) {
  const parts = PARENTHESISED_GLOSS.exec(name);
  return parts === null ? { head: name, gloss: null } : { head: parts[1], gloss: parts[2] };
}

function listRegionTerms(region) {
  const { head } = splitGloss(region.name);
  const terms = [
    { text: region.id, kind: TERM_KIND.ID },
    { text: region.name, kind: TERM_KIND.NAME },
    { text: region.abbreviation, kind: TERM_KIND.ABBREVIATION },
    { text: region.parent_structure, kind: TERM_KIND.PARENT_STRUCTURE },
  ];
  if (head !== region.name) terms.push({ text: head, kind: TERM_KIND.NAME_HEAD });
  for (const subStructure of region.sub_structures ?? []) {
    const { head: subHead, gloss } = splitGloss(subStructure.name);
    terms.push({ text: subHead, kind: TERM_KIND.SUB_STRUCTURE });
    if (gloss !== null) terms.push({ text: gloss, kind: TERM_KIND.ABBREVIATION });
  }
  return terms.filter((term) => typeof term.text === 'string').map((term) => ({ ...term, region_id: region.id }));
}

/**
 * A pattern for every place `text` is written, whatever its letter case and
 * whichever of space, hyphen or underscore joins its words, with or without a
 * plural "s", and never as part of a longer word.
 */
export function buildMentionPattern(text, isCaseSensitive = false) {
  const tokens = (isCaseSensitive ? text.trim() : normaliseRegionTerm(text)).split(SEPARATOR_SPLIT).filter((token) => token.length > 0);
  const body = tokens.map((token) => token.replace(REGEX_SPECIAL_CHARACTER, '\\$&')).join(SEPARATOR_PATTERN);
  return new RegExp(`(?<![${WORD_CHARACTER}])${body}s?(?![${WORD_CHARACTER}])`, isCaseSensitive ? 'g' : 'gi');
}

/**
 * Every word the atlas has for a structure, with the region it belongs to and
 * how it relates to that region. An alias takes its stated kind.
 */
export function buildRegionLexicon(atlas) {
  const aliases = atlas.region_aliases ?? {};
  const aliasTerms = Object.entries(listAliasKinds(atlas)).map(([alias, kind]) => ({ text: alias, kind, region_id: aliases[alias] }));
  const regionTerms = (atlas.brain_regions ?? []).flatMap(listRegionTerms);
  const seen = new Set();
  return [...regionTerms, ...aliasTerms]
    .filter((term) => term.text.trim().length >= MINIMUM_TERM_LENGTH)
    .filter((term) => {
      const key = `${term.kind}|${term.region_id}|${normaliseRegionTerm(term.text)}`;
      return seen.has(key) ? false : Boolean(seen.add(key));
    })
    .map((term) => ({ ...term, pattern: buildMentionPattern(term.text, CASE_SENSITIVE_KINDS.includes(term.kind)) }));
}

function findTermInField(term, field) {
  return [...field.text.matchAll(term.pattern)].map((match) => ({
    pointer: field.pointer,
    citable: field.citable,
    templated: isTemplatedField(field.pointer, field.text),
    start: match.index,
    end: match.index + match[0].length,
    matched: match[0],
    lexicon_text: term.text,
    kind: term.kind,
    region_id: term.region_id,
  }));
}

/** Every occurrence of a lexicon term in a technique's text, in field order then text order. */
export function findCandidates(technique, lexicon) {
  return listTextFields(technique).flatMap((field) => lexicon
    .flatMap((term) => findTermInField(term, field))
    .sort((left, right) => left.start - right.start || right.end - left.end));
}

/** The occurrences that would contradict a claim that the text names no structure. */
export function findStrongMentions(technique, lexicon) {
  return findCandidates(technique, lexicon).filter((candidate) => STRONG_KINDS.includes(candidate.kind) && !candidate.templated);
}
