/**
 * EEGDatasetCard — Individual EEG dataset card for the EEG sample browser.
 *
 * Matches the card design from DataStudioBrowser.tsx with inline styles.
 * Badge system for conditions, licenses, and TARA mappings.
 */

import type { CSSProperties } from 'react';

export interface EEGSample {
  id: string;
  name: string;
  source: string;
  sourceUrl: string | null;
  type: 'real' | 'synthetic' | 'simulated-attack';
  condition: string[];
  dsm5Code: string | null;
  channels: number;
  channelNames: string[] | null;
  samplingRateHz: number;
  format: string;
  license: string;
  redistributable: boolean;
  subjects: number | null;
  subjectBreakdown: string;
  paradigm: string;
  taraId: string | null;
  taraRelevance: string | null;
  notes: string;
}

interface Props {
  sample: EEGSample;
}

const CONDITION_COLORS: Record<string, { bg: string; fg: string }> = {
  // Clinical
  adhd: { bg: '#fce7f3', fg: '#be185d' },
  epilepsy: { bg: '#fce7f3', fg: '#be185d' },
  seizure: { bg: '#fce7f3', fg: '#be185d' },
  alcoholism: { bg: '#fce7f3', fg: '#be185d' },
  'substance-use': { bg: '#fce7f3', fg: '#be185d' },
  pediatric: { bg: '#fdf2f8', fg: '#a21caf' },
  pharmacological: { bg: '#fdf2f8', fg: '#a21caf' },
  // Healthy / baseline
  healthy: { bg: '#dcfce7', fg: '#166534' },
  baseline: { bg: '#dcfce7', fg: '#166534' },
  'resting-state': { bg: '#ecfdf5', fg: '#065f46' },
  'multi-band': { bg: '#ecfdf5', fg: '#065f46' },
  // Emotion
  emotion: { bg: '#f3e8ff', fg: '#7c3aed' },
  arousal: { bg: '#f3e8ff', fg: '#7c3aed' },
  valence: { bg: '#f3e8ff', fg: '#7c3aed' },
  positive: { bg: '#f3e8ff', fg: '#7c3aed' },
  negative: { bg: '#f3e8ff', fg: '#7c3aed' },
  neutral: { bg: '#f3e8ff', fg: '#7c3aed' },
  // Attack
  attack: { bg: '#fef2f2', fg: '#dc2626' },
  'signal-injection': { bg: '#fef2f2', fg: '#dc2626' },
  ssvep: { bg: '#fef2f2', fg: '#dc2626' },
  impedance: { bg: '#fef2f2', fg: '#dc2626' },
  flooding: { bg: '#fef2f2', fg: '#dc2626' },
  replay: { bg: '#fef2f2', fg: '#dc2626' },
  evasion: { bg: '#fef2f2', fg: '#dc2626' },
  'dc-drift': { bg: '#fef2f2', fg: '#dc2626' },
  'boiling-frog': { bg: '#fef2f2', fg: '#dc2626' },
  'envelope-modulation': { bg: '#fef2f2', fg: '#dc2626' },
  feedback: { bg: '#fef2f2', fg: '#dc2626' },
  'closed-loop-cascade': { bg: '#fef2f2', fg: '#dc2626' },
  // Motor / cognitive
  'motor-imagery': { bg: '#dbeafe', fg: '#1e40af' },
  'cognitive-task': { bg: '#dbeafe', fg: '#1e40af' },
  'cognitive-challenge': { bg: '#dbeafe', fg: '#1e40af' },
  'sound-listening': { bg: '#dbeafe', fg: '#1e40af' },
  gameplay: { bg: '#dbeafe', fg: '#1e40af' },
  // Sleep
  sleep: { bg: '#e0e7ff', fg: '#3730a3' },
};

const LICENSE_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  'cc-by-4': { bg: '#dcfce7', fg: '#166534', label: 'CC BY 4.0' },
  'odc-by': { bg: '#dbeafe', fg: '#1e40af', label: 'ODC-BY' },
  'academic-only': { bg: '#fef3c7', fg: '#92400e', label: 'Academic Only' },
  internal: { bg: '#f1f5f9', fg: '#64748b', label: 'Internal' },
};

const TYPE_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  real: { bg: '#ecfdf5', fg: '#065f46', label: 'Real Data' },
  synthetic: { bg: '#eff6ff', fg: '#1e40af', label: 'Synthetic' },
  'simulated-attack': { bg: '#fef2f2', fg: '#dc2626', label: 'Simulated Attack' },
};

function ConditionBadge({ condition }: { condition: string }) {
  const colors = CONDITION_COLORS[condition] || { bg: '#f1f5f9', fg: '#64748b' };
  return (
    <span style={{
      display: 'inline-block',
      fontSize: '0.625rem',
      fontWeight: 600,
      padding: '0.125rem 0.5rem',
      borderRadius: '1rem',
      background: colors.bg,
      color: colors.fg,
      whiteSpace: 'nowrap' as const,
    }}>
      {condition.replace(/-/g, ' ')}
    </span>
  );
}

