/**
 * EEGFrequencyBands — Static reference component showing the 5 EEG frequency bands.
 *
 * Educational reference, not a live data viewer.
 * Shows frequency ranges, clinical significance, and TARA technique relevance.
 */

const BANDS = [
  {
    name: 'Delta',
    range: '0.5 - 4 Hz',
    color: '#6366f1',
    colorBg: '#eef2ff',
    significance: 'Deep sleep (N3), brain injury, encephalopathy. Highest amplitude, slowest frequency.',
    taraRelevance: 'Neuronal jamming attacks produce high-amplitude delta bursts resembling ictal patterns (QIF-T0025)',
  },
  {
    name: 'Theta',
    range: '4 - 8 Hz',
    color: '#3b82f6',
    colorBg: '#eff6ff',
    significance: 'Drowsiness, light sleep, memory encoding, meditation. Elevated in ADHD frontal regions.',
    taraRelevance: 'Signal injection at theta frequencies can mimic ADHD-associated patterns (QIF-T0001)',
  },
  {
    name: 'Alpha',
    range: '8 - 13 Hz',
    color: '#10b981',
    colorBg: '#ecfdf5',
    significance: 'Relaxed wakefulness, eyes closed. Posterior dominant rhythm. Suppressed by attention (alpha blocking).',
    taraRelevance: 'RF entrainment targets alpha band to induce artificial relaxation or drowsiness (QIF-T0009)',
  },
  {
    name: 'Beta',
    range: '13 - 30 Hz',
    color: '#f59e0b',
    colorBg: '#fefce8',
    significance: 'Active thinking, focus, anxiety. Motor cortex (mu rhythm ~12-15 Hz). Increased with stimulants.',
    taraRelevance: 'Motor imagery BCI decode targets beta desynchronization; replay attacks capture these patterns (QIF-T0067)',
  },
  {
    name: 'Gamma',
    range: '30 - 100 Hz',
    color: '#ef4444',
    colorBg: '#fef2f2',
    significance: 'Higher cognitive function, perception binding, consciousness. Often contaminated by muscle artifact.',
    taraRelevance: 'High-frequency injection attacks are harder to filter without removing legitimate gamma activity',
  },
];

export default function EEGFrequencyBands() {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '1rem',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <h3 style={{
          margin: '0 0 0.25rem',
          fontSize: '1.125rem',
          fontWeight: 700,
          color: '#0f172a',
        }}>EEG Frequency Bands</h3>
        <p style={{
          margin: 0,
          fontSize: '0.8125rem',
          color: '#64748b',
        }}>
          Reference guide to the 5 standard EEG bands, their clinical significance, and TARA threat relevance.
          For threat modeling purposes only.
        </p>
      </div>

      {/* Band rows */}
      <div>
        {BANDS.map((band, i) => (
          <div
            key={band.name}
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr',
              borderBottom: i < BANDS.length - 1 ? '1px solid #f1f5f9' : 'none',
            }}
          >
            {/* Band label + bar */}
            <div style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              gap: '0.375rem',
              background: band.colorBg,
            }}>
              <span style={{
                fontSize: '0.9375rem',
                fontWeight: 700,
                color: band.color,
              }}>{band.name}</span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: band.color,
                fontFamily: 'var(--font-mono, monospace)',
              }}>{band.range}</span>
              {/* Frequency bar visualization */}
              <div style={{
                height: '4px',
                borderRadius: '2px',
                background: `linear-gradient(90deg, ${band.color}20, ${band.color})`,
                width: '100%',
              }} />
            </div>

            {/* Content */}
            <div style={{ padding: '1rem 1.25rem' }}>
              <p style={{
                margin: '0 0 0.375rem',
                fontSize: '0.8125rem',
                color: '#334155',
                lineHeight: 1.5,
              }}>{band.significance}</p>
              <p style={{
                margin: 0,
                fontSize: '0.75rem',
                color: '#94a3b8',
                lineHeight: 1.4,
                fontStyle: 'italic' as const,
              }}>TARA: {band.taraRelevance}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderTop: '1px solid #e2e8f0',
        background: '#f8fafc',
      }}>
        <p style={{
          margin: 0,
          fontSize: '0.6875rem',
          color: '#94a3b8',
          lineHeight: 1.4,
        }}>
          Band boundaries are conventional approximations; exact cutoffs vary by researcher and context.
          TARA mappings reference proposed threat techniques (unvalidated, for threat modeling purposes).
        </p>
      </div>
    </div>
  );
}
