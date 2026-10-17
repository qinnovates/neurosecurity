/**
 * How a technique's evidence is worded, everywhere the Lab words it: register rows, chain
 * steps, themes, Query tables, the CSV and the report all call `describeEvidence`.
 *
 * The catalog grades evidence by tier (see src/lib/evidence-tiers.ts). The tier gives the
 * label, the short label and the rank. The legacy one-word status is read only when a record
 * has no tier, and then only through the catalog's own fallback tier, so the legacy words
 * never reach a reader. A value neither scheme knows is kept under its own word and drawn as
 * "other", so a new value is shown and never hidden.
 */

import {
  EVIDENCE_TIER_GROUP, EVIDENCE_TIER_LABELS, statusToEvidenceTier, type EvidencePopulation, type EvidenceTierCode,
} from '@/lib/evidence-tiers';
import { EVIDENCE_STATUS_RANK } from './catalog-types';

/** Strongest first. The first four are the catalog's tier groups. */
export const EVIDENCE_LEVELS = ['validated', 'demonstrated', 'theoretical', 'speculative', 'other'] as const;
export type EvidenceLevel = typeof EVIDENCE_LEVELS[number];

const TIER_CODES = Object.keys(EVIDENCE_TIER_GROUP) as EvidenceTierCode[];
const TIER_NUMBER_PREFIX = /^Tier \d+ — /;
/** The one rewording of a catalog tier name: the tier is a lab demonstration, and the Lab does not call it proof. */
const REWORDED_TIER_PHRASE = { from: 'Lab-proven', to: 'lab' } as const;

export const NOT_STATED_LABEL = 'Not stated';

export const EVIDENCE_SHORT_LABELS: Readonly<Record<EvidenceTierCode, string>> = {
  validated_rct: 'Validated',
  validated_replication: 'Validated',
  demonstrated_lab: 'Lab',
  demonstrated_case: 'Case study',
  theoretical_modeled: 'Modelled',
  theoretical_proposed: 'Proposed',
  speculative: 'Speculative',
};

/**
 * Where the adjacent CVE records sit, for each population code that means "not a neural-data
 * product". The phrases are the ones EVIDENCE_POPULATION_LABELS in src/lib/evidence-tiers.ts uses.
 */
export const ADJACENT_POPULATION_PHRASES: Readonly<Partial<Record<EvidencePopulation, string>>> = {
  adjacent_clinical: 'clinical data software',
  adjacent_component: 'component technology',
  adjacent_domain: 'a related signal domain',
};
const UNSPECIFIED_ADJACENT_PHRASE = 'adjacent technology';

/**
 * The CVE mapping categories the catalog's tier script counts under `neural_product_cve_count`
 * (NEURAL_PRODUCT_CATEGORIES in src/scripts/migrate-populate-evidence-tier.py). The Lab prints
 * the category names and does not put its own word on what the products are.
 */
export const NEURAL_COUNT_CVE_CATEGORIES: readonly string[] = ['Neural/EEG Systems', 'Implant Telemetry', 'Implant Gateway/Hub'];

/** The population code the same script gives each other category (POPULATION_BY_CATEGORY). A test compares both with the script. */
export const ADJACENT_POPULATION_BY_CVE_CATEGORY: Readonly<Record<string, EvidencePopulation>> = {
  'Medical Data Protocols': 'adjacent_clinical',
  'Backend/Data Systems': 'adjacent_clinical',
  'Bluetooth Protocol': 'adjacent_component',
  'RTOS': 'adjacent_component',
  'IoT Mesh': 'adjacent_component',
  'RF/SDR': 'adjacent_domain',
  'Audio/Acoustic': 'adjacent_domain',
  'EM Fault Injection / Crypto': 'adjacent_domain',
};

/** Printed on a device row: the tier grades the technique, and putting it on this part is the tool's own step. */
export const PLACEMENT_PROVENANCE_LINE =
  'Applying it to this part is this tool\'s placement, drafted with an AI assistant and not yet reviewed by the author.';

