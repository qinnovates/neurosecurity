import { useEffect, useState, type ReactNode } from 'react';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { buildRegionDetail } from '@/lib/atlas-explorer/region-detail';
import { buildRegionDeepLink } from '../atlas-scene/atlas-deep-link';

const icons: Record<string, string> = {
  'TARA threats': 'm12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z',
  'BCI mapping': 'M6 6h12v12H6ZM6 6l12 12M6 18 18 6',
  'NISS score': 'M4 19V12m7 7V5m7 14V9',
  Evidence: 'M4 4h6l2 2 2-2h6v15h-6l-2 2-2-2H4V4Zm8 2v15',
  Neurorights: 'M12 3v17M5 7h14M4 16l3-8 3 8H4Zm10 0 3-8 3 8h-6ZM7 21h10',
};

function PanelRow({ title, label, children, initial = false, openRequest = 0 }: { title: string; label?: string; children: ReactNode; initial?: boolean; openRequest?: number }) {
  const [open, setOpen] = useState(initial);
  useEffect(() => { if (openRequest > 0) setOpen(true); }, [openRequest]);
  const id = `tara-row-${title.replaceAll(' ', '-').toLowerCase()}`;
  return <section className="tara-row">
    <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
      <svg className="tara-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={icons[title]} /></svg><span>{title}{' '}{label && <small className="tara-badge">{label}</small>}</span><span aria-hidden="true"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" style={{ transform: open ? 'rotate(180deg)' : undefined }}><path d="m4 6 4 4 4-4" /></svg></span>
    </button>
    <div id={id} hidden={!open}>{children}</div>
  </section>;
}

export function regionPanelState(model: ExplorerModel, regionId: string | null) {
  return regionId === null ? null : buildRegionDetail(model, regionId);
}

function RegionRows({ model, regionId, evidenceRequest }: { model: ExplorerModel; regionId: string | null; evidenceRequest: number }) {
  const detail = regionPanelState(model, regionId);
  const scored = detail?.linked.flatMap((t) => {
    const score = model.techniquesById.get(t.id)?.niss.score;
    return score == null ? [] : [{ id: t.id, name: t.name, score }];
  }) ?? [];
  return <>
    <PanelRow title="TARA threats" label="01" initial><div className="tara-threat-content"><article className="tara-threat">
      <div className="tara-threat-top"><span>ILLUSTRATIVE SCENARIO</span><span className="tara-adversarial">Adversarial</span></div>
      <h3>Decision interference</h3><p>Unauthorized modulation of choice.</p>
      <div className="tara-threat-foot"><span>Agency at risk</span><a href="/atlas/chains/">Trace the threat ↗</a></div>
    </article></div></PanelRow>
    <PanelRow title="BCI mapping" label="AI-drafted, unreviewed"><p>{detail?.deviceIds.join(', ') || 'No device mapping loaded for this selection.'}</p></PanelRow>
    <PanelRow title="NISS score" label="Draft"><p>{detail?.nissStep ? `Highest linked severity: ${detail.nissStep}. Draft.` : 'No linked score available.'} This is a technique-level summary, not a clinical assessment.</p><ul>{scored.map((t) => <li key={t.id}>{t.name}: {t.score} · Draft</li>)}</ul></PanelRow>
    <PanelRow title="Evidence" openRequest={evidenceRequest}><p>Mapping does not establish that a threat occurred in this region. Review sources and limitations in the full atlas.</p>{detail && <a href={buildRegionDeepLink(detail.region.id)}>Read region evidence</a>}</PanelRow>
    <PanelRow title="Neurorights"><p>Review the rights potentially affected by linked techniques; this is not a compliance claim.</p><a href="/governance/rights/">Neurorights framework</a></PanelRow>
  </>;
}

export default function TaraRegionPanel({ model, regionId, evidenceRequest = 0 }: { model: ExplorerModel; regionId: string | null; evidenceRequest?: number }) {
  const detail = regionPanelState(model, regionId);
  const name = detail?.region.name;
  return <aside className="brain-hero-card tara-panel" data-selected={Boolean(name)} aria-label="Selected region">
    <div className="tara-panel-head"><div><p className="tara-eyebrow">SELECTED REGION / 01</p><h2>{name ?? 'Start with the brain'}</h2>
    <p className="tara-region-meta" role="status">{regionId === 'pfc' ? 'Planning · Decision-making · Agency' : detail?.description ?? 'Click a region or search by name.'}</p></div>
    <a className="tara-region-icon" href={regionId ? buildRegionDeepLink(regionId) : '/atlas/explorer/'} aria-label="Open selected region in full atlas"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /><circle cx="12" cy="12" r="3" /></svg></a></div>
    <RegionRows key={regionId ?? 'idle'} model={model} regionId={regionId} evidenceRequest={evidenceRequest} />
  </aside>;
}
