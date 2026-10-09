import { EFFECT_LABELS } from '@/lib/threat-model/lab-terms';
import { THREAT_GOALS, type GoalCoverage, type ThreatGoal } from '@/lib/threat-model/report-types';

interface Props {
  goalCoverage: Record<ThreatGoal, GoalCoverage>;
  /** Catalog rows on this device by effect, open or decided. */
  catalogRowsByGoal: Record<ThreatGoal, number>;
}

/**
 * For each effect whose techniques are not all placed: how far the placement table has got.
 * Where the device has no row of that effect, it says that this is not the same as no risk.
 */
export default function GoalCoverageNotes({ goalCoverage, catalogRowsByGoal }: Props) {
  const incompleteGoals = THREAT_GOALS.filter((goal) => goalCoverage[goal].isIncomplete);
  return (
    <>
      {incompleteGoals.map((goal) => (
        <p key={goal} className="lab-soft">
          {catalogRowsByGoal[goal] === 0
            ? <strong>{EFFECT_LABELS[goal]} is not assessed, which is not the same as no risk.</strong>
            : <strong>{EFFECT_LABELS[goal]}.</strong>}{' '}
          {goalCoverage[goal].placedTechniques} of the catalog&rsquo;s {goalCoverage[goal].catalogTechniques} techniques of this kind{' '}
          {goalCoverage[goal].placedTechniques === 1 ? 'has' : 'have'} a placement decision.
        </p>
      ))}
    </>
  );
}
