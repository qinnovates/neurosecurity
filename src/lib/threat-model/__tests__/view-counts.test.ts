import { describe, it, expect } from 'vitest';
import { CATALOG_SEVERITIES } from '../catalog-types';
import { summariseChainLanes } from '../chain-lanes';
import { RISK_STATUSES, TRUST_ZONES } from '../device-model';
import { DEFAULT_CHAIN_OPTIONS } from '../generate-chains';
import { SCOPE_TERMS } from '../lab-terms';
import { listElementsInModelOrder } from '../model-order';
import { summariseCoverageBySeverity } from '../placement-coverage';
import { countRowsByElement, describeRegisterUnits, summariseRegisterUnits } from '../register-counts';
import { THREAT_GOALS } from '../report-types';
import { goalOf, isRiskAddressed } from '../risk-register';
import { summariseScope } from '../scope-statement';
import { buildThreatModelReport } from '../build-report';
import { PRESETS, engineData, referenceData, reportFor } from './preset-reports';

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

describe.each(PRESETS)('counts for the preset %s', (_id, { model, report }) => {
  const scope = summariseScope(model, engineData, referenceData);
  const catalogRows = report.riskRows.filter((row) => row.source === 'catalog');
  const baselineRows = report.riskRows.filter((row) => row.source === 'stride');

  it('splits the catalog by severity and scope term, and every total is the catalog size', () => {
    const coverage = summariseCoverageBySeverity(engineData.techniques, scope);
    expect(coverage.total).toBe(engineData.techniques.length);
    expect(coverage.rows.map((row) => row.severity)).toEqual([...CATALOG_SEVERITIES]);
    expect(sum(SCOPE_TERMS.map((term) => coverage.totalsByTerm[term]))).toBe(engineData.techniques.length);
    for (const row of coverage.rows) {
      const ofSeverity = engineData.techniques.filter((technique) => technique.severity === row.severity);
      expect(row.total).toBe(ofSeverity.length);
      expect(sum(SCOPE_TERMS.map((term) => row.byTerm[term]))).toBe(ofSeverity.length);
      expect(row.byTerm.applies).toBe(scope.applies.filter((entry) => ofSeverity.some((technique) => technique.id === entry.techniqueId)).length);
    }
    expect(coverage.totalsByTerm).toEqual({
      applies: scope.applies.length, would_apply_if: scope.wouldApplyIf.length, reviewed_outside: scope.reviewedOutside.length, not_assessed: scope.notAssessed.length,
    });
  });

  it('lists parts and connections from the tissue side outward, each connection after its inner end', () => {
    const elements = listElementsInModelOrder(model);
    expect(elements.map((element) => element.id).sort()).toEqual([...model.components.map((component) => component.id), ...model.links.map((link) => link.id)].sort());
    const parts = elements.filter((element) => element.kind === 'part');
    const zoneOf = (partId: string): number => TRUST_ZONES.indexOf(model.components.find((component) => component.id === partId)?.trustZone ?? 'cloud');
    expect(parts.map((part) => zoneOf(part.id))).toEqual([...parts.map((part) => zoneOf(part.id))].sort((left, right) => left - right));
    expect(model.components.find((component) => component.id === parts[0].id)?.isNeuralInterface).toBe(true);
    for (const link of model.links) {
      const position = elements.findIndex((element) => element.id === link.id);
      const ends = [link.fromComponentId, link.toComponentId].map((partId) => elements.findIndex((element) => element.id === partId));
      expect(position).toBeGreaterThan(Math.min(...ends));
      const nextPart = elements.findIndex((element, index) => index > Math.min(...ends) && element.kind === 'part');
      if (nextPart !== -1) expect(position).toBeLessThan(nextPart);
    }
  });

  it('counts rows per part and per connection by severity and by decision, summing to the register', () => {
    const counts = countRowsByElement(model, report.riskRows);
    expect(counts.map((entry) => entry.id)).toEqual(listElementsInModelOrder(model).map((element) => element.id));
    expect(sum(counts.map((entry) => entry.catalogRows))).toBe(catalogRows.length);
    expect(sum(counts.map((entry) => entry.baselineRows))).toBe(baselineRows.length);
    expect(sum(counts.map((entry) => entry.openCatalogRows))).toBe(catalogRows.filter((row) => !isRiskAddressed(row)).length);
    for (const entry of counts) {
      const onElement = catalogRows.filter((row) => row.elementId === entry.id);
      expect(sum(CATALOG_SEVERITIES.map((severity) => entry.openBySeverity[severity]))).toBe(entry.openCatalogRows);
      expect(sum(RISK_STATUSES.map((status) => entry.catalogByStatus[status]))).toBe(onElement.length);
      for (const severity of CATALOG_SEVERITIES) expect(entry.openBySeverity[severity]).toBe(onElement.filter((row) => row.catalogSeverity === severity).length);
    }
    expect(counts.filter((entry) => entry.kind === 'connection' && entry.catalogRows > 0).length)
      .toBe(new Set(catalogRows.filter((row) => model.links.some((link) => link.id === row.elementId)).map((row) => row.elementId)).size);
  });

  it('moves one row from open to its decision when a decision is recorded', () => {
    const [target] = catalogRows;
    const decided = reportFor({ ...model, riskDecisions: [{ riskId: target.riskId, status: 'accepted', note: '' }] });
    const before = countRowsByElement(model, report.riskRows).find((entry) => entry.id === target.elementId);
    const after = countRowsByElement(model, decided.riskRows).find((entry) => entry.id === target.elementId);
    expect(after?.openCatalogRows).toBe((before?.openCatalogRows ?? 0) - 1);
    expect(after?.catalogByStatus.accepted).toBe(1);
    expect(after?.catalogRows).toBe(before?.catalogRows);
  });

  it('states what the numbers count, from the rows', () => {
    const units = summariseRegisterUnits(model, report.riskRows);
    expect(units).toEqual({
      techniques: new Set(catalogRows.map((row) => row.techniqueId)).size,
      elementsWithCatalogRows: new Set(catalogRows.map((row) => row.elementId)).size,
      elements: model.components.length + model.links.length,
      catalogRows: catalogRows.length,
      baselineRows: baselineRows.length,
    });
    expect(describeRegisterUnits(units)).toBe(
      `${units.techniques} techniques on ${units.elementsWithCatalogRows} parts and connections make ${units.catalogRows} rows, plus ${units.baselineRows} baseline rows.`,
    );
  });

  it('flags a goal as incomplete whenever some technique of that goal has no placement decision', () => {
    const { placements, notPlaced } = referenceData.placementRules;
    for (const goal of THREAT_GOALS) {
      const ofGoal = engineData.techniques.filter((technique) => goalOf(technique) === goal);
      expect(report.goalCoverage[goal].catalogTechniques).toBe(ofGoal.length);
      expect(report.goalCoverage[goal].placedTechniques).toBe(ofGoal.filter((technique) => technique.id in placements).length);
      expect(report.goalCoverage[goal].isIncomplete).toBe(ofGoal.some((technique) => !(technique.id in placements) && !(technique.id in notPlaced)));
    }
  });

  it('lays each chain on the parts and connections its steps act on', () => {
    const lanes = summariseChainLanes(model, report.chainResult);
    const order = lanes.elements.map((element) => element.id);
    expect(order).toEqual(listElementsInModelOrder(model).map((element) => element.id));
    expect(lanes.lanes.map((lane) => lane.chainId)).toEqual(report.chainResult.chains.map((chain) => chain.chain_id));
    for (const [index, lane] of lanes.lanes.entries()) {
      const chain = report.chainResult.chains[index];
      expect(lane.steps.map((step) => step.elementId)).toEqual(chain.steps.map((step) => step.elementId));
      expect(new Set(lane.elementIds)).toEqual(new Set(chain.steps.map((step) => step.elementId)));
      expect(lane.elementIds).toEqual(order.filter((elementId) => lane.elementIds.includes(elementId)));
    }
    for (const elementId of order) {
      expect(lanes.chainIdsByElement[elementId]).toEqual(report.chainResult.chains.filter((chain) => chain.steps.some((step) => step.elementId === elementId)).map((chain) => chain.chain_id));
    }
  });

  it('says whether the chain list was cut to the limit', () => {
    const { chainResult } = report;
    expect(chainResult.chainsFound).toBeGreaterThanOrEqual(chainResult.chains.length);
    expect(chainResult.wasCapped).toBe(chainResult.chainsFound > chainResult.chains.length);
    expect(chainResult.chains.length).toBeLessThanOrEqual(DEFAULT_CHAIN_OPTIONS.maxChains);
    const uncapped = buildThreatModelReport({ model, engineData, referenceData, generatedAt: '', chainOptions: { ...DEFAULT_CHAIN_OPTIONS, maxChains: chainResult.chainsFound + 1 } });
    expect(uncapped.chainResult.chains).toHaveLength(chainResult.chainsFound);
    expect(uncapped.chainResult.wasCapped).toBe(false);
    const one = buildThreatModelReport({ model, engineData, referenceData, generatedAt: '', chainOptions: { ...DEFAULT_CHAIN_OPTIONS, maxChains: 1 } });
    expect(one.chainResult.wasCapped).toBe(chainResult.chainsFound > 1);
    expect(summariseChainLanes(model, chainResult)).toMatchObject({ chainsFound: chainResult.chainsFound, wasCapped: chainResult.wasCapped });
  });
});

describe('describeRegisterUnits', () => {
  it('uses the singular for one of anything', () => {
    expect(describeRegisterUnits({ techniques: 1, elementsWithCatalogRows: 1, elements: 3, catalogRows: 1, baselineRows: 1 }))
      .toBe('1 technique on 1 part or connection makes 1 row, plus 1 baseline row.');
  });
});
