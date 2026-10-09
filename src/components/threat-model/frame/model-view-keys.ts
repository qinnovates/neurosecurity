/**
 * The Model mode's views and the view-state keys its screens keep. Keys under "model/"
 * describe the device in focus and are cleared by the shell when the device is replaced.
 */

import { MODEL_KEY_PREFIX } from '@/components/workbench/shell-targets';
import { MODEL_LIMITS } from '@/lib/threat-model/device-model';

/** View ids as `view-registry.ts` lists them. */
export const MODEL_VIEWS = {
  overview: 'overview',
  risks: 'risks',
  techniquesByPart: 'attack-map',
  chains: 'chains',
  around: 'around',
  requirements: 'requirements',
  report: 'report',
} as const;

export type ModelViewId = typeof MODEL_VIEWS[keyof typeof MODEL_VIEWS];

/** Views the diagram acts on. Everywhere else the device is one line of identity. */
export const DIAGRAM_VIEW_IDS: readonly string[] = [MODEL_VIEWS.overview, MODEL_VIEWS.risks, MODEL_VIEWS.techniquesByPart, MODEL_VIEWS.chains];
/** Views the facet bar narrows. */
export const FACET_VIEW_IDS: readonly string[] = [MODEL_VIEWS.risks, MODEL_VIEWS.techniquesByPart, MODEL_VIEWS.chains];

export const MODEL_STATE_KEYS = {
  /** The lens without its part and technique, which the shell shares under its own keys. */
  lensFacets: `${MODEL_KEY_PREFIX}lens/facets`,
  /** `boolean`: rows with a decision are left out. */
  isOpenOnly: `${MODEL_KEY_PREFIX}open-only`,
  registerScope: `${MODEL_KEY_PREFIX}risks/scope`,
  registerSort: `${MODEL_KEY_PREFIX}risks/sort`,
  /** `string | null`: the risk whose detail drawer is open. */
  openedRiskId: `${MODEL_KEY_PREFIX}risks/opened-risk-id`,
  selectedChainId: `${MODEL_KEY_PREFIX}chains/selected-chain-id`,
  /** `boolean | null`: the reader's fold of the diagram on the working views; null until they choose. */
  isDiagramOpen: `${MODEL_KEY_PREFIX}diagram-open`,
  /** The section of the device editor in front of the reader. */
  editorSection: `${MODEL_KEY_PREFIX}editor/section`,
  /** `string[]`: the panels opened on "Around the device". */
  aroundOpenPanels: `${MODEL_KEY_PREFIX}around/open-panels`,
} as const;

/** A risk id joins an element id and a technique id or baseline category. */
const MAX_RISK_ID_LENGTH = MODEL_LIMITS.maxIdLength * 3;
const MAX_CHAIN_ID_LENGTH = 200;

function isNullableText(value: unknown, maxLength: number): value is string | null {
  return value === null || (typeof value === 'string' && value.length > 0 && value.length <= maxLength);
}

/** Validators for ids read back from view state, which is untrusted. An id is also checked against the model before use. */
export function isNullableId(value: unknown): value is string | null {
  return isNullableText(value, MODEL_LIMITS.maxIdLength);
}

export function isNullableRiskId(value: unknown): value is string | null {
  return isNullableText(value, MAX_RISK_ID_LENGTH);
}

export function isNullableChainId(value: unknown): value is string | null {
  return isNullableText(value, MAX_CHAIN_ID_LENGTH);
}
