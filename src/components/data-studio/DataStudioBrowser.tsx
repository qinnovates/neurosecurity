/**
 * DataStudioBrowser — HuggingFace-style dataset catalog + table viewer.
 *
 * Architecture:
 *   Phase 1: Catalog cards (static props from build-time catalog.json)
 *   Phase 2: Click dataset → fetch first 100 rows from /data/kql-tables.json
 *   Phase 3: SQL console + Parquet download (lazy-loaded)
 *
 * No DuckDB-WASM in this phase — uses existing KQL JSON for table preview.
 * Parquet files served as static downloads.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { TableData, Row } from '../../lib/kql-engine';

interface DatasetMeta {
  id: string;
  rows: number;
  columns: number;
  columnNames: string[];
  sizeBytes: number;
  compression: string;
}

interface Props {
  datasets: DatasetMeta[];
}

// Dataset descriptions for known tables
const DESCRIPTIONS: Record<string, { label: string; description: string; category: string }> = {
  techniques: { label: 'TARA Techniques', description: 'BCI threat techniques with NISS scores, severity, and dual-use classification', category: 'Threats' },
  technique_dsm: { label: 'Technique-DSM Bridge', description: 'Maps techniques to DSM-5-TR diagnostic categories (for threat modeling)', category: 'Threats' },
  technique_neurorights: { label: 'Technique-Neurorights', description: 'Maps techniques to the 5 neurorights they affect', category: 'Threats' },
  impact_chains: { label: 'Impact Chains', description: 'Precomputed threat-to-outcome chains across the neural stack', category: 'Threats' },
  brain_regions: { label: 'Brain Regions', description: '38 brain structures mapped to the QIF hourglass model', category: 'Anatomy' },
  hourglass_bands: { label: 'Hourglass Bands', description: 'The 11 QIF bands spanning silicon to neural', category: 'Framework' },
  companies: { label: 'BCI Companies', description: '57 companies in the BCI landscape with funding and security posture', category: 'Industry' },
  devices: { label: 'BCI Devices', description: '68 devices with channel counts, modality, and company mapping', category: 'Industry' },
  neural_pathways: { label: 'Neural Pathways', description: 'White matter tracts and functional connectivity', category: 'Anatomy' },
  neurotransmitters: { label: 'Neurotransmitters', description: 'Synthesis pathways, receptors, and cofactor dependencies', category: 'Anatomy' },
  cranial_nerves: { label: 'Cranial Nerves', description: '12 cranial nerves with fiber types and BCI relevance', category: 'Anatomy' },
  receptors: { label: 'Receptor Families', description: 'Ionotropic and metabotropic receptor families', category: 'Anatomy' },
  cve_mappings: { label: 'CVE Mappings', description: 'CVEs mapped to QIF/TARA techniques', category: 'Security' },
  intel_feed: { label: 'Intel Feed', description: 'BCI industry news, funding rounds, and regulatory updates', category: 'Intelligence' },
  intel_sources: { label: 'Intel Sources', description: 'News outlets and feeds with credibility ratings', category: 'Intelligence' },
  neurosecurity_scores: { label: 'Device Security Scores', description: 'NISS-based security scoring per BCI device', category: 'Security' },
  research_explorer: { label: 'Research Papers', description: 'Published research relevant to QIF', category: 'Research' },
  research_institutions: { label: 'Institutions', description: 'Universities and labs working in neurosecurity', category: 'Research' },
  neurological_conditions: { label: 'Neurological Conditions', description: 'Conditions mapped to affected brain structures', category: 'Clinical' },
  neuroendocrine: { label: 'Neuroendocrine Axes', description: 'HPA, HPG, HPT axes with hormone cascades', category: 'Anatomy' },
  glial_cells: { label: 'Glial Cell Types', description: 'Astrocytes, oligodendrocytes, microglia', category: 'Anatomy' },
  guardrails: { label: 'QIF Guardrails', description: 'Neuroethics constraints governing QIF output', category: 'Governance' },
};

const CATEGORY_COLORS: Record<string, string> = {
  Threats: '#dc2626',
  Anatomy: '#3b82f6',
  Framework: '#8b5cf6',
  Industry: '#f59e0b',
  Security: '#ef4444',
  Intelligence: '#06b6d4',
  Research: '#10b981',
  Clinical: '#ec4899',
  Governance: '#6366f1',
};

function formatSize(bytes: number): string {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(0)}KB`;
}

export default function DataStudioBrowser({ datasets }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeDataset, setActiveDataset] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Row[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [queryTab, setQueryTab] = useState<'kql' | 'sql'>('kql');

  // Sort: largest datasets first, then alphabetical
  const sorted = useMemo(() =>
    [...datasets].sort((a, b) => b.rows - a.rows),
  [datasets]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const d of datasets) {
      const meta = DESCRIPTIONS[d.id];
      cats.add(meta?.category || 'Other');
    }
    return [...cats].sort();
  }, [datasets]);

  const filtered = useMemo(() => {
    return sorted.filter(d => {
      const meta = DESCRIPTIONS[d.id];
      const label = meta?.label || d.id;
      const desc = meta?.description || '';
      const cat = meta?.category || 'Other';

      if (selectedCategory && cat !== selectedCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!label.toLowerCase().includes(q) &&
            !desc.toLowerCase().includes(q) &&
            !d.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [sorted, search, selectedCategory]);

  // Cache fetched KQL tables to avoid re-downloading 558KB on every preview click
  const tablesCache = useRef<Record<string, TableData>>({});

  // Fetch preview data from KQL tables JSON (cached after first load)
  const loadPreview = useCallback(async (datasetId: string) => {
    if (activeDataset === datasetId) {
      setActiveDataset(null);
      setPreviewData(null);
      return;
    }

    setActiveDataset(datasetId);
    setPreviewLoading(true);

    try {
      // Load from KQL tables (already split: core + impact chains)
      const isImpactChains = datasetId === 'impact_chains';
      const cacheKey = isImpactChains ? 'chains' : 'core';
      const url = isImpactChains ? '/data/kql-impact-chains.json' : '/data/kql-tables.json';

      // Use cached data if available (eliminates repeated 558KB fetches)
      if (!tablesCache.current[cacheKey]) {
        const res = await fetch(url);
        tablesCache.current[cacheKey] = await res.json();
      }
      const tables: TableData = tablesCache.current[cacheKey];

      // Find matching table (KQL table names may differ slightly from Parquet names)
      const tableNameMap: Record<string, string> = {
        technique_dsm: 'dsm5',
        technique_neurorights: 'neurorights',
        dsm_clusters: 'dsm5',
        research_explorer: 'publications',
        research_institutions: 'sources',
        cve_mappings: 'cves',
        neurosecurity_scores: 'neurosecurity_scores',
      };

      const kqlName = tableNameMap[datasetId] || datasetId;
      const rows = tables[kqlName] || tables[datasetId] || [];

      // Take first 100 rows for preview
      setPreviewData(rows.slice(0, 100));
    } catch {
      setPreviewData([]);
    } finally {
      setPreviewLoading(false);
    }
  }, [activeDataset]);

  return (
    <div>
      {/* Search + Filter Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search datasets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: '1 1 300px',
            padding: '0.625rem 1rem',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '2rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: !selectedCategory ? '#0f172a' : '#f1f5f9',
              color: !selectedCategory ? '#fff' : '#64748b',
            }}
          >All</button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '2rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: cat === selectedCategory ? '#0f172a' : '#f1f5f9',
                color: cat === selectedCategory ? '#fff' : '#64748b',
              }}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* Dataset Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
        {filtered.map(d => {
          const meta = DESCRIPTIONS[d.id] || { label: d.id.replace(/_/g, ' '), description: '', category: 'Other' };
          const catColor = CATEGORY_COLORS[meta.category] || '#64748b';
          const isActive = activeDataset === d.id;

          return (
            <div
              key={d.id}
              style={{
                background: isActive ? '#f8fafc' : '#fff',
                border: isActive ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                borderRadius: '1rem',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onClick={() => loadPreview(d.id)}
            >
              {/* Category badge + format */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.05em',
                  color: catColor,
                }}>{meta.category}</span>
                <span style={{
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '1rem',
                  background: '#f1f5f9',
                  color: '#64748b',
                  fontFamily: 'var(--font-mono, monospace)',
                }}>PARQUET</span>
              </div>

              {/* Name */}
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#0f172a',
                margin: '0 0 0.25rem',
                fontFamily: 'var(--font-heading, system-ui)',
              }}>{meta.label}</h3>

              {/* Description */}
              <p style={{
                fontSize: '0.8125rem',
                color: '#64748b',
                margin: '0 0 0.75rem',
                lineHeight: 1.4,
              }}>{meta.description}</p>

              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#94a3b8',
                alignItems: 'center',
              }}>
                <span><strong style={{ color: '#0f172a' }}>{d.rows.toLocaleString()}</strong> rows</span>
                <span><strong style={{ color: '#0f172a' }}>{d.columns}</strong> cols</span>
                <span>{formatSize(d.sizeBytes)}</span>
                {d.rows <= 5 && (
                  <span style={{
                    fontSize: '0.5625rem',
                    fontWeight: 700,
                    padding: '0.0625rem 0.375rem',
                    borderRadius: '0.25rem',
                    background: '#f1f5f9',
                    color: '#94a3b8',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.05em',
                  }}>REF</span>
                )}
              </div>

              {/* Download link */}
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <a
                  href={`/data/parquet/${d.id}.parquet`}
                  download
                  onClick={e => e.stopPropagation()}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#3b82f6',
                    textDecoration: 'none',
                  }}
                >Download .parquet</a>
                <span style={{ color: '#e2e8f0' }}>|</span>
                <button
                  onClick={e => { e.stopPropagation(); loadPreview(d.id); }}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#8b5cf6',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >{isActive ? 'Hide preview' : 'Preview rows'}</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Table */}
      {activeDataset && (
        <div style={{
          marginTop: '2rem',
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '1rem',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                {DESCRIPTIONS[activeDataset]?.label || activeDataset}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {previewLoading ? 'Loading...' : `${previewData?.length || 0} rows (preview from KQL layer)`}
              </span>
              <span style={{ fontSize: '0.625rem', color: '#cbd5e1', display: 'block', marginTop: '0.125rem' }}>
                Schema may differ from downloaded Parquet. Verify in your target tool.
              </span>
            </div>
            <a
              href={`/data/parquet/${activeDataset}.parquet`}
              download
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.375rem 0.75rem',
                borderRadius: '0.5rem',
                background: '#0f172a',
                color: '#fff',
                textDecoration: 'none',
              }}
            >Download</a>
          </div>

          {previewLoading && (
            <div style={{ padding: '2rem', textAlign: 'center' as const, color: '#94a3b8' }}>
              Loading preview...
            </div>
          )}

          {!previewLoading && previewData && previewData.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse' as const,
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono, monospace)',
              }}>
                <caption style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>Preview data for {activeDataset}</caption>
                <thead>
                  <tr>
                    {Object.keys(previewData[0]).map(col => (
                      <th key={col} scope="col" style={{
                        padding: '0.5rem 0.75rem',
                        textAlign: 'left' as const,
                        borderBottom: '2px solid #e2e8f0',
                        background: '#f8fafc',
                        fontWeight: 600,
                        color: '#475569',
                        whiteSpace: 'nowrap' as const,
                        position: 'sticky' as const,
                        top: 0,
                      }}>{col.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      {Object.keys(previewData[0]).map(col => {
                        const val = row[col];
                        const display = val == null || val === '' ? '—'
                          : typeof val === 'object' ? JSON.stringify(val).slice(0, 60)
                          : String(val).length > 60 ? String(val).slice(0, 60) + '...'
                          : String(val);
                        return (
                          <td key={col} style={{
                            padding: '0.375rem 0.75rem',
                            borderBottom: '1px solid #f1f5f9',
                            whiteSpace: 'nowrap' as const,
                            maxWidth: '300px',
                            overflow: 'hidden' as const,
                            textOverflow: 'ellipsis' as const,
                            color: val == null ? '#cbd5e1' : '#1e293b',
                          }}>{display}</td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!previewLoading && previewData && previewData.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center' as const, color: '#94a3b8' }}>
              No preview data available. Download the Parquet file to explore locally.
            </div>
          )}
        </div>
      )}

      {/* Query Engine — Tabbed: KQL + SQL Console */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.625rem', textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#94a3b8', fontFamily: 'var(--font-mono, monospace)' }}>
            Query Engine
          </span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '1rem' }}>
          <button
            onClick={() => setQueryTab('kql')}
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              border: '1px solid #e2e8f0',
              borderBottom: queryTab === 'kql' ? '2px solid #0f172a' : '1px solid #e2e8f0',
              borderRadius: '0.5rem 0.5rem 0 0',
              background: queryTab === 'kql' ? '#fff' : '#f8fafc',
              color: queryTab === 'kql' ? '#0f172a' : '#94a3b8',
              cursor: 'pointer',
              marginRight: '-1px',
              position: 'relative' as const,
              zIndex: queryTab === 'kql' ? 1 : 0,
            }}
          >KQL Engine</button>
          <button
            onClick={() => setQueryTab('sql')}
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              border: '1px solid #e2e8f0',
              borderBottom: queryTab === 'sql' ? '2px solid #0f172a' : '1px solid #e2e8f0',
              borderRadius: '0.5rem 0.5rem 0 0',
              background: queryTab === 'sql' ? '#fff' : '#f8fafc',
              color: queryTab === 'sql' ? '#0f172a' : '#94a3b8',
              cursor: 'pointer',
              position: 'relative' as const,
              zIndex: queryTab === 'sql' ? 1 : 0,
            }}
          >SQL Console (DuckDB)</button>
        </div>

        {queryTab === 'kql' && (
          <>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
              Use KQL to query across all datasets. Try: <code style={{ background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.8125rem' }}>techniques | where severity == "critical"</code>
            </p>
            <LazyKql />
          </>
        )}

        {queryTab === 'sql' && (
          <>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
              Queries run entirely in your browser via DuckDB-WASM. No data leaves your machine.
            </p>
            <LazySQLConsole />
          </>
        )}
      </div>
    </div>
  );
}

/** Lazy-load BciKql to keep the catalog page light */
function LazyKql() {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import('../bci/BciKql').then(mod => {
      setComponent(() => mod.default);
    });
  }, []);

  if (!Component) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' as const, color: '#94a3b8', background: '#f8fafc', borderRadius: '1rem' }}>
        Loading query engine...
      </div>
    );
  }

  return <Component />;
}

/** Lazy-load SQLConsole — DuckDB-WASM never in main bundle */
function LazySQLConsole() {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import('./SQLConsole').then(mod => {
      setComponent(() => mod.default);
    });
  }, []);

  if (!Component) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' as const, color: '#94a3b8', background: '#f8fafc', borderRadius: '1rem' }}>
        Loading SQL console...
      </div>
    );
  }

  return <Component />;
}