export default function EEGDatasetCard({ sample }: Props) {
  const typeStyle = TYPE_STYLES[sample.type] || TYPE_STYLES.real;
  const licenseStyle = LICENSE_STYLES[sample.license] || LICENSE_STYLES.internal;
  const taraIds = sample.taraId ? sample.taraId.split(',') : [];

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '1rem',
      padding: '1.25rem',
      transition: 'all 0.15s',
      display: 'flex',
      flexDirection: 'column' as const,
    }}>
      {/* Top row: type badge + format */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem',
      }}>
        <span style={{
          fontSize: '0.625rem',
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          color: typeStyle.fg,
        }}>{typeStyle.label}</span>
        <span style={{
          fontSize: '0.625rem',
          fontWeight: 600,
          padding: '0.125rem 0.5rem',
          borderRadius: '1rem',
          background: '#f1f5f9',
          color: '#64748b',
          fontFamily: 'var(--font-mono, monospace)',
          textTransform: 'uppercase' as const,
        }}>{sample.format}</span>
      </div>

      {/* Name */}
      <h3 style={{
        fontSize: '1rem',
        fontWeight: 700,
        color: '#0f172a',
        margin: '0 0 0.375rem',
        fontFamily: 'var(--font-heading, system-ui)',
        lineHeight: 1.3,
      }}>{sample.name}</h3>

      {/* Paradigm */}
      <p style={{
        fontSize: '0.8125rem',
        color: '#64748b',
        margin: '0 0 0.625rem',
        lineHeight: 1.4,
      }}>{sample.paradigm}</p>

      {/* Condition badges */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '0.25rem',
        marginBottom: '0.75rem',
      }}>
        {sample.condition.map(c => (
          <ConditionBadge key={c} condition={c} />
        ))}
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-mono, monospace)',
        color: '#94a3b8',
        marginBottom: '0.625rem',
      }}>
        <span><strong style={{ color: '#0f172a' }}>{sample.channels}</strong> ch</span>
        <span><strong style={{ color: '#0f172a' }}>{sample.samplingRateHz}</strong> Hz</span>
        {sample.subjects != null && (
          <span><strong style={{ color: '#0f172a' }}>{sample.subjects}</strong> subj</span>
        )}
      </div>

      {/* License + Redistributable */}
      <div style={{
        display: 'flex',
        gap: '0.375rem',
        alignItems: 'center',
        marginBottom: '0.75rem',
      }}>
        <span style={{
          fontSize: '0.625rem',
          fontWeight: 600,
          padding: '0.125rem 0.5rem',
          borderRadius: '1rem',
          background: licenseStyle.bg,
          color: licenseStyle.fg,
        }}>{licenseStyle.label}</span>
        {sample.redistributable && (
          <span style={{
            fontSize: '0.625rem',
            fontWeight: 600,
            padding: '0.125rem 0.5rem',
            borderRadius: '1rem',
            background: '#dcfce7',
            color: '#166534',
          }}>Redistributable</span>
        )}
      </div>

      {/* TARA mapping */}
      {taraIds.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap' as const,
          gap: '0.25rem',
          marginBottom: '0.75rem',
        }}>
          {taraIds.map(id => (
            <a
              key={id}
              href={`/TARA/${id.trim()}/`}
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                padding: '0.125rem 0.5rem',
                borderRadius: '1rem',
                background: '#fef2f2',
                color: '#dc2626',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >TARA {id.trim()}</a>
          ))}
        </div>
      )}

      {/* Spacer to push links to bottom */}
      <div style={{ flex: 1 }} />

      {/* Source link + DSM code */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '0.5rem',
        borderTop: '1px solid #f1f5f9',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {sample.sourceUrl && (
            <a
              href={sample.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#3b82f6',
                textDecoration: 'none',
              }}
            >Source</a>
          )}
          {sample.sourceUrl && sample.redistributable && (
            <span style={{ color: '#e2e8f0' }}>|</span>
          )}
          {sample.redistributable && sample.sourceUrl && (
            <a
              href={sample.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#8b5cf6',
                textDecoration: 'none',
              }}
            >Download</a>
          )}
        </div>
        {sample.dsm5Code && (
          <span style={{
            fontSize: '0.625rem',
            fontWeight: 600,
            padding: '0.125rem 0.5rem',
            borderRadius: '1rem',
            background: '#fce7f3',
            color: '#be185d',
            fontFamily: 'var(--font-mono, monospace)',
          }}>DSM {sample.dsm5Code}</span>
        )}
      </div>
    </div>
  );
}
