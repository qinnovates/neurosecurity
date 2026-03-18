/**
 * NTSSGauge — Neural Threat Surface Score + Coherence Metric (Cs)
 *
 * Dual-ring semicircular gauge:
 *   Outer ring: NTSS (0-100) — how exposed is this dataset to TARA techniques?
 *   Inner ring: Cs (0-1.0) — estimated signal coherence from metadata
 *
 * NTSS Sub-scores:
 *   TARA Coverage (0-40): mapped techniques / total possible
 *   Channel Vulnerability (0-20): channel count → attack surface
 *   Temporal Resolution (0-20): sampling rate → exploitable frequency bands
 *   Clinical Overlap (0-20): clinical conditions sharing signal pattern
 *
 * Coherence Metric (Cs) — proposed, unvalidated:
 *   Estimated from metadata: channel density, sampling adequacy, paradigm structure.
 *   Higher Cs = more coherent signal = better baseline for anomaly detection.
 *   Lower Cs = noisier signal = harder to distinguish attack from noise.
 *   In Demo Atlas (sample data): Cs is ESTIMATED from metadata.
 *   In Neural Atlas (live): Cs would be COMPUTED from actual signal coherence.
 *
 * Composite: NTSS 0-100 (red=exposed). Cs 0.0-1.0 (green=coherent).
 */

import { useMemo, type CSSProperties } from 'react';

// ── Types ──────────────────────────────────────────────────────────────

interface NTSSInput {
  /** Number of TARA techniques mapped to this dataset */
  taraMatchCount: number;
  /** Total techniques in registrar (for normalization) */
  totalTechniques: number;
  /** EEG channel count */
  channels: number;
  /** Sampling rate in Hz */
  samplingRateHz: number;
  /** Number of clinical conditions this dataset maps to */
  clinicalConditionCount: number;
  /** Dataset name for display */
  datasetName: string;
  /** Number of subjects (affects statistical power / coherence estimate) */
  subjects?: number;
  /** Paradigm type (resting-state, task-based, etc.) */
  paradigm?: string;
}

interface NTSSResult {
  total: number;
  taraCoverage: number;
  channelVuln: number;
  temporalRes: number;
  clinicalOverlap: number;
  level: 'low' | 'moderate' | 'high';
  color: string;
  /** Estimated Coherence Metric (0.0-1.0) — proposed, computed from metadata */
  coherence: number;
  coherenceLevel: 'poor' | 'fair' | 'good' | 'excellent';
  coherenceColor: string;
}

// ── Computation ────────────────────────────────────────────────────────

