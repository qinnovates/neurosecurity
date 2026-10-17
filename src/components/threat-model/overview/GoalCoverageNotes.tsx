import { EFFECT_LABELS } from '@/lib/threat-model/lab-terms';
import { THREAT_GOALS, type ThreatGoal } from '@/lib/threat-model/report-types';
import { NONE_ON_DEVICE_LABEL, describeTermCounts, hasPlacementDecision, type TermCounts } from '../frame/scope-by-kind';

interface Props {
  /** The catalog's techniques of each effect, under the four scope terms. */
  scopeByGoal: Record<ThreatGoal, TermCounts>;
  /** Catalog rows on this device by effect, open or decided. */
  catalogRowsByGoal: Record<ThreatGoal, number>;
}

function countDecided(counts: TermCounts): number {
  return counts.applies + counts.would_apply_if + counts.reviewed_outside;
}

function countAll(counts: TermCounts): number {
  return countDecided(counts) + counts.not_assessed;
}

/**
 * For each effect with a technique nobody has assessed: how far the placement decisions have
 * got. Where the device has no row of that effect, the note says where its techniques stand:
 * "not assessed" is said only of an effect with no placement decision at all.
 */
export default function GoalCoverageNotes({ scopeByGoal, catalogRowsByGoal }: Props) {
  const incompleteGoals = THREAT_GOALS.filter((goal) => scopeByGoal[goal].not_assessed > 0);
  return (
    <>
      {incompleteGoals.map((goal) => {
        const counts = scopeByGoal[goal];
        if (catalogRowsByGoal[goal] === 0 && hasPlacementDecision(counts)) {
          return <p key={goal} className="lab-soft"><strong>{EFFECT_LABELS[goal]}: {NONE_ON_DEVICE_LABEL}.</strong> {describeTermCounts(counts)}.</p>;
        }
        return (
          <p key={goal} className="lab-soft">
            {catalogRowsByGoal[goal] === 0
              ? <strong>{EFFECT_LABELS[goal]} is not assessed, which is not the same as no risk.</strong>
              : <strong>{EFFECT_LABELS[goal]}.</strong>}{' '}
            {countDecided(counts)} of the catalog&rsquo;s {countAll(counts)} techniques of this kind{' '}
            {countDecided(counts) === 1 ? 'has' : 'have'} a placement decision.
          </p>
        );
      })}
    </>
  );
}
