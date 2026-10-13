import { useId } from 'react';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { AtlasChains } from '@/lib/atlas-explorer/chain-file';
import { EVIDENCE_LABEL_WORDS, buildChainSteps, tallyChainSteps, type ChainStepView } from '@/lib/atlas-explorer/chain-steps';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { nameBands } from '@/lib/atlas-explorer/explorer-model';
import LimitNote from './LimitNote';
import LoadNotice from './LoadNotice';
import type { ChainView as ChainViewState } from './use-chain-view';

interface Props {
  model: ExplorerModel;
  view: ChainViewState;
}

const NO_CHAIN = '';

/** Counted over every threat model in the file, so the page says up front how little of this reaches the picture of the brain. */
function tallyAll(model: ExplorerModel, chains: AtlasChains): { lit: string; total: string; chains: string } {
  const tallies = chains.chains.map((chain) => tallyChainSteps(buildChainSteps(model, chain)));
  const sum = (key: 'lit' | 'total'): string => String(tallies.reduce((total, tally) => total + tally[key], 0));
  return { lit: sum('lit'), total: sum('total'), chains: String(chains.chains.length) };
}

function StepLine({ model, step, isCurrent, rules }: { model: ExplorerModel; step: ChainStepView; isCurrent: boolean; rules: AtlasChains['label_rules'] }) {
  return (
    <li className="atlas-chain-step" data-chain-step={step.position} data-current={isCurrent} aria-current={isCurrent ? 'step' : undefined}>
      <span className="atlas-chain-number" aria-hidden="true">{step.position}</span>
      <div>
        <p className="atlas-fact"><span className="sr-only">Step {step.position}: </span><strong>{step.techniqueName}</strong> <span className="atlas-id">{step.techniqueId}</span></p>
        <p className="atlas-fact">{step.action}</p>
        {step.evidenceLabel !== null && <p className="atlas-row-why"><strong>{EVIDENCE_LABEL_WORDS[step.evidenceLabel]}.</strong> {rules[step.evidenceLabel]}</p>}
        <p className="atlas-row-why" data-step-stages={step.stageIds.join(' ')}>
          {step.stageIds.length === 0 ? 'The catalog tags this technique with no device stage.' : `Device ${step.stageIds.length === 1 ? 'stage' : 'stages'}: ${nameBands(model, step.stageIds)}.`}
        </p>
        <p className="atlas-row-why" data-step-regions={step.litRegions.map((region) => region.id).join(' ')}>
          {step.litRegions.length === 0 ? 'Lights no region.' : `Lights: ${step.litRegions.map((region) => region.name).join(', ')}.`}
        </p>
      </div>
    </li>
  );
}

function Controls({ view }: { view: ChainViewState }) {
  const positionId = useId();
  const { playback, steps, act } = view;
  return (
    <div className="atlas-chain-controls" role="group" aria-label="Step through the threat model">
      <button type="button" className="atlas-button" onClick={() => act({ type: 'previous' })} disabled={playback.position <= 1}>Previous step</button>
      <button type="button" className="atlas-button atlas-chain-play" data-chain-play={playback.isPlaying} onClick={() => act({ type: playback.isPlaying ? 'pause' : 'play' })}>
        {playback.isPlaying ? 'Pause' : 'Play the steps'}
      </button>
      <button type="button" className="atlas-button" onClick={() => act({ type: 'next' })} disabled={playback.position >= steps.length}>Next step</button>
      <label className="atlas-chain-position" htmlFor={positionId}>
        <span>Step {playback.position} of {steps.length}</span>
        <input id={positionId} type="range" min={1} max={steps.length} step={1} value={playback.position} onChange={(event) => act({ type: 'seek', position: Number(event.target.value) })} />
      </label>
    </div>
  );
}

/**
 * A threat model's steps, in the order the model gives them. The visitor
 * chooses a model and moves through it: each step lights what the technique
 * lens lights for its technique, and marks its device stages on the rail.
 * The sentence about what the order means is always on screen with it.
 * Nothing is fetched until the visitor asks, and nothing here draws or
 * describes anything passing from one step's place to the next.
 */
export default function ChainView({ model, view }: Props) {
  const selectId = useId();
  const { chains, chain, steps, playback, isWhole } = view;
  const tally = tallyChainSteps(steps);
  return (
    <section className="atlas-panel atlas-chain" aria-labelledby="atlas-chain-heading" data-chain-id={chain?.chain_id ?? ''} data-chain-whole={isWhole}>
      <h2 className="atlas-heading" id="atlas-chain-heading">Threat model steps</h2>
      <LimitNote limit={limitSentence('chain_order')} />
      <LimitNote limit={limitSentence('chain_not_incident')} />
      {chains.status === 'idle' && <button type="button" className="atlas-button" onClick={view.ask}>Show the threat models</button>}
      <LoadNotice what="the threat models" state={chains} onRetry={view.retry} />
      {chains.status === 'ready' && (
        <>
          <LimitNote limit={limitSentence('chain_overall_tally', tallyAll(model, chains.data))} />
          <label className="atlas-label" htmlFor={selectId}>Threat model</label>
          <select id={selectId} className="atlas-input" value={chain?.chain_id ?? NO_CHAIN} onChange={(event) => view.choose(event.target.value === NO_CHAIN ? null : event.target.value)}>
            <option value={NO_CHAIN}>None</option>
            {chains.data.chains.map((option) => <option key={option.chain_id} value={option.chain_id}>{option.chain_name} ({option.chain_id})</option>)}
          </select>
        </>
      )}
      {chains.status === 'ready' && chain !== null && (
        <>
          <LimitNote limit={limitSentence('chain_step_tally', { lit: String(tally.lit), total: String(tally.total) })} />
          {isWhole ? <LimitNote limit={limitSentence('chain_all_at_once')} /> : <Controls view={view} />}
          <ol className="atlas-chain-steps">
            {steps.map((step) => <StepLine key={step.position} model={model} step={step} isCurrent={!isWhole && step.position === playback.position} rules={chains.data.label_rules} />)}
          </ol>
          {!isWhole && <p className="sr-only" role="status" aria-live="polite" data-announce="chain-step">Step {playback.position} of {steps.length}: {steps[playback.position - 1]?.techniqueName}.</p>}
        </>
      )}
    </section>
  );
}
