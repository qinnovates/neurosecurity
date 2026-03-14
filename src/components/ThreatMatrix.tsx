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

const SEV_COLORS: Record<string, { bg: string; bgStrong: string; text: string; border: string }> = {
  critical: { bg: 'rgba(239, 68, 68, 0.08)',  bgStrong: 'rgba(239, 68, 68, 0.14)', text: '#dc2626', border: 'rgba(239, 68, 68, 0.25)' },
  high:     { bg: 'rgba(245, 158, 11, 0.08)', bgStrong: 'rgba(245, 158, 11, 0.14)', text: '#d97706', border: 'rgba(245, 158, 11, 0.25)' },
  medium:   { bg: 'rgba(234, 179, 8, 0.06)',  bgStrong: 'rgba(234, 179, 8, 0.12)',  text: '#ca8a04', border: 'rgba(234, 179, 8, 0.2)' },
  low:      { bg: 'rgba(100, 116, 139, 0.06)', bgStrong: 'rgba(100, 116, 139, 0.12)', text: '#64748b', border: 'rgba(100, 116, 139, 0.15)' },
};

const SEV_BADGE: Record<string, { bg: string; text: string }> = {
  critical: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626' },
  high:     { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706' },
  medium:   { bg: 'rgba(234, 179, 8, 0.08)', text: '#ca8a04' },
  low:      { bg: 'rgba(100, 116, 139, 0.08)', text: '#64748b' },
};

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  CONFIRMED:    { bg: 'rgba(239, 68, 68, 0.08)', text: '#dc2626' },
  DEMONSTRATED: { bg: 'rgba(245, 158, 11, 0.08)', text: '#d97706' },
  THEORETICAL:  { bg: 'rgba(100, 116, 139, 0.08)', text: '#64748b' },
  EMERGING:     { bg: 'rgba(139, 92, 246, 0.08)', text: '#7c3aed' },
};

const ZONE_META: Record<string, { label: string; accent: string; bg: string }> = {
  neural:    { label: 'Neural Zone',    accent: '#16a34a', bg: 'rgba(22, 163, 74, 0.04)' },
  interface: { label: 'Interface Zone', accent: '#d97706', bg: 'rgba(217, 119, 6, 0.04)' },
  synthetic: { label: 'Synthetic Zone', accent: '#2563eb', bg: 'rgba(37, 99, 235, 0.04)' },
};

