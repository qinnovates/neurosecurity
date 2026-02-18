import { useState } from 'react';
import type { NeurorightInfo, BrainRegion } from '../../lib/neurogovernance-data';

interface Props {
  neurorights: NeurorightInfo[];
  brainRegions: BrainRegion[];
  totalThreats: number;
}

/** Region positions on the SVG brain (cx, cy coordinates in the 400x320 viewBox) */
const REGION_POSITIONS: Record<string, { cx: number; cy: number }> = {
  frontal:    { cx: 120, cy: 100 },
  temporal:   { cx: 200, cy: 220 },
  limbic:     { cx: 200, cy: 150 },
  motor:      { cx: 160, cy: 70 },
  occipital:  { cx: 310, cy: 130 },
  cerebellum: { cx: 320, cy: 220 },
  brainstem:  { cx: 260, cy: 260 },
};

export default function BrainRightsHero({ neurorights, brainRegions, totalThreats }: Props) {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  const activeRegionData = activeRegion ? brainRegions.find(r => r.id === activeRegion) : null;
  const activeRights = activeRegionData
    ? neurorights.filter(nr => activeRegionData.neurorights.includes(nr.id))
    : [];

  return (
    <div className="relative">
      {/* Brain SVG */}
      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        <div className="w-full max-w-md mx-auto lg:mx-0 flex-shrink-0">
          <svg
            viewBox="0 0 400 320"
            className="w-full h-auto"
            role="img"
            aria-label="Simplified brain diagram showing regions protected by neurorights"
          >
            {/* Brain outline — simplified lateral view */}
            <path
              d="M80,160 C80,80 120,30 180,30 C220,30 260,40 290,60 C330,85 350,110 350,150 C350,180 340,200 320,220 C310,232 310,250 300,265 C285,285 260,290 240,280 C225,273 215,260 200,255 C185,250 170,255 155,260 C130,270 105,265 90,240 C82,228 78,210 78,190 C78,175 80,168 80,160 Z"
              fill="none"
              stroke="var(--color-text-faint)"
              strokeWidth="1.5"
              opacity="0.4"
            />

            {/* Cerebral folds — subtle sulcus lines */}
            <path d="M140,60 C160,80 180,75 200,85" fill="none" stroke="var(--color-text-faint)" strokeWidth="0.8" opacity="0.2" />
            <path d="M120,100 C150,95 180,105 220,95" fill="none" stroke="var(--color-text-faint)" strokeWidth="0.8" opacity="0.2" />
            <path d="M100,140 C140,130 180,140 230,130" fill="none" stroke="var(--color-text-faint)" strokeWidth="0.8" opacity="0.2" />
            <path d="M130,175 C170,170 200,180 240,170" fill="none" stroke="var(--color-text-faint)" strokeWidth="0.8" opacity="0.2" />

            {/* Central sulcus (motor/sensory divide) */}
            <path d="M170,45 C175,80 165,120 170,160" fill="none" stroke="var(--color-text-faint)" strokeWidth="1" opacity="0.3" />

            {/* Lateral sulcus (Sylvian fissure) */}
            <path d="M140,170 C170,160 200,170 240,155" fill="none" stroke="var(--color-text-faint)" strokeWidth="1" opacity="0.3" />

            {/* Cerebellum outline */}
            <path
              d="M280,210 C300,200 340,210 340,230 C340,250 310,265 290,260 C270,255 260,240 270,225 Z"
              fill="none"
              stroke="var(--color-text-faint)"
              strokeWidth="1"
              opacity="0.3"
            />

            {/* Brainstem */}
            <path
              d="M250,240 C255,250 260,265 255,280 C250,290 240,295 235,290 C230,280 240,265 245,250 Z"
              fill="none"
              stroke="var(--color-text-faint)"
              strokeWidth="1"
              opacity="0.3"
            />

            {/* Region hotspots */}
            {brainRegions.map(region => {
              const pos = REGION_POSITIONS[region.id];
              if (!pos) return null;
              const isActive = activeRegion === region.id;
              const regionRights = neurorights.filter(nr => region.neurorights.includes(nr.id));
              const primaryColor = regionRights.length > 0 ? regionRights[0].color : '#94a3b8';

              return (
                <g
                  key={region.id}
                  onMouseEnter={() => setActiveRegion(region.id)}
                  onMouseLeave={() => setActiveRegion(null)}
                  onFocus={() => setActiveRegion(region.id)}
                  onBlur={() => setActiveRegion(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${region.name}: ${region.description}. Protected by ${regionRights.map(r => r.name).join(', ')}`}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Pulse ring */}
                  <circle
                    cx={pos.cx}
                    cy={pos.cy}
                    r={isActive ? 22 : 16}
                    fill={primaryColor}
                    opacity={isActive ? 0.15 : 0.08}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  {isActive && (
                    <circle
                      cx={pos.cx}
                      cy={pos.cy}
                      r={28}
                      fill="none"
                      stroke={primaryColor}
                      strokeWidth="1"
                      opacity="0.3"
                    >
                      <animate attributeName="r" from="22" to="32" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Dot */}
                  <circle
                    cx={pos.cx}
                    cy={pos.cy}
                    r={isActive ? 6 : 4}
                    fill={primaryColor}
                    opacity={isActive ? 1 : 0.7}
                    style={{ transition: 'all 0.2s ease' }}
                  />
                  {/* Label */}
                  <text
                    x={pos.cx}
                    y={pos.cy - 12}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight={isActive ? '600' : '400'}
                    fill="var(--color-text-muted)"
                    opacity={isActive ? 1 : 0.6}
                    style={{ transition: 'opacity 0.2s ease', fontFamily: 'var(--font-body)' }}
                  >
                    {region.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Info panel */}
        <div className="flex-1 min-w-0">
          {activeRegionData ? (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <p
                className="text-xs font-medium tracking-widest uppercase mb-2"
                style={{ color: 'var(--color-text-faint)' }}
              >
                Brain Region
              </p>
              <h3
                className="text-xl font-bold mb-1"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}
              >
                {activeRegionData.name}
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                {activeRegionData.description}
              </p>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-faint)' }}>
                {activeRegionData.threatCount} techniques target this region
              </p>
              <div className="flex flex-wrap gap-2">
                {activeRights.map(nr => (
                  <span
                    key={nr.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: `${nr.color}15`,
                      color: nr.color,
                      border: `1px solid ${nr.color}30`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: nr.color }}
                    />
                    {nr.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p
                className="text-sm"
                style={{ color: 'var(--color-text-faint)' }}
              >
                Hover over a brain region to see which neurorights protect it and how many attack techniques target it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
