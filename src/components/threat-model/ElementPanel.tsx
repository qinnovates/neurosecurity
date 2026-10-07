import EvidenceMark from '@/components/lab-kit/EvidenceMark';
import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import type { ElementOutcome } from '@/lib/threat-model/report-types';

interface Props {
  elementLabel: string;
  outcome: ElementOutcome;
  techniqueById: ReadonlyMap<string, CatalogTechnique>;
}

/** Explains, for one component or link, what was placed on it and why, or why nothing was. */
export default function ElementPanel({ elementLabel, outcome, techniqueById }: Props) {
  return (
    <section className="tm-card" aria-live="polite">
      <h3 className="tm-heading">{elementLabel}</h3>
      {outcome.kind === 'matched' && (
        <>
          <p className="tm-muted">{outcome.matches.length} technique{outcome.matches.length === 1 ? '' : 's'} placed here. Each placement states its reason.</p>
          <ul className="tm-list">
            {outcome.matches.map((match) => {
              const technique = techniqueById.get(match.techniqueId);
              return (
                <li key={match.techniqueId}>
                  <strong>{technique?.name ?? match.techniqueId}</strong>{' '}
                  <EvidenceMark tier={technique?.evidenceTier ?? null} status={technique?.evidenceStatus ?? null} />
                  <div className="tm-muted">{match.reasons.map((reason) => reason.detail).join(' ')}</div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {outcome.kind === 'not_applicable' && (
        <>
          <p className="tm-muted">Techniques were considered here and excluded. This is not the same as no threat.</p>
          <ul className="tm-list">
            {outcome.exclusions.map((exclusion) => <li key={`${exclusion.ruleId}-${exclusion.detail}`}>{exclusion.detail}</li>)}
          </ul>
        </>
      )}
      {outcome.kind === 'not_modelled' && (
        <p className="tm-notice">{outcome.detail} Nothing was assessed here; treat it as a gap in this tool, not as an absence of threats.</p>
      )}
    </section>
  );
}
