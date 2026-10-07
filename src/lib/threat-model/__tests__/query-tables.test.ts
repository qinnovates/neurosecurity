import { describe, it, expect } from 'vitest';
import { buildIndexes, executeQuery } from '../../kql-engine';
import { buildThreatModelReport } from '../build-report';
import { buildModelFromIntake, defaultAnswersFor } from '../intake-to-model';
import { QUERY_TABLE_DESCRIPTIONS, buildQueryTables } from '../query-tables';
import { loadEngineBundle, loadReferenceData } from './load-test-data';

const bundle = loadEngineBundle();
const referenceData = loadReferenceData(bundle);
const archetype = referenceData.archetypes[2];
const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, bundle.engineData.registrarVersion);
const report = buildThreatModelReport({ model, engineData: bundle.engineData, referenceData, generatedAt: '2026-10-06T00:00:00Z' });
const tables = buildQueryTables(report, bundle.engineData, referenceData.placementRules);
const indexes = buildIndexes(tables);

function run(query: string) {
  const result = executeQuery(query, tables, indexes);
  expect(result.error, query).toBeNull();
  return result.rows;
}

describe('query tables', () => {
  it('describes every table it builds', () => {
    expect(Object.keys(tables).sort()).toEqual(Object.keys(QUERY_TABLE_DESCRIPTIONS).sort());
  });

  it('holds one risk row per register row and one technique row per catalog entry', () => {
    expect(tables.my_risks).toHaveLength(report.riskRows.length);
    expect(tables.placements).toHaveLength(bundle.engineData.techniques.length);
  });

  it('answers a filter over the risks of the device in focus', () => {
    const rows = run('my_risks | where source == "catalog" | where evidence == "CONFIRMED" | project threat, part, status');
    expect(rows.length).toBeGreaterThan(0);
    expect(Object.keys(rows[0]).sort()).toEqual(['part', 'status', 'threat']);
  });

  it('counts placement decisions across the catalog', () => {
    const rows = run('placements | summarize count() by decision');
    expect(rows.map((row) => row.decision).sort()).toEqual(['not_placed', 'not_reviewed', 'placed']);
  });

  it('keeps device tables apart from site database tables of the same subject', () => {
    const siteTables = { techniques: [{ id: 'QIF-T0001', name: 'From the site database' }], cves: [] };
    const merged = { ...siteTables, ...tables };
    expect(merged.techniques).toBe(siteTables.techniques);
    expect(Object.keys(tables).some((name) => name in siteTables)).toBe(false);
  });

  it('finds open critical risks on shared components without a join', () => {
    const rows = run('my_risks | where addressed == false | where shared_across_patients == true | project threat, part');
    const sharedLabels = new Set(model.components.filter((component) => component.isSharedAcrossPatients).map((component) => component.label));
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(sharedLabels.has(String(row.part))).toBe(true);
  });

  it('joins device risks to a catalog table on differently named keys, one row per risk', () => {
    const catalog = { techniques: bundle.engineData.techniques.map((technique) => ({ id: technique.id, tactic: technique.tactic })) };
    const merged = { ...catalog, ...tables };
    const catalogRisks = tables.my_risks.filter((row) => row.source === 'catalog');
    const result = executeQuery('my_risks | where source == "catalog" | join techniques on technique_id == id', merged, buildIndexes(merged));
    expect(result.error).toBeNull();
    expect(result.rows).toHaveLength(catalogRisks.length);
    expect(result.rows.every((row) => typeof row.tactic === 'string')).toBe(true);
  });

  it('refuses the join that used to pair every risk with every technique', () => {
    const catalog = { techniques: bundle.engineData.techniques.map((technique) => ({ id: technique.id })) };
    const merged = { ...catalog, ...tables };
    const result = executeQuery('my_risks | join techniques on technique_id', merged, buildIndexes(merged));
    expect(result.error).toMatch(/is not a column of table "techniques"/);
  });

  it('returns an error message for an unknown table without throwing', () => {
    expect(executeQuery('no_such_table | take 5', tables, indexes).error).toBeTruthy();
  });
});
