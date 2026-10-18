import { useId, useState } from 'react';
import Panel from '@/components/lab-kit/Panel';
import type { BrainRegion } from '@/lib/threat-model/catalog-types';
import {
  INTERFACE_DIRECTIONS, INVASIVENESS_LEVELS, MODEL_LIMITS, SUBMISSION_TYPES,
  type DeviceModel, type InterfaceDirection, type Invasiveness, type SubmissionType,
} from '@/lib/threat-model/device-model';
import type { DeviceFacts } from '@/lib/threat-model/model-edit';
import CommittedTextField from './CommittedTextField';
import { DIRECTION_LABELS, INVASIVENESS_LABELS, SUBMISSION_LABELS } from './model-labels';

interface Props {
  model: DeviceModel;
  regions: readonly BrainRegion[];
  onChange: (changes: Partial<DeviceFacts>) => void;
}

const LAST_REGION_NOTICE = 'One target region stays ticked: the model file needs at least one.';
const REGION_LIMIT_NOTICE = `The model file holds at most ${MODEL_LIMITS.maxTargetRegions} target regions.`;

/** Why a set of this many target regions cannot be saved, or null when it can. */
function findRegionNotice(regionCount: number): string | null {
  if (regionCount === 0) return LAST_REGION_NOTICE;
  return regionCount > MODEL_LIMITS.maxTargetRegions ? REGION_LIMIT_NOTICE : null;
}

interface SelectProps<Value extends string> {
  label: string;
  value: Value;
  options: readonly Value[];
  labels: Readonly<Record<Value, string>>;
  note?: string;
  onChange: (value: Value) => void;
}

/** One labelled choice among the values the model allows. A value outside the list is never passed on. */
function ChoiceField<Value extends string>({ label, value, options, labels, note, onChange }: SelectProps<Value>) {
  const choose = (chosen: string): void => {
    const option = options.find((candidate) => candidate === chosen);
    if (option !== undefined) onChange(option);
  };
  return (
    <label className="lab-field">
      <span className="lab-label">{label}</span>
      <select className="lab-input" value={value} onChange={(event) => choose(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{labels[option]}</option>)}
      </select>
      {note !== undefined && <span className="lab-label">{note}</span>}
    </label>
  );
}

/** The regions whose name contains the words typed, in the atlas's order; all of them when nothing is typed. */
export function filterRegions<Region extends Pick<BrainRegion, 'name'>>(regions: readonly Region[], typed: string): Region[] {
  const wanted = typed.trim().toLowerCase();
  return wanted === '' ? [...regions] : regions.filter((region) => region.name.toLowerCase().includes(wanted));
}

/** The answers about the device as a whole. Each change goes to the model at once and is checked there. */
export default function DeviceFactsForm({ model, regions, onChange }: Props) {
  const regionNoticeId = useId();
  const [regionNotice, setRegionNotice] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState('');
  const tickedRegions = regions.filter((region) => model.targetRegionIds.includes(region.id));
  const shownRegions = filterRegions(regions, regionFilter);

  const toggleRegion = (regionId: string): void => {
    const isTicked = model.targetRegionIds.includes(regionId);
    const next = isTicked ? model.targetRegionIds.filter((existing) => existing !== regionId) : [...model.targetRegionIds, regionId];
    const notice = findRegionNotice(next.length);
    setRegionNotice(notice);
    if (notice === null) onChange({ targetRegionIds: next });
  };

  return (
    <Panel title="Device facts">
      <div className="lab-editor-fields">
        <CommittedTextField label="Name" value={model.name} maxLength={MODEL_LIMITS.maxLabelLength} onCommit={(name) => onChange({ name })} />
        <ChoiceField<Invasiveness>
          label="Invasiveness" value={model.invasiveness} options={INVASIVENESS_LEVELS} labels={INVASIVENESS_LABELS}
          note="Recorded in the report. It does not change which techniques are placed in this version."
          onChange={(invasiveness) => onChange({ invasiveness })}
        />
        <ChoiceField<InterfaceDirection>
          label="Records or stimulates" value={model.direction} options={INTERFACE_DIRECTIONS} labels={DIRECTION_LABELS}
          onChange={(direction) => onChange({ direction })}
        />
        <ChoiceField<SubmissionType>
          label="Planned FDA submission" value={model.submissionType} options={SUBMISSION_TYPES} labels={SUBMISSION_LABELS}
          onChange={(submissionType) => onChange({ submissionType })}
        />
      </div>

      <label className="lab-editor-tick">
        <input type="checkbox" checked={model.presentsStimuli} onChange={(event) => onChange({ presentsStimuli: event.target.checked })} />
        <span>Shows images or plays sounds to the patient <span className="lab-soft">(adds techniques that come in through the senses)</span></span>
      </label>

      <fieldset className="lab-editor-group" aria-describedby={regionNotice === null ? undefined : regionNoticeId}>
        <legend className="lab-label">Target brain regions ({model.targetRegionIds.length} of {regions.length} ticked)</legend>
        {/* The ticked regions stay in sight as chips while the list is filtered; a chip unticks its region. */}
        <ul className="lab-editor-chosen" aria-label="Ticked regions">
          {tickedRegions.map((region) => (
            <li key={region.id}>
              <button type="button" className="lab-chip" aria-label={`Untick ${region.name}`} onClick={() => toggleRegion(region.id)}>
                <span>{region.name}</span><span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
        <label className="lab-field lab-editor-filter">
          <span className="lab-label">Filter regions ({shownRegions.length} of {regions.length} shown)</span>
          <input className="lab-input" type="search" value={regionFilter} maxLength={MODEL_LIMITS.maxLabelLength} onChange={(event) => setRegionFilter(event.target.value)} />
        </label>
        <div className="lab-editor-checklist">
          {shownRegions.map((region) => (
            <label key={region.id} className="lab-editor-tick">
              <input type="checkbox" checked={model.targetRegionIds.includes(region.id)} onChange={() => toggleRegion(region.id)} />
              <span>{region.name} <span className="lab-soft">({region.depthClass})</span></span>
            </label>
          ))}
        </div>
        {regionNotice !== null && <p id={regionNoticeId} role="alert" className="lab-label">{regionNotice}</p>}
      </fieldset>
    </Panel>
  );
}