export interface EvidenceSource {
  /** The catalog's derived tier code, or null when the record has none. */
  evidenceTier: string | null;
  /** The legacy one-word status. Read only when there is no tier. */
  evidenceStatus?: string | null;
  evidencePopulation?: string | null;
  neuralProductCveCount?: number | null;
  adjacentCveCount?: number | null;
  /** The mapping category of each counted CVE record, one entry per record. Absent when the caller holds no records. */
  cveRecordCategories?: readonly string[] | null;
  evidenceDerivedBy?: string | null;
  evidenceDerivedOn?: string | null;
}

export interface EvidenceContext {
  /** True when the evidence is shown on a part or connection of a device, where placement is the tool's own step. */
  isDeviceRow?: boolean;
}

export interface Evidence {
  level: EvidenceLevel;
  /** The tier's name as the catalog words it, without its number. */
  label: string;
  /** One or two words for a table column. */
  shortLabel: string;
  /** Position by tier, strongest first; everything that is not a tier shares the last place. Used for every sort. */
  rank: number;
  /** How the tier was set, when the catalog names a script; otherwise null. */
  provenanceLine: string | null;
  /** What the CVE records behind the technique are about, when the catalog records the counts; otherwise null. */
  cveLine: string | null;
  /** Set only on a device row. */
  placementLine: string | null;
}

function isTierCode(value: string | null | undefined): value is EvidenceTierCode {
  return typeof value === 'string' && (TIER_CODES as readonly string[]).includes(value);
}

function isRankedStatus(status: string): boolean {
  return (EVIDENCE_STATUS_RANK as readonly string[]).includes(status);
}

function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function tierLabel(tier: EvidenceTierCode): string {
  return EVIDENCE_TIER_LABELS[tier].replace(TIER_NUMBER_PREFIX, '').replace(REWORDED_TIER_PHRASE.from, REWORDED_TIER_PHRASE.to);
}

function describeProvenance(source: EvidenceSource): string | null {
  if (source.evidenceDerivedBy === null || source.evidenceDerivedBy === undefined) return null;
  const when = source.evidenceDerivedOn === null || source.evidenceDerivedOn === undefined ? '' : ` on ${source.evidenceDerivedOn}`;
  return `Tier set by script${when}.`;
}

/** "A", "A and B", "A, B and C" for names that are joined, or with "or" when any of them may hold. */
function joinNames(names: readonly string[], lastWord: 'and' | 'or'): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} ${lastWord} ${names[names.length - 1]}`;
}

/** The catalog categories the neural count was taken from: the ones this technique's records are in, or all of them when no records are held. */
function describeNeuralCategories(recordCategories: readonly string[] | null): string {
  const present = recordCategories === null ? [] : NEURAL_COUNT_CVE_CATEGORIES.filter((category) => recordCategories.includes(category));
  if (present.length === 0) return `categories ${joinNames(NEURAL_COUNT_CVE_CATEGORIES, 'or')}`;
  return `${present.length === 1 ? 'category' : 'categories'} ${joinNames(present, 'and')}`;
}

/** One population phrase only when every adjacent record of the technique is in a category of that population. */
function describeAdjacentPopulation(recordCategories: readonly string[] | null): string {
  if (recordCategories === null) return UNSPECIFIED_ADJACENT_PHRASE;
  const adjacent = recordCategories.filter((category) => !NEURAL_COUNT_CVE_CATEGORIES.includes(category));
  const populations = new Set(adjacent.map((category) => ADJACENT_POPULATION_BY_CVE_CATEGORY[category] ?? null));
  const [only] = populations;
  if (populations.size !== 1 || only === null) return UNSPECIFIED_ADJACENT_PHRASE;
  return ADJACENT_POPULATION_PHRASES[only] ?? UNSPECIFIED_ADJACENT_PHRASE;
}

function describeCveRecords(source: EvidenceSource): string | null {
  const neural = source.neuralProductCveCount;
  const adjacent = source.adjacentCveCount;
  if (neural === null || neural === undefined || adjacent === null || adjacent === undefined) return null;
  const recordCategories = source.cveRecordCategories ?? null;
  if (neural > 0) return `CVE records: ${neural} in the catalog's ${describeNeuralCategories(recordCategories)}; ${adjacent === 0 ? 'none' : adjacent} in other categories.`;
  if (adjacent === 0) return 'CVE records: none in any product.';
  return `CVE records: none in a neural-data product; ${adjacent} in ${describeAdjacentPopulation(recordCategories)}.`;
}

