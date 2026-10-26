/**
 * The fills a radar draws, as data rather than as repeated SVG.
 *
 * Severity is carried by how much ink a fill lays down, not only by its hue:
 * the five tones are a strictly increasing ramp of coverage, so the order
 * survives greyscale, a colour-vision difference and a printer. `inkCoverage`
 * measures that, and the test holds the ramp to it.
 *
 * The withheld fill is a separate thing, not a sixth tone. It means "nothing is
 * plotted here", it is the only fill drawn across the whole plot area, and it is
 * never drawn with a polygon. A measured floor and an absence of measurement
 * must not share a shape.
 */

export const RADAR_TONES = ['none', 'low', 'medium', 'high', 'critical'] as const;
/** The five severity words NISS uses. `neutral` is deliberately absent: a count is not a severity, so a chart of counts draws with `countTone`. */
export type RadarTone = typeof RADAR_TONES[number];

/** A chart of counts is not a chart of severity. It draws in ink, at the coverage of the lowest tone. */
export const COUNT_TONE = 'count';
export type RadarFillKind = RadarTone | typeof COUNT_TONE;

export type PatternMark =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; width: number }
  | { kind: 'dot'; cx: number; cy: number; radius: number };

export interface PatternSpec {
  /** The tile is square, in user units of the chart's own viewBox. */
  tile: number;
  marks: readonly PatternMark[];
}

const DOTS = (radius: number, tile: number): PatternSpec => ({ tile, marks: [{ kind: 'dot', cx: tile / 2, cy: tile / 2, radius }] });

/**
 * Five fills whose ink rises with severity: sparse dots, dense dots, one
 * diagonal, a cross, then a cross with both diagonals through it.
 */
export const TONE_PATTERNS: Record<RadarTone, PatternSpec> = {
  none: DOTS(0.55, 6),
  low: DOTS(1.2, 6),
  medium: { tile: 6, marks: [{ kind: 'line', x1: 0, y1: 6, x2: 6, y2: 0, width: 0.9 }] },
  high: {
    tile: 6,
    marks: [
      { kind: 'line', x1: 0, y1: 3, x2: 6, y2: 3, width: 0.9 },
      { kind: 'line', x1: 3, y1: 0, x2: 3, y2: 6, width: 0.9 },
    ],
  },
  critical: {
    tile: 4,
    marks: [
      { kind: 'line', x1: 0, y1: 2, x2: 4, y2: 2, width: 0.8 },
      { kind: 'line', x1: 2, y1: 0, x2: 2, y2: 4, width: 0.8 },
      { kind: 'line', x1: 0, y1: 0, x2: 4, y2: 4, width: 0.6 },
      { kind: 'line', x1: 0, y1: 4, x2: 4, y2: 0, width: 0.6 },
    ],
  },
};

/** The fill for a chart of counts: the lowest tone's ink, so nothing about it reads as a severity. */
export const COUNT_PATTERN: PatternSpec = TONE_PATTERNS.none;

/**
 * "Nothing is plotted": the hatch this codebase already uses for "not
 * assessed" (`lab-kit/HatchSwatch`), at the same pitch and angle. Keeping the
 * one meaning for the one mark is why it is a single forward diagonal, which no
 * tone uses.
 */
export const WITHHELD_PATTERN: PatternSpec = {
  tile: 4,
  marks: [{ kind: 'line', x1: 0, y1: 0, x2: 4, y2: 4, width: 1 }],
};

export function patternFor(kind: RadarFillKind): PatternSpec {
  return kind === COUNT_TONE ? COUNT_PATTERN : TONE_PATTERNS[kind];
}

/** How far along the tile edge `samples` sampling points sit. Sampling, not arithmetic, so overlapping marks are counted once. */
const COVERAGE_SAMPLES = 160;

function distanceToSegment(x: number, y: number, mark: Extract<PatternMark, { kind: 'line' }>): number {
  const dx = mark.x2 - mark.x1;
  const dy = mark.y2 - mark.y1;
  const lengthSquared = dx * dx + dy * dy;
  const alongShare = lengthSquared === 0 ? 0 : Math.min(Math.max(((x - mark.x1) * dx + (y - mark.y1) * dy) / lengthSquared, 0), 1);
  return Math.hypot(x - (mark.x1 + alongShare * dx), y - (mark.y1 + alongShare * dy));
}

function isInked(x: number, y: number, spec: PatternSpec): boolean {
  return spec.marks.some((mark) =>
    mark.kind === 'dot' ? Math.hypot(x - mark.cx, y - mark.cy) <= mark.radius : distanceToSegment(x, y, mark) <= mark.width / 2,
  );
}

/**
 * The share of one tile the fill covers, from 0 to 1, measured by sampling.
 * It is the greyscale channel the severity order is carried on, so the test
 * reads it rather than trusting the drawings to look ordered.
 */
export function inkCoverage(spec: PatternSpec): number {
  let inked = 0;
  for (let row = 0; row < COVERAGE_SAMPLES; row += 1) {
    for (let column = 0; column < COVERAGE_SAMPLES; column += 1) {
      const x = ((column + 0.5) * spec.tile) / COVERAGE_SAMPLES;
      const y = ((row + 0.5) * spec.tile) / COVERAGE_SAMPLES;
      if (isInked(x, y, spec)) inked += 1;
    }
  }
  return inked / (COVERAGE_SAMPLES * COVERAGE_SAMPLES);
}

/** One mark as an SVG element's attributes, for the component that draws the `<pattern>`. */
export function markPath(mark: PatternMark): string {
  return mark.kind === 'dot'
    ? `M ${mark.cx - mark.radius} ${mark.cy} a ${mark.radius} ${mark.radius} 0 1 0 ${mark.radius * 2} 0 a ${mark.radius} ${mark.radius} 0 1 0 ${-mark.radius * 2} 0`
    : `M ${mark.x1} ${mark.y1} L ${mark.x2} ${mark.y2}`;
}
