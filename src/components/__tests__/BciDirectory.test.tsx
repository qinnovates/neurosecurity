// @vitest-environment jsdom
/**
 * Regression test for the BCI Directory rendering no companies in production.
 *
 * The page feeds BciDirectory with the exact output of the build-time adapter
 * in src/lib/bci-directory-data.ts. If the adapter's field names drift from
 * the props the component reads, the component throws while rendering the
 * stats banner and the entire island disappears — the symptom this guards.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import BciDirectory from '../bci/BciDirectory';
import {
  getBciDirectoryDevices,
  getBciDirectoryCompanies,
  getBciDirectoryStats,
} from '../../lib/bci-directory-data';

afterEach(cleanup);

function renderWithRealAdapterData() {
  return render(
    <BciDirectory
      devices={getBciDirectoryDevices()}
      companies={getBciDirectoryCompanies()}
      stats={getBciDirectoryStats()}
    />
  );
}

describe('BciDirectory wired to the real build-time adapter', () => {
  it('exposes a non-empty dataset from the adapter', () => {
    expect(getBciDirectoryCompanies().length).toBeGreaterThan(0);
    expect(getBciDirectoryDevices().length).toBeGreaterThan(0);
  });

  it('renders the stats banner totals without throwing', () => {
    renderWithRealAdapterData();
    const stats = getBciDirectoryStats();
    expect(screen.getByText(String(stats.totalCompanies))).toBeTruthy();
    expect(screen.getByText(String(stats.byType.invasive))).toBeTruthy();
  });

  it('renders device cards with real device and company names', () => {
    renderWithRealAdapterData();
    expect(screen.getByText('N1 Chip')).toBeTruthy();
    expect(screen.getAllByText('Neuralink').length).toBeGreaterThan(0);
    expect(screen.queryByText(/No devices match the current filters/)).toBeNull();
  });

  it('renders company cards with real company names', () => {
    renderWithRealAdapterData();
    fireEvent.click(screen.getByText(/^Companies \(/));
    expect(screen.getAllByText('Neuralink').length).toBeGreaterThan(0);
    expect(screen.queryByText(/No companies match the current filters/)).toBeNull();
  });
});
