import EvidenceMark, { EvidenceGlyph } from '@/components/lab-kit/EvidenceMark';
import type { SequencePlayback } from '@/components/lab-kit/motion/use-sequence-playback';
import PlaybackTransport from '@/components/lab-kit/PlaybackTransport';
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
    <ol className="lab-steps">
      {chain.steps.map((step, index) => {
        const technique = techniqueById.get(step.technique_id);
        const edge = chain.edges.find((candidate) => candidate.toPosition === step.position);
        const state = step.position === playback.reached && playback.reached < chain.steps.length ? 'now' : step.position <= playback.reached ? 'reached' : 'ahead';
        return (
          <li key={step.position} data-state={state} aria-current={state === 'now' ? 'step' : undefined}>
            {index > 0 && <p className="lab-step-reason lab-soft" data-basis={edge?.basis}>Follows because {edge === undefined ? 'no reason is recorded' : EDGE_BASIS_LABELS[edge.basis]}.</p>}
            <div className="lab-step">
              <span className="lab-step-number lab-figure">{step.position}</span>
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
    <div className="lab-split">
      <section className="lab-panel" aria-label="Chain hypotheses">
        <div className="lab-panel-body">
          <p className="lab-soft">
            Chains are assembled along real paths in your device model, using only techniques the engine admits on evidence.
            Every chain is a hypothesis for review: a path through the model exists, which is not evidence the attack has been carried out.
          </p>
          {wasTruncated && <p className="tm-notice">The search stopped at its limit. Other chains may exist.</p>}
          {chains.length === 0 && <p className="tm-notice">No chains to show. {emptyReason}</p>}
          <ul className="lab-pick-list">
            {chains.map((chain) => (
              <li key={chain.chain_id}>
                <button type="button" className="lab-pick" aria-pressed={chain.chain_id === selectedChain?.chain_id} onClick={() => onSelectChain(chain.chain_id === selectedChain?.chain_id ? null : chain.chain_id)}>
                  <span>
                    <strong>{describeRoute(chain, model)}</strong>
                    <span className="lab-soft"> · {chain.steps.length} steps</span>
                    <span className="lab-soft lab-pick-sub">{chain.chain_name}</span>
                  </span>
                  <span className="lab-pick-meta"><span className="lab-label">Weakest step</span> <EvidenceGlyph evidence={weakestEvidence(chain, techniqueById)} /></span>
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
              <PlaybackTransport playback={playback} stepCount={selectedChain.steps.length} label="Chain playback" />
              <ChainSteps chain={selectedChain} model={model} techniqueById={techniqueById} playback={playback} />
              <p className="lab-soft"><span className="lab-id">{selectedChain.chain_id}</span>. Generator {selectedChain.generatorVersion}, catalog version {selectedChain.registrarVersion}.</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
