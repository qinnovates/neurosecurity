/**
 * A set split into up to five shares, for splits the kit's SplitBar has too few fills for
 * (four severities, four decisions). It never uses the hatch: that means "not assessed".
 */

export type StackTone = 'critical' | 'strong' | 'medium' | 'light' | 'open';

export interface StackSegment {
  id: string;
  label: string;
  count: number;
  tone: StackTone;
}

interface Props {
  /** What is being counted, for the accessible summary: "open rows". */
  subject: string;
  segments: readonly StackSegment[];
  /** How many of the set the segments leave out, drawn as empty track after them. Leave out when the segments are the whole set. */
  remainder?: number;
}

function describeStack(subject: string, segments: readonly StackSegment[]): string {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  if (total === 0) return `No ${subject}.`;
  return `${total} ${subject}: ${segments.map((segment) => `${segment.count} ${segment.label}`).join(', ')}.`;
}

/** The swatch that explains a tone in a legend or a column head. */
export function StackKey({ tone }: { tone: StackTone }) {
  return <span className="model-stackbar-key" data-tone={tone} aria-hidden="true" />;
}

/** When the set changes each share moves from its old width to its new one once; the integers beside it swap at once. */
export default function StackBar({ subject, segments, remainder = 0 }: Props) {
  return (
    <div className="model-stackbar" role="img" aria-label={describeStack(subject, segments)}>
      {segments.map((segment) => (
        <span key={segment.id} className="model-stackbar-segment" data-tone={segment.tone} data-empty={segment.count === 0} style={{ flexGrow: segment.count }} />
      ))}
      <span className="model-stackbar-segment" data-tone="rest" data-empty={remainder === 0} style={{ flexGrow: remainder }} />
    </div>
  );
}
