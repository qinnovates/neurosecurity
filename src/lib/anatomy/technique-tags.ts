/**
 * The registrar's own scoring and rights fields for one technique, and the
 * readers that carry them into the index unchanged.
 *
 * Nothing here fills an absent field in. The registrar is honest about what it
 * has not scored: a technique it scores `none` holds a severity word, a score
 * and a vector, while a technique it has not scored holds none of the three.
 * Defaulting the absent case to `none` would make a measured floor and an
 * absence of measurement sort and colour alike, so every absent field reads
 * null and the index parser holds the scored fields to standing or falling
 * together.
 */

import { isRecord } from '@/lib/threat-model/guards';
import {
  childOf, failAt, itemOf, readList, rejectDuplicates, requireBoolean, requireEnum, requireNumber, requirePattern, requireText, rootOf, show, type FieldLocation,
} from './field-readers';
import { REGISTRAR_FILE } from './datalake-files';

export const NISS_SCORING_STATES = ['scored', 'provisional', 'unscored'] as const;
/**
 * What the registrar says it has done with a technique.
 * - `scored`: a vector, a score, a PINS flag and a severity word, all carried here.
 * - `provisional`: a score range only; no point score and no severity word.
 * - `unscored`: nothing scored, with the registrar's own reason left in the registrar.
 */
export type NissScoringState = typeof NISS_SCORING_STATES[number];

/** The vector format `niss_spec.vector_format` states. Values are the metric letters `niss_spec.metrics` allows. */
export const NISS_VECTOR_FORMAT = 'NISS:1.1/BI:<v>/CR:<v>/CD:<v>/CV:<v>/RV:<v>/NP:<v>';
/**
 * The NISS version is pinned in the pattern on purpose: a release changes what
 * the metric letters mean, so whatever reads a vector must be revisited in the
 * same change. A bump stops the build at the first technique instead of
 * reaching a chart that would plot the new letters on the old axes.
 */
export const NISS_VECTOR_PATTERN = /^NISS:1\.1\/BI:[NLHC]\/CR:[NLHC]\/CD:[NLHC]\/CV:[NPEI]\/RV:[FTPI]\/NP:[NTPS]$/;
export const MAX_NISS_VECTOR_LENGTH = 64;
/** `niss_spec.severity_scale` runs 0.0 to 10.0. */
export const MAX_NISS_SCORE = 10;
const MAX_NEURORIGHT_NAME_LENGTH = 120;

/** The registrar's NISS block for one technique, with every absent field as null. */
export interface IndexTechniqueNiss {
  /** Null when the registrar holds no NISS block for the technique at all, which is not the same as holding one it has not scored. */
  scoring_state: NissScoringState | null;
  /** The vector string exactly as the registrar writes it, for whatever plots the six metrics. Null unless the state reads `scored`. */
  vector: string | null;
  score: number | null;
  /** PINS, the registrar's Potential Impact to Neural Safety flag (`niss_spec.pins`: BI >= H or RV == I). Null unless the state reads `scored`. */
  pins: boolean | null;
}

export const NEURORIGHT_CODES = ['MP', 'CL', 'MI', 'PC', 'DI', 'IDA'] as const;
/**
 * The six codes the registrar tags techniques with, while the ethics file
 * defines four (MP, CL, MI, PC). The registrar states the other two fold in.
 * The codes are carried raw and unfolded: folding is a presentation choice, and
 * a reader that folds must say so beside what it draws.
 */
export type NeurorightCode = typeof NEURORIGHT_CODES[number];

/** One code of the registrar's neurorights glossary, with the fold it states as a field rather than as prose. */
export interface IndexNeurorightCode {
  code: NeurorightCode;
  /** The registrar's own name for the code, without the fold statement: that is `folds_into`. */
  name: string;
  /** The code the registrar says this one folds into, or null for a code that stands on its own. Nothing is folded here. */
  folds_into: NeurorightCode | null;
}

export interface IndexTechniqueNeurorights {
  /** The raw codes in the registrar's own order. Empty for a record that names no right; a technique with no record at all carries null instead. */
  affected: NeurorightCode[];
}

/** The registrar's fields the engine catalog does not carry. `niss_severity` sits beside `niss` because readers of the index already name it there. */
export interface TechniqueTags {
  niss_severity: string | null;
  dsm_cluster: string | null;
  niss: IndexTechniqueNiss;
  /** Null when the registrar holds no neurorights record for the technique. */
  neurorights: IndexTechniqueNeurorights | null;
}

const NO_NISS: IndexTechniqueNiss = { scoring_state: null, vector: null, score: null, pins: null };
/** `(folded into MI)` inside a glossary name. The fold is read out of the name and carried as its own field. */
const FOLD_STATEMENT_PATTERN = /^(.+) \(folded into ([A-Z]+)\)$/;
const FOLD_TARGET_GROUP = 2;

function findTechnique(registrar: unknown, techniqueId: string): Record<string, unknown> | null {
  const techniques = isRecord(registrar) && Array.isArray(registrar.techniques) ? registrar.techniques : [];
  const technique = techniques.find((candidate) => isRecord(candidate) && candidate.id === techniqueId);
  return isRecord(technique) ? technique : null;
}

/** Reads `key` only when the registrar holds it. An absent key is null; a key of the wrong type stops the build rather than reading as absent. */
function readPresent<T>(record: Record<string, unknown>, key: string, location: FieldLocation, read: (value: unknown, at: FieldLocation) => T): T | null {
  return Object.hasOwn(record, key) ? read(record[key], childOf(location, key)) : null;
}

