import HatchSwatch from '@/components/lab-kit/HatchSwatch';
import type { ScopeTerm } from '@/lib/threat-model/lab-terms';

const SIZE = 12;
const INSET = 1;
const INNER = SIZE - 2 * INSET;

interface Props {
  term: ScopeTerm;
}

/**
 * Where a technique stands, as a mark beside its words: a solid square for "applies", a
 * half-filled one for "would apply if", an empty one for "reviewed, outside", and the hatch
 * for "not assessed". Ink only; the words beside it carry the meaning, so it is hidden from
 * assistive technology.
 */
export default function ScopeMark({ term }: Props) {
  if (term === 'not_assessed') return <HatchSwatch />;
  return (
    <svg className="explore-scope-mark" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false" data-term={term}>
      {term === 'applies' && <rect x={INSET} y={INSET} width={INNER} height={INNER} fill="currentColor" />}
      {term === 'would_apply_if' && <rect x={INSET} y={INSET} width={INNER / 2} height={INNER} fill="currentColor" />}
      <rect x={INSET + 0.5} y={INSET + 0.5} width={INNER - 1} height={INNER - 1} fill="none" stroke="currentColor" />
    </svg>
  );
}
