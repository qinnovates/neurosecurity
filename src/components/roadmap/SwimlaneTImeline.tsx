import { useState, useRef, useEffect, useMemo } from 'react';

export interface TimelineMilestone {
  date: string;
  type: 'discovery' | 'release' | 'validation' | 'milestone';
  title: string;
  description: string;
  stats_snapshot?: Record<string, number | string>;
}

interface Props {
  milestones: TimelineMilestone[];
}

const LANE_COLORS: Record<string, string> = {
  discovery: '#d97706',
  release: '#2563eb',
  validation: '#10b981',
  milestone: '#7c3aed',
};

const LANE_ORDER = ['discovery', 'release', 'validation', 'milestone'] as const;
const LANE_LABELS: Record<string, string> = {
  discovery: 'Discovery',
  release: 'Release',
  validation: 'Validation',
  milestone: 'Milestone',
};

const DOT_RADIUS = 7;
const DOT_RADIUS_LARGE = 9;
const LANE_HEIGHT = 52;
const HEADER_WIDTH = 100;
const PADDING_LEFT = 24;
const PADDING_RIGHT = 40;
const TOP_PAD = 16;
const AXIS_HEIGHT = 32;
const MIN_PX_PER_DAY = 18;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SwimlaneTImeline({ milestones }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<TimelineMilestone | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute date range
  const { startDate, endDate, daySpan } = useMemo(() => {
    const dates = milestones.map(m => new Date(m.date + 'T00:00:00').getTime());
    const min = Math.min(...dates);
    const max = Math.max(...dates);
    const s = new Date(min);
    s.setDate(s.getDate() - 2);
    const e = new Date(max);
    e.setDate(e.getDate() + 3);
    const span = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
    return { startDate: s, endDate: e, daySpan: span };
  }, [milestones]);

  const timelineWidth = Math.max(daySpan * MIN_PX_PER_DAY, 800);
  const totalHeight = TOP_PAD + LANE_ORDER.length * LANE_HEIGHT + AXIS_HEIGHT;

  function dateToX(dateStr: string): number {
    const d = new Date(dateStr + 'T00:00:00').getTime();
    const frac = (d - startDate.getTime()) / (endDate.getTime() - startDate.getTime());
    return PADDING_LEFT + frac * (timelineWidth - PADDING_LEFT - PADDING_RIGHT);
  }

  function laneY(type: string): number {
    const idx = LANE_ORDER.indexOf(type as any);
    return TOP_PAD + idx * LANE_HEIGHT + LANE_HEIGHT / 2;
  }

  // Generate axis ticks: weekly markers
  const axisTicks = useMemo(() => {
    const ticks: { date: string; x: number }[] = [];
    const cur = new Date(startDate);
    // Align to Monday
    cur.setDate(cur.getDate() + ((8 - cur.getDay()) % 7));
    while (cur <= endDate) {
      const ds = cur.toISOString().slice(0, 10);
      ticks.push({ date: ds, x: dateToX(ds) });
      cur.setDate(cur.getDate() + 7);
    }
    return ticks;
  }, [startDate, endDate, timelineWidth]);

  // Today marker
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayX = dateToX(todayStr);
  const showToday = todayX >= PADDING_LEFT && todayX <= timelineWidth - PADDING_RIGHT;

  // Scroll to end on mount (most recent activity)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        {LANE_ORDER.map(lane => (
          <div key={lane} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              backgroundColor: LANE_COLORS[lane],
            }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{LANE_LABELS[lane]}</span>
          </div>
        ))}
        <span style={{ fontSize: 12, color: 'var(--color-text-faint)', marginLeft: 'auto' }}>
          {milestones.length} milestones
        </span>
      </div>

      {/* Scrollable timeline */}
      <div
        ref={scrollRef}
        style={{
          overflowX: 'auto',
          position: 'relative',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-deep)',
        }}
      >
        <div style={{ display: 'flex', minWidth: HEADER_WIDTH + timelineWidth }}>
          {/* Lane labels (sticky) */}
          <div style={{
            position: 'sticky', left: 0, zIndex: 10,
            width: HEADER_WIDTH, flexShrink: 0,
            backgroundColor: 'var(--color-bg-surface)',
            borderRight: '1px solid var(--color-border)',
          }}>
            {LANE_ORDER.map((lane, i) => (
              <div key={lane} style={{
                height: LANE_HEIGHT,
                display: 'flex', alignItems: 'center',
                paddingLeft: 12,
                marginTop: i === 0 ? TOP_PAD : 0,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: LANE_COLORS[lane],
                }}>
                  {LANE_LABELS[lane]}
                </span>
              </div>
            ))}
            <div style={{ height: AXIS_HEIGHT }} />
          </div>

          {/* SVG timeline area */}
          <svg
            width={timelineWidth}
            height={totalHeight}
            style={{ display: 'block' }}
          >
            {/* Lane row backgrounds */}
            {LANE_ORDER.map((lane, i) => (
              <rect
                key={lane}
                x={0}
                y={TOP_PAD + i * LANE_HEIGHT}
                width={timelineWidth}
                height={LANE_HEIGHT}
                fill={i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
              />
            ))}

            {/* Lane horizontal lines */}
            {LANE_ORDER.map((lane, i) => (
              <line
                key={lane + '-line'}
                x1={PADDING_LEFT}
                y1={laneY(lane)}
                x2={timelineWidth - PADDING_RIGHT}
                y2={laneY(lane)}
                stroke="var(--color-border)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ))}

            {/* Axis ticks */}
            {axisTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={tick.x} y1={TOP_PAD}
                  x2={tick.x} y2={TOP_PAD + LANE_ORDER.length * LANE_HEIGHT}
                  stroke="var(--color-border)"
                  strokeWidth={0.5}
                  strokeDasharray="2 4"
                />
                <text
                  x={tick.x}
                  y={TOP_PAD + LANE_ORDER.length * LANE_HEIGHT + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--color-text-faint)"
                  fontFamily="var(--font-mono)"
                >
                  {formatDate(tick.date)}
                </text>
              </g>
            ))}

            {/* Today marker */}
            {showToday && (
              <g>
                <line
                  x1={todayX} y1={TOP_PAD - 4}
                  x2={todayX} y2={TOP_PAD + LANE_ORDER.length * LANE_HEIGHT}
                  stroke="var(--color-accent-primary)"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                />
                <text
                  x={todayX}
                  y={TOP_PAD - 6}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--color-accent-primary)"
                  fontWeight={600}
                >
                  TODAY
                </text>
              </g>
            )}

            {/* Milestone dots */}
            {milestones.map((m, i) => {
              const x = dateToX(m.date);
              const y = laneY(m.type);
              const hasSnapshot = !!m.stats_snapshot;
              const r = hasSnapshot ? DOT_RADIUS_LARGE : DOT_RADIUS;
              const isHovered = hoveredIdx === i;
              const isSelected = selected === m;
              const color = LANE_COLORS[m.type] || LANE_COLORS.milestone;

              return (
                <g
                  key={i}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setSelected(isSelected ? null : m)}
                >
                  {/* Glow ring on hover/select */}
                  {(isHovered || isSelected) && (
                    <circle
                      cx={x} cy={y} r={r + 4}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      opacity={0.4}
                    />
                  )}
                  <circle
                    cx={x} cy={y} r={r}
                    fill={color}
                    opacity={isHovered || isSelected ? 1 : 0.85}
                  />
                  {hasSnapshot && (
                    <circle
                      cx={x} cy={y} r={3}
                      fill="white"
                      opacity={0.6}
                    />
                  )}

                  {/* Tooltip on hover */}
                  {isHovered && !isSelected && (
                    <g>
                      <rect
                        x={x - 100} y={y - 42}
                        width={200} height={28}
                        rx={6}
                        fill="var(--color-bg-surface)"
                        stroke="var(--color-border)"
                        strokeWidth={1}
                      />
                      <text
                        x={x} y={y - 30}
                        textAnchor="middle"
                        fontSize={10}
                        fill="var(--color-text-faint)"
                        fontFamily="var(--font-mono)"
                      >
                        {formatDateFull(m.date)}
                      </text>
                      <text
                        x={x} y={y - 19}
                        textAnchor="middle"
                        fontSize={10}
                        fill="var(--color-text-primary)"
                        fontWeight={500}
                      >
                        {m.title.length > 32 ? m.title.slice(0, 30) + '...' : m.title}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{
          marginTop: 12,
          padding: '16px 20px',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-surface)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <span style={{
                display: 'inline-block',
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: LANE_COLORS[selected.type],
                marginRight: 8,
              }}>
                {selected.type}
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>
                {formatDateFull(selected.date)}
              </span>
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-faint)', fontSize: 18, lineHeight: 1,
              }}
            >
              x
            </button>
          </div>
          <h3 style={{
            fontSize: 16, fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 6,
          }}>
            {selected.title}
          </h3>
          <p style={{
            fontSize: 13, lineHeight: 1.6,
            color: 'var(--color-text-muted)',
            margin: 0,
          }}>
            {selected.description}
          </p>
          {selected.stats_snapshot && (
            <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              {Object.entries(selected.stats_snapshot).map(([key, val]) => (
                <div key={key} style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  backgroundColor: 'var(--color-bg-deep)',
                  border: '1px solid var(--color-border)',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: LANE_COLORS[selected.type] }}>
                    {val}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-faint)', marginLeft: 6, textTransform: 'uppercase' }}>
                    {key.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
