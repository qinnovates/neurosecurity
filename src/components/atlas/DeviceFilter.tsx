/**
 * DeviceFilter — "I have a [device type]" filter for TARA techniques.
 * Filters the full technique catalog to those relevant to a specific BCI device.
 */

import { useState, useMemo } from 'react';
import type { ThreatVector, Severity } from '../../lib/threat-data';
import { SEVERITY_COLORS } from '../../lib/threat-data';
import { useLens } from '../hooks/useLens';

type DeviceType = 'DBS System' | 'Motor BCI' | 'EEG Headset' | 'Cochlear Implant' | 'Retinal Prosthesis' | 'VNS' | 'Responsive Neurostimulator';

const DEVICE_BANDS: Record<DeviceType, string[]> = {
  'DBS System': ['N5', 'N4', 'I0'],
  'Motor BCI': ['N7', 'I0'],
  'EEG Headset': ['N7', 'I0'],
  'Cochlear Implant': ['N7', 'I0'],
  'Retinal Prosthesis': ['N7', 'I0'],
  'VNS': ['N2', 'I0'],
  'Responsive Neurostimulator': ['N6', 'N3', 'I0'],
};

const DEVICES: DeviceType[] = [
  'DBS System', 'Motor BCI', 'EEG Headset', 'Cochlear Implant',
  'Retinal Prosthesis', 'VNS', 'Responsive Neurostimulator',
];

const S_BANDS = ['S1', 'S2', 'S3'];

function bandColor(band: string) {
  if (band.startsWith('N')) return '#22c55e';
  if (band === 'I0') return '#f59e0b';
  return '#3b82f6';
}

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];

interface Props { techniques: ThreatVector[] }

export default function DeviceFilter({ techniques }: Props) {
  const { lens } = useLens();
  const isClinical = lens === 'clinical';
  const isBoth = lens === 'both';
  const [device, setDevice] = useState<DeviceType | ''>('');

  const filtered = useMemo(() => {
    if (!device) return [];
    const bands = DEVICE_BANDS[device];
    const isEeg = device === 'EEG Headset';

    return techniques.filter(t => {
      // S-domain-only techniques apply to all devices
      const allSBands = t.bands.every(b => S_BANDS.includes(b));
      if (allSBands && t.bands.length > 0) return true;

      // Check band overlap
      const hasOverlap = t.bands.some(b => bands.includes(b));
      if (!hasOverlap) return false;

      // EEG: exclude neural injection techniques
      if (isEeg && t.tactic === 'QIF-N.IJ') return false;

      return true;
    });
  }, [techniques, device]);

  const sevCounts = useMemo(() => {
    const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const t of filtered) counts[t.severity]++;
    return counts;
  }, [filtered]);

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: 'var(--color-text-primary, #e2e8f0)' }}>
      {/* Device selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted, #94a3b8)', marginBottom: '0.5rem' }}>
          I have a...
        </label>
        <select
          value={device}
          onChange={e => setDevice(e.target.value as DeviceType | '')}
          style={{
            width: '100%', maxWidth: '24rem', padding: '0.625rem 0.875rem', fontSize: '0.875rem',
            fontFamily: 'var(--font-mono, monospace)', background: 'rgba(0,0,0,0.03)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem',
            color: 'inherit', outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">Select your device type...</option>
          {DEVICES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {device && (
        <>
          {/* Summary */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted, #94a3b8)' }}>
              <strong style={{ color: 'var(--color-text-primary, #e2e8f0)' }}>{filtered.length}</strong> of <strong>{techniques.length}</strong> techniques apply to your <strong style={{ color: 'var(--color-accent-primary, #60a5fa)' }}>{device}</strong>
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {SEVERITIES.map(s => sevCounts[s] > 0 && (
                <span key={s} style={{
                  display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '9999px',
                  fontSize: '0.625rem', fontWeight: 600,
                  background: SEVERITY_COLORS[s].bg, color: SEVERITY_COLORS[s].text,
                  border: `1px solid ${SEVERITY_COLORS[s].border}`,
                }}>
                  {s}: {sevCounts[s]}
                </span>
              ))}
            </div>
          </div>

          {/* Bands info */}
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #94a3b8)', marginBottom: '1rem' }}>
            Relevant bands: {DEVICE_BANDS[device].map(b => (
              <span key={b} style={{
                display: 'inline-block', padding: '0.05rem 0.3rem', borderRadius: '0.25rem',
                fontSize: '0.625rem', marginRight: '0.25rem', fontFamily: 'var(--font-mono, monospace)',
                background: `${bandColor(b)}18`, color: bandColor(b),
              }}>{b}</span>
            ))}
            <span style={{ marginLeft: '0.25rem', fontStyle: 'italic' }}>+ all S-domain techniques</span>
            {device === 'EEG Headset' && (
              <span style={{ marginLeft: '0.5rem', color: '#f59e0b', fontStyle: 'italic' }}>
                (read-only: injection techniques excluded)
              </span>
            )}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', borderRadius: '0.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  {['ID', isClinical ? 'Therapeutic Analog' : isBoth ? 'Technique / Analog' : 'Technique', 'Severity', 'NISS', 'Bands'].map(h => (
                    <th key={h} style={{
                      padding: '0.5rem 0.625rem', textAlign: 'left', fontWeight: 700,
                      fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                      color: 'var(--color-accent-primary, #60a5fa)', background: 'rgba(0,0,0,0.04)',
                      borderBottom: '2px solid rgba(59,130,246,0.25)', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr
                    key={t.id}
                    style={{ cursor: 'pointer', transition: 'background 0.1s', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                    onClick={() => { window.location.href = `/atlas/tara/${t.id}/`; }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.08)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'; }}
                  >
                    <td style={{ padding: '0.375rem 0.625rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{t.id}</td>
                    <td style={{ padding: '0.375rem 0.625rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontWeight: 500, maxWidth: '18rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isBoth ? 'normal' : 'nowrap' }}>
                      {isBoth ? (
                        <div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.6875rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                            {t.nameClinical ? t.nameClinical : <span style={{ fontStyle: 'italic', opacity: 0.5 }}>(silicon-only)</span>}
                          </div>
                        </div>
                      ) : isClinical ? t.nameClinical : t.name}
                    </td>
                    <td style={{ padding: '0.375rem 0.625rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{
                        display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '9999px',
                        fontSize: '0.625rem', fontWeight: 600,
                        background: SEVERITY_COLORS[t.severity]?.bg, color: SEVERITY_COLORS[t.severity]?.text,
                      }}>{t.severity}</span>
                    </td>
                    <td style={{ padding: '0.375rem 0.625rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem' }}>{t.niss.score.toFixed(1)}</td>
                    <td style={{ padding: '0.375rem 0.625rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {t.bands.map(b => (
                        <span key={b} style={{
                          display: 'inline-block', padding: '0.05rem 0.3rem', borderRadius: '0.25rem',
                          fontSize: '0.625rem', marginRight: '0.2rem', fontFamily: 'var(--font-mono, monospace)',
                          background: `${bandColor(b)}18`, color: bandColor(b),
                        }}>{b}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.875rem' }}>
                No techniques match this device profile.
              </div>
            )}
          </div>
        </>
      )}

      {!device && (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.875rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '0.75rem' }}>
          Select a device type above to see which TARA techniques apply to it.
        </div>
      )}
    </div>
  );
}
