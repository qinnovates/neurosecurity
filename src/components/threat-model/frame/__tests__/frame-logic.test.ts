import { describe, it, expect } from 'vitest';
import { CATALOG_SEVERITIES } from '@/lib/threat-model/catalog-types';
import { describeEvidence } from '@/lib/threat-model/evidence-levels';
import { EMPTY_LENS, applyLens, countOpenRisks, type Lens } from '@/lib/threat-model/lens';
import { listElementsInModelOrder } from '@/lib/threat-model/model-order';
import { summariseCoverageBySeverity } from '@/lib/threat-model/placement-coverage';
import { THREAT_GOALS, type RiskRow } from '@/lib/threat-model/report-types';
import { isRiskAddressed } from '@/lib/threat-model/risk-register';
import { summariseScope } from '@/lib/threat-model/scope-statement';
import { PRESETS, engineData, referenceData } from '@/lib/threat-model/__tests__/preset-reports';
import { NOTE_REQUIRED_STATEMENT, canRecordDecision, isNoteRequired } from '../decision-rules';
import { countFacets, findCoverageGaps, isZeroNotAssessed } from '../facet-counts';
import { MODEL_STATE_KEYS, isNullableChainId, isNullableId, isNullableRiskId } from '../model-view-keys';
import { groupKeyOf, groupRegisterRows } from '../register-order';
import { buildTechniqueMatrix } from '../technique-matrix';
import { isLensFacets, sanitiseLens } from '../use-model-lens';

const [, headset] = PRESETS[0];
const context = { model: headset.model, techniques: engineData.techniques };
const currentRows = headset.report.riskRows.filter((row) => row.catalogState === 'current');
const catalogRows = currentRows.filter((row) => row.source === 'catalog');

describe('model view keys', () => {
  it('keeps every key under "model/", so the shell clears them with the device', () => {
    for (const key of Object.values(MODEL_STATE_KEYS)) expect(key).toMatch(/^model\/[a-z0-9/-]+$/);
  });

  it('accepts null or a short id from view state, and nothing else', () => {
    for (const isValid of [isNullableId, isNullableRiskId, isNullableChainId]) {
      expect(isValid(null)).toBe(true);
      expect(isValid('part-1')).toBe(true);
      expect(isValid('')).toBe(false);
      expect(isValid(7)).toBe(false);
      expect(isValid({ id: 'part-1' })).toBe(false);
      expect(isValid('x'.repeat(5_000))).toBe(false);
    }
    expect(isNullableRiskId(catalogRows[0].riskId)).toBe(true);
  });
});

describe('isLensFacets', () => {
  const { elementId: _elementId, techniqueId: _techniqueId, ...facets } = EMPTY_LENS;

  it('accepts the empty facets and a narrowed set', () => {
    expect(isLensFacets(facets)).toBe(true);
    expect(isLensFacets({ ...facets, goals: ['deny'], severities: ['critical'], entryPaths: ['senses'], evidenceLevels: ['Demonstrated (lab)'] })).toBe(true);
  });

  it('refuses a missing field, an extra field, an unknown value and anything that is not a record', () => {
    expect(isLensFacets({ ...facets, goals: ['destroy'] })).toBe(false);
    expect(isLensFacets({ ...facets, severities: ['catastrophic'] })).toBe(false);
    expect(isLensFacets({ ...facets, extra: true })).toBe(false);
    expect(isLensFacets({ goals: [] })).toBe(false);
    expect(isLensFacets({ ...facets, evidenceLevels: ['x'.repeat(500)] })).toBe(false);
    expect(isLensFacets({ ...facets, bandIds: Array.from({ length: 100 }, () => 'N1') })).toBe(false);
    for (const value of [null, 'text', 3, [], undefined]) expect(isLensFacets(value)).toBe(false);
  });
});

