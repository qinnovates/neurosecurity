import { useState, type ReactNode } from 'react';
import BrainHeroMount from '../atlas-scene/BrainHeroMount';
import TaraRegionPanel from './TaraRegionPanel';
import TaraSearch from './TaraSearch';
import type { SearchHit } from './search-index';
import './tara.css';

export default function TaraExplorer({ index, wordmark }: { index: SearchHit[]; wordmark?: ReactNode }) {
  const [regionId, setRegionId] = useState<string | null>('pfc');
  const [evidenceRequest, setEvidenceRequest] = useState(0);
  return <div className="tara-explorer">
    <nav className="tara-nav" aria-label="TARA Glia navigation">
      <a className="tara-brand" href="/atlas/tara/" aria-label="TARA Glia home"><svg viewBox="0 0 32 32" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m16 3 11 6v14l-11 6-11-6V9L16 3ZM16 3v26M5 9l22 14M27 9 5 23" /></g><circle cx="16" cy="16" r="3" fill="#3d86ff" /></svg>TARA <span>Glia</span></a>
      <div className="tara-nav-links"><a href="#atlas">Atlas</a><a href="#features">Library</a><a href="/atlas/scoring/">Evidence</a><a href="#about">About</a></div>
      <div className="tara-nav-actions"><TaraSearch index={index} onSelectRegion={setRegionId} /><a className="tara-ink" href="/atlas/explorer/">Explore <span aria-hidden="true">↗</span></a></div>
    </nav>
    <header className="tara-title" id="about">
      <div className="tara-title-copy">
        <p className="tara-eyebrow">OPEN NEURAL ATLAS</p>
        <h1>TARA <em className="tara-glia">Glia</em> <span className="tara-by">by <span className="tara-wordmark" role="img" aria-label="Qinnovate">{wordmark}</span></span></h1>
        <p className="tara-subtitle">Threat Analysis Risk Atlas for the neural frontier.</p>
        <p className="tara-legal">Trademark status pending. Confirm wording with counsel before publishing.</p>
      </div>
      <span className="tara-preview"><i />Research preview</span>
    </header>
    <div id="atlas"><BrainHeroMount onShowEvidence={() => setEvidenceRequest((count) => count + 1)} selectedRegionId={regionId} onSelectRegion={setRegionId}
      renderRegionPanel={(model, id) => <TaraRegionPanel model={model} regionId={id} evidenceRequest={evidenceRequest} />} /></div>
  </div>;
}
