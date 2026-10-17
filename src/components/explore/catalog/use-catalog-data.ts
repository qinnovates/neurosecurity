/**
 * Everything the catalog screen computes from the catalog, the placement table and the
 * device in focus. Nothing here is typed in: every count and term is derived.
 */

import { useCallback, useMemo } from 'react';
import { useFocus } from '@/components/workbench/FocusContext';
import type { CatalogTactic, CatalogTechnique, PrecedentCve } from '@/lib/threat-model/catalog-types';
import {
  buildCatalogFilterContext, countCatalogFacets, countScopeTermsShown, filterCatalog,
  type CatalogFacetCounts, type CatalogFilterContext, type CatalogFilters, type CatalogScopeCounts,
} from '@/lib/threat-model/catalog-filter';
import { countByEvidence, type EvidenceCount } from '@/lib/threat-model/evidence-levels';
import { listElementsInModelOrder } from '@/lib/threat-model/model-order';
import { listScopeEntries, summariseScope, type ScopeEntry } from '@/lib/threat-model/scope-statement';
import { buildDomainAxis } from './catalog-axes';
import type { DomainOption } from './CatalogFacetBar';

export interface CatalogData {
  techniques: readonly CatalogTechnique[];
  tactics: readonly CatalogTactic[];
  deviceName: string;
  filterContext: CatalogFilterContext;
  /** The techniques the filters leave. */
  shown: readonly CatalogTechnique[];
  facets: CatalogFacetCounts;
  /** Where the techniques stand with every filter applied except the "On this device" one. */
  scopeCounts: CatalogScopeCounts;
  evidenceValues: readonly EvidenceCount[];
  domains: readonly DomainOption[];
  scopeOf: (techniqueId: string) => ScopeEntry | undefined;
  familyNameOf: (tacticId: string) => string;
  tacticOf: (tacticId: string) => CatalogTactic | undefined;
  elementLabelOf: (elementId: string) => string;
  techniqueOf: (techniqueId: string) => CatalogTechnique | undefined;
  /** CVE records the catalog links to a technique. */
  cvesOf: (techniqueId: string) => PrecedentCve[];
  /** Related techniques the catalog holds; an id it lacks is left out. */
  relatedOf: (technique: CatalogTechnique) => CatalogTechnique[];
  cvesAsOf: string;
}

export function useCatalogData(filters: CatalogFilters): CatalogData {
  const { engineData, referenceData, state, techniqueById } = useFocus();
  const { techniques, tactics, precedentCves } = engineData;
  const { model } = state;

  const scope = useMemo(() => summariseScope(model, engineData, referenceData), [model, engineData, referenceData]);
  const scopeById = useMemo(() => new Map(listScopeEntries(scope).map((entry) => [entry.techniqueId, entry])), [scope]);
  // The filter and the scope statement read the same set, so a row's term and the chip that filters on it cannot disagree.
  const filterContext = useMemo(
    () => buildCatalogFilterContext(engineData, referenceData.placementRules, new Set(scope.applies.map((entry) => entry.techniqueId))),
    [engineData, referenceData.placementRules, scope],
  );
  const shown = useMemo(() => filterCatalog(techniques, filters, filterContext), [techniques, filters, filterContext]);
  const facets = useMemo(() => countCatalogFacets(techniques, filters, filterContext), [techniques, filters, filterContext]);
  const scopeCounts = useMemo(() => countScopeTermsShown(techniques, { ...filters, placement: [] }, filterContext), [techniques, filters, filterContext]);
  const evidenceValues = useMemo(() => countByEvidence(techniques), [techniques]);
  const domains = useMemo(() => buildDomainAxis(techniques).map((item) => ({ code: item.id, label: item.label })), [techniques]);
  const tacticById = useMemo(() => new Map(tactics.map((tactic) => [tactic.id, tactic])), [tactics]);
  const elementLabelById = useMemo(() => new Map(listElementsInModelOrder(model).map((element) => [element.id, element.label])), [model]);

  return {
    techniques, tactics, deviceName: model.name, filterContext, shown, facets, scopeCounts, evidenceValues, domains,
    cvesAsOf: engineData.precedentCvesAsOf,
    scopeOf: useCallback((techniqueId: string) => scopeById.get(techniqueId), [scopeById]),
    familyNameOf: useCallback((tacticId: string) => tacticById.get(tacticId)?.name ?? tacticId, [tacticById]),
    tacticOf: useCallback((tacticId: string) => tacticById.get(tacticId), [tacticById]),
    elementLabelOf: useCallback((elementId: string) => elementLabelById.get(elementId) ?? elementId, [elementLabelById]),
    techniqueOf: useCallback((techniqueId: string) => techniqueById.get(techniqueId), [techniqueById]),
    cvesOf: useCallback((techniqueId: string) => precedentCves.filter((cve) => cve.techniqueIds.includes(techniqueId)), [precedentCves]),
    relatedOf: useCallback(
      (technique: CatalogTechnique) => technique.relatedTechniqueIds.flatMap((relatedId) => { const related = techniqueById.get(relatedId); return related === undefined ? [] : [related]; }),
      [techniqueById],
    ),
  };
}