describe('sanitiseLens', () => {
  const known = {
    model: headset.model,
    techniqueIds: new Set(catalogRows.map((row) => row.techniqueId as string)),
    evidenceLabels: new Set(catalogRows.map((row) => describeEvidence(row).label)),
  };

  it('keeps what names something on the device', () => {
    const lens: Lens = { ...EMPTY_LENS, elementId: headset.model.components[0].id, techniqueId: catalogRows[0].techniqueId, evidenceLevels: [describeEvidence(catalogRows[0]).label] };
    expect(sanitiseLens(lens, known)).toEqual(lens);
  });

  it('drops a part, a technique, an evidence value and a band that name nothing here', () => {
    const lens: Lens = { ...EMPTY_LENS, elementId: 'gone', techniqueId: 'QIF-T9999', evidenceLevels: ['Invented'], bandIds: ['N1'], goals: ['read'] };
    expect(sanitiseLens(lens, known)).toEqual({ ...EMPTY_LENS, goals: ['read'] });
  });
});

describe('countFacets', () => {
  it.each(PRESETS)('%s: each count is the open catalog rows that value would leave', (_presetId, { report, model }) => {
    const rows = report.riskRows.filter((row) => row.catalogState === 'current');
    const lensContext = { model, techniques: engineData.techniques };
    const counts = countFacets(rows, EMPTY_LENS, lensContext);
    const openCatalog = rows.filter((row) => row.source === 'catalog' && !isRiskAddressed(row));
    for (const severity of CATALOG_SEVERITIES) expect(counts.bySeverity[severity]).toBe(openCatalog.filter((row) => row.catalogSeverity === severity).length);
    for (const goal of THREAT_GOALS) expect(counts.catalogByGoal[goal]).toBe(openCatalog.filter((row) => row.goal === goal).length);
    expect(counts.byEvidence.reduce((sum, evidence) => sum + evidence.count, 0)).toBe(openCatalog.length);
    expect(counts.openRows).toBe(rows.filter((row) => !isRiskAddressed(row)).length);
    expect(counts.lens).toEqual(countOpenRisks(rows, EMPTY_LENS, lensContext));
  });

  it('counts a severity with the other facets applied and the severity facet itself cleared', () => {
    const lens: Lens = { ...EMPTY_LENS, elementId: headset.model.components[0].id, severities: ['low'] };
    const counts = countFacets(currentRows, lens, context);
    const underPart = applyLens(currentRows, { ...lens, severities: [] }, context).filter((row) => row.source === 'catalog' && !isRiskAddressed(row));
    for (const severity of CATALOG_SEVERITIES) expect(counts.bySeverity[severity]).toBe(underPart.filter((row) => row.catalogSeverity === severity).length);
  });
});

describe('coverage gaps', () => {
  it.each(PRESETS)('%s: follow goalCoverage and the not-assessed column of the severity table', (_presetId, { report, model }) => {
    const severityCoverage = summariseCoverageBySeverity(engineData.techniques, summariseScope(model, engineData, referenceData));
    const gaps = findCoverageGaps(report.goalCoverage, severityCoverage);
    for (const goal of THREAT_GOALS) expect(gaps.byGoal[goal]).toBe(report.goalCoverage[goal].isIncomplete);
    for (const row of severityCoverage.rows) expect(gaps.bySeverity[row.severity]).toBe(row.byTerm.not_assessed > 0);
    expect(gaps.isAnyIncomplete).toBe(severityCoverage.totalsByTerm.not_assessed > 0);
  });

  it('calls a zero "not assessed" only where coverage is incomplete', () => {
    expect(isZeroNotAssessed(0, true)).toBe(true);
    expect(isZeroNotAssessed(0, false)).toBe(false);
    expect(isZeroNotAssessed(3, true)).toBe(false);
  });
});

