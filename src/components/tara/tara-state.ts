import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { listTechniqueRights } from '@/lib/atlas-explorer/region-dossier';
import type { Lens } from '@/lib/atlas-explorer/lens-state';

export type TaraLens = 'band' | 'niss' | 'evidence';
export type Perspective = 'security' | 'both' | 'clinical';
export interface TaraState {
  selectedRegionId: string | null;
  lens: TaraLens;
  perspective: Perspective;
  selectedTechniqueId: string | null;
  nissOpen: boolean;
  evidenceOpen: boolean;
}
export const INITIAL_TARA_STATE: TaraState = { selectedRegionId: 'pfc', lens: 'band', perspective: 'both', selectedTechniqueId: null, nissOpen: false, evidenceOpen: false };
export type TaraAction =
  | { type: 'region'; id: string | null }
  | { type: 'lens'; lens: TaraLens }
  | { type: 'perspective'; perspective: Perspective }
  | { type: 'technique'; id: string; regionId: string | null }
  | { type: 'niss'; open: boolean }
  | { type: 'evidence'; open: boolean };

export function taraReducer(state: TaraState, action: TaraAction): TaraState {
  switch (action.type) {
    case 'region': return { ...state, selectedRegionId: action.id, selectedTechniqueId: null, nissOpen: state.lens === 'niss' };
    case 'lens': return { ...state, lens: action.lens, nissOpen: action.lens === 'niss', evidenceOpen: action.lens === 'evidence' };
    case 'perspective': return { ...state, perspective: action.perspective };
    case 'technique': return { ...state, selectedTechniqueId: action.id, selectedRegionId: action.regionId, nissOpen: state.lens === 'niss' };
    case 'niss': return { ...state, nissOpen: action.open };
    case 'evidence': return { ...state, evidenceOpen: action.open };
  }
}

/** Public display projection only; no operational descriptions or clinical parameters. */
export interface TaraTechnique {
  id: string;
  name: string;
  therapeuticAnalog: string | null;
  evidenceTier: string | null;
  sources: string[];
  clinicalSources: string[];
}
/** Every catalog entry is a threat technique; an analog also qualifies it for Clinical. */
export function filterTtpList(techniques: readonly TaraTechnique[], perspective: Perspective): TaraTechnique[] {
  return techniques.filter((technique) => perspective !== 'clinical' || Boolean(technique.therapeuticAnalog?.trim()));
}

export function buildTaraPanelModel(model: ExplorerModel, state: TaraState, catalog: readonly TaraTechnique[]) {
  const region = state.selectedRegionId ? model.regionsById.get(state.selectedRegionId) ?? null : null;
  // Count only standing, region-resolved mappings, never band inheritance or stale drafts.
  const mappedIds = new Set((model.linksByRegion.get(region?.id ?? '') ?? []).filter(({ link }) => link.lit).map(({ technique }) => technique.id));
  const techniques = filterTtpList(catalog.filter((t) => mappedIds.has(t.id)), state.perspective);
  const ids = new Set(techniques.map((t) => t.id));
  const rights = listTechniqueRights([...ids].flatMap((id) => model.techniquesById.get(id) ?? []), model.index.neurorights_taxonomy);
  return {
    region, techniques, count: techniques.length,
    emphasis: state.lens === 'band' ? 'band' : state.lens === 'niss' ? 'NISS score' : 'Evidence',
    bandNames: region?.band_ids.map((id) => `${id} ${model.bandsById.get(id)?.name ?? ''}`.trim()).join(', ') ?? '',
    emptyMessage: region ? `No mapped techniques for this region under the ${state.perspective} perspective.` : 'Choose a region to see its mapped techniques.',
    // Scores do not even enter the panel model before a disclosure action.
    scores: state.nissOpen ? techniques.flatMap((t) => {
      const niss = model.techniquesById.get(t.id)?.niss;
      return niss?.scoring_state === 'scored' && niss.score !== null ? [{ id: t.id, name: t.name, score: niss.score }] : [];
    }) : [],
    rights: [...new Map(rights.map((r) => [r.code, r])).values()],
    deviceIds: model.index.devices.stated_targets.filter((device) => device.region_ids.includes(region?.id ?? '')).map((device) => device.device_id),
    selectedTechnique: catalog.find((t) => t.id === state.selectedTechniqueId) ?? null,
  };
}

export function taraBrainLens(state: TaraState, techniques: readonly TaraTechnique[]): Lens {
  return state.lens === 'evidence'
    ? { kind: 'evidence', tiersByTechnique: Object.fromEntries(filterTtpList(techniques, state.perspective).flatMap((t) => t.evidenceTier ? [[t.id, t.evidenceTier]] : [])) }
    : { kind: state.lens };
}
