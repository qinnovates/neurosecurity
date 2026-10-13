import { describe, expect, it } from 'vitest';
import { ANATOMY_TABLE_NAMES } from '@/lib/anatomy/table-names';
import { withoutAnatomyTables } from '../load-site-database';

describe('withoutAnatomyTables', () => {
  const siteTables = { techniques: [{ id: 'QIF-T0001' }], brain_regions: [{ id: 'pfc' }], ...Object.fromEntries(ANATOMY_TABLE_NAMES.map((name) => [name, [{ review_state: 'ai_drafted_unreviewed' }]])) };

  it('keeps every anatomy table out of the Lab\'s query database, which has nowhere to show their caveats', () => {
    expect(Object.keys(siteTables)).toHaveLength(ANATOMY_TABLE_NAMES.length + 2);
    expect(Object.keys(withoutAnatomyTables(siteTables))).toEqual(['techniques', 'brain_regions']);
  });

  it('leaves every other table and its rows as they were', () => {
    expect(withoutAnatomyTables(siteTables).techniques).toBe(siteTables.techniques);
    expect(withoutAnatomyTables({ anatomy_added_later: [] })).toEqual({});
  });
});
