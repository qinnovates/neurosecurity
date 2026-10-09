import FilterChip from '@/components/lab-kit/FilterChip';
import type { BandFacetCount } from '@/lib/threat-model/catalog-filter';
import { groupBandCounts } from './band-groups';

interface Props {
  /** How many techniques each band would leave, with the other filters applied. */
  bands: readonly BandFacetCount[];
  selectedBandIds: readonly string[];
  onToggleBand: (bandId: string) => void;
}

/** One chip per band, under silicon side, interface and neural side. A technique in two bands counts under each. */
export default function BandChips({ bands, selectedBandIds, onToggleBand }: Props) {
  return (
    <div className="explore-bands">
      {groupBandCounts(bands).map((group) => (
        <div key={group.id} className="explore-band-group" role="group" aria-label={group.label}>
          <span className="lab-label">{group.label}</span>
          {group.bands.map((band) => (
            <FilterChip key={band.bandId} label={band.bandId} count={band.count} isPressed={selectedBandIds.includes(band.bandId)} onToggle={() => onToggleBand(band.bandId)} />
          ))}
        </div>
      ))}
    </div>
  );
}
