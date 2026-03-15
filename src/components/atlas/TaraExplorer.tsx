/**
 * TaraExplorer — unified search + faceted filtering for TARA techniques.
 * Compact, theme-compatible, no external dependencies beyond React.
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { ThreatVector, Severity, Status, CategoryId } from '../../lib/threat-data';
import { SEVERITY_COLORS, STATUS_COLORS, THREAT_CATEGORIES } from '../../lib/threat-data';
import { useLens } from '../hooks/useLens';

// ═══ Band groupings ═══

const BAND_GROUPS = [
  { zone: 'Neural', color: '#22c55e', bands: ['N7', 'N6', 'N5', 'N4', 'N3', 'N2', 'N1'] },
  { zone: 'Interface', color: '#f59e0b', bands: ['I0'] },
  { zone: 'Silicon', color: '#3b82f6', bands: ['S1', 'S2', 'S3'] },
] as const;

const ALL_BANDS = BAND_GROUPS.flatMap(g => g.bands);
const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];
const STATUSES: Status[] = ['CONFIRMED', 'DEMONSTRATED', 'EMERGING', 'THEORETICAL'];

// ═══ Helpers ═══

function toggle<T>(set: Set<T>, val: T): Set<T> {
  const next = new Set(set);
  next.has(val) ? next.delete(val) : next.add(val);
  return next;
}

function bandColor(band: string) {
  if (band.startsWith('N')) return '#22c55e';
  if (band === 'I0') return '#f59e0b';
  return '#3b82f6';
}

// ═══ Component ═══

interface Props { techniques: ThreatVector[] }

export default function TaraExplorer({ techniques }: Props) {
  const { lens } = useLens();
  const isClinical = lens === 'clinical';
  const [searchTerm, setSearchTerm] = useState('');
  const [selSeverity, setSelSeverity] = useState<Set<Severity>>(new Set());
  const [selStatus, setSelStatus] = useState<Set<Status>>(new Set());
  const [selBands, setSelBands] = useState<Set<string>>(new Set());
  const [selCategory, setSelCategory] = useState<Set<CategoryId>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounced search
  const handleSearch = useCallback((val: string) => {
    setSearchTerm(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 150);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Derive unique categories from data
  const categories = useMemo(() => {
    const seen = new Set<CategoryId>();
    for (const t of techniques) seen.add(t.category);
    return THREAT_CATEGORIES.filter(c => seen.has(c.id));
  }, [techniques]);

  const hasFilters = selSeverity.size > 0 || selStatus.size > 0 || selBands.size > 0 || selCategory.size > 0 || debouncedSearch.length > 0;

  const clearAll = useCallback(() => {
    setSelSeverity(new Set()); setSelStatus(new Set());
    setSelBands(new Set()); setSelCategory(new Set());
    setSearchTerm(''); setDebouncedSearch('');
  }, []);

  // Filter
  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return techniques.filter(t => {
      if (q && !t.name.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)
        && !t.tactic.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)
        && !t.nameClinical.toLowerCase().includes(q)) return false;
      if (selSeverity.size > 0 && !selSeverity.has(t.severity)) return false;
      if (selStatus.size > 0 && !selStatus.has(t.status)) return false;
      if (selBands.size > 0 && !t.bands.some(b => selBands.has(b))) return false;
      if (selCategory.size > 0 && !selCategory.has(t.category)) return false;
      return true;
    });
  }, [techniques, debouncedSearch, selSeverity, selStatus, selBands, selCategory]);

  return (
    <div style={{ color: 'var(--color-text-primary, #e2e8f0)' }}>
      {/* Search */}
      <input
        type="text"
        value={searchTerm}
        onChange={e => handleSearch(e.target.value)}
        placeholder="Search by name, ID, tactic, or description..."
        className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg mb-4 outline-none"
        style={{
          background: 'rgba(0,0,0,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'inherit',
        }}
      />

      {/* Filter chips */}
      <div className="mb-3">
        <span className="block mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Severity</span>
        <div className="flex flex-wrap gap-[0.3rem]">
          {SEVERITIES.map(s => (
            <button key={s} onClick={() => setSelSeverity(toggle(selSeverity, s))}
              className="px-2 py-[0.2rem] text-[11px] rounded-full cursor-pointer transition-all duration-[120ms] font-mono"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                background: selSeverity.has(s) ? SEVERITY_COLORS[s]?.bg : 'rgba(255,255,255,0.04)',
                borderColor: selSeverity.has(s) ? SEVERITY_COLORS[s]?.border : undefined,
                color: selSeverity.has(s) ? SEVERITY_COLORS[s]?.text : 'var(--color-text-muted, #94a3b8)',
              }}>{s}</button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <span className="block mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Status</span>
        <div className="flex flex-wrap gap-[0.3rem]">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setSelStatus(toggle(selStatus, s))}
              className="px-2 py-[0.2rem] text-[11px] rounded-full cursor-pointer transition-all duration-[120ms] font-mono"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                background: selStatus.has(s) ? STATUS_COLORS[s]?.bg : 'rgba(255,255,255,0.04)',
                borderColor: selStatus.has(s) ? 'rgba(255,255,255,0.2)' : undefined,
                color: selStatus.has(s) ? STATUS_COLORS[s]?.text : 'var(--color-text-muted, #94a3b8)',
              }}>{s}</button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <span className="block mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Bands</span>
        <div className="flex flex-wrap gap-[0.3rem]">
          {BAND_GROUPS.map(g => (
            <span key={g.zone} className="contents">
              {g.bands.map(b => (
                <button key={b} onClick={() => setSelBands(toggle(selBands, b))}
                  className="px-2 py-[0.2rem] text-[11px] rounded-full cursor-pointer transition-all duration-[120ms] font-mono"
                  style={{
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: selBands.has(b) ? `${g.color}22` : 'rgba(255,255,255,0.04)',
                    borderColor: selBands.has(b) ? `${g.color}55` : undefined,
                    color: selBands.has(b) ? g.color : 'var(--color-text-muted, #94a3b8)',
                  }}>{b}</button>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <span className="block mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Category</span>
        <div className="flex flex-wrap gap-[0.3rem]">
          {categories.map(c => (
            <button key={c.id} onClick={() => setSelCategory(toggle(selCategory, c.id))}
              className="px-2 py-[0.2rem] text-[11px] rounded-full cursor-pointer transition-all duration-[120ms] font-mono"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                background: selCategory.has(c.id) ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                borderColor: selCategory.has(c.id) ? 'rgba(59,130,246,0.4)' : undefined,
                color: selCategory.has(c.id) ? '#60a5fa' : 'var(--color-text-muted, #94a3b8)',
              }}>{c.id}</button>
          ))}
        </div>
      </div>

      {/* Results bar */}
      <div className="flex justify-between items-center py-2 text-[13px] mb-1" style={{ color: 'var(--color-text-muted, #94a3b8)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span>Showing <strong>{filtered.length}</strong> of <strong>{techniques.length}</strong> techniques</span>
        {hasFilters && <button onClick={clearAll} className="text-xs text-red-500 bg-transparent border-none cursor-pointer underline">Clear all filters</button>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['ID', isClinical ? 'Therapeutic Analog' : 'Technique', 'Severity', 'Status', 'NISS', 'Bands'].map(h => (
                <th key={h} className="px-2.5 py-2 text-left font-bold text-[10px] uppercase tracking-wide whitespace-nowrap"
                  style={{ color: 'var(--color-accent-primary, #60a5fa)', background: 'rgba(0,0,0,0.04)', borderBottom: '2px solid rgba(59,130,246,0.25)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <tr
                key={t.id}
                className="cursor-pointer transition-[background] duration-100 hover:!bg-blue-500/[0.08] odd:bg-transparent even:bg-white/[0.02]"
                onClick={() => { window.location.href = `/atlas/tara/${t.id}/`; }}
              >
                <td className="px-2.5 py-1.5 whitespace-nowrap max-w-56 overflow-hidden text-ellipsis font-mono text-xs" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{t.id}</td>
                <td className="px-2.5 py-1.5 whitespace-nowrap max-w-56 overflow-hidden text-ellipsis font-medium" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{isClinical ? t.nameClinical : t.name}</td>
                <td className="px-2.5 py-1.5 whitespace-nowrap max-w-56 overflow-hidden text-ellipsis" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="inline-block px-1.5 py-[0.1rem] rounded-full text-[10px] font-semibold tracking-[0.02em]"
                    style={{ background: SEVERITY_COLORS[t.severity]?.bg ?? '#333', color: SEVERITY_COLORS[t.severity]?.text ?? '#aaa' }}>
                    {t.severity}
                  </span>
                </td>
                <td className="px-2.5 py-1.5 whitespace-nowrap max-w-56 overflow-hidden text-ellipsis" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="inline-block px-1.5 py-[0.1rem] rounded-full text-[10px] font-semibold tracking-[0.02em]"
                    style={{ background: STATUS_COLORS[t.status]?.bg ?? '#333', color: STATUS_COLORS[t.status]?.text ?? '#aaa' }}>
                    {t.status}
                  </span>
                </td>
                <td className="px-2.5 py-1.5 whitespace-nowrap max-w-56 overflow-hidden text-ellipsis font-mono text-xs" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{t.niss.score.toFixed(1)}</td>
                <td className="px-2.5 py-1.5 whitespace-nowrap max-w-56 overflow-hidden text-ellipsis" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {t.bands.map(b => (
                    <span key={b} className="inline-block px-1 py-[0.05rem] rounded mr-[0.2rem] text-[10px] font-mono"
                      style={{ background: `${bandColor(b)}18`, color: bandColor(b) }}>{b}</span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--color-text-muted, #94a3b8)' }}>
            No techniques match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
