import { useState } from 'react';
import type { AttackChain, ChainStep } from '@/components/atlas/AttackChainViz';
import { EVIDENCE_LABELS, ROLE_CONFIG, type EvidenceLabel } from '@/components/atlas/chain-constants';
import EvidenceMark, { EvidenceGlyph } from '@/components/lab-kit/EvidenceMark';
import { useSequencePlayback } from '@/components/lab-kit/motion/use-sequence-playback';
import PlaybackTransport from '@/components/lab-kit/PlaybackTransport';
import { useFocus } from '@/components/workbench/FocusContext';
import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import type { EvidenceLevel } from '@/lib/threat-model/evidence-levels';

/**
 * How solid to draw each of the chain file's own evidence labels. This borrows the mark's
 * solidity only; the words shown are the chain file's, not the catalog's tiers.
 */
const MARK_LEVEL_BY_LABEL: Record<EvidenceLabel, EvidenceLevel> = {
  demonstrated: 'demonstrated',
  partly_demonstrated: 'theoretical',
  projected: 'speculative',
};

function ChainEvidenceMark({ label }: { label: EvidenceLabel }) {
  return <EvidenceGlyph evidence={{ level: MARK_LEVEL_BY_LABEL[label], label: EVIDENCE_LABELS[label].label }} />;
}

function StepEvidence({ step, technique }: { step: ChainStep; technique: CatalogTechnique | undefined }) {
  if (step.evidence !== undefined) return <><ChainEvidenceMark label={step.evidence.label} /> <span className="lab-soft">{step.evidence.note}</span></>;
  return technique === undefined ? <span className="lab-soft">No evidence note for this step.</span> : <EvidenceMark tier={technique.evidenceTier} status={technique.evidenceStatus} />;
}

function ChainDetail({ chain, techniqueById }: { chain: AttackChain; techniqueById: ReadonlyMap<string, CatalogTechnique> }) {
  const playback = useSequencePlayback(chain.steps.length);
  return (
    <section className="lab-panel" aria-label="Steps of the selected chain">
      <div className="lab-panel-body">
        <h2 className="lab-title">{chain.chain_name}</h2>
        <p><span className="tm-badge">Authored chain</span> <span className="lab-id">{chain.chain_id}</span></p>
        <p>{chain.objective}</p>
        {chain.evidence !== undefined && (
          <p><ChainEvidenceMark label={chain.evidence.overall_label} /> <span className="lab-soft">{chain.evidence.rationale}{chain.evidence.extrapolation !== undefined && ` ${chain.evidence.extrapolation}`}</span></p>
        )}
        <PlaybackTransport playback={playback} stepCount={chain.steps.length} label="Chain playback" />
        <ol className="lab-steps">
          {chain.steps.map((step) => {
            const technique = techniqueById.get(step.technique_id);
            const state = step.position === playback.reached && playback.reached < chain.steps.length ? 'now' : step.position <= playback.reached ? 'reached' : 'ahead';
            return (
              <li key={step.position} data-state={state} aria-current={state === 'now' ? 'step' : undefined}>
                <div className="lab-step">
                  <span className="lab-step-number lab-figure">{step.position}</span>
                  <div>
                    <p><strong>{ROLE_CONFIG[step.role].label}</strong> · {technique?.name ?? step.tara_alias} <span className="lab-id">{step.technique_id}</span></p>
                    <p>{step.action}</p>
                    <p><StepEvidence step={step} technique={technique} /></p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        {chain.defenses.length > 0 && (
          <>
            <h3 className="lab-label">Defenses named by the chain</h3>
            <ul className="catalog-panel-list">{chain.defenses.map((defense) => <li key={defense}>{defense}</li>)}</ul>
          </>
        )}
      </div>
    </section>
  );
}

/** The hand-written chains from the catalog. They belong to no device, so they play along their own steps. */
export default function CuratedChains() {
  const { curatedChains, techniqueById } = useFocus();
  const [selectedId, setSelectedId] = useState<string | null>(curatedChains[0]?.chain_id ?? null);
  const selected = curatedChains.find((chain) => chain.chain_id === selectedId) ?? null;

  if (curatedChains.length === 0) return <p className="lab-soft">The catalog holds no authored chains.</p>;
  return (
    <div className="lab-split">
      <section className="lab-panel" aria-label="Authored chains">
        <div className="lab-panel-body">
          <p className="lab-soft">{curatedChains.length} chains written by hand from published work. Each step says how far it has been demonstrated. A chain is as weak as its weakest step.</p>
          <ul className="lab-pick-list">
            {curatedChains.map((chain) => (
              <li key={chain.chain_id}>
                <button type="button" className="lab-pick" aria-pressed={chain.chain_id === selectedId} onClick={() => setSelectedId(chain.chain_id)}>
                  <span><strong>{chain.chain_name}</strong><span className="lab-soft"> · {chain.steps.length} steps</span></span>
                  {chain.evidence !== undefined && <span className="lab-pick-meta"><ChainEvidenceMark label={chain.evidence.overall_label} /></span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {selected !== null && <ChainDetail key={selected.chain_id} chain={selected} techniqueById={techniqueById} />}
    </div>
  );
}
