// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { CATALOG_SEVERITIES } from '@/lib/threat-model/catalog-types';
import { CATALOG_SEVERITY_LABELS, EFFECT_LABELS, ENTRY_PATH_LABELS, GOAL_BY_MODE } from '@/lib/threat-model/lab-terms';
import { EMPTY_LENS, countOpenRisks, type Lens } from '@/lib/threat-model/lens';
import { listElementsInModelOrder } from '@/lib/threat-model/model-order';
import { summariseCoverageBySeverity } from '@/lib/threat-model/placement-coverage';
import { PLACED_ENTRY_PATHS } from '@/lib/threat-model/reference-data-types';
import { THREAT_GOALS, type RiskRow, type ThreatGoal } from '@/lib/threat-model/report-types';
import { summariseScope, type ScopeStatement } from '@/lib/threat-model/scope-statement';
import { PRESETS, engineData, referenceData, type Preset } from '@/lib/threat-model/__tests__/preset-reports';
import { countFacets } from '../facet-counts';
import GoalChip from '../GoalChip';
import ModelFacets, { MODEL_FACET_IDS, MOST_FIRST_ROW_FACETS, type ModelFacetId } from '../ModelFacets';
import { buildScopeByKind, describeTermCounts, zeroLabelFor, type TermCounts } from '../scope-by-kind';

afterEach(cleanup);

function scopeOf({ model }: Preset): ScopeStatement {
  return summariseScope(model, engineData, referenceData);
}

function setUp(preset: Preset, lens: Lens, rows: readonly RiskRow[] = preset.report.riskRows, facetIds?: readonly ModelFacetId[]) {
  const { model } = preset;
  const context = { model, techniques: engineData.techniques };
  const counts = countFacets(rows, lens, context);
  const scope = scopeOf(preset);
  const scopeByKind = buildScopeByKind(scope, engineData.techniques, referenceData.placementRules.placements, summariseCoverageBySeverity(engineData.techniques, scope));
  const handlers = { onLensChange: vi.fn(), onOpenOnlyChange: vi.fn() };
  const view = render(
    <ModelFacets
      lens={lens} isOpenOnly={false} counts={counts} scopeByKind={scopeByKind} elements={listElementsInModelOrder(model)} techniqueName={null}
      facetIds={facetIds} {...handlers}
    />,
  );
  return { counts, scopeByKind, handlers, view, lensCounts: countOpenRisks(rows, lens, context) };
}

