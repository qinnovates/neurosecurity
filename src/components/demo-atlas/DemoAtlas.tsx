/**
 * DemoAtlas — Unified BCI threat/therapeutic exploration tool.
 * Single React island managing all panel state with URL sync.
 *
 * Architecture: Hub → Device Picker / Condition Picker → Profile → Threats → Signals → Console
 * All data injected as props at build time. Zero runtime fetches.
 * All counts computed from props. ZERO hardcoded numbers.
 */

import { useState, useMemo, useCallback, useEffect, type CSSProperties } from 'react';
import NTSSGauge, { computeNTSS } from './NTSSGauge';

// ── Types ──────────────────────────────────────────────────────────────

type View = 'hub' | 'devices' | 'device-profile' | 'conditions' | 'therapeutic' | 'threats' | 'signals' | 'console';

interface Technique {
  id: string; attack: string; tara_alias: string;
  tara_domain_primary: string; tara_domain_secondary: string[];
  tara_mode: string; tactic: string; severity: string; status: string;
  bands: string; band_ids: string[]; ui_category: string;
  niss: { score: number; severity: string; vector: string };
  mechanism: string; dual_use: string;
  clinical: { therapeutic_analog: string; conditions: string[]; fda_status: string; evidence_level: string } | null;
  physics_tier: number | null; physics_label: string; sources: string[];
}

interface Device {
  name: string; company: string; type: string; channels: number;
  modality: string; fda_status: string; sampling_rate: number;
  electrode_type: string; tara_attack_surface: string[];
}

interface EEGSample {
  name: string; source: string; type: string; channels: number;
  samplingRateHz: number; format: string; license: string;
  subjects: number; paradigm: string; taraId: string;
  taraRelevance: string; condition: string[]; dsm5Code: string; url: string;
}

interface Stats {
  totalTechniques: number; totalDevices: number; totalCompanies: number;
  totalEEG: number; totalParquet: number; totalDomains: number;
  totalTactics: number; totalConditions: number; dualUse: number;
  severityBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  domainBreakdown: Record<string, number>;
}

interface DemoAtlasProps {
  techniques: Technique[];
  devices: Device[];
  eegSamples: EEGSample[];
  stats: Stats;
  conditions: string[];
}

// ── Styles ─────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444', high: '#f59e0b', medium: '#eab308', low: '#94a3b8',
};

const STATUS_BADGES: Record<string, string> = {
  CONFIRMED: '#22c55e', DEMONSTRATED: '#3b82f6', EMERGING: '#a855f7',
  THEORETICAL: '#6b7280', PLAUSIBLE: '#78716c', SPECULATIVE: '#44403c',
};

const S: Record<string, CSSProperties> = {
  container: {
    minHeight: '80vh', color: 'var(--color-text-primary, #e2e8f0)',
    fontFamily: 'var(--font-sans, system-ui)', fontSize: '14px',
  },
  layout: { display: 'flex', gap: '1px', minHeight: '75vh' },
  sidebar: {
    width: '240px', flexShrink: 0, padding: '16px',
    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)',
    borderRight: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '12px 0 0 12px',
  },
  main: {
    flex: 1, padding: '24px',
    background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(8px)',
    borderRadius: '0 12px 12px 0', overflow: 'auto',
  },
  hubContainer: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '32px', padding: '48px 24px' },
  hubTitle: { fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center' as const },
  hubSubtitle: { fontSize: '15px', opacity: 0.7, textAlign: 'center' as const, maxWidth: '600px', lineHeight: 1.6 },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', width: '100%', maxWidth: '800px' },
  card: {
    padding: '24px', borderRadius: '12px', cursor: 'pointer',
    background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(148, 163, 184, 0.12)', transition: 'all 0.2s',
  },
  cardHover: { border: '1px solid rgba(148, 163, 184, 0.3)', transform: 'translateY(-2px)' },
  statsBar: {
    display: 'flex', flexWrap: 'wrap' as const, gap: '16px', justifyContent: 'center',
    padding: '16px', fontSize: '12px', opacity: 0.6, fontFamily: 'var(--font-mono, monospace)',
  },
  badge: {
    display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
    fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)',
  },
  searchInput: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)',
    color: 'var(--color-text-primary, #e2e8f0)', fontSize: '14px', outline: 'none',
  },
  filterChip: {
    display: 'inline-block', padding: '4px 12px', borderRadius: '16px',
    fontSize: '12px', cursor: 'pointer', border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'transparent', color: 'var(--color-text-primary, #e2e8f0)', transition: 'all 0.15s',
  },
  filterChipActive: { background: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.5)' },
  techCard: {
    padding: '14px', borderRadius: '8px', cursor: 'pointer',
    background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(148, 163, 184, 0.08)',
    transition: 'all 0.15s', marginBottom: '6px',
  },
  sidebarLink: {
    display: 'block', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
    fontSize: '13px', transition: 'all 0.15s', border: 'none', background: 'none',
    color: 'var(--color-text-primary, #e2e8f0)', width: '100%', textAlign: 'left' as const,
  },
  sidebarLinkActive: { background: 'rgba(59, 130, 246, 0.15)', fontWeight: 600 },
  sectionTitle: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.1em', opacity: 0.5, marginBottom: '8px' },
  specGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' },
  specItem: { padding: '10px', borderRadius: '6px', background: 'rgba(30, 41, 59, 0.4)', textAlign: 'center' as const },
  specValue: { fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' },
  specLabel: { fontSize: '11px', opacity: 0.5, marginTop: '2px' },
  disclaimer: { fontSize: '11px', opacity: 0.4, textAlign: 'center' as const, fontStyle: 'italic' },
};

