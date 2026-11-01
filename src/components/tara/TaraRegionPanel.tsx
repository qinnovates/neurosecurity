import { useEffect, useState, type Dispatch, type ReactNode } from 'react';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { buildRegionDetail } from '@/lib/atlas-explorer/region-detail';
import { buildRegionDeepLink } from '../atlas-scene/atlas-deep-link';
import { buildTaraPanelModel, type TaraState, type TaraAction, type TaraTechnique } from './tara-state';
import { REGION_FUNCTIONS } from './region-functions';

const icons: Record<string, string> = {
  'TARA threats': 'm12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z',
  'BCI mapping': 'M6 6h12v12H6ZM6 6l12 12M6 18 18 6',
  'NISS score': 'M4 19V12m7 7V5m7 14V9',
  Evidence: 'M4 4h6l2 2 2-2h6v15h-6l-2 2-2-2H4V4Zm8 2v15',
  Neurorights: 'M12 3v17M5 7h14M4 16l3-8 3 8H4Zm10 0 3-8 3 8h-6ZM7 21h10',
};


function PanelRow({ title, label, children, initial = false, open: controlledOpen, onOpenChange, emphasis = false }: {
  title: string; label?: string; children: ReactNode; initial?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void; emphasis?: boolean;
}) {
  const [localOpen, setOpen] = useState(initial);
  const open = controlledOpen ?? localOpen;
  const id = `tara-row-${title.replaceAll(' ', '-').toLowerCase()}`;
  return <section className="tara-row" data-emphasis={emphasis}>
    <button type="button" aria-expanded={open} aria-controls={id} onClick={() => onOpenChange ? onOpenChange(!open) : setOpen(!open)}>
      <svg className="tara-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={icons[title]} /></svg>
      <span>{title} {label && <small className="tara-badge">{label}</small>}</span><span aria-hidden="true">{open ? '−' : '+'}</span>
    </button>
    <div id={id} hidden={!open}>{open && children}</div>
  </section>;
}

export function regionPanelState(model: ExplorerModel, regionId: string | null) {
  return regionId === null ? null : buildRegionDetail(model, regionId);
}

function TechniqueLink({ technique }: { technique: TaraTechnique }) {
  return <a href={`/atlas/tara/${technique.id}/`}>{technique.id} · {technique.name}</a>;
}

export default function TaraRegionPanel({ model, state, dispatch, techniques }: {
  model: ExplorerModel; state: TaraState; dispatch: Dispatch<TaraAction>; techniques: readonly TaraTechnique[];
}) {
  const panel = buildTaraPanelModel(model, state, techniques);
  // Search can run before the lazy anatomy model arrives. Resolve against the validated model once ready.
  useEffect(() => {
    if (!state.selectedTechniqueId || state.selectedRegionId) return;
    const regionId = model.techniquesById.get(state.selectedTechniqueId)?.links.find((link) => link.lit && link.resolved_region_id)?.resolved_region_id;
    if (regionId) dispatch({ type: 'technique', id: state.selectedTechniqueId, regionId });
  }, [model, state.selectedTechniqueId, state.selectedRegionId, dispatch]);
  const selected = panel.selectedTechnique;
  const sources = (technique: TaraTechnique) => [...new Set(state.perspective === 'clinical' ? technique.clinicalSources : state.perspective === 'security' ? technique.sources : [...technique.sources, ...technique.clinicalSources])];
  return <aside className="brain-hero-card tara-panel" data-selected={Boolean(panel.region)} aria-label="Selected region">
    <div className="tara-panel-head"><div><p className="tara-eyebrow">SELECTED REGION</p><h2>{panel.region?.name ?? 'Start with the brain'}</h2>
      <p className="tara-region-meta" role="status">{panel.region ? REGION_FUNCTIONS[panel.region.id] ?? 'Helps different parts of your body work together.' : 'Choose a region or search by name.'}</p>
      {panel.region && <p className="tara-band" data-emphasis={state.lens === 'band'}>{panel.bandNames} · Proposed QIF grouping</p>}
    </div><a className="tara-region-icon" href={panel.region ? buildRegionDeepLink(panel.region.id) : '/atlas/explorer/'} aria-label="Open selected region in full atlas">↗</a></div>
    {selected && <div className="tara-technique-selection" role="status"><strong>Selected technique</strong><TechniqueLink technique={selected} />
      {!panel.techniques.some((t) => t.id === selected.id) && <p>This technique has no mapping in the current region and perspective.</p>}
    </div>}
    <PanelRow key={`${state.selectedRegionId}-${state.selectedTechniqueId}`} title="TARA threats" label={String(panel.count)} initial>
      <p>{state.perspective === 'clinical' ? 'Mapped techniques with a therapeutic analog.' : 'Mapped techniques for defensive threat modelling.'} AI-drafted, unreviewed.</p>
      {panel.count ? <ul className="tara-ttp-list">{panel.techniques.map((technique) => <li key={technique.id} data-highlighted={state.selectedTechniqueId === technique.id}>
        <TechniqueLink technique={technique} /><small>Evidence tier: {technique.evidenceTier?.replaceAll('_', ' ') ?? 'Not recorded'}</small>
        {state.perspective !== 'security' && technique.therapeuticAnalog && <p>Therapeutic analog: {technique.therapeuticAnalog}</p>}
      </li>)}</ul> : <p>{panel.emptyMessage}</p>}
    </PanelRow>
    <PanelRow title="BCI mapping" label="AI-drafted, unreviewed"><p>{panel.deviceIds.join(', ') || 'No device mapping recorded for this selection.'}</p></PanelRow>
    <PanelRow title="NISS score" label="Draft" open={state.nissOpen} onOpenChange={(open) => dispatch({ type: 'niss', open })} emphasis={state.lens === 'niss'}>
      <p>Draft scores from a proposed, unvalidated research framework. Technique-level threat modelling, not a clinical assessment.</p>
      {panel.scores.length ? <ul>{panel.scores.map((t) => <li key={t.id}>{t.id} · {t.name}: {t.score} · Draft</li>)}</ul> : <p>No draft score recorded for these mapped techniques.</p>}
    </PanelRow>
    <PanelRow title="Evidence" open={state.evidenceOpen} onOpenChange={(open) => dispatch({ type: 'evidence', open })} emphasis={state.lens === 'evidence'}>
      <p>Technique evidence does not establish that a threat occurred in this region. Theoretical tiers describe theoretical work.</p>
      {panel.techniques.length ? <ul>{panel.techniques.map((t) => <li key={t.id}><TechniqueLink technique={t} /><p>Evidence tier: {t.evidenceTier?.replaceAll('_', ' ') ?? 'Not recorded'}</p>
        {sources(t).length ? <ul>{sources(t).map((source) => <li key={source}>{source}</li>)}</ul> : <p>No sources recorded for this perspective.</p>}
      </li>)}</ul> : <p>{panel.emptyMessage}</p>}
    </PanelRow>
    <PanelRow title="Neurorights"><p>Rights potentially touched by these mapped techniques, as tagged in the data. This is not a compliance claim.</p>
      {panel.rights.length ? <ul>{panel.rights.map((right) => <li key={right.code}>{right.name} ({right.code}){right.foldsInto && ` · catalog folds into ${right.foldsInto}`}</li>)}</ul> : <p>No neurorights tags recorded for these mapped techniques.</p>}
      <a href="/governance/rights/">Neurorights framework</a>
    </PanelRow>
  </aside>;
}
