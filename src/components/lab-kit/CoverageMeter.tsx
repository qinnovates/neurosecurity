import type { PlacementCoverage } from '@/lib/threat-model/placement-coverage';
import SplitBar, { type SplitBarSegment } from './SplitBar';

interface Props {
  coverage: PlacementCoverage;
  /** True when the figures describe one device; false when they describe the catalog alone. */
  isForDevice: boolean;
}

function buildSegments(coverage: PlacementCoverage, isForDevice: boolean): SplitBarSegment[] {
  const placedHere: SplitBarSegment = { id: 'placed-here', kind: 'solid', count: coverage.placedHere, label: isForDevice ? 'placed on this device' : 'placed on a device' };
  const placedElsewhere: SplitBarSegment = { id: 'placed-elsewhere', kind: 'soft', count: coverage.placedElsewhere, label: 'placed only on other kinds of device' };
  const notPlaced: SplitBarSegment = { id: 'not-placed', kind: 'open', count: coverage.notPlaced, label: 'not placed, each with a reason' };
  const notAssessed: SplitBarSegment = { id: 'not-assessed', kind: 'hatch', count: coverage.notAssessed, label: 'not assessed' };
  return isForDevice ? [placedHere, placedElsewhere, notPlaced, notAssessed] : [placedHere, notPlaced, notAssessed];
}

/**
 * How much of the catalog has a placement decision. The unassessed share is hatched and
 * named, so the reader never takes a missing technique for a cleared one.
 */
export default function CoverageMeter({ coverage, isForDevice }: Props) {
  const segments = buildSegments(coverage, isForDevice);
  const summary = `Of ${coverage.total} catalog techniques: ${segments.map((segment) => `${segment.count} ${segment.label}`).join(', ')}.`;
  return <SplitBar subject="catalog techniques" segments={segments} summary={summary} />;
}