function computeNTSS(input: NTSSInput): NTSSResult {
  // TARA Coverage (0-40): what fraction of techniques could target this data?
  // Normalize: 0 matches = 0, 10+ matches = 40 (most datasets map to 1-5)
  const taraCoverage = Math.min(40, Math.round((input.taraMatchCount / Math.max(input.totalTechniques, 1)) * 400));

  // Channel Vulnerability (0-20): more channels = more attack surface
  // 1-4 channels = low, 8-16 = moderate, 32+ = high, 256+ = max
  const channelVuln = Math.min(20, Math.round(
    input.channels <= 4 ? (input.channels / 4) * 5 :
    input.channels <= 16 ? 5 + ((input.channels - 4) / 12) * 5 :
    input.channels <= 64 ? 10 + ((input.channels - 16) / 48) * 5 :
    15 + Math.min(5, (input.channels - 64) / 192 * 5)
  ));

  // Temporal Resolution (0-20): higher sampling = more frequency bands exploitable
  // <128Hz = low, 256Hz = moderate, 500Hz+ = high, 1000Hz+ = max
  const temporalRes = Math.min(20, Math.round(
    input.samplingRateHz <= 128 ? (input.samplingRateHz / 128) * 5 :
    input.samplingRateHz <= 256 ? 5 + ((input.samplingRateHz - 128) / 128) * 5 :
    input.samplingRateHz <= 512 ? 10 + ((input.samplingRateHz - 256) / 256) * 5 :
    15 + Math.min(5, (input.samplingRateHz - 512) / 512 * 5)
  ));

  // Clinical Overlap (0-20): more conditions = broader threat/therapeutic surface
  const clinicalOverlap = Math.min(20, input.clinicalConditionCount * 4);

  const total = taraCoverage + channelVuln + temporalRes + clinicalOverlap;
  const level = total <= 30 ? 'low' : total <= 60 ? 'moderate' : 'high';
  const color = total <= 30 ? '#22c55e' : total <= 60 ? '#eab308' : '#ef4444';

  // Coherence Metric (Cs) — estimated from metadata
  // Higher = more coherent signal = better anomaly detection baseline
  // Factors: channel density (more channels = better spatial coherence),
  //          sampling adequacy (Nyquist for gamma = 80Hz min → 160Hz sampling),
  //          subject count (more subjects = more robust baseline),
  //          paradigm structure (task-based > resting > unknown)
  const channelCoherence = Math.min(0.3, (input.channels / 64) * 0.3);
  const samplingAdequacy = Math.min(0.3,
    input.samplingRateHz >= 500 ? 0.3 :
    input.samplingRateHz >= 256 ? 0.25 :
    input.samplingRateHz >= 128 ? 0.15 : 0.05
  );
  const subjectPower = Math.min(0.2, ((input.subjects || 1) / 100) * 0.2);
  const paradigmBonus =
    input.paradigm?.toLowerCase().includes('task') ? 0.2 :
    input.paradigm?.toLowerCase().includes('motor') ? 0.18 :
    input.paradigm?.toLowerCase().includes('erp') ? 0.18 :
    input.paradigm?.toLowerCase().includes('resting') ? 0.12 :
    input.paradigm?.toLowerCase().includes('sleep') ? 0.15 : 0.05;

  const coherence = Math.min(1.0, Math.round((channelCoherence + samplingAdequacy + subjectPower + paradigmBonus) * 100) / 100);
  const coherenceLevel = coherence >= 0.8 ? 'excellent' : coherence >= 0.6 ? 'good' : coherence >= 0.4 ? 'fair' : 'poor';
  const coherenceColor = coherence >= 0.8 ? '#22c55e' : coherence >= 0.6 ? '#3b82f6' : coherence >= 0.4 ? '#eab308' : '#ef4444';

  return { total, taraCoverage, channelVuln, temporalRes, clinicalOverlap, level, color, coherence, coherenceLevel, coherenceColor };
}

// ── Styles ─────────────────────────────────────────────────────────────

const S: Record<string, CSSProperties> = {
  container: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '20px', borderRadius: '12px',
    background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(148, 163, 184, 0.1)',
  },
  title: {
    fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.1em', opacity: 0.5, marginBottom: '12px',
  },
  gaugeWrap: {
    position: 'relative', width: '200px', height: '110px', overflow: 'hidden',
  },
  scoreCenter: {
    position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)',
    textAlign: 'center',
  },
  scoreNumber: {
    fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)',
    lineHeight: 1,
  },
  scoreLabel: {
    fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.08em', marginTop: '2px',
  },
  subscore: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '4px 0', fontSize: '12px',
  },
  bar: {
    height: '4px', borderRadius: '2px', background: 'rgba(148, 163, 184, 0.1)',
    flex: 1, marginLeft: '8px', marginRight: '8px', overflow: 'hidden',
  },
  barFill: {
    height: '100%', borderRadius: '2px', transition: 'width 0.6s ease',
  },
  subscoreLabel: { opacity: 0.6, fontSize: '11px', minWidth: '100px' },
  subscoreValue: { fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', fontWeight: 600, minWidth: '24px', textAlign: 'right' },
};

// ── SVG Gauge ──────────────────────────────────────────────────────────

