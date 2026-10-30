import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { DeviceRail, RailStage, RailTechnique } from '@/lib/atlas-explorer/rail-stages';
import LimitNote from './LimitNote';

interface Props {
  rail: DeviceRail;
  includesMixed: boolean;
  /** The stage being emphasised, by band id, or null. */
  activeStageId: string | null;
  /** The technique the lens is on, so its entry reads as current. */
  chosenTechniqueId: string | null;
  /** While a threat model's steps are shown: the numbers of the steps on screen whose technique carries each stage. */
  stepNumbersByStage?: ReadonlyMap<string, readonly number[]>;
  onToggleStage: (stageId: string) => void;
  onToggleMixed: () => void;
  onChooseTechnique: (techniqueId: string) => void;
}

interface TechniqueProps {
  technique: RailTechnique;
  isChosen: boolean;
  onChooseTechnique: (techniqueId: string) => void;
}

function RailTechniqueItem({ technique, isChosen, onChooseTechnique }: TechniqueProps) {
  const isMixed = technique.neuralBandIds.length > 0;
  return (
    <li className="atlas-rail-item" data-technique-id={technique.id} data-mixed={isMixed}>
      <button type="button" className="atlas-rail-technique" aria-current={isChosen ? 'true' : undefined} onClick={() => onChooseTechnique(technique.id)}>
        <span className="atlas-rail-name">{technique.name}</span>
        <span className="atlas-id">{technique.id}</span>
      </button>
      {isMixed && (
        <p className="atlas-row-why">
          Also carries {technique.neuralBandNames}.{' '}
          {technique.draftedLinkCount === 0 ? 'No region link drafted.' : `${technique.draftedLinkCount} region ${technique.draftedLinkCount === 1 ? 'link' : 'links'} drafted.`}
        </p>
      )}
    </li>
  );
}

interface StageProps extends Pick<Props, 'chosenTechniqueId' | 'onToggleStage' | 'onChooseTechnique'> {
  stage: RailStage;
  isActive: boolean;
  /** The threat-model steps on screen that are tagged with this stage. Empty when none is. */
  stepNumbers: readonly number[];
}

function Stage({ stage, isActive, stepNumbers, chosenTechniqueId, onToggleStage, onChooseTechnique }: StageProps) {
  const listId = `atlas-stage-${stage.band.id}`;
  return (
    <li className="atlas-stage" data-active={isActive} data-stage-id={stage.band.id} data-chain-steps={stepNumbers.length === 0 ? undefined : stepNumbers.join(' ')}>
      {stepNumbers.length > 0 && (
        <p className="atlas-step-badge" key={stepNumbers.join(' ')}>Threat model {stepNumbers.length === 1 ? 'step' : 'steps'} {stepNumbers.join(', ')}</p>
      )}
      <button type="button" className="atlas-stage-button" aria-expanded={isActive} aria-controls={listId} onClick={() => onToggleStage(stage.band.id)}>
        <span className="atlas-band-code">{stage.band.id}</span>
        <span className="atlas-stage-name">{stage.band.name}</span>
        <span className="atlas-band-count">{stage.techniques.length} {stage.techniques.length === 1 ? 'technique' : 'techniques'}</span>
      </button>
      <ul className="atlas-rail-list" id={listId} hidden={!isActive}>
        {isActive && stage.techniques.map((technique) => (
          <RailTechniqueItem key={technique.id} technique={technique} isChosen={technique.id === chosenTechniqueId} onChooseTechnique={onChooseTechnique} />
        ))}
        {isActive && stage.techniques.length === 0 && <li className="atlas-row-why">No technique is tagged with this stage alone.</li>}
      </ul>
    </li>
  );
}

/**
 * The device side of the hourglass: four stages, application first, each with
 * the techniques the catalog tags to it. Techniques tagged with device stages
 * alone have no drafted region link, so they sit here; that says what the tags
 * are, not what a technique could affect. Opening a stage shows its techniques; the order of
 * the stages is the catalog's band order and says nothing about a signal.
 */
export default function SignalChainRail({ rail, includesMixed, activeStageId, chosenTechniqueId, stepNumbersByStage, onToggleStage, onToggleMixed, onChooseTechnique }: Props) {
  return (
    <section className="atlas-panel atlas-rail" aria-labelledby="atlas-rail-heading">
      <h2 className="atlas-heading" id="atlas-rail-heading">Device stages</h2>
      <p className="atlas-fact">{rail.deviceOnlyCount} techniques carry no brain band.</p>
      <LimitNote limit={limitSentence('device_stages')} />
      <LimitNote limit={limitSentence('stage_tags')} />
      <LimitNote limit={limitSentence('band_order')} />
      <button type="button" className="atlas-toggle" aria-pressed={includesMixed} onClick={onToggleMixed}>
        <span className="atlas-toggle-box" aria-hidden="true" />
        Also list the {rail.mixedCount} techniques that carry a brain band too
      </button>
      {includesMixed && <LimitNote limit={limitSentence('device_stages_mixed')} />}
      <ol className="atlas-stages">
        {rail.stages.map((stage) => (
          <Stage
            key={stage.band.id} stage={stage} isActive={stage.band.id === activeStageId} chosenTechniqueId={chosenTechniqueId} stepNumbers={stepNumbersByStage?.get(stage.band.id) ?? []}
            onToggleStage={onToggleStage} onChooseTechnique={onChooseTechnique}
          />
        ))}
      </ol>
    </section>
  );
}
