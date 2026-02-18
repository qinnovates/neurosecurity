import { useState } from 'react';

export interface DomainTechnique {
  id: string;
  name: string;
  therapeuticAnalog: string;
  tier: 1 | 2 | 3;
  fdaStatus: string;
  evidenceLevel: string;
}

export interface ClinicalDomainInfo {
  id: string;
  label: string;
  color: string;
  description: string;
  techniqueCount: number;
  fdaApprovedCount: number;
  modalities: string[];
  topTechniques: DomainTechnique[];
}

interface Props {
  domains: ClinicalDomainInfo[];
}

const TIER_COLORS = {
  1: '#22c55e',
  2: '#f59e0b',
  3: '#94a3b8',
} as const;

const TIER_LABELS = {
  1: 'FDA + RCT/meta',
  2: 'Investigational',
  3: 'Preclinical',
} as const;

export default function ClinicalDomainCards({ domains }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {domains.map(domain => {
        const isExpanded = expandedId === domain.id;

        return (
          <button
            key={domain.id}
            onClick={() => setExpandedId(isExpanded ? null : domain.id)}
            className="text-left w-full rounded-xl p-5 transition-all duration-200"
            style={{
              background: 'var(--color-glass-bg)',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              border: `1px solid ${isExpanded ? domain.color + '40' : 'var(--color-glass-border)'}`,
              boxShadow: isExpanded ? `0 4px 24px ${domain.color}10` : 'none',
            }}
            aria-expanded={isExpanded}
            aria-label={`${domain.label}: ${domain.description}`}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: domain.color }}
              />
              <h3
                className="text-sm font-semibold leading-snug"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}
              >
                {domain.label}
              </h3>
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--color-text-muted)' }}>
              {domain.description}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={domain.color} strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {domain.techniqueCount}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>techniques</span>
              </div>
              {domain.fdaApprovedCount > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>FDA</span>
                  <span className="text-xs font-mono font-semibold" style={{ color: '#22c55e' }}>
                    {domain.fdaApprovedCount}
                  </span>
                </div>
              )}
            </div>

            {/* Modality badges */}
            <div className="flex flex-wrap gap-1">
              {domain.modalities.map(mod => (
                <span
                  key={mod}
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    background: 'rgba(0,0,0,0.04)',
                    color: 'var(--color-text-faint)',
                  }}
                >
                  {mod}
                </span>
              ))}
            </div>

            {/* Expanded: top techniques */}
            {isExpanded && domain.topTechniques.length > 0 && (
              <div
                className="mt-4 pt-3"
                style={{
                  borderTop: '1px solid var(--color-glass-border)',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-faint)' }}>
                  Top techniques by evidence
                </p>
                <div className="space-y-1.5">
                  {domain.topTechniques.map(t => (
                    <a
                      key={t.id}
                      href={`/TARA/${t.id}/`}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-2 hover:bg-white/5 rounded px-1 py-0.5 transition-colors"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        title={TIER_LABELS[t.tier]}
                        style={{ background: TIER_COLORS[t.tier] }}
                      />
                      <span className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                        {t.therapeuticAnalog}
                      </span>
                      <span className="text-[10px] font-mono ml-auto flex-shrink-0" style={{ color: 'var(--color-text-faint)' }}>
                        {t.id}
                      </span>
                    </a>
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
