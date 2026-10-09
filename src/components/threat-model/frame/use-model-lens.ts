/**
 * The lens on the device, kept in view state so it survives a change of view, mode and
 * Back. The selected part and the selected technique sit under keys the shell also writes
 * (the command palette, "Show in Model"); the other facets sit under one key of their own.
 */

import { useCallback, useMemo } from 'react';
import { VIEW_STATE_KEYS } from '@/components/workbench/shell-targets';
import { useViewState } from '@/components/workbench/ViewStateContext';
import { CATALOG_SEVERITIES, type CatalogSeverity } from '@/lib/threat-model/catalog-types';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { EMPTY_LENS, type Lens } from '@/lib/threat-model/lens';
import { PLACED_ENTRY_PATHS, type PlacedEntryPath } from '@/lib/threat-model/reference-data-types';
import { THREAT_GOALS, type ThreatGoal } from '@/lib/threat-model/report-types';
import { MODEL_STATE_KEYS, isNullableId } from './model-view-keys';

export type LensFacets = Omit<Lens, 'elementId' | 'techniqueId'>;

const EMPTY_FACETS: LensFacets = {
  isElementOnly: EMPTY_LENS.isElementOnly, entryPaths: [], goals: [], severities: [], evidenceLevels: [], bandIds: [],
};
const FACET_KEYS = Object.keys(EMPTY_FACETS).sort();
const MAX_FACET_VALUES = 32;
const MAX_FACET_TEXT_LENGTH = 120;

function isListOf<Value extends string>(value: unknown, isMember: (item: string) => item is Value): value is Value[] {
  return Array.isArray(value) && value.length <= MAX_FACET_VALUES && value.every((item) => typeof item === 'string' && isMember(item));
}

function isOneOf<Value extends string>(known: readonly Value[]): (item: string) => item is Value {
  return (item): item is Value => (known as readonly string[]).includes(item);
}

function isShortText(item: string): item is string {
  return item.length > 0 && item.length <= MAX_FACET_TEXT_LENGTH;
}

/** Accepts only the facets' own fields, each holding only values the lens knows. */
export function isLensFacets(value: unknown): value is LensFacets {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).sort().join() !== FACET_KEYS.join()) return false;
  return typeof record.isElementOnly === 'boolean'
    && isListOf<PlacedEntryPath>(record.entryPaths, isOneOf(PLACED_ENTRY_PATHS))
    && isListOf<ThreatGoal>(record.goals, isOneOf(THREAT_GOALS))
    && isListOf<CatalogSeverity>(record.severities, isOneOf(CATALOG_SEVERITIES))
    && isListOf(record.evidenceLevels, isShortText)
    && isListOf(record.bandIds, isShortText);
}

export interface LensKnowledge {
  model: Pick<DeviceModel, 'components' | 'links'>;
  /** Technique ids that have a row on this device. */
  techniqueIds: ReadonlySet<string>;
  /** Evidence labels that occur on this device's rows. */
  evidenceLabels: ReadonlySet<string>;
}

/**
 * Drops whatever no longer names anything: a part the device no longer has, a technique with
 * no row here, an evidence value no row carries. A lens that narrows to nothing nameable
 * would hide rows with no control on screen to undo it.
 */
export function sanitiseLens(lens: Lens, known: LensKnowledge): Lens {
  const hasElement = lens.elementId !== null
    && (known.model.components.some((component) => component.id === lens.elementId) || known.model.links.some((link) => link.id === lens.elementId));
  return {
    ...lens,
    elementId: hasElement ? lens.elementId : null,
    techniqueId: lens.techniqueId !== null && known.techniqueIds.has(lens.techniqueId) ? lens.techniqueId : null,
    evidenceLevels: lens.evidenceLevels.filter((label) => known.evidenceLabels.has(label)),
    // No Model screen offers a band facet, so a band is never left narrowing the rows unseen.
    bandIds: [],
  };
}

export interface ModelLens {
  /** As held, before it is checked against the device. */
  lens: Lens;
  setLens: (next: Lens) => void;
}

export function useModelLens(): ModelLens {
  const [elementId, setElementId] = useViewState<string | null>(VIEW_STATE_KEYS.modelSelectedElementId, null, isNullableId);
  const [techniqueId, setTechniqueId] = useViewState<string | null>(VIEW_STATE_KEYS.modelLensTechniqueId, null, isNullableId);
  const [facets, setFacets] = useViewState<LensFacets>(MODEL_STATE_KEYS.lensFacets, EMPTY_FACETS, isLensFacets);

  const lens = useMemo<Lens>(() => ({ ...facets, elementId, techniqueId }), [facets, elementId, techniqueId]);
  const setLens = useCallback((next: Lens): void => {
    const { elementId: nextElementId, techniqueId: nextTechniqueId, ...nextFacets } = next;
    setElementId(nextElementId);
    setTechniqueId(nextTechniqueId);
    setFacets(nextFacets);
  }, [setElementId, setTechniqueId, setFacets]);

  return { lens, setLens };
}
