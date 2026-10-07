import EvidenceMark, { EvidenceGlyph } from '@/components/lab-kit/EvidenceMark';
import type { SequencePlayback } from '@/components/lab-kit/motion/use-sequence-playback';
import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import type { ChainGenerationResult, GeneratedChain } from '@/lib/threat-model/chain-types';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { describeEvidence, type Evidence } from '@/lib/threat-model/evidence-levels';
import { describeElement } from '@/lib/threat-model/stride';
import { CHAIN_ROLE_LABELS, EDGE_BASIS_LABELS } from './chain-labels';

interface Props {
  model: DeviceModel;
  chainResult: ChainGenerationResult;
  techniqueById: ReadonlyMap<string, CatalogTechnique>;
  selectedChain: GeneratedChain | null;
  onSelectChain: (chainId: string | null) => void;
  playback: SequencePlayback;
}

/** A chain is as weak as its weakest step: the step whose evidence ranks last. */
function weakestEvidence(chain: GeneratedChain, techniqueById: Props['techniqueById']): Evidence {
  return chain.steps
    .map((step) => describeEvidence({ evidenceTier: techniqueById.get(step.technique_id)?.evidenceTier ?? null, evidenceStatus: step.evidenceStatus }))
    .reduce((weakest, evidence) => (evidence.rank > weakest.rank ? evidence : weakest));
}

/** A chain named by where it goes: the part of its first step, the part of its last, and its length. */
function describeRoute(chain: GeneratedChain, model: DeviceModel): string {
  const first = describeElement(model, chain.steps[0].elementId);
  const last = describeElement(model, chain.steps[chain.steps.length - 1].elementId);
  return first === last ? `Within ${first}` : `${first} to ${last}`;
}

function ChainSteps({ chain, model, techniqueById, playback }: { chain: GeneratedChain; model: DeviceModel; techniqueById: Props['techniqueById']; playback: SequencePlayback }) {
  return (
    <ol className="model-chain-steps">
      {chain.steps.map((step, index) => {
        const technique = techniqueById.get(step.technique_id);
        const edge = chain.edges.find((candidate) => candidate.toPosition === step.position);
        const state = step.position === playback.reached && playback.reached < chain.steps.length ? 'now' : step.position <= playback.reached ? 'reached' : 'ahead';
        return (
          <li key={step.position} data-state={state} aria-current={state === 'now' ? 'step' : undefined}>
            {index > 0 && <p className="model-chain-reason lab-soft" data-basis={edge?.basis}>Follows because {edge === undefined ? 'no reason is recorded' : EDGE_BASIS_LABELS[edge.basis]}.</p>}
            <div className="model-chain-step">
              <span className="model-chain-number lab-figure">{step.position}</span>
              <div>
                <p><strong>{CHAIN_ROLE_LABELS[step.role]}</strong> on {describeElement(model, step.elementId)}</p>
                <p>{technique?.name ?? step.action} <span className="lab-id">{step.technique_id}</span></p>
                <EvidenceMark tier={technique?.evidenceTier ?? null} status={step.evidenceStatus} />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Generated chains for this device. Each one is a hypothesis and stays labelled as one.
 * Choosing a chain draws it on the diagram; playing it reaches the steps in order.
 */
export default function ChainsSection({ model, chainResult, techniqueById, selectedChain, onSelectChain, playback }: Props) {
  const { chains, wasTruncated, emptyReason } = chainResult;
  return (
    <div className="model-chains">
      <section className="lab-panel" aria-label="Chain hypotheses">
        <div className="lab-panel-body">
          <p className="lab-soft">
            Chains are assembled along real paths in your device model, using only techniques the engine admits on evidence.
            Every chain is a hypothesis for review: a path through the model exists, which is not evidence the attack has been carried out.
          </p>
          {wasTruncated && <p className="tm-notice">The search stopped at its limit. Other chains may exist.</p>}
          {chains.length === 0 && <p className="tm-notice">No chains to show. {emptyReason}</p>}
          <ul className="model-chain-list">
            {chains.map((chain) => (
              <li key={chain.chain_id}>
                <button type="button" className="model-chain-pick" aria-pressed={chain.chain_id === selectedChain?.chain_id} onClick={() => onSelectChain(chain.chain_id === selectedChain?.chain_id ? null : chain.chain_id)}>
                  <span>
                    <strong>{describeRoute(chain, model)}</strong>
                    <span className="lab-soft"> · {chain.steps.length} steps</span>
                    <span className="lab-soft model-chain-name">{chain.chain_name}</span>
                  </span>
                  <span className="model-chain-weakest"><span className="lab-label">Weakest step</span> <EvidenceGlyph evidence={weakestEvidence(chain, techniqueById)} /></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="lab-panel" aria-label="Steps of the selected chain">
        <div className="lab-panel-body">
          {selectedChain === null ? <p className="lab-soft">Choose a chain to see its steps and draw it on the diagram.</p> : (
            <>
              <p><span className="tm-badge tm-badge--generated">Generated hypothesis</span> <strong>{describeRoute(selectedChain, model)}</strong></p>
              <div className="model-chain-transport" role="group" aria-label="Chain playback">
                <button type="button" className="tm-button tm-button--primary" onClick={playback.isPlaying ? playback.pause : playback.play}>{playback.isPlaying ? 'Pause' : 'Play'}</button>
                <button type="button" className="tm-button" onClick={playback.stepBack}>Back</button>
                <button type="button" className="tm-button" onClick={playback.stepForward}>Step</button>
                <button type="button" className="tm-button" onClick={playback.showAll}>Show all</button>
                <span className="lab-soft" role="status">Step {Math.min(playback.reached, selectedChain.steps.length)} of {selectedChain.steps.length}</span>
              </div>
              <ChainSteps chain={selectedChain} model={model} techniqueById={techniqueById} playback={playback} />
              <p className="lab-soft"><span className="lab-id">{selectedChain.chain_id}</span>. Generator {selectedChain.generatorVersion}, catalog version {selectedChain.registrarVersion}.</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
