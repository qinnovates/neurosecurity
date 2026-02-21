/**
 * BciExplorer — filterable device card grid with detail panel.
 * URL hash sync for deep linking (#device-id).
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { BciDevice } from '../../lib/bci-data';

interface Props {
  devices: BciDevice[];
  stats: {
    totalDevices: number;
    manufacturers: number;
    channelRange: { min: number; max: number } | null;
    types: Record<string, number>;
    compiledDate: string | null;
  };
}

type FilterType = 'all' | 'invasive' | 'noninvasive' | 'research';
type FilterDirection = 'all' | 'read' | 'write' | 'bidirectional';

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

// Category badge colors
const CATEGORY_BADGE: Record<string, { bg: string; color: string }> = {
  'Cortical BCI':        { bg: 'rgba(239, 68, 68, 0.1)',  color: '#ef4444' },
  'DBS':                 { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' },
  'Deep Brain Stimulation': { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' },
  'Neuromodulation':     { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
  'Cochlear Implant':    { bg: 'rgba(6, 182, 212, 0.1)',  color: '#06b6d4' },
  'Endovascular':        { bg: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' },
  'Minimally Invasive':  { bg: 'rgba(239, 68, 68, 0.08)', color: '#f87171' },
  'Invasive (Temporary)':{ bg: 'rgba(239, 68, 68, 0.08)', color: '#f87171' },
  // Non-invasive types
  'EEG (Consumer)':      { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
  'EEG (Research Board)':{ bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  'fNIRS':               { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' },
  'Non/Minimally Invasive': { bg: 'rgba(59, 130, 246, 0.08)', color: '#60a5fa' },
};

function getBadgeStyle(typeLabel: string) {
  const badge = CATEGORY_BADGE[typeLabel];
  if (badge) return badge;
  return { bg: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8' };
}

// Band colors from qif-constants
const BAND_COLORS: Record<string, string> = {
  N7: '#166534', N6: '#3a7d44', N5: '#4a8c5c', N4: '#5a9b6e',
  N3: '#6aaa80', N2: '#7ab992', N1: '#8ac8a4',
  I0: '#d4a017',
  S1: '#3b82f6', S2: '#2563eb', S3: '#1d4ed8',
};

function formatSpecValue(spec: { value: string | number | null; unit?: string | null }): string {
  if (spec.value == null) return 'N/A';
  const val = String(spec.value);
  return spec.unit ? `${val} ${spec.unit}` : val;
}

// ═══ Filter Bar ═══

function FilterBar({
  filterType, setFilterType,
  filterBand, setFilterBand,
  filterDirection, setFilterDirection,
  availableBands,
}: {
  filterType: FilterType;
  setFilterType: (t: FilterType) => void;
  filterBand: string;
  setFilterBand: (b: string) => void;
  filterDirection: FilterDirection;
  setFilterDirection: (d: FilterDirection) => void;
  availableBands: string[];
}) {
  const pillStyle = (active: boolean) => ({
    padding: '6px 14px',
    borderRadius: '9999px',
    fontSize: '0.8125rem',
    fontWeight: 500 as const,
    cursor: 'pointer' as const,
    border: '1px solid',
    borderColor: active ? 'var(--color-accent-primary)' : 'var(--color-border)',
    background: active ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
    color: active ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
    transition: 'all 0.15s ease',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)',
        marginBottom: '24px',
      }}
    >
      {/* Type filter */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', alignSelf: 'center', marginRight: '4px' }}>Type:</span>
        {(['all', 'invasive', 'noninvasive', 'research'] as FilterType[]).map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={pillStyle(filterType === t)}>
            {t === 'all' ? 'All' : t === 'noninvasive' ? 'Non-invasive' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Band filter */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginRight: '4px' }}>Band:</span>
        <select
          value={filterBand}
          onChange={e => setFilterBand(e.target.value)}
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
          <option value="all">All Bands</option>
          {availableBands.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Direction filter */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', alignSelf: 'center', marginRight: '4px' }}>Interface:</span>
        {(['all', 'read', 'write', 'bidirectional'] as FilterDirection[]).map(d => (
          <button key={d} onClick={() => setFilterDirection(d)} style={pillStyle(filterDirection === d)}>
            {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══ Device Card ═══

function DeviceCard({ device, isSelected, onClick }: { device: BciDevice; isSelected: boolean; onClick: () => void }) {
  const totalThreats = device.threatCount;
  const maxSeverity = device.threatsBySeverity.critical > 0 ? 'critical'
    : device.threatsBySeverity.high > 0 ? 'high'
    : device.threatsBySeverity.medium > 0 ? 'medium'
    : 'low';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '16px',
        borderRadius: '12px',
        border: isSelected ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
        background: isSelected ? 'rgba(34, 197, 94, 0.04)' : 'var(--color-bg-secondary)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        width: '100%',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
            {device.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginTop: '2px' }}>
            {device.manufacturer}
          </div>
        </div>
        <span
          style={{
            fontSize: '0.6875rem',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            background: getBadgeStyle(device.deviceTypeLabel).bg,
            color: getBadgeStyle(device.deviceTypeLabel).color,
          }}
        >
          {device.deviceTypeLabel}
        </span>
      </div>

      {/* Quick specs row */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
        {device.channels.value != null && (
          <span style={{ color: 'var(--color-text-muted)' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>{String(device.channels.value)}</strong> ch
          </span>
        )}
        {device.power.value != null && (
          <span style={{ color: 'var(--color-text-muted)' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>{formatSpecValue(device.power)}</strong>
          </span>
        )}
        {device.directionality && (
          <span style={{
            color: device.directionality.includes('bidirectional') ? '#f59e0b' : 'var(--color-text-muted)',
          }}>
            {device.directionality.includes('bidirectional') ? 'Bidirectional' :
             device.directionality.includes('write') || device.directionality.includes('stimulat') ? 'Write' : 'Read'}
          </span>
        )}
      </div>

      {/* Band pills */}
      {device.qifBands.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {device.qifBands.map(b => (
            <span
              key={b}
              style={{
                fontSize: '0.625rem',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                background: `${BAND_COLORS[b] ?? '#666'}22`,
                color: BAND_COLORS[b] ?? '#666',
              }}
            >
              {b}
            </span>
          ))}
        </div>
      )}

      {/* Threat summary */}
      {totalThreats > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.6875rem', color: 'var(--color-text-faint)' }}>
          <span
            style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: SEVERITY_COLORS[maxSeverity],
            }}
          />
          {totalThreats} threats
          {device.threatsBySeverity.critical > 0 && (
            <span style={{ color: '#ef4444' }}>{device.threatsBySeverity.critical} critical</span>
          )}
        </div>
      )}
    </button>
  );
}

// ═══ Device Detail Panel ═══

type DetailTab = 'specs' | 'physics' | 'brain' | 'security';

function DeviceDetail({ device, onClose }: { device: BciDevice; onClose: () => void }) {
  const [tab, setTab] = useState<DetailTab>('specs');

  const tabStyle = (active: boolean) => ({
    padding: '8px 16px',
    fontSize: '0.8125rem',
    fontWeight: 500 as const,
    cursor: 'pointer' as const,
    borderBottom: active ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
    color: active ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
    background: 'transparent',
    transition: 'all 0.15s ease',
  });

  return (
    <div
      style={{
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)', margin: 0 }}>
              {device.name}
            </h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {device.manufacturer}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              lineHeight: 0,
            }}
            aria-label="Close detail panel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px', fontSize: '0.75rem' }}>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '9999px',
              fontWeight: 500,
              background: device.deviceType.includes('invasive') ? 'rgba(239, 68, 68, 0.1)' :
                           device.deviceType.includes('eeg') || device.deviceType === 'fnirs' ? 'rgba(59, 130, 246, 0.1)' :
                           'rgba(148, 163, 184, 0.1)',
              color: device.deviceType.includes('invasive') ? '#ef4444' :
                     device.deviceType.includes('eeg') || device.deviceType === 'fnirs' ? '#3b82f6' :
                     '#94a3b8',
            }}
          >
            {device.deviceTypeLabel}
          </span>
          {device.fdaStatus && (
            <span style={{ color: 'var(--color-text-faint)', alignSelf: 'center' }}>
              FDA: {device.fdaStatus.length > 60 ? device.fdaStatus.slice(0, 57) + '...' : device.fdaStatus}
            </span>
          )}
          <a
            href={`/dashboard/#${device.id}`}
            style={{
              fontSize: '0.6875rem',
              color: 'var(--color-accent-secondary)',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono)',
              marginLeft: 'auto',
              alignSelf: 'center',
            }}
          >
            Open in Dashboard &rarr;
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingLeft: '8px' }}>
        {(['specs', 'physics', 'brain', 'security'] as DetailTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(tab === t)}>
            {t === 'specs' ? 'Specs' : t === 'physics' ? 'Physics' : t === 'brain' ? 'Brain Mapping' : 'Security'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '20px 24px' }}>
        {tab === 'specs' && <SpecsTab device={device} />}
        {tab === 'physics' && <PhysicsTab device={device} />}
        {tab === 'brain' && <BrainTab device={device} />}
        {tab === 'security' && <SecurityTab device={device} />}
      </div>
    </div>
  );
}

