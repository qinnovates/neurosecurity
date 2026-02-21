/**
 * HourglassVisualization — React port of the 2D hourglass from docs/lab/hourglass.html.
 * Renders the 11-band QIF hourglass (7-1-3 asymmetric) with click interaction.
 * Designed for embedding in the Atlas Dashboard alongside the 3D brain.
 */

import { useState } from 'react';
import type { AtlasBand } from '../../lib/atlas-data';

interface Props {
  bands: AtlasBand[];
  selectedBandId: string | null;
  onBandSelect: (bandId: string | null) => void;
}

const SEVERITY_STYLES: Record<string, { label: string; className: string }> = {
  'LETHAL': { label: 'Lethal', className: 'bg-red-600/10 text-red-500 border-red-500/20' },
  'CRITICAL': { label: 'Critical', className: 'bg-orange-600/10 text-orange-500 border-orange-500/20' },
  'HIGH': { label: 'High', className: 'bg-amber-600/10 text-amber-500 border-amber-500/20' },
  'SEVERE': { label: 'Severe', className: 'bg-yellow-600/10 text-yellow-500 border-yellow-500/20' },
};

function getSeverityBadge(severity: string) {
  const upper = severity.split(' ')[0].toUpperCase();
  const style = SEVERITY_STYLES[upper];
  if (!style) return null;
  return (
    <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${style.className}`}>
      {style.label}
    </span>
  );
}

export default function HourglassVisualization({ bands, selectedBandId, onBandSelect }: Props) {
  const [hoveredBand, setHoveredBand] = useState<string | null>(null);

  // Split into zones for separators
  const neuralBands = bands.filter(b => b.zone === 'neural');
  const interfaceBands = bands.filter(b => b.zone === 'interface');
  const siliconBands = bands.filter(b => b.zone === 'silicon');

  const renderBand = (band: AtlasBand) => {
    const isSelected = selectedBandId === band.id;
    const isHovered = hoveredBand === band.id;
    const active = isSelected || isHovered;

    return (
      <div
        key={band.id}
        className="flex items-center gap-2 py-[3px] cursor-pointer rounded transition-colors group"
        style={{
          background: isSelected ? `${band.color}12` : 'transparent',
        }}
        onClick={() => onBandSelect(band.id)}
        onMouseEnter={() => setHoveredBand(band.id)}
        onMouseLeave={() => setHoveredBand(null)}
      >
        {/* Band ID */}
        <span
          className="w-7 text-right font-mono text-[11px] font-semibold shrink-0 transition-colors"
          style={{ color: active ? band.color : 'var(--color-text-faint)' }}
        >
          {band.id}
        </span>

        {/* Bar */}
        <div className="flex-1 flex justify-center">
          <div
            className="rounded-[3px] transition-all"
            style={{
              width: `${band.width}%`,
              height: '24px',
              background: band.color,
              opacity: active ? 1 : 0.7,
              filter: active ? 'brightness(1.2)' : 'none',
              boxShadow: isSelected ? `0 0 12px ${band.color}40` : 'none',
            }}
          />
        </div>

        {/* Name + extras */}
        <div className="w-28 shrink-0 flex items-center gap-1.5">
          <span
            className="text-[11px] truncate transition-colors"
            style={{ color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
          >
            {band.name}
          </span>
        </div>

        {/* Threat count */}
        <span
          className="w-8 text-right font-mono text-[10px] shrink-0"
          style={{ color: 'var(--color-text-faint)' }}
        >
          {band.threatCount > 0 ? band.threatCount : ''}
        </span>
      </div>
    );
  };

  const zoneSeparator = (label: string) => (
    <div className="flex items-center gap-2 py-1 my-0.5">
      <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
      <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--color-text-faint)' }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
    </div>
  );

  return (
    <div className="flex flex-col">
      {/* Axis label */}
      <div className="flex items-center gap-1 mb-2 justify-center">
        <span className="text-[9px] uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-faint)' }}>
          Biological
        </span>
        <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
          &darr;
        </span>
      </div>

      {/* Neural bands */}
      {neuralBands.map(renderBand)}

      {zoneSeparator('Interface')}

      {/* Interface bands */}
      {interfaceBands.map(renderBand)}

      {zoneSeparator('Silicon')}

      {/* Silicon bands */}
      {siliconBands.map(renderBand)}

      {/* Bottom axis */}
      <div className="flex items-center gap-1 mt-2 justify-center">
        <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
          &darr;
        </span>
        <span className="text-[9px] uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-faint)' }}>
          Synthetic
        </span>
      </div>

      {/* Selected band quick info */}
      {selectedBandId && (() => {
        const band = bands.find(b => b.id === selectedBandId);
        if (!band) return null;
        return (
          <div
            className="mt-4 px-3 py-2.5 rounded-lg border"
            style={{
              background: `${band.color}08`,
              borderColor: `${band.color}25`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-xs" style={{ color: band.color }}>
                {band.id}
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {band.name}
              </span>
              {getSeverityBadge(band.severity)}
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {band.description}
            </p>
            <div className="flex gap-3 mt-1.5">
              <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                {band.threatCount} threats
              </span>
              <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                {band.brainRegions.length} regions
              </span>
              <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                QI: {band.qiRange[0]}-{band.qiRange[1]}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
