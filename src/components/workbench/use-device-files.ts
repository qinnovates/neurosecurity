/**
 * Whether the device in focus is in a file, told truthfully: the fingerprint of the text
 * last written to (or read from) a file is kept and compared with the device as it is now.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { fingerprintText } from './text-fingerprint';

/** "never": no file holds this device. "saved": a file holds it as it is now. "changed": it has changed since. */
export type FileStatus = 'never' | 'saved' | 'changed';

export interface FileStatusTracker {
  fileStatus: FileStatus;
  /** Call when the model has just been written to, or read from, a file. */
  markInFile: (model: DeviceModel) => void;
  /** Call when the device is replaced by one that no file holds. */
  markNotInFile: () => void;
}

function fingerprintModel(model: DeviceModel): string {
  return fingerprintText(JSON.stringify(model));
}

export function useFileStatus(model: DeviceModel): FileStatusTracker {
  const [fileFingerprint, setFileFingerprint] = useState<string | null>(null);
  const currentFingerprint = useMemo(() => fingerprintModel(model), [model]);
  const markInFile = useCallback((savedModel: DeviceModel): void => setFileFingerprint(fingerprintModel(savedModel)), []);
  const markNotInFile = useCallback((): void => setFileFingerprint(null), []);

  let fileStatus: FileStatus = 'never';
  if (fileFingerprint !== null) fileStatus = fileFingerprint === currentFingerprint ? 'saved' : 'changed';
  return { fileStatus, markInFile, markNotInFile };
}

/** Asks the browser to confirm before the page is left. Registered only while `isActive`, so a clean page never nags. */
export function useUnloadWarning(isActive: boolean): void {
  useEffect(() => {
    if (!isActive) return undefined;
    const warn = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      // Older browsers show the prompt only when this legacy field is set.
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isActive]);
}
