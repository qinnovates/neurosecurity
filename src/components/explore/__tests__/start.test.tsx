// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { toHash } from '@/components/workbench/route';
import { MODEL_OVERVIEW_TARGET, TECHNIQUE_TARGET, VIEW_STATE_KEYS } from '@/components/workbench/shell-targets';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { useFocus } from '@/components/workbench/FocusContext';
import DeviceClasses from '../DeviceClasses';
import { compareClass, describeIdenticalSet, findIdenticalSets, listClassDifferences } from '../start/class-scopes';
import { createMemoryStore, engineData, inLab, referenceData } from './lab-harness';

/** The diagram team's drawing, stood in for by the name of the model it is given. */
vi.mock('@/components/threat-model/diagram/DeviceMiniDiagram', () => ({
  default: ({ model }: { model: DeviceModel }) => <div data-mini-diagram={model.name} />,
}));

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

const { archetypes } = referenceData;
const classes = archetypes.map((archetype) => compareClass(archetype, engineData, referenceData));

/** Records one decision on the device in focus, which makes it the reader's own. */
function DecideOnce() {
  const { dispatch, report } = useFocus();
  return <button type="button" onClick={() => dispatch({ type: 'risk-decided', riskId: report.riskRows[0].riskId, status: 'accepted', note: 'test' })}>Decide</button>;
}

describe('Start', () => {
  it('names what the tool produces and opens the example in Model, Overview', () => {
    window.location.hash = '#explore';
    inLab(<DeviceClasses />);
    expect(screen.getByText(/architecture views, a risk register with decisions, chain hypotheses, an FDA premarket checklist and a printable draft report\.$/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'See an example threat model' }));
    expect(window.location.hash).toBe(toHash(MODEL_OVERVIEW_TARGET));
  });

  it('shows one card per class, in file order, each with its drawing and computed facts', () => {
    inLab(<DeviceClasses />);
    const cards = screen.getAllByRole('article');
    expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual(archetypes.map((archetype) => archetype.label));
    cards.forEach((card, index) => {
      const { model, scope } = classes[index];
      expect(card.querySelector('[data-mini-diagram]')?.getAttribute('data-mini-diagram')).toBe(model.name);
      expect(within(card).getByText(new RegExp(`${model.components.length} parts? · ${model.links.length} connections?$`))).toBeTruthy();
      expect(card.querySelector('.explore-class-scope')?.textContent).toBe(`${scope.applies.length} of ${scope.total} catalog techniques apply ${scope.notAssessed.length} not assessed`);
      expect(card.querySelector('.explore-class-scope .lab-hatch-swatch')).not.toBeNull();
      const start = within(card).getByRole('button', { name: `Start from this class: ${archetypes[index].label}` });
      // The words on the button open its accessible name, and the class closes it, so no two cards offer a button of one name.
      expect(start.textContent).toBe('Start from this class');
    });
    expect(screen.getByRole('region', { name: 'Device classes' }).id).toBe('lab-results');
  });

  it('prints the classes-identical sentence once per group of equal computed sets, and not otherwise', () => {
    const { container } = inLab(<DeviceClasses />);
    const expected = findIdenticalSets(classes).map(describeIdenticalSet);
    expect([...container.querySelectorAll('.explore-identical')].map((line) => line.textContent)).toEqual(expected);
    const signatures = new Set(classes.map((device) => device.scope.applies.map((entry) => entry.techniqueId).sort().join('|')));
    expect(expected.length > 0).toBe(signatures.size < classes.length);
  });

  it('lists the techniques that differ between the classes, with where each stands on each class', () => {
    inLab(<DeviceClasses />);
    const differences = listClassDifferences(classes, engineData.techniques.map((technique) => technique.id));
    const table = within(screen.getByRole('region', { name: 'Differences between the classes' }));
    expect(table.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Technique', 'ID', ...archetypes.map((archetype) => archetype.label)]);
    expect(table.getAllByRole('row')).toHaveLength(differences.length + 1);
    const firstRow = table.getAllByRole('row')[1];
    expect([...firstRow.querySelectorAll('[data-term]')].map((cell) => cell.getAttribute('data-term'))).toEqual(differences[0].entries.map((entry) => entry.term));
    expect(firstRow.textContent).not.toContain('(condition)');
  });

  it('opens a differing technique in the catalog', () => {
    const store = createMemoryStore();
    inLab(<DeviceClasses />, store);
    const [difference] = listClassDifferences(classes, engineData.techniques.map((technique) => technique.id));
    fireEvent.click(screen.getByRole('button', { name: `Open technique ${difference.techniqueId}, ${difference.name}` }));
    expect(store.read(VIEW_STATE_KEYS.catalogOpenedTechniqueId)).toBe(difference.techniqueId);
    expect(window.location.hash).toBe(toHash(TECHNIQUE_TARGET));
  });

  it('starts from a class, then shows that class as the one to continue in Model and drops the example button', () => {
    window.location.hash = '#explore';
    inLab(<DeviceClasses />);
    const second = screen.getAllByRole('article')[1];
    fireEvent.click(within(second).getByRole('button', { name: /^Start from this class: / }));
    expect(window.location.hash).toBe(toHash(MODEL_OVERVIEW_TARGET));
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(archetypes.length);
    expect(cards[1].getAttribute('data-in-focus')).toBe('true');
    expect(within(cards[1]).getByRole('button', { name: /^Continue in Model: / })).toBeTruthy();
    expect(within(cards[0]).getByRole('button', { name: /^Start from this class: / })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'See an example threat model' })).toBeNull();
  });

  it('shows a device with recorded work first as "Your device", and asks before a class replaces it', () => {
    window.location.hash = '#explore';
    inLab(<><DecideOnce /><DeviceClasses /></>);
    fireEvent.click(screen.getByRole('button', { name: 'Decide' }));
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(archetypes.length + 1);
    expect(within(cards[0]).getByText('Your device')).toBeTruthy();
    expect(within(cards[0]).getByRole('button', { name: /^Continue in Model: / })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'See an example threat model' })).toBeNull();
    const table = within(screen.getByRole('region', { name: 'Differences between the classes' }));
    expect(table.getAllByRole('columnheader')).toHaveLength(archetypes.length + 3);
    fireEvent.click(within(cards[2]).getByRole('button', { name: /^Start from this class: / }));
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(window.location.hash).toBe('#explore');
  });
});
