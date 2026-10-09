/**
 * What the command palette can jump to. Every entry is computed from the mode and view
 * registries, the catalog and the device in focus; none is written here.
 */

import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { describeElement } from '@/lib/threat-model/stride';
import { WORKBENCH_MODES } from './mode-registry';
import type { Route } from './route';
import { MODE_VIEW_GROUPS } from './view-registry';

export type PaletteCommand =
  | { kind: 'view'; key: string; label: string; detail: string; route: Route }
  | { kind: 'technique'; key: string; label: string; detail: string; techniqueId: string }
  | { kind: 'part'; key: string; label: string; detail: string; elementId: string };

export type PaletteCommandKind = PaletteCommand['kind'];

export const PALETTE_KIND_ORDER: readonly PaletteCommandKind[] = ['view', 'part', 'technique'];

const PART_WORD = 'Part';
const CONNECTION_WORD = 'Connection';
const MAX_QUERY_LENGTH = 80;

function listViewCommands(): PaletteCommand[] {
  return WORKBENCH_MODES.flatMap((mode) => MODE_VIEW_GROUPS[mode.id].flatMap((group) => group.views.map((view): PaletteCommand => ({
    kind: 'view', key: `view:${mode.id}/${view.id}`, label: view.label, detail: mode.label, route: { modeId: mode.id, viewId: view.id },
  }))));
}

function listPartCommands(model: DeviceModel): PaletteCommand[] {
  const parts = model.components.map((component): PaletteCommand => ({
    kind: 'part', key: `part:${component.id}`, label: component.label, detail: PART_WORD, elementId: component.id,
  }));
  const connections = model.links.map((link): PaletteCommand => ({
    kind: 'part', key: `part:${link.id}`, label: describeElement(model, link.id), detail: CONNECTION_WORD, elementId: link.id,
  }));
  return [...parts, ...connections];
}

function listTechniqueCommands(techniques: readonly CatalogTechnique[]): PaletteCommand[] {
  return techniques.map((technique): PaletteCommand => ({
    kind: 'technique', key: `technique:${technique.id}`, label: technique.name, detail: technique.id, techniqueId: technique.id,
  }));
}

/** Every destination, in the order the palette lists them: screens, parts of the device, techniques. */
export function listPaletteCommands(techniques: readonly CatalogTechnique[], model: DeviceModel): PaletteCommand[] {
  return [...listViewCommands(), ...listPartCommands(model), ...listTechniqueCommands(techniques)];
}

export interface PaletteSearchResult {
  /** The best matches, at most `limit`, grouped by kind in `PALETTE_KIND_ORDER`. */
  matches: PaletteCommand[];
  /** How many commands matched before the limit was applied. */
  matchCount: number;
}

function rankMatch(command: PaletteCommand, needle: string): number {
  const label = command.label.toLowerCase();
  const detail = command.detail.toLowerCase();
  if (label === needle || detail === needle) return 0;
  return label.startsWith(needle) || detail.startsWith(needle) ? 1 : 2;
}

/**
 * Narrows the commands to those containing every word of the query in their name or
 * identifier. Exact and leading matches come first; ties keep the registry's order.
 */
export function searchPaletteCommands(commands: readonly PaletteCommand[], query: string, limit: number): PaletteSearchResult {
  const needle = query.trim().toLowerCase().slice(0, MAX_QUERY_LENGTH);
  const words = needle.split(/\s+/).filter((word) => word.length > 0);
  const matching = commands.filter((command) => {
    const haystack = `${command.label} ${command.detail}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
  const ranked = words.length === 0
    ? matching
    : [...matching].sort((first, second) => rankMatch(first, needle) - rankMatch(second, needle));
  const shown = ranked.slice(0, limit);
  const matches = PALETTE_KIND_ORDER.flatMap((kind) => shown.filter((command) => command.kind === kind));
  return { matches, matchCount: matching.length };
}
