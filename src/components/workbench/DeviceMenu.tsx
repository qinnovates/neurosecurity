import { useRef, type ChangeEvent } from 'react';
import { useFocus } from './FocusContext';
import type { Route } from './route';
import { CHANGE_DEVICE_TARGET, DEVICE_ACTION_LABELS } from './shell-targets';
import type { FileStatus } from './use-device-files';
import { useModelFileLoad } from './use-model-file-load';

export const EXAMPLE_DEVICE_LABEL = 'Example device';

const FILE_STATUS_WORDS: Record<FileStatus, string> = {
  never: 'never',
  saved: 'saved',
  changed: 'changed since last save',
};

interface Props {
  id: string;
  facts: readonly string[];
  onNavigate: (route: Route) => void;
  /** Opens the device editor on its screen. The shell owns this, so the editor closes again when the reader moves on. */
  onEditDevice: () => void;
  onPrintReport: () => void;
  /** Called after an action that takes the reader to another screen. */
  onClose: () => void;
}

function describeLoss(decisionCount: number): string {
  if (decisionCount === 0) return 'the answers you changed';
  return `its answers and ${decisionCount} recorded decision${decisionCount === 1 ? '' : 's'}`;
}

/** Everything that can be done with the device in focus, and where it is kept. */
export default function DeviceMenu({ id, facts, onNavigate, onEditDevice, onPrintReport, onClose }: Props) {
  const focus = useFocus();
  const { model } = focus.state;
  const fileLoad = useModelFileLoad();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const leaveFor = (route: Route): void => {
    onClose();
    onNavigate(route);
  };
  const editDevice = (): void => {
    onClose();
    onEditDevice();
  };
  const printReport = (): void => {
    onClose();
    onPrintReport();
  };
  const pickFile = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file !== undefined) void fileLoad.loadFile(file);
  };

  return (
    <div className="lab-device-panel" id={id} role="group" aria-label="Device in focus">
      <p className="lab-label">Device in focus</p>
      <p className="lab-device-title">
        {focus.isExampleDevice && <span>{EXAMPLE_DEVICE_LABEL}: </span>}
        <strong>{model.name}</strong>
      </p>
      <ul className="lab-device-list">
        {facts.map((fact) => <li key={fact}>{fact}</li>)}
      </ul>

      <div className="lab-menu" role="group" aria-label="Device actions">
        <button type="button" className="lab-menu-item" onClick={() => leaveFor(CHANGE_DEVICE_TARGET)}>{DEVICE_ACTION_LABELS['change-device']}</button>
        <button type="button" className="lab-menu-item" onClick={editDevice}>{DEVICE_ACTION_LABELS['edit-device']}</button>
        <button type="button" className="lab-menu-item" onClick={focus.saveModelFile}>Save file</button>
        <button type="button" className="lab-menu-item" onClick={() => fileInputRef.current?.click()}>Load file</button>
        <button type="button" className="lab-menu-item" onClick={focus.exportRegister}>Export register</button>
        <button type="button" className="lab-menu-item" onClick={printReport}>{DEVICE_ACTION_LABELS['print-report']}</button>
      </div>
      <input ref={fileInputRef} type="file" accept="application/json,.json" hidden aria-label="Model file to load" onChange={pickFile} />

      {fileLoad.pendingModel !== null && (
        <div className="lab-device-notice" role="alertdialog" aria-label={`Replace ${model.name}?`}>
          <p>Replace <strong>{model.name}</strong> with the model from your file? You will lose {describeLoss(model.riskDecisions.length)}.</p>
          <div className="lab-menu-confirm">
            <button type="button" className="lab-button lab-button--primary" autoFocus onClick={fileLoad.cancel}>Keep {model.name}</button>
            <button type="button" className="lab-button" onClick={fileLoad.confirm}>Replace it</button>
          </div>
        </div>
      )}
      {fileLoad.error !== null && <p className="lab-device-notice" role="alert">{fileLoad.error}</p>}
      {/* Always in the document, so a screen reader hears the line when it is filled in. */}
      <p className="lab-device-loaded" role="status">{fileLoad.loadedDeviceName !== null && `Loaded ${fileLoad.loadedDeviceName}.`}</p>

      <div className="lab-device-status">
        <p>Remembered in this browser: <strong>{focus.isStoredInBrowser ? 'yes' : 'no'}</strong></p>
        <p>Saved to a file: <strong>{FILE_STATUS_WORDS[focus.fileStatus]}</strong></p>
        <label className="lab-remember">
          <input id="workbench-remember" type="checkbox" checked={focus.isRemembered} onChange={(event) => focus.setRemembered(event.target.checked)} />
          <span>Remember this device in this browser</span>
        </label>
        {focus.hasUnsavedChanges && (
          <p className="lab-device-notice">Changes to this device are not remembered in this browser and not in a saved file. Closing the page loses them.</p>
        )}
        <p className="lab-soft">Files are created and read in your browser. Nothing is uploaded.</p>
      </div>
    </div>
  );
}
