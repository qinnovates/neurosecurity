// @vitest-environment jsdom
import { useReducer } from 'react';
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { model } from '../atlas-scene/__tests__/region-view-test-kit';
import TaraRegionPanel, { regionPanelState } from './TaraRegionPanel';
import { INITIAL_TARA_STATE, taraReducer } from './tara-state';
afterEach(cleanup);
function Panel() {
  const [state, dispatch] = useReducer(taraReducer, { ...INITIAL_TARA_STATE, selectedRegionId: model.regions[0].id });
  return <><button onClick={() => dispatch({ type: 'lens', lens: 'niss' })}>NISS lens</button><button onClick={() => dispatch({ type: 'lens', lens: 'evidence' })}>Evidence lens</button><TaraRegionPanel model={model} state={state} dispatch={dispatch} techniques={[]} /></>;
}
it('discloses Draft NISS only by click or lens, and evidence by lens', () => {
  const { container } = render(<Panel />);
  expect(regionPanelState(model, null)).toBeNull();
  expect(screen.getByRole('heading', { name: model.regions[0].name })).toBeTruthy();
  const niss = screen.getByRole('button', { name: /NISS score Draft/ });
  expect(niss.getAttribute('aria-expanded')).toBe('false');
  expect(container.textContent).not.toContain('Draft scores from');
  expect(screen.getByRole('button', { name: /BCI mapping AI-drafted, unreviewed/ })).toBeTruthy();
  fireEvent.click(niss);
  expect(niss.getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Evidence lens' }));
  expect(niss.getAttribute('aria-expanded')).toBe('false');
  expect(screen.getByRole('button', { name: 'Evidence' }).getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'NISS lens' }));
  expect(niss.getAttribute('aria-expanded')).toBe('true');
});
it('resets a manually disclosed score when a different region is chosen', () => {
  function RegionSelection() {
    const [state, dispatch] = useReducer(taraReducer, { ...INITIAL_TARA_STATE, selectedRegionId: model.regions[0].id });
    return <><button onClick={() => dispatch({ type: 'region', id: model.regions[1].id })}>Another region</button><TaraRegionPanel model={model} state={state} dispatch={dispatch} techniques={[]} /></>;
  }
  render(<RegionSelection />);
  fireEvent.click(screen.getByRole('button', { name: /NISS score/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Another region' }));
  expect(screen.getByRole('heading', { name: model.regions[1].name })).toBeTruthy();
  expect(screen.getByRole('button', { name: /NISS score/ }).getAttribute('aria-expanded')).toBe('false');
});