/* ── Component ── */
export default function ThreatMatrix({ techniques, categories, bands }: ThreatMatrixProps) {
  const [selectedCell, setSelectedCell] = useState<{ band: string; cat: string } | null>(null);
  const [sevFilter, setSevFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [hoveredCell, setHoveredCell] = useState<{ band: string; cat: string } | null>(null);

  const matrix = useMemo(() => {
    const grid: Record<string, Record<string, Technique[]>> = {};
    for (const band of bands) {
      grid[band.id] = {};
      for (const cat of categories) grid[band.id][cat.id] = [];
    }
    for (const t of techniques) {
      for (const bandId of t.bands) {
        if (grid[bandId]?.[t.category]) grid[bandId][t.category].push(t);
      }
    }
    return grid;
  }, [techniques, bands, categories]);

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

  const getCellData = useCallback((bandId: string, catId: string) => {
    const all = matrix[bandId]?.[catId] ?? [];
    const visible = all.filter(t => filteredTechniques.has(t.id));
    let maxSev: string | null = null;
    for (const s of SEV_ORDER) {
      if (visible.some(t => t.severity === s)) { maxSev = s; break; }
    }
    const avgNiss = visible.length > 0
      ? visible.reduce((sum, t) => sum + (t.niss?.score ?? 0), 0) / visible.length
      : 0;
    return { count: visible.length, total: all.length, maxSev, techniques: visible, avgNiss };
  }, [matrix, filteredTechniques]);

  const selectedTechniques = useMemo(() => {
    if (!selectedCell) return [];
    return getCellData(selectedCell.band, selectedCell.cat).techniques;
  }, [selectedCell, getCellData]);

  const stats = useMemo(() => {
    const visible = techniques.filter(t => filteredTechniques.has(t.id));
    const bySev: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const t of visible) bySev[t.severity] = (bySev[t.severity] ?? 0) + 1;
    return { total: visible.length, bySev };
  }, [techniques, filteredTechniques]);

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
    <div>
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center mb-4 px-4 py-3 rounded-xl" style={{
        background: 'var(--color-glass-bg)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--color-border)',
      }}>
        <input
          type="text"
          placeholder="Search techniques..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg outline-none"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            width: '180px',
          }}
        />

        {/* Severity pills */}
        <div className="flex gap-1 ml-2">
          {SEV_ORDER.map(s => (
            <button
              key={s}
              onClick={() => setSevFilter(sevFilter === s ? null : s)}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-md capitalize transition-all"
              style={{
                border: `1px solid ${sevFilter === s ? SEV_BADGE[s].text : 'var(--color-border)'}`,
                background: sevFilter === s ? SEV_BADGE[s].bg : 'transparent',
                color: sevFilter === s ? SEV_BADGE[s].text : 'var(--color-text-faint)',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Status pills */}
        <div className="flex gap-1 ml-2">
          {(['CONFIRMED', 'DEMONSTRATED', 'THEORETICAL', 'EMERGING'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? null : s)}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all"
              style={{
                border: `1px solid ${statusFilter === s ? STATUS_BADGE[s].text : 'var(--color-border)'}`,
                background: statusFilter === s ? STATUS_BADGE[s].bg : 'transparent',
                color: statusFilter === s ? STATUS_BADGE[s].text : 'var(--color-text-faint)',
              }}
            >
              {s.slice(0, 4)}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors"
            style={{
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-faint)',
            }}
          >
            Clear
          </button>
        )}

        {/* Stats */}
        <div className="flex gap-3 text-xs font-mono" style={{
          marginLeft: hasFilters ? '0.5rem' : 'auto',
          color: 'var(--color-text-faint)',
        }}>
          <span>{stats.total} techniques</span>
          {Object.entries(stats.bySev).map(([s, n]) => n > 0 && (
            <span key={s} style={{ color: SEV_BADGE[s]?.text }}>{n} {s}</span>
          ))}
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="overflow-x-auto rounded-xl" style={{
        border: '1px solid var(--color-border)',
        marginBottom: selectedCell ? 0 : '1rem',
      }}>
        <table style={{
          width: '100%', borderCollapse: 'collapse',
          tableLayout: 'fixed', minWidth: '900px',
        }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-surface)' }}>
              <th style={{
                width: '140px', padding: '0.625rem 0.75rem', textAlign: 'left',
                fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: 'var(--color-text-faint)',
                borderBottom: '1px solid var(--color-border)',
                position: 'sticky',
                left: 0,
                zIndex: 2,
                background: 'var(--color-bg-surface, #09090b)',
              }}>
                Band / Category
              </th>
              {categories.map(cat => (
                <th key={cat.id} style={{
                  padding: '0.625rem 0.25rem', textAlign: 'center',
                  borderBottom: '1px solid var(--color-border)',
                  borderLeft: '1px solid var(--color-border)',
                }}>
                  <div style={{
                    fontSize: '0.75rem', fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-primary)',
                  }}>
                    {cat.id}
                  </div>
                  <div style={{
                    fontSize: '0.5625rem', color: 'var(--color-text-faint)',
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
                {/* Zone divider */}
                <tr key={`zone-${zone}`}>
                  <td
                    colSpan={categories.length + 1}
                    style={{
                      padding: '0.5rem 0.75rem', fontSize: '0.625rem',
                      fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: ZONE_META[zone]?.accent ?? 'var(--color-text-faint)',
                      background: ZONE_META[zone]?.bg ?? 'transparent',
                      borderBottom: '1px solid var(--color-border)',
                      borderTop: '1px solid var(--color-border)',
                    }}
                  >
                    <span style={{
                      display: 'inline-block',
                      width: '3px', height: '12px',
                      borderRadius: '2px',
                      background: ZONE_META[zone]?.accent,
                      marginRight: '0.5rem',
                      verticalAlign: 'middle',
                    }} />
                    {ZONE_META[zone]?.label ?? zone}
                  </td>
                </tr>
                {/* Band rows */}
                {zoneBands.map(band => (
                  <tr key={band.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{
                      padding: '0.5rem 0.75rem',
                      borderRight: '1px solid var(--color-border)',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      background: 'var(--color-bg-deep, #09090b)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '3px', height: '20px',
                          borderRadius: '2px', flexShrink: 0,
                          background: band.color,
                        }} />
                        <div>
                          <div style={{
                            fontSize: '0.75rem', fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: band.color,
                          }}>
                            {band.id}
                          </div>
                          <div style={{
                            fontSize: '0.5625rem', color: 'var(--color-text-faint)',
                            lineHeight: 1.2,
                          }}>
                            {band.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    {categories.map(cat => {
                      const cell = getCellData(band.id, cat.id);
                      const isSelected = selectedCell?.band === band.id && selectedCell?.cat === cat.id;
                      const isHovered = hoveredCell?.band === band.id && hoveredCell?.cat === cat.id;
                      const isEmpty = cell.count === 0;
                      const sev = cell.maxSev ? SEV_COLORS[cell.maxSev] : null;

                      return (
                        <td
                          key={cat.id}
                          onClick={() => handleCellClick(band.id, cat.id)}
                          onMouseEnter={() => !isEmpty && setHoveredCell({ band: band.id, cat: cat.id })}
                          onMouseLeave={() => setHoveredCell(null)}
                          style={{
                            padding: '3px',
                            textAlign: 'center',
                            cursor: isEmpty ? 'default' : 'pointer',
                            borderLeft: '1px solid var(--color-border)',
                          }}
                        >
                          <div style={{
                            padding: '0.5rem 0.25rem',
                            borderRadius: '0.5rem',
                            minHeight: '40px',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            background: isEmpty
                              ? 'transparent'
                              : (isHovered || isSelected)
                                ? sev?.bgStrong ?? 'var(--color-bg-elevated)'
                                : sev?.bg ?? 'var(--color-bg-surface)',
                            border: isSelected
                              ? `2px solid ${sev?.text ?? 'var(--color-accent-primary)'}`
                              : '2px solid transparent',
                            boxShadow: isHovered && !isEmpty
                              ? `0 2px 8px ${sev?.border ?? 'transparent'}`
                              : 'none',
                            transition: 'all 0.15s ease',
                            transform: isHovered && !isEmpty ? 'scale(1.08)' : 'scale(1)',
                          }}>
                            {!isEmpty && (
                              <>
                                <div style={{
                                  fontSize: '0.9375rem', fontWeight: 700,
                                  fontFamily: 'var(--font-mono)',
                                  color: sev?.text ?? 'var(--color-text-faint)',
                                  lineHeight: 1,
                                }}>
                                  {cell.count}
                                </div>
                                {cell.avgNiss > 0 && (
                                  <div style={{
                                    fontSize: '0.5625rem', fontWeight: 600,
                                    fontFamily: 'var(--font-mono)',
                                    color: sev?.text ?? 'var(--color-text-faint)',
                                    marginTop: '2px', opacity: 0.7,
                                  }}>
                                    {cell.avgNiss.toFixed(1)}
                                  </div>
                                )}
                                {cell.count !== cell.total && (
                                  <div style={{
                                    fontSize: '0.5rem', color: 'var(--color-text-faint)',
                                    marginTop: '1px', opacity: 0.5,
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

      {/* Expanded Cell Detail */}
      {selectedCell && selectedTechniques.length > 0 && (
        <div className="rounded-xl mt-2 mb-4 p-5" style={{
          background: 'var(--color-glass-bg)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--color-border)',
        }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono" style={{
                color: bands.find(b => b.id === selectedCell.band)?.color,
              }}>
                {selectedCell.band}
              </span>
              <span style={{ color: 'var(--color-text-faint)', fontSize: '0.75rem' }}>/</span>
              <span className="text-sm font-bold font-mono" style={{ color: 'var(--color-accent-secondary)' }}>
                {selectedCell.cat}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {categories.find(c => c.id === selectedCell.cat)?.name}
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--color-text-faint)' }}>
                ({selectedTechniques.length})
              </span>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="px-3 py-1 text-xs font-medium rounded-lg transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-surface)',
                color: 'var(--color-text-muted)',
              }}
            >
              Close
            </button>
          </div>

          {/* Technique cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '0.75rem',
          }}>
            {selectedTechniques.map(t => {
              const sev = SEV_BADGE[t.severity];
              const status = STATUS_BADGE[t.status];
              return (
                <a
                  key={t.id}
                  href={`/atlas/tara/${t.id}/`}
                  className="block rounded-xl p-4 transition-all hover:-translate-y-0.5"
                  style={{
                    textDecoration: 'none', color: 'inherit',
                    background: 'var(--color-bg-surface)',
                    border: `1px solid var(--color-border)`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = sev?.text ?? 'var(--color-border-hover)';
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px ${sev?.bg ?? 'rgba(0,0,0,0.05)'}`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  {/* ID + badges */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-bold font-mono" style={{ color: 'var(--color-accent-secondary)' }}>
                      {t.id}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{
                      background: sev?.bg, color: sev?.text,
                    }}>
                      {t.severity}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                      background: status?.bg, color: status?.text,
                    }}>
                      {t.status}
                    </span>
                    {t.niss.score > 0 && (
                      <span className="text-[10px] font-bold font-mono ml-auto" style={{
                        color: SEV_BADGE[t.niss.severity]?.text ?? 'var(--color-text-faint)',
                      }}>
                        NISS {t.niss.score.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {/* Name */}
                  <div className="text-sm font-semibold mb-1.5" style={{
                    color: 'var(--color-text-primary)', lineHeight: 1.3,
                  }}>
                    {t.name}
                  </div>
                  {/* Description */}
                  <div className="text-xs leading-relaxed" style={{
                    color: 'var(--color-text-muted)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {t.description}
                  </div>
                  {/* Footer */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {t.tara?.dual_use && t.tara.dual_use !== 'silicon_only' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider" style={{
                        background: 'rgba(16, 185, 129, 0.08)', color: '#059669',
                      }}>
                        Dual-use
                      </span>
                    )}
                    <span className="text-[10px] font-mono ml-auto" style={{ color: 'var(--color-text-faint)' }}>
                      {t.bandsStr}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 items-center px-3 py-2.5 text-xs" style={{
        color: 'var(--color-text-faint)',
      }}>
        <span className="text-[10px] font-bold uppercase tracking-wider">Severity:</span>
        {SEV_ORDER.map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div style={{
              width: '14px', height: '14px', borderRadius: '4px',
              background: SEV_COLORS[s].bg,
              border: `1px solid ${SEV_COLORS[s].border}`,
            }} />
            <span className="capitalize font-medium" style={{ color: SEV_COLORS[s].text }}>{s}</span>
          </div>
        ))}
        <span style={{ color: 'var(--color-text-faint)', borderLeft: '1px solid var(--color-border)', paddingLeft: '0.75rem', marginLeft: '0.25rem' }}>
          Cell: count / avg NISS
        </span>
        <span className="ml-2" style={{ color: 'var(--color-text-faint)' }}>
          Click any cell to explore techniques
        </span>
      </div>
    </div>
  );
}
