/**
 * The device in focus, shared by every mode. One model, one report computed from it,
 * so Explore, Model, and Query always describe the same device. Saving it, loading it
 * and exporting its register live here too, so the device menu and any screen act alike.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import type { CatalogTechnique, EngineData } from '@/lib/threat-model/catalog-types';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import type { ReferenceData } from '@/lib/threat-model/reference-data-types';
import { buildRegisterCsv } from '@/lib/threat-model/register-csv';
import type { ThreatModelReport } from '@/lib/threat-model/report-types';
import type { AttackChain } from '@/components/atlas/AttackChainViz';
import { downloadModelFile, downloadRegisterCsv, readModelFile } from '@/components/threat-model/model-file-io';
import { createInitialState, hasUserWork, studioReducer, type StudioAction, type StudioState } from '@/components/threat-model/studio-state';
import { isRememberEnabled, restoreDevice, saveDevice, setRememberEnabled } from './device-persistence';
import { useFileStatus, useUnloadWarning, type FileStatus } from './use-device-files';

const DISCARDED_NOTICE = 'A device saved in this browser could not be read and was removed.';
const STORAGE_REFUSED_NOTICE = 'This browser refused to save the device. Use "Save file" in the device menu to keep your work.';

export interface Focus {
  state: StudioState;
  dispatch: Dispatch<StudioAction>;
  report: ThreatModelReport;
  engineData: EngineData;
  referenceData: ReferenceData;
  /** The hand-written chains from the catalog. They belong to no device. */
  curatedChains: readonly AttackChain[];
  techniqueById: ReadonlyMap<string, CatalogTechnique>;
  /** True when replacing the device would lose something the user did. */
  hasWork: boolean;
  /** True while the page still shows the device it opened on, untouched: nothing picked, edited, decided or loaded. */
  isExampleDevice: boolean;
  /** True when the reader has asked for the device to be saved to this browser as it changes. */
  isRemembered: boolean;
  setRemembered: (isEnabled: boolean) => void;
  /** True when the device as it is now was written to this browser's storage. */
  isStoredInBrowser: boolean;
  fileStatus: FileStatus;
  /** True when decisions exist that are neither in this browser's storage nor in a file. */
  hasUnsavedDecisions: boolean;
  /** Set when saving or restoring failed, in words safe to show. */
  storageNotice: string | null;
  /** Hands the device to the browser as a download. Nothing is uploaded. */
  saveModelFile: () => void;
  /** Reads and validates a file the reader picked. @throws DeviceModelFormatError with a message safe to show */
  readModelFile: (file: File) => Promise<DeviceModel>;
  /** Hands the risk register to the browser as a CSV download. */
  exportRegister: () => void;
}

const FocusContext = createContext<Focus | null>(null);

interface ProviderProps {
  engineData: EngineData;
  referenceData: ReferenceData;
  curatedChains: readonly AttackChain[];
  /** Called as the device is replaced by another, before the screen redraws. */
  onDeviceReplaced?: () => void;
  children: ReactNode;
}

function isDeviceReplacement(action: StudioAction): boolean {
  return action.type === 'preset-selected' || action.type === 'model-imported' || action.type === 'state-restored';
}

export function FocusProvider({ engineData, referenceData, curatedChains, onDeviceReplaced, children }: ProviderProps) {
  const { registrarVersion } = engineData;
  const { archetypes } = referenceData;
  const knownRegionIds = useMemo(() => new Set(engineData.regions.map((region) => region.id)), [engineData]);
  // Read once, when the page opens.
  const [restored] = useState(() => restoreDevice(archetypes, knownRegionIds));
  const [state, rawDispatch] = useReducer(studioReducer, undefined, () => restored.state ?? createInitialState(archetypes[0], registrarVersion));
  const [isRemembered, setIsRemembered] = useState(isRememberEnabled);
  const [isStoredInBrowser, setStoredInBrowser] = useState(false);
  const [hasPickedDevice, setPickedDevice] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(restored.wasDiscarded ? DISCARDED_NOTICE : null);
  // Fixed when the page opens, so the report does not change its timestamp on every edit.
  const [generatedAt] = useState(() => new Date().toISOString());
  const { fileStatus, markInFile, markNotInFile } = useFileStatus(state.model);

  useEffect(() => {
    const wasStored = isRemembered && saveDevice(state);
    setStoredInBrowser(wasStored);
    if (isRemembered && !wasStored) setStorageNotice(STORAGE_REFUSED_NOTICE);
  }, [isRemembered, state]);

  /** Every change to the device passes here, so its file status and the views that describe it stay true. */
  const dispatch = useCallback((action: StudioAction): void => {
    if (isDeviceReplacement(action)) {
      onDeviceReplaced?.();
      setPickedDevice(true);
      // A model that came from a file is in that file; any other new device is in none.
      if (action.type === 'model-imported') markInFile(action.model);
      else markNotInFile();
    }
    rawDispatch(action);
  }, [onDeviceReplaced, markInFile, markNotInFile]);

  const report = useMemo(
    () => buildThreatModelReport({ model: state.model, engineData, referenceData, generatedAt }),
    [state.model, engineData, referenceData, generatedAt],
  );
  const techniqueById = useMemo(() => new Map(engineData.techniques.map((technique) => [technique.id, technique])), [engineData]);
  const hasWork = useMemo(() => hasUserWork(state, archetypes), [state, archetypes]);
  const isExampleDevice = !hasPickedDevice && !hasWork && restored.state === null;
  const hasDecisions = state.model.riskDecisions.length > 0 || state.model.controlsInPlace.length > 0;
  const hasUnsavedDecisions = hasDecisions && !isStoredInBrowser && fileStatus !== 'saved';
  useUnloadWarning(hasUnsavedDecisions);

  const focus = useMemo<Focus>(() => {
    const setRemembered = (isEnabled: boolean): void => {
      const wasStored = setRememberEnabled(isEnabled);
      setIsRemembered(isEnabled && wasStored);
      setStorageNotice(wasStored ? null : STORAGE_REFUSED_NOTICE);
    };
    const saveModelFile = (): void => {
      downloadModelFile(state.model);
      markInFile(state.model);
    };
    return {
      state, dispatch, report, engineData, referenceData, curatedChains, techniqueById, hasWork, isExampleDevice,
      isRemembered, setRemembered, isStoredInBrowser, fileStatus, hasUnsavedDecisions, storageNotice, saveModelFile,
      readModelFile: (file) => readModelFile(file, knownRegionIds),
      exportRegister: () => downloadRegisterCsv(state.model, buildRegisterCsv(report.riskRows)),
    };
  }, [
    state, dispatch, report, engineData, referenceData, curatedChains, techniqueById, hasWork, isExampleDevice,
    isRemembered, isStoredInBrowser, fileStatus, hasUnsavedDecisions, storageNotice, markInFile, knownRegionIds,
  ]);

  return <FocusContext.Provider value={focus}>{children}</FocusContext.Provider>;
}

/** @throws when called outside FocusProvider, which is a wiring mistake in the shell */
export function useFocus(): Focus {
  const focus = useContext(FocusContext);
  if (focus === null) throw new Error('useFocus was called outside FocusProvider. Render the mode inside WorkbenchShell.');
  return focus;
}
