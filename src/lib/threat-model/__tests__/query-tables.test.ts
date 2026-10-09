import { describe, it, expect } from 'vitest';
import { buildIndexes, executeQuery } from '../../kql-engine';
import { buildThreatModelReport } from '../build-report';
import { buildModelFromIntake, defaultAnswersFor } from '../intake-to-model';
import { describeEvidence } from '../evidence-levels';
import { SCOPE_TERM_LABELS } from '../lab-terms';
import { QUERY_TABLE_DESCRIPTIONS, buildQueryTables } from '../query-tables';
import { summariseScope } from '../scope-statement';
import { loadEngineBundle, loadReferenceData } from './load-test-data';

const bundle = loadEngineBundle();
const referenceData = loadReferenceData(bundle);
const archetype = referenceData.archetypes[2];
const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, bundle.engineData.registrarVersion);
const report = buildThreatModelReport({ model, engineData: bundle.engineData, referenceData, generatedAt: '2026-10-06T00:00:00Z' });
const tables = buildQueryTables(report, bundle.engineData, referenceData.placementRules);
const indexes = buildIndexes(tables);

function run(query: string) {
  const result = executeQuery(query, tables, indexes, { strictColumns: true });
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
    const label = describeEvidence(report.riskRows[0]).label;
    const rows = run(`my_risks | where source == "catalog" | where evidence == "${label}" | project threat, part, status`);
    expect(rows).toHaveLength(report.riskRows.filter((row) => row.source === 'catalog' && describeEvidence(row).label === label).length);
    expect(rows.length).toBeGreaterThan(0);
    expect(Object.keys(rows[0]).sort()).toEqual(['part', 'status', 'threat']);
  });

  it('counts the catalog by scope term, in the Lab\'s words, summing to the catalog', () => {
    const scope = summariseScope(model, bundle.engineData, referenceData);
    const rows = run('placements | summarize count() by scope');
    const expected: [string, number][] = [
      [SCOPE_TERM_LABELS.applies, scope.applies.length], [SCOPE_TERM_LABELS.would_apply_if, scope.wouldApplyIf.length],
      [SCOPE_TERM_LABELS.reviewed_outside, scope.reviewedOutside.length], [SCOPE_TERM_LABELS.not_assessed, scope.notAssessed.length],
    ];
    expect(new Map(rows.map((row) => [row.scope, row.count]))).toEqual(new Map(expected.filter(([, count]) => count !== 0)));
    expect(rows.reduce((sum, row) => sum + Number(row.count), 0)).toBe(bundle.engineData.techniques.length);
  });

  it('words every evidence column by tier, never by the legacy status', () => {
    const evidenceCells = [
      ...tables.my_risks.map((row) => row.evidence), ...tables.placements.map((row) => row.evidence),
      ...tables.my_chains.map((row) => row.weakest_evidence), ...tables.my_chain_steps.map((row) => row.evidence),
    ].filter((cell) => cell !== null);
    const tierLabels = new Set(bundle.engineData.techniques.map((technique) => describeEvidence(technique).label));
    expect(evidenceCells.length).toBeGreaterThan(0);
    for (const cell of evidenceCells) expect(tierLabels.has(String(cell)), String(cell)).toBe(true);
    for (const row of tables.my_risks) expect(row.evidence === null).toBe(row.source === 'stride');
  });

  it('holds one row per technique and band', () => {
    const expected = bundle.engineData.techniques.flatMap((technique) => technique.bandIds.map((bandId) => ({ technique_id: technique.id, band_id: bandId })));
    expect(tables.technique_bands).toEqual(expected);
    const inN3 = bundle.engineData.techniques.filter((technique) => technique.bandIds.includes('N3')).length;
    expect(run('technique_bands | where band_id == "N3" | count')).toEqual([{ count: inN3 }]);
  });

  it('keeps parts and connections in separate tables', () => {
    expect(tables.my_parts.map((row) => row.id)).toEqual(model.components.map((component) => component.id));
    expect(tables.my_links).toEqual(model.links.map((link) => expect.objectContaining({
      id: link.id, from: link.fromComponentId, to: link.toComponentId, medium: link.medium,
      carries_neural_data: link.carriesNeuralData, carries_stimulation_commands: link.carriesStimulationCommands, carries_software_updates: link.carriesSoftwareUpdates,
    })));
    const openCatalog = report.riskRows.filter((row) => row.source === 'catalog' && row.status === 'open').length;
    const counted = [...tables.my_parts, ...tables.my_links].reduce((sum, row) => sum + Number(row.open_risks), 0);
    expect(counted).toBe(openCatalog);
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
