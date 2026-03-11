/**
 * BrainSvg — Interactive medial brain view with clickable region hotspots.
 * Pure inline SVG with CSS-driven animations. No external libraries.
 */

import { useState, useCallback, useMemo } from 'react';
import type { ClinicalRegion } from '../../../lib/clinical-data';
import {
  BRAIN_REGION_COORDS,
  BRAIN_OUTLINE_PATH,
  CEREBELLUM_PATH,
  BRAINSTEM_PATH,
  SPINAL_CORD_PATH,
} from './brain-regions';

const BAND_COLORS: Record<string, string> = {
  N7: '#166534', N6: '#3a7d44', N5: '#5c7a38', N4: '#72772f',
  N3: '#877226', N2: '#9b6c1e', N1: '#ae6616', I0: '#f59e0b',
  S1: '#93c5fd', S2: '#60a5fa', S3: '#3b82f6',
};

interface Props {
  regions: ClinicalRegion[];
  selectedRegionId: string | null;
  highlightedRegionIds: string[];
  onRegionSelect: (regionId: string | null) => void;
}

export default function BrainSvg({ regions, selectedRegionId, highlightedRegionIds, onRegionSelect }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const regionMap = useMemo(() => {
    const map = new Map<string, ClinicalRegion>();
    for (const r of regions) map.set(r.id, r);
    return map;
  }, [regions]);

  const handleClick = useCallback((regionId: string) => {
    onRegionSelect(selectedRegionId === regionId ? null : regionId);
  }, [selectedRegionId, onRegionSelect]);

  const hoveredRegion = hoveredId ? regionMap.get(hoveredId) : null;
  const hoveredCoord = hoveredId ? BRAIN_REGION_COORDS[hoveredId] : null;

  return (
    <div className="relative">
      <svg
        viewBox="0 0 440 480"
        className="w-full h-auto"
        style={{ maxHeight: '520px' }}
      >
        <defs>
          <filter id="region-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="region-pulse">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Brain outline */}
        <path
          d={BRAIN_OUTLINE_PATH}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1.5"
          opacity={0.5}
        />

        {/* Cerebellum outline */}
        <path
          d={CEREBELLUM_PATH}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
          opacity={0.35}
          strokeDasharray="4 2"
        />

        {/* Brainstem outline */}
        <path
          d={BRAINSTEM_PATH}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
          opacity={0.35}
          strokeDasharray="4 2"
        />

        {/* Spinal cord */}
        <path
          d={SPINAL_CORD_PATH}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
          opacity={0.3}
          strokeDasharray="3 3"
        />

        {/* Connection lines from selected region */}
        {selectedRegionId && BRAIN_REGION_COORDS[selectedRegionId] && (() => {
          const sel = BRAIN_REGION_COORDS[selectedRegionId];
          const selRegion = regionMap.get(selectedRegionId);
          if (!selRegion) return null;

          // Draw lines to connected regions
          return selRegion.connections.map((connId) => {
            const conn = BRAIN_REGION_COORDS[connId];
            if (!conn) return null;
            return (
              <line
                key={`conn-${connId}`}
                x1={sel.cx} y1={sel.cy}
                x2={conn.cx} y2={conn.cy}
                stroke={BAND_COLORS[selRegion.band] || '#666'}
                strokeWidth="1"
                opacity={0.4}
                strokeDasharray="4 3"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="14" to="0" dur="1.2s"
                  repeatCount="indefinite"
                />
              </line>
            );
          });
        })()}

        {/* Region hotspots */}
        {Object.entries(BRAIN_REGION_COORDS).map(([id, coord]) => {
          const region = regionMap.get(id);
          if (!region) return null;

          const isSelected = selectedRegionId === id;
          const isHighlighted = highlightedRegionIds.includes(id);
          const isHovered = hoveredId === id;
          const color = BAND_COLORS[region.band] || '#666';

          let opacity = 0.25;
          let strokeW = 0;
          let strokeColor = 'transparent';
          let filter: string | undefined;

          if (isSelected) {
            opacity = 0.9;
            strokeW = 2;
            strokeColor = '#fff';
            filter = 'url(#region-pulse)';
          } else if (isHovered) {
            opacity = 0.75;
            strokeW = 1.5;
            strokeColor = '#fff';
            filter = 'url(#region-glow)';
          } else if (isHighlighted) {
            opacity = 0.65;
            strokeW = 1;
            strokeColor = `${color}`;
            filter = 'url(#region-glow)';
          }

          return (
            <g key={id}>
              <ellipse
                cx={coord.cx} cy={coord.cy}
                rx={coord.rx} ry={coord.ry}
                fill={color}
                opacity={opacity}
                stroke={strokeColor}
                strokeWidth={strokeW}
                filter={filter}
                className="cursor-pointer transition-opacity"
                onClick={() => handleClick(id)}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
              />
              {/* Label */}
              <text
                x={coord.cx + coord.labelOffset.dx}
                y={coord.cy + coord.labelOffset.dy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={isSelected || isHovered ? 9 : 7}
                fontFamily="var(--font-mono)"
                fontWeight={isSelected ? 700 : 500}
                fill={isSelected || isHighlighted ? color : 'var(--color-text-faint)'}
                opacity={isSelected || isHovered || isHighlighted ? 1 : 0.5}
                className="pointer-events-none select-none"
              >
                {region.abbreviation || id}
              </text>
              {/* Threat count badge */}
              {isSelected && region.threatCount > 0 && (
                <>
                  <circle
                    cx={coord.cx + coord.rx + 6}
                    cy={coord.cy - coord.ry - 2}
                    r={7}
                    fill="#ef4444"
                  />
                  <text
                    x={coord.cx + coord.rx + 6}
                    y={coord.cy - coord.ry - 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={7}
                    fontWeight={700}
                    fill="#fff"
                    className="pointer-events-none"
                  >
                    {region.threatCount}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Zone labels */}
        <text x="20" y="30" fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-text-faint)" opacity={0.4}>
          NEURAL
        </text>
        <text x="20" y="460" fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-text-faint)" opacity={0.4}>
          SPINAL
        </text>
      </svg>

      {/* Hover tooltip */}
      {hoveredRegion && hoveredCoord && (
        <div
          className="absolute pointer-events-none z-20 rounded-lg px-3 py-2 text-xs max-w-[200px]"
          style={{
            left: `${(hoveredCoord.cx / 440) * 100}%`,
            top: `${(hoveredCoord.cy / 480) * 100}%`,
            transform: 'translate(-50%, -120%)',
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div className="font-semibold" style={{ color: BAND_COLORS[hoveredRegion.band] }}>
            {hoveredRegion.name}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
            {hoveredRegion.band} | {hoveredRegion.pathwayCount} pathways | {hoveredRegion.threatCount} threats
          </div>
          <div className="text-[10px] mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
            {hoveredRegion.function}
          </div>
        </div>
      )}
    </div>
  );
}
