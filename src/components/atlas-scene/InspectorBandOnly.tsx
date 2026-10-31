import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { RegionDetail } from '@/lib/atlas-explorer/region-detail';
import Disclosure from './Disclosure';
import LimitNote from './LimitNote';

interface Props {
  detail: RegionDetail;
  onChooseTechnique: (techniqueId: string) => void;
}

/**
 * Techniques tagged with the region's band whose text names no structure. They are not links to the region, so they
 * sit outside the dossier's techniques, and stay folded away until asked for: there can be dozens.
 */
export default function InspectorBandOnly({ detail, onChooseTechnique }: Props) {
  const band = detail.region.band_ids[0];
  if (detail.bandLevel.length === 0 || band === undefined) return null;
  return (
    <section className="atlas-section" aria-labelledby="atlas-inspector-band-only">
      <h3 className="atlas-subheading" id="atlas-inspector-band-only">Tagged with this band only ({detail.bandLevel.length})</h3>
      <LimitNote limit={limitSentence('techniques_band_level', { band })} />
      <Disclosure label={`Show the ${detail.bandLevel.length} techniques`}>
        <ul className="atlas-chips">
          {detail.bandLevel.map((technique) => (
            <li key={technique.id}><button type="button" className="atlas-chip" onClick={() => onChooseTechnique(technique.id)}>{technique.name}</button></li>
          ))}
        </ul>
      </Disclosure>
    </section>
  );
}
