/**
 * ThreatMatrix — MITRE ATT&CK-style interactive matrix for QIF TARA.
 *
 * Rows: 11 hourglass bands (N7→S3), grouped by zone
 * Columns: 9 attack categories (SI, SE, DM, DS, PE, CR, CD, PS, EX)
 * Cells: severity-colored, clickable to explore techniques
 */

import { useState, useMemo, useCallback } from 'react';

/* ── Types ── */
interface Band {
  id: string;
  name: string;
  zone: string;
  color: string;
  description: string;
}

interface Technique {
  id: string;
  name: string;
  category: string;
  tactic: string;
  bands: string[];
  severity: string;
  status: string;
  description: string;
  bandsStr: string;
  niss: { score: number; severity: string; vector: string };
  tara: { dual_use: string; clinical?: { therapeutic_analog: string } | null } | null;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface ThreatMatrixProps {
  techniques: Technique[];
  categories: Category[];
  bands: Band[];
}

/* ── Constants ── */
const SEV_ORDER = ['critical', 'high', 'medium', 'low'] as const;

const SEV_COLORS: Record<string, { fill: string; text: string; glow: string }> = {
  critical: { fill: 'rgba(239, 68, 68, 0.55)', text: '#fca5a5', glow: 'rgba(239, 68, 68, 0.3)' },
  high:     { fill: 'rgba(245, 158, 11, 0.45)', text: '#fcd34d', glow: 'rgba(245, 158, 11, 0.2)' },
  medium:   { fill: 'rgba(234, 179, 8, 0.30)', text: '#fde68a', glow: 'rgba(234, 179, 8, 0.15)' },
  low:      { fill: 'rgba(148, 163, 184, 0.20)', text: '#cbd5e1', glow: 'rgba(148, 163, 184, 0.1)' },
};

const SEV_BADGE: Record<string, { bg: string; text: string }> = {
  critical: { bg: 'rgba(239, 68, 68, 0.18)', text: '#ef4444' },
  high:     { bg: 'rgba(245, 158, 11, 0.18)', text: '#f59e0b' },
  medium:   { bg: 'rgba(234, 179, 8, 0.18)', text: '#eab308' },
  low:      { bg: 'rgba(148, 163, 184, 0.18)', text: '#94a3b8' },
};

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  CONFIRMED:   { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444' },
  DEMONSTRATED: { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b' },
  THEORETICAL: { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8' },
  EMERGING:    { bg: 'rgba(139, 92, 246, 0.12)', text: '#8b5cf6' },
};

const ZONE_STYLES: Record<string, { label: string; accent: string; bg: string }> = {
  neural:    { label: 'Neural Zone',    accent: '#22c55e', bg: 'rgba(34, 197, 94, 0.04)' },
  interface: { label: 'Interface Zone', accent: '#f59e0b', bg: 'rgba(245, 158, 11, 0.06)' },
  synthetic: { label: 'Synthetic Zone', accent: '#3b82f6', bg: 'rgba(59, 130, 246, 0.04)' },
};

/* ── Component ── */
export default function ThreatMatrix({ techniques, categories, bands }: ThreatMatrixProps) {
  const [selectedCell, setSelectedCell] = useState<{ band: string; cat: string } | null>(null);
  const [sevFilter, setSevFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [hoveredCell, setHoveredCell] = useState<{ band: string; cat: string } | null>(null);

  // Pre-compute the matrix data
  const matrix = useMemo(() => {
    const grid: Record<string, Record<string, Technique[]>> = {};
    for (const band of bands) {
      grid[band.id] = {};
      for (const cat of categories) {
        grid[band.id][cat.id] = [];
      }
    }
    for (const t of techniques) {
      for (const bandId of t.bands) {
        if (grid[bandId]) {
          const catId = t.category;
          if (grid[bandId][catId]) {
            grid[bandId][catId].push(t);
          }
        }
      }
    }
    return grid;
  }, [techniques, bands, categories]);

  // Apply filters to get visible techniques
  const filteredTechniques = useMemo(() => {
    let filtered = techniques;
    if (sevFilter) filtered = filtered.filter(t => t.severity === sevFilter);
    if (statusFilter) filtered = filtered.filter(t => t.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    return new Set(filtered.map(t => t.id));
  }, [techniques, sevFilter, statusFilter, search]);

  // Get filtered cell data
  const getCellData = useCallback((bandId: string, catId: string) => {
    const all = matrix[bandId]?.[catId] ?? [];
    const visible = all.filter(t => filteredTechniques.has(t.id));
    let maxSev: string | null = null;
    for (const s of SEV_ORDER) {
      if (visible.some(t => t.severity === s)) { maxSev = s; break; }
    }
    return { count: visible.length, total: all.length, maxSev, techniques: visible };
  }, [matrix, filteredTechniques]);

  // Selected cell techniques
  const selectedTechniques = useMemo(() => {
    if (!selectedCell) return [];
    return getCellData(selectedCell.band, selectedCell.cat).techniques;
  }, [selectedCell, getCellData]);

  // Stats
  const stats = useMemo(() => {
    const visible = techniques.filter(t => filteredTechniques.has(t.id));
    const bySev: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const t of visible) bySev[t.severity] = (bySev[t.severity] ?? 0) + 1;
    return { total: visible.length, bySev };
  }, [techniques, filteredTechniques]);

  // Group bands by zone
  const bandsByZone = useMemo(() => {
    const zones: { zone: string; bands: Band[] }[] = [];
    let currentZone = '';
    for (const band of bands) {
      if (band.zone !== currentZone) {
        currentZone = band.zone;
        zones.push({ zone: band.zone, bands: [] });
      }
      zones[zones.length - 1].bands.push(band);
    }
    return zones;
  }, [bands]);

  const handleCellClick = (bandId: string, catId: string) => {
    const data = getCellData(bandId, catId);
    if (data.count === 0) return;
    if (selectedCell?.band === bandId && selectedCell?.cat === catId) {
      setSelectedCell(null);
    } else {
      setSelectedCell({ band: bandId, cat: catId });
    }
  };

  const clearFilters = () => {
    setSevFilter(null);
    setStatusFilter(null);
    setSearch('');
    setSelectedCell(null);
  };

  const hasFilters = sevFilter || statusFilter || search;

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui)', color: 'var(--color-text-primary, #e2e8f0)' }}>
      {/* Filter Bar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center',
        marginBottom: '1rem', padding: '0.75rem 1rem',
        background: 'var(--color-bg-secondary, rgba(15, 20, 35, 0.6))',
        borderRadius: '0.75rem', border: '1px solid var(--color-border, rgba(100, 140, 200, 0.1))',
      }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search techniques..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '0.375rem 0.75rem', fontSize: '0.8125rem',
            fontFamily: 'var(--font-mono, monospace)',
            background: 'rgba(30, 40, 60, 0.8)',
            border: '1px solid rgba(100, 140, 200, 0.2)',
            borderRadius: '0.375rem', color: '#e2e8f0',
            width: '180px', outline: 'none',
          }}
        />

        {/* Severity filter pills */}
        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
          {SEV_ORDER.map(s => (
            <button
              key={s}
              onClick={() => setSevFilter(sevFilter === s ? null : s)}
              style={{
                padding: '0.25rem 0.5rem', fontSize: '0.6875rem', fontWeight: 600,
                borderRadius: '0.25rem', cursor: 'pointer', textTransform: 'capitalize',
                border: `1px solid ${sevFilter === s ? SEV_BADGE[s].text : 'rgba(100, 140, 200, 0.15)'}`,
                background: sevFilter === s ? SEV_BADGE[s].bg : 'transparent',
                color: sevFilter === s ? SEV_BADGE[s].text : 'rgba(200, 210, 240, 0.5)',
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
          {(['CONFIRMED', 'DEMONSTRATED', 'THEORETICAL', 'EMERGING'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? null : s)}
              style={{
                padding: '0.25rem 0.5rem', fontSize: '0.6875rem', fontWeight: 600,
                borderRadius: '0.25rem', cursor: 'pointer',
                border: `1px solid ${statusFilter === s ? STATUS_BADGE[s].text : 'rgba(100, 140, 200, 0.15)'}`,
                background: statusFilter === s ? STATUS_BADGE[s].bg : 'transparent',
                color: statusFilter === s ? STATUS_BADGE[s].text : 'rgba(200, 210, 240, 0.5)',
                transition: 'all 0.15s',
              }}
            >
              {s.slice(0, 4)}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{
              marginLeft: 'auto', padding: '0.25rem 0.5rem',
              fontSize: '0.6875rem', fontWeight: 600,
              borderRadius: '0.25rem', cursor: 'pointer',
              border: '1px solid rgba(100, 140, 200, 0.2)',
              background: 'transparent', color: 'rgba(200, 210, 240, 0.5)',
            }}
          >
            Clear
          </button>
        )}

        {/* Stats */}
        <div style={{
          marginLeft: hasFilters ? '0.5rem' : 'auto',
          display: 'flex', gap: '0.75rem', fontSize: '0.75rem',
          fontFamily: 'var(--font-mono, monospace)',
          color: 'rgba(200, 210, 240, 0.5)',
        }}>
          <span>{stats.total} techniques</span>
          {Object.entries(stats.bySev).map(([s, n]) => n > 0 && (
            <span key={s} style={{ color: SEV_BADGE[s]?.text }}>{n} {s}</span>
          ))}
        </div>
      </div>

      {/* Matrix */}
      <div style={{ overflowX: 'auto', marginBottom: selectedCell ? '0' : '1rem' }}>
        <table style={{
          width: '100%', borderCollapse: 'separate', borderSpacing: '2px',
          tableLayout: 'fixed', minWidth: '900px',
        }}>
          {/* Column headers */}
          <thead>
            <tr>
              <th style={{
                width: '140px', padding: '0.5rem', textAlign: 'left',
                fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'rgba(100, 140, 200, 0.5)',
                verticalAlign: 'bottom',
              }}>
                Band / Category
              </th>
              {categories.map(cat => (
                <th key={cat.id} style={{
                  padding: '0.5rem 0.25rem', textAlign: 'center',
                  verticalAlign: 'bottom',
                }}>
                  <div style={{
                    fontSize: '0.6875rem', fontWeight: 700,
                    fontFamily: 'var(--font-mono, monospace)',
                    color: 'var(--color-text-primary, #e2e8f0)',
                    marginBottom: '0.125rem',
                  }}>
                    {cat.id}
                  </div>
                  <div style={{
                    fontSize: '0.5625rem', color: 'rgba(200, 210, 240, 0.4)',
                    lineHeight: 1.2, maxWidth: '80px', margin: '0 auto',
                  }}>
                    {cat.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bandsByZone.map(({ zone, bands: zoneBands }) => (
              <>
                {/* Zone header row */}
                <tr key={`zone-${zone}`}>
                  <td
                    colSpan={categories.length + 1}
                    style={{
                      padding: '0.375rem 0.5rem', fontSize: '0.5625rem',
                      fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: ZONE_STYLES[zone]?.accent ?? '#94a3b8',
                      background: ZONE_STYLES[zone]?.bg ?? 'transparent',
                      borderLeft: `2px solid ${ZONE_STYLES[zone]?.accent ?? '#94a3b8'}`,
                    }}
                  >
                    {ZONE_STYLES[zone]?.label ?? zone}
                  </td>
                </tr>
                {/* Band rows */}
                {zoneBands.map(band => (
                  <tr key={band.id}>
                    {/* Band label */}
                    <td style={{
                      padding: '0.375rem 0.5rem',
                      borderLeft: `2px solid ${band.color}`,
                      background: 'var(--color-bg-secondary, rgba(15, 20, 35, 0.3))',
                    }}>
                      <div style={{
                        fontSize: '0.75rem', fontWeight: 700,
                        fontFamily: 'var(--font-mono, monospace)',
                        color: band.color,
                      }}>
                        {band.id}
                      </div>
                      <div style={{
                        fontSize: '0.5625rem', color: 'rgba(200, 210, 240, 0.4)',
                        lineHeight: 1.2, marginTop: '0.125rem',
                      }}>
                        {band.name}
                      </div>
                    </td>
                    {/* Cells */}
                    {categories.map(cat => {
                      const cell = getCellData(band.id, cat.id);
                      const isSelected = selectedCell?.band === band.id && selectedCell?.cat === cat.id;
                      const isHovered = hoveredCell?.band === band.id && hoveredCell?.cat === cat.id;
                      const isEmpty = cell.count === 0;

                      return (
                        <td
                          key={cat.id}
                          onClick={() => handleCellClick(band.id, cat.id)}
                          onMouseEnter={() => !isEmpty && setHoveredCell({ band: band.id, cat: cat.id })}
                          onMouseLeave={() => setHoveredCell(null)}
                          style={{
                            padding: 0,
                            textAlign: 'center',
                            cursor: isEmpty ? 'default' : 'pointer',
                            position: 'relative',
                          }}
                        >
                          <div style={{
                            padding: '0.5rem 0.25rem',
                            borderRadius: '0.375rem',
                            background: isEmpty
                              ? 'rgba(30, 40, 60, 0.15)'
                              : cell.maxSev
                                ? SEV_COLORS[cell.maxSev].fill
                                : 'rgba(30, 40, 60, 0.3)',
                            border: isSelected
                              ? `2px solid ${cell.maxSev ? SEV_COLORS[cell.maxSev].text : '#60a5fa'}`
                              : '2px solid transparent',
                            boxShadow: isHovered && !isEmpty
                              ? `0 0 12px ${cell.maxSev ? SEV_COLORS[cell.maxSev].glow : 'transparent'}`
                              : 'none',
                            transition: 'all 0.15s ease',
                            transform: isHovered && !isEmpty ? 'scale(1.05)' : 'scale(1)',
                            minHeight: '36px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            {!isEmpty && (
                              <>
                                <div style={{
                                  fontSize: '0.875rem', fontWeight: 700,
                                  fontFamily: 'var(--font-mono, monospace)',
                                  color: cell.maxSev ? SEV_COLORS[cell.maxSev].text : '#94a3b8',
                                  lineHeight: 1,
                                }}>
                                  {cell.count}
                                </div>
                                {cell.count !== cell.total && (
                                  <div style={{
                                    fontSize: '0.5rem', color: 'rgba(200, 210, 240, 0.3)',
                                    marginTop: '0.125rem',
                                  }}>
                                    /{cell.total}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded Cell Detail Panel */}
      {selectedCell && selectedTechniques.length > 0 && (
        <div style={{
          marginTop: '0.5rem', marginBottom: '1rem',
          padding: '1rem 1.25rem',
          background: 'var(--color-bg-secondary, rgba(15, 20, 35, 0.8))',
          borderRadius: '0.75rem',
          border: '1px solid var(--color-border, rgba(100, 140, 200, 0.15))',
        }}>
          {/* Panel header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.75rem', fontWeight: 700,
                fontFamily: 'var(--font-mono, monospace)',
                color: bands.find(b => b.id === selectedCell.band)?.color ?? '#60a5fa',
              }}>
                {selectedCell.band}
              </span>
              <span style={{ fontSize: '0.625rem', color: 'rgba(200, 210, 240, 0.3)' }}>&times;</span>
              <span style={{
                fontSize: '0.75rem', fontWeight: 700,
                fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--color-accent-secondary, #06b6d4)',
              }}>
                {selectedCell.cat}
              </span>
              <span style={{
                fontSize: '0.6875rem', color: 'rgba(200, 210, 240, 0.5)',
              }}>
                &mdash; {categories.find(c => c.id === selectedCell.cat)?.name}
              </span>
              <span style={{
                fontSize: '0.625rem', fontFamily: 'var(--font-mono, monospace)',
                color: 'rgba(200, 210, 240, 0.35)',
              }}>
                ({selectedTechniques.length} technique{selectedTechniques.length !== 1 ? 's' : ''})
              </span>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              style={{
                padding: '0.25rem 0.5rem', fontSize: '0.6875rem',
                borderRadius: '0.25rem', cursor: 'pointer',
                border: '1px solid rgba(100, 140, 200, 0.2)',
                background: 'transparent', color: 'rgba(200, 210, 240, 0.5)',
              }}
            >
              Close
            </button>
          </div>

          {/* Technique cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.5rem',
          }}>
            {selectedTechniques.map(t => (
              <a
                key={t.id}
                href={`/atlas/tara/${t.id}/`}
                style={{
                  display: 'block', textDecoration: 'none', color: 'inherit',
                  padding: '0.75rem', borderRadius: '0.5rem',
                  background: 'rgba(30, 40, 60, 0.5)',
                  border: `1px solid ${SEV_BADGE[t.severity]?.text ?? '#94a3b8'}20`,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${SEV_BADGE[t.severity]?.text ?? '#94a3b8'}60`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${SEV_BADGE[t.severity]?.text ?? '#94a3b8'}20`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                {/* Top row: ID + badges */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  marginBottom: '0.375rem', flexWrap: 'wrap',
                }}>
                  <span style={{
                    fontSize: '0.6875rem', fontWeight: 700,
                    fontFamily: 'var(--font-mono, monospace)',
                    color: 'var(--color-accent-secondary, #06b6d4)',
                  }}>
                    {t.id}
                  </span>
                  <span style={{
                    fontSize: '0.5625rem', fontWeight: 600,
                    padding: '0.0625rem 0.375rem', borderRadius: '9999px',
                    textTransform: 'capitalize',
                    background: SEV_BADGE[t.severity]?.bg ?? 'rgba(148, 163, 184, 0.18)',
                    color: SEV_BADGE[t.severity]?.text ?? '#94a3b8',
                  }}>
                    {t.severity}
                  </span>
                  <span style={{
                    fontSize: '0.5625rem', fontWeight: 600,
                    padding: '0.0625rem 0.375rem', borderRadius: '9999px',
                    background: STATUS_BADGE[t.status]?.bg ?? 'rgba(148, 163, 184, 0.12)',
                    color: STATUS_BADGE[t.status]?.text ?? '#94a3b8',
                  }}>
                    {t.status}
                  </span>
                  {t.niss.score > 0 && (
                    <span style={{
                      fontSize: '0.5625rem', fontWeight: 700,
                      fontFamily: 'var(--font-mono, monospace)',
                      marginLeft: 'auto',
                      color: SEV_BADGE[t.niss.severity]?.text ?? '#94a3b8',
                    }}>
                      NISS {t.niss.score.toFixed(1)}
                    </span>
                  )}
                </div>
                {/* Name */}
                <div style={{
                  fontSize: '0.8125rem', fontWeight: 600,
                  color: 'var(--color-text-primary, #e2e8f0)',
                  marginBottom: '0.25rem', lineHeight: 1.3,
                }}>
                  {t.name}
                </div>
                {/* Description (truncated) */}
                <div style={{
                  fontSize: '0.6875rem', color: 'rgba(200, 210, 240, 0.5)',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {t.description}
                </div>
                {/* Bottom row: dual-use + bands */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  marginTop: '0.375rem', flexWrap: 'wrap',
                }}>
                  {t.tara?.dual_use && t.tara.dual_use !== 'silicon_only' && (
                    <span style={{
                      fontSize: '0.5rem', fontWeight: 600,
                      padding: '0.0625rem 0.25rem', borderRadius: '0.125rem',
                      background: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      Dual-use
                    </span>
                  )}
                  <span style={{
                    fontSize: '0.5625rem', fontFamily: 'var(--font-mono, monospace)',
                    color: 'rgba(200, 210, 240, 0.3)', marginLeft: 'auto',
                  }}>
                    {t.bandsStr}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center',
        padding: '0.625rem 0.75rem', fontSize: '0.6875rem',
        color: 'rgba(200, 210, 240, 0.4)',
      }}>
        <span style={{ fontWeight: 600, fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Severity:
        </span>
        {SEV_ORDER.map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{
              width: '12px', height: '12px', borderRadius: '0.125rem',
              background: SEV_COLORS[s].fill,
            }} />
            <span style={{ textTransform: 'capitalize', color: SEV_COLORS[s].text }}>{s}</span>
          </div>
        ))}
        <span style={{ color: 'rgba(200, 210, 240, 0.25)', marginLeft: '0.5rem' }}>
          Click any cell to explore techniques
        </span>
      </div>
    </div>
  );
}
