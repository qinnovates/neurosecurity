import { EXAMPLE_DEVICE_LABEL } from '@/components/workbench/DeviceMenu';
import { describeDevice, summariseDevice } from '@/components/workbench/device-summary';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import type { ThreatModelReport } from '@/lib/threat-model/report-types';

interface Props {
  model: DeviceModel;
  report: ThreatModelReport;
  isExampleDevice: boolean;
  isEditorOpen: boolean;
  onEditDevice: () => void;
}

/** The screen's title: which device this is, the few facts every mode shows, and the way into its editor. It keeps its own picture across a change of view. */
export default function ModelHeader({ model, report, isExampleDevice, isEditorOpen, onEditDevice }: Props) {
  const facts = describeDevice(summariseDevice(model, report));
  return (
    <header className="model-header model-no-print lab-vt-identity">
      <h2 className="model-header-name lab-title">
        {isExampleDevice && <span className="lab-soft">{EXAMPLE_DEVICE_LABEL}: </span>}
        {model.name}
      </h2>
      <ul className="model-header-facts lab-soft" aria-label="Device in focus">
        {facts.map((fact) => <li key={fact}>{fact}</li>)}
      </ul>
      <button type="button" className="lab-button" aria-expanded={isEditorOpen} onClick={onEditDevice}>Edit device</button>
    </header>
  );
}
