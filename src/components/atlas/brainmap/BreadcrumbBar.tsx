/**
 * BreadcrumbBar — shows current selection path in the Brain Map.
 * Band > Region > Pathway > NT > DSM
 */

import type { ClinicalData } from '../../../lib/clinical-data';

interface Props {
  selectedBandId: string | null;
  selectedRegionId: string | null;
  selectedPathwayId: string | null;
  selectedNtId: string | null;
  selectedDsmCode: string | null;
  data: ClinicalData;
  onNavigate: (level: 'band' | 'region' | 'pathway' | 'nt' | 'dsm') => void;
}

const BAND_COLORS: Record<string, string> = {
  N7: '#166534', N6: '#3a7d44', N5: '#5c7a38', N4: '#72772f',
  N3: '#877226', N2: '#9b6c1e', N1: '#ae6616', I0: '#f59e0b',
  S1: '#93c5fd', S2: '#60a5fa', S3: '#3b82f6',
};

export default function BreadcrumbBar({
  selectedBandId, selectedRegionId, selectedPathwayId, selectedNtId, selectedDsmCode,
  data, onNavigate,
}: Props) {
  if (!selectedBandId && !selectedRegionId) return null;

  const crumbs: { label: string; level: 'band' | 'region' | 'pathway' | 'nt' | 'dsm'; color?: string }[] = [];

  if (selectedBandId) {
    crumbs.push({ label: selectedBandId, level: 'band', color: BAND_COLORS[selectedBandId] });
  }

  if (selectedRegionId) {
    const region = data.regions.find(r => r.id === selectedRegionId);
    crumbs.push({ label: region?.abbreviation || selectedRegionId, level: 'region' });
  }

  if (selectedPathwayId) {
    const pathway = data.pathways.find(p => p.id === selectedPathwayId);
    crumbs.push({ label: pathway?.name?.slice(0, 20) || selectedPathwayId, level: 'pathway' });
  }

  if (selectedNtId) {
    const nt = data.neurotransmitters.find(n => n.id === selectedNtId);
    crumbs.push({ label: nt?.abbreviation || selectedNtId, level: 'nt' });
  }

  if (selectedDsmCode) {
    crumbs.push({ label: selectedDsmCode, level: 'dsm' });
  }

  return (
    <div
      className="flex items-center gap-1 rounded-lg px-3 py-1.5 overflow-x-auto"
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <span className="text-[9px] font-mono uppercase tracking-wider shrink-0"
        style={{ color: 'var(--color-text-faint)' }}>
        Path:
      </span>
      {crumbs.map((crumb, i) => (
        <span key={crumb.level} className="flex items-center gap-1 shrink-0">
          {i > 0 && (
            <svg className="w-3 h-3" style={{ color: 'var(--color-text-faint)' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
          <button
            onClick={() => onNavigate(crumb.level)}
            className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: crumb.color || 'var(--color-text-primary)' }}
          >
            {crumb.label}
          </button>
        </span>
      ))}
    </div>
  );
}
