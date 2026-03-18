/**
 * QIF Dynamic Statistics — ALL counts computed from data sources.
 * NEVER hardcode numbers. Import STATS from this module instead.
 *
 * Sources:
 *   - qtara-registrar.json → techniques, tactics, domains
 *   - bci-landscape.json → companies, devices
 *   - eeg-samples.json → EEG datasets
 */

import registrar from '@shared/qtara-registrar.json';
import landscapeRaw from '@shared/bci-landscape.json';
import eegSamplesRaw from '@shared/eeg-samples.json';

// ── Type helpers ─────────────────────────────────────────────────────

const techniques: any[] = (registrar as any).techniques || [];
const tactics: any[] = (registrar as any).tactics || [];
const landscape: any = landscapeRaw;
const eegSamples: any[] = Array.isArray(eegSamplesRaw) ? eegSamplesRaw : (eegSamplesRaw as any).samples || [];

// ── Compute devices from landscape ──────────────────────────────────

function flattenDevices(): any[] {
  const companies = landscape.companies || landscape;
  if (!Array.isArray(companies)) return [];
  const devices: any[] = [];
  for (const company of companies) {
    for (const device of (company.devices || [])) {
      devices.push({
        ...device,
        company: company.company || company.name,
        companyFunding: company.funding,
        companyEmployees: company.employees,
      });
    }
  }
  return devices;
}

const allDevices = flattenDevices();

// ── Technique statistics ────────────────────────────────────────────

function countBy(arr: any[], field: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of arr) {
    const val = item[field] || 'unknown';
    counts[val] = (counts[val] || 0) + 1;
  }
  return counts;
}

function countUnique(arr: any[], field: string): number {
  return new Set(arr.map(i => i[field]).filter(Boolean)).size;
}

const techniqueSeverity = countBy(techniques, 'severity');
const techniqueStatus = countBy(techniques, 'status');
const techniqueDomain = countBy(techniques, 'tara_domain_primary');
const techniqueMode = countBy(techniques, 'tara_mode');

const dualUseCount = techniques.filter(t =>
  t.tara?.dual_use === 'confirmed' || t.tara?.dual_use === 'probable'
).length;

const fdaStatusCounts: Record<string, number> = {};
for (const t of techniques) {
  const fda = t.tara?.clinical?.fda_status || 'none';
  fdaStatusCounts[fda] = (fdaStatusCounts[fda] || 0) + 1;
}

const physicsTierCounts: Record<string, number> = {};
for (const t of techniques) {
  const tier = t.physics_feasibility?.tier_label || t.physics_feasibility?.tier?.toString() || 'unknown';
  physicsTierCounts[tier] = (physicsTierCounts[tier] || 0) + 1;
}

// ── Device statistics ───────────────────────────────────────────────

const deviceTypes = countBy(allDevices, 'type');
const deviceFDA = countBy(allDevices, 'fda_status');

// ── EEG statistics ──────────────────────────────────────────────────

const eegConditions: Record<string, number> = {};
for (const s of eegSamples) {
  for (const c of (s.condition || s.conditions || [])) {
    eegConditions[c] = (eegConditions[c] || 0) + 1;
  }
}

const eegWithTARA = eegSamples.filter(s => s.taraId || s.tara_id).length;

// ── Conditions derived from techniques ──────────────────────────────

const allConditions = new Set<string>();
for (const t of techniques) {
  for (const c of (t.tara?.clinical?.conditions || [])) {
    allConditions.add(c);
  }
}

// ── Export ───────────────────────────────────────────────────────────

export const STATS = {
  techniques: {
    total: techniques.length,
    bySeverity: techniqueSeverity,
    byStatus: techniqueStatus,
    byDomain: techniqueDomain,
    byMode: techniqueMode,
    byPhysicsTier: physicsTierCounts,
    byFDAStatus: fdaStatusCounts,
    dualUse: dualUseCount,
    domains: countUnique(techniques, 'tara_domain_primary'),
    tactics: tactics.length,
    conditions: allConditions.size,
  },
  devices: {
    total: allDevices.length,
    companies: (landscape.companies || landscape).length || 0,
    byType: deviceTypes,
    byFDA: deviceFDA,
  },
  eeg: {
    total: eegSamples.length,
    withTARA: eegWithTARA,
    byCondition: eegConditions,
  },
  parquet: {
    total: 31, // from prebuild — could be made dynamic by reading catalog
  },
} as const;

/** Convenience re-exports for common counts */
export const TECHNIQUE_COUNT = STATS.techniques.total;
export const DEVICE_COUNT = STATS.devices.total;
export const COMPANY_COUNT = STATS.devices.companies;
export const EEG_COUNT = STATS.eeg.total;
export const DOMAIN_COUNT = STATS.techniques.domains;
export const TACTIC_COUNT = STATS.techniques.tactics;
export const CONDITION_COUNT = STATS.techniques.conditions;

/** Flattened devices for components that need them */
export const ALL_DEVICES = allDevices;

/** Raw data re-exports for Demo Atlas */
export const ALL_TECHNIQUES = techniques;
export const ALL_EEG_SAMPLES = eegSamples;
export const ALL_TACTICS = tactics;
export const ALL_CONDITIONS = [...allConditions].sort();
