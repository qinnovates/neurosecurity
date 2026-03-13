/**
 * VisualCortexDiagram — SVG diagram of the V1-V5 visual processing hierarchy.
 *
 * Shows the two visual streams (ventral "what" / dorsal "where"),
 * retinotopic mapping, and where cortical prosthetics intervene.
 *
 * Sources: Grill-Spector & Malach 2004, Lamme & Roelfsema 2000
 */

import { useState } from 'react';

interface VisualCortexDiagramProps {
  width: number;
  height: number;
  activeRegions: string[];
}

interface Region {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  stream: 'input' | 'ventral' | 'dorsal' | 'both';
  info: string;
}

const REGIONS: Region[] = [
  { id: 'retina', label: 'Retina', x: 50, y: 20, w: 80, h: 32, color: '#4ade80', stream: 'input',
    info: 'Photoreceptors (rods/cones) → ganglion cells. PRIMA targets this layer.' },
  { id: 'lgn', label: 'LGN', x: 50, y: 72, w: 80, h: 32, color: '#60a5fa', stream: 'input',
    info: 'Lateral Geniculate Nucleus (thalamus). Magno/Parvo/Konio pathways split here.' },
  { id: 'v1', label: 'V1', x: 50, y: 130, w: 80, h: 40, color: '#f472b6', stream: 'both',
    info: 'Primary visual cortex. Retinotopic map. Edge detection, orientation, spatial frequency. ALL cortical prostheses target here.' },
  { id: 'v2', label: 'V2', x: 50, y: 190, w: 80, h: 32, color: '#c084fc', stream: 'both',
    info: 'Texture, depth cues, complex contours. Feeds both ventral and dorsal streams.' },
  // Ventral stream (left)
  { id: 'v4', label: 'V4', x: 10, y: 248, w: 70, h: 32, color: '#fb923c', stream: 'ventral',
    info: 'Color, shape, object form. Ventral "what" stream.' },
  { id: 'it', label: 'IT', x: 10, y: 300, w: 70, h: 32, color: '#fbbf24', stream: 'ventral',
    info: 'Inferotemporal cortex. Object recognition, face processing. End of ventral stream.' },
  // Dorsal stream (right)
  { id: 'v3', label: 'V3', x: 100, y: 248, w: 70, h: 32, color: '#38bdf8', stream: 'dorsal',
    info: 'Motion-form integration. Dynamic objects.' },
  { id: 'v5', label: 'V5/MT', x: 100, y: 300, w: 70, h: 32, color: '#22d3ee', stream: 'dorsal',
    info: 'Motion detection, direction selectivity. Dorsal "where/how" stream.' },
];

const CONNECTIONS = [
  { from: 'retina', to: 'lgn', label: 'Optic nerve' },
  { from: 'lgn', to: 'v1', label: 'Optic radiation' },
  { from: 'v1', to: 'v2', label: '' },
  { from: 'v2', to: 'v4', label: 'Ventral' },
  { from: 'v2', to: 'v3', label: 'Dorsal' },
  { from: 'v4', to: 'it', label: '"What"' },
  { from: 'v3', to: 'v5', label: '"Where"' },
];

// Feedback arrows (reentrant processing — Lamme & Roelfsema 2000)
const FEEDBACK = [
  { from: 'v2', to: 'v1', label: 'Feedback' },
  { from: 'v4', to: 'v1', label: '' },
  { from: 'v5', to: 'v1', label: '' },
];