function SpecRow({ label, spec }: { label: string; spec: { value: string | number | null; unit?: string | null; confidence?: string | null; source?: string | null; notes?: string | null } }) {
  if (spec.value == null) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', gap: '12px' }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {formatSpecValue(spec)}
        </span>
        {spec.confidence && (
          <span
            style={{
              marginLeft: '6px',
              fontSize: '0.625rem',
              padding: '1px 5px',
              borderRadius: '4px',
              fontWeight: 600,
              background: `${CONFIDENCE_COLORS[spec.confidence] ?? '#666'}22`,
              color: CONFIDENCE_COLORS[spec.confidence] ?? '#666',
            }}
          >
            {spec.confidence}
          </span>
        )}
        {spec.notes && (
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-faint)', marginTop: '2px', maxWidth: '300px' }}>
            {spec.notes}
          </div>
        )}
      </div>
    </div>
  );
}

function SpecsTab({ device }: { device: BciDevice }) {
  return (
    <div>
      <SpecRow label="Channels" spec={device.channels} />
      <SpecRow label="Sampling Rate" spec={device.samplingRate} />
      <SpecRow label="Power" spec={device.power} />
      <SpecRow label="Dimensions" spec={device.dimensions} />
      <SpecRow label="Wireless" spec={device.wireless} />
      <SpecRow label="Battery Life" spec={device.batteryLife} />
      <SpecRow label="ADC Resolution" spec={device.adcResolution} />
      {device.directionality && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Directionality</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{device.directionality}</span>
        </div>
      )}
      {device.targetIndication && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', gap: '12px' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>Indication</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', textAlign: 'right' }}>{device.targetIndication}</span>
        </div>
      )}
    </div>
  );
}

