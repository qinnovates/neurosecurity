import { useId } from 'react';

const SWATCH_PX = 12;
/** Distance between hatch lines, in pixels. */
const HATCH_PITCH = 4;

interface PatternProps {
  id: string;
}

/** Diagonal 1px lines in the text colour. The only pattern in the system; it always means "not assessed". */
function HatchPattern({ id }: PatternProps) {
  return (
    <pattern id={id} width={HATCH_PITCH} height={HATCH_PITCH} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0.5" y1="0" x2="0.5" y2={HATCH_PITCH} stroke="currentColor" strokeWidth="1" />
    </pattern>
  );
}

/** Fills whatever holds it with the hatch: a bar segment, a table cell's swatch. */
export function HatchFill() {
  const patternId = useId();
  return (
    <svg aria-hidden="true" focusable="false" preserveAspectRatio="none">
      <defs><HatchPattern id={patternId} /></defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

interface Props {
  /** Accessible name. Leave out when the words "not assessed" are beside the swatch. */
  label?: string;
}

/** A small hatched square that goes before the words "not assessed". The hatch is never drawn behind text. */
export default function HatchSwatch({ label }: Props) {
  const patternId = useId();
  return (
    <svg
      className="lab-hatch-swatch" width={SWATCH_PX} height={SWATCH_PX} viewBox={`0 0 ${SWATCH_PX} ${SWATCH_PX}`} focusable="false"
      role={label === undefined ? undefined : 'img'} aria-label={label} aria-hidden={label === undefined ? true : undefined}
    >
      <defs><HatchPattern id={patternId} /></defs>
      <rect x="0.5" y="0.5" width="11" height="11" fill={`url(#${patternId})`} stroke="currentColor" />
    </svg>
  );
}
