import { useMemo, useState } from 'react';
import type { EngineData } from '@/lib/threat-model/catalog-types';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import type { ReferenceData } from '@/lib/threat-model/reference-data-types';
import { diffScope, summariseScope, type ScopeChange, type ScopeStatement } from '@/lib/threat-model/scope-statement';

interface Tracked {
  scope: ScopeStatement;
  /** Null until the device is first edited while the editor is open. */
  changes: ScopeChange[] | null;
}

/** The parts of a model that describe the device. A recorded decision changes none of them. */
function describesSameDevice(before: DeviceModel, after: DeviceModel): boolean {
  const keys = Object.keys(after) as (keyof DeviceModel)[];
  return keys.every((key) => key === 'riskDecisions' || before[key] === after[key]);
}

/**
 * Which techniques started or stopped applying at the last edit of the device, from `diffScope`.
 * Null before the first edit. A decision on a risk is not an edit of the device and changes nothing here.
 */
export function useScopeChanges(model: DeviceModel, engineData: EngineData, referenceData: Pick<ReferenceData, 'placementRules'>): ScopeChange[] | null {
  const [device, setDevice] = useState(model);
  if (device !== model && !describesSameDevice(device, model)) setDevice(model);

  const scope = useMemo(() => summariseScope(device, engineData, referenceData), [device, engineData, referenceData]);
  const [tracked, setTracked] = useState<Tracked>({ scope, changes: null });
  if (tracked.scope !== scope) setTracked({ scope, changes: diffScope(tracked.scope, scope) });
  return tracked.changes;
}
