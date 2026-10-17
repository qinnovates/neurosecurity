/**
 * AttackChainViz — Horizontal stepped flow diagram for multi-step attack chains.
 * Shows techniques traversing from silicon to biological domains, with an I0 boundary,
 * detection timeline, clinical parallel lane, and interactive tooltips.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  DOMAIN_COLORS, ROLE_CONFIG, DETECT_COLORS, EVIDENCE_LABELS,
  extractDomain, isSilicon,
  type DomainCode, type ChainRole, type EvidenceLabel,
} from './chain-constants';

/* ── Types ─────────────────────────────────────────────────── */

/** Realism anchor for one step: its label plus the fact and source that justify it. */
export interface StepEvidence {
  label: EvidenceLabel;
  note: string;
  source_url?: string;
}

/** Realism anchor for a whole chain. `extrapolation` is shown when the chain generalises evidence. */
export interface ChainEvidence {
  overall_label: EvidenceLabel;
  rationale: string;
  device_class?: string;
  extrapolation?: string;
}

export interface ChainStep {
  position: number;
  technique_id: string;
  tara_alias: string;
  role: ChainRole;
  action: string;
  detection_window: string;
  evidence?: StepEvidence;
}

export interface ClinicalParallel {
  name: string;
  note: string;
}

export interface AttackChain {
  chain_id: string;
  chain_name: string;
  objective: string;
  drift_profile: string;
  steps: ChainStep[];
  clinical_parallel?: ClinicalParallel;
  defenses: string[];
  evidence?: ChainEvidence;
}

interface Props {
  chain: AttackChain;
  /**
   * The easy / moderate / hard lane, graded by a keyword test on each step's detection text.
   * The Lab passes false: it shows the catalog's note and does not grade it.
   */
  isDetectionLaneShown?: boolean;
}

const NODE_W = 140, NODE_H = 72, GAP_X = 48, PAD_X = 24, PAD_Y = 24;
// Node fills and the tooltip are fixed colours in both themes, so text on them is fixed too.
const ON_NODE_TEXT = '#475569';
const ON_TOOLTIP_TEXT = '#cbd5e1';
// Gaps leave room for the 9px lane labels drawn just above each lane.
const HEADER_H = 48, DETECT_H = 20, DETECT_GAP = 18, CLINICAL_H = 28, CLINICAL_GAP = 18;

function detectLevel(w: string): 'easy' | 'moderate' | 'hard' {
  const l = w.toLowerCase();
  if (l.includes('months') || l.includes('subtle') || l.includes('passive')) return 'hard';
  return l.includes('may') || l.includes('slight') ? 'moderate' : 'easy';
}

function nodeX(i: number) { return PAD_X + i * (NODE_W + GAP_X); }

/**
 * Evidence chip. The fill/text pair is fixed in both themes, like the domain node
 * fills, so the label keeps its contrast whichever theme is active.
 */
function EvidenceBadge({ label, small = false }: { label: EvidenceLabel; small?: boolean }) {
  const e = EVIDENCE_LABELS[label];
  return (
    <span
      className={`inline-block rounded font-semibold ${small ? 'px-1 py-0 text-[9px]' : 'px-1.5 py-0.5 text-[10px]'}`}
      style={{ background: e.fill, color: e.stroke, border: `1px solid ${e.stroke}66` }}
    >
      {e.label}
    </span>
  );
}

/**
 * Chain-level realism note. States what the label rests on and, when the chain
 * generalises evidence from another device class, says so on the page itself.
 */
function ChainEvidenceNote({ evidence }: { evidence: ChainEvidence }) {
  return (
    <div className="mb-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 text-xs">
      {evidence.device_class && (
        <p className="text-[var(--color-text-muted)]">
          <span className="font-semibold text-[var(--color-text-primary)]">Device class: </span>
          {evidence.device_class}
        </p>
      )}
      <p className="mt-1 text-[var(--color-text-muted)]">
        <span className="font-semibold text-[var(--color-text-primary)]">
          Evidence ({EVIDENCE_LABELS[evidence.overall_label].label.toLowerCase()}):{' '}
        </span>
        {evidence.rationale}
      </p>
      {evidence.extrapolation && (
        <p
          className="mt-2 rounded border-l-2 p-2 text-[var(--color-text-muted)]"
          style={{ borderColor: EVIDENCE_LABELS.projected.stroke, background: 'rgba(245, 158, 11, 0.08)' }}
        >
          <span className="font-semibold text-[var(--color-text-primary)]">Extrapolation: </span>
          {evidence.extrapolation}
        </p>
      )}
      <p className="mt-2 text-[10px] text-[var(--color-text-faint)]">
        No cited incident reports this sequence being carried out end to end. Step labels show how far each
        link is evidenced; the chain is a composition, not an observed event.
      </p>
    </div>
  );
}

