/**
 * TARA Projection Configuration — as-code single source of truth
 *
 * Defines the four TARA projections (Security, Clinical, Governance, Engineering)
 * and all dimension-specific rendering: cell colors, stat rows, filter chips,
 * drawer detail renderers, and grid explanation text.
 *
 * Every projection is data-driven from this config. No hardcoded projection
 * logic lives in the Astro template or inline JS.
 */

import {
  SEVERITY_COLORS,
  STATUS_COLORS,
  DUAL_USE_COLORS,
  FDA_STATUS_COLORS,
  CONSENT_TIER_COLORS,
  COUPLING_COLORS,
  getThreatStats,
  getStatusStats,
  getTaraStats,
  type ThreatVector,
  type Severity,
  type Status,
  type DualUse,
  type ConsentTier,
  type FdaStatus,
} from './threat-data';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type ProjectionId = 'security' | 'clinical' | 'governance' | 'engineering';

export interface DimensionValue {
  key: string;
  label: string;
  color: string;      // dot/badge text color
  bg: string;         // badge background
  border?: string;    // badge border
}

export interface FilterGroup {
  label: string;
  attr: string;       // data-attribute name on filter chips
  values: DimensionValue[];
}

export interface StatRow {
  label: string;
  items: { key: string; label: string; count: number; dotColor: string }[];
}

export interface ProjectionConfig {
  id: ProjectionId;
  label: string;
  /** CSS class prefix for cell colors: map-cell--{prefix}-{value} */
  cellClassPrefix: string;
  /** How to extract the ranking value from a threat for cell coloring */
  getCellValue: (t: ThreatVector) => string | null;
  /** Value ranking order — hottest first */
  valueRanking: string[];
  /** Build stat rows for the stats bar */
  buildStats: () => StatRow[];
  /** Filter groups (dimension-specific, not zone/search) */
  buildFilters: () => FilterGroup[];
  /** Check if a threat passes dimension filters */
  matchesFilters: (t: ThreatVector, activeValues: Record<string, Set<string>>) => boolean;
  /** Render drawer detail HTML for a single threat */
  renderDetail: (t: ThreatVector) => string;
  /** Explanation text for "How to read this grid" */
  explanation: { title: string; body: string };
}

// ═══════════════════════════════════════════════════════════════
// Shared badge renderer
// ═══════════════════════════════════════════════════════════════

function badge(text: string, bg: string, color: string, border?: string): string {
  const b = border ? `border:1px solid ${border};` : '';
  return `<span style="display:inline-block;padding:0.1rem 0.4rem;border-radius:99px;font-size:0.6rem;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;background:${bg};color:${color};${b}">${text}</span>`;
}

function dlRow(dt: string, dd: string, ddStyle?: string): string {
  const s = ddStyle ? ` style="${ddStyle}"` : '';
  return `<dt>${dt}</dt><dd${s}>${dd}</dd>`;
}

// ═══════════════════════════════════════════════════════════════
// Security Projection (existing behavior)
// ═══════════════════════════════════════════════════════════════

const STATUS_BADGE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  CONFIRMED: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  DEMONSTRATED: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  THEORETICAL: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
  EMERGING: { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: 'rgba(139,92,246,0.2)' },
};

