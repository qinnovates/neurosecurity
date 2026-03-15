/**
 * BciDirectory — HuggingFace Spaces-style filterable card grid
 * for BCI devices and companies. Used with client:only="react" in Astro.
 */

import { useState, useMemo, useCallback } from 'react';

// ═══ Types ═══

interface BciDeviceCard {
  device_name: string;
  company_name: string;
  device_type: 'invasive' | 'semi_invasive' | 'non_invasive';
  channels: number;
  electrode_type: string;
  fda_status: string;
  units_deployed: string;
  first_human: string;
  price_usd: number | null;
  target_use: string;
  cves_known: string[];
  company_type: string;
  company_status: string;
  company_category: string;
  funding_total_usd: number | null;
  security_posture: string;
  security_notes: string;
  attack_surface_count: number;
  tara_attack_surface: string[];
  company_headquarters: string;
  company_founded: string;
}

interface BciCompanyCard {
  name: string;
  type: string;
  status: string;
  category: string;
  founded: string;
  headquarters: string;
  funding_total_usd: number | null;
  security_posture: string;
  device_count: number;
  attack_surface_count: number;
  top_fda_status: string;
  total_channels: number;
  devices: { name: string; type: string; channels: number; fda_status: string; target_use: string }[];
}

interface DirectoryStats {
  totalCompanies: number;
  totalDevices: number;
  byType: Record<string, number>;
  byFdaStatus: Record<string, number>;
  byTargetUse: Record<string, number>;
  bySecurityPosture: Record<string, number>;
}

interface Props {
  devices: BciDeviceCard[];
  companies: BciCompanyCard[];
  stats: DirectoryStats;
}

// ═══ Constants ═══

type LensMode = 'security' | 'clinical' | 'market' | 'research';
type EntityView = 'device' | 'company';
type DeviceType = 'invasive' | 'semi_invasive' | 'non_invasive';

const TYPE_COLORS: Record<DeviceType, { bg: string; text: string; label: string }> = {
  invasive: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', label: 'Invasive' },
  semi_invasive: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', label: 'Semi-Invasive' },
  non_invasive: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', label: 'Non-Invasive' },
};

const SECURITY_COLORS: Record<string, string> = {
  minimal: '#ef4444',
  low: '#f59e0b',
  moderate: '#3b82f6',
  high: '#22c55e',
  unknown: '#94a3b8',
};

const FDA_COLORS: Record<string, string> = {
  cleared: '#22c55e',
  approved: '#22c55e',
  'de novo': '#3b82f6',
  'breakthrough device': '#8b5cf6',
  'ide active': '#f59e0b',
  'not applicable': '#94a3b8',
  'research only': '#94a3b8',
  'ce marked': '#06b6d4',
};

const LENS_LABELS: Record<LensMode, string> = {
  security: 'Security',
  clinical: 'Clinical',
  market: 'Market',
  research: 'Research',
};

const LENS_ICONS: Record<LensMode, string> = {
  security: '\u{1F6E1}',
  clinical: '\u{1FA7A}',
  market: '\u{1F4C8}',
  research: '\u{1F52C}',
};

// ═══ Helpers ═══

function formatFunding(value: number | null): string {
  if (value == null) return 'Undisclosed';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

function matchesSearch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  return query.toLowerCase().split(/\s+/).every(term => lower.includes(term));
}

function getDeviceSearchText(d: BciDeviceCard): string {
  return [
    d.device_name, d.company_name, d.device_type, d.electrode_type,
    d.fda_status, d.target_use, d.security_posture, d.security_notes,
    d.company_category, d.company_headquarters,
    ...d.tara_attack_surface, ...d.cves_known,
  ].join(' ');
}

function getCompanySearchText(c: BciCompanyCard): string {
  return [
    c.name, c.type, c.status, c.category, c.headquarters,
    c.security_posture, c.top_fda_status,
    ...c.devices.map(d => `${d.name} ${d.type} ${d.target_use} ${d.fda_status}`),
  ].join(' ');
}

