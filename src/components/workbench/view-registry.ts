/**
 * Every view TARA Lab offers, grouped under its mode. Each one is the mode's own screen
 * and shares the device in focus. Adding a view is one entry here and a branch in its mode.
 */

import type { ModeId } from './mode-registry';

export interface LabView {
  id: string;
  label: string;
}

export interface LabViewGroup {
  label: string;
  views: readonly LabView[];
}

/** The first view of the first group is what a mode opens on. */
export const MODE_VIEW_GROUPS: Record<ModeId, readonly LabViewGroup[]> = {
  explore: [
    { label: 'Explore', views: [
      { id: 'device-classes', label: 'Device classes' },
      { id: 'catalog', label: 'Catalog' },
      { id: 'curated-chains', label: 'Curated chains' },
      { id: 'specifications', label: 'Device specifications' },
    ] },
  ],
  model: [
    { label: 'This device', views: [
      { id: 'risks', label: 'Risks' },
      { id: 'attack-map', label: 'Attack map' },
      { id: 'chains', label: 'Chains' },
      { id: 'around', label: 'Around the device' },
      { id: 'requirements', label: 'US requirements' },
      { id: 'report', label: 'Report' },
    ] },
  ],
  monitor: [
    { label: 'Signals', views: [{ id: 'signal', label: 'Signal' }] },
  ],
  query: [
    { label: 'Ask', views: [{ id: 'console', label: 'Query console' }] },
  ],
};

export function findView(modeId: ModeId, viewId: string): LabView | null {
  for (const group of MODE_VIEW_GROUPS[modeId]) {
    const view = group.views.find((candidate) => candidate.id === viewId);
    if (view !== undefined) return view;
  }
  return null;
}

export function defaultViewId(modeId: ModeId): string {
  return MODE_VIEW_GROUPS[modeId][0].views[0].id;
}
