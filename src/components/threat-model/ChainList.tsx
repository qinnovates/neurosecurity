import { EvidenceGlyph } from '@/components/lab-kit/EvidenceMark';
import type { ChainGenerationResult, GeneratedChain, GeneratedChainEdge, GeneratedChainStep } from '@/lib/threat-model/chain-types';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { describeEvidence } from '@/lib/threat-model/evidence-levels';
import { describeElement } from '@/lib/threat-model/stride';
import { CHAIN_ROLE_LABELS, EDGE_BASIS_LABELS } from './chain-labels';

interface Props {
  model: DeviceModel;
  chainResult: ChainGenerationResult;
}

const HYPOTHESIS_LABEL = 'Generated hypothesis';
const ABOUT_CHAINS = 'Chains are assembled along real paths in your device model, using only techniques with confirmed or demonstrated evidence. '
  + 'Every chain is a hypothesis for review, whatever the evidence behind its individual steps: a path through the model exists, which is not evidence the attack has been carried out.';

function ChainStepItem({ step, edge, model }: { step: GeneratedChainStep; edge: GeneratedChainEdge | undefined; model: DeviceModel }) {
  return (
    <li>
      <div className="lab-step">
        <span className="lab-step-number">{step.position}</span>
        <div>
          <p><strong>{CHAIN_ROLE_LABELS[step.role]}</strong> on {describeElement(model, step.elementId)}</p>
          <p>{step.action}</p>
          <p className="report-step-meta"><span className="lab-id">{step.technique_id}</span> <EvidenceGlyph evidence={describeEvidence(step)} labelForm="short" /></p>
        </div>
      </div>
      {edge !== undefined && <p className="lab-step-reason" data-basis={edge.basis}>Step {edge.fromPosition} to {edge.toPosition}: {EDGE_BASIS_LABELS[edge.basis]}.</p>}
    </li>
  );
}

function ChainSteps({ chain, model }: { chain: GeneratedChain; model: DeviceModel }) {
  const weakest = describeEvidence({ evidenceTier: chain.weakestEvidenceTier, evidenceStatus: chain.weakestEvidenceStatus });
  return (
    <article className="report-chain">
      <h3 className="report-subheading">{chain.chain_name}</h3>
      <p className="report-step-meta"><span className="report-tag">{HYPOTHESIS_LABEL}</span> Weakest step: <EvidenceGlyph evidence={weakest} /></p>
      <ol className="lab-steps">
        {chain.steps.map((step) => <ChainStepItem key={step.position} step={step} model={model} edge={chain.edges.find((candidate) => candidate.fromPosition === step.position)} />)}
      </ol>
      <p className="lab-soft"><span className="lab-id">{chain.chain_id}</span>. Generator {chain.generatorVersion}, catalog version {chain.registrarVersion}.</p>
    </article>
  );
}

/** Generated chains as the report prints them: each a plain numbered list of steps, with why each step follows the last. */
export default function ChainList({ model, chainResult }: Props) {
  const { chains, wasTruncated, wasCapped, chainsFound, emptyReason } = chainResult;
  return (
    <div>
      <p>{ABOUT_CHAINS}</p>
      {wasTruncated && <p className="lab-notice">The search stopped at its limit. Other chains may exist.</p>}
      {wasCapped && <p className="lab-notice">Showing the first {chains.length} of {chainsFound} chains found.</p>}
      {chains.length === 0 && <p className="lab-notice">No chains to show. {emptyReason}</p>}
      {chains.map((chain) => <ChainSteps key={chain.chain_id} chain={chain} model={model} />)}
    </div>
  );
}
