// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { CATALOG_SEVERITIES } from '@/lib/threat-model/catalog-types';
import { CATALOG_SEVERITY_LABELS, EFFECT_LABELS, ENTRY_PATH_LABELS } from '@/lib/threat-model/lab-terms';
import { EMPTY_LENS, countOpenRisks, type Lens } from '@/lib/threat-model/lens';
import { listElementsInModelOrder } from '@/lib/threat-model/model-order';
import { summariseCoverageBySeverity } from '@/lib/threat-model/placement-coverage';
import { PLACED_ENTRY_PATHS } from '@/lib/threat-model/reference-data-types';
import { THREAT_GOALS, type RiskRow } from '@/lib/threat-model/report-types';
import { summariseScope } from '@/lib/threat-model/scope-statement';
import { PRESETS, engineData, referenceData, type Preset } from '@/lib/threat-model/__tests__/preset-reports';
import { countFacets, findCoverageGaps } from '../facet-counts';
import GoalChip from '../GoalChip';
import ModelFacets from '../ModelFacets';

afterEach(cleanup);

function setUp({ model, report }: Preset, lens: Lens, rows: readonly RiskRow[] = report.riskRows) {
  const context = { model, techniques: engineData.techniques };
  const counts = countFacets(rows, lens, context);
  const gaps = findCoverageGaps(report.goalCoverage, summariseCoverageBySeverity(engineData.techniques, summariseScope(model, engineData, referenceData)));
  const handlers = { onLensChange: vi.fn(), onOpenOnlyChange: vi.fn() };
  const view = render(
    <ModelFacets lens={lens} isOpenOnly={false} counts={counts} gaps={gaps} elements={listElementsInModelOrder(model)} techniqueName={null} {...handlers} />,
  );
  return { counts, gaps, handlers, view, lensCounts: countOpenRisks(rows, lens, context) };
}

/** Every lens a reader can reach from one control, for one device. */
function listLenses({ model }: Preset): Lens[] {
  return [
    EMPTY_LENS,
    ...listElementsInModelOrder(model).map((element): Lens => ({ ...EMPTY_LENS, elementId: element.id })),
    ...PLACED_ENTRY_PATHS.map((entryPath): Lens => ({ ...EMPTY_LENS, entryPaths: [entryPath] })),
    ...THREAT_GOALS.map((goal): Lens => ({ ...EMPTY_LENS, goals: [goal] })),
    ...CATALOG_SEVERITIES.map((severity): Lens => ({ ...EMPTY_LENS, severities: [severity] })),
  ];
}

function chipText(label: string): string {
  const chip = screen.getAllByRole('button', { hidden: true }).find((button) => button.textContent?.startsWith(label));
  if (chip === undefined) throw new Error(`test setup: no chip starts with "${label}"`);
  return chip.textContent ?? '';
}

describe('the "not assessed" rule on every chip', () => {
  it.each(PRESETS)('%s: under every lens, an effect with no catalog row and incomplete coverage says "not assessed", never a bare zero', (_presetId, preset) => {
    for (const lens of listLenses(preset)) {
      const { lensCounts } = setUp(preset, lens);
      for (const goal of THREAT_GOALS) {
        const catalogCount = lensCounts.byGoal[goal] - lensCounts.baselineByGoal[goal];
        const text = chipText(EFFECT_LABELS[goal]);
        if (catalogCount === 0 && preset.report.goalCoverage[goal].isIncomplete) {
          expect(text).toContain('not assessed');
          expect(text).not.toMatch(new RegExp(`^${EFFECT_LABELS[goal]} 0`));
        } else {
          expect(text).toMatch(new RegExp(`^${EFFECT_LABELS[goal]} ${catalogCount}(\\D|$)`));
        }
        // Baseline rows are counted apart, so they never stand in for unassessed catalog techniques.
        if (lensCounts.baselineByGoal[goal] > 0) expect(text).toContain(`+ ${lensCounts.baselineByGoal[goal]} baseline`);
      }
      cleanup();
    }
  });

  it.each(PRESETS)('%s: under every lens, entry path, severity, evidence and open-only chips follow the same rule', (_presetId, preset) => {
    for (const lens of listLenses(preset)) {
      const { counts, gaps } = setUp(preset, lens);
      const expectChip = (label: string, count: number, isIncomplete: boolean): void => {
        expect(chipText(label)).toBe(count === 0 && isIncomplete ? `${label} not assessed` : `${label} ${count}`);
      };
      for (const entryPath of PLACED_ENTRY_PATHS) expectChip(ENTRY_PATH_LABELS[entryPath], counts.lens.byEntryPath[entryPath], gaps.isAnyIncomplete);
      for (const severity of CATALOG_SEVERITIES) expectChip(CATALOG_SEVERITY_LABELS[severity], counts.bySeverity[severity], gaps.bySeverity[severity]);
      for (const evidence of counts.byEvidence) expectChip(evidence.label, evidence.count, gaps.isAnyIncomplete);
      expectChip('Open only', counts.openRows, gaps.isAnyIncomplete);
      cleanup();
    }
  });

  it('holds when every row has a decision: the placement table is still incomplete, so no chip prints a bare zero', () => {
    const [, preset] = PRESETS[0];
    const decided = preset.report.riskRows.map((row): RiskRow => ({ ...row, status: 'mitigated' }));
    const { gaps, view } = setUp(preset, EMPTY_LENS, decided);
    expect(gaps.isAnyIncomplete).toBe(true);
    for (const goal of THREAT_GOALS) expect(chipText(EFFECT_LABELS[goal])).toBe(`${EFFECT_LABELS[goal]} not assessed`);
    for (const button of within(view.container).getAllByRole('button', { hidden: true })) {
      if (button.textContent?.startsWith('Low') === true && !gaps.bySeverity.low) continue;
      expect(button.textContent).not.toMatch(/(^|\D)0$/);
    }
  });
});

