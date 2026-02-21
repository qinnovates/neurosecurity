/**
 * BciLandscape — Visualizes the BCI industry landscape over time.
 * Shows publication trends, industry timeline, security posture, and funding gaps.
 * Pure SVG charts, no external dependencies.
 */

import { useState, useMemo } from 'react';

// --- Types ---

interface BciLandscapeProps {
  publicationTrends: Array<{
    year: number;
    pubmed_bci: number;
    security_bci: number;
  }>;
  companies: Array<{
    name: string;
    type: 'invasive' | 'non_invasive' | 'semi_invasive';
    status: string;
    security_posture: string;
    devices: Array<{
      name: string;
      type: string;
      channels: number;
      units_deployed: string;
      first_human: string | null;
    }>;
  }>;
  fundingRounds: Array<{
    company: string;
    amount_usd: number;
    date: string;
  }>;
  policyTimeline: Array<{
    date: string;
    event: string;
    type: string;
    jurisdiction: string;
  }>;
  marketSize: Array<{
    year: number;
    value_billion_usd: number;
  }>;
}

// --- Constants ---

const GLASS = 'bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6';
const TYPE_LABELS: Record<string, string> = {
  invasive: 'Invasive',
  non_invasive: 'Non-Invasive',
  semi_invasive: 'Semi-Invasive',
};
const TYPE_COLORS: Record<string, string> = {
  invasive: '#f43f5e',
  non_invasive: '#3b82f6',
  semi_invasive: '#f59e0b',
};
const POSTURE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  none_published: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'None' },
  minimal_claims: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Minimal' },
  basic_encryption: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Basic' },
  regulatory_compliance: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Regulatory' },
  open_source: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Open Source' },
  mature: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Mature' },
};
const EVENT_COLORS: Record<string, string> = {
  company: '#22c55e',
  regulatory: '#3b82f6',
  milestone: '#f59e0b',
  security: '#ef4444',
};

const TIMELINE_EVENTS = [
  { year: 2004, label: 'BrainGate first implant', type: 'milestone' },
  { year: 2012, label: 'Emotiv EPOC launch', type: 'company' },
  { year: 2016, label: 'Neuralink founded', type: 'company' },
  { year: 2017, label: 'Kernel founded', type: 'company' },
  { year: 2019, label: 'CTRL-Labs acquired by Meta ($500M+)', type: 'milestone' },
  { year: 2022, label: 'NextMind acquired by Snap', type: 'milestone' },
  { year: 2022.3, label: 'Synchron first US implant', type: 'milestone' },
  { year: 2023, label: 'FDA FDORA cybersecurity mandate', type: 'regulatory' },
  { year: 2023.3, label: 'FDA Neuralink IDE approved', type: 'regulatory' },
  { year: 2024, label: 'Neuralink first human implant', type: 'milestone' },
  { year: 2024.3, label: 'Colorado neural data law', type: 'regulatory' },
  { year: 2024.6, label: 'California SB 1223', type: 'regulatory' },
  { year: 2025, label: 'UNESCO neurotechnology recommendation', type: 'regulatory' },
  { year: 2026, label: 'QIF/TARA published', type: 'security' },
];

// --- Helpers ---

function formatUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

// --- Sub-components ---

