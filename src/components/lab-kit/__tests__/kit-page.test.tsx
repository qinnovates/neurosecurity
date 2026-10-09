// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { loadThreatModelData } from '@/components/threat-model/load-engine-data';
import { countByEvidence } from '@/lib/threat-model/evidence-levels';
import LabKit from '../LabKit';
import { EVIDENCE_STEPS, countByEvidenceStep } from '../evidence-steps';

afterEach(cleanup);

const DATA = loadThreatModelData();
const TECHNIQUE_COUNT = DATA.engineData.techniques.length;

function column(name: 'Light theme' | 'Dark theme'): HTMLElement {
  return screen.getByRole('region', { name });
}

describe('the kit page', () => {
  it('shows every piece once in each theme', () => {
    render(<LabKit {...DATA} />);
    for (const name of ['Light theme', 'Dark theme'] as const) {
      const theme = column(name);
      expect(theme.getAttribute('data-lab-theme')).toBe(name === 'Light theme' ? 'light' : 'dark');
      for (const title of ['Colour', 'Evidence mark', 'Severity', 'Split bar', 'Stat tiles and filter chips', 'Not assessed and empty', 'Facets, table and inspector']) {
        expect(within(theme).getByRole('region', { name: title }), `${name}: ${title}`).toBeTruthy();
      }
      expect(within(theme).getByRole('list', { name: 'Evidence marks' }).querySelectorAll('li')).toHaveLength(EVIDENCE_STEPS.length);
    }
  });

  it('prints figures counted from the catalog, and they add up', () => {
    render(<LabKit {...DATA} />);
    const legend = within(column('Light theme')).getByRole('list', { name: 'Evidence marks' });
    const printed = Array.from(legend.querySelectorAll('.lab-figure')).map((figure) => Number(figure.textContent));
    expect(printed).toEqual(Object.values(countByEvidenceStep(countByEvidence(DATA.engineData.techniques))));
    expect(printed.reduce((sum, count) => sum + count, 0)).toBe(TECHNIQUE_COUNT);
    expect(within(column('Light theme')).getByRole('table', { name: /techniques/ }).querySelector('caption')?.textContent).toContain(`${TECHNIQUE_COUNT} of ${TECHNIQUE_COUNT} techniques`);
  });

  it('opens a technique in the inspector from its ID and returns focus on Escape', () => {
    render(<LabKit {...DATA} />);
    const [first] = DATA.engineData.techniques;
    const link = within(column('Dark theme')).getAllByRole('button', { name: `Open technique ${first.id}, ${first.name}` })[0];
    link.focus();
    fireEvent.click(link);
    const drawer = within(column('Dark theme')).getByRole('dialog', { name: first.name });
    expect(within(column('Light theme')).queryByRole('dialog')).toBeNull();
    fireEvent.keyDown(drawer, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(link);
  });

  it('keeps the standing words about the catalog and the placement table', () => {
    render(<LabKit {...DATA} />);
    expect(screen.getByText(/TARA is a proposed catalog and is not peer reviewed\. The placement table was drafted with an AI assistant and has not yet been reviewed\./)).toBeTruthy();
  });
});
