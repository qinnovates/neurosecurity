import { describe, it, expect } from 'vitest';
import { buildIndexes, executeQuery, type TableData } from '../kql-engine';

const tables: TableData = {
  risks: [
    { risk_id: 'r1', technique_id: 'T1', part: 'implant' },
    { risk_id: 'r2', technique_id: 'T2', part: 'app' },
    { risk_id: 'r3', technique_id: 'T9', part: 'cloud' },
  ],
  techniques: [
    { id: 'T1', name: 'Signal injection', tactic: 'N.IJ' },
    { id: 'T2', name: 'Eavesdropping', tactic: 'D.HV' },
    { id: 'T3', name: 'Never used', tactic: 'B.IN' },
  ],
  placements: [
    { id: 'T1', decision: 'placed' },
    { id: 'T2', decision: 'placed' },
  ],
};
const indexes = buildIndexes(tables);
const run = (query: string) => executeQuery(query, tables, indexes);

describe('join', () => {
  it('joins on one field name shared by both tables', () => {
    const { rows, error } = run('placements | join techniques on id');
    expect(error).toBeNull();
    expect(rows).toEqual([
      { id: 'T1', decision: 'placed', name: 'Signal injection', tactic: 'N.IJ' },
      { id: 'T2', decision: 'placed', name: 'Eavesdropping', tactic: 'D.HV' },
    ]);
  });

  it('joins on differently named fields with left == right', () => {
    const { rows, error } = run('risks | join techniques on technique_id == id | project risk_id, name, tactic');
    expect(error).toBeNull();
    expect(rows).toEqual([
      { risk_id: 'r1', name: 'Signal injection', tactic: 'N.IJ' },
      { risk_id: 'r2', name: 'Eavesdropping', tactic: 'D.HV' },
    ]);
  });

  it('never pairs every row with every row', () => {
    const { rows } = run('risks | join techniques on technique_id == id');
    expect(rows.length).toBeLessThanOrEqual(tables.risks.length);
  });

  it('rejects a condition that is not a field or a pair of fields', () => {
    expect(run('risks | join techniques on technique_id = id').error).toMatch(/Invalid join condition/);
    expect(run('risks | join techniques on technique_id == id == name').error).toMatch(/Invalid join condition/);
    expect(run('risks | join techniques on lower(technique_id) == id').error).toMatch(/Invalid join condition/);
  });

  it('rejects a field that is not a column on its side', () => {
    expect(run('risks | join techniques on technique_id').error).toMatch(/"technique_id" is not a column of table "techniques"/);
    expect(run('risks | join techniques on nope == id').error).toMatch(/"nope" is not a column of the rows being joined/);
  });

  it('still reports an unknown join table', () => {
    expect(run('risks | join missing on id').error).toMatch(/Join table "missing" not found/);
  });
});
