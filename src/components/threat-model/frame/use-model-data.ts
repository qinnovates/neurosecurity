/**
 * Everything the Model views read that is computed from the device, the catalog and the
 * lens. It is computed once here, so the diagram, the facet bar and every view agree.
 */

import { useMemo } from 'react';
import { useFocus } from '@/components/workbench/FocusContext';
import type { ChainGenerationResult } from '@/lib/threat-model/chain-types';
import { describeEvidence } from '@/lib/threat-model/evidence-levels';
import { applyLens, type Lens, type LensContext } from '@/lib/threat-model/lens';
import { listElementsInModelOrder, type ModelElement } from '@/lib/threat-model/model-order';
import { listOrphanDecisions, type OrphanDecision } from '@/lib/threat-model/orphan-decisions';
import { summariseCoverageBySeverity, type SeverityCoverage } from '@/lib/threat-model/placement-coverage';
import { countRowsByElement, type ElementRowCounts } from '@/lib/threat-model/register-counts';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { countOpenRisksByElement, isRiskAddressed } from '@/lib/threat-model/risk-register';
import { summariseScope, type ScopeStatement } from '@/lib/threat-model/scope-statement';
import { countFacets, findCoverageGaps, type CoverageGaps, type FacetCounts, type ScopeByKind } from './facet-counts';
import { buildScopeByKind } from './scope-by-kind';
import { sanitiseLens } from './use-model-lens';

export interface ModelData {
  /** The lens with anything that no longer names something on this device removed. */
  lens: Lens;
  /** Rows whose technique is still in the catalog, and baseline rows. A row kept only for its decision is listed with the decisions without a row. */
  currentRows: RiskRow[];
  /** Current rows the lens lets through, and the "Open only" filter when it is on. */
  rowsInView: RiskRow[];
  elements: ModelElement[];
  /** Per part and connection, under every facet but the part itself, so the diagram shows where the chosen kind of row sits. */
  elementCounts: ElementRowCounts[];
  /** The same, as open catalog rows per element id, for the row of parts. */
  openRiskCounts: Map<string, number>;
  facetCounts: FacetCounts;
  gaps: CoverageGaps;
  scope: ScopeStatement;
  severityCoverage: SeverityCoverage;
  scopeByKind: ScopeByKind;
  orphans: OrphanDecision[];
  /** Generated chains with a step on the selected part or connection; all of them when none is selected. */
  chainsInView: ChainGenerationResult;
}

function filterChains(chainResult: ChainGenerationResult, elementId: string | null): ChainGenerationResult {
  if (elementId === null) return chainResult;
  return { ...chainResult, chains: chainResult.chains.filter((chain) => chain.steps.some((step) => step.elementId === elementId)) };
}

export function useModelData(heldLens: Lens, isOpenOnly: boolean): ModelData {
  const { state, report, engineData, referenceData } = useFocus();
  const { model } = state;

  const currentRows = useMemo(() => report.riskRows.filter((row) => row.catalogState === 'current'), [report.riskRows]);
  const lens = useMemo(() => sanitiseLens(heldLens, {
    model,
    techniqueIds: new Set(currentRows.flatMap((row) => (row.techniqueId === null ? [] : [row.techniqueId]))),
    evidenceLabels: new Set(currentRows.filter((row) => row.source === 'catalog').map((row) => describeEvidence(row).label)),
  }), [heldLens, model, currentRows]);
  const lensContext = useMemo<LensContext>(() => ({ model, techniques: engineData.techniques }), [model, engineData.techniques]);

  const rowsInView = useMemo(() => {
    const underLens = applyLens(currentRows, lens, lensContext);
    return isOpenOnly ? underLens.filter((row) => !isRiskAddressed(row)) : underLens;
  }, [currentRows, lens, lensContext, isOpenOnly]);
  const rowsOnAnyElement = useMemo(() => applyLens(currentRows, { ...lens, elementId: null }, lensContext), [currentRows, lens, lensContext]);
  const scope = useMemo(() => summariseScope(model, engineData, referenceData), [model, engineData, referenceData]);
  const severityCoverage = useMemo(() => summariseCoverageBySeverity(engineData.techniques, scope), [engineData.techniques, scope]);

  const scopeByKind = useMemo<ScopeByKind>(
    () => buildScopeByKind(scope, engineData.techniques, referenceData.placementRules.placements, severityCoverage),
    [scope, engineData.techniques, referenceData.placementRules.placements, severityCoverage],
  );

  return {
    lens, currentRows, rowsInView, scope, severityCoverage, scopeByKind,
    elements: useMemo(() => listElementsInModelOrder(model), [model]),
    elementCounts: useMemo(() => countRowsByElement(model, rowsOnAnyElement), [model, rowsOnAnyElement]),
    openRiskCounts: useMemo(() => countOpenRisksByElement(rowsOnAnyElement), [rowsOnAnyElement]),
    facetCounts: useMemo(() => countFacets(currentRows, lens, lensContext), [currentRows, lens, lensContext]),
    gaps: useMemo(() => findCoverageGaps(report.goalCoverage, severityCoverage), [report.goalCoverage, severityCoverage]),
    orphans: useMemo(() => listOrphanDecisions(model, report), [model, report]),
    chainsInView: useMemo(() => filterChains(report.chainResult, lens.elementId), [report.chainResult, lens.elementId]),
  };
}