/** Counted here from the scope lists alone, apart from the code under test: techniques of one effect under each term. */
function countGoalTerms(preset: Preset, goal: ThreatGoal): TermCounts {
  const scope = scopeOf(preset);
  const goalOf = (techniqueId: string): ThreatGoal | null => {
    const mode = engineData.techniques.find((technique) => technique.id === techniqueId)?.mode ?? null;
    return mode === null ? null : GOAL_BY_MODE[mode];
  };
  const count = (entries: readonly { techniqueId: string }[]): number => entries.filter((entry) => goalOf(entry.techniqueId) === goal).length;
  return { applies: count(scope.applies), would_apply_if: count(scope.wouldApplyIf), reviewed_outside: count(scope.reviewedOutside), not_assessed: count(scope.notAssessed) };
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

function findChip(label: string): HTMLElement {
  const chip = screen.getAllByRole('button', { hidden: true }).find((button) => button.textContent?.startsWith(label));
  if (chip === undefined) throw new Error(`test setup: no chip starts with "${label}"`);
  return chip;
}

function chipText(label: string): string {
  return findChip(label).textContent ?? '';
}

function expectedZero(counts: TermCounts): string {
  if (counts.applies > 0) return '0 open';
  return counts.applies + counts.would_apply_if + counts.reviewed_outside > 0 ? 'none on this device' : 'not assessed';
}

describe('what a chip prints in place of a zero', () => {
  it.each(PRESETS)('%s: under every lens an effect prints its open rows, or says in words why there is none; never a bare zero', (_presetId, preset) => {
    for (const lens of listLenses(preset)) {
      const { lensCounts } = setUp(preset, lens);
      for (const goal of THREAT_GOALS) {
        const catalogCount = lensCounts.byGoal[goal] - lensCounts.baselineByGoal[goal];
        const baseline = lensCounts.baselineByGoal[goal] > 0 ? ` + ${lensCounts.baselineByGoal[goal]} baseline` : '';
        const figure = catalogCount > 0 ? String(catalogCount) : expectedZero(countGoalTerms(preset, goal));
        expect(chipText(EFFECT_LABELS[goal])).toBe(`${EFFECT_LABELS[goal]} ${figure}${baseline}`);
      }
      cleanup();
    }
  });

  it.each(PRESETS)('%s: "not assessed" is never said of an effect, an entry path or a severity that has a placement decision', (_presetId, preset) => {
    for (const lens of listLenses(preset)) {
      const { scopeByKind } = setUp(preset, lens);
      const kinds: [string, TermCounts][] = [
        ...THREAT_GOALS.map((goal): [string, TermCounts] => [EFFECT_LABELS[goal], scopeByKind.byGoal[goal]]),
        ...PLACED_ENTRY_PATHS.map((entryPath): [string, TermCounts] => [ENTRY_PATH_LABELS[entryPath], scopeByKind.byEntryPath[entryPath]]),
        ...CATALOG_SEVERITIES.map((severity): [string, TermCounts] => [CATALOG_SEVERITY_LABELS[severity], scopeByKind.bySeverity[severity]]),
      ];
      for (const [label, counts] of kinds) {
        const hasDecision = counts.applies + counts.would_apply_if + counts.reviewed_outside > 0;
        if (hasDecision) expect(chipText(label), `${label} under ${JSON.stringify(lens)}`).not.toContain('not assessed');
        expect(chipText(label)).not.toMatch(new RegExp(`^${label} 0$`));
      }
      cleanup();
    }
  });

  it.each(PRESETS)('%s: the counts a chip is built from agree with the scope lists counted apart', (_presetId, preset) => {
    const { scopeByKind } = setUp(preset, EMPTY_LENS);
    for (const goal of THREAT_GOALS) expect(scopeByKind.byGoal[goal]).toEqual(countGoalTerms(preset, goal));
    const scope = scopeOf(preset);
    const placed = Object.values(scopeByKind.byEntryPath).reduce((sum, counts) => sum + counts.applies + counts.would_apply_if, 0);
    expect(placed).toBe(scope.applies.length + scope.wouldApplyIf.length);
    for (const counts of Object.values(scopeByKind.byEntryPath)) expect(counts.reviewed_outside + counts.not_assessed).toBe(0);
  });

  it('says "none on this device" for an effect with decisions and no row, and carries the counts under the scope terms', () => {
    const found = PRESETS.flatMap(([, preset]) => THREAT_GOALS.map((goal) => ({ preset, goal, terms: countGoalTerms(preset, goal) })))
      .find(({ terms }) => terms.applies === 0 && terms.would_apply_if + terms.reviewed_outside > 0);
    if (found === undefined) throw new Error('test setup: no preset has an effect with decisions and no row');
    setUp(found.preset, EMPTY_LENS);
    const chip = findChip(EFFECT_LABELS[found.goal]);
    expect(chip.textContent).toContain('none on this device');
    expect(chip.getAttribute('data-not-assessed')).toBe('false');
    const parts = [
      ...(found.terms.would_apply_if > 0 ? [`${found.terms.would_apply_if} would apply if (condition)`] : []),
      ...(found.terms.reviewed_outside > 0 ? [`${found.terms.reviewed_outside} reviewed, outside the device`] : []),
      ...(found.terms.not_assessed > 0 ? [`${found.terms.not_assessed} not assessed`] : []),
    ];
    expect(chip.getAttribute('title')).toBe(parts.join('; '));
  });

  it('says "0 open" when the kind has rows on the device and every one has a decision', () => {
    const [, preset] = PRESETS[0];
    const decided = preset.report.riskRows.map((row): RiskRow => ({ ...row, status: 'mitigated' }));
    const { view } = setUp(preset, EMPTY_LENS, decided);
    for (const goal of THREAT_GOALS) {
      const terms = countGoalTerms(preset, goal);
      expect(chipText(EFFECT_LABELS[goal])).toBe(`${EFFECT_LABELS[goal]} ${expectedZero(terms)}`);
    }
    for (const button of within(view.container).getAllByRole('button', { hidden: true })) expect(button.textContent).not.toMatch(/(^|[^\d])0$/);
  });
});

describe('zeroLabelFor and describeTermCounts', () => {
  const none: TermCounts = { applies: 0, would_apply_if: 0, reviewed_outside: 0, not_assessed: 9 };

  it('prints a count as it is, and words for a zero by where the techniques stand', () => {
    expect(zeroLabelFor(3, none)).toBeNull();
    expect(zeroLabelFor(0, none)).toBe('not assessed');
    expect(zeroLabelFor(0, { ...none, reviewed_outside: 4 })).toBe('none on this device');
    expect(zeroLabelFor(0, { ...none, would_apply_if: 1 })).toBe('none on this device');
    expect(zeroLabelFor(0, { ...none, applies: 2 })).toBe('0 open');
  });

  it('lists the terms that hold a technique, in the scope terms\' own words, and leaves out the empty ones', () => {
    expect(describeTermCounts({ applies: 0, would_apply_if: 1, reviewed_outside: 4, not_assessed: 21 })).toBe('1 would apply if (condition); 4 reviewed, outside the device; 21 not assessed');
    expect(describeTermCounts({ applies: 0, would_apply_if: 3, reviewed_outside: 0, not_assessed: 0 })).toBe('3 would apply if (condition)');
  });
});

describe('GoalChip', () => {
  const noop = (): void => undefined;
  const undecided: TermCounts = { applies: 0, would_apply_if: 0, reviewed_outside: 0, not_assessed: 26 };

  it('prints the catalog count alone when no baseline row counts under the effect', () => {
    render(<GoalChip label="Read" catalogCount={4} termCounts={{ ...undecided, applies: 4 }} isPressed={false} onToggle={noop} />);
    expect(screen.getByRole('button', { name: 'Read 4' })).toBeTruthy();
  });

  it('says "not assessed" beside the baseline rows only when no technique of the kind has a placement decision', () => {
    render(<GoalChip label="Deny" catalogCount={0} baselineCount={7} termCounts={undecided} isPressed onToggle={noop} />);
    const chip = screen.getByRole('button', { pressed: true });
    expect(chip.textContent).toBe('Deny not assessed + 7 baseline');
    expect(chip.getAttribute('data-not-assessed')).toBe('true');
  });

  it('says "none on this device" beside the baseline rows when decisions exist and none places a row', () => {
    render(<GoalChip label="Deny" catalogCount={0} baselineCount={7} termCounts={{ applies: 0, would_apply_if: 1, reviewed_outside: 4, not_assessed: 21 }} isPressed={false} onToggle={noop} />);
    const chip = screen.getByRole('button');
    expect(chip.textContent).toBe('Deny none on this device + 7 baseline');
    expect(chip.getAttribute('data-not-assessed')).toBe('false');
    expect(chip.getAttribute('title')).toBe('1 would apply if (condition); 4 reviewed, outside the device; 21 not assessed');
  });
});

describe('ModelFacets', () => {
  const [, preset] = PRESETS[0];
  const legends = (bar: HTMLElement): (string | null | undefined)[] => within(bar).getAllByRole('group').map((group) => group.querySelector('legend')?.textContent);

  it('is one bar: at most four facets in the first row and the rest behind "More filters"', () => {
    setUp(preset, EMPTY_LENS);
    const bar = screen.getByRole('group', { name: 'Filter this device\'s rows' });
    expect(MOST_FIRST_ROW_FACETS).toBe(4);
    expect(legends(bar)).toEqual(['Part', 'How it gets in', 'Effect', 'Decision']);
    expect(within(bar).getByRole('button', { name: 'More filters' }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: 'Show everything' })).toBeNull();
  });

  it('offers no Part select where the diagram chooses the part: the row starts with the entry path', () => {
    setUp(preset, EMPTY_LENS, preset.report.riskRows, MODEL_FACET_IDS.filter((facetId) => facetId !== 'part'));
    expect(screen.queryByRole('combobox', { name: 'Part or connection' })).toBeNull();
    expect(legends(screen.getByRole('group', { name: 'Filter this device\'s rows' }))).toEqual(['How it gets in', 'Effect', 'Decision', 'Catalog severity']);
  });

  it('draws nothing when no facet is asked for and nothing is narrowed, and only the way back when something is', () => {
    const { view } = setUp(preset, EMPTY_LENS, preset.report.riskRows, []);
    expect(view.container.firstChild).toBeNull();
    cleanup();
    const [firstElement] = listElementsInModelOrder(preset.model);
    const { handlers } = setUp(preset, { ...EMPTY_LENS, elementId: firstElement.id }, preset.report.riskRows, []);
    expect(screen.queryByRole('group', { name: 'Filter this device\'s rows' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show everything' }));
    expect(handlers.onLensChange).toHaveBeenCalledWith(EMPTY_LENS);
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
    const lens: Lens = { ...EMPTY_LENS, evidenceLevels: [countFacets(preset.report.riskRows, EMPTY_LENS, { model: preset.model, techniques: engineData.techniques }).byEvidence[0].label], techniqueId: technique.id };
    const context = { model: preset.model, techniques: engineData.techniques };
    const scope = scopeOf(preset);
    const handlers = { onLensChange: vi.fn(), onOpenOnlyChange: vi.fn() };
    render(
      <ModelFacets
        lens={lens} isOpenOnly={false} counts={countFacets(preset.report.riskRows, lens, context)}
        scopeByKind={buildScopeByKind(scope, engineData.techniques, referenceData.placementRules.placements, summariseCoverageBySeverity(engineData.techniques, scope))}
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
    setUp(preset, EMPTY_LENS, preset.report.riskRows, ['part']);
    expect(screen.getAllByRole('group').filter((group) => group.tagName === 'FIELDSET')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'More filters' })).toBeNull();
  });
});