const securityProjection: ProjectionConfig = {
  id: 'security',
  label: 'Security',
  cellClassPrefix: 'sev',
  getCellValue: (t) => t.severity,
  valueRanking: ['critical', 'high', 'medium', 'low'],

  buildStats: () => {
    const stats = getThreatStats();
    const statusStats = getStatusStats();
    return [
      {
        label: 'Status',
        items: [
          { key: 'CONFIRMED', label: 'Confirmed', count: statusStats.CONFIRMED, dotColor: '#ef4444' },
          { key: 'DEMONSTRATED', label: 'Demonstrated', count: statusStats.DEMONSTRATED, dotColor: '#f59e0b' },
          { key: 'THEORETICAL', label: 'Theoretical', count: statusStats.THEORETICAL, dotColor: '#94a3b8' },
          { key: 'EMERGING', label: 'Emerging', count: statusStats.EMERGING, dotColor: '#8b5cf6' },
        ],
      },
      {
        label: 'Severity',
        items: [
          { key: 'total', label: 'Total', count: stats.total, dotColor: '' },
          { key: 'critical', label: 'Critical', count: stats.critical, dotColor: '#ef4444' },
          { key: 'high', label: 'High', count: stats.high, dotColor: '#f59e0b' },
          { key: 'medium', label: 'Medium', count: stats.medium, dotColor: '#eab308' },
          ...(stats.low > 0 ? [{ key: 'low', label: 'Low', count: stats.low, dotColor: '#94a3b8' }] : []),
        ],
      },
    ];
  },

  buildFilters: () => [
    {
      label: 'Severity',
      attr: 'severity',
      values: [
        { key: 'critical', label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
        { key: 'high', label: 'High', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
        { key: 'medium', label: 'Medium', color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
        { key: 'low', label: 'Low', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
      ],
    },
    {
      label: 'Status',
      attr: 'status',
      values: [
        { key: 'CONFIRMED', label: 'Confirmed', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
        { key: 'DEMONSTRATED', label: 'Demonstrated', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
        { key: 'THEORETICAL', label: 'Theoretical', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
        { key: 'EMERGING', label: 'Emerging', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
      ],
    },
  ],

  matchesFilters: (t, activeValues) => {
    const sevSet = activeValues['severity'];
    const statusSet = activeValues['status'];
    if (sevSet && !sevSet.has(t.severity)) return false;
    if (statusSet && !statusSet.has(t.status)) return false;
    return true;
  },

  renderDetail: (t) => {
    const sc = STATUS_BADGE_COLORS[t.status] || STATUS_BADGE_COLORS.THEORETICAL;
    const statusBdg = badge(t.status, sc.bg, sc.color, sc.border);
    let html = `<div class="detail-threat-name">${t.name} <span class="sev-badge sev-badge--${t.severity}">${t.severity}</span> ${statusBdg}</div>`;
    html += `<div class="detail-threat-id">${t.id}</div>`;
    html += '<dl class="detail-meta">';
    html += dlRow('Bands', t.bandsStr);
    if (t.coupling) html += dlRow('Coupling', t.coupling);
    if (t.access) html += dlRow('Access', t.access);
    const detColor = t.classicalDetection === 'Yes' ? '#10b981' : t.classicalDetection === 'Partial' ? '#f59e0b' : '#ef4444';
    html += dlRow('Classical', t.classicalDetection, `color:${detColor}`);
    html += dlRow('Quantum', t.quantumDetection, 'color:#8b5cf6');
    html += '</dl>';
    html += `<div class="detail-description">${t.description}</div>`;
    if (t.qnis && t.qnis.score > 0) {
      html += `<div class="detail-qnis">QNIS ${t.qnis.score.toFixed(1)} (${t.qnis.severity}) \u2014 ${t.qnis.vector}</div>`;
    }
    html += `<div class="detail-tactic">${t.tactic}</div>`;
    if (t.crossRefs?.secondary_tactics?.length) {
      html += `<div class="detail-tactic">Also: ${t.crossRefs.secondary_tactics.join(', ')}</div>`;
    }
    if (t.sources?.length) {
      html += `<div class="detail-sources">Sources: ${t.sources.join('; ')}</div>`;
    }
    return html;
  },

  explanation: {
    title: 'Security projection',
    body: `<div><strong class="text-[var(--color-text-primary)]">Severity colors</strong> \u2014 Damage potential if the attack succeeds. <span class="sev-badge sev-badge--critical">critical</span> <span class="sev-badge sev-badge--high">high</span> <span class="sev-badge sev-badge--medium">medium</span> <span class="sev-badge sev-badge--low">low</span></div>
<div><strong class="text-[var(--color-text-primary)]">Status badges</strong> \u2014 Evidence level. <span class="status-badge status-badge--CONFIRMED">confirmed</span> = real-world documented. <span class="status-badge status-badge--DEMONSTRATED">demonstrated</span> = lab-proven. <span class="status-badge status-badge--THEORETICAL">theoretical</span> = plausible. <span class="status-badge status-badge--EMERGING">emerging</span> = newly identified.</div>`,
  },
};

// ═══════════════════════════════════════════════════════════════
// Clinical Projection
// ═══════════════════════════════════════════════════════════════

const clinicalProjection: ProjectionConfig = {
  id: 'clinical',
  label: 'Clinical',
  cellClassPrefix: 'du',
  getCellValue: (t) => t.tara?.dual_use ?? null,
  valueRanking: ['confirmed', 'probable', 'possible', 'silicon_only'],

  buildStats: () => {
    const ts = getTaraStats();
    return [
      {
        label: 'Dual-Use',
        items: [
          { key: 'confirmed', label: 'Confirmed', count: ts.dualUse.confirmed, dotColor: '#10b981' },
          { key: 'probable', label: 'Probable', count: ts.dualUse.probable, dotColor: '#06b6d4' },
          { key: 'possible', label: 'Possible', count: ts.dualUse.possible, dotColor: '#8b5cf6' },
          { key: 'silicon_only', label: 'Silicon Only', count: ts.dualUse.silicon_only, dotColor: '#94a3b8' },
        ],
      },
      {
        label: 'FDA Status',
        items: [
          { key: 'cleared', label: 'Cleared', count: ts.fdaStatus.cleared, dotColor: '#10b981' },
          { key: 'approved', label: 'Approved', count: ts.fdaStatus.approved, dotColor: '#22c55e' },
          { key: 'breakthrough', label: 'Breakthrough', count: ts.fdaStatus.breakthrough, dotColor: '#06b6d4' },
          { key: 'investigational', label: 'Investigational', count: ts.fdaStatus.investigational, dotColor: '#f59e0b' },
          { key: 'none', label: 'None', count: ts.fdaStatus.none, dotColor: '#94a3b8' },
        ],
      },
    ];
  },

  buildFilters: () => [
    {
      label: 'Dual-Use',
      attr: 'dualuse',
      values: [
        { key: 'confirmed', label: 'Confirmed', color: '#10b981', bg: DUAL_USE_COLORS.confirmed.bg },
        { key: 'probable', label: 'Probable', color: '#06b6d4', bg: DUAL_USE_COLORS.probable.bg },
        { key: 'possible', label: 'Possible', color: '#8b5cf6', bg: DUAL_USE_COLORS.possible.bg },
        { key: 'silicon_only', label: 'Silicon Only', color: '#94a3b8', bg: DUAL_USE_COLORS.silicon_only.bg },
      ],
    },
    {
      label: 'FDA Status',
      attr: 'fda',
      values: [
        { key: 'cleared', label: 'Cleared', color: '#10b981', bg: FDA_STATUS_COLORS.cleared.bg },
        { key: 'approved', label: 'Approved', color: '#22c55e', bg: FDA_STATUS_COLORS.approved.bg },
        { key: 'breakthrough', label: 'Breakthrough', color: '#06b6d4', bg: FDA_STATUS_COLORS.breakthrough.bg },
        { key: 'investigational', label: 'Investigational', color: '#f59e0b', bg: FDA_STATUS_COLORS.investigational.bg },
        { key: 'none', label: 'None', color: '#94a3b8', bg: FDA_STATUS_COLORS.none.bg },
      ],
    },
  ],

  matchesFilters: (t, activeValues) => {
    const duSet = activeValues['dualuse'];
    const fdaSet = activeValues['fda'];
    if (duSet && !duSet.has(t.tara?.dual_use ?? '')) return false;
    if (fdaSet) {
      const fdaVal = t.tara?.clinical?.fda_status ?? 'none';
      if (!fdaSet.has(fdaVal)) return false;
    }
    return true;
  },

  renderDetail: (t) => {
    const du = t.tara?.dual_use ?? 'silicon_only';
    const duC = DUAL_USE_COLORS[du as DualUse];
    const duBdg = badge(du.replace('_', ' '), duC.bg, duC.text, duC.border);

    let html = `<div class="detail-threat-name">${t.name} ${duBdg}</div>`;
    html += `<div class="detail-threat-id">${t.id}</div>`;

    if (t.tara?.clinical) {
      const c = t.tara.clinical;
      const fdaC = FDA_STATUS_COLORS[c.fda_status as FdaStatus] ?? FDA_STATUS_COLORS.none;
      const fdaBdg = badge(c.fda_status, fdaC.bg, fdaC.text);

      html += `<div style="margin:0.5rem 0;font-size:0.85rem;color:var(--color-text-primary);font-weight:600;">${c.therapeutic_analog}</div>`;
      html += `<div style="margin-bottom:0.5rem;">${fdaBdg} <span style="font-size:0.7rem;color:var(--color-text-faint);margin-left:0.3rem;">Evidence: ${c.evidence_level}</span></div>`;

      if (c.conditions.length) {
        html += '<div style="font-size:0.75rem;color:var(--color-text-muted);margin-bottom:0.4rem;"><strong>Conditions:</strong></div>';
        html += '<ul style="font-size:0.75rem;color:var(--color-text-muted);margin:0 0 0.5rem 1rem;padding:0;">';
        for (const cond of c.conditions) {
          html += `<li>${cond}</li>`;
        }
        html += '</ul>';
      }

      if (c.safe_parameters) {
        html += `<div style="font-size:0.75rem;color:var(--color-text-muted);"><strong>Safe parameters:</strong> ${c.safe_parameters}</div>`;
      }

      if (c.sources.length) {
        html += `<div class="detail-sources">Clinical sources: ${c.sources.join('; ')}</div>`;
      }
    } else {
      html += '<div style="font-size:0.8rem;color:var(--color-text-faint);font-style:italic;margin-top:0.5rem;">No therapeutic analog \u2014 pure digital/silicon attack vector</div>';
    }

    return html;
  },

  explanation: {
    title: 'Clinical projection',
    body: `<div><strong class="text-[var(--color-text-primary)]">Dual-use colors</strong> \u2014 Whether the attack mechanism has a known therapeutic application. <span style="color:#10b981;font-weight:600;">Confirmed</span> = published clinical use. <span style="color:#06b6d4;font-weight:600;">Probable</span> = under investigation. <span style="color:#8b5cf6;font-weight:600;">Possible</span> = theoretical mapping. <span style="color:#94a3b8;font-weight:600;">Silicon only</span> = no tissue analog.</div>
<div><strong class="text-[var(--color-text-primary)]">Drawer details</strong> \u2014 Therapeutic analog, FDA status, evidence level, treated conditions, and safe parameters from clinical literature.</div>`,
  },
};

// ═══════════════════════════════════════════════════════════════
// Governance Projection
// ═══════════════════════════════════════════════════════════════

const governanceProjection: ProjectionConfig = {
  id: 'governance',
  label: 'Governance',
  cellClassPrefix: 'ct',
  getCellValue: (t) => t.tara?.governance.consent_tier ?? null,
  valueRanking: ['prohibited', 'IRB', 'enhanced', 'standard'],

  buildStats: () => {
    const ts = getTaraStats();
    return [
      {
        label: 'Consent Tier',
        items: [
          { key: 'standard', label: 'Standard', count: ts.consentTier.standard, dotColor: '#22c55e' },
          { key: 'enhanced', label: 'Enhanced', count: ts.consentTier.enhanced, dotColor: '#f59e0b' },
          { key: 'IRB', label: 'IRB Required', count: ts.consentTier.IRB, dotColor: '#ef4444' },
          { key: 'prohibited', label: 'Prohibited', count: ts.consentTier.prohibited, dotColor: '#7f1d1d' },
        ],
      },
      {
        label: 'Overview',
        items: [
          { key: 'total', label: 'Total', count: ts.total, dotColor: '' },
        ],
      },
    ];
  },

  buildFilters: () => [
    {
      label: 'Consent Tier',
      attr: 'consent',
      values: [
        { key: 'standard', label: 'Standard', color: '#22c55e', bg: CONSENT_TIER_COLORS.standard.bg },
        { key: 'enhanced', label: 'Enhanced', color: '#f59e0b', bg: CONSENT_TIER_COLORS.enhanced.bg },
        { key: 'IRB', label: 'IRB Required', color: '#ef4444', bg: CONSENT_TIER_COLORS.IRB.bg },
        { key: 'prohibited', label: 'Prohibited', color: '#ef4444', bg: CONSENT_TIER_COLORS.prohibited.bg },
      ],
    },
  ],

  matchesFilters: (t, activeValues) => {
    const ctSet = activeValues['consent'];
    if (ctSet && !ctSet.has(t.tara?.governance.consent_tier ?? '')) return false;
    return true;
  },

  renderDetail: (t) => {
    const gov = t.tara?.governance;
    if (!gov) return `<div class="detail-threat-name">${t.name}</div><div class="detail-threat-id">${t.id}</div><div style="font-size:0.8rem;color:var(--color-text-faint);">No governance data</div>`;

    const ctC = CONSENT_TIER_COLORS[gov.consent_tier as ConsentTier] ?? CONSENT_TIER_COLORS.standard;
    const ctBdg = badge(gov.consent_tier, ctC.bg, ctC.text);

    let html = `<div class="detail-threat-name">${t.name} ${ctBdg}</div>`;
    html += `<div class="detail-threat-id">${t.id}</div>`;
    html += '<dl class="detail-meta">';
    html += dlRow('Safety Ceiling', gov.safety_ceiling);
    html += dlRow('Data Class.', gov.data_classification);
    html += '</dl>';

    if (gov.monitoring.length) {
      html += '<div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:0.4rem;"><strong>Monitoring:</strong></div>';
      html += '<ul style="font-size:0.75rem;color:var(--color-text-muted);margin:0 0 0.4rem 1rem;padding:0;">';
      for (const m of gov.monitoring) html += `<li>${m.replace(/_/g, ' ')}</li>`;
      html += '</ul>';
    }

    if (gov.regulations.length) {
      html += '<div style="font-size:0.75rem;color:var(--color-text-muted);"><strong>Regulations:</strong></div>';
      html += '<ul style="font-size:0.75rem;color:var(--color-text-muted);margin:0 0 0 1rem;padding:0;">';
      for (const r of gov.regulations) html += `<li>${r}</li>`;
      html += '</ul>';
    }

    return html;
  },

  explanation: {
    title: 'Governance projection',
    body: `<div><strong class="text-[var(--color-text-primary)]">Consent tier colors</strong> \u2014 Required regulatory oversight level. <span style="color:#22c55e;font-weight:600;">Standard</span> = normal consent. <span style="color:#f59e0b;font-weight:600;">Enhanced</span> = additional safeguards. <span style="color:#ef4444;font-weight:600;">IRB</span> = institutional review required. <span style="color:#7f1d1d;font-weight:600;">Prohibited</span> = not permissible.</div>
<div><strong class="text-[var(--color-text-primary)]">Drawer details</strong> \u2014 Safety ceiling, monitoring requirements, applicable regulations, and data classification.</div>`,
  },
};

// ═══════════════════════════════════════════════════════════════
// Engineering Projection
// ═══════════════════════════════════════════════════════════════

function getCouplingStats() {
  const counts: Record<string, number> = { electromagnetic: 0, mechanical: 0, thermal: 0, optical: 0, none: 0 };
  // Coupling is counted per-technique from tara.engineering.coupling[0]
  // (Imported at build time, iterates THREAT_VECTORS)
  // We'll compute this fresh from the imported stats function
  return counts;
}

const engineeringProjection: ProjectionConfig = {
  id: 'engineering',
  label: 'Engineering',
  cellClassPrefix: 'cp',
  getCellValue: (t) => {
    const coupling = t.tara?.engineering?.coupling;
    if (!coupling || coupling.length === 0) return 'none';
    return coupling[0];
  },
  valueRanking: ['electromagnetic', 'mechanical', 'thermal', 'optical', 'none'],

  buildStats: () => {
    // Compute coupling counts dynamically
    const counts: Record<string, number> = { electromagnetic: 0, mechanical: 0, thermal: 0, optical: 0, none: 0 };
    // This will be computed client-side from ALL_THREATS
    // At build time we provide the structure; JS fills counts
    return [
      {
        label: 'Coupling Type',
        items: [
          { key: 'electromagnetic', label: 'Electromagnetic', count: 0, dotColor: COUPLING_COLORS.electromagnetic.text },
          { key: 'mechanical', label: 'Mechanical', count: 0, dotColor: COUPLING_COLORS.mechanical.text },
          { key: 'thermal', label: 'Thermal', count: 0, dotColor: COUPLING_COLORS.thermal.text },
          { key: 'optical', label: 'Optical', count: 0, dotColor: COUPLING_COLORS.optical.text },
          { key: 'none', label: 'None/Digital', count: 0, dotColor: COUPLING_COLORS.none.text },
        ],
      },
    ];
  },

  buildFilters: () => [
    {
      label: 'Coupling',
      attr: 'coupling',
      values: [
        { key: 'electromagnetic', label: 'Electromagnetic', color: COUPLING_COLORS.electromagnetic.text, bg: COUPLING_COLORS.electromagnetic.bg },
        { key: 'mechanical', label: 'Mechanical', color: COUPLING_COLORS.mechanical.text, bg: COUPLING_COLORS.mechanical.bg },
        { key: 'thermal', label: 'Thermal', color: COUPLING_COLORS.thermal.text, bg: COUPLING_COLORS.thermal.bg },
        { key: 'optical', label: 'Optical', color: COUPLING_COLORS.optical.text, bg: COUPLING_COLORS.optical.bg },
        { key: 'none', label: 'None/Digital', color: COUPLING_COLORS.none.text, bg: COUPLING_COLORS.none.bg },
      ],
    },
  ],

  matchesFilters: (t, activeValues) => {
    const cpSet = activeValues['coupling'];
    if (!cpSet) return true;
    const coupling = t.tara?.engineering?.coupling;
    const val = (!coupling || coupling.length === 0) ? 'none' : coupling[0];
    return cpSet.has(val);
  },

  renderDetail: (t) => {
    const eng = t.tara?.engineering;
    if (!eng) return `<div class="detail-threat-name">${t.name}</div><div class="detail-threat-id">${t.id}</div><div style="font-size:0.8rem;color:var(--color-text-faint);">No engineering data</div>`;

    const couplingVal = eng.coupling.length > 0 ? eng.coupling[0] : 'none';
    const cpC = COUPLING_COLORS[couplingVal as keyof typeof COUPLING_COLORS] ?? COUPLING_COLORS.none;
    const cpBdg = badge(couplingVal, cpC.bg, cpC.text, cpC.border);

    let html = `<div class="detail-threat-name">${t.name} ${cpBdg}</div>`;
    html += `<div class="detail-threat-id">${t.id}</div>`;

    // Parameters table
    const paramEntries = Object.entries(eng.parameters);
    if (paramEntries.length) {
      html += '<div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:0.5rem;"><strong>Parameters:</strong></div>';
      html += '<dl class="detail-meta">';
      for (const [k, v] of paramEntries) {
        html += dlRow(k.replace(/_/g, ' '), String(v));
      }
      html += '</dl>';
    }

    if (eng.hardware.length) {
      html += '<div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:0.4rem;"><strong>Hardware:</strong></div>';
      html += '<ul style="font-size:0.75rem;color:var(--color-text-muted);margin:0 0 0.4rem 1rem;padding:0;">';
      for (const h of eng.hardware) html += `<li>${h.replace(/_/g, ' ')}</li>`;
      html += '</ul>';
    }

    if (eng.detection) {
      html += `<div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:0.3rem;"><strong>Detection:</strong> ${eng.detection}</div>`;
    }

    return html;
  },

  explanation: {
    title: 'Engineering projection',
    body: `<div><strong class="text-[var(--color-text-primary)]">Coupling type colors</strong> \u2014 Physical coupling mechanism between device and target. <span style="color:#3b82f6;font-weight:600;">Electromagnetic</span> = EM field interaction. <span style="color:#f59e0b;font-weight:600;">Mechanical</span> = pressure/vibration. <span style="color:#ef4444;font-weight:600;">Thermal</span> = heat-based. <span style="color:#a855f7;font-weight:600;">Optical</span> = light-based. <span style="color:#94a3b8;font-weight:600;">None</span> = digital only.</div>
<div><strong class="text-[var(--color-text-primary)]">Drawer details</strong> \u2014 Physical parameters, required hardware, and detection methods.</div>`,
  },
};

// ═══════════════════════════════════════════════════════════════
// Projection Registry — single export point
// ═══════════════════════════════════════════════════════════════

export const PROJECTIONS: Record<ProjectionId, ProjectionConfig> = {
  security: securityProjection,
  clinical: clinicalProjection,
  governance: governanceProjection,
  engineering: engineeringProjection,
};

export const PROJECTION_IDS: ProjectionId[] = ['security', 'clinical', 'governance', 'engineering'];

/**
 * Build the serializable projection config for client-side JS.
 * Functions can't be serialized to JSON, so we serialize them as string source.
 * The Astro template will inline the function bodies.
 */
export function getProjectionConfigForClient() {
  return {
    projections: PROJECTION_IDS.map(id => ({
      id,
      label: PROJECTIONS[id].label,
      cellClassPrefix: PROJECTIONS[id].cellClassPrefix,
      valueRanking: PROJECTIONS[id].valueRanking,
      stats: PROJECTIONS[id].buildStats(),
      filters: PROJECTIONS[id].buildFilters(),
      explanation: PROJECTIONS[id].explanation,
    })),
  };
}
