/**
 * BciDashboard — unified single-pane view for any BCI device.
 * Select a device from the dropdown, see all 6 panels at once.
 * URL hash sync for deep linking (#device-id).
 */

import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import type { BciDevice, SpecField } from '../../lib/bci-data';
import type { BrainView } from '../../lib/brain-view-data';

// Lazy-load BrainVisualization to avoid SSR issues with Three.js
const BrainVisualization = lazy(() => import('../brain/BrainVisualization'));

interface HourglassBand {
  id: string;
  name: string;
  zone: string;
  color: string;
  description: string;
  width: number;
}

interface Props {
  devices: BciDevice[];
  bands: HourglassBand[];
  brainViews: BrainView[];
}

// ═══ Shared Constants ═══

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#94a3b8',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  HIGH: '#22c55e',
  MEDIUM: '#f59e0b',
  LOW: '#94a3b8',
};

const CATEGORY_BADGE: Record<string, { bg: string; color: string }> = {
  'Cortical BCI':        { bg: 'rgba(239, 68, 68, 0.1)',  color: '#ef4444' },
  'DBS':                 { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' },
  'Deep Brain Stimulation': { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' },
  'Neuromodulation':     { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
  'Cochlear Implant':    { bg: 'rgba(6, 182, 212, 0.1)',  color: '#06b6d4' },
  'Endovascular':        { bg: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' },
  'Minimally Invasive':  { bg: 'rgba(239, 68, 68, 0.08)', color: '#f87171' },
  'Invasive (Temporary)':{ bg: 'rgba(239, 68, 68, 0.08)', color: '#f87171' },
  'EEG (Consumer)':      { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
  'EEG (Research Board)':{ bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  'fNIRS':               { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' },
  'Non/Minimally Invasive': { bg: 'rgba(59, 130, 246, 0.08)', color: '#60a5fa' },
};

const BAND_COLORS: Record<string, string> = {
  N7: '#166534', N6: '#3a7d44', N5: '#4a8c5c', N4: '#5a9b6e',
  N3: '#6aaa80', N2: '#7ab992', N1: '#8ac8a4',
  I0: '#d4a017',
  S1: '#3b82f6', S2: '#2563eb', S3: '#1d4ed8',
};

function getBadgeStyle(typeLabel: string) {
  return CATEGORY_BADGE[typeLabel] ?? { bg: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8' };
}

function formatSpec(spec: SpecField): string {
  if (spec.value == null) return 'N/A';
  const val = String(spec.value);
  return spec.unit ? `${val} ${spec.unit}` : val;
}

// ═══ Panel Shell ═══

function PanelShell({ title, deepLink, deepLinkLabel, children }: {
  title: string;
  deepLink?: string;
  deepLinkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      borderRadius: '12px',
      border: '1px solid var(--color-border)',
      background: 'var(--color-bg-secondary)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 18px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          margin: 0,
          fontFamily: 'var(--font-heading)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>{title}</h3>
        {deepLink && (
          <a
            href={deepLink}
            style={{
              fontSize: '0.6875rem',
              color: 'var(--color-accent-secondary)',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {deepLinkLabel ?? 'Explore'} &rarr;
          </a>
        )}
      </div>
      <div style={{ padding: '16px 18px', flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// ═══ Spec Row Helper ═══

function SpecRow({ label, spec }: { label: string; spec: SpecField }) {
  if (spec.value == null) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{formatSpec(spec)}</span>
        {spec.confidence && (
          <span style={{
            fontSize: '0.5625rem',
            padding: '1px 5px',
            borderRadius: '4px',
            fontWeight: 600,
            background: `${CONFIDENCE_COLORS[spec.confidence] ?? '#94a3b8'}22`,
            color: CONFIDENCE_COLORS[spec.confidence] ?? '#94a3b8',
          }}>{spec.confidence}</span>
        )}
      </span>
    </div>
  );
}

// ═══ Device Specs Panel ═══

function DeviceSpecsPanel({ device }: { device: BciDevice }) {
  return (
    <PanelShell title="Device Specs" deepLink={`/bci-explorer/#${device.id}`} deepLinkLabel="Full Explorer">
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <span style={{
          fontSize: '0.6875rem',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontWeight: 500,
          background: getBadgeStyle(device.deviceTypeLabel).bg,
          color: getBadgeStyle(device.deviceTypeLabel).color,
        }}>{device.deviceTypeLabel}</span>
        {device.directionality && (
          <span style={{
            fontSize: '0.6875rem',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontWeight: 500,
            background: device.directionality.includes('bidirectional') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(148, 163, 184, 0.1)',
            color: device.directionality.includes('bidirectional') ? '#f59e0b' : '#94a3b8',
          }}>
            {device.directionality.includes('bidirectional') ? 'Bidirectional' :
             device.directionality.includes('write') || device.directionality.includes('stimulat') ? 'Write' : 'Read'}
          </span>
        )}
        {device.fdaStatus && (
          <span style={{
            fontSize: '0.6875rem',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontWeight: 500,
            background: 'rgba(34, 197, 94, 0.08)',
            color: '#22c55e',
          }}>FDA</span>
        )}
      </div>
      <SpecRow label="Channels" spec={device.channels} />
      <SpecRow label="Sampling Rate" spec={device.samplingRate} />
      <SpecRow label="Power" spec={device.power} />
      <SpecRow label="Wireless" spec={device.wireless} />
      <SpecRow label="Battery" spec={device.batteryLife} />
      <SpecRow label="Dimensions" spec={device.dimensions} />
      {device.fdaStatus && (
        <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>
          <strong style={{ color: 'var(--color-text-muted)' }}>FDA:</strong>{' '}
          {device.fdaStatus.length > 80 ? device.fdaStatus.slice(0, 77) + '...' : device.fdaStatus}
        </div>
      )}
    </PanelShell>
  );
}

// ═══ Brain Mapping Panel ═══

function BrainMappingPanel({ device }: { device: BciDevice }) {
  const grouped = useMemo(() => {
    const map: Record<string, typeof device.targetRegions> = {};
    for (const r of device.targetRegions) {
      if (!map[r.band]) map[r.band] = [];
      map[r.band].push(r);
    }
    return map;
  }, [device]);

  return (
    <PanelShell title="Brain Mapping" deepLink="/atlas/" deepLinkLabel="Atlas">
      {device.targetRegions.length === 0 ? (
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-faint)', fontStyle: 'italic' }}>No mapped regions</div>
      ) : (
        <>
          {device.i0Depth && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
              <strong>I0 Depth:</strong> {device.i0Depth}
              {device.interfaceType && <> &middot; <strong>Interface:</strong> {device.interfaceType}</>}
            </div>
          )}
          {Object.entries(grouped).map(([band, regions]) => (
            <div key={band} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: BAND_COLORS[band] ?? '#666',
                  display: 'inline-block', flexShrink: 0,
                }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: BAND_COLORS[band] ?? '#666' }}>{band}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', paddingLeft: '14px' }}>
                {regions.map(r => (
                  <span key={r.id} title={r.function} style={{
                    fontSize: '0.6875rem',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    background: `${BAND_COLORS[r.band] ?? '#666'}15`,
                    color: 'var(--color-text-primary)',
                    cursor: 'default',
                  }}>{r.name}</span>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </PanelShell>
  );
}

// ═══ Hourglass Position Panel ═══

function HourglassPositionPanel({ device, bands }: { device: BciDevice; bands: HourglassBand[] }) {
  const activeBands = new Set(device.qifBands);
  const svgHeight = bands.length * 28 + 20;
  const centerX = 150;

  return (
    <PanelShell title="Hourglass Position" deepLink="/lab/hourglass.html" deepLinkLabel="Full Hourglass">
      {device.qifBands.length === 0 ? (
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-faint)', fontStyle: 'italic' }}>No band mapping</div>
      ) : (
        <svg viewBox={`0 0 300 ${svgHeight}`} style={{ width: '100%', maxWidth: '300px', margin: '0 auto', display: 'block' }}>
          {bands.map((band, i) => {
            const y = 10 + i * 28;
            const w = band.width * 2.8;
            const isActive = activeBands.has(band.id);
            return (
              <g key={band.id}>
                <rect
                  x={centerX - w / 2}
                  y={y}
                  width={w}
                  height={22}
                  rx={4}
                  fill={isActive ? band.color : 'var(--color-bg-primary)'}
                  stroke={isActive ? band.color : 'var(--color-border)'}
                  strokeWidth={isActive ? 2 : 1}
                  opacity={isActive ? 1 : 0.3}
                />
                <text
                  x={centerX}
                  y={y + 14}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight={isActive ? 700 : 400}
                  fill={isActive ? '#fff' : 'var(--color-text-faint)'}
                  style={{ pointerEvents: 'none' }}
                >
                  {band.id}
                </text>
                {isActive && (
                  <text
                    x={centerX + w / 2 + 8}
                    y={y + 14}
                    fontSize="8"
                    fill={band.color}
                    style={{ pointerEvents: 'none' }}
                  >
                    {band.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </PanelShell>
  );
}

// ═══ Threat Profile Panel ═══

function ThreatProfilePanel({ device }: { device: BciDevice }) {
  const total = device.threatCount;
  const severity = device.threatsBySeverity;

  return (
    <PanelShell title="Threat Profile" deepLink="/TARA/" deepLinkLabel="TARA Atlas">
      {total === 0 ? (
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-faint)', fontStyle: 'italic' }}>No mapped threats</div>
      ) : (
        <>
          {/* Severity bar */}
          <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '12px' }}>
            {(['critical', 'high', 'medium', 'low'] as const).map(s => {
              const count = severity[s] ?? 0;
              if (count === 0) return null;
              return (
                <div
                  key={s}
                  title={`${s}: ${count}`}
                  style={{
                    width: `${(count / total) * 100}%`,
                    background: SEVERITY_COLORS[s],
                    minWidth: '4px',
                  }}
                />
              );
            })}
          </div>

          {/* Severity counts */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px', fontSize: '0.75rem' }}>
            {(['critical', 'high', 'medium', 'low'] as const).map(s => {
              const count = severity[s] ?? 0;
              if (count === 0) return null;
              return (
                <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: SEVERITY_COLORS[s] }} />
                  <span style={{ color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{s}</span>
                  <strong style={{ color: 'var(--color-text-primary)' }}>{count}</strong>
                </span>
              );
            })}
            <span style={{ color: 'var(--color-text-faint)', marginLeft: 'auto' }}>
              {total} total
            </span>
          </div>

          {/* Top 5 threats */}
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Top Threats by NISS
          </div>
          {device.topThreats.map((t, i) => (
            <div key={t.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '5px 0',
              borderBottom: i < device.topThreats.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                <span style={{
                  fontSize: '0.625rem',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  background: `${SEVERITY_COLORS[t.severity] ?? '#94a3b8'}22`,
                  color: SEVERITY_COLORS[t.severity] ?? '#94a3b8',
                  textTransform: 'uppercase',
                }}>{t.severity}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {t.niss.toFixed(1)}
                </span>
              </span>
            </div>
          ))}
        </>
      )}
    </PanelShell>
  );
}

// ═══ Physics Panel ═══

function PhysicsPanel({ device }: { device: BciDevice }) {
  return (
    <PanelShell title="Physics Constraints" deepLink="/explorer/" deepLinkLabel="Threat Explorer">
      <SpecRow label="Thermal Budget" spec={device.thermalBudget} />
      <SpecRow label="Frequency Range" spec={device.frequencyRange} />
      <SpecRow label="Data Rate" spec={device.dataRate} />
      <SpecRow label="Electrode Material" spec={device.electrodeMaterial} />
      <SpecRow label="Impedance" spec={device.electrodeImpedance} />
      <SpecRow label="ADC Resolution" spec={device.adcResolution} />
      <SpecRow label="SNR" spec={device.snr} />
      {[device.thermalBudget, device.frequencyRange, device.dataRate, device.electrodeMaterial, device.electrodeImpedance, device.adcResolution, device.snr].every(s => s.value == null) && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-faint)', fontStyle: 'italic' }}>No physics data available</div>
      )}
    </PanelShell>
  );
}

// ═══ Brain Render Panel ═══

function BrainRenderPanel({ device, brainViews }: { device: BciDevice; brainViews: BrainView[] }) {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  // Filter brain views to only show regions this device targets
  const deviceBands = new Set(device.qifBands);
  const filteredViews = useMemo(() => {
    return brainViews.map(view => ({
      ...view,
      regions: view.regions.filter(r => deviceBands.has(r.id)),
    }));
  }, [brainViews, device.id]);

  if (device.qifBands.length === 0) {
    return (
      <PanelShell title="3D Brain View" deepLink="/atlas/" deepLinkLabel="Full Atlas">
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-faint)', fontStyle: 'italic' }}>No mapped brain regions</div>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="3D Brain View" deepLink="/atlas/" deepLinkLabel="Full Atlas">
      <div style={{ height: '380px' }}>
        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>Loading 3D brain...</span>
          </div>
        }>
          <BrainVisualization
            views={filteredViews}
            defaultView="security"
            externalActiveRegion={activeRegion}
            onRegionSelect={setActiveRegion}
            hideViewToggle
          />
        </Suspense>
      </div>
    </PanelShell>
  );
}

// ═══ Device Selector ═══

function DeviceSelector({ devices, selectedId, onSelect }: {
  devices: BciDevice[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const grouped = useMemo(() => {
    const groups: Record<string, BciDevice[]> = { invasive: [], noninvasive: [], research: [] };
    const q = search.toLowerCase();
    for (const d of devices) {
      if (q && !d.name.toLowerCase().includes(q) && !d.manufacturer.toLowerCase().includes(q) && !d.deviceTypeLabel.toLowerCase().includes(q)) continue;
      groups[d.category].push(d);
    }
    return groups;
  }, [devices, search]);

  const selectedDevice = selectedId ? devices.find(d => d.id === selectedId) : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const groupLabels: Record<string, string> = {
    invasive: 'Invasive',
    noninvasive: 'Non-Invasive',
    research: 'Research',
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', maxWidth: '520px' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px',
          borderRadius: '12px',
          border: '2px solid',
          borderColor: open ? 'var(--color-accent-primary)' : 'var(--color-border)',
          background: 'var(--color-bg-secondary)',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-faint)" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder={selectedDevice ? selectedDevice.name : 'Search devices...'}
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '0.9375rem',
            color: 'var(--color-text-primary)',
          }}
        />
        {selectedDevice && (
          <button
            onClick={e => { e.stopPropagation(); onSelect(null); setSearch(''); }}
            style={{
              padding: '2px 6px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-faint)',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            Clear
          </button>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-faint)" strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          zIndex: 50,
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-secondary)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          {Object.entries(grouped).map(([cat, devs]) => {
            if (devs.length === 0) return null;
            return (
              <div key={cat}>
                <div style={{
                  padding: '8px 14px 4px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--color-text-faint)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--color-bg-secondary)',
                }}>{groupLabels[cat] ?? cat}</div>
                {devs.map(d => (
                  <button
                    key={d.id}
                    onClick={() => { onSelect(d.id); setOpen(false); setSearch(''); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 14px',
                      border: 'none',
                      background: d.id === selectedId ? 'rgba(34, 197, 94, 0.06)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (d.id !== selectedId) (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { if (d.id !== selectedId) (e.target as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{d.name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-faint)' }}>{d.manufacturer}</div>
                    </div>
                    <span style={{
                      fontSize: '0.625rem',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      fontWeight: 500,
                      background: getBadgeStyle(d.deviceTypeLabel).bg,
                      color: getBadgeStyle(d.deviceTypeLabel).color,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>{d.deviceTypeLabel}</span>
                  </button>
                ))}
              </div>
            );
          })}
          {Object.values(grouped).every(g => g.length === 0) && (
            <div style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--color-text-faint)', textAlign: 'center' }}>No devices match</div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══ Main Dashboard ═══

export default function BciDashboard({ devices, bands, brainViews }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // URL hash sync
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && devices.some(d => d.id === hash)) {
      setSelectedId(hash);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      window.history.replaceState(null, '', `#${selectedId}`);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [selectedId]);

  // Listen for hash changes (back/forward)
  useEffect(() => {
    function onHash() {
      const hash = window.location.hash.slice(1);
      if (hash && devices.some(d => d.id === hash)) {
        setSelectedId(hash);
      } else {
        setSelectedId(null);
      }
    }
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [devices]);

  const selectedDevice = selectedId ? devices.find(d => d.id === selectedId) ?? null : null;

  return (
    <div>
      {/* Sticky selector */}
      <div style={{
        position: 'sticky',
        top: '64px',
        zIndex: 40,
        padding: '12px 0 16px',
        background: 'var(--color-bg-primary)',
      }}>
        <DeviceSelector devices={devices} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      {/* Panel grid */}
      {selectedDevice ? (
        <>
          {/* Device header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-heading)',
              margin: 0,
            }}>{selectedDevice.name}</h2>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{selectedDevice.manufacturer}</span>
            {selectedDevice.targetIndication && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', fontStyle: 'italic' }}>
                {selectedDevice.targetIndication}
              </span>
            )}
          </div>

          {/* Brain render - full width, first */}
          <div style={{ marginBottom: '16px' }}>
            <BrainRenderPanel device={selectedDevice} brainViews={brainViews} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '16px',
            marginBottom: '40px',
          }}>
            <DeviceSpecsPanel device={selectedDevice} />
            <BrainMappingPanel device={selectedDevice} />
            <HourglassPositionPanel device={selectedDevice} bands={bands} />
            <ThreatProfilePanel device={selectedDevice} />
            <PhysicsPanel device={selectedDevice} />
          </div>
        </>
      ) : (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          borderRadius: '16px',
          border: '1px dashed var(--color-border)',
          background: 'var(--color-bg-secondary)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.3 }}>&#9670;</div>
          <div style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            Select a device to view its full profile
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-faint)' }}>
            {devices.length} devices across {new Set(devices.map(d => d.category)).size} categories
          </div>
        </div>
      )}
    </div>
  );
}