function PhysicsTab({ device }: { device: BciDevice }) {
  return (
    <div>
      <SpecRow label="Thermal Budget" spec={device.thermalBudget} />
      <SpecRow label="Frequency Range" spec={device.frequencyRange} />
      <SpecRow label="Data Rate" spec={device.dataRate} />
      <SpecRow label="Electrode Material" spec={device.electrodeMaterial} />
      <SpecRow label="Electrode Impedance" spec={device.electrodeImpedance} />
      <SpecRow label="SNR" spec={device.snr} />
      {device.fdaStatus && (
        <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#3b82f6', marginBottom: '4px' }}>FDA Status</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{device.fdaStatus}</div>
        </div>
      )}
    </div>
  );
}

function BrainTab({ device }: { device: BciDevice }) {
  if (device.targetRegions.length === 0) {
    return (
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-faint)', padding: '20px 0', textAlign: 'center' }}>
        No brain region mappings available for this device.
      </div>
    );
  }

  return (
    <div>
      {/* QIF bands */}
      {device.qifBands.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            QIF Bands
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {device.qifBands.map(b => (
              <span
                key={b}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: `${BAND_COLORS[b] ?? '#666'}22`,
                  color: BAND_COLORS[b] ?? '#666',
                }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* I0 depth */}
      {device.i0Depth && (
        <div style={{ marginBottom: '16px', fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Interface depth: </span>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{device.i0Depth}</span>
        </div>
      )}

      {/* Interface type */}
      {device.interfaceType && (
        <div style={{ marginBottom: '16px', fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Interface type: </span>
          <span style={{
            fontWeight: 500,
            color: device.interfaceType === 'bidirectional' ? '#f59e0b' :
                   device.interfaceType === 'write' ? '#ef4444' : '#22c55e',
          }}>
            {device.interfaceType}
          </span>
        </div>
      )}

      {/* Target regions */}
      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Target Regions
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {device.targetRegions.map(r => (
          <div
            key={r.id}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-primary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {r.name}
              </span>
              <span style={{
                fontSize: '0.625rem',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                background: `${BAND_COLORS[r.band] ?? '#666'}22`,
                color: BAND_COLORS[r.band] ?? '#666',
              }}>
                {r.band}
              </span>
            </div>
            {r.function && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginTop: '4px', lineHeight: 1.4 }}>
                {r.function.length > 120 ? r.function.slice(0, 117) + '...' : r.function}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityTab({ device }: { device: BciDevice }) {
  if (device.threatCount === 0) {
    return (
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-faint)', padding: '20px 0', textAlign: 'center' }}>
        No threat vectors mapped to this device's bands.
      </div>
    );
  }

  return (
    <div>
      {/* Severity summary */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {(['critical', 'high', 'medium', 'low'] as const).map(sev => {
          const count = device.threatsBySeverity[sev] ?? 0;
          if (count === 0) return null;
          return (
            <div
              key={sev}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: `1px solid ${SEVERITY_COLORS[sev]}33`,
                background: `${SEVERITY_COLORS[sev]}11`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: SEVERITY_COLORS[sev] }}>{count}</div>
              <div style={{ fontSize: '0.625rem', fontWeight: 500, color: SEVERITY_COLORS[sev], textTransform: 'uppercase' }}>{sev}</div>
            </div>
          );
        })}
        <div style={{
          padding: '8px 14px',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{device.threatCount}</div>
          <div style={{ fontSize: '0.625rem', fontWeight: 500, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>Total</div>
        </div>
      </div>

      {/* Top threats */}
      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Top Threats by NISS Score
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {device.topThreats.map(t => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-primary)',
              gap: '8px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{t.name}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-faint)', marginTop: '1px' }}>
                {t.id} / {t.category} / {t.status}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{
                fontSize: '0.6875rem',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                background: `${SEVERITY_COLORS[t.severity]}22`,
                color: SEVERITY_COLORS[t.severity],
              }}>
                {t.severity}
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: SEVERITY_COLORS[t.severity], fontVariantNumeric: 'tabular-nums' }}>
                {t.niss.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ Main Component ═══

export default function BciExplorer({ devices, stats }: Props) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterBand, setFilterBand] = useState('all');
  const [filterDirection, setFilterDirection] = useState<FilterDirection>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Available bands across all devices
  const availableBands = useMemo(() => {
    const bands = new Set<string>();
    for (const d of devices) {
      for (const b of d.qifBands) bands.add(b);
    }
    // Sort by hourglass order
    const order = ['N7', 'N6', 'N5', 'N4', 'N3', 'N2', 'N1', 'I0', 'S1', 'S2', 'S3'];
    return [...bands].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [devices]);

  // Filter devices
  const filtered = useMemo(() => {
    return devices.filter(d => {
      // Type filter — uses the category field from the adapter
      if (filterType !== 'all') {
        if (d.category !== filterType) return false;
      }
      // Band filter
      if (filterBand !== 'all') {
        if (!d.qifBands.includes(filterBand)) return false;
      }
      // Direction filter
      if (filterDirection !== 'all') {
        const dir = d.directionality?.toLowerCase() ?? '';
        if (filterDirection === 'read' && !dir.includes('read') && dir !== '') return false;
        if (filterDirection === 'write' && !dir.includes('write') && !dir.includes('stimulat')) return false;
        if (filterDirection === 'bidirectional' && !dir.includes('bidirectional')) return false;
      }
      return true;
    });
  }, [devices, filterType, filterBand, filterDirection]);

  const selectedDevice = useMemo(() => {
    if (!selectedId) return null;
    return devices.find(d => d.id === selectedId) ?? null;
  }, [devices, selectedId]);

  // URL hash sync
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && devices.some(d => d.id === hash)) {
      setSelectedId(hash);
    }
  }, [devices]);

  const selectDevice = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) {
      window.history.replaceState(null, '', `#${id}`);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Listen for hash changes
  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.slice(1);
      if (hash && devices.some(d => d.id === hash)) {
        setSelectedId(hash);
      }
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, [devices]);

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
        <StatCard label="Devices" value={stats.totalDevices} />
        <StatCard label="Manufacturers" value={stats.manufacturers} />
        <StatCard
          label="Channel Range"
          value={stats.channelRange ? `${stats.channelRange.min} - ${stats.channelRange.max.toLocaleString()}` : 'N/A'}
        />
        <StatCard label="Categories" value={Object.keys(stats.types).length} />
        <StatCard label="Last Compiled" value={stats.compiledDate ?? 'Unknown'} />
      </div>

      {/* Category breakdown */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        {Object.entries(stats.types).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
          const badge = getBadgeStyle(type);
          return (
            <span
              key={type}
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontWeight: 500,
                background: badge.bg,
                color: badge.color,
                border: `1px solid ${badge.color}22`,
              }}
            >
              {type} ({count})
            </span>
          );
        })}
      </div>

      {/* Filter bar */}
      <FilterBar
        filterType={filterType}
        setFilterType={setFilterType}
        filterBand={filterBand}
        setFilterBand={setFilterBand}
        filterDirection={filterDirection}
        setFilterDirection={setFilterDirection}
        availableBands={availableBands}
      />

      {/* Result count */}
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-faint)', marginBottom: '16px' }}>
        Showing {filtered.length} of {devices.length} devices
      </div>

      {/* Main layout: grid + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedDevice ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* Card grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: selectedDevice ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
            alignContent: 'start',
          }}
        >
          {filtered.map(d => (
            <DeviceCard
              key={d.id}
              device={d}
              isSelected={d.id === selectedId}
              onClick={() => selectDevice(d.id === selectedId ? null : d.id)}
            />
          ))}
          {filtered.length === 0 && (
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
        </div>

        {/* Detail panel */}
        {selectedDevice && (
          <div style={{ position: 'sticky', top: '80px', alignSelf: 'start' }}>
            <DeviceDetail device={selectedDevice} onClose={() => selectDevice(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
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
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginTop: '2px' }}>{label}</div>
    </div>
  );
}
