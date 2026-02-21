/**
 * BciKql — KLQ (Kevin's Landscape Query) engine.
 * In-browser KQL-inspired query engine over all BCI datasets.
 * Pipe-based syntax: table | where field op value | sort by field | project fields
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// --- Types ---

type Row = Record<string, unknown>;
type TableData = Record<string, Row[]>;

interface BciKqlProps {
  tables: TableData;
}

// --- Preset Queries ---

const PRESETS: Array<{ label: string; query: string; group?: string }> = [
  // Companies & Devices
  { label: 'All companies', query: 'companies', group: 'industry' },
  { label: 'No security', query: 'companies | where security_posture == "none_published"', group: 'industry' },
  { label: 'Funded but insecure', query: 'companies | where funding_total_usd > 100000000 | where security_posture == "none_published"', group: 'industry' },
  { label: 'Invasive devices', query: 'devices | where type == "invasive" | sort by channels desc', group: 'industry' },
  { label: 'High-channel', query: 'devices | where channels > 100', group: 'industry' },
  { label: 'Hardware specs', query: 'hardware_specs | sort by channels desc', group: 'industry' },
  // Threats & CVEs
  { label: 'Critical threats', query: 'techniques | where severity == "critical"', group: 'threats' },
  { label: 'By tactic', query: 'techniques | summarize count() by tactic', group: 'threats' },
  { label: 'By status', query: 'techniques | summarize count() by status', group: 'threats' },
  { label: 'All tactics', query: 'tactics', group: 'threats' },
  { label: 'Top CVEs', query: 'cves | sort by cvss desc | take 10', group: 'threats' },
  // Neuro & Clinical
  { label: 'Brain regions', query: 'brain_regions | sort by qif_band asc', group: 'neuro' },
  { label: 'Hourglass bands', query: 'hourglass_bands', group: 'neuro' },
  { label: 'DSM-5', query: 'dsm5 | sort by cluster asc', group: 'neuro' },
  { label: 'Neurorights', query: 'neurorights', group: 'neuro' },
  // Governance & Security
  { label: 'Frameworks', query: 'frameworks', group: 'governance' },
  { label: 'Consent tiers', query: 'consent_tiers', group: 'governance' },
  { label: 'Controls', query: 'controls | summarize count() by band', group: 'governance' },
  { label: 'NSP layers', query: 'nsp_layers', group: 'governance' },
  { label: 'Policy timeline', query: 'policy | sort by date desc', group: 'governance' },
  // Comms & Attack Surface
  { label: 'Wireless comms', query: 'comms | project device, wireless_protocol, rf_band, encryption, data_link_risk', group: 'comms' },
  { label: 'BLE devices', query: 'comms | where wireless_protocol contains "bluetooth" | project device, encryption, data_link_risk, firmware_platform', group: 'comms' },
  { label: 'Unencrypted', query: 'comms | where encryption contains "None" | project device, wireless_protocol, encryption, firmware_platform', group: 'comms' },
  { label: 'High-risk links', query: 'comms | where data_link_risk contains "HIGH" | project device, wireless_protocol, encryption, rf_band', group: 'comms' },
  { label: 'Firmware stack', query: 'comms | project device, firmware_platform, device_type', group: 'comms' },
  // Market & Funding
  { label: 'Top funding', query: 'funding | sort by amount_usd desc', group: 'market' },
  { label: 'Market forecasts', query: 'market_forecasts | sort by year asc', group: 'market' },
  { label: 'VC deal flow', query: 'vc_deals | sort by year desc', group: 'market' },
  { label: 'Security gap', query: 'security_gap | sort by size_2025_usd desc', group: 'market' },
  { label: 'Adjacent markets', query: 'adjacent_markets | sort by year asc', group: 'market' },
  { label: '$100M+ rounds', query: 'funding | where amount_usd > 100000000 | sort by amount_usd desc', group: 'market' },
  { label: 'Gov grants', query: 'grants | sort by total_usd desc', group: 'market' },
  { label: 'Acquisitions', query: 'acquisitions | sort by price_usd_estimate desc', group: 'market' },
  { label: 'All sources', query: 'sources | sort by category asc', group: 'market' },
  // Business Analysis
  { label: 'TAM/SAM/SOM', query: 'tam_sam_som | sort by year asc', group: 'analysis' },
  { label: 'SOM projection', query: 'tam_sam_som | where som_M > 0 | project year, bci_market_B, tam_M, sam_M, som_M', group: 'analysis' },
  { label: 'Convergence timeline', query: 'convergence | sort by year asc', group: 'analysis' },
  { label: 'Auto vs BCI', query: 'convergence | where market contains "Automotive" | sort by year asc', group: 'analysis' },
  { label: 'Investment momentum', query: 'momentum | sort by year asc', group: 'analysis' },
  { label: 'Risk profile', query: 'risk_profile | sort by risk_index desc', group: 'analysis' },
  { label: 'Highest risk', query: 'risk_profile | where risk_index > 1 | project company, funding_B, devices, security_posture, risk_index', group: 'analysis' },
  { label: 'Zero security + funded', query: 'risk_profile | where security_score == "0/4" | where funding_B > 0 | sort by funding_B desc', group: 'analysis' },
  // Investor Intelligence
  { label: 'All funding rounds', query: 'funding | sort by date desc', group: 'investors' },
  { label: 'Cross-portfolio VCs', query: 'cross_portfolio | sort by bci_bet_count desc', group: 'investors' },
  { label: 'Sovereign wealth', query: 'sovereign_funds', group: 'investors' },
  { label: 'Big Tech in BCI', query: 'big_tech_bci', group: 'investors' },
  { label: 'PE firms', query: 'pe_firms', group: 'investors' },
  { label: 'Intel/Defense', query: 'intel_defense', group: 'investors' },
  { label: 'Notable individuals', query: 'notable_investors', group: 'investors' },
  { label: 'Investment patterns', query: 'investment_patterns', group: 'investors' },
  { label: '$100M+ rounds', query: 'funding | where amount_usd > 100000000 | sort by amount_usd desc', group: 'investors' },
  { label: 'By company category', query: 'companies | summarize count() by category', group: 'investors' },
  { label: 'Growth stage cos', query: 'companies | where category == "growth_stage" | sort by funding_total_usd desc', group: 'investors' },
  { label: 'Startups', query: 'companies | where category == "startup" | sort by funding_total_usd desc', group: 'investors' },
  { label: 'Publications', query: 'publications | sort by year desc', group: 'market' },
  // Operations & Tracking
  { label: 'Validations', query: 'validations | sort by date desc', group: 'ops' },
  { label: 'Automations', query: 'automations | where status == "active"', group: 'ops' },
  { label: 'Milestones', query: 'milestones | sort by date desc | take 20', group: 'ops' },
  { label: 'Latest news', query: 'news | sort by date desc | take 20', group: 'ops' },
  // Intel Feed
  { label: 'Latest intel', query: 'intel_feed | sort by date desc | take 50', group: 'intel' },
  { label: 'Funding news', query: 'intel_feed | where tags contains "funding" | sort by date desc', group: 'intel' },
  { label: 'Regulatory news', query: 'intel_feed | where tags contains "regulatory" | sort by date desc', group: 'intel' },
  { label: 'Product launches', query: 'intel_feed | where tags contains "product" | sort by date desc', group: 'intel' },
  { label: 'Policy updates', query: 'intel_feed | where tags contains "policy" | sort by date desc', group: 'intel' },
  { label: 'Research papers', query: 'intel_feed | where tags contains "research" | sort by date desc', group: 'intel' },
  { label: 'Intel by source', query: 'intel_feed | summarize count() by source | sort by count desc', group: 'intel' },
  { label: 'Intel by company', query: 'intel_feed | where companies != "" | summarize count() by companies', group: 'intel' },
  { label: 'Intel by tag', query: 'intel_feed | summarize count() by tags', group: 'intel' },
  { label: 'All sources (200+)', query: 'intel_sources | sort by category asc', group: 'intel' },
  { label: 'Free RSS sources', query: 'intel_sources | where tier == "free_rss"', group: 'intel' },
  { label: 'Paid platforms', query: 'intel_sources | where tier == "paid"', group: 'intel' },
];

// --- Badge styling ---

const BADGE_FIELDS: Record<string, Record<string, { bg: string; fg: string }>> = {
  severity: {
    critical: { bg: '#dc2626', fg: '#fff' },
    high: { bg: '#f97316', fg: '#fff' },
    medium: { bg: '#eab308', fg: '#000' },
    low: { bg: '#22c55e', fg: '#000' },
  },
  type: {
    invasive: { bg: '#f43f5e', fg: '#fff' },
    non_invasive: { bg: '#3b82f6', fg: '#fff' },
    semi_invasive: { bg: '#f59e0b', fg: '#000' },
    invasive_implantable: { bg: '#f43f5e', fg: '#fff' },
  },
  security_posture: {
    none_published: { bg: '#dc2626', fg: '#fff' },
    minimal: { bg: '#f97316', fg: '#fff' },
    basic: { bg: '#eab308', fg: '#000' },
    moderate: { bg: '#3b82f6', fg: '#fff' },
    strong: { bg: '#22c55e', fg: '#000' },
  },
  status: {
    CONFIRMED: { bg: '#dc2626', fg: '#fff' },
    DEMONSTRATED: { bg: '#f97316', fg: '#fff' },
    EMERGING: { bg: '#eab308', fg: '#000' },
    THEORETICAL: { bg: '#94a3b8', fg: '#000' },
    PLAUSIBLE: { bg: '#64748b', fg: '#fff' },
    SPECULATIVE: { bg: '#475569', fg: '#fff' },
    active: { bg: '#22c55e', fg: '#000' },
    acquired: { bg: '#94a3b8', fg: '#000' },
  },
  fda_status: {
    '510k': { bg: '#22c55e', fg: '#000' },
    IDE: { bg: '#3b82f6', fg: '#fff' },
    PMA: { bg: '#22c55e', fg: '#000' },
    breakthrough: { bg: '#8b5cf6', fg: '#fff' },
    exempt: { bg: '#94a3b8', fg: '#000' },
    none: { bg: '#475569', fg: '#fff' },
  },
  zone: {
    neural: { bg: '#f43f5e', fg: '#fff' },
    interface: { bg: '#f59e0b', fg: '#000' },
    silicon: { bg: '#3b82f6', fg: '#fff' },
  },
  data_link_risk: {
    'HIGH (BLE sniffable)': { bg: '#dc2626', fg: '#fff' },
    'HIGH (WiFi interceptable)': { bg: '#dc2626', fg: '#fff' },
    'MEDIUM (proximity required)': { bg: '#f59e0b', fg: '#000' },
    'MEDIUM (security through obscurity)': { bg: '#f59e0b', fg: '#000' },
    'LOW (physical access required)': { bg: '#22c55e', fg: '#000' },
    'LOW (line-of-sight optical)': { bg: '#22c55e', fg: '#000' },
    UNKNOWN: { bg: '#475569', fg: '#fff' },
  },
};

// --- Query Parser & Executor ---

function parseValue(raw: string): string | number | boolean {
  const trimmed = raw.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return '';
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') return num;
  return trimmed;
}

function getField(row: Row, field: string): unknown {
  return row[field.trim()];
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function toStr(v: unknown): string {
  if (v == null) return '';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

function applyWhere(rows: Row[], clause: string): Row[] {
  const ops = ['!=', '>=', '<=', '==', '>', '<', '!contains', 'contains', 'startswith', 'has'];
  let matchedOp = '';
  let opIdx = -1;

  for (const op of ops) {
    const isSymbol = /[><=!]/.test(op[0]);
    if (isSymbol) {
      const idx = clause.indexOf(` ${op} `);
      if (idx >= 0) {
        matchedOp = op;
        opIdx = idx + 1;
        break;
      }
      // Also try without spaces for tight syntax like "channels>100"
      const tightIdx = clause.indexOf(op);
      if (tightIdx > 0 && opIdx < 0) {
        matchedOp = op;
        opIdx = tightIdx;
        break;
      }
    } else {
      const idx = clause.indexOf(` ${op} `);
      if (idx >= 0) {
        matchedOp = op;
        opIdx = idx + 1;
        break;
      }
    }
  }

  if (!matchedOp || opIdx < 0) {
    throw new Error(`Invalid where clause: "${clause}". Expected: field op value`);
  }

  const field = clause.slice(0, opIdx).trim();
  const rawVal = clause.slice(opIdx + matchedOp.length).trim();
  const val = parseValue(rawVal);

  return rows.filter(row => {
    const rv = getField(row, field);
    switch (matchedOp) {
      case '==': return toStr(rv) === String(val) || rv === val;
      case '!=': return toStr(rv) !== String(val) && rv !== val;
      case '>': return toNum(rv) > toNum(val);
      case '<': return toNum(rv) < toNum(val);
      case '>=': return toNum(rv) >= toNum(val);
      case '<=': return toNum(rv) <= toNum(val);
      case 'contains': return toStr(rv).toLowerCase().includes(String(val).toLowerCase());
      case '!contains': return !toStr(rv).toLowerCase().includes(String(val).toLowerCase());
      case 'startswith': return toStr(rv).toLowerCase().startsWith(String(val).toLowerCase());
      case 'has': return toStr(rv).toLowerCase().includes(String(val).toLowerCase());
      default: return true;
    }
  });
}

function applySort(rows: Row[], clause: string): Row[] {
  const parts = clause.trim().split(/\s+/);
  const field = parts[0];
  const dir = (parts[1] || 'asc').toLowerCase();
  const sorted = [...rows].sort((a, b) => {
    const av = getField(a, field);
    const bv = getField(b, field);
    if (typeof av === 'number' && typeof bv === 'number') return av - bv;
    return toStr(av).localeCompare(toStr(bv));
  });
  return dir === 'desc' ? sorted.reverse() : sorted;
}

function applyProject(rows: Row[], clause: string): Row[] {
  const fields = clause.split(',').map(f => f.trim()).filter(Boolean);
  return rows.map(row => {
    const out: Row = {};
    for (const f of fields) {
      out[f] = row[f];
    }
    return out;
  });
}

function applySummarize(rows: Row[], clause: string): Row[] {
  const match = clause.match(/count\(\)\s+by\s+(.+)/i);
  if (!match) throw new Error(`Invalid summarize: "${clause}". Expected: count() by field`);
  const field = match[1].trim();
  const groups = new Map<string, number>();
  for (const row of rows) {
    const key = toStr(getField(row, field));
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ [field]: key, count }));
}

function applyDistinct(rows: Row[], clause: string): Row[] {
  const field = clause.trim();
  const seen = new Set<string>();
  const out: Row[] = [];
  for (const row of rows) {
    const v = toStr(getField(row, field));
    if (!seen.has(v)) {
      seen.add(v);
      out.push({ [field]: v });
    }
  }
  return out;
}

interface QueryResult {
  rows: Row[];
  tableName: string;
  error: string | null;
}

function executeQuery(query: string, tables: TableData): QueryResult {
  const trimmed = query.trim();
  if (!trimmed) return { rows: [], tableName: '', error: null };

  const segments = trimmed.split('|').map(s => s.trim());
  const tableName = segments[0];

  if (!tables[tableName]) {
    const available = Object.keys(tables).join(', ');
    return { rows: [], tableName, error: `Unknown table "${tableName}". Available: ${available}` };
  }

  let rows = [...tables[tableName]];

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    try {
      if (seg.startsWith('where ')) {
        rows = applyWhere(rows, seg.slice(6));
      } else if (seg.startsWith('sort by ')) {
        rows = applySort(rows, seg.slice(8));
      } else if (seg.startsWith('take ') || seg.startsWith('limit ')) {
        const n = parseInt(seg.split(' ')[1], 10);
        if (isNaN(n)) throw new Error(`Invalid take/limit value: ${seg}`);
        rows = rows.slice(0, n);
      } else if (seg.startsWith('project ')) {
        rows = applyProject(rows, seg.slice(8));
      } else if (seg.startsWith('summarize ')) {
        rows = applySummarize(rows, seg.slice(10));
      } else if (seg.startsWith('distinct ')) {
        rows = applyDistinct(rows, seg.slice(9));
      } else if (seg === 'count') {
        rows = [{ count: rows.length }];
      } else {
        throw new Error(`Unknown operation: "${seg}"`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { rows: [], tableName, error: msg };
    }
  }

  return { rows, tableName, error: null };
}

// --- Styles ---

const S = {
  container: {
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    color: 'var(--color-text, #e2e8f0)',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.75rem',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading, system-ui)',
    margin: 0,
  } as React.CSSProperties,
  statsBar: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    marginBottom: '1rem',
    fontSize: '0.75rem',
    color: 'var(--color-text-muted, #94a3b8)',
  } as React.CSSProperties,
  statItem: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'baseline',
  } as React.CSSProperties,
  statNum: {
    fontWeight: 700,
    fontFamily: 'var(--font-mono, monospace)',
    color: 'var(--color-accent-primary, #3b82f6)',
  } as React.CSSProperties,
  inputRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  input: {
    flex: 1,
    padding: '0.625rem 0.875rem',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-mono, monospace)',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '0.5rem',
    color: 'inherit',
    outline: 'none',
  } as React.CSSProperties,
  inputFocus: {
    borderColor: 'var(--color-accent-primary, #3b82f6)',
    boxShadow: '0 0 0 2px rgba(59,130,246,0.25)',
  } as React.CSSProperties,
  runBtn: {
    padding: '0.625rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    background: 'var(--color-accent-primary, #3b82f6)',
    color: '#fff',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.375rem',
    marginBottom: '1.25rem',
  } as React.CSSProperties,
  chip: {
    padding: '0.25rem 0.625rem',
    fontSize: '0.75rem',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '9999px',
    cursor: 'pointer',
    color: 'var(--color-text-muted, #94a3b8)',
    transition: 'background 0.15s, border-color 0.15s',
  } as React.CSSProperties,
  chipActive: {
    background: 'rgba(59,130,246,0.2)',
    borderColor: 'rgba(59,130,246,0.4)',
    color: 'var(--color-text, #e2e8f0)',
  } as React.CSSProperties,
  resultBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    fontSize: '0.8125rem',
    color: 'var(--color-text-muted, #94a3b8)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  } as React.CSSProperties,
  error: {
    padding: '1rem',
    fontSize: '0.875rem',
    color: '#fca5a5',
    background: 'rgba(220,38,38,0.1)',
    border: '1px solid rgba(220,38,38,0.3)',
    borderRadius: '0.5rem',
  } as React.CSSProperties,
  tableWrap: {
    overflowX: 'auto' as const,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.75rem',
    background: 'rgba(255,255,255,0.03)',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.8125rem',
    fontFamily: 'var(--font-mono, monospace)',
  } as React.CSSProperties,
  th: {
    padding: '0.5rem 0.75rem',
    textAlign: 'left' as const,
    fontWeight: 700,
    fontSize: '0.6875rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'var(--color-accent-primary, #60a5fa)',
    background: 'rgba(255,255,255,0.06)',
    borderBottom: '2px solid rgba(59,130,246,0.3)',
    cursor: 'pointer',
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  td: {
    padding: '0.375rem 0.75rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    maxWidth: '20rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  badge: {
    display: 'inline-block',
    padding: '0.125rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
  } as React.CSSProperties,
  empty: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: 'var(--color-text-muted, #94a3b8)',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  syntaxPre: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.75rem',
    background: 'rgba(255,255,255,0.05)',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    overflowX: 'auto' as const,
    lineHeight: 1.5,
  } as React.CSSProperties,
};

// --- Formatting ---

function formatValue(val: unknown, field: string): React.ReactNode {
  if (val == null || val === '') return <span style={{ opacity: 0.4 }}>-</span>;
  if (Array.isArray(val)) return val.join(', ');

  const str = String(val);

  const badgeMap = BADGE_FIELDS[field];
  if (badgeMap) {
    const colors = badgeMap[str] || badgeMap[str.toLowerCase()];
    if (colors) {
      return (
        <span style={{ ...S.badge, background: colors.bg, color: colors.fg }}>
          {str}
        </span>
      );
    }
  }

  if (field.includes('usd') || field === 'funding_total_usd' || field === 'amount_usd') {
    const n = Number(val);
    if (!isNaN(n) && n > 0) {
      if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
      if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
      return `$${n}`;
    }
  }

  if (field === 'cvss') {
    const n = Number(val);
    if (!isNaN(n)) {
      const color = n >= 9 ? '#dc2626' : n >= 7 ? '#f97316' : n >= 4 ? '#eab308' : '#22c55e';
      return <span style={{ ...S.badge, background: color, color: n >= 4 && n < 9 ? '#000' : '#fff' }}>{n.toFixed(1)}</span>;
    }
  }

  if (str.startsWith('http://') || str.startsWith('https://')) {
    return <a href={str} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent-primary, #3b82f6)', textDecoration: 'underline' }}>{str.length > 50 ? str.slice(0, 50) + '...' : str}</a>;
  }

  return str;
}

// --- Component ---

export default function BciKql({ tables }: BciKqlProps) {
  const [query, setQuery] = useState('companies');
  const [inputFocused, setInputFocused] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [syntaxOpen, setSyntaxOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const tableStats = useMemo(() => {
    return Object.entries(tables).map(([name, rows]) => ({ name, count: rows.length }));
  }, [tables]);

  const totalRecords = useMemo(() => tableStats.reduce((s, t) => s + t.count, 0), [tableStats]);

  const result = useMemo(() => executeQuery(query, tables), [query, tables]);

  const displayRows = useMemo(() => {
    if (!sortCol || result.error) return result.rows;
    const sorted = [...result.rows].sort((a, b) => {
      const av = getField(a, sortCol);
      const bv = getField(b, sortCol);
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return toStr(av).localeCompare(toStr(bv));
    });
    return sortDir === 'desc' ? sorted.reverse() : sorted;
  }, [result.rows, result.error, sortCol, sortDir]);

  const columns = useMemo(() => {
    if (displayRows.length === 0) return [];
    return Object.keys(displayRows[0]);
  }, [displayRows]);

  const handleRun = useCallback(() => {
    if (inputRef.current) {
      setQuery(inputRef.current.value);
      setSortCol(null);
    }
  }, []);

  const handlePreset = useCallback((q: string) => {
    setQuery(q);
    setSortCol(null);
    if (inputRef.current) inputRef.current.value = q;
  }, []);

  const handleHeaderClick = useCallback((col: string) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }, [sortCol]);

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== query) {
      inputRef.current.value = query;
    }
  }, [query]);

  return (
    <div style={S.container}>
      <div style={S.header}>
        <h2 style={S.title}>KLQ</h2>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted, #94a3b8)' }}>
          Pipe-based queries over BCI data
        </span>
      </div>

      <div style={S.statsBar}>
        {tableStats.map(t => (
          <span key={t.name} style={S.statItem}>
            <span style={S.statNum}>{t.count}</span> {t.name}
          </span>
        ))}
        <span style={{ ...S.statItem, borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '0.75rem' }}>
          <span style={S.statNum}>{totalRecords}</span> total records
        </span>
      </div>

      <div style={S.inputRow}>
        <input
          ref={inputRef}
          type="text"
          defaultValue={query}
          placeholder={'companies | where security_posture == "none_published"'}
          onKeyDown={e => { if (e.key === 'Enter') handleRun(); }}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          style={{ ...S.input, ...(inputFocused ? S.inputFocus : {}) }}
        />
        <button onClick={handleRun} style={S.runBtn}>Run</button>
      </div>

      <div style={S.chipRow}>
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => handlePreset(p.query)}
            style={{
              ...S.chip,
              ...(query === p.query ? S.chipActive : {}),
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {result.error && (
        <div style={S.error}>{result.error}</div>
      )}

      {!result.error && displayRows.length > 0 && (
        <div style={S.tableWrap}>
          <div style={S.resultBar}>
            <span>{displayRows.length} result{displayRows.length !== 1 ? 's' : ''} from <strong>{result.tableName}</strong></span>
            <span>{columns.length} column{columns.length !== 1 ? 's' : ''}</span>
          </div>
          <table style={S.table}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col}
                    style={S.th}
                    onClick={() => handleHeaderClick(col)}
                  >
                    {col.replace(/_/g, ' ')}
                    {sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  {columns.map(col => (
                    <td key={col} style={S.td}>{formatValue(row[col], col)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!result.error && displayRows.length === 0 && query && (
        <div style={S.empty}>No results. Try a different query or check the table name.</div>
      )}

      <details
        open={syntaxOpen}
        onToggle={e => setSyntaxOpen((e.target as HTMLDetailsElement).open)}
        style={{ marginTop: '1.5rem' }}
      >
        <summary style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted, #94a3b8)' }}>
          Query syntax reference
        </summary>
        <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-muted, #94a3b8)', lineHeight: 1.6 }}>
          <pre style={S.syntaxPre}>{`table | operator [args] | operator [args] | ...

TABLES:
  ${Object.keys(tables).join(', ')}

OPERATORS:
  where field op value    Filter rows (op: ==, !=, >, <, >=, <=, contains, !contains, startswith, has)
  sort by field [asc|desc]  Sort results
  take N / limit N        Return first N rows
  project field1, field2  Select specific columns
  summarize count() by field  Group and count
  distinct field          Unique values
  count                   Total row count

EXAMPLES:
  devices | where channels > 100 | sort by channels desc
  techniques | where severity == "critical" | summarize count() by tactic
  companies | where security_posture == "none_published" | project name, type, funding_total_usd
  cves | sort by cvss desc | take 10
  brain_regions | where zone == "neural" | sort by qif_band asc

NOTES:
  String values must be quoted: "invasive", "critical"
  Numeric values are unquoted: 100, 1024
  Pipe character | separates operations
  Click column headers to sort results`}</pre>
        </div>
      </details>
    </div>
  );
}
