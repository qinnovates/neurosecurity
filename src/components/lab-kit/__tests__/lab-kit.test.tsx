// @vitest-environment jsdom
import { createRef } from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { describeEvidence } from '@/lib/threat-model/evidence-levels';
import CoverageMeter from '../CoverageMeter';
import DataTable, { type DataTableColumn, type DataTableHandle, type DataTableSort } from '../DataTable';
import EvidenceMark from '../EvidenceMark';
import FilterChip from '../FilterChip';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

/** jsdom has no matchMedia; this makes the narrow-screen query match. */
function stubNarrowScreen(): void {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('max-width'), addEventListener: () => undefined, removeEventListener: () => undefined }));
}

interface Fruit {
  id: string;
  name: string;
  weight: number;
}

const FRUIT: readonly Fruit[] = [
  { id: 'b', name: 'Banana', weight: 120 },
  { id: 'a', name: 'Apple', weight: 180 },
  { id: 'c', name: 'Cherry', weight: 8 },
];
const COLUMNS: readonly DataTableColumn<Fruit>[] = [
  { id: 'name', header: 'Name', render: (fruit) => fruit.name, sortValue: (fruit) => fruit.name },
  { id: 'weight', header: 'Weight', render: (fruit) => fruit.weight, sortValue: (fruit) => fruit.weight },
  { id: 'note', header: 'Note', render: () => 'fixed' },
];

function renderTable(rows: readonly Fruit[] = FRUIT, onOpenRow?: (fruit: Fruit) => void) {
  return render(<DataTable caption="Fruit" columns={COLUMNS} rows={rows} rowKey={(fruit) => fruit.id} emptyMessage="No fruit matches." onOpenRow={onOpenRow} />);
}

function firstColumn(): string[] {
  return screen.getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell')[0].textContent ?? '');
}

