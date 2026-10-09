import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { DeviceRail, RailStage, RailTechnique } from '@/lib/atlas-explorer/rail-stages';
import LimitNote from './LimitNote';
import ReviewMark from './ReviewMark';

interface Props {
  rail: DeviceRail;
  includesMixed: boolean;
  /** The stage being emphasised, by band id, or null. */
  activeStageId: string | null;
  /** The technique the lens is on, so its entry reads as current. */
  chosenTechniqueId: string | null;
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
          Also carries {technique.neuralBandIds.join(', ')}.{' '}
          {technique.draftedLinkCount === 0 ? 'No region link drafted.' : `${technique.draftedLinkCount} region ${technique.draftedLinkCount === 1 ? 'link' : 'links'} drafted.`}{' '}
          {technique.reviewState !== null && <ReviewMark state={technique.reviewState} />}
        </p>
      )}
    </li>
  );
}

interface StageProps extends Pick<Props, 'chosenTechniqueId' | 'onToggleStage' | 'onChooseTechnique'> {
  stage: RailStage;
  isActive: boolean;
}

function Stage({ stage, isActive, chosenTechniqueId, onToggleStage, onChooseTechnique }: StageProps) {
  const listId = `atlas-stage-${stage.band.id}`;
  return (
    <li className="atlas-stage" data-active={isActive} data-stage-id={stage.band.id}>
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
 * the techniques the catalog tags to it. These act on the device, so they sit
 * here and light no region. Opening a stage shows its techniques; the order of
 * the stages is the catalog's band order and says nothing about a signal.
 */
export default function SignalChainRail({ rail, includesMixed, activeStageId, chosenTechniqueId, onToggleStage, onToggleMixed, onChooseTechnique }: Props) {
  return (
    <section className="atlas-panel atlas-rail" aria-labelledby="atlas-rail-heading">
      <h2 className="atlas-heading" id="atlas-rail-heading">Device stages</h2>
      <p className="atlas-fact">
        {rail.deviceOnlyCount} techniques carry no brain band and belong to the device alone. The stage tags are the catalog&rsquo;s own.
      </p>
      <LimitNote limit={limitSentence('device_stages')} />
      <button type="button" className="atlas-toggle" aria-pressed={includesMixed} onClick={onToggleMixed}>
        <span className="atlas-toggle-box" aria-hidden="true" />
        Also list the {rail.mixedCount} techniques that carry a brain band too
      </button>
      {includesMixed && <LimitNote limit={limitSentence('device_stages_mixed')} />}
      <ol className="atlas-stages">
        {rail.stages.map((stage) => (
          <Stage
            key={stage.band.id} stage={stage} isActive={stage.band.id === activeStageId} chosenTechniqueId={chosenTechniqueId}
            onToggleStage={onToggleStage} onChooseTechnique={onChooseTechnique}
          />
        ))}
      </ol>
    </section>
  );
}
