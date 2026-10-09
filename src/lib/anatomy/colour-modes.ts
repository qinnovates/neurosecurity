/**
 * Decides how an atlas structure may be styled. The drawable unit is the atlas
 * structure, and its mark is a function of its full owner set: no function here
 * takes a region and returns a fill. A structure whose owners disagree, are
 * only inside it, or are only partly lit is never filled with one owner's colour.
 *
 * Pure and safe to run in the browser: it reads the index and nothing else.
 */

import { BAND_ORDER } from '@/lib/threat-model/catalog-types';
import type { AnatomyIndex, IndexOwner, IndexStructure, IndexTechnique } from './anatomy-index-types';

export const OWNERSHIP_MARKS = ['solid', 'inside_or_mixed', 'no_data', 'context'] as const;
/**
 * `solid`: filled in the mode's step colour. `inside_or_mixed`: a neutral
 * translucent fill, no mode colour. `no_data`: no fill. `context`: a shape no
 * QIF record maps to, drawn neutral and never coloured by any mode.
 */
export type OwnershipMark = typeof OWNERSHIP_MARKS[number];

export const MARK_REASONS = [
  'single_owner', 'owners_agree', 'partly_lit', 'owners_differ', 'inside_only', 'holds_contained_owner',
  'no_lit_link', 'band_level_only', 'technique_not_drafted', 'no_owner',
] as const;
export type MarkReason = typeof MARK_REASONS[number];

export type ColourMode =
  | { kind: 'band' }
  | { kind: 'technique'; techniqueId: string }
  | { kind: 'niss' }
  | { kind: 'dsm'; cluster: string }
  | { kind: 'stated_targets'; deviceId: string };

/** One owner as a colour mode sees it: whether the mode lights it, and with which values. */
export interface OwnerInMode {
  via: IndexOwner['via'];
  extent_match: IndexOwner['extent_match'];
  lit: boolean;
  values: readonly string[];
}

export interface OwnershipDecision {
  mark: OwnershipMark;
  step: string | null;
  reason: MarkReason;
}

export interface Style extends OwnershipDecision {
  /** False when the step is a code this build has no colour for; the renderer then uses a neutral colour. */
  step_known: boolean;
  /** The reason in words. The list renders it, so nothing depends on telling marks apart by eye. */
  words: string;
}

/** NISS's severity words, lowest first. NISS is a proposed, unreviewed scale. */
export const NISS_STEPS = ['none', 'low', 'medium', 'high', 'critical'] as const;
const STATED_TARGET_STEP = 'stated_target';

const REASON_WORDS: Readonly<Record<MarkReason, string>> = {
  single_owner: 'filled',
  owners_agree: 'filled',
  partly_lit: 'one of the records here',
  owners_differ: 'holds records that differ',
  inside_only: 'somewhere inside this shape',
  holds_contained_owner: 'holds a record that lies somewhere inside this shape',
  no_lit_link: 'no data',
  band_level_only: 'tagged to a band only; no region assessed',
  technique_not_drafted: 'no region link has been drafted for this technique',
  no_owner: 'No QIF record maps here',
};

function isContained(owner: OwnerInMode): boolean {
  return owner.via === 'row' && owner.extent_match === 'contained';
}

/** Lit from inside only: through a row graded `contained`, or through a declared child. */
function isInside(owner: OwnerInMode): boolean {
  return isContained(owner) || owner.via === 'declared_child';
}

/** The ownership table. Every branch but the last refuses a solid fill. */
export function decideOwnershipMark(owners: readonly OwnerInMode[]): OwnershipDecision {
  const unfilled = (mark: OwnershipMark, reason: MarkReason): OwnershipDecision => ({ mark, step: null, reason });
  if (owners.length === 0) return unfilled('context', 'no_owner');
  const litOwners = owners.filter((owner) => owner.lit && owner.values.length > 0);
  if (litOwners.length === 0) return unfilled('no_data', 'no_lit_link');
  const litValues = [...new Set(litOwners.flatMap((owner) => owner.values))];
  if (litValues.length > 1) return unfilled('inside_or_mixed', 'owners_differ');
  if (litOwners.length < owners.length) return unfilled('inside_or_mixed', 'partly_lit');
  if (litOwners.every(isInside)) return unfilled('inside_or_mixed', 'inside_only');
  if (owners.some(isContained)) return unfilled('inside_or_mixed', 'holds_contained_owner');
  return { mark: 'solid', step: litValues[0], reason: owners.length === 1 ? 'single_owner' : 'owners_agree' };
}