describe('DataTable', () => {
  it('keeps the given order until a column is sorted, then sorts numbers numerically', () => {
    renderTable();
    expect(firstColumn()).toEqual(['Banana', 'Apple', 'Cherry']);
    fireEvent.click(screen.getByRole('button', { name: 'Weight' }));
    expect(firstColumn()).toEqual(['Cherry', 'Banana', 'Apple']);
    expect(screen.getByRole('columnheader', { name: /Weight/ }).getAttribute('aria-sort')).toBe('ascending');
    fireEvent.click(screen.getByRole('button', { name: /Weight/ }));
    expect(firstColumn()).toEqual(['Apple', 'Banana', 'Cherry']);
  });

  it('offers no sort control on a column without a sort value', () => {
    renderTable();
    expect(screen.queryByRole('button', { name: 'Note' })).toBeNull();
  });

  it('has one tab stop and moves focus between rows with the arrow keys', () => {
    renderTable();
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((row) => row.tabIndex)).toEqual([0, -1, -1]);
    rows[0].focus();
    fireEvent.keyDown(rows[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(rows[1]);
    fireEvent.keyDown(rows[1], { key: 'End' });
    expect(document.activeElement).toBe(rows[2]);
    fireEvent.keyDown(rows[2], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(rows[2]);
  });

  it('opens a row with Enter or a click when it can be opened', () => {
    const onOpenRow = vi.fn();
    renderTable(FRUIT, onOpenRow);
    const rows = screen.getAllByRole('row').slice(1);
    fireEvent.keyDown(rows[1], { key: 'Enter' });
    fireEvent.click(rows[2]);
    expect(onOpenRow.mock.calls.map(([fruit]) => (fruit as Fruit).id)).toEqual(['a', 'c']);
  });

  it('leaves clicks and keys inside a row\'s own controls alone', () => {
    const onOpenRow = vi.fn();
    const columns: readonly DataTableColumn<Fruit>[] = [...COLUMNS, { id: 'pick', header: 'Pick', render: (fruit) => <select aria-label={`Pick ${fruit.name}`}><option>yes</option></select> }];
    render(<DataTable caption="Fruit" columns={columns} rows={FRUIT} rowKey={(fruit) => fruit.id} emptyMessage="None." onOpenRow={onOpenRow} isRowQuiet={(fruit) => fruit.id === 'c'} />);
    const control = screen.getByRole('combobox', { name: 'Pick Banana' });
    fireEvent.click(control);
    fireEvent.keyDown(control, { key: 'Enter' });
    expect(onOpenRow).not.toHaveBeenCalled();
    expect(screen.getAllByRole('row').slice(1).map((row) => row.getAttribute('data-quiet'))).toEqual(['false', 'false', 'true']);
  });

  it('says why it is empty', () => {
    renderTable([]);
    expect(screen.getByRole('status').textContent).toBe('No fruit matches.');
  });

  it('follows a sort its parent keeps, and reports each sort the reader asks for', () => {
    const onSortChange = vi.fn();
    const sort: DataTableSort = { columnId: 'name', direction: 'ascending' };
    const table = (given: DataTableSort) => <DataTable caption="Fruit" columns={COLUMNS} rows={FRUIT} rowKey={(fruit) => fruit.id} emptyMessage="None." sort={given} onSortChange={onSortChange} />;
    const { rerender } = render(table(sort));
    expect(firstColumn()).toEqual(['Apple', 'Banana', 'Cherry']);
    fireEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(onSortChange).toHaveBeenCalledWith({ columnId: 'name', direction: 'descending' });
    // The parent has not accepted the change yet, so the order holds.
    expect(firstColumn()).toEqual(['Apple', 'Banana', 'Cherry']);
    rerender(table({ columnId: 'weight', direction: 'ascending' }));
    expect(firstColumn()).toEqual(['Cherry', 'Banana', 'Apple']);
    expect(screen.getByRole('columnheader', { name: /Weight/ }).getAttribute('aria-sort')).toBe('ascending');
  });

  it('lights the rows its parent names and reports the row under the pointer or focus', () => {
    const onRowPoint = vi.fn();
    render(<DataTable caption="Fruit" columns={COLUMNS} rows={FRUIT} rowKey={(fruit) => fruit.id} emptyMessage="None." isRowLit={(fruit) => fruit.id === 'a'} onRowPoint={onRowPoint} />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((row) => row.getAttribute('data-lit'))).toEqual(['false', 'true', 'false']);
    fireEvent.pointerEnter(rows[2]);
    fireEvent.pointerLeave(rows[2]);
    fireEvent.focus(rows[0]);
    expect(onRowPoint.mock.calls.map(([fruit]) => (fruit as Fruit | null)?.id ?? null)).toEqual(['c', null, 'b']);
  });

  it('moves focus to a row by key, and says when that row is not shown', () => {
    const handle = createRef<DataTableHandle>();
    render(<DataTable ref={handle} caption="Fruit" columns={COLUMNS} rows={FRUIT} rowKey={(fruit) => fruit.id} emptyMessage="None." />);
    expect(handle.current?.focusRow('c')).toBe(true);
    expect(document.activeElement).toBe(screen.getAllByRole('row')[3]);
    expect(handle.current?.focusRow('missing')).toBe(false);
  });

  it('marks the row the reader has open', () => {
    render(<DataTable caption="Fruit" columns={COLUMNS} rows={FRUIT} rowKey={(fruit) => fruit.id} emptyMessage="None." openedKey="a" />);
    expect(screen.getAllByRole('row').slice(1).map((row) => row.getAttribute('aria-current'))).toEqual([null, 'true', null]);
  });

  it('draws each row as a card under 720px when given a card, keeping keys, opening and sorting', () => {
    stubNarrowScreen();
    const onOpenRow = vi.fn();
    render(<DataTable caption="Fruit" columns={COLUMNS} rows={FRUIT} rowKey={(fruit) => fruit.id} emptyMessage="None." onOpenRow={onOpenRow} renderCard={(fruit) => <strong>{fruit.name}</strong>} />);
    expect(screen.queryByRole('table')).toBeNull();
    const cards = (): HTMLElement[] => within(screen.getByRole('list', { name: 'Fruit' })).getAllByRole('listitem');
    expect(cards().map((card) => card.textContent)).toEqual(['Banana', 'Apple', 'Cherry']);
    cards()[0].focus();
    fireEvent.keyDown(cards()[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(cards()[1]);
    fireEvent.keyDown(cards()[1], { key: 'Enter' });
    expect(onOpenRow.mock.calls.map(([fruit]) => (fruit as Fruit).id)).toEqual(['a']);
    fireEvent.click(within(screen.getByRole('group', { name: 'Sort by' })).getByRole('button', { name: 'Weight' }));
    expect(cards().map((card) => card.textContent)).toEqual(['Cherry', 'Banana', 'Apple']);
  });

  it('stays a table under 720px when no card is given', () => {
    stubNarrowScreen();
    renderTable();
    expect(screen.getByRole('table')).toBeTruthy();
  });
});

describe('FilterChip', () => {
  it('shows its count and reports a press', () => {
    const onToggle = vi.fn();
    render(<FilterChip label="Read" count={19} isPressed={false} onToggle={onToggle} />);
    const chip = screen.getByRole('button', { name: 'Read 19' });
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(chip);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('says "not assessed" in place of a zero that only means nothing was assessed', () => {
    render(<FilterChip label="Deny" count={0} isPressed={false} isNotAssessed onToggle={() => undefined} />);
    const chip = screen.getByRole('button', { name: 'Deny not assessed' });
    expect(chip.textContent).not.toContain('0');
  });
});

describe('CoverageMeter', () => {
  const coverage = { placedHere: 24, placedElsewhere: 3, notPlaced: 44, notAssessed: 103, total: 174 };

  it('names every share, including the unassessed one, for a device', () => {
    render(<CoverageMeter coverage={coverage} isForDevice />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(
      'Of 174 catalog techniques: 24 placed on this device, 3 placed only on other kinds of device, 44 not placed, each with a reason, 103 not assessed.',
    );
  });

  it('leaves out the other-devices share when describing the catalog alone', () => {
    render(<CoverageMeter coverage={{ ...coverage, placedHere: 27, placedElsewhere: 0 }} isForDevice={false} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Of 174 catalog techniques: 27 placed on a device, 44 not placed, each with a reason, 103 not assessed.');
  });
});

describe('EvidenceMark', () => {
  // Expected words are read from describeEvidence, which owns them: the tier names were
  // reworded there and a legacy status now takes the catalog's fallback tier.
  it('reads the tier first and shows the catalog\'s words for it', () => {
    const { container } = render(<EvidenceMark tier="demonstrated_case" status="THEORETICAL" />);
    expect(container.textContent).toBe(describeEvidence({ evidenceTier: 'demonstrated_case', evidenceStatus: 'THEORETICAL' }).label);
    expect(container.querySelector('.lab-evidence')?.getAttribute('data-level')).toBe('demonstrated');
    expect(container.querySelector('.lab-evidence')?.getAttribute('data-step')).toBe('demonstrated-case');
  });

  it('keeps a value neither scheme knows visible under its own word', () => {
    const { container } = render(<EvidenceMark tier={null} status="PLAUSIBLE" />);
    expect(container.textContent).toBe('Plausible');
    expect(container.querySelector('.lab-evidence')?.getAttribute('data-level')).toBe('other');
  });

  it('keeps an accessible name when the word is hidden', () => {
    const { container } = render(<EvidenceMark tier={null} status="CONFIRMED" isLabelHidden />);
    expect(screen.getByRole('img', { name: `Evidence: ${describeEvidence({ evidenceTier: null, evidenceStatus: 'CONFIRMED' }).label}` })).toBeTruthy();
    expect(container.textContent).toBe('');
  });
});
