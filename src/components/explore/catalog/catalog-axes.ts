/**
 * The axes the catalog can be counted on. Every label is the catalog's own name for the
 * thing, or the Lab's one term for it.
 */

import { DOMAIN_COLORS } from '@/components/atlas/chain-constants';
import { BAND_ORDER, type CatalogTactic, type CatalogTechnique, type TechniqueMode } from '@/lib/threat-model/catalog-types';
import { effectLabelForMode } from '@/lib/threat-model/lab-terms';
import { BAND_GROUP_LABELS, bandGroupOf } from './band-groups';
import type { MatrixAxisItem } from './count-matrix';

const MODES: readonly TechniqueMode[] = ['R', 'M', 'D'];

export const BAND_AXIS: readonly MatrixAxisItem[] = BAND_ORDER.map((bandId) => ({
  id: bandId, label: bandId, title: `Band ${bandId}, ${BAND_GROUP_LABELS[bandGroupOf(bandId)].toLowerCase()}`,
}));

export const EFFECT_AXIS: readonly MatrixAxisItem[] = MODES.map((mode) => ({ id: mode, label: effectLabelForMode(mode) }));

export function buildFamilyAxis(tactics: readonly CatalogTactic[]): MatrixAxisItem[] {
  return tactics.map((tactic) => ({ id: tactic.id, label: tactic.name, title: `${tactic.name} (${tactic.id})` }));
}

/** The catalog's name for a domain code, or the code itself when the catalog names none. */
export function domainLabel(code: string): string {
  return Object.hasOwn(DOMAIN_COLORS, code) ? DOMAIN_COLORS[code as keyof typeof DOMAIN_COLORS].label : code;
}

/** Every domain code a technique carries, in code order. */
export function buildDomainAxis(techniques: readonly CatalogTechnique[]): MatrixAxisItem[] {
  const codes = new Set(techniques.flatMap((technique) => (technique.domain === null || technique.domain === '' ? [] : [technique.domain])));
  return [...codes].sort().map((code) => ({ id: code, label: domainLabel(code), title: `${domainLabel(code)} (${code})` }));
}
