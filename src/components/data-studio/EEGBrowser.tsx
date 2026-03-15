/**
 * EEGBrowser — Client-side React island for browsing the EEG sample registry.
 *
 * Fetches EEG sample data from kql-tables.json (eeg_samples table) or
 * falls back to props passed from Astro build-time.
 * Provides condition and type filtering, search, and renders EEGDatasetCard.
 */

import { useState, useMemo } from 'react';
import EEGDatasetCard from './EEGDatasetCard';
import EEGFrequencyBands from './EEGFrequencyBands';
import type { EEGSample } from './EEGDatasetCard';

interface Props {
  samples: EEGSample[];
}

// Condition categories for filter pills
const CONDITION_FILTERS = [
  { key: 'adhd', label: 'ADHD', color: '#be185d' },
  { key: 'epilepsy', label: 'Epilepsy', color: '#be185d' },
  { key: 'motor-imagery', label: 'Motor Imagery', color: '#1e40af' },
  { key: 'emotion', label: 'Emotion', color: '#7c3aed' },
  { key: 'attack', label: 'Attack', color: '#dc2626' },
  { key: 'sleep', label: 'Sleep', color: '#3730a3' },
  { key: 'healthy', label: 'Healthy', color: '#166534' },
  { key: 'alcoholism', label: 'Alcoholism', color: '#be185d' },
];

const TYPE_FILTERS = [
  { key: 'real', label: 'Real', color: '#065f46' },
  { key: 'synthetic', label: 'Synthetic', color: '#1e40af' },
  { key: 'simulated-attack', label: 'Simulated Attack', color: '#dc2626' },
];

