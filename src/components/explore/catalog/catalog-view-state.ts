/**
 * What the catalog keeps when the reader leaves and comes back: filters, sort and layout.
 * The values are read back from session storage, so each is checked before it is used.
 */

import type { DataTableSort } from '@/components/lab-kit/DataTable';
import { useViewState, type SetViewState } from '@/components/workbench/ViewStateContext';
import { CATALOG_SEVERITIES } from '@/lib/threat-model/catalog-types';
import { EMPTY_CATALOG_FILTERS, type CatalogFilters } from '@/lib/threat-model/catalog-filter';
import { SCOPE_TERMS } from '@/lib/threat-model/lab-terms';
import { PLACED_ENTRY_PATHS } from '@/lib/threat-model/reference-data-types';

const KEY_PREFIX = 'explore/catalog/';
export const CATALOG_STATE_KEYS = {
  filters: `${KEY_PREFIX}filters`,
  sort: `${KEY_PREFIX}sort`,
  layout: `${KEY_PREFIX}layout`,
} as const;

export const CATALOG_LAYOUTS = ['table', 'family-band', 'domain-effect'] as const;
export type CatalogLayout = typeof CATALOG_LAYOUTS[number];

export const EVIDENCE_COLUMN_ID = 'evidence';
/** Evidence first: the strongest tier at the top. */
export const DEFAULT_CATALOG_SORT: DataTableSort = { columnId: EVIDENCE_COLUMN_ID, direction: 'ascending' };

const MODES: readonly string[] = ['R', 'M', 'D'];
const ENTRY_PATHS: readonly string[] = [...PLACED_ENTRY_PATHS, 'around_device'];
const MAX_TEXT_LENGTH = 200;
const MAX_LIST_LENGTH = 64;
const FILTER_FIELD_COUNT = Object.keys(EMPTY_CATALOG_FILTERS).length;

function isShortText(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_TEXT_LENGTH;
}

function isListOf(value: unknown, isMember: (item: unknown) => boolean): boolean {
  return Array.isArray(value) && value.length <= MAX_LIST_LENGTH && value.every(isMember);
}

function isOneOf(allowed: readonly string[]): (item: unknown) => boolean {
  return (item) => typeof item === 'string' && allowed.includes(item);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Closed lists are checked against their values; open ones (evidence labels, bands, ids, text) by type and length. */
export function isCatalogFilters(value: unknown): value is CatalogFilters {
  if (!isRecord(value) || Object.keys(value).length !== FILTER_FIELD_COUNT) return false;
  return isListOf(value.evidence, isShortText)
    && isListOf(value.modes, isOneOf(MODES))
    && isListOf(value.severities, isOneOf(CATALOG_SEVERITIES))
    && isListOf(value.placement, isOneOf(SCOPE_TERMS))
    && isListOf(value.entryPaths, isOneOf(ENTRY_PATHS))
    && isListOf(value.bandIds, isShortText)
    && (value.tacticId === null || isShortText(value.tacticId))
    && (value.domain === null || isShortText(value.domain))
    && isShortText(value.text);
}

export function isCatalogLayout(value: unknown): value is CatalogLayout {
  return typeof value === 'string' && (CATALOG_LAYOUTS as readonly string[]).includes(value);
}

export function isCatalogSort(value: unknown): value is DataTableSort {
  return isRecord(value) && isShortText(value.columnId) && (value.direction === 'ascending' || value.direction === 'descending');
}

export interface CatalogViewState {
  filters: CatalogFilters;
  setFilters: SetViewState<CatalogFilters>;
  sort: DataTableSort;
  setSort: SetViewState<DataTableSort>;
  layout: CatalogLayout;
  setLayout: SetViewState<CatalogLayout>;
}

/** The catalog's kept state, each value under its own key. */
export function useCatalogViewState(): CatalogViewState {
  const [filters, setFilters] = useViewState<CatalogFilters>(CATALOG_STATE_KEYS.filters, EMPTY_CATALOG_FILTERS, isCatalogFilters);
  const [sort, setSort] = useViewState<DataTableSort>(CATALOG_STATE_KEYS.sort, DEFAULT_CATALOG_SORT, isCatalogSort);
  const [layout, setLayout] = useViewState<CatalogLayout>(CATALOG_STATE_KEYS.layout, 'table', isCatalogLayout);
  return { filters, setFilters, sort, setSort, layout, setLayout };
}
