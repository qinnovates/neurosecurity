/**
 * The device in focus, shared by every mode. One model, one report computed from it,
 * so Explore, Model, and Query always describe the same device.
 */

import { createContext, useContext, useEffect, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import type { CatalogTechnique, EngineData } from '@/lib/threat-model/catalog-types';
import type { ReferenceData } from '@/lib/threat-model/reference-data-types';
import type { ThreatModelReport } from '@/lib/threat-model/report-types';
import type { AttackChain } from '@/components/atlas/AttackChainViz';
import { createInitialState, hasUserWork, studioReducer, type StudioAction, type StudioState } from '@/components/threat-model/studio-state';
import { isRememberEnabled, restoreDevice, saveDevice, setRememberEnabled } from './device-persistence';

const DISCARDED_NOTICE = 'A device saved in this browser could not be read and was removed.';
const STORAGE_REFUSED_NOTICE = 'This browser refused to save the device. Use "Save model file" to keep your work.';

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
  /** True when the device is being saved to this browser as it changes. */
  isRemembered: boolean;
  setRemembered: (isEnabled: boolean) => void;
  /** Set when saving or restoring failed, in words safe to show. */
  storageNotice: string | null;
}

const FocusContext = createContext<Focus | null>(null);

interface ProviderProps {
  engineData: EngineData;
  referenceData: ReferenceData;
  curatedChains: readonly AttackChain[];
  children: ReactNode;
}

export function FocusProvider({ engineData, referenceData, curatedChains, children }: ProviderProps) {
  const { registrarVersion } = engineData;
  const { archetypes } = referenceData;
  // Read once, when the page opens.
  const [restored] = useState(() => restoreDevice(archetypes, new Set(engineData.regions.map((region) => region.id))));
  const [state, dispatch] = useReducer(studioReducer, undefined, () => restored.state ?? createInitialState(archetypes[0], registrarVersion));
  const [isRemembered, setIsRemembered] = useState(isRememberEnabled);
  const [storageNotice, setStorageNotice] = useState<string | null>(restored.wasDiscarded ? DISCARDED_NOTICE : null);
  // Fixed when the page opens, so the report does not change its timestamp on every edit.
  const [generatedAt] = useState(() => new Date().toISOString());

  useEffect(() => {
    if (isRemembered && !saveDevice(state)) setStorageNotice(STORAGE_REFUSED_NOTICE);
  }, [isRemembered, state]);

  const report = useMemo(
    () => buildThreatModelReport({ model: state.model, engineData, referenceData, generatedAt }),
    [state.model, engineData, referenceData, generatedAt],
  );
  const techniqueById = useMemo(() => new Map(engineData.techniques.map((technique) => [technique.id, technique])), [engineData]);
  const hasWork = useMemo(() => hasUserWork(state, archetypes), [state, archetypes]);

  const focus = useMemo<Focus>(() => {
    const setRemembered = (isEnabled: boolean): void => {
      const wasStored = setRememberEnabled(isEnabled);
      setIsRemembered(isEnabled && wasStored);
      setStorageNotice(wasStored ? null : STORAGE_REFUSED_NOTICE);
    };
    return { state, dispatch, report, engineData, referenceData, curatedChains, techniqueById, hasWork, isRemembered, setRemembered, storageNotice };
  }, [state, report, engineData, referenceData, curatedChains, techniqueById, hasWork, isRemembered, storageNotice]);

  return <FocusContext.Provider value={focus}>{children}</FocusContext.Provider>;
}

/** @throws when called outside FocusProvider, which is a wiring mistake in the shell */
export function useFocus(): Focus {
  const focus = useContext(FocusContext);
  if (focus === null) throw new Error('useFocus was called outside FocusProvider. Render the mode inside WorkbenchShell.');
  return focus;
}