export default function EEGBrowser({ samples }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [redistOnly, setRedistOnly] = useState(false);
  const [showBands, setShowBands] = useState(false);

  // Compute stats
  const stats = useMemo(() => {
    const withTara = samples.filter(s => s.taraId).length;
    const redistributable = samples.filter(s => s.redistributable).length;
    const totalSubjects = samples.reduce((sum, s) => sum + (s.subjects || 0), 0);
    return { total: samples.length, withTara, redistributable, totalSubjects };
  }, [samples]);

  // Which condition filters are actually present in the data
  const activeConditions = useMemo(() => {
    const present = new Set<string>();
    for (const s of samples) {
      for (const c of s.condition) {
        present.add(c);
      }
    }
    return CONDITION_FILTERS.filter(f => present.has(f.key));
  }, [samples]);

  const activeTypes = useMemo(() => {
    const present = new Set<string>();
    for (const s of samples) present.add(s.type);
    return TYPE_FILTERS.filter(f => present.has(f.key));
  }, [samples]);

  // Filter logic
  const filtered = useMemo(() => {
    return samples.filter(s => {
      // Redistributable filter
      if (redistOnly && !s.redistributable) return false;
      // Condition filter
      if (selectedCondition && !s.condition.includes(selectedCondition)) return false;
      // Type filter
      if (selectedType && s.type !== selectedType) return false;
      // Search
      if (search) {
        const q = search.toLowerCase();
        const searchable = [
          s.name, s.id, s.source, s.paradigm, s.notes,
          ...s.condition,
          s.taraId || '',
          s.dsm5Code || '',
        ].join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [samples, selectedCondition, selectedType, redistOnly, search]);

  return (
    <div>
      {/* Stats row */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap' as const,
      }}>
        <StatPill label="Datasets" value={stats.total} bg="#fff" fg="#0f172a" border="#e2e8f0" />
        <StatPill label="TARA Mapped" value={stats.withTara} bg="#fef2f2" fg="#dc2626" border="#fecaca" />
        <StatPill label="Redistributable" value={stats.redistributable} bg="#dcfce7" fg="#166534" border="#bbf7d0" />
        <StatPill label="Total Subjects" value={stats.totalSubjects} bg="#eff6ff" fg="#1e40af" border="#bfdbfe" />
      </div>

      {/* Search + Filters */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1rem',
        flexWrap: 'wrap' as const,
        alignItems: 'center',
      }}>
        <input
          type="text"
          placeholder="Search datasets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: '1 1 300px',
            padding: '0.625rem 1rem',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />
        <button
          onClick={() => setShowBands(!showBands)}
          style={{
            padding: '0.5rem 0.875rem',
            borderRadius: '0.75rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            border: showBands ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            cursor: 'pointer',
            background: showBands ? '#eff6ff' : '#fff',
            color: showBands ? '#1e40af' : '#64748b',
          }}
        >Frequency Bands Reference</button>
      </div>

      {/* Condition filter pills */}
      <div style={{
        display: 'flex',
        gap: '0.375rem',
        marginBottom: '0.5rem',
        flexWrap: 'wrap' as const,
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: '0.625rem',
          fontWeight: 600,
          color: '#94a3b8',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          marginRight: '0.25rem',
        }}>Condition:</span>
        <FilterPill
          label="All"
          active={!selectedCondition}
          onClick={() => setSelectedCondition(null)}
        />
        {activeConditions.map(f => (
          <FilterPill
            key={f.key}
            label={f.label}
            active={selectedCondition === f.key}
            color={f.color}
            onClick={() => setSelectedCondition(selectedCondition === f.key ? null : f.key)}
          />
        ))}
      </div>

      {/* Type filter pills */}
      <div style={{
        display: 'flex',
        gap: '0.375rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap' as const,
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: '0.625rem',
          fontWeight: 600,
          color: '#94a3b8',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          marginRight: '0.25rem',
        }}>Type:</span>
        <FilterPill
          label="All"
          active={!selectedType}
          onClick={() => setSelectedType(null)}
        />
        {activeTypes.map(f => (
          <FilterPill
            key={f.key}
            label={f.label}
            active={selectedType === f.key}
            color={f.color}
            onClick={() => setSelectedType(selectedType === f.key ? null : f.key)}
          />
        ))}
      </div>

      {/* Redistributable filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#475569' }}>
          <input
            type="checkbox"
            checked={redistOnly}
            onChange={e => setRedistOnly(e.target.checked)}
            style={{ accentColor: '#22c55e' }}
          />
          Redistributable only
        </label>
        <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
          ({stats.redistributable} of {stats.total} datasets)
        </span>
      </div>

      {/* Frequency bands reference (collapsible) */}
      {showBands && (
        <div style={{ marginBottom: '2rem' }}>
          <EEGFrequencyBands />
        </div>
      )}

      {/* Results count */}
      <div style={{
        fontSize: '0.75rem',
        color: '#94a3b8',
        marginBottom: '0.75rem',
      }}>
        Showing {filtered.length} of {samples.length} datasets
      </div>

      {/* Dataset cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '1rem',
      }}>
        {filtered.map(s => (
          <EEGDatasetCard key={s.id} sample={s} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{
          padding: '3rem',
          textAlign: 'center' as const,
          color: '#94a3b8',
          fontSize: '0.875rem',
        }}>
          No datasets match the current filters.
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, bg, fg, border }: {
  label: string;
  value: number;
  bg: string;
  fg: string;
  border: string;
}) {
  return (
    <div style={{
      padding: '0.5rem 1rem',
      borderRadius: '2rem',
      background: bg,
      border: `1px solid ${border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    }}>
      <span style={{
        fontSize: '0.6875rem',
        fontWeight: 600,
        color: '#94a3b8',
      }}>{label}</span>
      <span style={{
        fontSize: '1.125rem',
        fontWeight: 700,
        color: fg,
        fontFamily: 'var(--font-mono, monospace)',
      }}>{value.toLocaleString()}</span>
    </div>
  );
}

function FilterPill({ label, active, color, onClick }: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.375rem 0.75rem',
        borderRadius: '2rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
        background: active ? '#0f172a' : '#f1f5f9',
        color: active ? '#fff' : (color || '#64748b'),
        transition: 'all 0.1s',
      }}
    >{label}</button>
  );
}