type Lighting = Pick<OwnerInMode, 'lit' | 'values'>;
const UNLIT: Lighting = { lit: false, values: [] };

function listLitRegionIds(technique: IndexTechnique): string[] {
  return technique.links.filter((link) => link.lit && link.resolved_region_id !== null).map((link) => link.resolved_region_id as string);
}

function highestNissStep(severities: readonly string[]): string | undefined {
  const rank = (severity: string): number => (NISS_STEPS as readonly string[]).indexOf(severity);
  return [...severities].sort((first, second) => rank(second) - rank(first))[0];
}

/** How each mode lights one owner. Only regions are lit by technique, NISS, DSM and stated-target modes. */
function createLighter(index: AnatomyIndex, mode: ColourMode): (owner: IndexOwner) => Lighting {
  const techniquesLighting = (regionId: string): IndexTechnique[] => index.techniques.filter((technique) => listLitRegionIds(technique).includes(regionId));
  const lightIf = (isLit: boolean, value: string): Lighting => (isLit ? { lit: true, values: [value] } : UNLIT);
  switch (mode.kind) {
    case 'band': {
      const bandsBySubject = new Map(index.subjects.map((subject) => [`${subject.kind}:${subject.id}`, subject.band_ids]));
      return (owner) => ({ lit: true, values: bandsBySubject.get(`${owner.subject_kind}:${owner.subject_id}`) ?? [] });
    }
    case 'technique': {
      const technique = index.techniques.find((candidate) => candidate.id === mode.techniqueId);
      const litRegionIds = technique === undefined ? [] : listLitRegionIds(technique);
      return (owner) => lightIf(owner.subject_kind === 'region' && litRegionIds.includes(owner.subject_id), mode.techniqueId);
    }
    case 'niss':
      return (owner) => {
        const severities = techniquesLighting(owner.subject_id).map((technique) => technique.niss_severity).filter((severity) => severity !== null);
        const step = highestNissStep(severities);
        return step === undefined || owner.subject_kind !== 'region' ? UNLIT : { lit: true, values: [step] };
      };
    case 'dsm':
      return (owner) => lightIf(owner.subject_kind === 'region' && techniquesLighting(owner.subject_id).some((technique) => technique.dsm_cluster === mode.cluster), mode.cluster);
    case 'stated_targets': {
      const targetRegionIds = index.devices.stated_targets.find((device) => device.device_id === mode.deviceId)?.region_ids ?? [];
      return (owner) => lightIf(owner.subject_kind === 'region' && targetRegionIds.includes(owner.subject_id), STATED_TARGET_STEP);
    }
  }
}

function isKnownStep(mode: ColourMode, step: string | null): boolean {
  if (step === null) return true;
  if (mode.kind === 'band') return (BAND_ORDER as readonly string[]).includes(step);
  if (mode.kind === 'niss') return (NISS_STEPS as readonly string[]).includes(step);
  return true;
}

/** A technique that names no region lights nothing: its bands' regions read "no data", with the reason. */
function refineNoData(decision: OwnershipDecision, mode: ColourMode, index: AnatomyIndex): { reason: MarkReason; words: string } {
  const technique = mode.kind === 'technique' ? index.techniques.find((candidate) => candidate.id === mode.techniqueId) : undefined;
  const isUnlitTechniqueMode = mode.kind === 'technique' && decision.reason === 'no_lit_link';
  if (isUnlitTechniqueMode && technique?.scope === 'band_level') {
    return { reason: 'band_level_only', words: `tagged to band ${technique.band_ids.join(', ')} only; no region assessed` };
  }
  if (isUnlitTechniqueMode && (technique === undefined || technique.scope === 'not_drafted')) {
    return { reason: 'technique_not_drafted', words: REASON_WORDS.technique_not_drafted };
  }
  return { reason: decision.reason, words: REASON_WORDS[decision.reason] };
}

/**
 * @returns the style function `(structure, owners, mode) => Style`. `owners` is the structure's full owner set.
 */
export function createStructureStyler(index: AnatomyIndex): (structure: IndexStructure, owners: readonly IndexOwner[], mode: ColourMode) => Style {
  return function styleStructure(_structure, owners, mode) {
    const lightOwner = createLighter(index, mode);
    const decision = decideOwnershipMark(owners.map((owner) => ({ via: owner.via, extent_match: owner.extent_match, ...lightOwner(owner) })));
    return { ...decision, ...refineNoData(decision, mode, index), step_known: isKnownStep(mode, decision.step) };
  };
}