describe('decision rules', () => {
  it('require a note for Accepted and Not applicable, and for nothing else', () => {
    expect(isNoteRequired('accepted')).toBe(true);
    expect(isNoteRequired('not_applicable')).toBe(true);
    expect(isNoteRequired('open')).toBe(false);
    expect(isNoteRequired('mitigated')).toBe(false);
    expect(canRecordDecision('accepted', '   ')).toBe(false);
    expect(canRecordDecision('accepted', 'Residual risk signed off')).toBe(true);
    expect(canRecordDecision('mitigated', '')).toBe(true);
    expect(NOTE_REQUIRED_STATEMENT).toBe('A note is required for Accepted and Not applicable.');
  });
});

describe('groupRegisterRows', () => {
  const elements = listElementsInModelOrder(headset.model);

  it('keeps every row once, with the rows of one technique together and in model order', () => {
    const grouped = groupRegisterRows(currentRows, elements);
    expect(grouped.rows).toHaveLength(currentRows.length);
    expect(new Set(grouped.rows.map((row) => row.riskId)).size).toBe(currentRows.length);
    const keys = grouped.rows.map(groupKeyOf);
    const runs = keys.filter((key, index) => index === 0 || keys[index - 1] !== key);
    expect(runs).toHaveLength(new Set(keys).size);
    expect(grouped.leadRiskIds.size).toBe(new Set(keys).size);
    const position = new Map(elements.map((element, index) => [element.id, index]));
    grouped.rows.forEach((row, index) => {
      const previous = grouped.rows[index - 1];
      if (previous !== undefined && groupKeyOf(previous) === groupKeyOf(row)) {
        expect(position.get(previous.elementId) as number).toBeLessThanOrEqual(position.get(row.elementId) as number);
      }
    });
  });

  it('puts a technique whose every line has a decision after those with an open line', () => {
    const firstKey = groupKeyOf(catalogRows[0]);
    const decided = catalogRows.map((row): RiskRow => (groupKeyOf(row) === firstKey ? { ...row, status: 'mitigated' } : row));
    const grouped = groupRegisterRows(decided, elements);
    const lastGroup = groupKeyOf(grouped.rows[grouped.rows.length - 1]);
    expect(lastGroup).toBe(firstKey);
    expect(isRiskAddressed(grouped.rows[0])).toBe(false);
  });
});

describe('buildTechniqueMatrix', () => {
  const elements = listElementsInModelOrder(headset.model);
  const matrix = buildTechniqueMatrix(currentRows, elements);

  it('has one line per technique, one column per part and connection in model order, and one cell per row', () => {
    expect(matrix.columns.map((column) => column.id)).toEqual(elements.map((element) => element.id));
    expect(matrix.lines).toHaveLength(new Set(catalogRows.map((row) => row.techniqueId)).size);
    expect(matrix.lines.flatMap((line) => line.cells).filter((cell) => cell !== null)).toHaveLength(catalogRows.length);
  });

  it('sums rows and open rows the same along lines and columns', () => {
    const open = catalogRows.filter((row) => !isRiskAddressed(row)).length;
    expect(matrix.lines.reduce((sum, line) => sum + line.rows, 0)).toBe(catalogRows.length);
    expect(matrix.columnTotals.reduce((sum, totals) => sum + totals.rows, 0)).toBe(catalogRows.length);
    expect(matrix.lines.reduce((sum, line) => sum + line.open, 0)).toBe(open);
    expect(matrix.columnTotals.reduce((sum, totals) => sum + totals.open, 0)).toBe(open);
  });

  it('leaves out baseline rows and rows whose technique left the catalog, and makes its own columns without a model', () => {
    const missing: RiskRow = { ...catalogRows[0], riskId: 'x::gone', techniqueId: 'gone', catalogState: 'missing' };
    const withoutModel = buildTechniqueMatrix([...currentRows, missing]);
    expect(withoutModel.lines).toHaveLength(matrix.lines.length);
    expect(withoutModel.columns.map((column) => column.id).sort()).toEqual([...new Set(catalogRows.map((row) => row.elementId))].sort());
  });
});
