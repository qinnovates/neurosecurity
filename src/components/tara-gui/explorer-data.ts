import { getAtlasData } from '@/lib/atlas-data';
import { THREAT_VECTORS } from '@/lib/threat-data';

/** Build-time projection only: region names do not establish technique-to-region evidence. */
export function getExplorerData() {
  const atlas = getAtlasData();
  return atlas.bands.filter(band => band.zone === 'neural').map(band => {
    const threats = THREAT_VECTORS.filter(threat => threat.bands.some(id => id === band.id));
    return {
      ...band,
      // No techniques mapped means there is no count to display, rather than an invented zero.
      count: threats.length ? band.threatCount : undefined,
      threats,
      regions: band.brainRegions.length ? band.brainRegions : [{
        id: band.id, name: band.name, band: band.id, function: band.description,
      }],
    };
  });
}
export type ExplorerBand = ReturnType<typeof getExplorerData>[number];
