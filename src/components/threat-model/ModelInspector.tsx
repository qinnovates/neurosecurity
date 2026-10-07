import type { ReactNode } from 'react';
import CoverageMeter from '@/components/lab-kit/CoverageMeter';
import Panel from '@/components/lab-kit/Panel';
import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import type { PlacementCoverage } from '@/lib/threat-model/placement-coverage';
import type { ElementOutcome, GoalCoverage, ThreatGoal } from '@/lib/threat-model/report-types';
import ElementPanel from './ElementPanel';
import { GOAL_LABELS } from './LensBar';

interface Props {
  coverage: PlacementCoverage;
  /** Goals whose zero means "not assessed"; each gets a sentence saying how far the placement table has got. */
  notAssessedGoals: readonly ThreatGoal[];
  goalCoverage: Record<ThreatGoal, GoalCoverage>;
  /** The selected part and what was placed on it, or null when the whole device is shown. */
  selected: { label: string; outcome: ElementOutcome } | null;
  techniqueById: ReadonlyMap<string, CatalogTechnique>;
  /** The opened risk, shown under coverage so coverage never leaves the screen. */
  children?: ReactNode;
}

/** Beside the work at all times: how much of the catalog has been assessed, and why techniques sit on the selected part. */
export default function ModelInspector({ coverage, notAssessedGoals, goalCoverage, selected, techniqueById, children }: Props) {
  return (
    <>
      <Panel title="Coverage on this device">
        <CoverageMeter coverage={coverage} isForDevice />
        {notAssessedGoals.map((goal) => (
          <p key={goal} className="lab-soft model-inspector-note">
            <strong>{GOAL_LABELS[goal]} is not assessed, which is not the same as no risk.</strong>{' '}
            {goalCoverage[goal].placedTechniques} of the catalog&rsquo;s {goalCoverage[goal].catalogTechniques} techniques of this kind{' '}
            {goalCoverage[goal].placedTechniques === 1 ? 'has' : 'have'} a placement decision.
            The rest have theoretical or emerging evidence, or act without passing through a device.
          </p>
        ))}
      </Panel>
      {children}
      <Panel title="Selected part">
        {selected === null
          ? <p className="lab-soft">Select a part or a connection on the diagram to see what is placed on it and why.</p>
          : <ElementPanel elementLabel={selected.label} outcome={selected.outcome} techniqueById={techniqueById} />}
      </Panel>
    </>
  );
}
