import { HatchFill } from './HatchSwatch';

/** How a share is drawn: filled ink, a lighter fill, outline only, or the hatch that means "not assessed". */
export type SplitBarKind = 'solid' | 'soft' | 'open' | 'hatch';

export interface SplitBarSegment {
  id: string;
  label: string;
  count: number;
  kind: SplitBarKind;
}

interface Props {
  /** What is being counted, for the accessible summary: "catalog techniques". */
  subject: string;
  segments: readonly SplitBarSegment[];
  /** Replaces the generated accessible summary when the caller has exact words for it. */
  summary?: string;
  /** Leave out the printed list where the integers are already printed beside the bar. */
  isListHidden?: boolean;
}

function describeSplit(subject: string, segments: readonly SplitBarSegment[]): string {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  if (total === 0) return `No ${subject}.`;
  return `${total} ${subject}: ${segments.map((segment) => `${segment.count} ${segment.label}`).join(', ')}.`;
}

/**
 * One set split into shares, drawn as a stacked bar with every integer printed beneath it.
 * When the set changes each share grows or shrinks from its old width to its new one in a
 * single move; the integers swap at once.
 */
export default function SplitBar({ subject, segments, summary, isListHidden = false }: Props) {
  return (
    <div className="lab-splitbar">
      <div className="lab-splitbar-track" role="img" aria-label={summary ?? describeSplit(subject, segments)}>
        {segments.map((segment) => (
          <span key={segment.id} className="lab-splitbar-segment" data-kind={segment.kind} data-empty={segment.count === 0} style={{ flexGrow: segment.count }}>
            {segment.kind === 'hatch' && segment.count > 0 && <HatchFill />}
          </span>
        ))}
      </div>
      {!isListHidden && (
        <dl className="lab-splitbar-list">
          {segments.map((segment) => (
            <div key={segment.id} style={{ display: 'contents' }}>
              <dt>
                <span className="lab-figure lab-splitbar-count">{segment.count}</span>
                <span className="lab-splitbar-key" data-kind={segment.kind} aria-hidden="true">{segment.kind === 'hatch' && <HatchFill />}</span>
              </dt>
              <dd>{segment.label}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
