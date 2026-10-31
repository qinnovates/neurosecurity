/**
 * Folding the registrar's six neurorights codes onto the four the ethics file
 * defines, with the folding kept as a statement rather than performed quietly.
 *
 * The registrar tags techniques with MP, CL, MI, PC, DI and IDA, and states two
 * of those fold: "Dynamical Integrity (folded into MI)" and "Informational
 * Disassociation (folded into MP)". The index carries each code's fold as a
 * field (`neurorights_taxonomy[].folds_into`), so nothing here parses prose.
 *
 * What the site did before this module: it counted MP, CL, MI and PC and
 * dropped DI and IDA on the floor, so 77 DI tags and 6 IDA tags were invisible
 * and the four counts were wrong in the direction that flattered them. Folding
 * is a choice someone made; this module computes it, records how much of each
 * total it accounts for, and hands the caller the words to put on screen.
 *
 * Counts are of distinct techniques. A technique tagged both MI and DI counts
 * once towards MI.
 */

import type { IndexNeurorightCode, NeurorightCode } from '@/lib/anatomy/technique-tags';

/** One code that stands on its own, after the codes that fold into it have been counted in. */
export interface FoldedRight {
  code: NeurorightCode;
  name: string;
  /** Distinct techniques carrying this code or any code folded into it. */
  total: number;
  /** Of `total`, the techniques that carry no tag for this code itself and reach it only through a fold. */
  reachedOnlyByFold: number;
  /** Each code the registrar folds into this one, with the techniques carrying it. */
  foldedIn: { code: NeurorightCode; name: string; count: number }[];
}

export interface NeurorightsFold {
  /** The standing codes, in the registrar's own order. */
  rights: FoldedRight[];
  /** Techniques carrying a neurorights record of any kind. */
  recordedTechniqueCount: number;
  /** Techniques looked at, recorded or not. */
  techniqueCount: number;
  /** One sentence per fold the registrar states, for the reader to see beside the chart. */
  foldStatements: string[];
}

export class NeurorightsFoldError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NeurorightsFoldError';
  }
}

/** The codes that stand on their own: the neurorights, once the codes that fold are set aside. */
export function listStandingNeurorights(taxonomy: readonly IndexNeurorightCode[]): IndexNeurorightCode[] {
  return taxonomy.filter((entry) => entry.folds_into === null);
}

/**
 * How many distinct neurorights one technique's raw codes reach. `codes.length`
 * is not that number: a technique tagged MI and DI reaches one right, and a raw
 * count can exceed the number of rights there are.
 */
export function countRightsReached(taxonomy: readonly IndexNeurorightCode[], codes: readonly string[]): number {
  const foldTargetByCode = new Map(taxonomy.map((entry) => [entry.code as string, entry.folds_into ?? entry.code]));
  const reached = new Set(codes.map((code) => {
    const target = foldTargetByCode.get(code);
    if (target === undefined) throw new NeurorightsFoldError(`A technique carries "${code}", which the glossary does not define.`);
    return target;
  }));
  return reached.size;
}

/**
 * @param taxonomy The registrar's glossary as the index carries it: every code, its name, and the code it folds into.
 * @param records One entry per technique: its raw, unfolded codes, or null for a technique with no record at all.
 */
export function foldNeurorights(
  taxonomy: readonly IndexNeurorightCode[],
  records: readonly (readonly NeurorightCode[] | null)[],
): NeurorightsFold {
  const defined = new Map(taxonomy.map((entry) => [entry.code, entry]));
  const standing = listStandingNeurorights(taxonomy);
  if (standing.length === 0) throw new NeurorightsFoldError('The glossary defines no code that stands on its own, so there is nothing to fold onto.');

  for (const entry of taxonomy) {
    if (entry.folds_into === null) continue;
    const target = defined.get(entry.folds_into);
    if (target === undefined) throw new NeurorightsFoldError(`${entry.code} folds into ${entry.folds_into}, which the glossary does not define.`);
    if (target.folds_into !== null) throw new NeurorightsFoldError(`${entry.code} folds into ${entry.folds_into}, which folds again. A fold target must stand on its own.`);
  }

  const totals = new Map(standing.map((entry) => [entry.code, 0]));
  const onlyByFold = new Map(standing.map((entry) => [entry.code, 0]));
  const foldedCounts = new Map(taxonomy.filter((entry) => entry.folds_into !== null).map((entry) => [entry.code, 0]));
  let recordedTechniqueCount = 0;

  for (const codes of records) {
    if (codes === null) continue;
    recordedTechniqueCount += 1;
    const held = new Set(codes);
    for (const code of held) {
      if (!defined.has(code)) throw new NeurorightsFoldError(`A technique carries "${code}", which the glossary does not define.`);
      if (foldedCounts.has(code)) foldedCounts.set(code, (foldedCounts.get(code) ?? 0) + 1);
    }
    for (const entry of standing) {
      const isTaggedDirectly = held.has(entry.code);
      const foldedInto = taxonomy.some((candidate) => candidate.folds_into === entry.code && held.has(candidate.code));
      if (!isTaggedDirectly && !foldedInto) continue;
      totals.set(entry.code, (totals.get(entry.code) ?? 0) + 1);
      if (!isTaggedDirectly) onlyByFold.set(entry.code, (onlyByFold.get(entry.code) ?? 0) + 1);
    }
  }

  const rights: FoldedRight[] = standing.map((entry) => ({
    code: entry.code,
    name: entry.name,
    total: totals.get(entry.code) ?? 0,
    reachedOnlyByFold: onlyByFold.get(entry.code) ?? 0,
    foldedIn: taxonomy
      .filter((candidate) => candidate.folds_into === entry.code)
      .map((candidate) => ({ code: candidate.code, name: candidate.name, count: foldedCounts.get(candidate.code) ?? 0 })),
  }));

  const foldStatements = taxonomy
    .filter((entry) => entry.folds_into !== null)
    .map((entry) => {
      const target = defined.get(entry.folds_into as NeurorightCode);
      const count = foldedCounts.get(entry.code) ?? 0;
      return `The registrar folds ${entry.code} (${entry.name}) into ${entry.folds_into} (${target?.name ?? entry.folds_into}): ${count} techniques carry it.`;
    });

  return { rights, recordedTechniqueCount, techniqueCount: records.length, foldStatements };
}
