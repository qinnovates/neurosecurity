import type { NotPlacedCategory } from '@/lib/threat-model/reference-data-types';
import { describeEvidence } from '@/lib/threat-model/evidence-levels';
import { SCOPE_TERM_LABELS } from '@/lib/threat-model/lab-terms';
import type { AmbientThreat, ThemeSummary } from '@/lib/threat-model/report-types';

interface Props {
  ambientThreats: readonly AmbientThreat[];
  themes: readonly ThemeSummary[];
}

const CATEGORY_HEADINGS: Partial<Record<NotPlacedCategory, string>> = {
  external_energy: 'External energy acting on tissue directly',
  consumer_sensor: 'Consumer-device sensors',
  pharmacological: 'Chemical or dietary exposure',
  nanoparticle: 'Nanoparticles introduced into tissue',
};

function AmbientGroup({ category, threats }: { category: NotPlacedCategory; threats: readonly AmbientThreat[] }) {
  if (threats.length === 0) return null;
  return (
    <section className="tm-card">
      <h3 className="tm-heading">{CATEGORY_HEADINGS[category] ?? category} <span className="tm-badge">{threats.length}</span></h3>
      <p className="tm-muted">{threats[0].reason}</p>
      <ul className="tm-list">
        {threats.map((threat) => (
          <li key={threat.techniqueId}>
            {threat.name} <span className="tm-mono tm-muted">{threat.techniqueId}</span> <span className="tm-badge">{describeEvidence(threat).label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * What the device's architecture cannot show: evidenced techniques that reach a person
 * without passing through the device, and subjects the catalog covers only weakly.
 */
export default function BeyondDevice({ ambientThreats, themes }: Props) {
  const categories = Object.keys(CATEGORY_HEADINGS) as NotPlacedCategory[];
  return (
    <div>
      <p className="tm-notice">
        Nothing on this page is part of the device's threat model. These techniques do not pass through the device's components or connections,
        so a design change to the device does not address them. They are listed so the model's edges are visible.
      </p>
      <h2 className="tm-heading">Around the device</h2>
      {categories.map((category) => (
        <AmbientGroup key={category} category={category} threats={ambientThreats.filter((threat) => threat.category === category)} />
      ))}

      <h2 className="tm-heading" style={{ marginTop: '1.5rem' }}>On the horizon</h2>
      <p className="tm-muted" style={{ marginBottom: '0.75rem' }}>
        Subjects raised in the security literature, mapped onto the catalog by technique name. Most of these techniques are rated theoretical,
        which is why they have no placement on a device yet.
      </p>
      {themes.map((theme) => (
        <section key={theme.id} className="tm-card">
          <h3 className="tm-heading">{theme.label}</h3>
          <p className="tm-muted">{theme.description}</p>
          {theme.techniques.length > 0 && (
            <ul className="tm-list">
              {theme.techniques.map((technique) => (
                <li key={technique.techniqueId}>
                  {technique.name} <span className="tm-mono tm-muted">{technique.techniqueId}</span>{' '}
                  <span className="tm-badge">{describeEvidence(technique).label}</span> <span className="tm-badge">{SCOPE_TERM_LABELS[technique.standing]}</span>
                </li>
              ))}
            </ul>
          )}
          {theme.catalogGap !== null && <p className="tm-notice">{theme.catalogGap}</p>}
        </section>
      ))}
    </div>
  );
}