function MobileList({ chain }: { chain: AttackChain }) {
  return (
    <div className="space-y-3" role="list" aria-label={`Attack chain: ${chain.chain_name}`}>
      {chain.steps.map((s) => {
        const domain = extractDomain(s.tara_alias);
        const st = domain ? DOMAIN_COLORS[domain] : DOMAIN_COLORS.SIL;
        const role = ROLE_CONFIG[s.role];
        return (
          <a key={s.position} href={`/atlas/tara/${s.technique_id}/`} role="listitem"
            className="flex items-start gap-3 rounded-lg border p-3 hover:bg-[var(--color-bg-surface)]"
            style={{ borderColor: st.stroke + '44' }}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: st.fill, color: st.stroke, border: `1.5px solid ${st.stroke}` }}>{s.position}</span>
            <div className="min-w-0">
              <span className="text-xs font-mono text-[var(--color-text-primary)]">{s.tara_alias}</span>
              <span className="text-[10px] text-[var(--color-text-faint)] ml-2">{role.icon} {role.label}</span>
              {s.evidence && <span className="ml-2"><EvidenceBadge label={s.evidence.label} small /></span>}
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)] line-clamp-2">{s.action}</p>
              <p className="mt-0.5 text-[10px] text-[var(--color-text-faint)]">Detection: {s.detection_window}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function SvgDiagram({ chain, isDetectionLaneShown }: { chain: AttackChain; isDetectionLaneShown: boolean }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; step: ChainStep } | null>(null);

  const steps = chain.steps;
  const hasClinical = !!chain.clinical_parallel;
  const i0Index = steps.reduce((last, s, i) => isSilicon(extractDomain(s.tara_alias)) ? i : last, -1);

  const totalW = PAD_X * 2 + steps.length * NODE_W + (steps.length - 1) * GAP_X;
  const nodeY = HEADER_H + PAD_Y;
  const detectY = nodeY + NODE_H + DETECT_GAP;
  const clinicalY = (isDetectionLaneShown ? detectY + DETECT_H : nodeY + NODE_H) + CLINICAL_GAP;
  const totalH = clinicalY + (hasClinical ? CLINICAL_H : 0) + PAD_Y;

  const enter = useCallback((step: ChainStep, i: number) => {
    setHovered(step.position);
    setTooltip({ x: nodeX(i) + NODE_W / 2, y: nodeY - 8, step });
  }, [nodeY]);
  const leave = useCallback(() => { setHovered(null); setTooltip(null); }, []);
  const nav = useCallback((e: React.KeyboardEvent, s: ChainStep) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = `/atlas/tara/${s.technique_id}/`; }
  }, []);

  return (
    <svg

      viewBox={`0 0 ${totalW} ${totalH}`}
      className="w-full"
      role="img"
      aria-label={`Attack chain diagram: ${chain.chain_name}. ${steps.length} steps from ${steps[0]?.tara_alias ?? 'unknown'} to ${steps[steps.length - 1]?.tara_alias ?? 'unknown'}.`}
    >
      {/* Zone backgrounds */}
      {i0Index >= 0 && (
        <rect
          x={0} y={HEADER_H}
          width={nodeX(i0Index) + NODE_W + GAP_X / 2}
          height={totalH - HEADER_H}
          fill="rgba(59, 130, 246, 0.04)"
          rx={8}
        />
      )}
      {i0Index < steps.length - 1 && (
        <rect
          x={nodeX(i0Index + 1) - GAP_X / 2}
          y={HEADER_H}
          width={totalW - nodeX(i0Index + 1) + GAP_X / 2}
          height={totalH - HEADER_H}
          fill="rgba(34, 197, 94, 0.04)"
          rx={8}
        />
      )}

      {/* I0 boundary divider */}
      {i0Index >= 0 && i0Index < steps.length - 1 && (() => {
        const bx = nodeX(i0Index) + NODE_W + GAP_X / 2;
        return (
          <g>
            <line
              x1={bx} y1={HEADER_H + 4} x2={bx} y2={totalH - PAD_Y}
              stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" opacity={0.7}
            />
            <text x={bx} y={HEADER_H} textAnchor="middle" fill="#f59e0b" fontSize={10} fontWeight={700}>
              I0 BOUNDARY
            </text>
          </g>
        );
      })()}

      {/* Zone labels */}
      <text x={PAD_X} y={16} fill="#94a3b8" fontSize={10} fontWeight={600}>
        SILICON
      </text>
      {i0Index < steps.length - 1 && (
        <text x={nodeX(i0Index + 1)} y={16} fill="#94a3b8" fontSize={10} fontWeight={600}>
          BIOLOGICAL
        </text>
      )}

      <defs>
        <marker id="arrowhead" markerWidth={8} markerHeight={6} refX={7} refY={3} orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#475569" />
        </marker>
      </defs>
      {/* Connectors */}
      {steps.slice(1).map((_s, i) => {
        const cross = i === i0Index;
        return <line key={`c${i}`} x1={nodeX(i) + NODE_W} y1={nodeY + NODE_H / 2} x2={nodeX(i + 1)} y2={nodeY + NODE_H / 2}
          stroke={cross ? '#f59e0b' : '#475569'} strokeWidth={cross ? 2 : 1.5}
          strokeDasharray={cross ? '6 3' : undefined} markerEnd="url(#arrowhead)" />;
      })}

      {/* Step nodes */}
      {steps.map((s, i) => {
        const x = nodeX(i);
        const domain = extractDomain(s.tara_alias);
        const style = domain ? DOMAIN_COLORS[domain] : DOMAIN_COLORS.SIL;
        const role = ROLE_CONFIG[s.role];
        const isHovered = hovered === s.position;

        return (
          <g
            key={s.position}
            tabIndex={0}
            role="button"
            aria-label={`Step ${s.position}: ${s.tara_alias}, ${role.label}. ${s.action}`}
            style={{ cursor: 'pointer', outline: 'none' }}
            onMouseEnter={() => enter(s, i)} onMouseLeave={leave}
            onFocus={() => enter(s, i)} onBlur={leave}
            onKeyDown={(e) => nav(e, s)}
            onClick={() => { window.location.href = `/atlas/tara/${s.technique_id}/`; }}
          >
            <rect
              x={x} y={nodeY} width={NODE_W} height={NODE_H} rx={10}
              fill={style.fill} stroke={style.stroke}
              strokeWidth={isHovered ? 2.5 : 1.5}
              opacity={isHovered ? 1 : 0.9}
            />
            {/* Position circle */}
            <circle cx={x + 16} cy={nodeY + 16} r={10} fill={style.stroke} />
            <text x={x + 16} y={nodeY + 20} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={700}>
              {s.position}
            </text>
            {/* TARA alias */}
            <text x={x + 34} y={nodeY + 20} fill={style.stroke} fontSize={9} fontFamily="monospace" fontWeight={600}>
              {s.tara_alias}
            </text>
            {/* Role label */}
            <text x={x + NODE_W / 2} y={nodeY + 42} textAnchor="middle" fill={ON_NODE_TEXT} fontSize={9}>
              {role.icon} {role.label}
            </text>
            {/* Domain label */}
            <text x={x + NODE_W / 2} y={nodeY + 58} textAnchor="middle" fill={style.stroke} fontSize={8} fontWeight={600}>
              {style.label}
            </text>
          </g>
        );
      })}

      {/* Detection timeline */}
      {isDetectionLaneShown && <text x={PAD_X} y={detectY - 2} fill="var(--color-text-muted)" fontSize={9} fontWeight={600}>DETECTABILITY</text>}
      {isDetectionLaneShown && steps.map((s, i) => {
        const x = nodeX(i);
        const level = detectLevel(s.detection_window);
        const c = DETECT_COLORS[level];
        return (
          <g key={`det-${i}`}>
            <rect x={x} y={detectY} width={NODE_W} height={DETECT_H} rx={4} fill={c} opacity={0.25} stroke={c} strokeWidth={1} />
            <text x={x + NODE_W / 2} y={detectY + 14} textAnchor="middle" fill="var(--color-text-primary)" fontSize={8} fontWeight={600}>{level.toUpperCase()}</text>
          </g>
        );
      })}

      {/* Clinical parallel lane */}
      {hasClinical && (
        <g>
          <text x={PAD_X} y={clinicalY - 2} fill="var(--color-accent-secondary)" fontSize={9} fontWeight={600}>
            CLINICAL PARALLEL
          </text>
          <rect
            x={PAD_X} y={clinicalY}
            width={totalW - PAD_X * 2} height={CLINICAL_H}
            rx={6} fill="none"
            stroke="#22c55e" strokeWidth={1.5} strokeDasharray="8 4" opacity={0.4}
          />
          <text
            x={totalW / 2} y={clinicalY + 18}
            textAnchor="middle" fill="var(--color-accent-secondary)" fontSize={9}
          >
            {chain.clinical_parallel!.name}
          </text>
        </g>
      )}

      {/* Tooltip */}
      {tooltip && (() => {
        const tw = 220;
        const th = 52;
        let tx = tooltip.x - tw / 2;
        if (tx < 4) tx = 4;
        if (tx + tw > totalW - 4) tx = totalW - tw - 4;
        const ty = tooltip.y - th - 6;
        return (
          <g>
            <rect x={tx} y={ty} width={tw} height={th} rx={6} fill="#1e293b" stroke="#334155" strokeWidth={1} />
            <text x={tx + 8} y={ty + 16} fill="#e2e8f0" fontSize={9} fontWeight={600}>
              {tooltip.step.tara_alias}
            </text>
            <text x={tx + 8} y={ty + 30} fill="#94a3b8" fontSize={8}>
              {tooltip.step.action.length > 50 ? tooltip.step.action.slice(0, 50) + '...' : tooltip.step.action}
            </text>
            <text x={tx + 8} y={ty + 44} fill={ON_TOOLTIP_TEXT} fontSize={7}>
              Detection: {tooltip.step.detection_window.length > 40 ? tooltip.step.detection_window.slice(0, 40) + '...' : tooltip.step.detection_window}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

/* ── Main component with responsive switch ─────────────────── */

export default function AttackChainViz({ chain, isDetectionLaneShown = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsMobile(entry.contentRect.width < 600);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <h3 className="text-sm font-semibold">{chain.chain_name}</h3>
        <span className="text-[10px] font-mono text-[var(--color-text-faint)]">{chain.chain_id}</span>
        <span className="text-[10px] text-[var(--color-text-muted)]">{chain.drift_profile}</span>
        {chain.evidence && <EvidenceBadge label={chain.evidence.overall_label} />}
      </div>
      <p className="mb-3 text-xs text-[var(--color-text-muted)]">{chain.objective}</p>
      {chain.evidence && <ChainEvidenceNote evidence={chain.evidence} />}
      {isMobile ? <MobileList chain={chain} /> : <SvgDiagram chain={chain} isDetectionLaneShown={isDetectionLaneShown} />}
      {!isMobile && chain.steps.some((s) => s.evidence) && (
        <div className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3">
          <h4 className="mb-1 text-xs font-semibold text-[var(--color-text-primary)]">Step evidence</h4>
          <ul className="space-y-1 text-xs text-[var(--color-text-muted)]">
            {chain.steps.filter((s) => s.evidence).map((s) => (
              <li key={s.position} className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-mono text-[10px] text-[var(--color-text-primary)]">{s.position}. {s.tara_alias}</span>
                <EvidenceBadge label={s.evidence!.label} small />
                <span>{s.evidence!.note}</span>
                {s.evidence!.source_url && (
                  <a href={s.evidence!.source_url} rel="noopener noreferrer" target="_blank"
                    className="text-[10px] underline text-[var(--color-accent-secondary)]">source</a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!isMobile && chain.defenses.length > 0 && (
        <div className="mt-3 rounded-lg border border-[var(--color-accent-secondary)]/40 bg-[var(--color-bg-surface)] p-3">
          <h4 className="text-xs font-semibold text-[var(--color-accent-secondary)] mb-1">Defenses</h4>
          <ul className="list-disc list-inside text-xs text-[var(--color-text-muted)] space-y-0.5">
            {chain.defenses.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