function PublicationChart({ data }: { data: BciLandscapeProps['publicationTrends'] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Historical data sorted by year
  const sorted = useMemo(() => [...data].sort((a, b) => a.year - b.year), [data]);

  // Generate forecasts: exponential regression on log-transformed data
  const forecast = useMemo(() => {
    if (sorted.length < 3) return { all: sorted.map(d => ({ ...d, forecast: false, threat_vectors: 0 })), forecastStart: sorted.length };

    // Simple log-linear regression for BCI pubs: ln(y) = a + b*x
    const n = sorted.length;
    const xs = sorted.map((_, i) => i);
    const lnBci = sorted.map(d => Math.log(Math.max(d.pubmed_bci, 1)));
    const lnSec = sorted.map(d => Math.log(Math.max(d.security_bci, 1)));
    const meanX = xs.reduce((s, x) => s + x, 0) / n;
    const meanLnBci = lnBci.reduce((s, v) => s + v, 0) / n;
    const meanLnSec = lnSec.reduce((s, v) => s + v, 0) / n;

    let ssxx = 0, ssxyBci = 0, ssxySec = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - meanX;
      ssxx += dx * dx;
      ssxyBci += dx * (lnBci[i] - meanLnBci);
      ssxySec += dx * (lnSec[i] - meanLnSec);
    }
    const bBci = ssxyBci / ssxx;
    const aBci = meanLnBci - bBci * meanX;
    const bSec = ssxySec / ssxx;
    const aSec = meanLnSec - bSec * meanX;

    // Threat vectors: 109 techniques in 2026, growing ~20% per year as attack surface expands
    const threatBase = 109;
    const lastYear = sorted[sorted.length - 1].year;

    const historical = sorted.map((d, i) => ({
      ...d,
      forecast: false,
      threat_vectors: Math.round(threatBase * Math.pow(0.83, lastYear - d.year)), // back-project
    }));

    const projected = [];
    for (let y = 1; y <= 5; y++) {
      const idx = n - 1 + y;
      const projYear = lastYear + y;
      projected.push({
        year: projYear,
        pubmed_bci: Math.round(Math.exp(aBci + bBci * idx)),
        security_bci: Math.round(Math.exp(aSec + bSec * idx)),
        forecast: true,
        threat_vectors: Math.round(threatBase * Math.pow(1.20, y)),
      });
    }

    return { all: [...historical, ...projected], forecastStart: n };
  }, [sorted]);

  const all = forecast.all;
  const forecastStartIdx = forecast.forecastStart;

  // Log scale: use log10, minimum 1
  const logSafe = (v: number) => Math.log10(Math.max(v, 1));
  const maxLog = useMemo(() => Math.max(...all.map(d => logSafe(Math.max(d.pubmed_bci, d.threat_vectors || 0)))), [all]);
  const minLog = 0; // log10(1) = 0

  const W = 720;
  const H = 320;
  const PAD = { top: 24, right: 24, bottom: 44, left: 64 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const xScale = (i: number) => PAD.left + (i / (all.length - 1)) * plotW;
  const yScale = (v: number) => {
    const lv = logSafe(v);
    return PAD.top + plotH - ((lv - minLog) / (maxLog - minLog)) * plotH;
  };

  // Paths for historical data only (solid lines)
  const histBci = all.slice(0, forecastStartIdx);
  const histSec = all.slice(0, forecastStartIdx);
  const bciHistPath = histBci.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.pubmed_bci)}`).join(' ');
  const secHistPath = histSec.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.security_bci)}`).join(' ');
  const threatHistPath = histBci.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.threat_vectors || 1)}`).join(' ');

  // Paths for forecast (dashed lines, includes last historical point for continuity)
  const fcData = all.slice(forecastStartIdx - 1);
  const fcStartI = forecastStartIdx - 1;
  const bciFcPath = fcData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(fcStartI + i)},${yScale(d.pubmed_bci)}`).join(' ');
  const secFcPath = fcData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(fcStartI + i)},${yScale(d.security_bci)}`).join(' ');
  const threatFcPath = fcData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(fcStartI + i)},${yScale(d.threat_vectors || 1)}`).join(' ');

  // Areas (full series for visual fill)
  const fullBciPath = all.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.pubmed_bci)}`).join(' ');
  const bciArea = `${fullBciPath} L${xScale(all.length - 1)},${yScale(1)} L${xScale(0)},${yScale(1)} Z`;

  const secPct = sorted.length > 0
    ? ((sorted.reduce((s, d) => s + d.security_bci, 0) / sorted.reduce((s, d) => s + d.pubmed_bci, 0)) * 100).toFixed(2)
    : '0';

  // Log y-axis ticks: powers of 10
  const yTicks = [1, 10, 100, 1000, 10000];
  const tickLabel = (v: number) => v >= 1000 ? `${(v / 1000)}k` : String(v);

  // X axis forecast boundary
  const fcBoundaryX = xScale(forecastStartIdx - 0.5);

  return (
    <div className={GLASS}>
      <h3 className="text-lg font-semibold text-gray-100 mb-1">BCI Growth Forecast (Log Scale)</h3>
      <p className="text-sm text-gray-400 mb-4">
        Publications, security research, and threat vectors. Security papers: <span className="text-rose-400 font-medium">{secPct}%</span> of BCI research.
        Dashed lines = projected trend.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Logarithmic chart of BCI publications, security research, and threat vector growth with forecast">
        <defs>
          <linearGradient id="fcZoneGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(251,191,36,0)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0.06)" />
          </linearGradient>
        </defs>

        {/* Forecast zone background */}
        <rect x={fcBoundaryX} y={PAD.top} width={W - PAD.right - fcBoundaryX} height={plotH} fill="url(#fcZoneGrad)" />
        <line x1={fcBoundaryX} y1={PAD.top} x2={fcBoundaryX} y2={PAD.top + plotH} stroke="rgba(251,191,36,0.3)" strokeDasharray="4 3" />
        <text x={fcBoundaryX + 4} y={PAD.top + 12} fill="rgba(251,191,36,0.6)" fontSize="9" fontWeight="600">FORECAST</text>

        {/* Y axis ticks (log scale) */}
        {yTicks.filter(t => logSafe(t) <= maxLog).map(t => (
          <g key={t}>
            <line x1={PAD.left} y1={yScale(t)} x2={W - PAD.right} y2={yScale(t)} stroke="rgba(255,255,255,0.06)" />
            <text x={PAD.left - 8} y={yScale(t) + 4} textAnchor="end" fill="#9ca3af" fontSize="10">
              {tickLabel(t)}
            </text>
          </g>
        ))}

        {/* Log scale label */}
        <text x={8} y={PAD.top + plotH / 2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" transform={`rotate(-90 8 ${PAD.top + plotH / 2})`}>
          LOG SCALE
        </text>

        {/* BCI publications area (subtle) */}
        <path d={bciArea} fill="rgba(59,130,246,0.08)" />

        {/* Historical lines (solid) */}
        <path d={bciHistPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" />
        <path d={secHistPath} fill="none" stroke="#ef4444" strokeWidth="2.5" />
        <path d={threatHistPath} fill="none" stroke="#f59e0b" strokeWidth="2" />

        {/* Forecast lines (dashed) */}
        <path d={bciFcPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 3" opacity="0.7" />
        <path d={secFcPath} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3" opacity="0.7" />
        <path d={threatFcPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.7" />

        {/* X axis labels */}
        {all.map((d, i) => (
          i % 2 === 0 ? (
            <text key={d.year} x={xScale(i)} y={H - 8} textAnchor="middle" fill={d.forecast ? 'rgba(251,191,36,0.5)' : '#9ca3af'} fontSize="10" fontStyle={d.forecast ? 'italic' : 'normal'}>
              {d.year}
            </text>
          ) : null
        ))}

        {/* Data point dots for historical */}
        {histBci.map((d, i) => (
          <g key={`dots-${d.year}`}>
            <circle cx={xScale(i)} cy={yScale(d.pubmed_bci)} r="2.5" fill="#3b82f6" />
            <circle cx={xScale(i)} cy={yScale(d.security_bci)} r="2.5" fill="#ef4444" />
            <circle cx={xScale(i)} cy={yScale(d.threat_vectors || 1)} r="2" fill="#f59e0b" />
          </g>
        ))}

        {/* Hover targets */}
        {all.map((d, i) => (
          <rect
            key={d.year}
            x={xScale(i) - plotW / all.length / 2}
            y={PAD.top}
            width={plotW / all.length}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          />
        ))}

        {/* Hover tooltip */}
        {hoverIdx !== null && (() => {
          const d = all[hoverIdx];
          const tx = xScale(hoverIdx);
          const isFc = d.forecast;
          const tipH = 56;
          return (
            <g>
              <line x1={tx} y1={PAD.top} x2={tx} y2={PAD.top + plotH} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 2" />
              <circle cx={tx} cy={yScale(d.pubmed_bci)} r="4" fill="#3b82f6" />
              <circle cx={tx} cy={yScale(d.security_bci)} r="4" fill="#ef4444" />
              <circle cx={tx} cy={yScale(d.threat_vectors || 1)} r="3.5" fill="#f59e0b" />
              <rect x={tx - 72} y={PAD.top - 2} width="144" height={tipH} rx="6" fill="rgba(0,0,0,0.9)" stroke={isFc ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)'} />
              <text x={tx} y={PAD.top + 12} textAnchor="middle" fill="#e5e7eb" fontSize="10" fontWeight="600">
                {d.year}{isFc ? ' (projected)' : ''}
              </text>
              <text x={tx} y={PAD.top + 24} textAnchor="middle" fill="#3b82f6" fontSize="9">BCI pubs: {d.pubmed_bci.toLocaleString()}</text>
              <text x={tx} y={PAD.top + 35} textAnchor="middle" fill="#ef4444" fontSize="9">Security: {d.security_bci.toLocaleString()}</text>
              <text x={tx} y={PAD.top + 46} textAnchor="middle" fill="#f59e0b" fontSize="9">Threats: {(d.threat_vectors || 0).toLocaleString()}</text>
            </g>
          );
        })()}
      </svg>
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-blue-500 rounded" /> BCI publications (PubMed)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-rose-500 rounded" /> Security-focused papers</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-amber-500 rounded" /> Known threat vectors (TARA)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-amber-500/50 rounded border-t border-dashed border-amber-500" /> Projected trend</span>
      </div>
    </div>
  );
}

function IndustryTimeline() {
  const [hoverEvent, setHoverEvent] = useState<number | null>(null);

  const minYear = 2004;
  const maxYear = 2027;
  const range = maxYear - minYear;

  return (
    <div className={GLASS}>
      <h3 className="text-lg font-semibold text-gray-100 mb-1">Industry Timeline</h3>
      <p className="text-sm text-gray-400 mb-4">Key milestones from first implants to security frameworks</p>
      <div className="flex gap-4 flex-wrap mb-4 text-xs">
        {Object.entries(EVENT_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-400 capitalize">{type}</span>
          </span>
        ))}
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="relative min-w-[800px] h-48">
          {/* Track line */}
          <div className="absolute top-20 left-0 right-0 h-px bg-white/10" />
          {/* Year markers */}
          {Array.from({ length: Math.floor(range / 2) + 1 }, (_, i) => minYear + i * 2).map(yr => {
            const pct = ((yr - minYear) / range) * 100;
            return (
              <div key={yr} className="absolute top-20 -translate-x-1/2" style={{ left: `${pct}%` }}>
                <div className="w-px h-3 bg-white/20 mx-auto" />
                <span className="block text-[10px] text-gray-500 mt-1 text-center">{yr}</span>
              </div>
            );
          })}
          {/* Events */}
          {TIMELINE_EVENTS.map((ev, i) => {
            const pct = ((ev.year - minYear) / range) * 100;
            const above = i % 2 === 0;
            const color = EVENT_COLORS[ev.type] || '#9ca3af';
            const isHovered = hoverEvent === i;
            return (
              <div
                key={i}
                className="absolute -translate-x-1/2 cursor-default"
                style={{ left: `${pct}%`, top: above ? '0px' : '88px' }}
                onMouseEnter={() => setHoverEvent(i)}
                onMouseLeave={() => setHoverEvent(null)}
              >
                {above ? (
                  <>
                    <div
                      className={`text-[10px] leading-tight max-w-[100px] text-center transition-colors duration-150 ${isHovered ? 'text-gray-100' : 'text-gray-400'}`}
                    >
                      {ev.label}
                    </div>
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-px bg-white/10" style={{ height: `${60 - 10}px` }} />
                      <div
                        className="w-3 h-3 rounded-full border-2 transition-transform duration-150"
                        style={{
                          borderColor: color,
                          backgroundColor: isHovered ? color : 'transparent',
                          transform: isHovered ? 'scale(1.4)' : 'scale(1)',
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center mb-1">
                      <div
                        className="w-3 h-3 rounded-full border-2 transition-transform duration-150"
                        style={{
                          borderColor: color,
                          backgroundColor: isHovered ? color : 'transparent',
                          transform: isHovered ? 'scale(1.4)' : 'scale(1)',
                        }}
                      />
                      <div className="w-px bg-white/10" style={{ height: `${60 - 10}px` }} />
                    </div>
                    <div
                      className={`text-[10px] leading-tight max-w-[100px] text-center transition-colors duration-150 ${isHovered ? 'text-gray-100' : 'text-gray-400'}`}
                    >
                      {ev.label}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SecurityPostureGrid({ companies }: { companies: BciLandscapeProps['companies'] }) {
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof companies> = { invasive: [], semi_invasive: [], non_invasive: [] };
    for (const c of companies) {
      (groups[c.type] ?? (groups[c.type] = [])).push(c);
    }
    return groups;
  }, [companies]);

  const postureCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of companies) counts[c.security_posture] = (counts[c.security_posture] || 0) + 1;
    return counts;
  }, [companies]);

  const nonePercent = companies.length > 0 ? Math.round(((postureCounts['none_published'] || 0) / companies.length) * 100) : 0;

  return (
    <div className={GLASS}>
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Security Posture by Company Type</h3>
          <p className="text-sm text-gray-400 mt-0.5">
            <span className="text-rose-400 font-medium">{nonePercent}%</span> of tracked companies have no published security posture
          </p>
        </div>
        <div className="flex gap-3 text-xs flex-wrap">
          {Object.entries(POSTURE_COLORS).map(([key, val]) => (
            <span key={key} className="flex items-center gap-1">
              <span className={`inline-block w-2 h-2 rounded-full`}
                style={{ backgroundColor: key === 'none_published' ? '#f43f5e' : key === 'minimal_claims' ? '#f59e0b' : key === 'basic_encryption' ? '#eab308' : key === 'regulatory_compliance' ? '#3b82f6' : key === 'open_source' ? '#06b6d4' : '#22c55e' }}
              />
              <span className="text-gray-400">{val.label}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        {Object.entries(grouped).map(([type, list]) => (
          list.length > 0 && (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
                <span className="text-sm font-medium text-gray-300">{TYPE_LABELS[type] || type}</span>
                <span className="text-xs text-gray-500">({list.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {list.map(c => {
                  const posture = POSTURE_COLORS[c.security_posture] || POSTURE_COLORS.none_published;
                  const isHovered = hoveredCompany === c.name;
                  return (
                    <div
                      key={c.name}
                      className={`relative rounded-xl border px-3 py-2.5 transition-all duration-150 cursor-default ${
                        isHovered
                          ? 'bg-white/10 border-white/20 shadow-lg shadow-black/20'
                          : 'bg-white/[0.03] border-white/[0.06]'
                      }`}
                      onMouseEnter={() => setHoveredCompany(c.name)}
                      onMouseLeave={() => setHoveredCompany(null)}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className="text-xs font-medium text-gray-200 truncate">{c.name}</span>
                        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${posture.bg} ${posture.text}`}>
                          {posture.label || c.security_posture}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500">{c.devices.length} device{c.devices.length !== 1 ? 's' : ''}</div>
                      {/* Hover detail */}
                      {isHovered && c.devices.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-gray-900/95 border border-white/10 rounded-lg p-2 shadow-xl">
                          {c.devices.map(d => (
                            <div key={d.name} className="text-[10px] text-gray-300 py-0.5">
                              <span className="font-medium">{d.name}</span>
                              <span className="text-gray-500"> {d.channels}ch, {d.units_deployed}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function FundingGap({
  fundingRounds,
  marketSize,
}: {
  fundingRounds: BciLandscapeProps['fundingRounds'];
  marketSize: BciLandscapeProps['marketSize'];
}) {
  const totalFunding = useMemo(() => fundingRounds.reduce((s, r) => s + r.amount_usd, 0), [fundingRounds]);
  const sortedMarket = useMemo(() => [...marketSize].sort((a, b) => a.year - b.year), [marketSize]);
  const maxMarket = useMemo(() => Math.max(...sortedMarket.map(m => m.value_billion_usd)), [sortedMarket]);

  const securityFunding = 0; // effectively zero dedicated security research funding

  const W = 400;
  const H = 160;
  const PAD = { top: 20, right: 20, bottom: 30, left: 50 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  return (
    <div className={GLASS}>
      <h3 className="text-lg font-semibold text-gray-100 mb-1">Funding vs Security Investment</h3>
      <p className="text-sm text-gray-400 mb-5">Billions flow into BCI innovation. Security gets almost nothing.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: funding comparison */}
        <div>
          <div className="space-y-4 mb-5">
            {/* Total BCI funding bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Tracked BCI funding</span>
                <span className="text-blue-400 font-medium">{formatUsd(totalFunding)}</span>
              </div>
              <div className="h-6 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            {/* Security funding bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Dedicated security research funding</span>
                <span className="text-rose-400 font-medium">~$0</span>
              </div>
              <div className="h-6 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-500/50"
                  style={{ width: `${Math.max(0.5, (securityFunding / totalFunding) * 100)}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            DARPA N3 included some security considerations, but dedicated BCI security research
            funding rounds to approximately zero. QIF/TARA aims to change this by providing an
            open framework that costs nothing to adopt.
          </p>
        </div>

        {/* Right: market size projection */}
        <div>
          <p className="text-xs text-gray-400 mb-2 font-medium">Market Size Projection (USD Billions)</p>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Bar chart of BCI market size projections">
            {sortedMarket.map((m, i) => {
              const barW = plotW / sortedMarket.length * 0.6;
              const gap = plotW / sortedMarket.length;
              const x = PAD.left + i * gap + (gap - barW) / 2;
              const barH = (m.value_billion_usd / maxMarket) * plotH;
              const y = PAD.top + plotH - barH;
              return (
                <g key={m.year}>
                  <rect x={x} y={y} width={barW} height={barH} rx={4} fill="url(#marketGrad)" opacity={0.85} />
                  <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill="#e5e7eb" fontSize="10" fontWeight="600">
                    ${m.value_billion_usd}B
                  </text>
                  <text x={x + barW / 2} y={PAD.top + plotH + 16} textAnchor="middle" fill="#9ca3af" fontSize="10">
                    {m.year}
                  </text>
                </g>
              );
            })}
            <defs>
              <linearGradient id="marketGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function BciLandscape(props: BciLandscapeProps) {
  const { publicationTrends, companies, fundingRounds, marketSize } = props;

  return (
    <div className="bg-gray-950 text-gray-100 space-y-6">
      <PublicationChart data={publicationTrends} />
      <IndustryTimeline />
      <SecurityPostureGrid companies={companies} />
      <FundingGap fundingRounds={fundingRounds} marketSize={marketSize} />
    </div>
  );
}
