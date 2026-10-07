import FilterChip from '@/components/lab-kit/FilterChip';
import type { Lens, LensCounts } from '@/lib/threat-model/lens';
import { PLACED_ENTRY_PATHS, type PlacedEntryPath } from '@/lib/threat-model/reference-data-types';
import { THREAT_GOALS, type GoalCoverage, type ThreatGoal } from '@/lib/threat-model/report-types';

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
 * A zero across the whole device, for a goal the placement table has not fully covered,
 * means "not assessed" and not "none". Narrowed to a part or an entry path, a zero is a real count.
 */
export function isGoalNotAssessed(goal: ThreatGoal, lens: Lens, counts: LensCounts, goalCoverage: Record<ThreatGoal, GoalCoverage>): boolean {
  const isWholeDevice = lens.elementId === null && lens.entryPaths.length === 0;
  return isWholeDevice && counts.byGoal[goal] === 0 && goalCoverage[goal].placedTechniques < goalCoverage[goal].catalogTechniques;
}

/**
 * The lenses over the device's risks. Each one shows how many open risks it would leave
 * on screen, so the bar doubles as a triage summary.
 */
export default function LensBar({ lens, counts, goalCoverage, selectedElementLabel, onChange }: Props) {
  const isNarrowed = lens.elementId !== null || lens.entryPaths.length > 0 || lens.goals.length > 0;
  return (
    <section className="model-lenses tm-no-print" aria-label="Lenses on this device's open risks from the technique catalog">
      <div className="model-lens-group" role="group" aria-label="How it gets in">
        <span className="lab-label">How it gets in</span>
        {PLACED_ENTRY_PATHS.map((entryPath) => (
          <FilterChip
            key={entryPath} label={ENTRY_PATH_LABELS[entryPath]} count={counts.byEntryPath[entryPath]}
            isPressed={lens.entryPaths.includes(entryPath)} onToggle={() => onChange({ ...lens, entryPaths: toggle(lens.entryPaths, entryPath) })}
          />
        ))}
      </div>
      <div className="model-lens-group" role="group" aria-label="What it does">
        <span className="lab-label">What it does</span>
        {THREAT_GOALS.map((goal) => (
          <FilterChip
            key={goal} label={GOAL_LABELS[goal]} count={counts.byGoal[goal]} isNotAssessed={isGoalNotAssessed(goal, lens, counts, goalCoverage)}
            isPressed={lens.goals.includes(goal)} onToggle={() => onChange({ ...lens, goals: toggle(lens.goals, goal) })}
          />
        ))}
      </div>
      {selectedElementLabel !== null && (
        <div className="model-lens-group" role="group" aria-label="Part of the device">
          <span className="lab-label">Part</span>
          <button type="button" className="lab-chip" aria-pressed="true" onClick={() => onChange({ ...lens, elementId: null })}>
            {selectedElementLabel} <span aria-hidden="true">×</span><span className="sr-only"> (clear)</span>
          </button>
        </div>
      )}
      {isNarrowed && (
        <button type="button" className="tm-button" onClick={() => onChange({ elementId: null, entryPaths: [], goals: [] })}>Show everything</button>
      )}
    </section>
  );
}