function getFdaColor(status: string): string {
  const lower = status.toLowerCase();
  for (const [key, color] of Object.entries(FDA_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return '#94a3b8';
}

function getSecurityColor(posture: string): string {
  return SECURITY_COLORS[posture.toLowerCase()] ?? '#94a3b8';
}

// ═══ Sort Options ═══

interface SortOption {
  label: string;
  key: string;
  lenses: LensMode[];
}

const DEVICE_SORT_OPTIONS: SortOption[] = [
  { label: 'Most channels', key: 'channels_desc', lenses: ['security', 'clinical', 'research'] },
  { label: 'Fewest channels', key: 'channels_asc', lenses: ['security', 'clinical', 'research'] },
  { label: 'Most attack surfaces', key: 'attack_desc', lenses: ['security'] },
  { label: 'Most CVEs', key: 'cve_desc', lenses: ['security'] },
  { label: 'Highest funding', key: 'funding_desc', lenses: ['market'] },
  { label: 'Most recent (first human)', key: 'recent_desc', lenses: ['clinical', 'research'] },
  { label: 'Device name (A-Z)', key: 'name_asc', lenses: ['security', 'clinical', 'market', 'research'] },
  { label: 'Company name (A-Z)', key: 'company_asc', lenses: ['security', 'clinical', 'market', 'research'] },
];

const COMPANY_SORT_OPTIONS: SortOption[] = [
  { label: 'Most devices', key: 'devices_desc', lenses: ['security', 'clinical', 'market', 'research'] },
  { label: 'Highest funding', key: 'funding_desc', lenses: ['market'] },
  { label: 'Most channels (total)', key: 'channels_desc', lenses: ['clinical', 'research'] },
  { label: 'Most attack surfaces', key: 'attack_desc', lenses: ['security'] },
  { label: 'Company name (A-Z)', key: 'name_asc', lenses: ['security', 'clinical', 'market', 'research'] },
];

function sortDevices(devices: BciDeviceCard[], key: string): BciDeviceCard[] {
  const sorted = [...devices];
  switch (key) {
    case 'channels_desc': return sorted.sort((a, b) => b.channels - a.channels);
    case 'channels_asc': return sorted.sort((a, b) => a.channels - b.channels);
    case 'attack_desc': return sorted.sort((a, b) => b.attack_surface_count - a.attack_surface_count);
    case 'cve_desc': return sorted.sort((a, b) => b.cves_known.length - a.cves_known.length);
    case 'funding_desc': return sorted.sort((a, b) => (b.funding_total_usd ?? 0) - (a.funding_total_usd ?? 0));
    case 'recent_desc': return sorted.sort((a, b) => (b.first_human || '').localeCompare(a.first_human || ''));
    case 'name_asc': return sorted.sort((a, b) => a.device_name.localeCompare(b.device_name));
    case 'company_asc': return sorted.sort((a, b) => a.company_name.localeCompare(b.company_name));
    default: return sorted;
  }
}

function sortCompanies(companies: BciCompanyCard[], key: string): BciCompanyCard[] {
  const sorted = [...companies];
  switch (key) {
    case 'devices_desc': return sorted.sort((a, b) => b.device_count - a.device_count);
    case 'funding_desc': return sorted.sort((a, b) => (b.funding_total_usd ?? 0) - (a.funding_total_usd ?? 0));
    case 'channels_desc': return sorted.sort((a, b) => b.total_channels - a.total_channels);
    case 'attack_desc': return sorted.sort((a, b) => b.attack_surface_count - a.attack_surface_count);
    case 'name_asc': return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default: return sorted;
  }
}

// ═══ Pill Style Helper ═══

function pillStyle(active: boolean, accentColor?: string): React.CSSProperties {
  return {
    padding: '6px 14px',
    borderRadius: '9999px',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid',
    borderColor: active ? (accentColor ?? 'var(--color-accent-primary)') : 'var(--color-border)',
    background: active ? `${accentColor ?? 'var(--color-accent-primary)'}18` : 'transparent',
    color: active ? (accentColor ?? 'var(--color-accent-primary)') : 'var(--color-text-muted)',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap' as const,
  };
}

// ═══ Search Bar ═══

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: 'relative', marginBottom: '16px' }}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-text-faint)"
        strokeWidth="2"
        style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search BCIs, clinical use-cases, tactics, techniques..."
        style={{
          width: '100%',
          padding: '14px 16px 14px 46px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          fontSize: '0.9375rem',
          outline: 'none',
          transition: 'border-color 0.15s ease',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent-primary)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
      />
    </div>
  );
}

// ═══ Lens Toggle ═══

function LensToggle({ lens, setLens }: { lens: LensMode; setLens: (l: LensMode) => void }) {
  return (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
      {(['security', 'clinical', 'market', 'research'] as LensMode[]).map(l => (
        <button
          key={l}
          onClick={() => setLens(l)}
          style={{
            ...pillStyle(lens === l),
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '0.875rem' }}>{LENS_ICONS[l]}</span>
          {LENS_LABELS[l]}
        </button>
      ))}
    </div>
  );
}

// ═══ Entity Toggle ═══

function EntityToggle({
  view, setView, deviceCount, companyCount,
}: {
  view: EntityView; setView: (v: EntityView) => void;
  deviceCount: number; companyCount: number;
}) {
  return (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
      <button onClick={() => setView('device')} style={pillStyle(view === 'device')}>
        Devices ({deviceCount})
      </button>
      <button onClick={() => setView('company')} style={pillStyle(view === 'company')}>
        Companies ({companyCount})
      </button>
    </div>
  );
}