export default function VisualCortexDiagram({
  width,
  height,
  activeRegions,
}: VisualCortexDiagramProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const hovered = REGIONS.find(r => r.id === hoveredRegion);

  const scale = Math.min(width / 180, height / 380);
  const offsetX = (width - 180 * scale) / 2;
  const offsetY = 10;

  function getCenter(id: string): { cx: number; cy: number } {
    const r = REGIONS.find(rg => rg.id === id);
    if (!r) return { cx: 0, cy: 0 };
    return {
      cx: offsetX + (r.x + r.w / 2) * scale,
      cy: offsetY + (r.y + r.h / 2) * scale,
    };
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        {/* Stream labels */}
        <text
          x={offsetX + 30 * scale} y={offsetY + 240 * scale}
          fill="rgba(251,146,60,0.5)" fontSize={9 * scale} textAnchor="middle"
        >
          Ventral
        </text>
        <text
          x={offsetX + 150 * scale} y={offsetY + 240 * scale}
          fill="rgba(56,189,248,0.5)" fontSize={9 * scale} textAnchor="middle"
        >
          Dorsal
        </text>

        {/* Feedforward connections */}
        {CONNECTIONS.map(({ from, to, label }) => {
          const a = getCenter(from);
          const b = getCenter(to);
          return (
            <g key={`${from}-${to}`}>
              <line
                x1={a.cx} y1={a.cy} x2={b.cx} y2={b.cy}
                stroke="rgba(200,200,255,0.3)" strokeWidth={1.5 * scale}
                markerEnd="url(#arrow)"
              />
              {label && (
                <text
                  x={(a.cx + b.cx) / 2 + 4 * scale}
                  y={(a.cy + b.cy) / 2}
                  fill="rgba(200,200,255,0.4)"
                  fontSize={7 * scale}
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {/* Feedback connections (dashed) */}
        {FEEDBACK.map(({ from, to }) => {
          const a = getCenter(from);
          const b = getCenter(to);
          return (
            <line
              key={`fb-${from}-${to}`}
              x1={a.cx + 6 * scale} y1={a.cy}
              x2={b.cx + 6 * scale} y2={b.cy}
              stroke="rgba(244,114,182,0.2)" strokeWidth={1 * scale}
              strokeDasharray={`${3 * scale} ${3 * scale}`}
              markerEnd="url(#arrowPink)"
            />
          );
        })}

        {/* Arrow markers */}
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5"
            markerWidth={4 * scale} markerHeight={4 * scale} orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill="rgba(200,200,255,0.4)" />
          </marker>
          <marker id="arrowPink" viewBox="0 0 10 10" refX="10" refY="5"
            markerWidth={3 * scale} markerHeight={3 * scale} orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill="rgba(244,114,182,0.3)" />
          </marker>
        </defs>

        {/* Regions */}
        {REGIONS.map(r => {
          const isActive = activeRegions.includes(r.id);
          const isHovered = hoveredRegion === r.id;
          const rx = offsetX + r.x * scale;
          const ry = offsetY + r.y * scale;
          const rw = r.w * scale;
          const rh = r.h * scale;

          return (
            <g
              key={r.id}
              onMouseEnter={() => setHoveredRegion(r.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={rx} y={ry} width={rw} height={rh}
                rx={4 * scale}
                fill={isActive ? r.color : isHovered ? r.color + '40' : 'rgba(30,40,60,0.8)'}
                stroke={isActive ? r.color : r.color + '60'}
                strokeWidth={isActive ? 2 * scale : 1 * scale}
                opacity={isActive ? 1 : isHovered ? 0.9 : 0.7}
              />
              <text
                x={rx + rw / 2} y={ry + rh / 2 + 4 * scale}
                textAnchor="middle" fill="#fff"
                fontSize={10 * scale} fontWeight={600}
              >
                {r.label}
              </text>
              {/* Prosthetic intervention marker */}
              {r.id === 'v1' && (
                <text
                  x={rx + rw + 4 * scale} y={ry + rh / 2 + 3 * scale}
                  fill="#f472b6" fontSize={7 * scale}
                >
                  ← implant
                </text>
              )}
              {r.id === 'retina' && (
                <text
                  x={rx + rw + 4 * scale} y={ry + rh / 2 + 3 * scale}
                  fill="#4ade80" fontSize={7 * scale}
                >
                  ← PRIMA
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover info tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          right: 8,
          padding: '6px 10px',
          background: 'rgba(15,20,35,0.95)',
          borderRadius: '0.5rem',
          border: `1px solid ${hovered.color}40`,
          fontSize: 11,
          color: 'rgba(200,210,240,0.9)',
          lineHeight: 1.4,
        }}>
          <strong style={{ color: hovered.color }}>{hovered.label}</strong>
          {' '}{hovered.info}
        </div>
      )}
    </div>
  );
}
