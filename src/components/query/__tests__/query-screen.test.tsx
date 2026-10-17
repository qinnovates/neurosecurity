// @vitest-environment jsdom
import fs from 'node:fs';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, renderHook, within } from '@testing-library/react';
import { loadTaraChains } from '@/components/atlas/load-tara-chains';
import { FocusProvider } from '@/components/workbench/FocusContext';
import { VIEW_STATE_KEYS } from '@/components/workbench/shell-targets';
import { buildIndexes, executeQuery, type TableData } from '@/lib/kql-engine';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import { ALLOWED_SITE_TABLES, applyLabTablePolicy } from '@/lib/threat-model/lab-table-policy';
import { QUERY_TABLE_DESCRIPTIONS, buildQueryTables } from '@/lib/threat-model/query-tables';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';
import QueryMode, { LAB_QUERY_OPTIONS } from '../QueryMode';
import QueryResultView from '../QueryResultView';
import { findLargestCount } from '../query-result-columns';
import { SCHEMA_GROUPS, groupTables } from '../schema-groups';
import { STARTER_QUERIES } from '../starter-queries';
import { useOpenTechniqueInCatalog } from '../use-open-technique';

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);
const siteDatabaseText = fs.readFileSync('src/site/data/kql-tables.json', 'utf-8');
const siteTables = applyLabTablePolicy(JSON.parse(siteDatabaseText) as Record<string, Record<string, unknown>[]>);
const techniqueIds = new Set(engineData.techniques.map((technique) => technique.id));

function tablesFor(archetypeIndex: number): TableData {
  const archetype = referenceData.archetypes[archetypeIndex];
  const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, engineData.registrarVersion);
  const report = buildThreatModelReport({ model, engineData, referenceData, generatedAt: '' });
  return { ...siteTables, ...buildQueryTables(report, engineData, referenceData.placementRules) };
}

function run(query: string, tables: TableData) {
  return executeQuery(query, tables, buildIndexes(tables), LAB_QUERY_OPTIONS);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.location.hash = '';
});

describe('starter queries', () => {
  it.each(referenceData.archetypes.map((archetype, index) => [archetype.id, index] as const))('all run without an error on the preset %s', (_id, index) => {
    const tables = tablesFor(index);
    expect(STARTER_QUERIES.length).toBeGreaterThan(0);
    for (const starter of STARTER_QUERIES) expect(run(starter.query, tables).error, starter.label).toBeNull();
  });

  it('are marked as needing the site database exactly when they read one of its tables', () => {
    for (const starter of STARTER_QUERIES) {
      const readsSiteTable = Object.keys(ALLOWED_SITE_TABLES).some((name) => new RegExp(`(^|join )${name}\\b`).test(starter.query));
      expect(starter.needsSiteDatabase, starter.label).toBe(readsSiteTable);
    }
  });
});

describe('the schema groups', () => {
  it('name every table the Lab can hold exactly once, under three headings', () => {
    const grouped = SCHEMA_GROUPS.flatMap((group) => [...group.tables]);
    const known = [...Object.keys(QUERY_TABLE_DESCRIPTIONS), ...Object.keys(ALLOWED_SITE_TABLES)];
    expect([...grouped].sort()).toEqual([...new Set(known)].sort());
    expect(new Set(grouped).size).toBe(grouped.length);
    expect(SCHEMA_GROUPS.map((group) => group.label)).toEqual(['This device', 'Catalog', 'Published specifications']);
  });

  it('never hides a table no group names', () => {
    expect(groupTables(['my_risks', 'something_new']).flatMap((group) => group.tables)).toEqual(['my_risks', 'something_new']);
  });
});