describe('GoalChip', () => {
  const noop = (): void => undefined;

  it('prints the catalog count alone when no baseline row counts under the effect', () => {
    render(<GoalChip label="Read" catalogCount={4} baselineCount={0} isIncomplete isPressed={false} onToggle={noop} />);
    expect(screen.getByRole('button', { name: 'Read 4' })).toBeTruthy();
  });

  it('says "not assessed" beside the baseline rows when the catalog has none and is incomplete', () => {
    render(<GoalChip label="Deny" catalogCount={0} baselineCount={7} isIncomplete isPressed onToggle={noop} />);
    const chip = screen.getByRole('button', { pressed: true });
    expect(chip.textContent).toBe('Deny not assessed + 7 baseline');
    expect(chip.getAttribute('data-not-assessed')).toBe('true');
  });

  it('prints a zero as a count only when every technique of that effect has a placement decision', () => {
    render(<GoalChip label="Deny" catalogCount={0} baselineCount={7} isIncomplete={false} isPressed={false} onToggle={noop} />);
    expect(screen.getByRole('button').textContent).toBe('Deny 0 + 7 baseline');
  });
});

describe('ModelFacets', () => {
  const [, preset] = PRESETS[0];

  it('is one bar: Part, entry path, effect and decision in the first row, severity and evidence behind "More filters"', () => {
    setUp(preset, EMPTY_LENS);
    const bar = screen.getByRole('group', { name: 'Filter this device\'s rows' });
    expect(within(bar).getAllByRole('group').map((group) => group.querySelector('legend')?.textContent)).toEqual(['Part', 'How it gets in', 'Effect', 'Decision']);
    expect(within(bar).getByRole('button', { name: 'More filters' }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: 'Show everything' })).toBeNull();
  });

  it('narrows to a part from the select, to an effect from its chip, and to open rows', () => {
    const { handlers, counts } = setUp(preset, EMPTY_LENS);
    const [firstElement] = listElementsInModelOrder(preset.model);
    fireEvent.change(screen.getByRole('combobox', { name: 'Part or connection' }), { target: { value: firstElement.id } });
    expect(handlers.onLensChange).toHaveBeenCalledWith({ ...EMPTY_LENS, elementId: firstElement.id });
    fireEvent.click(screen.getByRole('button', { name: `Read ${counts.catalogByGoal.read}` }));
    expect(handlers.onLensChange).toHaveBeenCalledWith({ ...EMPTY_LENS, goals: ['read'] });
    fireEvent.click(screen.getByRole('button', { name: `Open only ${counts.openRows}` }));
    expect(handlers.onOpenOnlyChange).toHaveBeenCalledWith(true);
  });

  it('counts a filter behind "More filters" on the button, shows a technique the reader arrived with, and clears everything at once', () => {
    const technique = engineData.techniques.find((candidate) => preset.report.riskRows.some((row) => row.techniqueId === candidate.id));
    if (technique === undefined) throw new Error('test setup: the preset has no catalog row');
    const lens: Lens = { ...EMPTY_LENS, severities: ['high'], techniqueId: technique.id };
    const context = { model: preset.model, techniques: engineData.techniques };
    const gaps = findCoverageGaps(preset.report.goalCoverage, summariseCoverageBySeverity(engineData.techniques, summariseScope(preset.model, engineData, referenceData)));
    const handlers = { onLensChange: vi.fn(), onOpenOnlyChange: vi.fn() };
    render(
      <ModelFacets
        lens={lens} isOpenOnly={false} counts={countFacets(preset.report.riskRows, lens, context)} gaps={gaps}
        elements={listElementsInModelOrder(preset.model)} techniqueName={technique.name} {...handlers}
      />,
    );
    expect(screen.getByRole('button', { name: 'More filters (1)' })).toBeTruthy();
    const techniqueChip = screen.getByRole('button', { name: /\(clear\)$/ });
    expect(techniqueChip.textContent).toContain(technique.name);
    expect(techniqueChip.textContent).toContain(technique.id);
    fireEvent.click(techniqueChip);
    expect(handlers.onLensChange).toHaveBeenCalledWith({ ...lens, techniqueId: null });
    fireEvent.click(screen.getByRole('button', { name: 'Show everything' }));
    expect(handlers.onLensChange).toHaveBeenLastCalledWith(EMPTY_LENS);
    expect(handlers.onOpenOnlyChange).toHaveBeenCalledWith(false);
  });

  it('shows only the facets asked for', () => {
    const context = { model: preset.model, techniques: engineData.techniques };
    const gaps = findCoverageGaps(preset.report.goalCoverage, summariseCoverageBySeverity(engineData.techniques, summariseScope(preset.model, engineData, referenceData)));
    render(
      <ModelFacets
        lens={EMPTY_LENS} isOpenOnly={false} counts={countFacets(preset.report.riskRows, EMPTY_LENS, context)} gaps={gaps}
        elements={listElementsInModelOrder(preset.model)} techniqueName={null} facetIds={['part']} onLensChange={() => undefined} onOpenOnlyChange={() => undefined}
      />,
    );
    expect(screen.getAllByRole('group').filter((group) => group.tagName === 'FIELDSET')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'More filters' })).toBeNull();
  });
});
