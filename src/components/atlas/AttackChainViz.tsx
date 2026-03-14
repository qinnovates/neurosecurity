/**
 * AttackChainViz — Horizontal stepped flow diagram for multi-step attack chains.
 * Shows techniques traversing from silicon to biological domains, with an I0 boundary,
 * detection timeline, clinical parallel lane, and interactive tooltips.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  DOMAIN_COLORS, ROLE_CONFIG, DETECT_COLORS,
  extractDomain, isSilicon,
  type DomainCode, type ChainRole,
} from './chain-constants';

/* ── Types ─────────────────────────────────────────────────── */

export interface ChainStep {
  position: number;
  technique_id: string;
  tara_alias: string;
  role: ChainRole;
  action: string;
  detection_window: string;
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
}

interface Props {
  chain: AttackChain;
}

const NODE_W = 140, NODE_H = 72, GAP_X = 48, PAD_X = 24, PAD_Y = 24;
const HEADER_H = 48, DETECT_H = 20, DETECT_GAP = 12, CLINICAL_H = 28, CLINICAL_GAP = 8;

function detectLevel(w: string): 'easy' | 'moderate' | 'hard' {
  const l = w.toLowerCase();
  if (l.includes('months') || l.includes('subtle') || l.includes('passive')) return 'hard';
  return l.includes('may') || l.includes('slight') ? 'moderate' : 'easy';
}

function nodeX(i: number) { return PAD_X + i * (NODE_W + GAP_X); }

function MobileList({ chain }: Props) {
  return (
    <div className="space-y-3" role="list" aria-label={`Attack chain: ${chain.chain_name}`}>
      {chain.steps.map((s) => {
        const domain = extractDomain(s.tara_alias);
        const st = domain ? DOMAIN_COLORS[domain] : DOMAIN_COLORS.SIL;
        const role = ROLE_CONFIG[s.role];
        return (
          <a key={s.position} href={`/atlas/tara/${s.technique_id}/`} role="listitem"
            className="flex items-start gap-3 rounded-lg border p-3 hover:bg-slate-800/60"
            style={{ borderColor: st.stroke + '44' }}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: st.fill, color: st.stroke, border: `1.5px solid ${st.stroke}` }}>{s.position}</span>
            <div className="min-w-0">
              <span className="text-xs font-mono text-slate-300">{s.tara_alias}</span>
              <span className="text-[10px] text-slate-500 ml-2">{role.icon} {role.label}</span>
              <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{s.action}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Detection: {s.detection_window}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function SvgDiagram({ chain }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; step: ChainStep } | null>(null);

  const steps = chain.steps;
  const hasClinical = !!chain.clinical_parallel;
  const i0Index = steps.reduce((last, s, i) => isSilicon(extractDomain(s.tara_alias)) ? i : last, -1);

  const totalW = PAD_X * 2 + steps.length * NODE_W + (steps.length - 1) * GAP_X;
  const nodeY = HEADER_H + PAD_Y;
  const detectY = nodeY + NODE_H + DETECT_GAP;
  const clinicalY = detectY + DETECT_H + CLINICAL_GAP;
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
            <text x={x + NODE_W / 2} y={nodeY + 42} textAnchor="middle" fill="#64748b" fontSize={9}>
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
      <text x={PAD_X} y={detectY - 2} fill="#64748b" fontSize={9} fontWeight={600}>DETECTABILITY</text>
      {steps.map((s, i) => {
        const x = nodeX(i);
        const level = detectLevel(s.detection_window);
        const c = DETECT_COLORS[level];
        return (
          <g key={`det-${i}`}>
            <rect x={x} y={detectY} width={NODE_W} height={DETECT_H} rx={4} fill={c} opacity={0.25} stroke={c} strokeWidth={1} />
            <text x={x + NODE_W / 2} y={detectY + 14} textAnchor="middle" fill={c} fontSize={8} fontWeight={600}>{level.toUpperCase()}</text>
          </g>
        );
      })}

      {/* Clinical parallel lane */}
      {hasClinical && (
        <g>
          <text x={PAD_X} y={clinicalY - 2} fill="#22c55e" fontSize={9} fontWeight={600}>
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
            textAnchor="middle" fill="#22c55e" fontSize={9} opacity={0.7}
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
            <text x={tx + 8} y={ty + 44} fill="#64748b" fontSize={7}>
              Detection: {tooltip.step.detection_window.length > 40 ? tooltip.step.detection_window.slice(0, 40) + '...' : tooltip.step.detection_window}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

/* ── Main component with responsive switch ─────────────────── */

export default function AttackChainViz({ chain }: Props) {
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
        <h3 className="text-sm font-semibold text-slate-200">{chain.chain_name}</h3>
        <span className="text-[10px] font-mono text-slate-500">{chain.chain_id}</span>
        <span className="text-[10px] text-amber-400">{chain.drift_profile}</span>
      </div>
      <p className="mb-3 text-xs text-slate-400">{chain.objective}</p>
      {isMobile ? <MobileList chain={chain} /> : <SvgDiagram chain={chain} />}
      {!isMobile && chain.defenses.length > 0 && (
        <div className="mt-3 rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3">
          <h4 className="text-xs font-semibold text-emerald-400 mb-1">Defenses</h4>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">
            {chain.defenses.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
