/**
 * Every view TARA Lab offers, grouped under its mode. A view is either the mode's own
 * screen, which shares the device in focus, or an existing site page shown in a frame.
 * Moving a dashboard into the Lab is one entry here.
 */

import type { ModeId } from './mode-registry';

export interface LabView {
  id: string;
  label: string;
  /** Site path of an existing page to show in a frame; null for the mode's own screen. */
  framedPath: string | null;
}

export interface LabViewGroup {
  label: string;
  views: readonly LabView[];
}

/** The first view of the first group is what a mode opens on. */
export const MODE_VIEW_GROUPS: Record<ModeId, readonly LabViewGroup[]> = {
  explore: [
    { label: 'Explore', views: [
      { id: 'device-classes', label: 'Device classes', framedPath: null },
      { id: 'catalog', label: 'Catalog', framedPath: null },
      { id: 'curated-chains', label: 'Curated chains', framedPath: null },
      { id: 'specifications', label: 'Device specifications', framedPath: null },
    ] },
  ],
  model: [
    { label: 'This device', views: [
      { id: 'risks', label: 'Risks', framedPath: null },
      { id: 'attack-map', label: 'Attack map', framedPath: null },
      { id: 'chains', label: 'Chains', framedPath: null },
      { id: 'around', label: 'Around the device', framedPath: null },
      { id: 'requirements', label: 'US requirements', framedPath: null },
      { id: 'report', label: 'Report', framedPath: null },
    ] },
  ],
  monitor: [
    { label: 'Signals', views: [
      { id: 'signal-monitor', label: 'Signal monitor', framedPath: null },
      { id: 'neurosim', label: 'NeuroSIM', framedPath: '/atlas/neurosim/' },
    ] },
  ],
  query: [
    { label: 'Ask', views: [
      { id: 'console', label: 'Query console', framedPath: null },
      { id: 'research-dashboard', label: 'Research dashboard', framedPath: '/research/dashboard/' },
    ] },
    { label: 'Datasets', views: [
      { id: 'data-studio', label: 'Data Studio', framedPath: '/data-studio/' },
      { id: 'eeg', label: 'EEG datasets', framedPath: '/data-studio/eeg/' },
    ] },
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
