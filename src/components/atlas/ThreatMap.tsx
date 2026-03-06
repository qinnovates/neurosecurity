/**
 * ThreatMap — Force-directed threat graph visualization for the Atlas dashboard.
 * Shows techniques as nodes, connected by tactic relationships, band co-occurrence,
 * and cross-references. Laid out by kill-chain phase (left→right).
 *
 * Search any technique → spider outward showing connections.
 * Click nodes to pivot. Hourglass sidebar highlights affected bands.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { ThreatVector } from '../../lib/threat-data';

interface Props {
  threats: ThreatVector[];
  tactics: { id: string; name: string; action_code: string; description: string }[];
  bands: { id: string; name: string; zone: string }[];
  onBandHighlight?: (bandIds: string[]) => void;
}

// Kill chain phase ordering (left→right)
const KILLCHAIN_ORDER = [
  'QIF-N.SC', 'QIF-B.IN', 'QIF-N.IJ', 'QIF-C.IM', 'QIF-B.EV',
  'QIF-D.HV', 'QIF-P.DS', 'QIF-N.MD', 'QIF-C.EX', 'QIF-E.RD', 'QIF-M.SV',
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#94a3b8',
};

const ZONE_COLORS: Record<string, string> = {
  neural: '#22c55e',
  interface: '#f59e0b',
  synthetic: '#3b82f6',
};

interface GraphNode {
  id: string;
  threat: ThreatVector;
  x: number;
  y: number;
  isCenter: boolean;
  fx?: number;
  fy?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'secondary' | 'sibling' | 'band';
}

export default function ThreatMap({ threats, tactics, bands, onBandHighlight }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [centerThreat, setCenterThreat] = useState<ThreatVector | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ threat: ThreatVector; x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 500 });

  // Index threats
  const threatById = useMemo(() => {
    const map: Record<string, ThreatVector> = {};
    for (const t of threats) map[t.id] = t;
    return map;
  }, [threats]);

  const threatsByTactic = useMemo(() => {
    const map: Record<string, ThreatVector[]> = {};
    for (const t of threats) {
      if (!map[t.tactic]) map[t.tactic] = [];
      map[t.tactic].push(t);
    }
    return map;
  }, [threats]);

  // Search results
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return threats
      .filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, threats]);

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ w: width, h: Math.max(height, 400) });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Compute graph
  const { nodes, edges } = useMemo(() => {
    if (!centerThreat) return { nodes: [] as GraphNode[], edges: [] as GraphEdge[] };
    const edgeList: GraphEdge[] = [];
    const neighborIds = new Set<string>();

    // 1. Secondary tactic links
    if (centerThreat.crossRefs?.secondary_tactics) {
      for (const tacticId of centerThreat.crossRefs.secondary_tactics) {
        for (const t of threatsByTactic[tacticId] ?? []) {
          if (t.id === centerThreat.id) continue;
          edgeList.push({ source: centerThreat.id, target: t.id, type: 'secondary' });
          neighborIds.add(t.id);
        }
      }
    }

    // Reverse: other threats whose secondary_tactics include center's tactic
    for (const t of threats) {
      if (t.id === centerThreat.id || neighborIds.has(t.id)) continue;
      if (t.crossRefs?.secondary_tactics?.includes(centerThreat.tactic)) {
        edgeList.push({ source: t.id, target: centerThreat.id, type: 'secondary' });
        neighborIds.add(t.id);
      }
    }

    // 2. Tactic siblings (top 4 by NISS)
    const siblings = (threatsByTactic[centerThreat.tactic] ?? [])
      .filter(t => t.id !== centerThreat.id && !neighborIds.has(t.id))
      .sort((a, b) => b.niss.score - a.niss.score)
      .slice(0, 4);
    for (const t of siblings) {
      edgeList.push({ source: centerThreat.id, target: t.id, type: 'sibling' });
      neighborIds.add(t.id);
    }

    // 3. Band co-occurrence (3+ shared bands, top 3)
    const centerBands = new Set(centerThreat.bands);
    const bandMatches = threats
      .filter(t => {
        if (t.id === centerThreat.id || neighborIds.has(t.id)) return false;
        let overlap = 0;
        for (const b of t.bands) { if (centerBands.has(b)) overlap++; }
        return overlap >= 3;
      })
      .sort((a, b) => b.niss.score - a.niss.score)
      .slice(0, 3);
    for (const t of bandMatches) {
      edgeList.push({ source: centerThreat.id, target: t.id, type: 'band' });
      neighborIds.add(t.id);
    }

    // Build nodes with kill-chain-ordered layout
    const { w, h } = dimensions;
    const pad = 60;

    const centerPhaseIdx = KILLCHAIN_ORDER.indexOf(centerThreat.tactic);
    const centerNode: GraphNode = {
      id: centerThreat.id,
      threat: centerThreat,
      isCenter: true,
      x: w / 2,
      y: h / 2,
      fx: w / 2,
      fy: h / 2,
    };

    const neighborList = Array.from(neighborIds).map(id => threatById[id]).filter(Boolean);
    const neighborNodes: GraphNode[] = neighborList.map((t, i) => {
      // Position by kill chain phase (x) and spread vertically (y)
      const phaseIdx = KILLCHAIN_ORDER.indexOf(t.tactic);
      const phaseDelta = phaseIdx - centerPhaseIdx;
      const xBase = w / 2 + phaseDelta * (w / (KILLCHAIN_ORDER.length + 2));
      // Spread within same phase
      const samePhase = neighborList.filter(n => n.tactic === t.tactic);
      const idxInPhase = samePhase.indexOf(t);
      const spreadY = samePhase.length > 1
        ? (idxInPhase - (samePhase.length - 1) / 2) * 60
        : 0;

      return {
        id: t.id,
        threat: t,
        isCenter: false,
        x: Math.max(pad, Math.min(w - pad, xBase)),
        y: Math.max(pad, Math.min(h - pad, h / 2 + spreadY)),
      };
    });

    // Simple force relaxation (30 iterations)
    const allNodes = [centerNode, ...neighborNodes];
    for (let iter = 0; iter < 30; iter++) {
      const damp = 0.8 * (1 - iter / 30);
      // Repulsion
      for (let i = 0; i < allNodes.length; i++) {
        for (let j = i + 1; j < allNodes.length; j++) {
          const a = allNodes[i], b = allNodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 2000 / (dist * dist);
          const fx = (dx / dist) * force, fy = (dy / dist) * force;
          if (!a.fx) { a.x -= fx * damp; a.y -= fy * damp; }
          if (!b.fx) { b.x += fx * damp; b.y += fy * damp; }
        }
      }
      // Spring attraction along edges
      for (const e of edgeList) {
        const a = allNodes.find(n => n.id === e.source);
        const b = allNodes.find(n => n.id === e.target);
        if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const target = e.type === 'secondary' ? 120 : 160;
        const f = (dist - target) * 0.015;
        const fx = (dx / dist) * f, fy = (dy / dist) * f;
        if (!a.fx) { a.x += fx * damp; a.y += fy * damp; }
        if (!b.fx) { b.x -= fx * damp; b.y -= fy * damp; }
      }
      // Boundary
      for (const n of allNodes) {
        if (n.fx) continue;
        n.x = Math.max(pad, Math.min(w - pad, n.x));
        n.y = Math.max(pad, Math.min(h - pad, n.y));
      }
    }

    return { nodes: allNodes, edges: edgeList };
  }, [centerThreat, threats, threatById, threatsByTactic, dimensions]);

  // Highlight bands when center changes
  useEffect(() => {
    if (!centerThreat || !onBandHighlight) return;
    const allBands = new Set(centerThreat.bands);
    for (const n of nodes) {
      for (const b of n.threat.bands) allBands.add(b);
    }
    onBandHighlight(Array.from(allBands));
  }, [centerThreat, nodes, onBandHighlight]);

  const selectThreat = useCallback((t: ThreatVector) => {
    setCenterThreat(t);
    setQuery('');
  }, []);

  const getNodeColor = (t: ThreatVector) => {
    const band = bands.find(b => b.id === (t.bands[0] ?? ''));
    return band ? (ZONE_COLORS[band.zone] ?? '#94a3b8') : '#94a3b8';
  };

  const getNodeRadius = (t: ThreatVector) => 12 + (t.niss.score / 10) * 10;

  // Active kill chain phases
  const activePhases = useMemo(() => {
    if (!centerThreat) return new Set<string>();
    const set = new Set<string>([centerThreat.tactic]);
    if (centerThreat.crossRefs?.secondary_tactics) {
      for (const t of centerThreat.crossRefs.secondary_tactics) set.add(t);
    }
    for (const n of nodes) {
      if (!n.isCenter) set.add(n.threat.tactic);
    }
    return set;
  }, [centerThreat, nodes]);

  const exampleQueries = ['induced psychosis', 'motor hijack', 'eavesdropping', 'firmware', 'memory poisoning'];

  return (
    <div className="flex flex-col" style={{ minHeight: '500px' }}>
      {/* Search bar */}
      <div className="relative mb-3">
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
        >
          <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-faint)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search techniques, tactics, or keywords..."
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-lg leading-none"
              style={{ color: 'var(--color-text-faint)' }}
            >
              &times;
            </button>
          )}
        </div>

        {/* Dropdown */}
        {searchResults.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-20"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              maxHeight: '320px',
              overflowY: 'auto',
            }}
          >
            {searchResults.map(t => (
              <button
                key={t.id}
                onClick={() => selectThreat(t)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(6, 182, 212, 0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: SEVERITY_COLORS[t.severity] ?? '#94a3b8' }}
                />
                <span className="text-sm flex-1 truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {t.name}
                </span>
                <span className="text-xs shrink-0" style={{ color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>
                  {t.id}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Graph area */}
      <div
        ref={containerRef}
        className="flex-1 relative rounded-xl overflow-hidden"
        style={{
          background: 'var(--color-bg-deep)',
          border: '1px solid var(--color-border)',
          minHeight: '400px',
        }}
      >
        {!centerThreat ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
            <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
              Search for a technique to visualize its attack chain
            </p>
            <div className="flex flex-wrap gap-2 justify-center px-4">
              {exampleQueries.map(q => (
                <button
                  key={q}
                  onClick={() => {
                    setQuery(q);
                    const match = threats.find(t =>
                      t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
                    );
                    if (match) selectThreat(match);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs transition-colors"
                  style={{
                    background: 'var(--color-bg-surface)',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--color-accent-secondary)';
                    e.currentTarget.style.color = 'var(--color-accent-secondary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.color = 'var(--color-text-muted)';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* SVG Graph */
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${dimensions.w} ${dimensions.h}`}
            style={{ display: 'block' }}
          >
            {/* Edges */}
            {edges.map((e, i) => {
              const a = nodes.find(n => n.id === e.source);
              const b = nodes.find(n => n.id === e.target);
              if (!a || !b) return null;
              return (
                <line
                  key={i}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke="var(--color-text-faint)"
                  strokeOpacity={e.type === 'secondary' ? 0.35 : e.type === 'sibling' ? 0.15 : 0.08}
                  strokeWidth={e.type === 'secondary' ? 1.5 : 1}
                  strokeDasharray={e.type === 'band' ? '3 4' : e.type === 'sibling' ? '4 3' : undefined}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map(n => {
              const r = getNodeRadius(n.threat);
              const fill = getNodeColor(n.threat);
              const stroke = SEVERITY_COLORS[n.threat.severity] ?? '#94a3b8';
              const label = n.threat.name.length > 20
                ? n.threat.name.substring(0, 18) + '\u2026'
                : n.threat.name;

              return (
                <g
                  key={n.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => selectThreat(n.threat)}
                  onMouseEnter={e => {
                    const rect = (e.currentTarget as SVGGElement).getBoundingClientRect();
                    setHoveredNode({ threat: n.threat, x: rect.x + rect.width / 2, y: rect.y });
                  }}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <circle
                    cx={n.x} cy={n.y} r={r}
                    fill={fill}
                    fillOpacity={n.isCenter ? 0.35 : 0.2}
                    stroke={stroke}
                    strokeWidth={n.isCenter ? 2.5 : 1.5}
                  />
                  {n.isCenter && (
                    <circle
                      cx={n.x} cy={n.y} r={r + 4}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={1}
                      strokeOpacity={0.3}
                      strokeDasharray="4 3"
                    />
                  )}
                  <text
                    x={n.x} y={n.y + r + 12}
                    textAnchor="middle"
                    fontSize={9}
                    fill="var(--color-text-muted)"
                    style={{ pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Tooltip */}
        {hoveredNode && (
          <div
            className="fixed z-50 pointer-events-none rounded-lg px-3 py-2 text-xs"
            style={{
              left: hoveredNode.x,
              top: hoveredNode.y - 8,
              transform: 'translate(-50%, -100%)',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              maxWidth: '250px',
            }}
          >
            <div className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {hoveredNode.threat.name}
            </div>
            <div style={{ color: 'var(--color-text-faint)' }}>
              {hoveredNode.threat.id} &middot;{' '}
              <span style={{ color: SEVERITY_COLORS[hoveredNode.threat.severity] }}>
                {hoveredNode.threat.severity}
              </span>
              {' '}&middot; NISS {hoveredNode.threat.niss.score.toFixed(1)}
            </div>
          </div>
        )}
      </div>

      {/* Kill chain bar */}
      <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
        <span
          className="text-xs shrink-0 uppercase tracking-wide"
          style={{ color: 'var(--color-text-faint)', fontSize: '0.6rem', letterSpacing: '0.08em' }}
        >
          Kill Chain
        </span>
        {KILLCHAIN_ORDER.map(tacticId => {
          const tactic = tactics.find(t => t.id === tacticId);
          const isActive = activePhases.has(tacticId);
          return (
            <div
              key={tacticId}
              className="flex-1 text-center py-1 rounded text-xs truncate"
              style={{
                fontSize: '0.55rem',
                fontFamily: 'var(--font-mono)',
                background: isActive ? 'rgba(6, 182, 212, 0.25)' : 'var(--color-bg-deep)',
                color: isActive ? '#22d3ee' : 'var(--color-text-faint)',
                fontWeight: isActive ? 700 : 400,
                boxShadow: isActive ? '0 0 8px rgba(6, 182, 212, 0.35)' : 'none',
                minWidth: '40px',
              }}
              title={tactic ? `${tactic.name}: ${tactic.description}` : tacticId}
            >
              {tactic?.action_code ?? tacticId.split('.')[1]}
            </div>
          );
        })}
      </div>

      {/* Detail card for center threat */}
      {centerThreat && (
        <div
          className="mt-3 rounded-xl p-4"
          style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h3
                className="text-base font-bold"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}
              >
                {centerThreat.name}
              </h3>
              <span className="text-xs" style={{ color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>
                {centerThreat.id}
              </span>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: `${SEVERITY_COLORS[centerThreat.severity]}20`,
                  color: SEVERITY_COLORS[centerThreat.severity],
                  border: `1px solid ${SEVERITY_COLORS[centerThreat.severity]}40`,
                }}
              >
                {centerThreat.severity}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ color: 'var(--color-text-faint)', border: '1px solid var(--color-border)' }}
              >
                NISS {centerThreat.niss.score.toFixed(1)}
              </span>
            </div>
          </div>
          <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--color-text-muted)' }}>
            {centerThreat.description}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
              {nodes.length - 1} connected techniques
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
              Bands: {centerThreat.bands.join(', ')}
            </span>
            <a
              href={`/atlas/tara/${centerThreat.id}/`}
              className="text-xs ml-auto transition-colors"
              style={{ color: 'var(--color-accent-secondary)' }}
            >
              Full technique page &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
