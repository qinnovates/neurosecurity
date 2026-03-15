/**
 * DomainMatrix — 12-row x 3-column heatmap grid.
 * Biological/functional domains (rows) x interaction modes (columns).
 */
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { ThreatVector, Severity } from '../../lib/threat-data';
import { SEVERITY_COLORS } from '../../lib/threat-data';
import { getEvidenceGroup, EVIDENCE_GROUP_COLORS, type EvidenceTierGroup } from '../../lib/evidence-tiers';
import { getLens, LENS_EVENT, type Lens } from '../../lib/lens';
import {
  DOMAIN_ORDER, DOMAIN_LABELS, DOMAIN_ZONES, MODE_ORDER, MODE_COLORS,
  MODE_LABELS, buildMatrix, getZoneForDomain,
  type DomainCode, type ModeCode,
} from './domain-matrix-constants';

interface Props { techniques: ThreatVector[] }

const EV_SHORT: Record<EvidenceTierGroup, string> = { validated: 'T1', demonstrated: 'T3', theoretical: 'T5', speculative: 'T7' };

function sevCounts(ts: ThreatVector[]) {
  const c: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const t of ts) c[t.severity]++;
  return c;
}

function topEvidence(ts: ThreatVector[]): EvidenceTierGroup | null {
  if (!ts.length) return null;
  const order: EvidenceTierGroup[] = ['validated', 'demonstrated', 'theoretical', 'speculative'];
  const gs = ts.map(t => getEvidenceGroup(null, t.status));
  return order.find(g => gs.includes(g)) ?? 'speculative';
}

function opacityHex(count: number): string {
  if (count === 0) return '00';
  const v = count <= 3 ? 0.12 : count <= 6 ? 0.22 : 0.35;
  return Math.round(v * 255).toString(16).padStart(2, '0');
}

function SeverityBar({ c }: { c: Record<Severity, number> }) {
  const total = c.critical + c.high + c.medium + c.low;
  if (!total) return null;
  return (
    <div className="flex rounded-sm overflow-hidden" style={{ width: 40, height: 4 }}>
      {(['critical', 'high', 'medium', 'low'] as Severity[]).map(s =>
        c[s] ? <div key={s} style={{ width: `${(c[s] / total) * 100}%`, background: SEVERITY_COLORS[s].text }} /> : null
      )}
    </div>
  );
}

