import type { BrainRegion } from '@/lib/threat-model/catalog-types';
import {
  INTERFACE_DIRECTIONS, INVASIVENESS_LEVELS, MODEL_LIMITS, SUBMISSION_TYPES,
  type InterfaceDirection, type Invasiveness, type SubmissionType,
} from '@/lib/threat-model/device-model';
import type { IntakeAnswers } from '@/lib/threat-model/intake-to-model';
import type { DeviceArchetype } from '@/lib/threat-model/reference-data-types';

interface Props {
  archetypes: readonly DeviceArchetype[];
  regions: readonly BrainRegion[];
  /** Null when the current model came from an imported file. */
  archetype: DeviceArchetype | null;
  answers: IntakeAnswers | null;
  onSelectPreset: (archetype: DeviceArchetype) => void;
  onChangeAnswers: (answers: IntakeAnswers) => void;
}

const INVASIVENESS_LABELS: Record<Invasiveness, string> = {
  noninvasive: 'Non-invasive',
  cortical: 'Invasive, cortical',
  subcortical: 'Invasive, subcortical',
  spinal_peripheral: 'Invasive, spinal or peripheral',
};

const DIRECTION_LABELS: Record<InterfaceDirection, string> = {
  read: 'Records only',
  write: 'Stimulates only',
  bidirectional: 'Records and stimulates',
};

const SUBMISSION_LABELS: Record<SubmissionType, string> = {
  '510k': '510(k)',
  de_novo: 'De Novo',
  pma: 'PMA',
  hde: 'HDE',
  pdp: 'PDP',
  ide: 'IDE (clinical trial)',
  none: 'None yet',
};

function toggleListItem(list: readonly string[], item: string): string[] {
  return list.includes(item) ? list.filter((existing) => existing !== item) : [...list, item];
}

export default function IntakeForm({ archetypes, regions, archetype, answers, onSelectPreset, onChangeAnswers }: Props) {
  const selectPreset = (archetypeId: string): void => {
    const selected = archetypes.find((candidate) => candidate.id === archetypeId);
    if (selected !== undefined) onSelectPreset(selected);
  };

  const presetField = (
    <label className="tm-field">
      <span className="tm-label">Start from a device type</span>
      <select className="tm-select" value={archetype?.id ?? ''} onChange={(event) => selectPreset(event.target.value)}>
        {archetype === null && <option value="">Imported model</option>}
        {archetypes.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}
      </select>
    </label>
  );

  if (archetype === null || answers === null) {
    return (
      <section className="tm-card" aria-labelledby="tm-intake-heading">
        <h2 className="tm-heading" id="tm-intake-heading">Your device</h2>
        {presetField}
        <p className="tm-muted">This model was loaded from a file. Pick a device type above to start a new one.</p>
      </section>
    );
  }

  const update = (changes: Partial<IntakeAnswers>): void => onChangeAnswers({ ...answers, ...changes });
  const toggleRegion = (regionId: string): void => {
    const next = toggleListItem(answers.targetRegionIds, regionId);
    // At least one target region is required for the model to be valid.
    if (next.length > 0) update({ targetRegionIds: next });
  };
  const optionalComponents = archetype.components.filter((component) => !component.isNeuralInterface);

  return (
    <section className="tm-card" aria-labelledby="tm-intake-heading">
      <h2 className="tm-heading" id="tm-intake-heading">Your device</h2>
      {presetField}
      <p className="tm-muted">{archetype.description}</p>

      <label className="tm-field" style={{ marginTop: '0.875rem' }}>
        <span className="tm-label">Name</span>
        <input
          className="tm-input" type="text" value={answers.name} maxLength={MODEL_LIMITS.maxLabelLength}
          onChange={(event) => { if (event.target.value.length > 0) update({ name: event.target.value }); }}
        />
      </label>

      <label className="tm-field">
        <span className="tm-label">Invasiveness</span>
        <select className="tm-select" value={answers.invasiveness} onChange={(event) => update({ invasiveness: event.target.value as Invasiveness })}>
          {INVASIVENESS_LEVELS.map((level) => <option key={level} value={level}>{INVASIVENESS_LABELS[level]}</option>)}
        </select>
        <span className="tm-muted tm-small">Recorded in the report. It does not change which techniques are placed in this version.</span>
      </label>

      <label className="tm-field">
        <span className="tm-label">What it does</span>
        <select className="tm-select" value={answers.direction} onChange={(event) => update({ direction: event.target.value as InterfaceDirection })}>
          {INTERFACE_DIRECTIONS.map((direction) => <option key={direction} value={direction}>{DIRECTION_LABELS[direction]}</option>)}
        </select>
      </label>

      <fieldset className="tm-field" style={{ border: 0, padding: 0, margin: '0 0 0.875rem' }}>
        <legend className="tm-label">Target brain regions</legend>
        <div className="tm-checklist">
          {regions.map((region) => (
            <label key={region.id} className="tm-check">
              <input type="checkbox" checked={answers.targetRegionIds.includes(region.id)} onChange={() => toggleRegion(region.id)} />
              <span>{region.name} <span className="tm-muted tm-small">({region.depthClass})</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="tm-check" style={{ marginBottom: '0.875rem' }}>
        <input type="checkbox" checked={answers.presentsStimuli} onChange={(event) => update({ presentsStimuli: event.target.checked })} />
        <span>Shows images or plays sounds to the patient <span className="tm-muted tm-small">(adds techniques that come in through the senses)</span></span>
      </label>

      <fieldset className="tm-field" style={{ border: 0, padding: 0, margin: '0 0 0.875rem' }}>
        <legend className="tm-label">Parts of the system</legend>
        {optionalComponents.map((component) => (
          <label key={component.id} className="tm-check">
            <input
              type="checkbox" checked={!answers.removedComponentIds.includes(component.id)}
              onChange={() => update({ removedComponentIds: toggleListItem(answers.removedComponentIds, component.id) })}
            />
            <span>{component.label}</span>
          </label>
        ))}
      </fieldset>

      <label className="tm-field">
        <span className="tm-label">Planned FDA submission</span>
        <select className="tm-select" value={answers.submissionType} onChange={(event) => update({ submissionType: event.target.value as SubmissionType })}>
          {SUBMISSION_TYPES.map((type) => <option key={type} value={type}>{SUBMISSION_LABELS[type]}</option>)}
        </select>
      </label>
    </section>
  );
}
