import { useRef } from 'react';
import { EvidenceGlyph } from '@/components/lab-kit/EvidenceMark';
import { useListReflow } from '@/components/lab-kit/motion/use-list-reflow';
import type { ChainLane, ChainLanes } from '@/lib/threat-model/chain-lanes';
import type { GeneratedChain } from '@/lib/threat-model/chain-types';
import { describeEvidence } from '@/lib/threat-model/evidence-levels';
import type { ModelElement } from '@/lib/threat-model/model-order';
import { useModelHighlight } from '../model-highlight';

interface Props {
  lanes: ChainLanes;
  chains: readonly GeneratedChain[];
  selectedChainId: string | null;
  /** How many steps of the selected chain playback has reached. */
  reached: number;
  onSelectChain: (chainId: string | null) => void;
}

export const NONE_SHOWN_LABEL = 'none shown';
const CAPTION = 'Generated hypotheses. A number is a step, in the column of the part or connection it acts on.';

type StepState = 'still' | 'ahead' | 'reached' | 'now';

function stepStateOf(position: number, stepCount: number, isSelected: boolean, reached: number): StepState {
  if (!isSelected) return 'still';
  if (position === reached && reached < stepCount) return 'now';
  return position <= reached ? 'reached' : 'ahead';
}

/** A chain named by where it goes: the element its first step acts on and the element its last step acts on. */
export function describeLaneRoute(lane: ChainLane, elements: readonly ModelElement[]): string {
  const labelOf = (elementId: string): string => elements.find((element) => element.id === elementId)?.label ?? elementId;
  const first = labelOf(lane.steps[0].elementId);
  const last = labelOf(lane.steps[lane.steps.length - 1].elementId);
  return first === last ? `Stays on ${first}` : `Starts on ${first}, ends on ${last}`;
}

function LaneRow({ lane, chain, elements, isSelected, reached, onSelectChain }: {
  lane: ChainLane; chain: GeneratedChain | undefined; elements: readonly ModelElement[]; isSelected: boolean; reached: number; onSelectChain: Props['onSelectChain'];
}) {
  const highlight = useModelHighlight();
  return (
    <tr data-reflow-key={lane.chainId} aria-current={isSelected ? 'true' : undefined}>
      <th scope="row" className="model-lane-name">
        <button type="button" className="model-lane-pick" aria-pressed={isSelected} onClick={() => onSelectChain(isSelected ? null : lane.chainId)}>
          <strong>{describeLaneRoute(lane, elements)}</strong>
          <span className="lab-soft">{lane.chainName}</span>
        </button>
      </th>
      {elements.map((element) => (
        <td key={element.id} className="model-lane-slot" data-lit={highlight.isLit(element.id)}>
          {lane.steps.filter((step) => step.elementId === element.id).map((step) => (
            <span key={step.position} className="model-lane-step lab-figure" data-state={stepStateOf(step.position, lane.steps.length, isSelected, reached)}>{step.position}</span>
          ))}
        </td>
      ))}
      <td>{chain !== undefined && <EvidenceGlyph evidence={describeEvidence({ evidenceTier: chain.weakestEvidenceTier, evidenceStatus: chain.weakestEvidenceStatus })} labelForm="short" />}</td>
    </tr>
  );
}

/**
 * Lanes: one row per generated chain, one column per part or connection in model order,
 * step numbers where the chain acts, and under each column how many of the chains shown act there.
 */
export default function ChainLaneTable({ lanes, chains, selectedChainId, reached, onSelectChain }: Props) {
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const highlight = useModelHighlight();
  useListReflow(bodyRef, lanes.lanes.map((lane) => lane.chainId).join('\n'));
  const chainById = new Map(chains.map((chain) => [chain.chain_id as string, chain]));

  return (
    <div className="model-matrix-wrap">
      <table className="lab-table model-lanes">
        <caption className="lab-label">{CAPTION}</caption>
        <thead>
          <tr>
            <th scope="col"><span className="lab-table-head">Chain</span></th>
            {lanes.elements.map((element) => (
              <th key={element.id} scope="col" className="model-matrix-column" {...highlight.bind(element.id)}><span className="lab-table-head">{element.label}</span></th>
            ))}
            <th scope="col"><span className="lab-table-head">Weakest step</span></th>
          </tr>
        </thead>
        <tbody ref={bodyRef}>
          {lanes.lanes.map((lane) => (
            <LaneRow
              key={lane.chainId} lane={lane} chain={chainById.get(lane.chainId)} elements={lanes.elements}
              isSelected={lane.chainId === selectedChainId} reached={reached} onSelectChain={onSelectChain}
            />
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="model-lane-name">Chains shown</th>
            {lanes.elements.map((element) => {
              const count = lanes.chainIdsByElement[element.id]?.length ?? 0;
              return <td key={element.id} className="model-lane-slot">{count === 0 ? <span className="lab-soft">{NONE_SHOWN_LABEL}</span> : <span className="lab-figure">{count}</span>}</td>;
            })}
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
