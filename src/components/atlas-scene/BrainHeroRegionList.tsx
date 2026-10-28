import { HERO_COPY } from '@/lib/anatomy/hero-copy';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { buildRegionDeepLink } from './atlas-deep-link';

interface Props {
  model: ExplorerModel;
}

/**
 * The picture's stand-in where the 3D view cannot open: every region the index
 * holds, each a link into the full atlas with that region selected. Words
 * rather than a blank box, and the same destinations the picture offers.
 */
export default function BrainHeroRegionList({ model }: Props) {
  return (
    <section className="brain-hero-regions" aria-labelledby="brain-hero-regions-heading">
      <h3 className="brain-hero-card-heading" id="brain-hero-regions-heading">{HERO_COPY.fallback_title}</h3>
      <p className="brain-hero-card-text">{HERO_COPY.fallback}</p>
      <ul className="atlas-chips">
        {model.regions.map((region) => <li key={region.id}><a className="atlas-chip brain-hero-region-link" href={buildRegionDeepLink(region.id)} data-astro-reload>{region.name}</a></li>)}
      </ul>
    </section>
  );
}
