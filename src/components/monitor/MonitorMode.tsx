import { useMemo } from 'react';
import Panel from '@/components/lab-kit/Panel';
import Segmented from '@/components/lab-kit/Segmented';
import { useFocus } from '@/components/workbench/FocusContext';
import type { ModeProps } from '@/components/workbench/mode-registry';
import { useViewState } from '@/components/workbench/ViewStateContext';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { describeSample } from '@/lib/signal/sample-properties';
import SampleFacts from './SampleFacts';
import SampleMonitor from './SampleMonitor';
import { useSampleFiles, useSignalSample } from './use-signal-sample';
import './monitor.css';

const STAMP = 'Synthetic sample';
const ABOUT_SAMPLES = 'Computer-generated signals shaped like EEG. Not recordings from people, and not connected to any device. Marked events are demonstrations of one stated rule, not detections.';
export const SCALP_ORIENTATION_STATEMENT = 'These are scalp samples, shown for orientation.';
/** Up to this many samples are offered as a row of numbers; beyond it, as a menu. */
const MAX_SEGMENTED_SAMPLES = 12;

/** A device worn on the scalp that records: the only kind these samples resemble. */
function isScalpRecorder(model: DeviceModel): boolean {
  return model.invasiveness === 'noninvasive' && model.direction !== 'write';
}

/** What the samples have to do with the device in focus. For anything but a scalp recorder, one sentence and no more. */
export function describeRelationToDevice(model: DeviceModel): string {
  return isScalpRecorder(model)
    ? `${model.name} records, so a signal of this general kind would leave its neural interface. These samples are generic and are not its signal.`
    : SCALP_ORIENTATION_STATEMENT;
}

interface PickerProps {
  files: readonly string[];
  selectedFile: string;
  onSelect: (file: string) => void;
}

function SamplePicker({ files, selectedFile, onSelect }: PickerProps) {
  if (files.length <= MAX_SEGMENTED_SAMPLES) {
    return <Segmented label="Sample" options={files.map((file, index) => ({ value: file, label: String(index + 1) }))} value={selectedFile} onChange={onSelect} />;
  }
  return (
    <select className="lab-input monitor-sample-menu" aria-label="Sample" value={selectedFile} onChange={(event) => onSelect(event.target.value)}>
      {files.map((file, index) => <option key={file} value={file}>Sample {index + 1}</option>)}
    </select>
  );
}

/**
 * The Monitor mode: what a neural signal looks like while it is being watched. It plays
 * computer-generated samples. Nothing here is connected to a device, and nothing is detected.
 */
export default function MonitorMode(_props: ModeProps) {
  const { state } = useFocus();
  const { files, error: listError } = useSampleFiles();
  const [chosenFile, setChosenFile] = useViewState('monitor/signal/sample-file', '');
  // The reader's choice if the site still serves it; otherwise the first sample.
  const selectedFile = files === null || files.length === 0 ? null : files.includes(chosenFile) ? chosenFile : files[0];
  const { file: loadedFile, sample, error: sampleError } = useSignalSample(selectedFile);
  // Computed from the signal once, when it arrives.
  const properties = useMemo(() => (sample === null ? null : describeSample(sample)), [sample]);

  const position = files === null || selectedFile === null ? 0 : files.indexOf(selectedFile) + 1;
  const sampleLabel = `${STAMP} ${position}`;
  return (
    <div className="monitor">
      <section className="lab-notice monitor-banner" aria-label="About these signals">
        <span className="monitor-stamp">{STAMP}</span>
        <p>{ABOUT_SAMPLES} {describeRelationToDevice(state.model)}</p>
      </section>
      <Panel
        title={files === null || selectedFile === null ? 'Samples' : `${sampleLabel} of ${files.length}`}
        actions={files !== null && selectedFile !== null && <SamplePicker files={files} selectedFile={selectedFile} onSelect={setChosenFile} />}
      >
        {listError !== null && <p className="lab-notice" role="alert">{listError}</p>}
        {files === null && listError === null && <p className="lab-soft" role="status">Loading the sample list…</p>}
        {files !== null && files.length === 0 && <p className="lab-soft">The sample folder lists no samples.</p>}
        {sampleError !== null && <p className="lab-notice" role="alert">{sampleError}</p>}
        {selectedFile !== null && sample === null && sampleError === null && <p className="lab-soft" role="status">Loading the sample…</p>}
        {properties !== null && <SampleFacts properties={properties} />}
      </Panel>
      {sample !== null && loadedFile === selectedFile && <SampleMonitor key={loadedFile} sample={sample} sampleLabel={sampleLabel} />}
    </div>
  );
}
