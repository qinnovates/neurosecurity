import { useEffect, useMemo, useRef, type RefObject } from 'react';
import EmptyState from '@/components/lab-kit/EmptyState';
import EvidenceMark from '@/components/lab-kit/EvidenceMark';
import { useReducedMotion } from '@/components/lab-kit/motion/use-reduced-motion';
import type { SequencePlayback } from '@/components/lab-kit/motion/use-sequence-playback';
import Panel from '@/components/lab-kit/Panel';
import TechniqueLink from '@/components/lab-kit/TechniqueLink';
import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import { summariseChainLanes } from '@/lib/threat-model/chain-lanes';
import { CHAIN_HYPOTHESIS_STATEMENT, type ChainGenerationResult, type GeneratedChain } from '@/lib/threat-model/chain-types';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { describeElement } from '@/lib/threat-model/stride';
import { CHAIN_ROLE_LABELS, EDGE_BASIS_LABELS, HYPOTHESIS_LABEL } from './chain-labels';
import ChainLaneTable from './frame/ChainLaneTable';

interface Props {
  model: DeviceModel;
  /** The chains the selected part lets through. */
  chainResult: ChainGenerationResult;
  /** Chains generated for the whole device, so an empty list can say whether the part or the generator emptied it. */
  deviceChainCount: number;
  techniqueById: ReadonlyMap<string, CatalogTechnique>;
  selectedChain: GeneratedChain | null;
  onSelectChain: (chainId: string | null) => void;
  playback: SequencePlayback;
  onOpenTechnique: (techniqueId: string) => void;
}

export { HYPOTHESIS_LABEL } from './chain-labels';

type StepsProps = Pick<Props, 'model' | 'techniqueById' | 'playback' | 'onOpenTechnique'> & { chain: GeneratedChain };

/**
 * Brings the step being played into view under the diagram, once per step. Nothing scrolls
 * until playback moves: opening a chain leaves the page where the reader put it.
 */
function useFollowStep(listRef: RefObject<HTMLOListElement | null>, reached: number): void {
  const isReduced = useReducedMotion();
  const lastReached = useRef(reached);
  useEffect(() => {
    if (lastReached.current === reached) return;
    lastReached.current = reached;
    const current = listRef.current?.querySelector<HTMLElement>('li[data-state="now"]');
    current?.scrollIntoView?.({ behavior: isReduced ? 'auto' : 'smooth', block: 'nearest' });
  }, [listRef, reached, isReduced]);
}

function ChainSteps({ chain, model, techniqueById, playback, onOpenTechnique }: StepsProps) {
  const listRef = useRef<HTMLOListElement>(null);
  useFollowStep(listRef, playback.reached);
  return (
    <ol className="lab-steps model-chain-steps" ref={listRef}>
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
                <p>{technique?.name ?? step.action} <TechniqueLink techniqueId={step.technique_id} techniqueName={technique?.name} onOpen={onOpenTechnique} /></p>
                <EvidenceMark tier={step.evidenceTier} status={step.evidenceStatus} />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function SelectedChain({ chain, ...stepsProps }: StepsProps) {
  return (
    <Panel title={chain.chain_name} actions={<span className="model-tag">{HYPOTHESIS_LABEL}</span>}>
      <ChainSteps chain={chain} {...stepsProps} />
      <p className="lab-soft"><span className="lab-id">{chain.chain_id}</span>. Generator {chain.generatorVersion}, catalog version {chain.registrarVersion}.</p>
    </Panel>
  );
}

function NoChains({ chainResult, deviceChainCount }: Pick<Props, 'chainResult' | 'deviceChainCount'>) {
  if (deviceChainCount > 0) {
    return <EmptyState reason="nothing-shown" title="No chain shown acts on the selected part." action={<p>Choose "Show everything" to see the rest.</p>} />;
  }
  return <p className="lab-notice">No chains to show. {chainResult.emptyReason}</p>;
}

/**
 * Generated chains for this device, as lanes across its parts. Each one is a hypothesis and
 * stays labelled as one. Choosing a lane shows its steps and draws it on the diagram, whose
 * bar carries the playback controls so they stay in view; playing reaches the steps in order.
 */
export default function ChainsSection({ model, chainResult, deviceChainCount, techniqueById, selectedChain, onSelectChain, playback, onOpenTechnique }: Props) {
  const lanes = useMemo(() => summariseChainLanes(model, chainResult), [model, chainResult]);
  return (
    <div className="model-stack">
      <section className="lab-panel" aria-label="Chain hypotheses">
        <div className="lab-panel-body">
          <p className="lab-soft">{CHAIN_HYPOTHESIS_STATEMENT}</p>
          {chainResult.wasTruncated && <p className="lab-notice">The search stopped at its limit. Other chains may exist.</p>}
          {lanes.wasCapped && <p className="lab-notice">{lanes.lanes.length} of {lanes.chainsFound} chains found are shown.</p>}
        </div>
        <div>
          {lanes.lanes.length === 0 ? <NoChains chainResult={chainResult} deviceChainCount={deviceChainCount} /> : (
            <ChainLaneTable lanes={lanes} chains={chainResult.chains} selectedChainId={selectedChain?.chain_id ?? null} reached={playback.reached} onSelectChain={onSelectChain} />
          )}
        </div>
      </section>
      {selectedChain === null
        ? lanes.lanes.length > 0 && <p className="lab-soft">Choose a chain to see its steps and draw it on the diagram.</p>
        : <SelectedChain chain={selectedChain} model={model} techniqueById={techniqueById} playback={playback} onOpenTechnique={onOpenTechnique} />}
    </div>
  );
}
