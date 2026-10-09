// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { CATALOG_SEVERITIES } from '@/lib/threat-model/catalog-types';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { derivePayloadFlows } from '@/lib/threat-model/payload-flow';
import { PAYLOAD_LABELS } from '@/lib/threat-model/match-techniques';
import { countRowsByElement } from '@/lib/threat-model/register-counts';
import { PRESETS } from '@/lib/threat-model/__tests__/preset-reports';
import ArchitectureDiagram from '../../ArchitectureDiagram';
import { computeDiagramLayout } from '../../diagram-layout';
import { OPPOSITE_HEADING } from '../diagram-geometry';
import { BADGE_BAR_WIDTH } from '../SeverityBadge';
import { EIGHT_PART_MODEL } from './eight-part-model';

afterEach(cleanup);

function elementGroup(container: HTMLElement, elementId: string): HTMLElement {
  const group = container.querySelector<HTMLElement>(`:is(.lab-diagram-part, .lab-diagram-link)[data-element-id="${elementId}"]`);
  if (group === null) throw new Error(`test setup: nothing drawn for ${elementId}`);
  return group;
}

const numberOf = (element: Element, attribute: string): number => Number(element.getAttribute(attribute));

describe.each(PRESETS)('the diagram of %s', (_presetId, { model, report }) => {
  const counts = countRowsByElement(model, report.riskRows);

  it('puts a badge on every part and every connection that sums to the counts it was given', () => {
    const { container } = render(<ArchitectureDiagram model={model} title="Device" elementCounts={counts} onSelectElement={() => undefined} />);
    expect(counts).toHaveLength(model.components.length + model.links.length);
    expect(container.querySelectorAll('.lab-diagram-svg [data-badge]')).toHaveLength(counts.length);
    for (const given of counts) {
      const badge = elementGroup(container, given.id).querySelector('[data-badge]');
      expect(badge, given.id).not.toBeNull();
      if (badge === null) continue;
      if (given.catalogRows === 0) {
        expect(badge.getAttribute('data-badge')).toBe('not-assessed');
        expect(badge.textContent).toBe('not assessed');
        continue;
      }
      expect(numberOf(badge, 'data-open'), given.id).toBe(given.openCatalogRows);
      expect(CATALOG_SEVERITIES.reduce((sum, severity) => sum + numberOf(badge, `data-${severity}`), 0), given.id).toBe(given.openCatalogRows);
      for (const severity of CATALOG_SEVERITIES) expect(numberOf(badge, `data-${severity}`)).toBe(given.openBySeverity[severity]);
      const shares = [...badge.querySelectorAll('.lab-diagram-badge-share')];
      expect(shares.reduce((sum, share) => sum + numberOf(share, 'data-count'), 0), given.id).toBe(given.openCatalogRows);
      const lastShare = shares[shares.length - 1];
      if (lastShare !== undefined) expect(numberOf(lastShare, 'x') + numberOf(lastShare, 'width') - numberOf(shares[0], 'x')).toBe(BADGE_BAR_WIDTH);
      expect(badge.querySelector('.lab-diagram-badge-count')?.textContent).toBe(given.openCatalogRows === 0 ? '0 open' : String(given.openCatalogRows));
    }
  });

  it('carries the selection on no element when it loads, and marks the tissue-contact part without it', () => {
    const { container } = render(<ArchitectureDiagram model={model} title="Device" elementCounts={counts} onSelectElement={() => undefined} />);
    expect(container.querySelectorAll('[data-selected="true"]')).toHaveLength(0);
    expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(0);
    const tissueParts = container.querySelectorAll('.lab-diagram-part[data-tissue-contact="true"]');
    expect(tissueParts).toHaveLength(1);
    const interfacePart = model.components.find((component) => component.isNeuralInterface);
    expect(tissueParts[0].getAttribute('data-element-id')).toBe(interfacePart?.id);
    expect(tissueParts[0].querySelectorAll('rect.lab-diagram-box, rect.lab-diagram-box-inner')).toHaveLength(2);
    expect(tissueParts[0].querySelector('.lab-diagram-tag')?.textContent).toBe('tissue contact');
  });

  it('reaches every part and every connection from the keyboard', () => {
    const onSelectElement = vi.fn();
    render(<ArchitectureDiagram model={model} title="Device" elementCounts={counts} onSelectElement={onSelectElement} />);
    const buttons = within(screen.getByRole('group', { name: 'Device' })).getAllByRole('button');
    const elementIds = [...model.components.map((component) => component.id), ...model.links.map((link) => link.id)];
    expect(buttons.map((button) => button.getAttribute('data-element-id')).sort()).toEqual([...elementIds].sort());
    for (const button of buttons) {
      expect(button.getAttribute('tabindex')).toBe('0');
      expect(button.getAttribute('aria-label')).not.toBe('');
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: ' ' });
    }
    expect(onSelectElement.mock.calls.map(([elementId]) => elementId as string).sort()).toEqual([...elementIds, ...elementIds].sort());
  });

  it('gives each payload a text tag, with an arrow turned the way derivePayloadFlows says', () => {
    const { container } = render(<ArchitectureDiagram model={model} title="Device" />);
    const flows = derivePayloadFlows(model);
    const layout = computeDiagramLayout(model);
    for (const link of model.links) {
      const tags = [...elementGroup(container, link.id).querySelectorAll('.lab-diagram-payload')];
      const expected = flows.get(link.id) ?? [];
      expect(tags.map((tag) => tag.getAttribute('data-payload'))).toEqual(expected.map((flow) => flow.payload));
      const lineHeading = layout.edges.find((edge) => edge.id === link.id)?.heading ?? 'right';
      expected.forEach((flow, index) => {
        expect(tags[index].querySelector('text')?.textContent).toBe(PAYLOAD_LABELS[flow.payload]);
        const heading = flow.isFromTo === null ? 'none' : flow.isFromTo ? lineHeading : OPPOSITE_HEADING[lineHeading];
        expect(tags[index].getAttribute('data-heading')).toBe(heading);
        expect(tags[index].querySelectorAll('.lab-diagram-arrow')).toHaveLength(flow.isFromTo === null ? 0 : 1);
      });
    }
  });

  it('is drawn at one CSS pixel per unit, so its type does not scale with the device', () => {
    const { container } = render(<ArchitectureDiagram model={model} title="Device" elementCounts={counts} />);
    const svg = container.querySelector('.lab-diagram-svg');
    const layout = computeDiagramLayout(model);
    expect(svg?.getAttribute('viewBox')).toBe(`0 0 ${layout.width} ${layout.height}`);
    expect(svg?.getAttribute('width')).toBe(String(layout.width));
    expect(svg?.getAttribute('height')).toBe(String(layout.height));
    expect(svg?.parentElement?.className).toBe('lab-diagram-scroll');
  });

  it('says in its legend what a badge counts and that direction is derived', () => {
    render(<ArchitectureDiagram model={model} title="Device" elementCounts={counts} />);
    const legend = screen.getByRole('list', { name: 'Diagram legend' });
    expect(legend.textContent).toContain('counts the open catalog rows on that part or connection');
    expect(legend.textContent).toContain('direction derived');
    expect(legend.textContent).toContain('Tissue contact');
  });
});