export default function DomainMatrix({ techniques }: Props) {
  const [lens, setL] = useState<Lens>('both');
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ d: DomainCode; m: ModeCode } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setL(getLens());
    const h = (e: Event) => setL((e as CustomEvent).detail.lens);
    window.addEventListener(LENS_EVENT, h);
    return () => window.removeEventListener(LENS_EVENT, h);
  }, []);

  const matrix = useMemo(() => buildMatrix(techniques), [techniques]);

  const rowTotals = useMemo(() => {
    const t = {} as Record<DomainCode, number>;
    for (const d of DOMAIN_ORDER) t[d] = MODE_ORDER.reduce((s, m) => s + matrix[d][m].length, 0);
    return t;
  }, [matrix]);

  const colTotals = useMemo(() => {
    const t: Record<ModeCode, number> = { R: 0, M: 0, D: 0 };
    for (const d of DOMAIN_ORDER) for (const m of MODE_ORDER) t[m] += matrix[d][m].length;
    return t;
  }, [matrix]);

  const onKey = useCallback((e: React.KeyboardEvent, di: number, mi: number) => {
    let nd = di, nm = mi;
    if (e.key === 'ArrowRight') nm = Math.min(mi + 1, 2);
    else if (e.key === 'ArrowLeft') nm = Math.max(mi - 1, 0);
    else if (e.key === 'ArrowDown') nd = Math.min(di + 1, DOMAIN_ORDER.length - 1);
    else if (e.key === 'ArrowUp') nd = Math.max(di - 1, 0);
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const d = DOMAIN_ORDER[di], m = MODE_ORDER[mi];
      setSelected(p => p?.d === d && p?.m === m ? null : { d, m });
      return;
    } else if (e.key === 'Escape') { setSelected(null); return; }
    else return;
    e.preventDefault();
    ref.current?.querySelector<HTMLElement>(`#cell-${DOMAIN_ORDER[nd]}-${MODE_ORDER[nm]}`)?.focus();
  }, []);

  const toggle = (d: DomainCode, m: ModeCode) =>
    setSelected(p => p?.d === d && p?.m === m ? null : { d, m });

  let curZone = -1;
  const css = { bg: 'var(--color-bg-primary, #0f0f1a)', muted: 'var(--color-text-muted, #64748b)', sec: 'var(--color-text-secondary, #94a3b8)', border: 'var(--color-border, #ffffff15)' };

  return (
    <div className="w-full overflow-x-auto" ref={ref}>
      <div className="min-w-[420px]" role="grid" aria-label="TARA Domain Matrix"
        style={{ display: 'grid', gridTemplateColumns: '140px repeat(3, 1fr) 44px', gap: 2 }}>

        {/* Header */}
        <div className="sticky left-0 z-10" style={{ background: css.bg }} role="columnheader" />
        {MODE_ORDER.map(m => (
          <div key={m} role="columnheader" className="text-center py-2 rounded-t-md"
            style={{ background: `${MODE_COLORS[m]}10`, borderBottom: `2px solid ${MODE_COLORS[m]}` }}>
            <div className="text-sm font-bold font-mono" style={{ color: MODE_COLORS[m] }}>{m}</div>
            <div className="text-[10px]" style={{ color: css.muted }}>{MODE_LABELS[m][lens]}</div>
          </div>
        ))}
        <div role="columnheader" className="text-center py-2 text-[10px]" style={{ color: css.muted }}>Total</div>

        {/* Domain rows */}
        {DOMAIN_ORDER.map((domain, di) => {
          const zone = getZoneForDomain(domain);
          const zi = DOMAIN_ZONES.indexOf(zone);
          const sep = zi !== curZone;
          if (sep) curZone = zi;
          const sil = domain === 'SIL';

          return (
            <div key={domain} className="contents" role="row">
              {sep && (
                <div className="col-span-full flex items-center gap-2 py-1 px-1" role="separator">
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${zone.color}40, transparent)` }} />
                  <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
                    style={{ color: zone.color, background: `${zone.color}15`, border: `1px solid ${zone.color}30` }}>
                    {zone.label}
                  </span>
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, ${zone.color}40, transparent)` }} />
                </div>
              )}
              {/* Row label */}
              <div className="sticky left-0 z-10 flex items-center gap-1.5 px-2 py-1.5 rounded-l-md" role="rowheader"
                style={{ background: css.bg, borderLeft: `3px solid ${zone.color}`, ...(sil ? { borderTop: `1px dashed ${css.border}` } : {}) }}>
                <span className="font-mono text-xs font-bold" style={{ color: zone.color }}>{domain}</span>
                <span className="text-[11px] truncate" style={{ color: css.sec }}>{DOMAIN_LABELS[domain]}</span>
              </div>
              {/* Cells */}
              {MODE_ORDER.map((mode, mi) => {
                const ts = matrix[domain][mode];
                const n = ts.length;
                const mc = MODE_COLORS[mode];
                const ck = `${domain}-${mode}`;
                const ev = topEvidence(ts);
                const isH = hovered === ck;
                const isS = selected?.d === domain && selected?.m === mode;
                return (
                  <div key={ck} className="relative" role="gridcell">
                    <button id={`cell-${ck}`}
                      className="w-full h-full min-h-[52px] rounded-md flex flex-col items-center justify-center gap-0.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1"
                      style={{
                        background: n > 0 ? `${mc}${opacityHex(n)}` : 'transparent',
                        border: n === 0 ? `1px dashed ${css.border}` : `1px solid ${mc}30`,
                        filter: isH ? 'brightness(1.3)' : undefined,
                        boxShadow: isS ? `0 0 0 2px ${mc}` : undefined,
                        ...(sil ? { borderTop: `1px dashed ${css.border}` } : {}),
                      } as React.CSSProperties}
                      onMouseEnter={() => setHovered(ck)} onMouseLeave={() => setHovered(null)}
                      onClick={() => toggle(domain, mode)}
                      onKeyDown={e => onKey(e, di, mi)}
                      aria-label={`${DOMAIN_LABELS[domain]} ${MODE_LABELS[mode][lens]}: ${n} techniques`}
                      tabIndex={di === 0 && mi === 0 ? 0 : -1}>
                      {n > 0 ? (<>
                        <span className="font-mono text-base font-bold" style={{ color: mc }}>{n}</span>
                        <SeverityBar c={sevCounts(ts)} />
                        {ev && <span className="text-[9px] font-mono" style={{ color: EVIDENCE_GROUP_COLORS[ev].text }}>{EV_SHORT[ev]}</span>}
                      </>) : <span className="text-[10px]" style={{ color: css.muted }}>--</span>}
                    </button>
                    {/* Tooltip */}
                    {isH && n > 0 && (
                      <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-lg p-2 text-xs pointer-events-none"
                        style={{ background: 'var(--color-bg-surface, #1a1a2e)', border: `1px solid ${css.border}` }}>
                        <div className="font-semibold mb-1" style={{ color: mc }}>{DOMAIN_LABELS[domain]} / {MODE_LABELS[mode][lens]}</div>
                        <ul className="space-y-0.5 max-h-32 overflow-y-auto">
                          {ts.slice(0, 8).map(t => (
                            <li key={t.id} style={{ color: css.sec }}>
                              <span style={{ color: SEVERITY_COLORS[t.severity].text }}>{'>'}</span> {lens === 'both' ? (
                                <><span>{t.name}</span><br/><span style={{fontSize:'0.75em',opacity:0.7}}>({t.nameClinical || 'silicon-only'})</span></>
                              ) : lens === 'clinical' ? t.nameClinical : t.name}
                            </li>
                          ))}
                          {n > 8 && <li style={{ color: css.muted }}>+{n - 8} more</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Row total */}
              <div className="flex items-center justify-center text-xs font-mono" role="gridcell"
                style={{ color: css.muted }} aria-label={`${DOMAIN_LABELS[domain]} total: ${rowTotals[domain]}`}>
                {rowTotals[domain]}
              </div>
            </div>
          );
        })}

        {/* Column totals */}
        <div className="contents" role="row">
          <div className="sticky left-0 z-10 flex items-center px-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: css.muted, background: css.bg }} role="rowheader">Total</div>
          {MODE_ORDER.map(m => (
            <div key={m} className="flex items-center justify-center py-2 rounded-b-md text-sm font-mono font-bold"
              style={{ color: MODE_COLORS[m], background: `${MODE_COLORS[m]}08` }} role="gridcell"
              aria-label={`${MODE_LABELS[m][lens]} total: ${colTotals[m]}`}>{colTotals[m]}</div>
          ))}
          <div className="flex items-center justify-center text-xs font-mono font-bold"
            style={{ color: css.sec }} role="gridcell">{MODE_ORDER.reduce((s, m) => s + colTotals[m], 0)}</div>
        </div>

        {/* Detail drawer */}
        {selected && matrix[selected.d][selected.m].length > 0 && (() => {
          const ts = matrix[selected.d][selected.m];
          const zone = getZoneForDomain(selected.d);
          const mc = MODE_COLORS[selected.m];
          return (
            <div className="col-span-full rounded-lg p-4 mt-1"
              style={{ background: 'var(--color-glass-bg, rgba(15,15,30,0.6))', border: `1px solid ${css.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold" style={{ color: zone.color }}>{selected.d}</span>
                  <span className="text-sm" style={{ color: 'var(--color-text-primary, #e2e8f0)' }}>
                    {DOMAIN_LABELS[selected.d]} — {MODE_LABELS[selected.m][lens]}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${mc}20`, color: mc }}>
                    {ts.length} techniques
                  </span>
                </div>
                <button onClick={() => setSelected(null)} className="text-xs px-2 py-1 rounded hover:brightness-125"
                  style={{ color: css.muted, background: 'var(--color-bg-secondary, #1a1a2e)' }}
                  aria-label="Close detail drawer">Close</button>
              </div>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {ts.map(t => (
                  <div key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded text-xs"
                    style={{ background: SEVERITY_COLORS[t.severity].bg, border: `1px solid ${SEVERITY_COLORS[t.severity].border}` }}>
                    <span className="font-mono shrink-0" style={{ color: SEVERITY_COLORS[t.severity].text }}>{t.id}</span>
                    <span className="truncate" style={{ color: 'var(--color-text-primary, #e2e8f0)' }}>
                      {lens === 'both' ? (
                        <><span>{t.name}</span> <span style={{fontSize:'0.75em',opacity:0.7}}>({t.nameClinical || 'silicon-only'})</span></>
                      ) : lens === 'clinical' ? t.nameClinical : t.name}
                    </span>
                    <span className="ml-auto shrink-0 font-mono text-[10px]" style={{ color: SEVERITY_COLORS[t.severity].text }}>
                      {t.niss.score.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