// ── URL State ──────────────────────────────────────────────────────────

function readURL(): { view: View; device: string; condition: string; technique: string } {
  if (typeof window === 'undefined') return { view: 'hub', device: '', condition: '', technique: '' };
  const p = new URLSearchParams(window.location.search);
  return {
    view: (p.get('view') as View) || (p.get('device') ? 'device-profile' : p.get('condition') ? 'therapeutic' : 'hub'),
    device: p.get('device') || '',
    condition: p.get('condition') || '',
    technique: p.get('technique') || '',
  };
}

function writeURL(params: Record<string, string>) {
  if (typeof window === 'undefined') return;
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) { if (v) p.set(k, v); }
  const qs = p.toString();
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
}

// ── Component ──────────────────────────────────────────────────────────

export default function DemoAtlas({ techniques, devices, eegSamples, stats, conditions }: DemoAtlasProps) {
  const initial = readURL();
  const [view, setView] = useState<View>(initial.view);
  const [selectedDevice, setSelectedDevice] = useState<string>(initial.device);
  const [selectedCondition, setSelectedCondition] = useState<string>(initial.condition);
  const [selectedTechnique, setSelectedTechnique] = useState<string>(initial.technique);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [expandedTech, setExpandedTech] = useState<string | null>(null);

  // URL sync
  useEffect(() => {
    writeURL({ view: view === 'hub' ? '' : view, device: selectedDevice, condition: selectedCondition, technique: selectedTechnique });
  }, [view, selectedDevice, selectedCondition, selectedTechnique]);

  // Navigation helpers
  const navigate = useCallback((v: View, opts?: { device?: string; condition?: string; technique?: string }) => {
    setView(v);
    if (opts?.device !== undefined) setSelectedDevice(opts.device);
    if (opts?.condition !== undefined) setSelectedCondition(opts.condition);
    if (opts?.technique !== undefined) setSelectedTechnique(opts.technique);
  }, []);

  const startOver = useCallback(() => {
    setView('hub'); setSelectedDevice(''); setSelectedCondition('');
    setSelectedTechnique(''); setSearch(''); setTypeFilter(''); setExpandedTech(null);
  }, []);

  // Data lookups
  const device = useMemo(() => devices.find(d => d.name === selectedDevice), [devices, selectedDevice]);
  const technique = useMemo(() => techniques.find(t => t.id === selectedTechnique), [techniques, selectedTechnique]);

  // Filtered techniques
  const matchedTechniques = useMemo(() => {
    if (device) return techniques.filter(t => device.tara_attack_surface.includes(t.id));
    if (selectedCondition) return techniques.filter(t => t.clinical?.conditions?.some(c => c.toLowerCase().includes(selectedCondition.toLowerCase())));
    return techniques;
  }, [techniques, device, selectedCondition]);

  // Filtered EEG
  const matchedEEG = useMemo(() => {
    if (selectedTechnique) return eegSamples.filter(s => s.taraId === selectedTechnique);
    if (selectedCondition) return eegSamples.filter(s => s.condition?.some(c => c.toLowerCase().includes(selectedCondition.toLowerCase())));
    if (device) return eegSamples.filter(s => matchedTechniques.some(t => t.id === s.taraId));
    return eegSamples;
  }, [eegSamples, selectedTechnique, selectedCondition, device, matchedTechniques]);

  // Device types for filter
  const deviceTypes = useMemo(() => [...new Set(devices.map(d => d.type).filter(Boolean))], [devices]);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    let result = devices;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d => d.name.toLowerCase().includes(q) || d.company.toLowerCase().includes(q));
    }
    if (typeFilter) result = result.filter(d => d.type === typeFilter);
    return result;
  }, [devices, search, typeFilter]);

  // Severity counts for matched techniques
  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of matchedTechniques) counts[t.severity] = (counts[t.severity] || 0) + 1;
    return counts;
  }, [matchedTechniques]);

  // ── Render Panels ──────────────────────────────────────────────────

  const renderHub = () => (
    <div style={S.hubContainer}>
      <div>
        <h1 style={S.hubTitle}>Demo Atlas</h1>
        <p style={S.hubSubtitle}>
          Explore BCI threats, therapeutic analogs, and neural signal data in one unified workflow.
          Select a starting point below.
        </p>
      </div>
      <div style={S.cardGrid}>
        {[
          { key: 'security', label: 'Security Researcher', color: '#ef4444', desc: 'Start with a BCI device or threat category', action: () => navigate('devices') },
          { key: 'clinical', label: 'Clinician', color: '#22c55e', desc: 'Start with a condition or therapeutic area', action: () => navigate('conditions') },
          { key: 'analyst', label: 'Data Analyst', color: '#3b82f6', desc: 'Query the datalake directly (KQL + SQL)', action: () => navigate('threats') },
        ].map(c => (
          <div key={c.key}
            style={{ ...S.card, ...(hoveredCard === c.key ? S.cardHover : {}), borderTop: `2px solid ${c.color}` }}
            onMouseEnter={() => setHoveredCard(c.key)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={c.action}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: c.color, marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{c.label}</div>
            <div style={{ fontSize: '13px', opacity: 0.7, lineHeight: 1.5 }}>{c.desc}</div>
          </div>
        ))}
      </div>
      <div style={S.statsBar}>
        <span>{stats.totalTechniques} techniques</span>
        <span>{stats.totalDevices} devices</span>
        <span>{stats.totalEEG} EEG datasets</span>
        <span>{stats.totalParquet} Parquet tables</span>
        <span>{stats.totalDomains} domains</span>
        <span>{stats.dualUse} dual-use</span>
      </div>
      <p style={S.disclaimer}>Proposed framework. Not validated. Open to critique.</p>
    </div>
  );

  const renderDevicePicker = () => (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Select a BCI Device</h2>
      <input style={S.searchInput} placeholder="Search devices or companies..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '12px 0' }}>
        <button style={{ ...S.filterChip, ...(!typeFilter ? S.filterChipActive : {}) }} onClick={() => setTypeFilter('')}>All ({devices.length})</button>
        {deviceTypes.map(t => (
          <button key={t} style={{ ...S.filterChip, ...(typeFilter === t ? S.filterChipActive : {}) }} onClick={() => setTypeFilter(typeFilter === t ? '' : t)}>
            {t} ({devices.filter(d => d.type === t).length})
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
        {filteredDevices.map(d => (
          <div key={`${d.company}-${d.name}`}
            style={{ ...S.techCard, ...(hoveredCard === d.name ? { borderColor: 'rgba(59,130,246,0.4)' } : {}) }}
            onMouseEnter={() => setHoveredCard(d.name)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate('device-profile', { device: d.name })}
          >
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{d.name}</div>
            <div style={{ fontSize: '11px', opacity: 0.5 }}>{d.company}</div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {d.type && <span style={{ ...S.badge, background: 'rgba(59,130,246,0.15)', color: '#93c5fd' }}>{d.type}</span>}
              <span style={{ ...S.badge, background: 'rgba(148,163,184,0.1)', color: '#94a3b8' }}>{d.channels} ch</span>
              {d.tara_attack_surface.length > 0 && (
                <span style={{ ...S.badge, background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>{d.tara_attack_surface.length} threats</span>
              )}
            </div>
          </div>
        ))}
        {filteredDevices.length === 0 && <p style={{ opacity: 0.5, gridColumn: '1/-1' }}>No devices match "{search}"</p>}
      </div>
    </div>
  );

  const renderDeviceProfile = () => {
    if (!device) return <p style={{ opacity: 0.5 }}>Device not found. <button style={{ color: '#3b82f6', cursor: 'pointer', background: 'none', border: 'none' }} onClick={startOver}>Start over</button></p>;
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{device.name}</h2>
          {device.type && <span style={{ ...S.badge, background: 'rgba(59,130,246,0.15)', color: '#93c5fd' }}>{device.type}</span>}
        </div>
        <div style={{ fontSize: '13px', opacity: 0.6, marginBottom: '16px' }}>{device.company}</div>
        <div style={S.specGrid}>
          {[
            { v: device.channels, l: 'Channels' },
            { v: device.modality || '—', l: 'Modality' },
            { v: device.sampling_rate ? `${device.sampling_rate} Hz` : '—', l: 'Sampling' },
            { v: device.fda_status || '—', l: 'FDA Status' },
            { v: device.electrode_type || '—', l: 'Electrode' },
            { v: device.tara_attack_surface.length, l: 'Threats' },
          ].map((s, i) => (
            <div key={i} style={S.specItem}>
              <div style={S.specValue}>{s.v}</div>
              <div style={S.specLabel}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
            Auto-Matched Threats ({matchedTechniques.length})
          </h3>
          {Object.keys(severityCounts).length > 0 && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              {['critical', 'high', 'medium', 'low'].map(sev => severityCounts[sev] ? (
                <span key={sev} style={{ ...S.badge, background: `${SEVERITY_COLORS[sev]}20`, color: SEVERITY_COLORS[sev] }}>
                  {severityCounts[sev]} {sev}
                </span>
              ) : null)}
            </div>
          )}
          {renderTechniqueList(matchedTechniques)}
        </div>
      </div>
    );
  };

  const renderConditionPicker = () => {
    const conditionTechCount = (cond: string) => techniques.filter(t => t.clinical?.conditions?.some(c => c.toLowerCase().includes(cond.toLowerCase()))).length;
    const conditionEEGCount = (cond: string) => eegSamples.filter(s => s.condition?.some(c => c.toLowerCase().includes(cond.toLowerCase()))).length;
    const sorted = conditions.filter(c => conditionTechCount(c) > 0).sort((a, b) => conditionTechCount(b) - conditionTechCount(a));

    return (
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Select a Condition</h2>
        <input style={S.searchInput} placeholder="Search conditions..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '16px' }}>
          {sorted.filter(c => !search || c.toLowerCase().includes(search.toLowerCase())).map(c => (
            <div key={c}
              style={{ ...S.techCard, ...(hoveredCard === c ? { borderColor: 'rgba(34,197,94,0.4)' } : {}) }}
              onMouseEnter={() => setHoveredCard(c)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => navigate('therapeutic', { condition: c })}
            >
              <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>{c}</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ ...S.badge, background: 'rgba(34,197,94,0.1)', color: '#86efac' }}>{conditionTechCount(c)} techniques</span>
                {conditionEEGCount(c) > 0 && <span style={{ ...S.badge, background: 'rgba(59,130,246,0.1)', color: '#93c5fd' }}>{conditionEEGCount(c)} EEG</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTherapeuticProfile = () => (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{selectedCondition}</h2>
      <p style={{ fontSize: '13px', opacity: 0.6, marginBottom: '20px' }}>
        {matchedTechniques.length} techniques with therapeutic analogs for this condition
      </p>
      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>Therapeutic Techniques</h3>
      {renderTechniqueList(matchedTechniques)}
      {matchedEEG.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>Matching EEG Data ({matchedEEG.length})</h3>
          {matchedEEG.map(s => renderEEGCard(s))}
        </div>
      )}
    </div>
  );

  const renderTechniqueList = (techs: Technique[]) => (
    <div>
      {techs.sort((a, b) => b.niss.score - a.niss.score).map(t => (
        <div key={t.id} style={S.techCard} onClick={() => setExpandedTech(expandedTech === t.id ? null : t.id)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', opacity: 0.5 }}>{t.id}</span>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>{t.attack}</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {t.dual_use && t.dual_use !== 'none' && <span style={{ ...S.badge, background: 'rgba(168,85,247,0.15)', color: '#c4b5fd' }}>dual-use</span>}
              <span style={{ ...S.badge, background: `${SEVERITY_COLORS[t.severity] || '#6b7280'}20`, color: SEVERITY_COLORS[t.severity] || '#6b7280' }}>{t.severity}</span>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', fontWeight: 700 }}>{t.niss.score.toFixed(1)}</span>
            </div>
          </div>
          {t.tara_alias && (
            <div style={{ marginTop: '4px' }}>
              <span style={{ ...S.badge, background: 'rgba(148,163,184,0.08)', color: '#94a3b8', fontSize: '10px' }}>{t.tara_alias}</span>
              {t.clinical?.fda_status && t.clinical.fda_status !== 'none' && (
                <span style={{ ...S.badge, background: 'rgba(34,197,94,0.1)', color: '#86efac', fontSize: '10px', marginLeft: '4px' }}>FDA: {t.clinical.fda_status}</span>
              )}
              <span style={{ ...S.badge, background: `${STATUS_BADGES[t.status] || '#6b7280'}20`, color: STATUS_BADGES[t.status] || '#6b7280', fontSize: '10px', marginLeft: '4px' }}>{t.status}</span>
            </div>
          )}
          {expandedTech === t.id && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(148,163,184,0.1)', fontSize: '12px', lineHeight: 1.6 }}>
              {t.mechanism && <p style={{ marginBottom: '8px' }}><strong>Mechanism:</strong> {t.mechanism}</p>}
              {t.clinical?.therapeutic_analog && <p style={{ marginBottom: '4px' }}><strong>Clinical analog:</strong> {t.clinical.therapeutic_analog}</p>}
              {t.clinical?.conditions && t.clinical.conditions.length > 0 && <p style={{ marginBottom: '4px' }}><strong>Conditions:</strong> {t.clinical.conditions.join(', ')}</p>}
              {t.bands && <p style={{ marginBottom: '4px' }}><strong>Bands:</strong> {t.bands}</p>}
              {t.physics_label && <p><strong>Physics:</strong> Tier {t.physics_tier} ({t.physics_label})</p>}
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <button style={{ ...S.filterChip, fontSize: '11px' }} onClick={(e) => { e.stopPropagation(); navigate('signals', { technique: t.id }); }}>
                  View Signal Patterns
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      {techs.length === 0 && <p style={{ opacity: 0.4, fontSize: '13px' }}>No techniques match this context.</p>}
    </div>
  );

  const renderEEGCard = (s: EEGSample, showGauge = false) => {
    const taraMatchCount = techniques.filter(t => t.id === s.taraId).length + (s.condition?.length || 0);
    const ntssInput = {
      taraMatchCount, totalTechniques: stats.totalTechniques,
      channels: s.channels, samplingRateHz: s.samplingRateHz,
      clinicalConditionCount: s.condition?.length || 0,
      datasetName: s.name, subjects: s.subjects, paradigm: s.paradigm,
    };
    const ntss = computeNTSS(ntssInput);

    return (
      <div key={s.name} style={{ ...S.techCard, marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{s.name}</div>
            {s.taraRelevance && <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px', lineHeight: 1.5 }}>{s.taraRelevance}</p>}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ ...S.badge, background: 'rgba(148,163,184,0.08)' }}>{s.channels} ch</span>
              <span style={{ ...S.badge, background: 'rgba(148,163,184,0.08)' }}>{s.samplingRateHz} Hz</span>
              {s.subjects > 0 && <span style={{ ...S.badge, background: 'rgba(148,163,184,0.08)' }}>{s.subjects} subjects</span>}
              {s.taraId && <span style={{ ...S.badge, background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>{s.taraId}</span>}
              {s.condition?.map(c => <span key={c} style={{ ...S.badge, background: 'rgba(34,197,94,0.08)', color: '#86efac' }}>{c}</span>)}
            </div>
          </div>
          {/* Compact NTSS gauge */}
          <div style={{ marginLeft: '12px', flexShrink: 0 }}>
            <NTSSGauge input={ntssInput} compact />
          </div>
        </div>
        {showGauge && (
          <div style={{ marginTop: '12px' }}>
            <NTSSGauge input={ntssInput} />
          </div>
        )}
      </div>
    );
  };

  const [expandedEEG, setExpandedEEG] = useState<string | null>(null);

  const renderSignals = () => (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
        Signal Explorer {selectedTechnique && `— ${selectedTechnique}`}
      </h2>
      <p style={{ fontSize: '13px', opacity: 0.6, marginBottom: '16px' }}>
        {matchedEEG.length} EEG dataset{matchedEEG.length !== 1 ? 's' : ''} match current context.
        Click any dataset to view its Neural Threat Surface Score (NTSS) and Coherence Metric (Cs).
      </p>
      {matchedEEG.map(s => (
        <div key={s.name} onClick={() => setExpandedEEG(expandedEEG === s.name ? null : s.name)} style={{ cursor: 'pointer' }}>
          {renderEEGCard(s, expandedEEG === s.name)}
        </div>
      ))}
      {matchedEEG.length === 0 && (
        <div style={{ padding: '32px', textAlign: 'center', opacity: 0.4 }}>
          <p>No EEG data mapped to this context.</p>
          <button style={{ ...S.filterChip, marginTop: '12px' }} onClick={() => { setSelectedDevice(''); setSelectedCondition(''); setSelectedTechnique(''); setView('signals'); }}>
            Browse all {stats.totalEEG} datasets
          </button>
        </div>
      )}
    </div>
  );

  const renderThreats = () => (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
        TARA Pattern Map ({matchedTechniques.length} techniques)
      </h2>
      {renderTechniqueList(matchedTechniques)}
    </div>
  );

  // ── Sidebar ────────────────────────────────────────────────────────

  const renderSidebar = () => (
    <div style={S.sidebar}>
      <div style={S.sectionTitle}>Context</div>
      {selectedDevice && (
        <div style={{ fontSize: '12px', marginBottom: '12px', padding: '8px', borderRadius: '6px', background: 'rgba(59,130,246,0.08)' }}>
          <div style={{ opacity: 0.5, fontSize: '10px' }}>Device</div>
          <div style={{ fontWeight: 600 }}>{selectedDevice}</div>
        </div>
      )}
      {selectedCondition && (
        <div style={{ fontSize: '12px', marginBottom: '12px', padding: '8px', borderRadius: '6px', background: 'rgba(34,197,94,0.08)' }}>
          <div style={{ opacity: 0.5, fontSize: '10px' }}>Condition</div>
          <div style={{ fontWeight: 600 }}>{selectedCondition}</div>
        </div>
      )}
      {selectedTechnique && (
        <div style={{ fontSize: '12px', marginBottom: '12px', padding: '8px', borderRadius: '6px', background: 'rgba(168,85,247,0.08)' }}>
          <div style={{ opacity: 0.5, fontSize: '10px' }}>Technique</div>
          <div style={{ fontWeight: 600 }}>{selectedTechnique}</div>
        </div>
      )}
      {!selectedDevice && !selectedCondition && !selectedTechnique && (
        <div style={{ fontSize: '12px', opacity: 0.4, marginBottom: '12px' }}>No context selected</div>
      )}

      <div style={{ ...S.sectionTitle, marginTop: '16px' }}>Panels</div>
      {([
        ['hub', 'Hub'],
        ['devices', 'Devices'],
        ['device-profile', 'Device Profile'],
        ['conditions', 'Conditions'],
        ['therapeutic', 'Therapeutics'],
        ['threats', 'All Techniques'],
        ['signals', 'Signal Explorer'],
      ] as [View, string][]).map(([v, label]) => (
        <button key={v}
          style={{ ...S.sidebarLink, ...(view === v ? S.sidebarLinkActive : {}) }}
          onClick={() => setView(v)}
        >{label}</button>
      ))}

      <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
        <button style={{ ...S.filterChip, width: '100%', textAlign: 'center' }} onClick={startOver}>
          Start Over
        </button>
      </div>
    </div>
  );

  // ── Main Render ────────────────────────────────────────────────────

  const panels: Record<View, () => JSX.Element> = {
    'hub': renderHub,
    'devices': renderDevicePicker,
    'device-profile': renderDeviceProfile,
    'conditions': renderConditionPicker,
    'therapeutic': renderTherapeuticProfile,
    'threats': renderThreats,
    'signals': renderSignals,
    'console': () => <div style={{ opacity: 0.5 }}>Query console coming in Phase 3. Use the existing Data Studio for now.</div>,
  };

  if (view === 'hub') {
    return <div style={S.container}>{renderHub()}</div>;
  }

  return (
    <div style={S.container}>
      <div style={S.layout}>
        {renderSidebar()}
        <div style={S.main}>
          {(panels[view] || panels.hub)()}
        </div>
      </div>
    </div>
  );
}
