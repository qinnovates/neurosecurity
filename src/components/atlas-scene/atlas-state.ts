/**
 * The explorer's state and its one reducer. The state is plain data that
 * survives JSON.stringify, so the 3D view can read the same value and it could
 * be restored from storage or an address later. Nothing here knows about the
 * index: whether a layer can be shown is decided where the index is.
 */

import { LAYER_IDS, type LayerId } from '@/lib/anatomy/source-types';
import { DEFAULT_LENS, emptyLens, withLensSubject, type Lens, type LensKind } from '@/lib/atlas-explorer/lens-state';
import { EMPTY_LIST_FILTER, type ListFilter } from '@/lib/atlas-explorer/region-rows';

export const TARGET_KINDS = ['region', 'structure', 'bundle', 'technique', 'device', 'stage', 'electrode'] as const;
export type TargetKind = typeof TARGET_KINDS[number];

/** Something a visitor can select. The list selects regions; the 3D view will select the other kinds. */
export interface Target {
  kind: TargetKind;
  id: string;
}

export interface ExplorerState {
  selection: Target | null;
  lens: Lens;
  /** Which layers the visitor has asked to see. A layer is drawn only if the index also says it is available. */
  layers: Record<LayerId, boolean>;
  filter: ListFilter;
  /** The device stage the rail emphasises, by band id, or null for none. */
  railStageId: string | null;
  /** Whether the rail also lists techniques that carry a brain band. */
  railIncludesMixed: boolean;
}

export type ExplorerAction =
  | { type: 'target_selected'; target: Target }
  | { type: 'selection_cleared' }
  | { type: 'lens_kind_chosen'; kind: LensKind }
  | { type: 'lens_subject_chosen'; kind: LensKind; subjectId: string }
  | { type: 'layer_toggled'; layerId: LayerId }
  | { type: 'filter_changed'; filter: Partial<ListFilter> }
  | { type: 'filter_cleared' }
  | { type: 'rail_stage_toggled'; stageId: string }
  | { type: 'rail_mixed_toggled' };

const LAYERS_ON_AT_START: readonly LayerId[] = ['outline', 'cortical', 'deep'];

export const INITIAL_EXPLORER_STATE: ExplorerState = {
  selection: null,
  lens: DEFAULT_LENS,
  layers: Object.fromEntries(LAYER_IDS.map((layerId) => [layerId, LAYERS_ON_AT_START.includes(layerId)])) as Record<LayerId, boolean>,
  filter: EMPTY_LIST_FILTER,
  railStageId: null,
  railIncludesMixed: false,
};

/** Changing the lens, the layers or the filter never touches the selection. */
export function explorerReducer(state: ExplorerState, action: ExplorerAction): ExplorerState {
  switch (action.type) {
    case 'target_selected': return { ...state, selection: action.target };
    case 'selection_cleared': return { ...state, selection: null };
    case 'lens_kind_chosen': return state.lens.kind === action.kind ? state : { ...state, lens: emptyLens(action.kind) };
    case 'lens_subject_chosen': return { ...state, lens: withLensSubject(action.kind, action.subjectId) };
    case 'layer_toggled': return { ...state, layers: { ...state.layers, [action.layerId]: !state.layers[action.layerId] } };
    case 'filter_changed': return { ...state, filter: { ...state.filter, ...action.filter } };
    case 'filter_cleared': return { ...state, filter: EMPTY_LIST_FILTER };
    case 'rail_stage_toggled': return { ...state, railStageId: state.railStageId === action.stageId ? null : action.stageId };
    case 'rail_mixed_toggled': return { ...state, railIncludesMixed: !state.railIncludesMixed };
  }
}
