// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { toHash } from '@/components/workbench/route';
import { MODEL_TECHNIQUE_TARGET, VIEW_STATE_KEYS } from '@/components/workbench/shell-targets';
import { BAND_ORDER, INTERFACE_BAND, SILICON_BANDS } from '@/lib/threat-model/catalog-types';
import { EMPTY_CATALOG_FILTERS, buildCatalogFilterContext, filterCatalog } from '@/lib/threat-model/catalog-filter';
import { countByEvidence, describeEvidence } from '@/lib/threat-model/evidence-levels';
import { modelFromArchetype } from '@/lib/threat-model/intake-to-model';
import { SCOPE_TERMS, SCOPE_TERM_LABELS } from '@/lib/threat-model/lab-terms';
import { listScopeEntries, summariseScope } from '@/lib/threat-model/scope-statement';
import { BAND_GROUP_LABELS, BAND_LEGEND_SENTENCE, groupBandCounts } from '../catalog/band-groups';
import { CATALOG_STATE_KEYS, isCatalogFilters } from '../catalog/catalog-view-state';
import CatalogView from '../catalog/CatalogView';
import { TOTAL_HEADING } from '../catalog/CountMatrix';
import { createMemoryStore, engineData, inLab, referenceData } from './lab-harness';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

const { techniques, tactics } = engineData;
const total = techniques.length;
/** The device the Lab opens on. */
const model = modelFromArchetype(referenceData.archetypes[0], engineData.registrarVersion);
const scope = summariseScope(model, engineData, referenceData);
const scopeById = new Map(listScopeEntries(scope).map((entry) => [entry.techniqueId, entry]));
const context = buildCatalogFilterContext(engineData, referenceData.placementRules, new Set(scope.applies.map((entry) => entry.techniqueId)));

function bodyRows(): HTMLElement[] {
  return within(screen.getByRole('region', { name: 'Techniques' })).getAllByRole('row').slice(1);
}

function shownCount(): string {
  return screen.getAllByRole('status')[0].textContent ?? '';
}

function rowIds(): string[] {
  return bodyRows().map((row) => row.getAttribute('data-reflow-key') ?? '');
}

describe('Techniques: facets', () => {
  it('opens on the whole catalog and narrows when an evidence chip is pressed', () => {
    inLab(<CatalogView />);
    expect(shownCount()).toBe(`${total} of ${total} techniques`);
    const [strongest] = countByEvidence(techniques);
    fireEvent.click(screen.getByRole('button', { name: `${strongest.label} ${strongest.count}` }));
    expect(shownCount()).toBe(`${strongest.count} of ${total} techniques`);
    expect(bodyRows()).toHaveLength(strongest.count);
  });

  it('shows the four scope terms under "On this device" with computed counts that sum to the catalog', () => {
    inLab(<CatalogView />);
    const group = screen.getByRole('group', { name: 'On this device' });
    const counts = SCOPE_TERMS.map((term) => listScopeEntries(scope).filter((entry) => entry.term === term).length);
    SCOPE_TERMS.forEach((term, index) => expect(within(group).getByRole('button', { name: `${SCOPE_TERM_LABELS[term]} ${counts[index]}` })).toBeTruthy());
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(total);
  });

  it('keeps the place of every facet and counts the ones behind "More filters"', () => {
    inLab(<CatalogView />);
    const bar = screen.getByRole('group', { name: 'Filter techniques' });
    expect(within(bar).getAllByRole('group', { hidden: true }).map((facet) => facet.querySelector('legend')?.textContent).filter((label) => label !== undefined && label !== null))
      .toEqual(['Search', 'On this device', 'Band', 'Technique family', 'Evidence', 'Catalog severity', 'Effect', 'How it gets in', 'Domain']);
    fireEvent.click(within(bar).getByRole('button', { name: 'More filters' }));
    fireEvent.click(within(bar).getByRole('button', { name: /^Critical \d+$/ }));
    expect(within(bar).getByRole('button', { name: 'More filters (1)' })).toBeTruthy();
    expect(bodyRows()).toHaveLength(techniques.filter((technique) => technique.severity === 'critical').length);
  });
});

