import { useMemo } from 'react';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { toColourMode } from '@/lib/atlas-explorer/lens-state';
import { buildDeviceRail, type DeviceRail } from '@/lib/atlas-explorer/rail-stages';
import { buildRegionDetail, type RegionDetail } from '@/lib/atlas-explorer/region-detail';
import { buildBandGroups, filterBandGroups, tallyLens, type BandGroup, type LensTally } from '@/lib/atlas-explorer/region-rows';
import type { ExplorerState } from './atlas-state';

export interface ExplorerViews {
  /** The list as filtered. */
  groups: BandGroup[];
  /** The same groups before the filter, so a section can state its own total. */
  allGroups: BandGroup[];
  /** Counted over every region, whatever the filter hides. */
  tally: LensTally;
  /** The selected region's detail, or null when no region is selected. */
  detail: RegionDetail | null;
  rail: DeviceRail;
}

/** Everything the screen shows, derived from the model and the state, and recomputed only when its inputs change. */
export function useExplorerViews(model: ExplorerModel, state: ExplorerState): ExplorerViews {
  const selectedRegionId = state.selection?.kind === 'region' ? state.selection.id : null;
  const mode = useMemo(() => toColourMode(state.lens), [state.lens]);
  const allGroups = useMemo(() => buildBandGroups(model, mode), [model, mode]);
  const groups = useMemo(() => filterBandGroups(allGroups, state.filter), [allGroups, state.filter]);
  const tally = useMemo(() => tallyLens(allGroups), [allGroups]);
  const detail = useMemo(() => (selectedRegionId === null ? null : buildRegionDetail(model, selectedRegionId)), [model, selectedRegionId]);
  const rail = useMemo(() => buildDeviceRail(model, state.railIncludesMixed), [model, state.railIncludesMixed]);
  return { groups, allGroups, tally, detail, rail };
}
