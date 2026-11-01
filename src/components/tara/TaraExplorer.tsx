import { useState } from 'react';
import BrainHeroMount from '../atlas-scene/BrainHeroMount';
import TaraRegionPanel from './TaraRegionPanel';
import TaraSearch from './TaraSearch';
import type { SearchHit } from './search-index';
import './tara.css';

export default function TaraExplorer({ index, catalogVersion }: { index: SearchHit[]; catalogVersion?: string }) {
  const [regionId, setRegionId] = useState<string | null>(null);
  return <div className="tara-explorer">
    <header className="tara-title">
      <div className="tara-title-copy">
        <p className="tara-eyebrow">TARA CATALOG v{catalogVersion} · PROPOSED</p>
        <h1>TARA Glia <span>by Qinnovate</span></h1>
        <p className="tara-subtitle">Threat Analysis Risk Atlas for the neural frontier.</p>
        <p className="tara-legal">Trademark status pending. Confirm wording with counsel before publishing.</p>
      </div>
      <TaraSearch index={index} onSelectRegion={setRegionId} />
    </header>
    <BrainHeroMount selectedRegionId={regionId} onSelectRegion={setRegionId}
      renderRegionPanel={(model, id) => <TaraRegionPanel model={model} regionId={id} />} />
  </div>;
}
