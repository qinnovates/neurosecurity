import { useMemo } from 'react';
import { HERO_COPY } from '@/lib/anatomy/hero-copy';
import { nameBands, type ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { rankRegionRisks, techniquePagePath } from '@/lib/atlas-explorer/hero-risks';
import type { Lens } from '@/lib/atlas-explorer/lens-state';
import { buildRegionDetail, type DetailTechnique, type RegionDetail } from '@/lib/atlas-explorer/region-detail';
import { buildRegionDeepLink } from './atlas-deep-link';
import RegionLensNote from './RegionLensNote';

interface Props {
  model: ExplorerModel;
  /** The region picked in the picture, or null while none is. */
  regionId: string | null;
  /** The lens the picture is coloured by. The way on opens the explorer on the same lens. */
  lens: Lens;
}

function RiskItem({ technique, isInCatalog }: { technique: DetailTechnique; isInCatalog: boolean }) {
  return (
    <li className="brain-hero-risk" data-hero-risk={technique.id}>
      {isInCatalog ? <a href={techniquePagePath(technique.id)}>{technique.name}</a> : <span className="brain-hero-risk-name">{technique.name}</span>}
      <span className="atlas-id">{technique.id}</span>
      {technique.nissSeverity !== null && <span className="brain-hero-sev" data-severity={technique.nissSeverity}>{technique.nissSeverity}</span>}
    </li>
  );
}

/** The region's linked techniques, highest NISS step first, cut to a few; the full atlas lists them all. */
function Risks({ model, detail }: { model: ExplorerModel; detail: RegionDetail }) {
  const { shown, hiddenCount } = useMemo(() => rankRegionRisks(detail.linked), [detail.linked]);
  return (
    <section className="brain-hero-section" data-hero-risks={detail.linked.length} aria-labelledby="brain-hero-risks-heading">
      <h4 className="brain-hero-subheading" id="brain-hero-risks-heading">{HERO_COPY.risks_title}</h4>
      {shown.length === 0 ? <p className="brain-hero-note">{HERO_COPY.risks_none}</p> : (
        <>
          {detail.nissStep !== null && <p className="brain-hero-note">{HERO_COPY.risk_step(detail.nissStep, detail.linked.length)}</p>}
          <ol className="brain-hero-risks">
            {shown.map((technique) => <RiskItem key={technique.evidenceKey} technique={technique} isInCatalog={model.catalogTechniqueIds.has(technique.id)} />)}
          </ol>
          {hiddenCount > 0 && <p className="brain-hero-more">{HERO_COPY.risks_more(hiddenCount)}</p>}
          <p className="brain-hero-note">{HERO_COPY.risks_note}</p>
        </>
      )}
    </section>
  );
}

/** The devices whose own QIF record names the region: ids, as the explorer's inspector shows them. */
function Devices({ detail }: { detail: RegionDetail }) {
  return (
    <section className="brain-hero-section" data-hero-devices={detail.deviceIds.length} aria-labelledby="brain-hero-devices-heading">
      <h4 className="brain-hero-subheading" id="brain-hero-devices-heading">{HERO_COPY.devices_title}</h4>
      {detail.deviceIds.length === 0 ? <p className="brain-hero-note">{HERO_COPY.devices_none}</p> : (
        <ul className="atlas-chips">
          {detail.deviceIds.map((deviceId) => <li key={deviceId} className="atlas-chip brain-hero-device" data-hero-device={deviceId}>{deviceId}</li>)}
        </ul>
      )}
    </section>
  );
}

/**
 * The card beside the hero's picture: before a pick, what to do; after one, the
 * region's dashboard from the data the picture was drawn from. Its risks (the
 * linked techniques, highest NISS step first, cut to a few) and the devices
 * whose records name it, and the one way on, to the region's full details in
 * the explorer. It is a summary and not the inspector: quotes, coverage and
 * the whole list stay on the explorer page, which the link opens with this
 * region selected.
 */
export default function BrainHeroSummary({ model, regionId, lens }: Props) {
  const detail = useMemo(() => (regionId === null ? null : buildRegionDetail(model, regionId)), [model, regionId]);
  if (detail === null) {
    return (
      <aside className="brain-hero-card" data-hero-card="idle" aria-labelledby="brain-hero-card-heading">
        <h3 className="brain-hero-card-heading" id="brain-hero-card-heading">{HERO_COPY.idle_title}</h3>
        <p className="brain-hero-card-text">{HERO_COPY.idle}</p>
      </aside>
    );
  }
  const { region } = detail;
  const drafted = model.linksByRegion.get(region.id) ?? [];
  return (
    <aside className="brain-hero-card" data-hero-card="selected" data-hero-selected={region.id} aria-labelledby="brain-hero-card-heading">
      <h3 className="brain-hero-card-heading" id="brain-hero-card-heading">{region.name}</h3>
      {detail.description !== null && <p className="brain-hero-card-text">{detail.description}</p>}
      <dl className="brain-hero-card-facts">
        <div><dt>{HERO_COPY.selected_bands}</dt><dd>{nameBands(model, region.band_ids)}</dd></div>
        <div><dt>{HERO_COPY.selected_links}</dt><dd>{HERO_COPY.selected_links_value(detail.linked.length, drafted.length)}</dd></div>
      </dl>
      <RegionLensNote model={model} regionId={region.id} lens={lens} />
      <Risks model={model} detail={detail} />
      <Devices detail={detail} />
      <a className="brain-hero-cta" href={buildRegionDeepLink(region.id, lens)} data-astro-reload>{HERO_COPY.see_details}</a>
      <p className="sr-only" role="status">{HERO_COPY.selected_announcement(region.name)}</p>
    </aside>
  );
}
