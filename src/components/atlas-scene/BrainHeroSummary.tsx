import { HERO_COPY } from '@/lib/anatomy/hero-copy';
import { listLitLinks, nameBands, type ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { buildRegionDeepLink } from './atlas-deep-link';
import ReviewMark from './ReviewMark';

interface Props {
  model: ExplorerModel;
  /** The region picked in the picture, or null while none is. */
  regionId: string | null;
}

/**
 * The card beside the hero's picture: before a pick, what to do; after one, a
 * few facts about the region from the data the picture was drawn from, and the
 * one way on, to that region's details in the full atlas. It is a summary and
 * not the inspector: the inspector, with its quotes, coverage and techniques,
 * stays on the explorer page, which the link opens with this region selected.
 */
export default function BrainHeroSummary({ model, regionId }: Props) {
  const region = regionId === null ? null : model.regionsById.get(regionId) ?? null;
  if (region === null) {
    return (
      <aside className="brain-hero-card" data-hero-card="idle" aria-labelledby="brain-hero-card-heading">
        <h3 className="brain-hero-card-heading" id="brain-hero-card-heading">{HERO_COPY.idle_title}</h3>
        <p className="brain-hero-card-text">{HERO_COPY.idle}</p>
      </aside>
    );
  }
  const drafted = model.linksByRegion.get(region.id) ?? [];
  const lit = listLitLinks(model, region.id);
  const description = model.descriptionsByRegion.get(region.id) ?? null;
  return (
    <aside className="brain-hero-card" data-hero-card="selected" data-hero-selected={region.id} aria-labelledby="brain-hero-card-heading">
      <h3 className="brain-hero-card-heading" id="brain-hero-card-heading">{region.name} <ReviewMark state={region.review_state} /></h3>
      {description !== null && <p className="brain-hero-card-text">{description}</p>}
      <dl className="brain-hero-card-facts">
        <div><dt>{HERO_COPY.selected_bands}</dt><dd>{nameBands(model, region.band_ids)}</dd></div>
        <div><dt>{HERO_COPY.selected_links}</dt><dd>{HERO_COPY.selected_links_value(lit.length, drafted.length)}</dd></div>
      </dl>
      <a className="brain-hero-cta" href={buildRegionDeepLink(region.id)} data-astro-reload>{HERO_COPY.see_details}</a>
      <p className="sr-only" role="status">{HERO_COPY.selected_announcement(region.name)}</p>
    </aside>
  );
}
