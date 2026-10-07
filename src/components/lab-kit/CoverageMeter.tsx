import type { PlacementCoverage } from '@/lib/threat-model/placement-coverage';

type SegmentKind = 'solid' | 'soft' | 'open' | 'hatch';

interface Segment {
  kind: SegmentKind;
  count: number;
  label: string;
}

interface Props {
  coverage: PlacementCoverage;
  /** True when the figures describe one device; false when they describe the catalog alone. */
  isForDevice: boolean;
}

function buildSegments(coverage: PlacementCoverage, isForDevice: boolean): Segment[] {
  return [
    { kind: 'solid', count: coverage.placedHere, label: isForDevice ? 'placed on this device' : 'placed on a device' },
    { kind: 'soft', count: coverage.placedElsewhere, label: 'placed only on other kinds of device' },
    { kind: 'open', count: coverage.notPlaced, label: 'not placed, each with a reason' },
    { kind: 'hatch', count: coverage.notAssessed, label: 'not assessed' },
  ];
}

/**
 * How much of the catalog has a placement decision. The unassessed share is hatched and
 * named, so the reader never takes a missing technique for a cleared one.
 */
export default function CoverageMeter({ coverage, isForDevice }: Props) {
  const segments = buildSegments(coverage, isForDevice).filter((segment) => isForDevice || segment.kind !== 'soft');
  const summary = segments.map((segment) => `${segment.count} ${segment.label}`).join(', ');
  return (
    <div>
      <div className="lab-meter-bar" role="img" aria-label={`Of ${coverage.total} catalog techniques: ${summary}.`}>
        {segments.filter((segment) => segment.count > 0).map((segment) => (
          <span
            key={segment.kind} className={`lab-meter-segment${segment.kind === 'hatch' ? ' lab-hatch' : ''}`}
            data-kind={segment.kind} style={{ flexGrow: segment.count, flexBasis: 0 }}
          />
        ))}
      </div>
      <dl className="lab-meter-legend">
        {segments.map((segment) => (
          <div key={segment.kind} style={{ display: 'contents' }}>
            <dt className="lab-figure">{segment.count}</dt>
            <dd>{segment.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