// ═══ Filter Chips ═══

function FilterChips({
  selectedTypes, toggleType,
  selectedTargets, toggleTarget,
  selectedFda, toggleFda,
  availableTargets, availableFda,
}: {
  selectedTypes: Set<DeviceType>;
  toggleType: (t: DeviceType) => void;
  selectedTargets: Set<string>;
  toggleTarget: (t: string) => void;
  selectedFda: Set<string>;
  toggleFda: (f: string) => void;
  availableTargets: string[];
  availableFda: string[];
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)',
        marginBottom: '16px',
      }}
    >
      {/* Device type */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginRight: '4px', flexShrink: 0 }}>
          Type:
        </span>
        {(['invasive', 'semi_invasive', 'non_invasive'] as DeviceType[]).map(t => (
          <button
            key={t}
            onClick={() => toggleType(t)}
            style={pillStyle(selectedTypes.has(t), TYPE_COLORS[t].text)}
          >
            {TYPE_COLORS[t].label}
          </button>
        ))}
      </div>

      {/* Target use */}
      {availableTargets.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginRight: '4px', flexShrink: 0 }}>
            Use:
          </span>
          {availableTargets.map(t => (
            <button key={t} onClick={() => toggleTarget(t)} style={pillStyle(selectedTargets.has(t))}>
              {t}
            </button>
          ))}
        </div>
      )}

      {/* FDA status */}
      {availableFda.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginRight: '4px', flexShrink: 0 }}>
            FDA:
          </span>
          {availableFda.map(f => (
            <button key={f} onClick={() => toggleFda(f)} style={pillStyle(selectedFda.has(f), getFdaColor(f))}>
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══ More Filters Drawer ═══

function MoreFilters({
  open, setOpen,
  selectedStatuses, toggleStatus, availableStatuses,
  selectedPostures, togglePosture, availablePostures,
  selectedElectrodes, toggleElectrode, availableElectrodes,
  selectedCategories, toggleCategory, availableCategories,
  fundingRange, setFundingRange, maxFunding,
}: {
  open: boolean; setOpen: (o: boolean) => void;
  selectedStatuses: Set<string>; toggleStatus: (s: string) => void; availableStatuses: string[];
  selectedPostures: Set<string>; togglePosture: (p: string) => void; availablePostures: string[];
  selectedElectrodes: Set<string>; toggleElectrode: (e: string) => void; availableElectrodes: string[];
  selectedCategories: Set<string>; toggleCategory: (c: string) => void; availableCategories: string[];
  fundingRange: [number, number]; setFundingRange: (r: [number, number]) => void; maxFunding: number;
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          background: 'transparent',
          color: 'var(--color-text-muted)',
          fontSize: '0.8125rem',
          cursor: 'pointer',
          fontWeight: 500,
          transition: 'all 0.15s ease',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        More Filters
      </button>

      {open && (
        <div
          style={{
            marginTop: '10px',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Company status */}
          {availableStatuses.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginRight: '4px', flexShrink: 0 }}>
                Status:
              </span>
              {availableStatuses.map(s => (
                <button key={s} onClick={() => toggleStatus(s)} style={pillStyle(selectedStatuses.has(s))}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Security posture */}
          {availablePostures.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginRight: '4px', flexShrink: 0 }}>
                Security:
              </span>
              {availablePostures.map(p => (
                <button key={p} onClick={() => togglePosture(p)} style={pillStyle(selectedPostures.has(p), getSecurityColor(p))}>
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Electrode type */}
          {availableElectrodes.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginRight: '4px', flexShrink: 0 }}>
                Electrode:
              </span>
              {availableElectrodes.map(e => (
                <button key={e} onClick={() => toggleElectrode(e)} style={pillStyle(selectedElectrodes.has(e))}>
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* Company category */}
          {availableCategories.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginRight: '4px', flexShrink: 0 }}>
                Category:
              </span>
              {availableCategories.map(c => (
                <button key={c} onClick={() => toggleCategory(c)} style={pillStyle(selectedCategories.has(c))}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Funding range */}
          {maxFunding > 0 && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', flexShrink: 0 }}>
                Funding:
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {formatFunding(fundingRange[0])} &mdash; {formatFunding(fundingRange[1])}
              </span>
              <input
                type="range"
                min={0}
                max={maxFunding}
                step={maxFunding / 100}
                value={fundingRange[0]}
                onChange={e => setFundingRange([Number(e.target.value), fundingRange[1]])}
                style={{ flex: 1, minWidth: '80px', accentColor: 'var(--color-accent-primary)' }}
              />
              <input
                type="range"
                min={0}
                max={maxFunding}
                step={maxFunding / 100}
                value={fundingRange[1]}
                onChange={e => setFundingRange([fundingRange[0], Number(e.target.value)])}
                style={{ flex: 1, minWidth: '80px', accentColor: 'var(--color-accent-primary)' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══ Counter Bar ═══

function CounterBar({ filtered, total, stats }: {
  filtered: BciDeviceCard[];
  total: number;
  stats: { invasive: number; semi: number; non: number; fdaCleared: number };
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '10px 16px',
        borderRadius: '8px',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        marginBottom: '20px',
        fontSize: '0.8125rem',
        color: 'var(--color-text-muted)',
      }}
    >
      <span>
        Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filtered.length}</strong> of {total} devices
      </span>
      <span style={{ color: 'var(--color-border)' }}>|</span>
      <span style={{ color: TYPE_COLORS.invasive.text }}>
        {stats.invasive} invasive
      </span>
      <span style={{ color: TYPE_COLORS.non_invasive.text }}>
        {stats.non} non-invasive
      </span>
      <span style={{ color: TYPE_COLORS.semi_invasive.text }}>
        {stats.semi} semi-invasive
      </span>
      <span style={{ color: 'var(--color-border)' }}>|</span>
      <span style={{ color: '#22c55e' }}>
        {stats.fdaCleared} FDA cleared
      </span>
    </div>
  );
}

function CompanyCounterBar({ filtered, total }: { filtered: BciCompanyCard[]; total: number }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '10px 16px',
        borderRadius: '8px',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        marginBottom: '20px',
        fontSize: '0.8125rem',
        color: 'var(--color-text-muted)',
      }}
    >
      <span>
        Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filtered.length}</strong> of {total} companies
      </span>
    </div>
  );
}

// ═══ Metric Pill ═══

function MetricPill({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '0.6875rem',
        fontWeight: 500,
        background: color ? `${color}15` : 'rgba(148, 163, 184, 0.1)',
        color: color ?? 'var(--color-text-muted)',
        border: `1px solid ${color ? `${color}30` : 'var(--color-border)'}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '0.75rem' }}>{icon}</span>
      <span style={{ color: color ?? 'var(--color-text-primary)', fontWeight: 600 }}>{value}</span>
      <span style={{ color: 'var(--color-text-faint)' }}>{label}</span>
    </span>
  );
}

// ═══ Device Metric Pills by Lens ═══

function DeviceMetrics({ device, lens }: { device: BciDeviceCard; lens: LensMode }) {
  switch (lens) {
    case 'security':
      return (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <MetricPill
            icon={'\u{1F6E1}'}
            label=""
            value={device.security_posture}
            color={getSecurityColor(device.security_posture)}
          />
          <MetricPill icon={'\u{1F578}'} label="surfaces" value={String(device.attack_surface_count)} />
          <MetricPill
            icon={'\u{26A0}'}
            label="CVEs"
            value={String(device.cves_known.length)}
            color={device.cves_known.length > 0 ? '#ef4444' : undefined}
          />
        </div>
      );
    case 'clinical':
      return (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <MetricPill
            icon={'\u{2705}'}
            label=""
            value={device.fda_status || 'N/A'}
            color={getFdaColor(device.fda_status)}
          />
          <MetricPill icon={'\u{1F4E1}'} label="ch" value={String(device.channels)} />
          <MetricPill icon={'\u{1F4E6}'} label="" value={device.units_deployed || 'N/A'} />
        </div>
      );
    case 'market':
      return (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <MetricPill icon={'\u{1F4B0}'} label="" value={formatFunding(device.funding_total_usd)} />
          <MetricPill icon={'\u{1F3E2}'} label="" value={device.company_category || 'N/A'} />
          <MetricPill icon={'\u{1F4CD}'} label="" value={device.company_headquarters || 'N/A'} />
        </div>
      );
    case 'research':
      return (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <MetricPill icon={'\u{1F4E1}'} label="ch" value={String(device.channels)} />
          <MetricPill icon={'\u{1F9EA}'} label="" value={device.electrode_type || 'N/A'} />
          <MetricPill icon={'\u{1F4C5}'} label="" value={device.first_human || 'N/A'} />
        </div>
      );
  }
}

// ═══ Company Metric Pills by Lens ═══

function CompanyMetrics({ company, lens }: { company: BciCompanyCard; lens: LensMode }) {
  switch (lens) {
    case 'security':
      return (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <MetricPill
            icon={'\u{1F6E1}'}
            label=""
            value={company.security_posture}
            color={getSecurityColor(company.security_posture)}
          />
          <MetricPill icon={'\u{1F578}'} label="surfaces" value={String(company.attack_surface_count)} />
          <MetricPill icon={'\u{1F4BB}'} label="devices" value={String(company.device_count)} />
        </div>
      );
    case 'clinical':
      return (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <MetricPill
            icon={'\u{2705}'}
            label=""
            value={company.top_fda_status || 'N/A'}
            color={getFdaColor(company.top_fda_status)}
          />
          <MetricPill icon={'\u{1F4E1}'} label="ch" value={String(company.total_channels)} />
          <MetricPill icon={'\u{1F4BB}'} label="devices" value={String(company.device_count)} />
        </div>
      );
    case 'market':
      return (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <MetricPill icon={'\u{1F4B0}'} label="" value={formatFunding(company.funding_total_usd)} />
          <MetricPill icon={'\u{1F3E2}'} label="" value={company.category || 'N/A'} />
          <MetricPill icon={'\u{1F4BB}'} label="devices" value={String(company.device_count)} />
        </div>
      );
    case 'research':
      return (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <MetricPill icon={'\u{1F4E1}'} label="ch" value={String(company.total_channels)} />
          <MetricPill icon={'\u{1F4BB}'} label="devices" value={String(company.device_count)} />
          <MetricPill icon={'\u{1F4CD}'} label="" value={company.headquarters || 'N/A'} />
        </div>
      );
  }
}

// ═══ Device Card ═══

function DirectoryDeviceCard({
  device, lens, isExpanded, onClick,
}: {
  device: BciDeviceCard; lens: LensMode; isExpanded: boolean; onClick: () => void;
}) {
  const typeColor = TYPE_COLORS[device.device_type] ?? TYPE_COLORS.non_invasive;

  return (
    <div
      className="glass"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '16px',
        borderRadius: '12px',
        border: isExpanded ? `2px solid var(--color-accent-primary)` : '1px solid var(--color-border)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        width: '100%',
        boxSizing: 'border-box',
      }}
      onMouseEnter={e => {
        if (!isExpanded) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-accent-primary)';
      }}
      onMouseLeave={e => {
        if (!isExpanded) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            lineHeight: 1.3,
          }}>
            {device.device_name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginTop: '2px' }}>
            {device.company_name}
          </div>
        </div>
        <span
          style={{
            fontSize: '0.6875rem',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            background: typeColor.bg,
            color: typeColor.text,
          }}
        >
          {typeColor.label}
        </span>
      </div>

      {/* Metric pills — change with lens */}
      <DeviceMetrics device={device} lens={lens} />

      {/* Expanded detail */}
      {isExpanded && (
        <div
          style={{
            marginTop: '8px',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.8125rem',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--color-text-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4px',
          }}>
            Full Specifications
          </div>

          <DetailRow label="Device Type" value={typeColor.label} />
          <DetailRow label="Channels" value={String(device.channels)} />
          <DetailRow label="Electrode" value={device.electrode_type} />
          <DetailRow label="FDA Status" value={device.fda_status || 'N/A'} />
          <DetailRow label="Units Deployed" value={device.units_deployed || 'N/A'} />
          <DetailRow label="First Human" value={device.first_human || 'N/A'} />
          <DetailRow label="Target Use" value={device.target_use || 'N/A'} />
          <DetailRow label="Price" value={device.price_usd != null ? `$${device.price_usd.toLocaleString()}` : 'N/A'} />

          <div style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--color-text-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '8px',
            marginBottom: '4px',
          }}>
            Company
          </div>

          <DetailRow label="Company" value={device.company_name} />
          <DetailRow label="Type" value={device.company_type} />
          <DetailRow label="Status" value={device.company_status} />
          <DetailRow label="Category" value={device.company_category} />
          <DetailRow label="Headquarters" value={device.company_headquarters || 'N/A'} />
          <DetailRow label="Founded" value={device.company_founded || 'N/A'} />
          <DetailRow label="Funding" value={formatFunding(device.funding_total_usd)} />

          <div style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--color-text-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '8px',
            marginBottom: '4px',
          }}>
            Security
          </div>

          <DetailRow label="Security Posture" value={device.security_posture} />
          <DetailRow label="Security Notes" value={device.security_notes || 'None'} />
          <DetailRow label="Attack Surfaces" value={String(device.attack_surface_count)} />

          {/* Attack surface list */}
          {device.tara_attack_surface.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
              {device.tara_attack_surface.map(s => (
                <span
                  key={s}
                  style={{
                    fontSize: '0.625rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    fontWeight: 500,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* CVEs */}
          {device.cves_known.length > 0 && (
            <>
              <div style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: '#ef4444',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: '8px',
                marginBottom: '4px',
              }}>
                Known CVEs ({device.cves_known.length})
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {device.cves_known.map(cve => (
                  <span
                    key={cve}
                    style={{
                      fontSize: '0.6875rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {cve}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ═══ Company Card ═══

function DirectoryCompanyCard({
  company, lens, isExpanded, onClick,
}: {
  company: BciCompanyCard; lens: LensMode; isExpanded: boolean; onClick: () => void;
}) {
  return (
    <div
      className="glass"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '16px',
        borderRadius: '12px',
        border: isExpanded ? `2px solid var(--color-accent-primary)` : '1px solid var(--color-border)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        width: '100%',
        boxSizing: 'border-box',
      }}
      onMouseEnter={e => {
        if (!isExpanded) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-accent-primary)';
      }}
      onMouseLeave={e => {
        if (!isExpanded) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            lineHeight: 1.3,
          }}>
            {company.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginTop: '2px' }}>
            {company.category} &middot; {company.headquarters || 'N/A'}
          </div>
        </div>
        <span
          style={{
            fontSize: '0.6875rem',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            background: company.status.toLowerCase() === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.1)',
            color: company.status.toLowerCase() === 'active' ? '#22c55e' : '#94a3b8',
          }}
        >
          {company.status}
        </span>
      </div>

      {/* Metric pills */}
      <CompanyMetrics company={company} lens={lens} />

      {/* Expanded detail */}
      {isExpanded && (
        <div
          style={{
            marginTop: '8px',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.8125rem',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--color-text-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4px',
          }}>
            Company Details
          </div>

          <DetailRow label="Type" value={company.type} />
          <DetailRow label="Status" value={company.status} />
          <DetailRow label="Category" value={company.category} />
          <DetailRow label="Founded" value={company.founded || 'N/A'} />
          <DetailRow label="Headquarters" value={company.headquarters || 'N/A'} />
          <DetailRow label="Funding" value={formatFunding(company.funding_total_usd)} />
          <DetailRow label="Security Posture" value={company.security_posture} />
          <DetailRow label="Top FDA Status" value={company.top_fda_status || 'N/A'} />
          <DetailRow label="Total Channels" value={String(company.total_channels)} />
          <DetailRow label="Attack Surfaces" value={String(company.attack_surface_count)} />

          {/* Devices list */}
          {company.devices.length > 0 && (
            <>
              <div style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--color-text-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: '8px',
                marginBottom: '4px',
              }}>
                Devices ({company.devices.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {company.devices.map(d => {
                  const dtype = d.type as DeviceType;
                  const tc = TYPE_COLORS[dtype] ?? TYPE_COLORS.non_invasive;
                  return (
                    <div
                      key={d.name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-primary)',
                        gap: '8px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          {d.name}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-faint)', marginTop: '1px' }}>
                          {d.target_use || 'N/A'} &middot; {d.channels} ch &middot; {d.fda_status || 'N/A'}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.625rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 500,
                          background: tc.bg,
                          color: tc.text,
                          flexShrink: 0,
                        }}
                      >
                        {tc.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ═══ Detail Row ═══

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '4px 0',
      borderBottom: '1px solid var(--color-border)',
      gap: '12px',
    }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

// ═══ Main Component ═══

export default function BciDirectory({ devices, companies, stats }: Props) {
  // State
  const [search, setSearch] = useState('');
  const [lens, setLens] = useState<LensMode>('security');
  const [entityView, setEntityView] = useState<EntityView>('device');
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState('channels_desc');
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<Set<DeviceType>>(new Set());
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [selectedFda, setSelectedFda] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [selectedPostures, setSelectedPostures] = useState<Set<string>>(new Set());
  const [selectedElectrodes, setSelectedElectrodes] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const maxFunding = useMemo(() => {
    let max = 0;
    for (const d of devices) {
      if (d.funding_total_usd != null && d.funding_total_usd > max) max = d.funding_total_usd;
    }
    return max;
  }, [devices]);

  const [fundingRange, setFundingRange] = useState<[number, number]>([0, maxFunding]);

  // Available filter values
  const availableTargets = useMemo(() => {
    const targets = new Set<string>();
    for (const d of devices) if (d.target_use) targets.add(d.target_use);
    return [...targets].sort();
  }, [devices]);

  const availableFda = useMemo(() => {
    const fda = new Set<string>();
    for (const d of devices) if (d.fda_status) fda.add(d.fda_status);
    return [...fda].sort();
  }, [devices]);

  const availableStatuses = useMemo(() => {
    const s = new Set<string>();
    for (const d of devices) if (d.company_status) s.add(d.company_status);
    return [...s].sort();
  }, [devices]);

  const availablePostures = useMemo(() => {
    const p = new Set<string>();
    for (const d of devices) if (d.security_posture) p.add(d.security_posture);
    return [...p].sort();
  }, [devices]);

  const availableElectrodes = useMemo(() => {
    const e = new Set<string>();
    for (const d of devices) if (d.electrode_type) e.add(d.electrode_type);
    return [...e].sort();
  }, [devices]);

  const availableCategories = useMemo(() => {
    const c = new Set<string>();
    for (const d of devices) if (d.company_category) c.add(d.company_category);
    return [...c].sort();
  }, [devices]);

  // Toggle helpers
  const toggleSet = useCallback(<T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) => {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }, []);

  const toggleType = useCallback((t: DeviceType) => toggleSet(setSelectedTypes, t), [toggleSet]);
  const toggleTarget = useCallback((t: string) => toggleSet(setSelectedTargets, t), [toggleSet]);
  const toggleFda = useCallback((f: string) => toggleSet(setSelectedFda, f), [toggleSet]);
  const toggleStatus = useCallback((s: string) => toggleSet(setSelectedStatuses, s), [toggleSet]);
  const togglePosture = useCallback((p: string) => toggleSet(setSelectedPostures, p), [toggleSet]);
  const toggleElectrode = useCallback((e: string) => toggleSet(setSelectedElectrodes, e), [toggleSet]);
  const toggleCategory = useCallback((c: string) => toggleSet(setSelectedCategories, c), [toggleSet]);

  // Filter + sort devices
  const filteredDevices = useMemo(() => {
    let result = devices.filter(d => {
      if (search && !matchesSearch(getDeviceSearchText(d), search)) return false;
      if (selectedTypes.size > 0 && !selectedTypes.has(d.device_type)) return false;
      if (selectedTargets.size > 0 && !selectedTargets.has(d.target_use)) return false;
      if (selectedFda.size > 0 && !selectedFda.has(d.fda_status)) return false;
      if (selectedStatuses.size > 0 && !selectedStatuses.has(d.company_status)) return false;
      if (selectedPostures.size > 0 && !selectedPostures.has(d.security_posture)) return false;
      if (selectedElectrodes.size > 0 && !selectedElectrodes.has(d.electrode_type)) return false;
      if (selectedCategories.size > 0 && !selectedCategories.has(d.company_category)) return false;
      if (d.funding_total_usd != null) {
        if (d.funding_total_usd < fundingRange[0] || d.funding_total_usd > fundingRange[1]) return false;
      }
      return true;
    });
    return sortDevices(result, sortKey);
  }, [devices, search, selectedTypes, selectedTargets, selectedFda, selectedStatuses, selectedPostures, selectedElectrodes, selectedCategories, fundingRange, sortKey]);

  // Filter + sort companies
  const filteredCompanies = useMemo(() => {
    let result = companies.filter(c => {
      if (search && !matchesSearch(getCompanySearchText(c), search)) return false;
      if (selectedStatuses.size > 0 && !selectedStatuses.has(c.status)) return false;
      if (selectedPostures.size > 0 && !selectedPostures.has(c.security_posture)) return false;
      if (selectedCategories.size > 0 && !selectedCategories.has(c.category)) return false;
      if (c.funding_total_usd != null) {
        if (c.funding_total_usd < fundingRange[0] || c.funding_total_usd > fundingRange[1]) return false;
      }
      // Type filter: if type filters are active, company must have at least one device of that type
      if (selectedTypes.size > 0) {
        const hasMatch = c.devices.some(d => selectedTypes.has(d.type as DeviceType));
        if (!hasMatch) return false;
      }
      // FDA filter
      if (selectedFda.size > 0) {
        const hasMatch = c.devices.some(d => selectedFda.has(d.fda_status));
        if (!hasMatch) return false;
      }
      // Target filter
      if (selectedTargets.size > 0) {
        const hasMatch = c.devices.some(d => selectedTargets.has(d.target_use));
        if (!hasMatch) return false;
      }
      return true;
    });
    return sortCompanies(result, sortKey);
  }, [companies, search, selectedTypes, selectedTargets, selectedFda, selectedStatuses, selectedPostures, selectedCategories, fundingRange, sortKey]);

  // Counter bar stats
  const counterStats = useMemo(() => ({
    invasive: filteredDevices.filter(d => d.device_type === 'invasive').length,
    semi: filteredDevices.filter(d => d.device_type === 'semi_invasive').length,
    non: filteredDevices.filter(d => d.device_type === 'non_invasive').length,
    fdaCleared: filteredDevices.filter(d => d.fda_status?.toLowerCase().includes('cleared') || d.fda_status?.toLowerCase().includes('approved')).length,
  }), [filteredDevices]);

  // Sort options for current lens + entity
  const sortOptions = useMemo(() => {
    const opts = entityView === 'device' ? DEVICE_SORT_OPTIONS : COMPANY_SORT_OPTIONS;
    return opts.filter(o => o.lenses.includes(lens));
  }, [lens, entityView]);

  // Reset sort when lens or entity changes if current sort is not available
  const effectiveSortKey = useMemo(() => {
    if (sortOptions.some(o => o.key === sortKey)) return sortKey;
    return sortOptions[0]?.key ?? 'name_asc';
  }, [sortOptions, sortKey]);

  return (
    <div>
      {/* Stats banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <StatCard label="Companies" value={stats.totalCompanies} />
        <StatCard label="Devices" value={stats.totalDevices} />
        <StatCard label="Invasive" value={stats.byType['invasive'] ?? 0} color={TYPE_COLORS.invasive.text} />
        <StatCard label="Semi-Invasive" value={stats.byType['semi_invasive'] ?? 0} color={TYPE_COLORS.semi_invasive.text} />
        <StatCard label="Non-Invasive" value={stats.byType['non_invasive'] ?? 0} color={TYPE_COLORS.non_invasive.text} />
      </div>

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} />

      {/* Lens toggle */}
      <LensToggle lens={lens} setLens={setLens} />

      {/* Entity toggle */}
      <EntityToggle
        view={entityView}
        setView={setEntityView}
        deviceCount={stats.totalDevices}
        companyCount={stats.totalCompanies}
      />

      {/* Filter chips */}
      <FilterChips
        selectedTypes={selectedTypes}
        toggleType={toggleType}
        selectedTargets={selectedTargets}
        toggleTarget={toggleTarget}
        selectedFda={selectedFda}
        toggleFda={toggleFda}
        availableTargets={availableTargets}
        availableFda={availableFda}
      />

      {/* More filters */}
      <MoreFilters
        open={moreFiltersOpen}
        setOpen={setMoreFiltersOpen}
        selectedStatuses={selectedStatuses}
        toggleStatus={toggleStatus}
        availableStatuses={availableStatuses}
        selectedPostures={selectedPostures}
        togglePosture={togglePosture}
        availablePostures={availablePostures}
        selectedElectrodes={selectedElectrodes}
        toggleElectrode={toggleElectrode}
        availableElectrodes={availableElectrodes}
        selectedCategories={selectedCategories}
        toggleCategory={toggleCategory}
        availableCategories={availableCategories}
        fundingRange={fundingRange}
        setFundingRange={setFundingRange}
        maxFunding={maxFunding}
      />

      {/* Sort dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>Sort:</span>
        <select
          value={effectiveSortKey}
          onChange={e => setSortKey(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
          }}
        >
          {sortOptions.map(o => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Counter bar */}
      {entityView === 'device' ? (
        <CounterBar
          filtered={filteredDevices}
          total={devices.length}
          stats={counterStats}
        />
      ) : (
        <CompanyCounterBar filtered={filteredCompanies} total={companies.length} />
      )}

      {/* Card grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '12px',
          alignContent: 'start',
        }}
      >
        {entityView === 'device' ? (
          <>
            {filteredDevices.map(d => (
              <DirectoryDeviceCard
                key={`${d.company_name}-${d.device_name}`}
                device={d}
                lens={lens}
                isExpanded={expandedDevice === `${d.company_name}-${d.device_name}`}
                onClick={() => setExpandedDevice(
                  expandedDevice === `${d.company_name}-${d.device_name}` ? null : `${d.company_name}-${d.device_name}`
                )}
              />
            ))}
            {filteredDevices.length === 0 && (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--color-text-faint)',
                fontSize: '0.875rem',
                gridColumn: '1 / -1',
              }}>
                No devices match the current filters.
              </div>
            )}
          </>
        ) : (
          <>
            {filteredCompanies.map(c => (
              <DirectoryCompanyCard
                key={c.name}
                company={c}
                lens={lens}
                isExpanded={expandedCompany === c.name}
                onClick={() => setExpandedCompany(expandedCompany === c.name ? null : c.name)}
              />
            ))}
            {filteredCompanies.length === 0 && (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--color-text-faint)',
                fontSize: '0.875rem',
                gridColumn: '1 / -1',
              }}>
                No companies match the current filters.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ═══ Stat Card ═══

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)',
        textAlign: 'center',
      }}
    >
      <div style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        color: color ?? 'var(--color-text-primary)',
        fontFamily: 'var(--font-heading)',
      }}>
        {value}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginTop: '2px' }}>{label}</div>
    </div>
  );
}