describe('labels', () => {
  it('wraps a long part name to two lines and keeps the whole name for the tooltip and the accessible name', () => {
    const { container } = render(<ArchitectureDiagram model={EIGHT_PART_MODEL} title="Device" onSelectElement={() => undefined} />);
    const implant = elementGroup(container, 'implant');
    const lines = [...implant.querySelectorAll('.lab-diagram-part-label tspan')].map((line) => line.textContent);
    expect(lines).toHaveLength(2);
    expect(lines[1]?.endsWith('…')).toBe(true);
    expect(implant.querySelector('title')?.textContent).toBe(EIGHT_PART_MODEL.components[0].label);
    expect(implant.getAttribute('aria-label')).toContain(EIGHT_PART_MODEL.components[0].label);
  });

  it('draws eight parts without leaving one out', () => {
    const { container } = render(<ArchitectureDiagram model={EIGHT_PART_MODEL} title="Device" />);
    expect(container.querySelectorAll('.lab-diagram-part')).toHaveLength(EIGHT_PART_MODEL.components.length);
    expect(container.querySelectorAll('.lab-diagram-link')).toHaveLength(EIGHT_PART_MODEL.links.length);
  });

  it('falls back to a total with no split when only the older counts are given, and draws no badge without counts', () => {
    const { container, rerender } = render(<ArchitectureDiagram model={EIGHT_PART_MODEL} title="Device" openRiskCounts={new Map([['implant', 4], ['app', 0]])} />);
    const badges = container.querySelectorAll('.lab-diagram-svg [data-badge]');
    expect(badges).toHaveLength(1);
    expect(badges[0].getAttribute('data-badge')).toBe('total');
    expect(badges[0].textContent).toBe('4 open');
    rerender(<ArchitectureDiagram model={EIGHT_PART_MODEL} title="Device" />);
    expect(container.querySelectorAll('[data-badge]')).toHaveLength(0);
  });

  it('says a device has no parts instead of drawing an empty picture', () => {
    const empty: DeviceModel = { ...EIGHT_PART_MODEL, components: [], links: [] };
    render(<ArchitectureDiagram model={empty} title="Device" />);
    expect(screen.getByRole('status').textContent).toContain('This device has no parts');
  });
});