describe('the result', () => {
  const tables = tablesFor(0);
  const show = (query: string, onOpenTechnique = vi.fn()) => {
    const result = run(query, tables);
    return { result, onOpenTechnique, ...render(<QueryResultView result={result} tableNames={Object.keys(tables)} techniqueIds={techniqueIds} onOpenTechnique={onOpenTechnique} />) };
  };

  it('shows an error loudly, in the engine\'s own words', () => {
    const { result } = show('my_risks | project threat, no_such_column');
    expect(result.error).not.toBeNull();
    const alert = screen.getByRole('alert');
    expect(within(alert).getByText('The query did not run')).toBeTruthy();
    expect(within(alert).getByText(result.error as string)).toBeTruthy();
  });

  it('adds the nearest table names to the engine\'s message for an unknown table', () => {
    const { result } = show('my_risk | take 1');
    expect(screen.getByRole('alert').textContent).toContain(result.error);
    expect(screen.getByRole('alert').textContent).toContain('Did you mean my_risks');
  });

  it('groups on two keys as two columns, with a bar per row from zero to the largest count', () => {
    const { result, container } = show('my_risks | where source == "catalog" | summarize count() by part, severity');
    expect(result.error).toBeNull();
    expect(Object.keys(result.rows[0])).toEqual(['part', 'severity', 'count']);
    expect(result.rows.every((row) => row.part !== '' && row.severity !== '')).toBe(true);
    const largest = findLargestCount(result.rows, Object.keys(result.rows[0])) as number;
    expect(largest).toBe(Math.max(...result.rows.map((row) => row.count as number)));
    const widths = [...container.querySelectorAll<HTMLElement>('.query-bar')].map((bar) => bar.style.width);
    expect(widths).toEqual(result.rows.map((row) => `${((row.count as number) / largest) * 100}%`));
    expect(screen.getByRole('columnheader', { name: /Share of the largest count/ })).toBeTruthy();
  });

  it('draws no bar when the result is not a set of counts', () => {
    const { container } = show('my_risks | project threat, part | take 3');
    expect(container.querySelector('.query-bar')).toBeNull();
  });

  it('makes every technique id a link that opens the technique', () => {
    const { result, onOpenTechnique } = show('my_risks | where source == "catalog" | project technique_id, threat | take 3');
    const links = screen.getAllByRole('button', { name: /^Open technique / });
    expect(links).toHaveLength(result.rows.length);
    fireEvent.click(links[0]);
    expect(onOpenTechnique).toHaveBeenCalledWith(result.rows[0].technique_id);
  });

  it('says so when a query runs and matches nothing', () => {
    show('my_risks | where part == "no such part"');
    expect(screen.getByText('The query ran and no row matches it')).toBeTruthy();
  });
});

describe('opening a technique from the console', () => {
  it('moves the address to the catalog and writes only mode and view to it', () => {
    const { result } = renderHook(() => useOpenTechniqueInCatalog());
    const [techniqueId] = techniqueIds;
    result.current(techniqueId);
    expect(window.location.hash).toBe('#explore/catalog');
    expect(window.location.hash).not.toContain(techniqueId);
    expect(VIEW_STATE_KEYS.catalogOpenedTechniqueId).toBe('explore/catalog/opened-technique-id');
  });
});

describe('the Query screen', () => {
  it('puts the editor first, then the result, then the tables under their three groups', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(siteDatabaseText)));
    const { container } = render(
      <FocusProvider engineData={engineData} referenceData={referenceData} curatedChains={loadTaraChains()}>
        <QueryMode viewId="console" onSelectView={() => undefined} onOpenMode={() => undefined} />
      </FocusProvider>,
    );
    await screen.findByRole('heading', { name: 'Published specifications' });
    const order = ['.query-editor', '#lab-results', '.query-table-list'].map((selector) => container.querySelector(selector) as Element);
    expect(order.every((element) => element !== null)).toBe(true);
    expect(order[0].compareDocumentPosition(order[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(order[1].compareDocumentPosition(order[2]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(['This device', 'Catalog', 'Published specifications']);
    expect(screen.getAllByRole('button', { name: STARTER_QUERIES[0].label })[0].getAttribute('aria-pressed')).toBe('true');
  });
});
