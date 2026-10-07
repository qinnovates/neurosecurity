import AttackChainViz from '@/components/atlas/AttackChainViz';
import type { ChainGenerationResult, GeneratedChain } from '@/lib/threat-model/chain-types';
import { EDGE_BASIS_LABELS } from './chain-labels';

interface Props {
  chainResult: ChainGenerationResult;
  selectedChainId?: string | null;
  /** Omit in the printed report, where chains cannot be selected. */
  onSelectChain?: (chainId: string | null) => void;
}

function ChainCard({ chain, isSelected, onSelectChain }: { chain: GeneratedChain; isSelected: boolean; onSelectChain?: (chainId: string | null) => void }) {
  return (
    <article className="tm-card">
      <div className="tm-actions" style={{ alignItems: 'center', marginBottom: '0.5rem' }}>
        <span className="tm-badge tm-badge--generated">Generated hypothesis</span>
        <span className="tm-badge">Weakest step: {chain.weakestEvidenceStatus}</span>
        {onSelectChain !== undefined && (
          <button type="button" className="tm-button tm-no-print" aria-pressed={isSelected} onClick={() => onSelectChain(isSelected ? null : chain.chain_id)}>
            {isSelected ? 'Hide on diagram' : 'Show on diagram'}
          </button>
        )}
      </div>
      <AttackChainViz chain={chain} />
      {/* Folded on screen to keep the list scannable; always open in the printed report. */}
      <details className="tm-chain-basis" open={onSelectChain === undefined}>
        <summary>Why each step follows the last</summary>
      <ol className="tm-list">
        {chain.edges.map((edge) => (
          <li key={edge.fromPosition}>Step {edge.fromPosition} to {edge.toPosition}: {EDGE_BASIS_LABELS[edge.basis]}.</li>
        ))}
      </ol>
      <p className="tm-muted tm-small">
        <span className="tm-mono">{chain.chain_id}</span>. Generator {chain.generatorVersion}, catalog version {chain.registrarVersion}.
      </p>
      </details>
    </article>
  );
}

export default function ChainList({ chainResult, selectedChainId = null, onSelectChain }: Props) {
  const { chains, wasTruncated, emptyReason } = chainResult;
  return (
    <div>
      <p className="tm-muted" style={{ marginBottom: '0.75rem' }}>
        Chains are assembled along real paths in your device model, using only techniques with confirmed or demonstrated evidence.
        Every chain is a hypothesis for review, whatever the evidence behind its individual steps: a path through the model exists, which is not evidence the attack has been carried out.
      </p>
      {wasTruncated && <p className="tm-notice">The search stopped at its limit. Other chains may exist.</p>}
      {chains.length === 0 && <p className="tm-notice">No chains to show. {emptyReason}</p>}
      {chains.map((chain) => (
        <ChainCard key={chain.chain_id} chain={chain} isSelected={chain.chain_id === selectedChainId} onSelectChain={onSelectChain} />
      ))}
    </div>
  );
}
