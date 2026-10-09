/**
 * The screens and view-state keys the shell reaches into by name: the device menu and the
 * command palette open them. A test fails if a target stops existing in the view registry,
 * so renaming a view means updating it here.
 */

import type { Route } from './route';

/** Where the reader picks a different device. */
export const CHANGE_DEVICE_TARGET: Route = { modeId: 'explore', viewId: 'device-classes' };
/** Where the device in focus is edited. The Model mode opens its editor when `VIEW_STATE_KEYS.modelEditorOpen` is true. */
export const EDIT_DEVICE_TARGET: Route = { modeId: 'model', viewId: 'risks' };
/** The screen that prints as the report. */
export const REPORT_TARGET: Route = { modeId: 'model', viewId: 'report' };
/** Where a technique is opened. The catalog opens the technique whose id is under `VIEW_STATE_KEYS.catalogOpenedTechniqueId`. */
export const TECHNIQUE_TARGET: Route = { modeId: 'explore', viewId: 'catalog' };
/** Where a part of the device is shown. The Model mode selects the part whose id is under `VIEW_STATE_KEYS.modelSelectedElementId`. */
export const DEVICE_PART_TARGET: Route = { modeId: 'model', viewId: 'risks' };

export const SHELL_TARGETS: readonly Route[] = [CHANGE_DEVICE_TARGET, EDIT_DEVICE_TARGET, REPORT_TARGET, TECHNIQUE_TARGET, DEVICE_PART_TARGET];

/** Keys under this prefix describe the device in focus and are cleared when the device is replaced. */
export const MODEL_KEY_PREFIX = 'model/';
const SHELL_KEY_PREFIX = 'shell/';

/** View-state keys shared between the shell and a screen. Each holds a plain value read with `useViewState`. */
export const VIEW_STATE_KEYS = {
  /** `boolean`: the device editor is open in Model. Outside the "model/" prefix, so picking a class inside the editor does not close it. */
  modelEditorOpen: 'device-editor/open',
  /** `string | null`: the id of the part or connection Model is narrowed to. */
  modelSelectedElementId: `${MODEL_KEY_PREFIX}selected-element-id`,
  /** `string | null`: the id of the technique open in the catalog. */
  catalogOpenedTechniqueId: 'explore/catalog/opened-technique-id',
} as const;

export function lastViewKey(modeId: string): string {
  return `${SHELL_KEY_PREFIX}last-view/${modeId}`;
}

export function scrollKeyPrefix(modeId: string): string {
  return `${SHELL_KEY_PREFIX}scroll/${modeId}/`;
}

export function scrollKey(route: Route): string {
  return `${scrollKeyPrefix(route.modeId)}${route.viewId}`;
}
