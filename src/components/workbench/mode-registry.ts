/**
 * The modes of TARA Lab. The shell renders from this list and imports no mode
 * directly, so adding a mode is one entry here plus its own folder.
 */

import type { ComponentType } from 'react';

export const MODE_IDS = ['explore', 'model', 'monitor', 'query'] as const;
export type ModeId = typeof MODE_IDS[number];

/** Everything else a mode needs comes from the shared focus (see FocusContext). */
export interface ModeProps {
  onOpenMode: (modeId: ModeId) => void;
}

export interface WorkbenchMode {
  id: ModeId;
  label: string;
  /** The single question this mode answers; shown under the mode bar. */
  question: string;
  /** Fetched only when the user opens the mode. */
  load: () => Promise<{ default: ComponentType<ModeProps> }>;
}

export const DEFAULT_MODE_ID: ModeId = 'explore';

export const WORKBENCH_MODES: readonly WorkbenchMode[] = [
  { id: 'explore', label: 'Explore', question: 'Which kind of device?', load: () => import('@/components/explore/ExploreMode') },
  { id: 'model', label: 'Model', question: 'What applies to this device, and what do I do about it?', load: () => import('@/components/threat-model/ThreatModelStudio') },
  { id: 'monitor', label: 'Monitor', question: 'What is the signal doing?', load: () => import('@/components/monitor/MonitorMode') },
  { id: 'query', label: 'Query', question: 'Show me exactly this.', load: () => import('@/components/query/QueryMode') },
];

export function isModeId(value: string): value is ModeId {
  return (MODE_IDS as readonly string[]).includes(value);
}
