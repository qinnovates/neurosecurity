/**
 * What the command palette can jump to or do. Every entry is computed from the mode and view
 * registries, the shell's named actions, the catalog and the device in focus; none is written here.
 */

import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { describeElement } from '@/lib/threat-model/stride';
import { WORKBENCH_MODES } from './mode-registry';
import { describeRoute, type Route } from './route';
import { DEVICE_ACTIONS, type DeviceActionId } from './shell-targets';
import { MODE_VIEW_GROUPS } from './view-registry';

export type PaletteCommand =
  | { kind: 'view'; key: string; label: string; detail: string; route: Route }
  | { kind: 'action'; key: string; label: string; detail: string; actionId: DeviceActionId }
  | { kind: 'technique'; key: string; label: string; detail: string; techniqueId: string }
  | { kind: 'part'; key: string; label: string; detail: string; elementId: string };

export type PaletteCommandKind = PaletteCommand['kind'];

export const PALETTE_KIND_ORDER: readonly PaletteCommandKind[] = ['view', 'action', 'part', 'technique'];

const PART_WORD = 'Part';
const CONNECTION_WORD = 'Connection';
const MAX_QUERY_LENGTH = 80;

function listViewCommands(): PaletteCommand[] {
  return WORKBENCH_MODES.flatMap((mode) => MODE_VIEW_GROUPS[mode.id].flatMap((group) => group.views.map((view): PaletteCommand => ({
    kind: 'view', key: `view:${mode.id}/${view.id}`, label: view.label, detail: mode.label, route: { modeId: mode.id, viewId: view.id },
  }))));
}

/** The shell's named device actions. Each says where it takes the reader, in the registries' own labels. */
function listActionCommands(): PaletteCommand[] {
  return DEVICE_ACTIONS.map((action): PaletteCommand => ({
    kind: 'action', key: `action:${action.id}`, label: action.label, detail: describeRoute(action.target), actionId: action.id,
  }));
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

/** Every destination, in the order the palette lists them: screens, actions, parts of the device, techniques. */
export function listPaletteCommands(techniques: readonly CatalogTechnique[], model: DeviceModel): PaletteCommand[] {
  return [...listViewCommands(), ...listActionCommands(), ...listPartCommands(model), ...listTechniqueCommands(techniques)];
}

export interface PaletteSearchResult {
  /** The best matches, at most `limit`, grouped by kind in `PALETTE_KIND_ORDER`. */
  matches: PaletteCommand[];
  /** How many commands matched before the limit was applied. */
  matchCount: number;
}

/** A stretch of a label that the query matched: `start` inclusive, `end` exclusive. */
export interface MatchRange {
  start: number;
  end: number;
}

const WORD_CHARACTER_PATTERN = /[a-z0-9]/;

export function splitQueryWords(query: string): string[] {
  return query.trim().toLowerCase().slice(0, MAX_QUERY_LENGTH).split(/\s+/).filter((word) => word.length > 0);
}

/** Where `word` begins a word of `text` (both lower case), or -1. "in" begins a word of "man-in-the-middle" and not of "hijacking". */
function findWordStart(text: string, word: string): number {
  for (let index = text.indexOf(word); index !== -1; index = text.indexOf(word, index + 1)) {
    if (index === 0 || !WORD_CHARACTER_PATTERN.test(text[index - 1])) return index;
  }
  return -1;
}

const RANK_EXACT = 0;
const RANK_LEADING = 1;
const RANK_WORD_STARTS = 2;
const RANK_INSIDE_WORDS = 3;

/** How well a command answers the query: the whole name, its beginning, the beginnings of its words, or only the insides of words. Null when a word is missing. */
function rankMatch(command: PaletteCommand, needle: string, words: readonly string[]): number | null {
  const label = command.label.toLowerCase();
  const detail = command.detail.toLowerCase();
  const haystack = `${label} ${detail}`;
  if (!words.every((word) => haystack.includes(word))) return null;
  if (label === needle || detail === needle) return RANK_EXACT;
  if (label.startsWith(needle) || detail.startsWith(needle)) return RANK_LEADING;
  return words.every((word) => findWordStart(haystack, word) !== -1) ? RANK_WORD_STARTS : RANK_INSIDE_WORDS;
}

/**
 * Narrows the commands to those containing every word of the query in their name or
 * identifier. Exact and leading matches come first, then matches at the start of words.
 * A command that matches only inside words ("man" in "Command") is listed only when
 * nothing matches better. Ties keep the registry's order.
 */
export function searchPaletteCommands(commands: readonly PaletteCommand[], query: string, limit: number): PaletteSearchResult {
  const words = splitQueryWords(query);
  const needle = words.join(' ');
  const ranked = commands.flatMap((command) => {
    const rank = words.length === 0 ? RANK_EXACT : rankMatch(command, needle, words);
    return rank === null ? [] : [{ command, rank }];
  });
  const hasWordMatch = ranked.some((entry) => entry.rank < RANK_INSIDE_WORDS);
  const kept = hasWordMatch ? ranked.filter((entry) => entry.rank < RANK_INSIDE_WORDS) : ranked;
  const shown = [...kept].sort((first, second) => first.rank - second.rank).slice(0, limit).map((entry) => entry.command);
  const matches = PALETTE_KIND_ORDER.flatMap((kind) => shown.filter((command) => command.kind === kind));
  return { matches, matchCount: kept.length };
}

/** The stretches of `text` the query's words matched, in order and not overlapping, so they can be drawn heavier. */
export function findMatchRanges(text: string, query: string): MatchRange[] {
  const lower = text.toLowerCase();
  const found = splitQueryWords(query).flatMap((word) => {
    const atWordStart = findWordStart(lower, word);
    const start = atWordStart === -1 ? lower.indexOf(word) : atWordStart;
    return start === -1 ? [] : [{ start, end: start + word.length }];
  });
  const merged: MatchRange[] = [];
  for (const range of found.sort((first, second) => first.start - second.start)) {
    const last = merged[merged.length - 1];
    if (last !== undefined && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}