describe('Techniques: bands', () => {
  it('groups the band chips silicon side, interface, neural side, each with its distinct-technique count', () => {
    inLab(<CatalogView />);
    const expectedGroups = [
      { label: BAND_GROUP_LABELS.silicon, bands: [...SILICON_BANDS] },
      { label: BAND_GROUP_LABELS.interface, bands: [INTERFACE_BAND] },
      { label: BAND_GROUP_LABELS.neural, bands: BAND_ORDER.filter((bandId) => !SILICON_BANDS.includes(bandId) && bandId !== INTERFACE_BAND) },
    ];
    for (const group of expectedGroups) {
      const chips = within(screen.getByRole('group', { name: group.label })).getAllByRole('button');
      expect(chips.map((chip) => chip.textContent)).toEqual(group.bands.map((bandId) => `${bandId} ${techniques.filter((technique) => technique.bandIds.includes(bandId)).length}`));
    }
  });

  it('keeps a band the catalog order does not name apart from the three groups', () => {
    expect(groupBandCounts([{ bandId: 'S1', count: 2 }, { bandId: 'Q9', count: 1 }]).map((group) => [group.label, group.bands.map((band) => band.bandId)]))
      .toEqual([[BAND_GROUP_LABELS.silicon, ['S1']], [BAND_GROUP_LABELS.other, ['Q9']]]);
  });

  it('filters to the techniques that list a pressed band, and prints the band legend sentence once', () => {
    const { container } = inLab(<CatalogView />);
    const expected = techniques.filter((technique) => technique.bandIds.includes('N3')).length;
    fireEvent.click(screen.getByRole('button', { name: `N3 ${expected}` }));
    expect(bodyRows()).toHaveLength(expected);
    expect(container.textContent?.split(BAND_LEGEND_SENTENCE)).toHaveLength(2);
    fireEvent.keyDown(bodyRows()[0], { key: 'Enter' });
    expect(container.textContent?.split(BAND_LEGEND_SENTENCE)).toHaveLength(2);
  });
});

