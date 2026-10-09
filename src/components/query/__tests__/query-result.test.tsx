// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SITE_TABLE_DESCRIPTIONS } from '@/lib/threat-model/lab-table-policy';
import QueryResultView from '../QueryResultView';
import SchemaBrowser from '../SchemaBrowser';

afterEach(cleanup);

const noTechniques: ReadonlySet<string> = new Set();
const show = (rows: Record<string, unknown>[], error: string | null = null) =>
  render(<QueryResultView result={{ rows, tableName: 'my_risks', error }} tableNames={['my_risks']} techniqueIds={noTechniques} onOpenTechnique={() => undefined} />);

describe('the live region of a result', () => {
  it('is the row-count line alone, not the table', () => {
    const { container } = show([{ threat: 'A', severity: 'critical' }, { threat: 'B', severity: 'low' }]);
    const live = container.querySelectorAll('[role="status"], [aria-live]');
    expect(live).toHaveLength(1);
    expect(live[0].textContent).toBe('2 rows');
    expect(live[0].querySelector('table')).toBeNull();
    expect(container.querySelector('table')?.closest('[role="status"], [aria-live]')).toBeNull();
  });

  it('says how many rows are shown when the result is longer than the table', () => {
    show(Array.from({ length: 250 }, (_unused, index) => ({ n: index })));
    expect(screen.getByRole('status').textContent).toBe('250 rows, first 200 shown');
  });

  it('is empty beside an error, which is announced as an alert', () => {
    const { container } = show([], 'Unknown column "bogus" in sort by.');
    expect(container.querySelector('.query-count')?.textContent).toBe('');
    expect(screen.getByRole('alert').textContent).toContain('Unknown column "bogus" in sort by.');
  });
});

describe('a severity column', () => {
  it('draws a catalog severity with the kit\'s mark, whatever its letter case, and prints any other value as it is', () => {
    const { container } = show([{ threat: 'A', severity: 'critical' }, { threat: 'B', severity: 'High' }, { threat: 'C', severity: 'unrated' }, { threat: 'D', severity: null }]);
    const marks = [...container.querySelectorAll('.lab-severity')];
    expect(marks.map((mark) => mark.getAttribute('data-severity'))).toEqual(['critical', 'high']);
    expect(marks.map((mark) => mark.textContent)).toEqual(['Critical', 'High']);
    expect(container.querySelectorAll('tbody tr')[2].textContent).toContain('unrated');
  });

  it('leaves the word "critical" in another column alone', () => {
    const { container } = show([{ note: 'critical', count: 1 }]);
    expect(container.querySelector('.lab-severity')).toBeNull();
  });
});

describe('the table list', () => {
  it('says, for the open table, what one row of it is', () => {
    render(<SchemaBrowser tables={{ attack_chains: [{ chain_id: 'C1', position: 1 }, { chain_id: 'C1', position: 2 }] }} isSiteLoaded siteError={null} openTable="attack_chains" onOpenTable={() => undefined} />);
    expect(screen.getByText(SITE_TABLE_DESCRIPTIONS.attack_chains)).toBeTruthy();
    expect(SITE_TABLE_DESCRIPTIONS.attack_chains).toBe('One row per step of an authored chain.');
  });
});
