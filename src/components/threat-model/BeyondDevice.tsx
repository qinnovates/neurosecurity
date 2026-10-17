import DataTable, { type DataTableColumn } from '@/components/lab-kit/DataTable';
import EvidenceMark from '@/components/lab-kit/EvidenceMark';
import TechniqueLink from '@/components/lab-kit/TechniqueLink';
import { useViewState } from '@/components/workbench/ViewStateContext';
import { SCOPE_TERM_LABELS } from '@/lib/threat-model/lab-terms';
import type { NotPlacedCategory } from '@/lib/threat-model/reference-data-types';
import type { AmbientThreat, ThemeSummary, ThemeTechnique } from '@/lib/threat-model/report-types';
import FoldPanel from './frame/FoldPanel';
import { MODEL_STATE_KEYS } from './frame/model-view-keys';

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

const STANDING_HEADING = 'On this device';
const MAX_OPEN_PANELS = 64;
const MAX_PANEL_ID_LENGTH = 80;

function isPanelIdList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= MAX_OPEN_PANELS && value.every((id) => typeof id === 'string' && id.length <= MAX_PANEL_ID_LENGTH);
}

function buildColumns(onOpenTechnique: Props['onOpenTechnique'], hasStanding: boolean): DataTableColumn<Listed>[] {
  const columns: DataTableColumn<Listed>[] = [
    { id: 'technique', header: 'Technique', render: (technique) => technique.name },
    {
      id: 'id', header: 'ID',
      render: (technique) => (onOpenTechnique === undefined
        ? <span className="lab-id">{technique.techniqueId}</span>
        : <TechniqueLink techniqueId={technique.techniqueId} techniqueName={technique.name} onOpen={onOpenTechnique} />),
    },
    { id: 'evidence', header: 'Evidence', render: (technique) => <EvidenceMark tier={technique.evidenceTier} status={technique.evidenceStatus} labelForm="short" /> },
  ];
  if (hasStanding) columns.push({ id: 'standing', header: STANDING_HEADING, render: (technique) => ('standing' in technique ? SCOPE_TERM_LABELS[technique.standing] : null) });
  return columns;
}

function TechniqueTable({ title, techniques, hasStanding, onOpenTechnique }: { title: string; techniques: readonly Listed[]; hasStanding: boolean; onOpenTechnique: Props['onOpenTechnique'] }) {
  return (
    <DataTable
      caption={title} columns={buildColumns(onOpenTechnique, hasStanding)} rows={techniques} rowKey={(technique) => technique.techniqueId}
      sort={null} emptyMessage="None recorded."
    />
  );
}

/**
 * What the device's architecture cannot show: evidenced techniques that reach a person
 * without passing through the device, and subjects the catalog covers only weakly. Each
 * group folds to its title, its count and one line; opening one lists its techniques.
 */
export default function BeyondDevice({ ambientThreats, themes, onOpenTechnique }: Props) {
  const [openPanelIds, setOpenPanelIds] = useViewState<string[]>(MODEL_STATE_KEYS.aroundOpenPanels, [], isPanelIdList);
  const toggle = (panelId: string): void => setOpenPanelIds(openPanelIds.includes(panelId) ? openPanelIds.filter((id) => id !== panelId) : [...openPanelIds, panelId]);
  const groups = CATEGORIES
    .map((category) => ({ category, threats: ambientThreats.filter((threat) => threat.category === category) }))
    .filter((group) => group.threats.length > 0);

  return (
    <div className="model-stack">
      <p className="lab-notice">
        Nothing on this page is part of the device's threat model. These techniques do not pass through the device's components or connections,
        so a design change to the device does not address them. They are listed so the model's edges are visible.
      </p>
      <h2 className="lab-panel-title">Around the device</h2>
      <div className="model-fold-grid">
        {groups.map(({ category, threats }) => {
          const title = CATEGORY_HEADINGS[category] ?? category;
          return (
            <FoldPanel key={category} title={title} count={threats.length} summary={threats[0].reason} isOpen={openPanelIds.includes(category)} onToggle={() => toggle(category)}>
              <TechniqueTable title={title} techniques={threats} hasStanding={false} onOpenTechnique={onOpenTechnique} />
            </FoldPanel>
          );
        })}
      </div>

      <h2 className="lab-panel-title">On the horizon</h2>
      <p className="lab-soft">
        Subjects raised in the security literature, mapped onto the catalog by technique name. Most of these techniques are rated theoretical,
        which is why they have no placement on a device yet.
      </p>
      <div className="model-fold-grid">
        {themes.map((theme) => (
          <FoldPanel
            key={theme.id} title={theme.label} count={theme.techniques.length > 0 ? theme.techniques.length : undefined} summary={theme.description}
            isOpen={openPanelIds.includes(theme.id)} onToggle={() => toggle(theme.id)}
            alwaysShown={theme.catalogGap !== null && <p className="lab-notice">{theme.catalogGap}</p>}
          >
            {theme.techniques.length > 0 && <TechniqueTable title={theme.label} techniques={theme.techniques} hasStanding onOpenTechnique={onOpenTechnique} />}
          </FoldPanel>
        ))}
      </div>
    </div>
  );
}
