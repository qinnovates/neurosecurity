import type { Lens, LensCounts } from '@/lib/threat-model/lens';
import { PLACED_ENTRY_PATHS, type PlacedEntryPath } from '@/lib/threat-model/reference-data-types';
import { THREAT_GOALS, type GoalCoverage, type ThreatGoal } from '@/lib/threat-model/report-types';
import CountUp from './CountUp';

interface Props {
  lens: Lens;
  counts: LensCounts;
  goalCoverage: Record<ThreatGoal, GoalCoverage>;
  /** Label of the selected component or link, or null when the whole device is shown. */
  selectedElementLabel: string | null;
  onChange: (lens: Lens) => void;
}

export const ENTRY_PATH_LABELS: Record<PlacedEntryPath, string> = {
  device_systems: 'Through its systems',
  neural_interface: 'At the neural interface',
  senses: 'Through the senses',
};

export const GOAL_LABELS: Record<ThreatGoal, string> = {
  read: 'Read',
  change: 'Change',
  deny: 'Deny',
};

function toggle<Value>(values: readonly Value[], value: Value): Value[] {
  return values.includes(value) ? values.filter((existing) => existing !== value) : [...values, value];
}

/**
 * The lenses over the device's risks. Each button shows how many open risks it would
 * leave on screen, so the bar doubles as a triage summary.
 */
export default function LensBar({ lens, counts, goalCoverage, selectedElementLabel, onChange }: Props) {
  const isNarrowed = lens.elementId !== null || lens.entryPaths.length > 0 || lens.goals.length > 0;
  // A zero across the whole device is the misleading case: it reads as "clean" when it means "not assessed".
  const isWholeDevice = lens.elementId === null && lens.entryPaths.length === 0;
  const emptyGoals = isWholeDevice ? THREAT_GOALS.filter((goal) => counts.byGoal[goal] === 0) : [];
  return (
    <section className="tm-lensbar tm-no-print" aria-label="Lenses on this device's risks">
      <div className="tm-lens" role="group" aria-label="How it gets in">
        <span className="tm-lens-label">How it gets in</span>
        {PLACED_ENTRY_PATHS.map((entryPath) => (
          <button
            key={entryPath} type="button" className="tm-lens-button" aria-pressed={lens.entryPaths.includes(entryPath)}
            onClick={() => onChange({ ...lens, entryPaths: toggle(lens.entryPaths, entryPath) })}
          >
            {ENTRY_PATH_LABELS[entryPath]} <CountUp value={counts.byEntryPath[entryPath]} />
          </button>
        ))}
      </div>
      <div className="tm-lens" role="group" aria-label="What it does">
        <span className="tm-lens-label">What it does</span>
        {THREAT_GOALS.map((goal) => (
          <button
            key={goal} type="button" className="tm-lens-button" aria-pressed={lens.goals.includes(goal)}
            onClick={() => onChange({ ...lens, goals: toggle(lens.goals, goal) })}
          >
            {GOAL_LABELS[goal]} <CountUp value={counts.byGoal[goal]} />
          </button>
        ))}
      </div>
      {selectedElementLabel !== null && (
        <div className="tm-lens" role="group" aria-label="Part of the device">
          <span className="tm-lens-label">Part</span>
          <button type="button" className="tm-lens-button" aria-pressed="true" onClick={() => onChange({ ...lens, elementId: null })}>
            {selectedElementLabel} <span aria-hidden="true">×</span><span className="sr-only"> (clear)</span>
          </button>
        </div>
      )}
      {isNarrowed && (
        <button type="button" className="tm-button" onClick={() => onChange({ elementId: null, entryPaths: [], goals: [] })}>Show everything</button>
      )}
      <span className="tm-muted tm-small">Counts are open risks from the neural technique catalog.</span>
      {emptyGoals.map((goal) => (
        <p key={goal} className="tm-lens-note">
          <strong>{GOAL_LABELS[goal]} shows 0, which means not assessed, not no risk.</strong>{' '}
          {goalCoverage[goal].placedTechniques} of the catalog&rsquo;s {goalCoverage[goal].catalogTechniques} techniques of this kind{' '}
          {goalCoverage[goal].placedTechniques === 1 ? 'has' : 'have'} a placement decision.
          The rest have theoretical or emerging evidence, or act without passing through a device.
        </p>
      ))}
    </section>
  );
}
