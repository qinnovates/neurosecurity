// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { EVIDENCE_LABELS } from '@/components/atlas/chain-constants';
import { toHash } from '@/components/workbench/route';
import { TECHNIQUE_TARGET, VIEW_STATE_KEYS } from '@/components/workbench/shell-targets';
import CuratedChains from '../CuratedChains';
import { createMemoryStore, curatedChains, engineData, inLab } from './lab-harness';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

const techniqueIds = new Set(engineData.techniques.map((technique) => technique.id));

describe('Authored chains', () => {
  it('lists every authored chain and shows the steps of the first', () => {
    inLab(<CuratedChains />);
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
    expect(screen.getByText(new RegExp(`^${curatedChains.length} chains written by hand`))).toBeTruthy();
    const detail = screen.getByRole('region', { name: 'Steps of the selected chain' });
    expect(detail.id).toBe('lab-results');
    expect(within(detail).getByRole('heading', { name: curatedChains[0].chain_name })).toBeTruthy();
    expect(detail.querySelectorAll('.lab-steps > li')).toHaveLength(curatedChains[0].steps.length);
    expect(within(detail).getByText('Authored chain')).toBeTruthy();
  });

  it('keeps the chain file\'s own evidence words, not the catalog\'s tiers', () => {
    inLab(<CuratedChains />);
    const chain = curatedChains.find((candidate) => candidate.evidence !== undefined);
    expect(chain).toBeDefined();
    if (chain?.evidence === undefined) return;
    fireEvent.click(screen.getByRole('button', { name: new RegExp(chain.chain_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }));
    const detail = screen.getByRole('region', { name: 'Steps of the selected chain' });
    expect(within(detail).getAllByText(EVIDENCE_LABELS[chain.evidence.overall_label].label).length).toBeGreaterThan(0);
  });

  it('prints each step\'s evidence label and none of the chain file\'s free-text notes, rationale or extrapolation', () => {
    const { container } = inLab(<CuratedChains />);
    const withNotes = curatedChains.filter((candidate) => candidate.evidence !== undefined);
    expect(withNotes.length).toBeGreaterThan(0);
    for (const chain of withNotes) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(chain.chain_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }));
      const text = container.textContent ?? '';
      expect(text, chain.chain_id).not.toContain(chain.evidence?.rationale);
      if (chain.evidence?.extrapolation !== undefined) expect(text, chain.chain_id).not.toContain(chain.evidence.extrapolation);
      const steps = container.querySelectorAll('.lab-steps > li');
      chain.steps.forEach((step, index) => {
        if (step.evidence === undefined) return;
        expect(text, `${chain.chain_id} step ${step.position}`).not.toContain(step.evidence.note);
        expect(steps[index].textContent, `${chain.chain_id} step ${step.position}`).toContain(EVIDENCE_LABELS[step.evidence.label].label);
      });
      // The catalog's retired status words reached the screen only through those notes.
      expect(text, chain.chain_id).not.toMatch(/\b(CONFIRMED|EMERGING|THEORETICAL|DEMONSTRATED)\b/);
      expect(text, chain.chain_id).not.toMatch(/\bconfirmed\b/i);
    }
  });

  it('draws no old chain card and uses no old class names', () => {
    const { container } = inLab(<CuratedChains />);
    expect(container.querySelector('[class*="tm-"]')).toBeNull();
    expect(container.querySelector('svg:not(.lab-evidence-mark)')).toBeNull();
  });

  it('makes each step\'s technique a link that opens it in the catalog', () => {
    const store = createMemoryStore();
    inLab(<CuratedChains />, store);
    const step = curatedChains[0].steps.find((candidate) => techniqueIds.has(candidate.technique_id));
    expect(step).toBeDefined();
    if (step === undefined) return;
    fireEvent.click(screen.getAllByRole('button', { name: new RegExp(`^Open technique ${step.technique_id},`) })[0]);
    expect(store.read(VIEW_STATE_KEYS.catalogOpenedTechniqueId)).toBe(step.technique_id);
    expect(window.location.hash).toBe(toHash(TECHNIQUE_TARGET));
  });

  it('keeps the selected chain when the view is left and reopened', () => {
    const store = createMemoryStore();
    const first = inLab(<CuratedChains />, store);
    const second = curatedChains[1];
    fireEvent.click(screen.getAllByRole('button', { pressed: false }).find((button) => button.textContent?.startsWith(second.chain_name)) as HTMLElement);
    first.unmount();
    inLab(<CuratedChains />, store);
    expect(screen.getByRole('heading', { name: second.chain_name })).toBeTruthy();
  });
});
