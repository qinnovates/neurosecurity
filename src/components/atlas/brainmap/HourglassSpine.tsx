/**
 * HourglassSpine — compact vertical hourglass for Brain Map left panel.
 * Shows 11 QIF bands with technique counts. Click to select/filter.
 */

import type { ClinicalData } from '../../../lib/clinical-data';

const BAND_COLORS: Record<string, string> = {
  N7: '#166534', N6: '#3a7d44', N5: '#5c7a38', N4: '#72772f',
  N3: '#877226', N2: '#9b6c1e', N1: '#ae6616', I0: '#f59e0b',
  S1: '#93c5fd', S2: '#60a5fa', S3: '#3b82f6',
};

const BANDS = [
  { id: 'N7', name: 'Neocortex', zone: 'neural', width: 1.0 },
  { id: 'N6', name: 'Limbic', zone: 'neural', width: 0.85 },
  { id: 'N5', name: 'Basal Ganglia', zone: 'neural', width: 0.72 },
  { id: 'N4', name: 'Diencephalon', zone: 'neural', width: 0.60 },
  { id: 'N3', name: 'Cerebellum', zone: 'neural', width: 0.50 },
  { id: 'N2', name: 'Brainstem', zone: 'neural', width: 0.42 },
  { id: 'N1', name: 'Spinal', zone: 'neural', width: 0.35 },
  { id: 'I0', name: 'Interface', zone: 'interface', width: 0.30 },
  { id: 'S1', name: 'Hardware', zone: 'synthetic', width: 0.42 },
  { id: 'S2', name: 'Software', zone: 'synthetic', width: 0.60 },
  { id: 'S3', name: 'Network', zone: 'synthetic', width: 0.80 },
];

interface Props {
  data: ClinicalData;
  selectedBandId: string | null;
  highlightedBandIds: string[];
  onBandSelect: (bandId: string | null) => void;
}

export default function HourglassSpine({ data, selectedBandId, highlightedBandIds, onBandSelect }: Props) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[10px] font-mono uppercase tracking-wider mb-2 text-center"
        style={{ color: 'var(--color-text-faint)' }}>
        QIF Hourglass
      </div>

      {BANDS.map((band, i) => {
        const isSelected = selectedBandId === band.id;
        const isHighlighted = highlightedBandIds.includes(band.id);
        const bandData = data.bandClinicalData?.[band.id];
        const threatCount = bandData?.threatCount || 0;
        const regionCount = data.regions.filter(r => r.band === band.id).length;
        const color = BAND_COLORS[band.id] || '#666';
        const isZoneBoundary = (i === 6 || i === 7); // N1→I0 and I0→S1

        return (
          <div key={band.id}>
            {isZoneBoundary && i === 7 && (
              <div className="flex items-center gap-1 my-1.5">
                <div className="flex-1 h-px" style={{ borderTop: '1px dashed var(--color-border)' }} />
                <span className="text-[8px] font-mono uppercase" style={{ color: 'var(--color-text-faint)' }}>
                  {band.zone === 'interface' ? 'I/O Boundary' : 'Synthetic'}
                </span>
                <div className="flex-1 h-px" style={{ borderTop: '1px dashed var(--color-border)' }} />
              </div>
            )}
            <button
              onClick={() => onBandSelect(isSelected ? null : band.id)}
              className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 transition-all"
              style={{
                background: isSelected ? `${color}25` : isHighlighted ? `${color}12` : 'transparent',
                border: isSelected ? `1px solid ${color}60` : '1px solid transparent',
                boxShadow: isSelected ? `0 0 8px ${color}30` : 'none',
              }}
            >
              {/* Width bar */}
              <div className="relative h-5 flex-1 rounded-sm overflow-hidden"
                style={{ background: 'var(--color-bg-secondary)' }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-sm transition-all"
                  style={{
                    width: `${band.width * 100}%`,
                    background: `${color}${isSelected ? '90' : isHighlighted ? '60' : '35'}`,
                  }}
                />
                <div className="relative z-10 flex items-center justify-between h-full px-1.5">
                  <span className="text-[10px] font-mono font-semibold" style={{ color: isSelected ? '#fff' : color }}>
                    {band.id}
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: isSelected ? '#fff' : 'var(--color-text-faint)' }}>
                    {band.name}
                  </span>
                </div>
              </div>

              {/* Counts */}
              <div className="flex items-center gap-1 shrink-0">
                {regionCount > 0 && (
                  <span className="text-[9px] font-mono px-1 rounded"
                    style={{ background: `${color}15`, color }}>
                    {regionCount}r
                  </span>
                )}
                {threatCount > 0 && (
                  <span className="text-[9px] font-mono px-1 rounded"
                    style={{ background: '#ef444420', color: '#ef4444' }}>
                    {threatCount}t
                  </span>
                )}
              </div>
            </button>
          </div>
        );
      })}

      <div className="text-[9px] text-center mt-2 font-mono" style={{ color: 'var(--color-text-faint)' }}>
        {data.stats.totalRegions} regions across 7 neural bands
      </div>
    </div>
  );
}
