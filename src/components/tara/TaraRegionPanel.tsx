import { useState, type ReactNode } from 'react';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { buildRegionDetail } from '@/lib/atlas-explorer/region-detail';
import { buildRegionDeepLink } from '../atlas-scene/atlas-deep-link';

function PanelRow({ title, label, children, initial = false }: { title: string; label?: string; children: ReactNode; initial?: boolean }) {
  const [open, setOpen] = useState(initial);
  const id = `tara-row-${title.replaceAll(' ', '-').toLowerCase()}`;
  return <section className="tara-row">
    <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
      <span>{title}{' '}{label && <small className="tara-badge">{label}</small>}</span><span aria-hidden="true">{open ? '−' : '+'}</span>
    </button>
    <div id={id} hidden={!open}>{children}</div>
  </section>;
}

export function regionPanelState(model: ExplorerModel, regionId: string | null) {
  return regionId === null ? null : buildRegionDetail(model, regionId);
}

function RegionRows({ model, regionId }: { model: ExplorerModel; regionId: string | null }) {
  const detail = regionPanelState(model, regionId);
  const scored = detail?.linked.flatMap((t) => {
    const score = model.techniquesById.get(t.id)?.niss.score;
    return score == null ? [] : [{ id: t.id, name: t.name, score }];
  }) ?? [];
  return <>
    <PanelRow title="TARA threats" initial>{detail ? <><p>{detail.linked.length} linked techniques. Placement is AI-drafted, unreviewed.</p><ul>{detail.linked.map((t) => <li key={t.evidenceKey}><a href={`/atlas/tara/${t.id}/`}>{t.name}</a></li>)}</ul></> : <p>Choose a region to explore its public threat mappings.</p>}</PanelRow>
    <PanelRow title="BCI mapping" label="AI-drafted, unreviewed"><p>{detail?.deviceIds.join(', ') || 'No device mapping loaded for this selection.'}</p></PanelRow>
    <PanelRow title="NISS score" label="Draft"><p>{detail?.nissStep ? `Highest linked severity: ${detail.nissStep}. Draft.` : 'No linked score available.'} This is a technique-level summary, not a clinical assessment.</p><ul>{scored.map((t) => <li key={t.id}>{t.name}: {t.score} · Draft</li>)}</ul></PanelRow>
    <PanelRow title="Evidence"><p>Mapping does not establish that a threat occurred in this region. Review sources and limitations in the full atlas.</p>{detail && <a href={buildRegionDeepLink(detail.region.id)}>Read region evidence</a>}</PanelRow>
    <PanelRow title="Neurorights"><p>Review the rights potentially affected by linked techniques; this is not a compliance claim.</p><a href="/governance/rights/">Neurorights framework</a></PanelRow>
  </>;
}

export default function TaraRegionPanel({ model, regionId }: { model: ExplorerModel; regionId: string | null }) {
  const name = regionId ? model.regionsById.get(regionId)?.name : null;
  return <aside className="brain-hero-card tara-panel" data-selected={Boolean(name)} aria-label="Selected region">
    <p className="tara-eyebrow">REGION EXPLORER</p><h2>{name ?? 'Start with the brain'}</h2>
    <p role="status">{name ? `Selected: ${name}` : 'Click a region or search by name.'}</p>
    <RegionRows key={regionId ?? 'idle'} model={model} regionId={regionId} />
  </aside>;
}