function readNiss(technique: Record<string, unknown> | null, location: FieldLocation): IndexTechniqueNiss {
  const niss = technique?.niss;
  if (niss === undefined) return { ...NO_NISS };
  const at = childOf(location, 'niss');
  if (!isRecord(niss)) return failAt(at, 'expected an object', 'Write the NISS block as a JSON object, or leave it out entirely.');
  return {
    scoring_state: readPresent(niss, 'scoring_state', at, (value, field) => requireEnum(value, field, NISS_SCORING_STATES)),
    vector: readPresent(niss, 'vector', at, (value, field) => requirePattern(value, field, NISS_VECTOR_PATTERN, MAX_NISS_VECTOR_LENGTH, NISS_VECTOR_FORMAT)),
    score: readPresent(niss, 'score', at, (value, field) => requireNumber(value, field, 0, MAX_NISS_SCORE)),
    pins: readPresent(niss, 'pins', at, requireBoolean),
  };
}

/** `cci` is read deliberately not at all: the file gives it a range of 0.1 to 2.25 and `niss_spec` defines neither the scale nor what a value means. */
function readNeurorights(technique: Record<string, unknown> | null, location: FieldLocation): IndexTechniqueNeurorights | null {
  const neurorights = technique?.neurorights;
  if (neurorights === undefined || neurorights === null) return null;
  const at = childOf(location, 'neurorights');
  if (!isRecord(neurorights)) return failAt(at, 'expected an object', 'Write the neurorights record as a JSON object, or leave it out entirely.');
  const affected = readList(neurorights, 'affected', at).map((code, index) => requireEnum(code, itemOf(at, 'affected', index), NEURORIGHT_CODES));
  rejectDuplicates(affected, childOf(at, 'affected'), 'neurorights code');
  return { affected };
}

/** The registrar's scoring and rights fields for one technique. A technique the registrar does not hold reads null throughout. */
export function readTechniqueTags(registrar: unknown, techniqueId: string): TechniqueTags {
  const technique = findTechnique(registrar, techniqueId);
  const location = childOf(rootOf(REGISTRAR_FILE), `techniques[${techniqueId}]`);
  const niss = technique?.niss;
  const tara = isRecord(technique) && isRecord(technique.tara) && isRecord(technique.tara.dsm5) ? technique.tara.dsm5 : undefined;
  return {
    niss_severity: isRecord(niss) ? readPresent(niss, 'severity', childOf(location, 'niss'), (value, at) => requireText(value, at, MAX_NEURORIGHT_NAME_LENGTH)) : null,
    dsm_cluster: tara === undefined ? null : readPresent(tara, 'cluster', childOf(location, 'tara.dsm5'), (value, at) => requireText(value, at, MAX_NEURORIGHT_NAME_LENGTH)),
    niss: readNiss(technique, location),
    neurorights: readNeurorights(technique, location),
  };
}

/**
 * The registrar's neurorights glossary, with each code's fold as a field. The
 * registrar states the two folds inside the code's own name text ("Dynamical
 * Integrity (folded into MI)"); reading it out here means a reader that decides
 * whether to fold reads a value instead of parsing prose, and a reader that
 * does not fold still ships the fact that folding is a choice someone made.
 *
 * A registrar that holds no glossary at all reads as an empty one, because the
 * glossary sits in a block a script regenerates. That is not a way through: the
 * index parser refuses any code a technique names that the glossary does not
 * define, so an emptied glossary stops a build that tags anything. A code the
 * registrar adds and this index does not know stops the build here.
 */
export function readNeurorightsTaxonomy(registrar: unknown): IndexNeurorightCode[] {
  const location = childOf(rootOf(REGISTRAR_FILE), 'statistics.neurorights.taxonomy');
  const statistics = isRecord(registrar) ? registrar.statistics : undefined;
  const neurorights = isRecord(statistics) ? statistics.neurorights : undefined;
  const taxonomy = isRecord(neurorights) ? neurorights.taxonomy : undefined;
  if (taxonomy === undefined) return [];
  if (!isRecord(taxonomy)) {
    return failAt(location, 'expected the neurorights glossary as an object', 'Write statistics.neurorights.taxonomy as code -> name, or leave it out: every code a technique names is defined there.');
  }
  const stray = Object.keys(taxonomy).find((code) => !(NEURORIGHT_CODES as readonly string[]).includes(code));
  if (stray !== undefined) {
    failAt(childOf(location, stray), `"${show(stray)}" is not a neurorights code this index knows`, 'Add it to NEURORIGHT_CODES and decide what reads it in the same change.');
  }
  return NEURORIGHT_CODES.map((code) => {
    const at = childOf(location, code);
    if (!Object.hasOwn(taxonomy, code)) failAt(at, `the glossary defines no "${code}"`, 'Define every code techniques are tagged with.');
    const stated = requireText(taxonomy[code], at, MAX_NEURORIGHT_NAME_LENGTH);
    const fold = FOLD_STATEMENT_PATTERN.exec(stated);
    return fold === null
      ? { code, name: stated, folds_into: null }
      : { code, name: fold[1], folds_into: requireEnum(fold[FOLD_TARGET_GROUP], at, NEURORIGHT_CODES) };
  });
}
