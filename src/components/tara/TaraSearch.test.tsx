// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import TaraSearch from './TaraSearch';
import { buildSearchIndex } from './search-index';

beforeEach(() => {
  vi.useFakeTimers();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); };
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
it('opens by shortcut, debounces and selects a region with arrow keys and Enter', () => {
  const select = vi.fn();
  render(<TaraSearch index={buildSearchIndex([], [{ id: 'r1', name: 'Motor' }, { id: 'r2', name: 'Visual' }], [])} onSelectRegion={select} />);
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
  expect(screen.getByRole('dialog')).toBeTruthy();
  const input = screen.getByRole('combobox');
  fireEvent.keyDown(input, { key: 'ArrowUp' });
  expect(input.getAttribute('aria-activedescendant')).toBe('tara-hit-1');
  fireEvent.change(input, { target: { value: 'Motor' } });
  expect(screen.getAllByRole('option')).toHaveLength(2);
  act(() => vi.advanceTimersByTime(160));
  expect(screen.getAllByRole('option')).toHaveLength(1);
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(select).toHaveBeenCalledWith('r1');
  expect(screen.getByText('Search ⌘K')).toBe(document.activeElement);
});
