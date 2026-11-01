import { useReducer, type ReactNode } from 'react';
import BrainHeroMount from '../atlas-scene/BrainHeroMount';
import TaraRegionPanel from './TaraRegionPanel';
import TaraSearch from './TaraSearch';
import type { SearchHit } from './search-index';
import './tara.css';
import LensToggle from '../LensToggle';
import { INITIAL_TARA_STATE, taraReducer, taraBrainLens, filterTtpList, type TaraTechnique, type TaraLens } from './tara-state';

export default function TaraExplorer({ index, wordmark, techniques = [] }: { index: SearchHit[]; wordmark?: ReactNode; techniques?: TaraTechnique[] }) {
  const [state, dispatch] = useReducer(taraReducer, INITIAL_TARA_STATE);
  return <div className="tara-explorer">
    <header className="tara-title" id="about">
      <div className="tara-title-copy">
        <p className="tara-eyebrow">OPEN NEURAL ATLAS</p>
        <h1>TARA <em className="tara-glia">Glia</em> <span className="tara-by">by <span className="tara-wordmark" role="img" aria-label="Qinnovate">{wordmark}</span></span></h1>
        <p className="tara-subtitle">Threat Analysis Risk Atlas for the neural frontier.</p>
        <p className="tara-legal">Trademark status pending. Confirm wording with counsel before publishing.</p>
      </div>
      <div className="tara-title-actions"><span className="tara-preview"><i />Research preview</span><TaraSearch index={index} onSelectRegion={(id) => dispatch({ type: 'region', id })} onSelectTechnique={(id) => dispatch({ type: 'technique', id, regionId: null })} /></div>
    </header>
    <div className="tara-controls" aria-label="Atlas controls">
      <div className="brain-hero-lenses" role="group" aria-label="Colour the brain and panel by">
        {(['band', 'niss', 'evidence'] as TaraLens[]).map((lens) => <button type="button" className="brain-hero-lens" key={lens} aria-pressed={state.lens === lens} onClick={() => dispatch({ type: 'lens', lens })}>{lens === 'niss' ? 'NISS' : lens === 'band' ? 'Band' : 'Evidence'}</button>)}
      </div>
      <LensToggle value={state.perspective} onChange={(perspective) => dispatch({ type: 'perspective', perspective })} />
    </div>
    <p className="tara-context" role="status">{state.perspective === 'both' ? 'Security and clinical' : state.perspective === 'security' ? 'Security' : 'Clinical'} perspective · {state.lens === 'niss' ? 'Draft NISS' : state.lens === 'evidence' ? 'Evidence tiers' : 'QIF bands'}. Proposed research frameworks for defensive threat modelling; not a clinical assessment.</p>
    <div id="atlas"><BrainHeroMount selectedRegionId={state.selectedRegionId} onSelectRegion={(id) => dispatch({ type: 'region', id })}
      lens={taraBrainLens(state, techniques)} hideLensControl keyboardRegions techniqueIds={filterTtpList(techniques, state.perspective).map((t) => t.id)}
      renderRegionPanel={(model) => <TaraRegionPanel model={model} state={state} dispatch={dispatch} techniques={techniques} />} /></div>
  </div>;
}