type Grade = Pick<Evidence, 'level' | 'label' | 'shortLabel' | 'rank'>;

function gradeOfTier(tier: EvidenceTierCode): Grade {
  return { level: EVIDENCE_TIER_GROUP[tier], label: tierLabel(tier), shortLabel: EVIDENCE_SHORT_LABELS[tier], rank: TIER_CODES.indexOf(tier) };
}

function gradeOf(source: EvidenceSource): Grade {
  if (isTierCode(source.evidenceTier)) return gradeOfTier(source.evidenceTier);
  const word = (source.evidenceTier ?? source.evidenceStatus ?? '').trim();
  // A record with no tier and a legacy status the catalog ranks takes the catalog's fallback tier for that status.
  if (source.evidenceTier === null && isRankedStatus(word.toUpperCase())) return gradeOfTier(statusToEvidenceTier(word));
  const label = word === '' ? NOT_STATED_LABEL : sentenceCase(word.replaceAll('_', ' '));
  return { level: 'other', label, shortLabel: label, rank: TIER_CODES.length };
}

/** The one place evidence is put into words. */
export function describeEvidence(source: EvidenceSource, context: EvidenceContext = {}): Evidence {
  return {
    ...gradeOf(source),
    provenanceLine: describeProvenance(source),
    cveLine: describeCveRecords(source),
    placementLine: context.isDeviceRow === true ? PLACEMENT_PROVENANCE_LINE : null,
  };
}

/** Sort key for anything that carries a tier: strongest first, by tier only. */
export function evidenceRankOf(source: EvidenceSource): number {
  return gradeOf(source).rank;
}

/** The weakest evidence among several, by tier rank; the first of equals. Null for an empty list. */
export function weakestEvidenceOf<Item extends EvidenceSource>(items: readonly Item[]): Item | null {
  return items.reduce<Item | null>((weakest, item) => (weakest === null || evidenceRankOf(item) > evidenceRankOf(weakest) ? item : weakest), null);
}

export interface EvidenceCount extends Grade {
  count: number;
}

/** One entry per distinct evidence value present, strongest first. */
export function countByEvidence(items: readonly EvidenceSource[]): EvidenceCount[] {
  const counts = new Map<string, EvidenceCount>();
  for (const item of items) {
    const grade = gradeOf(item);
    const entry = counts.get(grade.label);
    if (entry === undefined) counts.set(grade.label, { ...grade, count: 1 });
    else entry.count += 1;
  }
  return [...counts.values()].sort((left, right) => left.rank - right.rank || left.label.localeCompare(right.label));
}

/** One entry per level, strongest first, including levels with a count of zero. */
export function countByEvidenceLevel(items: readonly EvidenceSource[]): { level: EvidenceLevel; count: number }[] {
  const byLevel = new Map<EvidenceLevel, number>(EVIDENCE_LEVELS.map((level) => [level, 0]));
  for (const item of items) {
    const { level } = gradeOf(item);
    byLevel.set(level, (byLevel.get(level) ?? 0) + 1);
  }
  return EVIDENCE_LEVELS.map((level) => ({ level, count: byLevel.get(level) ?? 0 }));
}
