/**
 * DashboardQueryPanel — preset KQL queries with inline results.
 *
 * Lightweight complement to the full BciKql console.
 * Uses the same kql-engine for execution.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  type Row,
  type TableData,
  buildIndexes,
  executeQuery,
  toStr,
} from '../../lib/kql-engine';

interface Props {
  tables?: TableData;
}

interface PresetQuery {
  label: string;
  description: string;
  query: string;
}

const PRESETS: PresetQuery[] = [
  {
    label: 'Critical Threats',
    description: 'All TARA techniques rated critical severity',
    query: 'techniques | where severity == "critical" | project id, name, tactic, niss_score, status',
  },
  {
    label: 'Insecure + Funded',
    description: 'Companies with $100M+ funding and no published security',
    query: 'companies | where funding_total_usd > 100000000 | where security_posture == "none_published" | project name, type, funding_total_usd, security_posture | sort by funding_total_usd desc',
  },
  {
    label: 'High-Channel Devices',
    description: 'BCI devices with 100+ recording channels',
    query: 'devices | where channels > 100 | project name, company, type, channels | sort by channels desc',
  },
  {
    label: 'Threats by Tactic',
    description: 'Technique count grouped by TARA tactic',
    query: 'techniques | summarize count() by tactic',
  },
  {
    label: 'Unencrypted Links',
    description: 'BCI devices with no wireless encryption',
    query: 'comms | where encryption contains "None" | project device, wireless_protocol, encryption, data_link_risk',
  },
  {
    label: 'Top Risk Index',
    description: 'Companies ranked by composite risk score',
    query: 'risk_profile | where risk_index > 0.5 | project company, type, funding_B, security_score, risk_index | sort by risk_index desc | take 10',
  },
];

export default function DashboardQueryPanel({ tables: tablesProp }: Props) {
  const [fetchedTables, setFetchedTables] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(!tablesProp);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [resultRows, setResultRows] = useState<Row[]>([]);
  const [resultError, setResultError] = useState<string | null>(null);
  const [resultTable, setResultTable] = useState<string>('');

  // Fetch tables from static JSON when no prop is provided
  useEffect(() => {
    if (tablesProp) return;
    let cancelled = false;
    fetch('/data/kql-tables.json')
      .then(r => r.json())
      .then(data => { if (!cancelled) { setFetchedTables(data); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tablesProp]);

  const tables: TableData = tablesProp || fetchedTables || {};

  const indexes = useMemo(() => buildIndexes(tables), [tables]);

  const runQuery = useCallback((idx: number) => {
    if (activeIdx === idx) {
      // Toggle off
      setActiveIdx(null);
      setResultRows([]);
      setResultError(null);
      return;
    }

    const preset = PRESETS[idx];
    const result = executeQuery(preset.query, tables, indexes);

    setActiveIdx(idx);
    setResultTable(result.tableName);
    if (result.error) {
      setResultError(result.error);
      setResultRows([]);
    } else {
      setResultError(null);
      setResultRows(result.rows.slice(0, 50));
    }
  }, [activeIdx, tables, indexes]);

  const columns = useMemo(() => {
    if (resultRows.length === 0) return [];
    return Object.keys(resultRows[0]);
  }, [resultRows]);

  return (
    <div>
      {/* Query buttons */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {PRESETS.map((preset, i) => (
          <button
            key={i}
            onClick={() => runQuery(i)}
            className={`text-left rounded-lg p-4 transition-all border ${
              activeIdx === i
                ? 'bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)]/40 ring-1 ring-[var(--color-accent-primary)]/20'
                : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-[var(--color-accent-primary)]/30'
            }`}
          >
            <span className={`text-sm font-semibold block mb-1 ${
              activeIdx === i ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-primary)]'
            }`}>
              {preset.label}
            </span>
            <span className="text-[11px] text-[var(--color-text-faint)] block">
              {preset.description}
            </span>
          </button>
        ))}
      </div>

      {/* Results */}
      {activeIdx !== null && (
        <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          {/* Query bar */}
          <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between flex-wrap gap-2">
            <code className="text-xs font-mono text-[var(--color-text-muted)] break-all">
              {PRESETS[activeIdx].query}
            </code>
            <span className="text-[10px] font-mono text-[var(--color-text-faint)] shrink-0">
              {resultRows.length} rows
            </span>
          </div>

          {resultError ? (
            <div className="px-4 py-6 text-sm text-red-400">{resultError}</div>
          ) : resultRows.length === 0 ? (
            <div className="px-4 py-6 text-sm text-[var(--color-text-faint)]">No results.</div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[var(--color-bg-surface)]">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--color-text-faint)] font-semibold border-b border-[var(--color-border)] whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultRows.map((row, ri) => (
                    <tr
                      key={ri}
                      className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-accent-primary)]/5 transition-colors"
                    >
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="px-3 py-2 text-[var(--color-text-muted)] font-mono whitespace-nowrap max-w-[300px] truncate"
                          title={toStr(row[col])}
                        >
                          {formatCell(col, row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer with link to full console */}
          <div className="px-4 py-3 border-t border-[var(--color-border)] flex justify-end">
            <a
              href={`/research/landscape/?q=${encodeURIComponent(PRESETS[activeIdx].query)}`}
              className="text-xs text-[var(--color-accent-primary)] hover:underline"
            >
              Open in KQL Console
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/** Format cell values for display */
function formatCell(col: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '\u2014';
  const s = toStr(value);

  // Format large numbers
  if (col.includes('usd') || col.includes('funding') || col.includes('amount')) {
    const n = Number(value);
    if (!isNaN(n) && n > 1_000_000) {
      return `$${(n / 1_000_000).toFixed(1)}M`;
    }
  }

  // Truncate long strings
  if (s.length > 60) return s.slice(0, 57) + '...';
  return s;
}
