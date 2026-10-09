import type { AttackChain, ChainStep } from '@/components/atlas/AttackChainViz';
import { EVIDENCE_LABELS, ROLE_CONFIG, type EvidenceLabel } from '@/components/atlas/chain-constants';
import EvidenceMark, { EvidenceGlyph } from '@/components/lab-kit/EvidenceMark';
import { useSequencePlayback } from '@/components/lab-kit/motion/use-sequence-playback';
import PlaybackTransport from '@/components/lab-kit/PlaybackTransport';
import TechniqueLink from '@/components/lab-kit/TechniqueLink';
import { useFocus } from '@/components/workbench/FocusContext';
import { useOpenTechnique } from '@/components/workbench/use-open-technique';
import { useViewState } from '@/components/workbench/ViewStateContext';
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
const SELECTED_CHAIN_KEY = 'explore/curated-chains/selected-id';
const MAX_CHAIN_ID_LENGTH = 64;

function isChainId(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && value.length <= MAX_CHAIN_ID_LENGTH);
}

function ChainEvidenceMark({ label }: { label: EvidenceLabel }) {
  return <EvidenceGlyph evidence={{ level: MARK_LEVEL_BY_LABEL[label], label: EVIDENCE_LABELS[label].label }} />;
}

function StepEvidence({ step, technique }: { step: ChainStep; technique: CatalogTechnique | undefined }) {
  if (step.evidence !== undefined) return <><ChainEvidenceMark label={step.evidence.label} /> <span className="lab-soft">{step.evidence.note}</span></>;
  return technique === undefined ? <span className="lab-soft">No evidence note for this step.</span> : <EvidenceMark tier={technique.evidenceTier} status={technique.evidenceStatus} />;
}

interface StepProps {
  step: ChainStep;
  technique: CatalogTechnique | undefined;
  /** Where playback stands against this step. */
  stepState: 'now' | 'reached' | 'ahead';
  onOpenTechnique: (techniqueId: string) => void;
}

function ChainStepItem({ step, technique, stepState, onOpenTechnique }: StepProps) {
  return (
    <li data-state={stepState} aria-current={stepState === 'now' ? 'step' : undefined}>
      <div className="lab-step">
        <span className="lab-step-number lab-figure">{step.position}</span>
        <div>
          <p>
            <strong>{ROLE_CONFIG[step.role].label}</strong> · {technique?.name ?? step.tara_alias}{' '}
            {technique === undefined ? <span className="lab-id">{step.technique_id}</span> : <TechniqueLink techniqueId={technique.id} techniqueName={technique.name} onOpen={onOpenTechnique} />}
          </p>
          <p>{step.action}</p>
          <p><StepEvidence step={step} technique={technique} /></p>
        </div>
      </div>
    </li>
  );
}

interface DetailProps {
  chain: AttackChain;
  techniqueById: ReadonlyMap<string, CatalogTechnique>;
  onOpenTechnique: (techniqueId: string) => void;
}

function ChainDetail({ chain, techniqueById, onOpenTechnique }: DetailProps) {
  const playback = useSequencePlayback(chain.steps.length);
  const stateOf = (position: number): StepProps['stepState'] => {
    if (position === playback.reached && playback.reached < chain.steps.length) return 'now';
    return position <= playback.reached ? 'reached' : 'ahead';
  };
  return (
    <section className="lab-panel" id="lab-results" aria-label="Steps of the selected chain" tabIndex={-1}>
      <div className="lab-panel-body explore-chain">
        <h2 className="lab-panel-title">{chain.chain_name}</h2>
        <p className="lab-soft">Authored chain <span className="lab-id">{chain.chain_id}</span></p>
        <p>{chain.objective}</p>
        {chain.evidence !== undefined && (
          <p><ChainEvidenceMark label={chain.evidence.overall_label} /> <span className="lab-soft">{chain.evidence.rationale}{chain.evidence.extrapolation !== undefined && ` ${chain.evidence.extrapolation}`}</span></p>
        )}
        <PlaybackTransport playback={playback} stepCount={chain.steps.length} label="Chain playback" />
        <ol className="lab-steps">
          {chain.steps.map((step) => (
            <ChainStepItem key={step.position} step={step} technique={techniqueById.get(step.technique_id)} stepState={stateOf(step.position)} onOpenTechnique={onOpenTechnique} />
          ))}
        </ol>
        {chain.defenses.length > 0 && (
          <>
            <h3 className="lab-label">Defenses named by the chain</h3>
            <ul className="explore-list">{chain.defenses.map((defense) => <li key={defense}>{defense}</li>)}</ul>
          </>
        )}
      </div>
    </section>
  );
}

/** The hand-written chains from the catalog. They belong to no device, so they play along their own steps. */
export default function CuratedChains() {
  const { curatedChains, techniqueById } = useFocus();
  const [keptId, setSelectedId] = useViewState<string | null>(SELECTED_CHAIN_KEY, null, isChainId);
  const openTechnique = useOpenTechnique();
  // The first chain is shown until the reader picks one; a kept id the file no longer holds falls back to it.
  const selected = curatedChains.find((chain) => chain.chain_id === keptId) ?? curatedChains[0];

  if (selected === undefined) return <p className="lab-soft" id="lab-results">The catalog holds no authored chains.</p>;
  return (
    <div className="lab-split">
      <section className="lab-panel" aria-label="Authored chains">
        <div className="lab-panel-body">
          <p className="lab-soft">{curatedChains.length} chains written by hand from published work. Each step says how far it has been demonstrated. A chain is as weak as its weakest step.</p>
          <ul className="lab-pick-list">
            {curatedChains.map((chain) => (
              <li key={chain.chain_id}>
                <button type="button" className="lab-pick" aria-pressed={chain.chain_id === selected.chain_id} onClick={() => setSelectedId(chain.chain_id)}>
                  <span><strong>{chain.chain_name}</strong><span className="lab-soft"> · {chain.steps.length} steps</span></span>
                  {chain.evidence !== undefined && <span className="lab-pick-meta"><ChainEvidenceMark label={chain.evidence.overall_label} /></span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <ChainDetail key={selected.chain_id} chain={selected} techniqueById={techniqueById} onOpenTechnique={openTechnique} />
    </div>
  );
}
