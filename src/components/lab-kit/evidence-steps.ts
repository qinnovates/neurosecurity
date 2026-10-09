/**
 * The seven silhouettes the evidence mark can take, worked out from the catalog's tier code.
 * The tiers themselves live in src/lib/evidence-tiers.ts and are not changed here: this file
 * only says which drawing and which short word each one gets.
 */
import { statusToEvidenceTier, type EvidenceTierCode } from '@/lib/evidence-tiers';
import { EVIDENCE_SHORT_LABELS, NOT_STATED_LABEL, describeEvidence, type Evidence, type EvidenceCount, type EvidenceLevel } from '@/lib/threat-model/evidence-levels';

/** Strongest first. */
export const EVIDENCE_STEPS = ['validated', 'demonstrated-lab', 'demonstrated-case', 'theoretical-modelled', 'theoretical-proposed', 'speculative', 'not-stated'] as const;
export type EvidenceStep = typeof EVIDENCE_STEPS[number];

export const EVIDENCE_STEP_BY_TIER: Readonly<Record<EvidenceTierCode, EvidenceStep>> = {
  validated_rct: 'validated',
  validated_replication: 'validated',
  demonstrated_lab: 'demonstrated-lab',
  demonstrated_case: 'demonstrated-case',
  theoretical_modeled: 'theoretical-modelled',
  theoretical_proposed: 'theoretical-proposed',
  speculative: 'speculative',
};

const TIER_CODES = Object.keys(EVIDENCE_STEP_BY_TIER) as EvidenceTierCode[];

function tiersOfStep(step: EvidenceStep): EvidenceTierCode[] {
  return TIER_CODES.filter((code) => EVIDENCE_STEP_BY_TIER[code] === step);
}

/** One or two words per step, taken from the short tier labels in evidence-levels.ts so the kit and the tables agree. */
export const EVIDENCE_STEP_SHORT_LABELS = Object.fromEntries(
  EVIDENCE_STEPS.map((step) => [step, step === 'not-stated' ? NOT_STATED_LABEL : EVIDENCE_SHORT_LABELS[tiersOfStep(step)[0]]]),
) as Readonly<Record<EvidenceStep, string>>;

/** The words the interface shows for a tier, exactly as `describeEvidence` produces them. */
function tierName(code: EvidenceTierCode): string {
  return describeEvidence({ evidenceTier: code, evidenceStatus: null }).label;
}

const TIER_BY_NAME: ReadonlyMap<string, EvidenceTierCode> = new Map(TIER_CODES.map((code) => [tierName(code), code]));

/** A record known only by its group is drawn by the same fallback the catalog uses for a legacy status. */
const STATUS_BY_LEVEL: Readonly<Record<Exclude<EvidenceLevel, 'validated' | 'other'>, string>> = {
  demonstrated: 'DEMONSTRATED',
  theoretical: 'THEORETICAL',
  speculative: 'SPECULATIVE',
};

/** Which silhouette a described evidence value takes. */
export function stepForEvidence(evidence: Pick<Evidence, 'level' | 'label'>): EvidenceStep {
  const tier = TIER_BY_NAME.get(evidence.label);
  if (tier !== undefined) return EVIDENCE_STEP_BY_TIER[tier];
  if (evidence.level === 'other') return 'not-stated';
  if (evidence.level === 'validated') return 'validated';
  return EVIDENCE_STEP_BY_TIER[statusToEvidenceTier(STATUS_BY_LEVEL[evidence.level])];
}

/**
 * The short word beside the mark. A tier gets its short name; a value that is not a tier
 * keeps its own word, so nothing the catalog says is replaced by a guess.
 */
export function shortLabelForEvidence(evidence: Pick<Evidence, 'level' | 'label'>): string {
  if (TIER_BY_NAME.has(evidence.label) || evidence.label === NOT_STATED_LABEL) return EVIDENCE_STEP_SHORT_LABELS[stepForEvidence(evidence)];
  return evidence.label;
}

/** The full tier names that share a step, for a legend. "Not stated" has no tier. */
export function tierNamesForStep(step: EvidenceStep): string[] {
  if (step === 'not-stated') return [NOT_STATED_LABEL];
  return tiersOfStep(step).map(tierName);
}

/** One integer per step, including steps with none, from counts by evidence value. */
export function countByEvidenceStep(counts: readonly EvidenceCount[]): Record<EvidenceStep, number> {
  const byStep = Object.fromEntries(EVIDENCE_STEPS.map((step) => [step, 0])) as Record<EvidenceStep, number>;
  for (const entry of counts) byStep[stepForEvidence(entry)] += entry.count;
  return byStep;
}
