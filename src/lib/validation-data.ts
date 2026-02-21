/**
 * QIF Validation Data — adapter over shared/validation-registry.json
 * Single source of truth: all validation entries, tiers, and not-yet-tested items.
 */

import registry from '@shared/validation-registry.json';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type ValidationTierId = 'simulation' | 'independent' | 'disclosed' | 'analytical' | 'cross_ai' | 'clinical' | 'hardware';
export type ValidationStatus = 'pass' | 'pass_with_issues' | 'confirmed' | 'fail';

export interface ValidationTier {
  id: ValidationTierId;
  label: string;
  color: string;
  description: string;
}

export interface ValidationEntry {
  id: string;
  component: string;
  category: string;
  tiers: ValidationTierId[];
  status: ValidationStatus;
  summary: string;
  methodology: string;
  results: string[];
  limitations: string[];
  source_docs: string[];
  related_tara_ids: string[];
  date: string;
}

export interface NotTestedItem {
  component: string;
  reason: string;
  required: string[];
}

// ═══════════════════════════════════════════════════════════════
// Data
// ═══════════════════════════════════════════════════════════════

export const VALIDATION_TIERS: ValidationTier[] = registry.tiers as ValidationTier[];

export const VALIDATION_ENTRIES: ValidationEntry[] = registry.entries as ValidationEntry[];

export const NOT_TESTED: NotTestedItem[] = registry.not_tested as NotTestedItem[];

// ═══════════════════════════════════════════════════════════════
// Color Maps
// ═══════════════════════════════════════════════════════════════

export const TIER_COLORS: Record<ValidationTierId, { bg: string; border: string; text: string }> = {
  simulation: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#3b82f6' },
  independent: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981' },
  disclosed: { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)', text: '#8b5cf6' },
  analytical: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' },
  cross_ai: { bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.3)', text: '#06b6d4' },
  clinical: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' },
  hardware: { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.3)', text: '#ec4899' },
};

export const STATUS_COLORS: Record<ValidationStatus, { bg: string; text: string }> = {
  pass: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981' },
  pass_with_issues: { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b' },
  confirmed: { bg: 'rgba(139, 92, 246, 0.12)', text: '#8b5cf6' },
  fail: { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444' },
};

export const STATUS_LABELS: Record<ValidationStatus, string> = {
  pass: 'Pass',
  pass_with_issues: 'Pass (with issues)',
  confirmed: 'Confirmed',
  fail: 'Fail',
};

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

/** Get tier metadata by ID */
export function getTierMeta(tierId: ValidationTierId): ValidationTier | undefined {
  return VALIDATION_TIERS.find(t => t.id === tierId);
}

/** Get all entries that include a specific tier */
export function getEntriesByTier(tierId: ValidationTierId): ValidationEntry[] {
  return VALIDATION_ENTRIES.filter(e => e.tiers.includes(tierId));
}

/** Get all entries in a specific category */
export function getEntriesByCategory(category: string): ValidationEntry[] {
  return VALIDATION_ENTRIES.filter(e => e.category === category);
}

/** Get validation entry for a TARA technique ID (if any) */
export function getValidationForTechnique(taraId: string): ValidationEntry | undefined {
  return VALIDATION_ENTRIES.find(e => e.related_tara_ids.includes(taraId));
}

/** Summary statistics */
export function getValidationStats() {
  const tierCounts: Record<string, number> = {};
  for (const tier of VALIDATION_TIERS) {
    tierCounts[tier.id] = VALIDATION_ENTRIES.filter(e => e.tiers.includes(tier.id as ValidationTierId)).length;
  }

  const statusCounts: Record<string, number> = {};
  for (const entry of VALIDATION_ENTRIES) {
    statusCounts[entry.status] = (statusCounts[entry.status] ?? 0) + 1;
  }

  const categoryCounts: Record<string, number> = {};
  for (const entry of VALIDATION_ENTRIES) {
    categoryCounts[entry.category] = (categoryCounts[entry.category] ?? 0) + 1;
  }

  return {
    totalTested: VALIDATION_ENTRIES.length,
    totalNotTested: NOT_TESTED.length,
    onRealHardware: tierCounts['hardware'] ?? 0,
    onHumanSubjects: tierCounts['clinical'] ?? 0,
    tierCounts,
    statusCounts,
    categoryCounts,
  };
}