function GaugeArc({ score, color }: { score: number; color: string }) {
  const radius = 80;
  const cx = 100;
  const cy = 95;
  const startAngle = Math.PI;
  const endAngle = 0;
  const scoreAngle = startAngle - (score / 100) * Math.PI;

  // Background arc
  const bgX1 = cx + radius * Math.cos(startAngle);
  const bgY1 = cy - radius * Math.sin(startAngle);
  const bgX2 = cx + radius * Math.cos(endAngle);
  const bgY2 = cy - radius * Math.sin(endAngle);
  const bgPath = `M ${bgX1} ${bgY1} A ${radius} ${radius} 0 0 1 ${bgX2} ${bgY2}`;

  // Score arc
  const scX2 = cx + radius * Math.cos(scoreAngle);
  const scY2 = cy - radius * Math.sin(scoreAngle);
  const largeArc = score > 50 ? 1 : 0;
  const scorePath = `M ${bgX1} ${bgY1} A ${radius} ${radius} 0 ${largeArc} 1 ${scX2} ${scY2}`;

  // Tick marks
  const ticks = [0, 25, 50, 75, 100].map(v => {
    const a = startAngle - (v / 100) * Math.PI;
    const innerR = radius - 6;
    const outerR = radius + 2;
    return {
      x1: cx + innerR * Math.cos(a), y1: cy - innerR * Math.sin(a),
      x2: cx + outerR * Math.cos(a), y2: cy - outerR * Math.sin(a),
      label: v, lx: cx + (radius + 14) * Math.cos(a), ly: cy - (radius + 14) * Math.sin(a),
    };
  });

  return (
    <svg viewBox="0 0 200 110" style={{ width: '200px', height: '110px' }}>
      {/* Glow filter */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background arc */}
      <path d={bgPath} fill="none" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="10" strokeLinecap="round" />

      {/* Score arc */}
      {score > 0 && (
        <path d={scorePath} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" filter="url(#glow)"
          style={{ transition: 'all 0.8s ease' }} />
      )}

      {/* Ticks */}
      {ticks.map(t => (
        <g key={t.label}>
          <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" />
          <text x={t.lx} y={t.ly} fill="rgba(148, 163, 184, 0.3)" fontSize="8" textAnchor="middle" dominantBaseline="middle">
            {t.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────

interface NTSSGaugeProps {
  input: NTSSInput;
  compact?: boolean;
}

export default function NTSSGauge({ input, compact = false }: NTSSGaugeProps) {
  const result = useMemo(() => computeNTSS(input), [input]);

  const subscores = [
    { label: 'TARA Coverage', value: result.taraCoverage, max: 40, color: '#ef4444' },
    { label: 'Channel Exposure', value: result.channelVuln, max: 20, color: '#f59e0b' },
    { label: 'Temporal Resolution', value: result.temporalRes, max: 20, color: '#3b82f6' },
    { label: 'Clinical Overlap', value: result.clinicalOverlap, max: 20, color: '#a855f7' },
  ];

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${result.color}15`, border: `2px solid ${result.color}`,
          fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', fontWeight: 700,
          color: result.color,
        }}>
          {result.total}
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: result.color, textTransform: 'uppercase' }}>
            NTSS: {result.level}
          </div>
          <div style={{ fontSize: '10px', opacity: 0.5 }}>Neural Threat Surface</div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.container}>
      <div style={S.title}>Neural Threat Surface Score</div>

      <div style={S.gaugeWrap}>
        <GaugeArc score={result.total} color={result.color} />
        <div style={S.scoreCenter}>
          <div style={{ ...S.scoreNumber, color: result.color }}>{result.total}</div>
          <div style={{ ...S.scoreLabel, color: result.color }}>{result.level}</div>
        </div>
      </div>

      {/* Coherence Metric */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.4)' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${result.coherenceColor}10`, border: `2px solid ${result.coherenceColor}`,
        }}>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '13px', fontWeight: 700, color: result.coherenceColor }}>
            {result.coherence.toFixed(2)}
          </span>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600 }}>
            Coherence (Cs): <span style={{ color: result.coherenceColor }}>{result.coherenceLevel}</span>
          </div>
          <div style={{ fontSize: '10px', opacity: 0.4 }}>
            Signal coherence estimate — proposed metric, requires validation
          </div>
        </div>
      </div>

      {/* Sub-scores */}
      <div style={{ width: '100%', marginTop: '12px' }}>
        {subscores.map(s => (
          <div key={s.label} style={S.subscore}>
            <span style={S.subscoreLabel}>{s.label}</span>
            <div style={S.bar}>
              <div style={{ ...S.barFill, width: `${(s.value / s.max) * 100}%`, background: s.color }} />
            </div>
            <span style={{ ...S.subscoreValue, color: s.color }}>{s.value}/{s.max}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '10px', opacity: 0.3, marginTop: '12px', textAlign: 'center' }}>
        {input.datasetName} — {input.channels}ch @ {input.samplingRateHz}Hz
      </div>
    </div>
  );
}

/** Compute NTSS for external use (e.g., sorting datasets by threat surface) */
export { computeNTSS };
export type { NTSSInput, NTSSResult };
