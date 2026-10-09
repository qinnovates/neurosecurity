// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import { modelFor, engineData, referenceData } from '@/lib/threat-model/__tests__/preset-reports';
import ComplianceChecklist, { countByApplicability } from '../../ComplianceChecklist';

afterEach(cleanup);

const report = buildThreatModelReport({ model: { ...modelFor('subcortical-stimulator'), submissionType: '510k' }, engineData, referenceData, generatedAt: '' });
const { cyberDeviceAssessment: assessment, complianceItems: items } = report;

describe('the checklist as its own screen', () => {
  it('lists every requirement by title with its status, under a count of each status that sums to the list', () => {
    render(<ComplianceChecklist assessment={assessment} items={items} />);
    const nav = screen.getByRole('navigation', { name: 'Requirements' });
    const picks = within(nav).getAllByRole('button');
    expect(picks.map((pick) => pick.querySelector('span')?.textContent ?? pick.textContent)).toEqual(['Is this a cyber device?', ...items.map((item) => item.title)]);
    const counts = countByApplicability(items);
    expect(counts.reduce((sum, entry) => sum + entry.count, 0)).toBe(items.length);
    expect(counts.length).toBeGreaterThan(1);
    expect([...nav.querySelectorAll('.checklist-counts li')].map((entry) => entry.textContent)).toEqual(counts.map((entry) => `${entry.count} ${entry.label}`));
    for (const entry of counts) expect(entry.count).toBe(items.filter((item) => item.applicability === entry.applicability).length);
  });

  it('marks one requirement as the one being read, and moves the mark when another is chosen', () => {
    const { container } = render(<ComplianceChecklist assessment={assessment} items={items} />);
    const selected = (): string[] => [...container.querySelectorAll('.report-item[data-selected="true"]')].map((item) => item.id);
    expect(selected()).toEqual(['checklist-cyber-device']);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${items[2].title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }));
    expect(selected()).toEqual([`checklist-${items[2].requirementId}`]);
    expect(within(screen.getByRole('navigation', { name: 'Requirements' })).getAllByRole('button').filter((pick) => pick.getAttribute('aria-current') === 'true')).toHaveLength(1);
    // Every requirement stays in the document, so paper and a narrow screen carry them all.
    expect(container.querySelectorAll('.report-item')).toHaveLength(items.length + 1);
  });

  it('gives every "Open the source" link a name of its own', () => {
    render(<ComplianceChecklist assessment={assessment} items={items} />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(items.length);
    for (const link of links) expect(link.textContent).toBe('Open the source');
    expect(new Set(links.map((link) => link.getAttribute('aria-label'))).size).toBe(links.length);
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual(items.map((item) => `Open the source: ${item.title}`));
  });

  it('never says a device is compliant, in any status word', () => {
    const { container } = render(<ComplianceChecklist assessment={assessment} items={items} />);
    expect(container.textContent).not.toMatch(/\bcompliant\b/i);
  });
});

describe('the checklist inside the report', () => {
  it('prints every requirement in order with no list beside it', () => {
    const { container } = render(<ComplianceChecklist assessment={assessment} items={items} isTitleShown={false} />);
    expect(screen.queryByRole('navigation')).toBeNull();
    expect([...container.querySelectorAll('.report-item h3')].map((heading) => heading.textContent)).toEqual(['Is this a cyber device?', ...items.map((item) => item.title)]);
    expect(container.querySelector('.checklist-detail')).toBeNull();
  });
});
