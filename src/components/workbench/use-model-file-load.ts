import { useState } from 'react';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { DeviceModelFormatError } from '@/lib/threat-model/errors';
import { useFocus } from './FocusContext';

const UNEXPECTED_IMPORT_ERROR = 'The model file could not be loaded: an unexpected problem occurred while reading it.';

export interface ModelFileLoad {
  /** Reads the picked file; replaces the device at once when nothing would be lost, otherwise waits for `confirm`. */
  loadFile: (file: File) => Promise<void>;
  /** A model that was read and is waiting for the reader to agree to replace their work. */
  pendingModel: DeviceModel | null;
  confirm: () => void;
  cancel: () => void;
  /** Why the last file was refused, in the parser's own words. They never echo file content. */
  error: string | null;
  /** The name of the device the last file put in focus, until another file is picked. Null when none has. */
  loadedDeviceName: string | null;
}

/** Loading a model file from the device menu: read, validate, ask before discarding work, then replace the device. */
export function useModelFileLoad(): ModelFileLoad {
  const { dispatch, hasWork, readModelFile } = useFocus();
  const [pendingModel, setPendingModel] = useState<DeviceModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedDeviceName, setLoadedDeviceName] = useState<string | null>(null);

  const replaceDevice = (model: DeviceModel): void => {
    setPendingModel(null);
    dispatch({ type: 'model-imported', model });
    setLoadedDeviceName(model.name);
  };

  const loadFile = async (file: File): Promise<void> => {
    setLoadedDeviceName(null);
    try {
      const model = await readModelFile(file);
      setError(null);
      if (hasWork) setPendingModel(model);
      else replaceDevice(model);
    } catch (caught) {
      setPendingModel(null);
      setError(caught instanceof DeviceModelFormatError ? caught.message : UNEXPECTED_IMPORT_ERROR);
    }
  };

  return {
    loadFile,
    pendingModel,
    confirm: () => { if (pendingModel !== null) replaceDevice(pendingModel); },
    cancel: () => setPendingModel(null),
    error,
    loadedDeviceName,
  };
}
