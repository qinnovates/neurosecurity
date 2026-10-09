/**
 * The Lab's words for where a technique stands against a device, what it does, and how it
 * gets in. Every screen, table and export reads them from here, so one idea has one name.
 */

import type { CatalogSeverity, TechniqueMode } from './catalog-types';
import type { EntryPath } from './reference-data-types';
import type { ThreatGoal } from './report-types';

/** Where one catalog technique stands against the device in focus. Every technique has exactly one. */
export const SCOPE_TERMS = ['applies', 'would_apply_if', 'reviewed_outside', 'not_assessed'] as const;
export type ScopeTerm = typeof SCOPE_TERMS[number];

export const SCOPE_TERM_LABELS: Readonly<Record<ScopeTerm, string>> = {
  applies: 'Applies to this device',
  would_apply_if: 'Would apply if (condition)',
  reviewed_outside: 'Reviewed, outside the device',
  not_assessed: 'Not assessed',
};

/**
 * The same four terms for a narrow table column headed "On this device". Each is the opening
 * words of the full label and nothing else, so the short form says nothing the full one does not.
 */
export const SCOPE_TERM_SHORT_LABELS: Readonly<Record<ScopeTerm, string>> = {
  applies: 'Applies',
  would_apply_if: 'Would apply if',
  reviewed_outside: 'Reviewed, outside',
  not_assessed: 'Not assessed',
};

/** The second term with its condition filled in, for one technique. */
export function wouldApplyIfLabel(condition: string): string {
  return SCOPE_TERM_LABELS.would_apply_if.replace('(condition)', condition);
}

/** The reason printed for a technique with no placement decision. */
export const NOT_ASSESSED_REASON = 'No placement decision recorded.';

export const EFFECT_HEADING = 'Effect';
export const EFFECT_LABELS: Readonly<Record<ThreatGoal, string>> = { read: 'Read', change: 'Change', deny: 'Deny' };
export const GOAL_BY_MODE: Readonly<Record<TechniqueMode, ThreatGoal>> = { R: 'read', M: 'change', D: 'deny' };

/** The effect label for a catalog mode code. */
export function effectLabelForMode(mode: TechniqueMode): string {
  return EFFECT_LABELS[GOAL_BY_MODE[mode]];
}

export const CATALOG_SEVERITY_HEADING = 'Catalog severity';
export const CATALOG_SEVERITY_LABELS: Readonly<Record<CatalogSeverity, string>> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

export const TECHNIQUE_FAMILY_HEADING = 'Technique family';

export const ENTRY_PATH_HEADING = 'How it gets in';
export const ENTRY_PATH_LABELS: Readonly<Record<EntryPath, string>> = {
  device_systems: 'Through its systems',
  neural_interface: 'At the neural interface',
  senses: 'Through the senses',
  around_device: 'Around the device',
};
