import { describe, it, expect } from 'vitest';
import { buildIndexes, executeQuery, type TableData } from '../kql-engine';

const tables: TableData = {
  devices: [
    { device: 'A', company: 'One', type: 'invasive', channels: 1024 },
    { device: 'B', company: 'One', type: 'invasive', channels: 64 },
    { device: 'C', company: 'Two', type: 'invasive', channels: 16 },
    { device: 'D', company: 'Two', type: 'noninvasive', channels: 8, note: 'only this row has a note' },
  ],
};
const indexes = buildIndexes(tables);
const run = (query: string) => executeQuery(query, tables, indexes, { strictColumns: true });
const runByDefault = (query: string) => executeQuery(query, tables, indexes);

describe('project', () => {
  it('refuses a column the table does not have and names the nearest one', () => {
    const { rows, error } = run('devices | project devise, company');
    expect(rows).toEqual([]);
    expect(error).toMatch(/^Unknown column "devise" in project\. Did you mean "device"\?/);
    expect(error).toContain('Columns: device, company, type, channels, note');
  });

  it('still refuses it when the filter before it matched nothing', () => {
    expect(run('devices | where channels > 99999 | project name').error).toMatch(/^Unknown column "name" in project\./);
  });

  it('accepts a column only some rows carry', () => {
    const { rows, error } = run('devices | project device, note');
    expect(error).toBeNull();
    expect(rows).toHaveLength(4);
    expect(rows[3]).toEqual({ device: 'D', note: 'only this row has a note' });
  });

  it('returns the named columns for a correct query', () => {
    const { rows, error } = run('devices | where channels > 100 | project device, channels');
    expect(error).toBeNull();
    expect(rows).toEqual([{ device: 'A', channels: 1024 }]);
  });
});

describe('summarize', () => {
  it('counts by one column as before', () => {
    expect(run('devices | summarize count() by company').rows).toEqual([{ company: 'One', count: 2 }, { company: 'Two', count: 2 }]);
  });

  it('counts by two columns, one row per combination', () => {
    const { rows, error } = run('devices | summarize count() by company, type');
    expect(error).toBeNull();
    expect(rows).toEqual([
      { company: 'One', type: 'invasive', count: 2 },
      { company: 'Two', type: 'invasive', count: 1 },
      { company: 'Two', type: 'noninvasive', count: 1 },
    ]);
    expect(rows.reduce((sum, row) => sum + (row.count as number), 0)).toBe(tables.devices.length);
  });

  it('aggregates by two columns', () => {
    const { rows, error } = run('devices | summarize sum(channels) by company, type');
    expect(error).toBeNull();
    expect(rows[0]).toEqual({ company: 'One', type: 'invasive', sum: 1088, count: 2 });
  });

  it('refuses a group column the table does not have, where it used to return one blank group', () => {
    expect(run('devices | summarize count() by compny').error).toMatch(/^Unknown column "compny" in summarize\. Did you mean "company"\?/);
    expect(run('devices | summarize avg(chanels) by company').error).toMatch(/^Unknown column "chanels" in summarize\./);
  });

  it.each(['count() by', 'count(channels) by company', 'sum() by company', 'count() by company, company', 'count() by company type', 'median(channels) by company'])(
    'rejects the malformed clause "%s" with the expected form',
    (clause) => {
      expect(run(`devices | summarize ${clause}`).error).toMatch(/^Invalid summarize: .*Expected: count\(\) by field/);
    },
  );
});

describe('without the strict option', () => {
  it('leaves an unknown projected column out and reports no error, as before', () => {
    const { rows, error } = runByDefault('devices | project devise, company');
    expect(error).toBeNull();
    expect(rows).toHaveLength(tables.devices.length);
    expect(rows[0]).toEqual({ company: 'One' });
  });

  it('groups an unknown column into one blank group, as before', () => {
    const { rows, error } = runByDefault('devices | summarize count() by compny');
    expect(error).toBeNull();
    expect(rows).toEqual([{ compny: '', count: tables.devices.length }]);
  });
});
