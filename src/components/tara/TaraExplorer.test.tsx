// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { BrainHeroMountProps } from '../atlas-scene/BrainHeroMount';
import { model } from '../atlas-scene/__tests__/region-view-test-kit';
import TaraExplorer from './TaraExplorer';

vi.mock('../atlas-scene/BrainHeroMount', () => ({
  default: (props: BrainHeroMountProps) => <>
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
