// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { derivePayloadFlows } from '@/lib/threat-model/payload-flow';
import { countRowsByElement } from '@/lib/threat-model/register-counts';
import { PRESETS } from '@/lib/threat-model/__tests__/preset-reports';
import ArchitectureDiagram, { NARROW_SCREEN_QUERY } from '../../ArchitectureDiagram';
import { EIGHT_PART_MODEL } from './eight-part-model';
import { stubMatchMedia } from './match-media';

let restoreMatchMedia: (() => void) | null = null;
afterEach(() => {
  cleanup();
  restoreMatchMedia?.();
  restoreMatchMedia = null;
});

describe.each(PRESETS)('under 720px, the diagram of %s', (_presetId, { model, report }) => {
  const counts = countRowsByElement(model, report.riskRows);

  it('is a list in place of the drawing, with a row for every part and every connection', () => {
    restoreMatchMedia = stubMatchMedia([NARROW_SCREEN_QUERY]);
    const { container } = render(<ArchitectureDiagram model={model} title="Device" elementCounts={counts} onSelectElement={() => undefined} />);
    expect(container.querySelector('.lab-diagram-svg')).toBeNull();
    const rows = within(screen.getByRole('list', { name: 'Device' })).getAllByRole('button');
    expect(rows.map((row) => row.getAttribute('data-element-id'))).toEqual(counts.map((element) => element.id));
    const connectionRows = rows.filter((row) => row.getAttribute('data-kind') === 'connection');
    expect(connectionRows.map((row) => row.getAttribute('data-element-id')).sort()).toEqual(model.links.map((link) => link.id).sort());
  });

  it('gives every row its count, and says "not assessed" where nothing is placed', () => {
    restoreMatchMedia = stubMatchMedia([NARROW_SCREEN_QUERY]);
    const { container } = render(<ArchitectureDiagram model={model} title="Device" elementCounts={counts} />);
    for (const given of counts) {
      const badge = container.querySelector(`.lab-diagram-row[data-element-id="${given.id}"] [data-badge]`);
      expect(badge, given.id).not.toBeNull();
      if (given.catalogRows === 0) expect(badge?.textContent).toBe('not assessed');
      else expect(badge?.getAttribute('data-open')).toBe(String(given.openCatalogRows));
    }
  });

  it('tags each connection with what it carries and the part it travels to', () => {
    restoreMatchMedia = stubMatchMedia([NARROW_SCREEN_QUERY]);
    const { container } = render(<ArchitectureDiagram model={model} title="Device" />);
    const flows = derivePayloadFlows(model);
    for (const link of model.links) {
      const tags = [...container.querySelectorAll(`.lab-diagram-row[data-element-id="${link.id}"] .lab-diagram-row-payload`)];
      const expected = flows.get(link.id) ?? [];
      expect(tags.map((tag) => tag.getAttribute('data-payload'))).toEqual(expected.map((flow) => flow.payload));
      expected.forEach((flow, index) => {
        const destinationId = flow.isFromTo === null ? null : flow.isFromTo ? link.toComponentId : link.fromComponentId;
        const destination = model.components.find((component) => component.id === destinationId)?.label;
        if (destination !== undefined) expect(tags[index].textContent).toContain(destination);
      });
    }
  });
});

describe('the narrow list', () => {
  it('selects a row from the keyboard and marks the selected row and the tissue-contact part', () => {
    restoreMatchMedia = stubMatchMedia([NARROW_SCREEN_QUERY]);
    const onSelectElement = vi.fn();
    const { container } = render(<ArchitectureDiagram model={EIGHT_PART_MODEL} title="Device" onSelectElement={onSelectElement} selectedElementId="app" />);
    expect(container.querySelectorAll('.lab-diagram-row')).toHaveLength(EIGHT_PART_MODEL.components.length + EIGHT_PART_MODEL.links.length);
    expect([...container.querySelectorAll('[data-selected="true"]')].map((row) => row.getAttribute('data-element-id'))).toEqual(['app']);
    expect([...container.querySelectorAll('[data-tissue-contact="true"]')].map((row) => row.getAttribute('data-element-id'))).toEqual(['implant']);
    const row = container.querySelector('.lab-diagram-row[data-element-id="charger"]');
    if (row === null) throw new Error('test setup: no row');
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.click(row);
    expect(onSelectElement.mock.calls).toEqual([['charger'], ['charger']]);
  });
});
