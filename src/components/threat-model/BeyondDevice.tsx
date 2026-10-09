import EvidenceMark from '@/components/lab-kit/EvidenceMark';
import Panel from '@/components/lab-kit/Panel';
import TechniqueLink from '@/components/lab-kit/TechniqueLink';
import { SCOPE_TERM_LABELS } from '@/lib/threat-model/lab-terms';
import type { NotPlacedCategory } from '@/lib/threat-model/reference-data-types';
import type { AmbientThreat, ThemeSummary, ThemeTechnique } from '@/lib/threat-model/report-types';

interface Props {
  ambientThreats: readonly AmbientThreat[];
  themes: readonly ThemeSummary[];
  /** When set, a technique's ID opens the technique. Left out, as on paper, the ID is plain text. */
  onOpenTechnique?: (techniqueId: string) => void;
}

const CATEGORY_HEADINGS: Partial<Record<NotPlacedCategory, string>> = {
  external_energy: 'External energy acting on tissue directly',
  consumer_sensor: 'Consumer-device sensors',
  pharmacological: 'Chemical or dietary exposure',
  nanoparticle: 'Nanoparticles introduced into tissue',
};
const CATEGORIES = Object.keys(CATEGORY_HEADINGS) as NotPlacedCategory[];

/** A technique around the device, or one a theme names; only the second says where it stands against the device. */
type Listed = AmbientThreat | ThemeTechnique;

function TechniqueLine({ technique, onOpenTechnique }: { technique: Listed; onOpenTechnique: Props['onOpenTechnique'] }) {
  return (
    <li>
      <span>{technique.name}</span>
      {onOpenTechnique === undefined
        ? <span className="lab-id">{technique.techniqueId}</span>
        : <TechniqueLink techniqueId={technique.techniqueId} techniqueName={technique.name} onOpen={onOpenTechnique} />}
      <EvidenceMark tier={technique.evidenceTier} status={technique.evidenceStatus} labelForm="short" />
      {'standing' in technique && <span className="lab-soft">{SCOPE_TERM_LABELS[technique.standing]}</span>}
    </li>
  );
}

function AmbientGroup({ category, threats, onOpenTechnique }: { category: NotPlacedCategory; threats: readonly AmbientThreat[]; onOpenTechnique: Props['onOpenTechnique'] }) {
  if (threats.length === 0) return null;
  return (
    <Panel title={CATEGORY_HEADINGS[category] ?? category} actions={<span className="lab-figure">{threats.length}</span>}>
      <p className="lab-soft">{threats[0].reason}</p>
      <ul className="model-technique-list">
        {threats.map((threat) => <TechniqueLine key={threat.techniqueId} technique={threat} onOpenTechnique={onOpenTechnique} />)}
      </ul>
    </Panel>
  );
}

/**
 * What the device's architecture cannot show: evidenced techniques that reach a person
 * without passing through the device, and subjects the catalog covers only weakly.
 */
export default function BeyondDevice({ ambientThreats, themes, onOpenTechnique }: Props) {
  return (
    <div className="model-stack">
      <p className="lab-notice">
        Nothing on this page is part of the device's threat model. These techniques do not pass through the device's components or connections,
        so a design change to the device does not address them. They are listed so the model's edges are visible.
      </p>
      <h2 className="lab-panel-title">Around the device</h2>
      {CATEGORIES.map((category) => (
        <AmbientGroup key={category} category={category} threats={ambientThreats.filter((threat) => threat.category === category)} onOpenTechnique={onOpenTechnique} />
      ))}

      <h2 className="lab-panel-title">On the horizon</h2>
      <p className="lab-soft">
        Subjects raised in the security literature, mapped onto the catalog by technique name. Most of these techniques are rated theoretical,
        which is why they have no placement on a device yet.
      </p>
      {themes.map((theme) => (
        <Panel key={theme.id} title={theme.label}>
          <p className="lab-soft">{theme.description}</p>
          {theme.techniques.length > 0 && (
            <ul className="model-technique-list">
              {theme.techniques.map((technique) => <TechniqueLine key={technique.techniqueId} technique={technique} onOpenTechnique={onOpenTechnique} />)}
            </ul>
          )}
          {theme.catalogGap !== null && <p className="lab-notice">{theme.catalogGap}</p>}
        </Panel>
      ))}
    </div>
  );
}
