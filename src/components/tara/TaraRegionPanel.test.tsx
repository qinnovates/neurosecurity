// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { model } from '../atlas-scene/__tests__/region-view-test-kit';
import TaraRegionPanel, { regionPanelState } from './TaraRegionPanel';

afterEach(cleanup);
describe('region panel', () => {
  it('reflects region selection and keeps draft NISS closed until clicked', () => {
    const region = model.regions[0];
    const view = render(<TaraRegionPanel model={model} regionId={null} />);
    expect(regionPanelState(model, null)).toBeNull();
    view.rerender(<TaraRegionPanel model={model} regionId={region.id} />);
    expect(screen.getByRole('heading', { name: region.name })).toBeTruthy();
    expect(regionPanelState(model, region.id)?.region.id).toBe(region.id);
    const niss = screen.getByRole('button', { name: /NISS score Draft/ });
    expect(niss.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: /TARA threats/ }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: /BCI mapping AI-drafted, unreviewed/ })).toBeTruthy();
    fireEvent.click(niss);
    expect(niss.getAttribute('aria-expanded')).toBe('true');
    view.rerender(<TaraRegionPanel model={model} regionId={region.id} evidenceRequest={1} />);
    expect(screen.getByRole('button', { name: /Evidence/ }).getAttribute('aria-expanded')).toBe('true');
  });
  it('resets score disclosure when selecting another region', () => {
    const view = render(<TaraRegionPanel model={model} regionId={model.regions[0].id} />);
    fireEvent.click(screen.getByRole('button', { name: /NISS score/ }));
    view.rerender(<TaraRegionPanel model={model} regionId={model.regions[1].id} />);
    expect(screen.getByRole('button', { name: /NISS score/ }).getAttribute('aria-expanded')).toBe('false');
  });
});
