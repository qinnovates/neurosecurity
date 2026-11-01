// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { BrainHeroMountProps } from '../atlas-scene/BrainHeroMount';
import { model } from '../atlas-scene/__tests__/region-view-test-kit';
import TaraExplorer from './TaraExplorer';

vi.mock('../atlas-scene/BrainHeroMount', () => ({
  default: (props: BrainHeroMountProps) => <>
    <span data-testid="brain-lens">{props.lens?.kind}</span>
    <button onClick={() => props.onSelectRegion?.(model.regions[0].id)}>Pick brain region</button>
    {props.renderRegionPanel?.(model, props.selectedRegionId ?? null)}
  </>,
}));
afterEach(cleanup);
it('passes a brain pick into the selected region panel', () => {
  render(<TaraExplorer index={[]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Pick brain region' }));
  expect(screen.getByRole('heading', { name: model.regions[0].name })).toBeTruthy();
  expect(screen.getByRole('button', { name: /NISS score/ }).getAttribute('aria-expanded')).toBe('false');
});
it('interweaves lens and perspective controls with the same panel', () => {
  render(<TaraExplorer index={[]} />);
  fireEvent.click(screen.getByRole('button', { name: 'NISS' }));
  expect(screen.getByTestId('brain-lens').textContent).toBe('niss');
  expect(screen.getByRole('button', { name: /NISS score/ }).getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(screen.getAllByRole('button', { name: 'Evidence' })[0]);
  expect(screen.getByTestId('brain-lens').textContent).toBe('evidence');
  expect(screen.getByRole('button', { name: 'Evidence', expanded: true })).toBeTruthy();
  fireEvent.click(screen.getByRole('radio', { name: /Clinical/ }));
  expect(screen.getByRole('radio', { name: /Clinical/ }).getAttribute('aria-checked')).toBe('true');
  expect(screen.getAllByText(/No mapped techniques for this region under the clinical perspective/)).toHaveLength(2);
});
