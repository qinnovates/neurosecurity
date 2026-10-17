import type { ScopeChange } from '@/lib/threat-model/scope-statement';

interface Props {
  /** Null before the first edit; empty when the last edit moved no technique. */
  changes: readonly ScopeChange[] | null;
}

const DIRECTION_LABELS: Readonly<Record<ScopeChange['direction'], string>> = { arrived: 'Arrived', left: 'Left' };
/** Lines shown before the rest fold away, so a change that moves many techniques does not bury the form. */
const SHOWN_AT_ONCE = 4;

function ChangeLine({ change }: { change: ScopeChange }) {
  return (
    <li>
      <strong>{DIRECTION_LABELS[change.direction]}:</strong> <span className="lab-id">{change.techniqueId}</span> {change.name}.{' '}
      <span className="lab-soft">{change.reason}</span>
      {change.direction === 'left' && change.conditions.map((condition) => (
        <span key={condition.ruleId} className="lab-soft"> It applies again when: {condition.restoringAnswer}</span>
      ))}
    </li>
  );
}

/** What the last edit did to the list of techniques that apply, and why, in the engine's own words. */
export default function ScopeChangeList({ changes }: Props) {
  if (changes === null) return null;
  const arrivedCount = changes.filter((change) => change.direction === 'arrived').length;
  const leftCount = changes.length - arrivedCount;
  const first = changes.slice(0, SHOWN_AT_ONCE);
  const rest = changes.slice(SHOWN_AT_ONCE);
  return (
    <section className="lab-editor-outcome" role="status" aria-label="What the last change did">
      {changes.length === 0
        ? <p>The last change did not add or remove any technique.</p>
        : <p>The last change: <strong>{arrivedCount}</strong> arrived, <strong>{leftCount}</strong> left the techniques that apply.</p>}
      {first.length > 0 && <ul className="lab-editor-list">{first.map((change) => <ChangeLine key={change.techniqueId} change={change} />)}</ul>}
      {rest.length > 0 && (
        <details>
          <summary>Show the other {rest.length}</summary>
          <ul className="lab-editor-list">{rest.map((change) => <ChangeLine key={change.techniqueId} change={change} />)}</ul>
        </details>
      )}
    </section>
  );
}