describe('Techniques: search', () => {
  it.each(['bluetooth', 'CVE-2019', 'QIF-T0004'])('finds "%s" in what the search reads', (needle) => {
    inLab(<CatalogView />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search techniques' }), { target: { value: needle } });
    const expected = filterCatalog(techniques, { ...EMPTY_CATALOG_FILTERS, text: needle }, context);
    expect(expected.length).toBeGreaterThan(0);
    expect(rowIds().sort()).toEqual(expected.map((technique) => technique.id).sort());
  });

  it('says why the table is empty and offers to clear the filters', () => {
    inLab(<CatalogView />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search techniques' }), { target: { value: 'no technique is called this' } });
    expect(screen.getByText('No technique matches these filters together. Clear one to widen the search.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(bodyRows()).toHaveLength(total);
  });
});

describe('Techniques: table', () => {
  it('puts evidence first and the device column second, with short evidence labels and a legend', () => {
    inLab(<CatalogView />);
    const region = screen.getByRole('region', { name: 'Techniques' });
    expect(region.id).toBe('lab-results');
    expect(within(region).getAllByRole('columnheader').map((header) => header.textContent?.replace('↑', '')))
      .toEqual(['Evidence', 'On this device', 'Technique', 'ID', 'Technique family', 'Bands', 'Catalog severity', 'Effect']);
    const firstCells = within(bodyRows()[0]).getAllByRole('cell');
    const first = techniques.find((technique) => technique.id === rowIds()[0]);
    expect(first).toBeDefined();
    if (first === undefined) return;
    expect(firstCells[0].textContent).toBe(describeEvidence(first).shortLabel);
    expect(within(region).getByRole('list', { name: 'Evidence marks' })).toBeTruthy();
  });

  it('sorts by evidence, strongest first, until the reader sorts by something else', () => {
    inLab(<CatalogView />);
    const byId = new Map(techniques.map((technique) => [technique.id, technique]));
    const ranks = rowIds().map((id) => describeEvidence(byId.get(id) ?? techniques[0]).rank);
    expect(ranks).toEqual([...ranks].sort((left, right) => left - right));
    expect(screen.getByRole('columnheader', { name: /Evidence/ }).getAttribute('aria-sort')).toBe('ascending');
    fireEvent.click(screen.getByRole('button', { name: 'Technique' }));
    const names = rowIds().map((id) => byId.get(id)?.name ?? '');
    expect(names).toEqual([...names].sort((left, right) => left.localeCompare(right)));
  });

  it('prints the term of each technique on the device, with the hatch on every "Not assessed"', () => {
    inLab(<CatalogView />);
    for (const row of bodyRows().slice(0, 40)) {
      const entry = scopeById.get(row.getAttribute('data-reflow-key') ?? '');
      const cell = within(row).getAllByRole('cell')[1];
      expect(cell.querySelector('[data-term]')?.getAttribute('data-term')).toBe(entry?.term);
      expect(cell.querySelector('.lab-hatch-swatch') !== null).toBe(entry?.term === 'not_assessed');
    }
  });
});

describe('Techniques: the counts line', () => {
  it('appears only while the "On this device" facet is on, and counts the terms without that facet', () => {
    const { container } = inLab(<CatalogView />);
    expect(container.querySelector('.explore-scope-counts')).toBeNull();
    const inBand = techniques.filter((technique) => technique.bandIds.includes('N3'));
    fireEvent.click(screen.getByRole('button', { name: `N3 ${inBand.length}` }));
    fireEvent.click(within(screen.getByRole('group', { name: 'On this device' })).getByRole('button', { name: new RegExp(`^${SCOPE_TERM_LABELS.applies} \\d+$`) }));
    const line = container.querySelector('.explore-scope-counts');
    expect(line).not.toBeNull();
    const countOf = (term: string): number => inBand.filter((technique) => scopeById.get(technique.id)?.term === term).length;
    expect(line?.textContent).toContain(`Of ${inBand.length} matching the other filters:`);
    for (const term of SCOPE_TERMS) expect(line?.querySelector(`[data-term="${term}"]`)?.textContent?.trim()).toBe(`${countOf(term)} ${SCOPE_TERM_LABELS[term]}`);
    expect(line?.querySelector('[data-term="not_assessed"] .lab-hatch-swatch')).not.toBeNull();
    expect(bodyRows()).toHaveLength(countOf('applies'));
  });
});

describe('Techniques: the count matrix', () => {
  it('prints integers with totals of distinct techniques, and no mark matrix', () => {
    const { container } = inLab(<CatalogView />);
    fireEvent.click(screen.getByRole('radio', { name: 'Technique family by band' }));
    const matrix = screen.getByRole('region', { name: 'Technique family by band' });
    const cells = matrix.querySelectorAll<HTMLButtonElement>('.explore-matrix-cell');
    const expectedCells = new Set(techniques.flatMap((technique) => technique.bandIds.map((bandId) => `${technique.tactic}|${bandId}`))).size;
    expect(cells).toHaveLength(expectedCells);
    expect([...cells].every((cell) => /^[1-9]\d*$/.test(cell.textContent ?? ''))).toBe(true);
    expect(within(matrix).getAllByText(TOTAL_HEADING)).toHaveLength(2);
    const footer = matrix.querySelector('tfoot');
    expect(footer?.querySelector('td:last-child')?.textContent).toBe(String(total));
    expect(container.querySelector('.mark-matrix')).toBeNull();
    expect(matrix.querySelector('.lab-evidence-mark')).toBeNull();
  });

  it('sets the two facets of a pressed cell, keeps the whole matrix in view, and clears them on a second press', () => {
    inLab(<CatalogView />);
    fireEvent.click(screen.getByRole('radio', { name: 'Technique family by band' }));
    const [tactic] = tactics;
    const bandId = techniques.find((technique) => technique.tactic === tactic.id)?.bandIds[0] ?? '';
    const expected = techniques.filter((technique) => technique.tactic === tactic.id && technique.bandIds.includes(bandId)).length;
    const matrix = screen.getByRole('region', { name: 'Technique family by band' });
    const cellCount = matrix.querySelectorAll('.explore-matrix-cell').length;
    const cell = within(matrix).getByRole('button', { name: new RegExp(`^${tactic.name} \\(${tactic.id}\\), Band ${bandId}, .*: ${expected} technique`) });
    fireEvent.click(cell);
    expect(cell.getAttribute('aria-pressed')).toBe('true');
    expect(bodyRows()).toHaveLength(expected);
    expect((screen.getByRole('combobox', { name: 'Technique family' }) as HTMLSelectElement).value).toBe(tactic.id);
    expect(screen.getByRole('button', { name: new RegExp(`^${bandId} \\d+$`) }).getAttribute('aria-pressed')).toBe('true');
    expect(matrix.querySelectorAll('.explore-matrix-cell')).toHaveLength(cellCount);
    fireEvent.click(cell);
    expect(bodyRows()).toHaveLength(total);
  });
});

describe('Techniques: kept state', () => {
  it('keeps filters, sort and layout under explore/catalog keys when the view is left and reopened', () => {
    const store = createMemoryStore();
    const first = inLab(<CatalogView />, store);
    const critical = techniques.filter((technique) => technique.severity === 'critical').length;
    fireEvent.click(screen.getByRole('button', { name: 'More filters' }));
    fireEvent.click(screen.getByRole('button', { name: `Critical ${critical}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Technique' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Technique family by band' }));
    first.unmount();
    expect(Object.values(CATALOG_STATE_KEYS).every((key) => key.startsWith('explore/catalog/'))).toBe(true);
    expect(store.read(CATALOG_STATE_KEYS.filters)).toEqual({ ...EMPTY_CATALOG_FILTERS, severities: ['critical'] });

    inLab(<CatalogView />, store);
    expect(bodyRows()).toHaveLength(critical);
    expect(screen.getByRole('columnheader', { name: /Technique$|Technique↑/ }).getAttribute('aria-sort')).toBe('ascending');
    expect(screen.getByRole('radio', { name: 'Technique family by band' }).getAttribute('aria-checked')).toBe('true');
  });

  it('opens the technique whose id another screen wrote under the shared key, and ignores an id the catalog lacks', () => {
    const store = createMemoryStore();
    const target = techniques[5];
    store.write(VIEW_STATE_KEYS.catalogOpenedTechniqueId, target.id);
    inLab(<CatalogView />, store);
    expect(screen.getByRole('heading', { name: target.name })).toBeTruthy();
    expect(bodyRows().find((row) => row.getAttribute('aria-current') === 'true')?.getAttribute('data-reflow-key')).toBe(target.id);
    act(() => store.write(VIEW_STATE_KEYS.catalogOpenedTechniqueId, 'QIF-T9999'));
    expect(screen.queryByRole('heading', { name: target.name })).toBeNull();
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('refuses kept filters that are not the catalog\'s own values', () => {
    expect(isCatalogFilters(EMPTY_CATALOG_FILTERS)).toBe(true);
    expect(isCatalogFilters({ ...EMPTY_CATALOG_FILTERS, severities: ['catastrophic'] })).toBe(false);
    expect(isCatalogFilters({ ...EMPTY_CATALOG_FILTERS, placement: ['placed'] })).toBe(false);
    expect(isCatalogFilters({ ...EMPTY_CATALOG_FILTERS, text: 'x'.repeat(201) })).toBe(false);
    expect(isCatalogFilters({ ...EMPTY_CATALOG_FILTERS, extra: 1 })).toBe(false);
    expect(isCatalogFilters({ evidence: [] })).toBe(false);
  });
});

describe('Techniques: the drawer', () => {
  it('opens on Enter, marks the row, and returns focus to that row on Escape', () => {
    inLab(<CatalogView />);
    const row = bodyRows()[3];
    row.focus();
    fireEvent.keyDown(row, { key: 'Enter' });
    const drawer = screen.getByRole('complementary');
    expect(document.activeElement).toBe(drawer);
    expect(bodyRows()[3].getAttribute('aria-current')).toBe('true');
    fireEvent.keyDown(drawer, { key: 'Escape' });
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(document.activeElement).toBe(bodyRows()[3]);
  });

  it('returns focus to the row of the last technique opened, after following a related technique', () => {
    inLab(<CatalogView />);
    const withRelated = techniques.find((technique) => technique.relatedTechniqueIds.some((relatedId) => techniques.some((other) => other.id === relatedId)));
    expect(withRelated).toBeDefined();
    if (withRelated === undefined) return;
    const row = bodyRows().find((candidate) => candidate.getAttribute('data-reflow-key') === withRelated.id);
    fireEvent.keyDown(row as HTMLElement, { key: 'Enter' });
    const relatedId = withRelated.relatedTechniqueIds.find((id) => techniques.some((other) => other.id === id)) ?? '';
    const relatedName = techniques.find((technique) => technique.id === relatedId)?.name ?? '';
    fireEvent.click(within(screen.getByRole('complementary')).getByRole('button', { name: `Open technique ${relatedId}, ${relatedName}` }));
    expect(screen.getByRole('heading', { name: relatedName })).toBeTruthy();
    fireEvent.click(within(screen.getByRole('complementary')).getByRole('button', { name: 'Close' }));
    expect(document.activeElement?.getAttribute('data-reflow-key')).toBe(relatedId);
  });

  it('prints the evidence lines, the sources as recorded, and "Source not recorded" where there are none', () => {
    const store = createMemoryStore();
    const sourced = techniques.find((technique) => technique.sources.length > 0 && describeEvidence(technique).cveLine !== null);
    const unsourced = techniques.find((technique) => technique.sources.length === 0);
    expect(sourced).toBeDefined();
    expect(unsourced).toBeDefined();
    if (sourced === undefined || unsourced === undefined) return;
    store.write(VIEW_STATE_KEYS.catalogOpenedTechniqueId, sourced.id);
    inLab(<CatalogView />, store);
    const drawer = screen.getByRole('complementary');
    const evidence = describeEvidence(sourced);
    expect(within(drawer).getByText(evidence.label)).toBeTruthy();
    for (const line of [evidence.provenanceLine, evidence.cveLine]) if (line !== null) expect(within(drawer).getByText(line)).toBeTruthy();
    for (const source of sourced.sources) expect(within(drawer).getByText(source)).toBeTruthy();
    expect(within(drawer).queryByText('Source not recorded')).toBeNull();
    act(() => store.write(VIEW_STATE_KEYS.catalogOpenedTechniqueId, unsourced.id));
    expect(within(screen.getByRole('complementary')).getByText('Source not recorded')).toBeTruthy();
  });

  it('never prints the legacy status or the basis that carries it', () => {
    const store = createMemoryStore();
    store.write(VIEW_STATE_KEYS.catalogOpenedTechniqueId, techniques[0].id);
    inLab(<CatalogView />, store);
    expect(screen.getByRole('complementary').textContent).not.toMatch(/CONFIRMED|DEMONSTRATED|EMERGING|THEORETICAL/);
  });

  it.each(SCOPE_TERMS.map((term) => [term] as const))('says where a "%s" technique stands, with the reason the scope statement holds', (term) => {
    const entry = listScopeEntries(scope).find((candidate) => candidate.term === term);
    expect(entry, `the opening device has no "${term}" technique to show`).toBeDefined();
    if (entry === undefined) return;
    const store = createMemoryStore();
    store.write(VIEW_STATE_KEYS.catalogOpenedTechniqueId, entry.techniqueId);
    inLab(<CatalogView />, store);
    const section = screen.getByRole('complementary').querySelector(`[data-term="${term}"]`);
    expect(section).not.toBeNull();
    expect(screen.getByRole('heading', { name: `On this device: ${model.name}` })).toBeTruthy();
    if (term === 'would_apply_if') {
      for (const condition of entry.conditions) {
        expect(section?.textContent).toContain(condition.detail);
        expect(section?.textContent).toContain(condition.restoringAnswer);
      }
      expect(section?.textContent).not.toContain('(condition)');
    } else {
      expect(section?.textContent).toContain(entry.reason);
    }
    expect(within(screen.getByRole('complementary')).queryAllByRole('button', { name: 'Show in Model' })).toHaveLength(term === 'applies' ? 1 : 0);
  });

  it('lists CVEs in other products by ID, product and score only', () => {
    const cve = engineData.precedentCves.find((candidate) => candidate.description !== '' && candidate.techniqueIds.length > 0);
    expect(cve).toBeDefined();
    if (cve === undefined) return;
    const store = createMemoryStore();
    store.write(VIEW_STATE_KEYS.catalogOpenedTechniqueId, cve.techniqueIds[0]);
    inLab(<CatalogView />, store);
    const drawer = screen.getByRole('complementary');
    expect(within(drawer).getByRole('heading', { name: 'CVEs in other products' })).toBeTruthy();
    const table = within(drawer).getByRole('table');
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['ID', 'Product', 'CVSS']);
    const linked = engineData.precedentCves.filter((candidate) => candidate.techniqueIds.includes(cve.techniqueIds[0]));
    expect(within(table).getAllByRole('row')).toHaveLength(linked.length + 1);
    for (const record of linked) if (record.description.length > 20) expect(drawer.textContent).not.toContain(record.description);
  });

  it('"Show in Model" narrows Model to the technique and opens its risks', () => {
    const entry = scope.applies[0];
    const store = createMemoryStore();
    store.write(VIEW_STATE_KEYS.catalogOpenedTechniqueId, entry.techniqueId);
    inLab(<CatalogView />, store);
    fireEvent.click(screen.getByRole('button', { name: 'Show in Model' }));
    expect(store.read(VIEW_STATE_KEYS.modelLensTechniqueId)).toBe(entry.techniqueId);
    expect(window.location.hash).toBe(toHash(MODEL_TECHNIQUE_TARGET));
    expect(window.location.hash).not.toContain(entry.techniqueId);
  });
});
