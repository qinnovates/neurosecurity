import { useState } from 'react';
import type { NeurorightInfo } from '../../lib/neurogovernance-data';

interface Props {
  neurorights: NeurorightInfo[];
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#94a3b8',
};

export default function NeurorightCards({ neurorights }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {neurorights.map(nr => {
        const isExpanded = expandedId === nr.id;

        return (
          <button
            key={nr.id}
            onClick={() => setExpandedId(isExpanded ? null : nr.id)}
            className="text-left w-full rounded-xl p-5 transition-all duration-200"
            style={{
              background: 'var(--color-glass-bg)',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              border: `1px solid ${isExpanded ? nr.color + '40' : 'var(--color-glass-border)'}`,
              boxShadow: isExpanded ? `0 4px 24px ${nr.color}10` : 'none',
            }}
            aria-expanded={isExpanded}
            aria-label={`${nr.name}: ${nr.shortDef}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: nr.color }}
                />
                <span
                  className="text-xs font-mono font-bold tracking-wider"
                  style={{ color: nr.color }}
                >
                  {nr.id}
                </span>
              </div>
              {nr.source === 'qif-extended' && (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{
                    background: 'var(--color-accent-secondary)',
                    color: 'white',
                    opacity: 0.9,
                  }}
                >
                  QIF Extended
                </span>
              )}
            </div>

            {/* Name */}
            <h3
              className="text-sm font-semibold mb-1.5 leading-snug"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}
            >
              {nr.name}
            </h3>

            {/* Definition */}
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--color-text-muted)' }}>
              {nr.shortDef}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={nr.color} strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                </svg>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {nr.threatCount}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>threats</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>CCI</span>
                <span className="text-xs font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {nr.cciMean.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Brain region badges */}
            <div className="flex flex-wrap gap-1">
              {nr.brainRegions.map(region => (
                <span
                  key={region}
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    background: 'rgba(0,0,0,0.04)',
                    color: 'var(--color-text-faint)',
                  }}
                >
                  {region}
                </span>
              ))}
            </div>

            {/* Expanded: top threats */}
            {isExpanded && nr.topThreats.length > 0 && (
              <div
                className="mt-4 pt-3"
                style={{
                  borderTop: '1px solid var(--color-glass-border)',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-faint)' }}>
                  Highest-impact threats
                </p>
                <div className="space-y-1.5">
                  {nr.topThreats.map(t => (
                    <div key={t.id} className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: SEVERITY_COLORS[t.severity] ?? '#94a3b8' }}
                      />
                      <span className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                        {t.name}
                      </span>
                      <span className="text-[10px] font-mono ml-auto flex-shrink-0" style={{ color: 'var(--color-text-faint)' }}>
                        {t.cci.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
