import type { Heading } from './diagram-geometry';
import type { StepMark } from './diagram-types';

/** Distance between hatch lines, in pixels; the same hatch the kit draws for "not assessed". */
const HATCH_PITCH = 4;

/** The pattern behind every "not assessed" swatch in one drawing. Lines take the drawing's text colour. */
export function HatchDefs({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={id} width={HATCH_PITCH} height={HATCH_PITCH} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0.5" y1="0" x2="0.5" y2={HATCH_PITCH} stroke="currentColor" strokeWidth="1" />
      </pattern>
    </defs>
  );
}

const ARROW_SHAPE = 'M -5 0 H 5 M 1.5 -3.5 L 5 0 L 1.5 3.5';
const ARROW_TURN: Readonly<Record<Heading, number>> = { right: 0, down: 90, left: 180, up: 270 };

/** A small arrow centred on the point, turned to the heading. */
export function PayloadArrow({ x, y, heading }: { x: number; y: number; heading: Heading }) {
  return <path className="lab-diagram-arrow" d={ARROW_SHAPE} transform={`translate(${x} ${y}) rotate(${ARROW_TURN[heading]})`} aria-hidden="true" />;
}

const STEP_HEIGHT = 20;
const STEP_CHARACTER_WIDTH = 8;
const STEP_PADDING = 12;

/** The numbers of the chain steps that act on an element, in a pill centred on the point. */
export function StepPill({ x, y, mark }: { x: number; y: number; mark: StepMark }) {
  const width = Math.max(STEP_HEIGHT, mark.text.length * STEP_CHARACTER_WIDTH + STEP_PADDING);
  return (
    <g className="lab-diagram-step" data-step={mark.state} aria-hidden="true">
      <rect x={x - width / 2} y={y - STEP_HEIGHT / 2} width={width} height={STEP_HEIGHT} rx={STEP_HEIGHT / 2} />
      <text x={x} y={y + 4} textAnchor="middle">{mark.text}</text>
    </g>
  );
}
