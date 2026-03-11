/**
 * HeatmapMatrix — reusable SVG heatmap grid.
 * Used for Technique x Band and Technique x DSM correlation matrices.
 */

import { useMemo, useState, useCallback } from 'react';
import type { MatrixCell } from './brainmap-utils';
import { getCellValue, getMatrixMax, interpolateHeatColor } from './brainmap-utils';

interface RowDef {
  id: string;
  label: string;
}

interface ColDef {
  id: string;
  label: string;
  color?: string;
}

interface Props {
  title: string;
  rows: RowDef[];
  columns: ColDef[];
  cells: MatrixCell[];
  baseColor: string;
  onCellHover?: (rowId: string, colId: string) => void;
  onCellLeave?: () => void;
}

const CELL_W = 28;
const CELL_H = 20;
const LABEL_W = 120;
const HEADER_H = 60;

export default function HeatmapMatrix({ title, rows, columns, cells, baseColor, onCellHover, onCellLeave }: Props) {
  const [hovered, setHovered] = useState<{ row: string; col: string } | null>(null);

  const maxValue = useMemo(() => getMatrixMax(cells), [cells]);

  const handleEnter = useCallback((rowId: string, colId: string) => {
    setHovered({ row: rowId, col: colId });
    onCellHover?.(rowId, colId);
  }, [onCellHover]);

  const handleLeave = useCallback(() => {
    setHovered(null);
    onCellLeave?.();
  }, [onCellLeave]);

  if (rows.length === 0 || columns.length === 0) return null;

  const svgW = LABEL_W + columns.length * CELL_W + 10;
  const svgH = HEADER_H + rows.length * CELL_H + 10;

  return (
    <div className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
      }}>
      <div className="px-3 py-2 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--color-border)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </span>
        <span className="text-[9px] font-mono" style={{ color: 'var(--color-text-faint)' }}>
          {rows.length} x {columns.length} | max: {maxValue}
        </span>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
        <svg width={svgW} height={svgH} className="block">
          {/* Column headers (rotated) */}
          {columns.map((col, ci) => (
            <text
              key={col.id}
              x={LABEL_W + ci * CELL_W + CELL_W / 2}
              y={HEADER_H - 4}
              textAnchor="end"
              fontSize={8}
              fontFamily="var(--font-mono)"
              fill={hovered?.col === col.id ? (col.color || baseColor) : 'var(--color-text-faint)'}
              transform={`rotate(-45, ${LABEL_W + ci * CELL_W + CELL_W / 2}, ${HEADER_H - 4})`}
            >
              {col.label.length > 8 ? col.label.slice(0, 8) : col.label}
            </text>
          ))}

          {/* Rows */}
          {rows.map((row, ri) => {
            const y = HEADER_H + ri * CELL_H;
            const isRowHovered = hovered?.row === row.id;

            return (
              <g key={row.id}>
                {/* Row label */}
                <text
                  x={LABEL_W - 4}
                  y={y + CELL_H / 2 + 3}
                  textAnchor="end"
                  fontSize={8}
                  fontFamily="var(--font-mono)"
                  fill={isRowHovered ? 'var(--color-text-primary)' : 'var(--color-text-faint)'}
                >
                  {row.label.length > 18 ? row.label.slice(0, 18) + '...' : row.label}
                </text>

                {/* Cells */}
                {columns.map((col, ci) => {
                  const val = getCellValue(cells, row.id, col.id);
                  const x = LABEL_W + ci * CELL_W;
                  const isHovered = hovered?.row === row.id && hovered?.col === col.id;
                  const cellColor = val > 0
                    ? interpolateHeatColor(val, maxValue, col.color || baseColor)
                    : 'transparent';

                  return (
                    <g key={col.id}>
                      <rect
                        x={x + 1} y={y + 1}
                        width={CELL_W - 2} height={CELL_H - 2}
                        rx={2}
                        fill={cellColor}
                        stroke={isHovered ? '#fff' : 'transparent'}
                        strokeWidth={isHovered ? 1.5 : 0}
                        className="cursor-pointer"
                        onMouseEnter={() => handleEnter(row.id, col.id)}
                        onMouseLeave={handleLeave}
                      />
                      {val > 0 && (
                        <text
                          x={x + CELL_W / 2}
                          y={y + CELL_H / 2 + 3}
                          textAnchor="middle"
                          fontSize={8}
                          fontWeight={600}
                          fontFamily="var(--font-mono)"
                          fill={val / maxValue > 0.5 ? '#fff' : 'var(--color-text-muted)'}
                          className="pointer-events-none"
                        >
                          {val}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hovered cell tooltip */}
      {hovered && (() => {
        const val = getCellValue(cells, hovered.row, hovered.col);
        const rowLabel = rows.find(r => r.id === hovered.row)?.label || hovered.row;
        const colLabel = columns.find(c => c.id === hovered.col)?.label || hovered.col;
        if (val === 0) return null;
        return (
          <div className="px-3 py-1.5 text-[10px] font-mono"
            style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
            {rowLabel} x {colLabel}: <span style={{ color: baseColor, fontWeight: 700 }}>{val}</span> chain{val !== 1 ? 's' : ''}
          </div>
        );
      })()}
    </div>
  );
}
