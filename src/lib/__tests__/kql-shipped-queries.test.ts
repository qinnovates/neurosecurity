import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { STARTER_QUERIES } from '../../components/query/starter-queries';
import { buildIndexes, executeQuery, type TableData } from '../kql-engine';
import { getKqlTables } from '../kql-tables';
import { buildThreatModelReport } from '../threat-model/build-report';
import { buildModelFromIntake, defaultAnswersFor } from '../threat-model/intake-to-model';
import { applyLabTablePolicy } from '../threat-model/lab-table-policy';
import { buildQueryTables } from '../threat-model/query-tables';
import { loadEngineBundle, loadReferenceData } from '../threat-model/__tests__/load-test-data';

const siteTables = getKqlTables();

/** The public pages keep their presets in component files that export nothing else, so they are read from source. */
const PUBLIC_PRESET_FILES = ['src/components/bci/BciKql.tsx', 'src/components/bci/DashboardQueryPanel.tsx'];
const PRESET_PATTERN = /query: '([^']+)'/g;

function readPresets(file: string): string[] {
  return [...readFileSync(path.resolve(file), 'utf-8').matchAll(PRESET_PATTERN)].map((match) => match[1]);
}

/** The Lab asks the engine to refuse unknown columns; the public pages do not, so they keep their earlier behaviour. */
const LAB_QUERY_OPTIONS = { strictColumns: true } as const;

/** Public presets that name a table the site does not build. They fail on the public pages today. */
const FAILING_PUBLIC_PRESETS: Readonly<Record<string, RegExp>> = {
  'bbb | sort by category asc': /^Unknown table "bbb"/,
  'bbb | where category == "transporter"': /^Unknown table "bbb"/,
};

/**
 * Public presets that run on the public pages but project a column the table does not have,
 * so the column comes back silently missing. The Lab's strict option would refuse them. They
 * live in files owned by the public pages and are recorded here as a fact, not changed: the
 * list is asserted exactly, so fixing one, or breaking another, fails this test until the
 * list is brought in line.
 */
const PUBLIC_PRESETS_WITH_A_MISSING_COLUMN: Readonly<Record<string, RegExp>> = {
  'comms | project device, wireless_protocol, rf_band, encryption, data_link_risk': /^Unknown column "encryption"/,
  'comms | where wireless_protocol contains "bluetooth" | project device, encryption, data_link_risk, firmware_platform': /^Unknown column "encryption"/,
  'comms | where encryption contains "None" | project device, wireless_protocol, encryption, firmware_platform': /^Unknown column "encryption"/,
  'comms | where data_link_risk contains "HIGH" | project device, wireless_protocol, encryption, rf_band': /^Unknown column "encryption"/,
  'comms | project device, firmware_platform, device_type': /^Unknown column "firmware_platform"/,
  'cranial_nerves | where bci_relevance == "HIGH" | project name, type, functions, bci_relevance': /^Unknown column "functions"/,
  'devices | where channels > 100 | project name, company, type, channels | sort by channels desc': /^Unknown column "name"/,
  'comms | where encryption contains "None" | project device, wireless_protocol, encryption, data_link_risk': /^Unknown column "encryption"/,
};

describe('the Lab starter queries', () => {
  const bundle = loadEngineBundle();
  const referenceData = loadReferenceData(bundle);

  describe.each(referenceData.archetypes.map((archetype) => [archetype.id, archetype] as const))('on the preset %s', (_id, archetype) => {
    const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, bundle.engineData.registrarVersion);
    const report = buildThreatModelReport({ model, engineData: bundle.engineData, referenceData, generatedAt: '' });
    // The same merge the Query mode makes: the allowed site tables, then the device tables on top.
    const tables: TableData = { ...applyLabTablePolicy(siteTables), ...buildQueryTables(report, bundle.engineData, referenceData.placementRules) };
    const indexes = buildIndexes(tables);

    it.each(STARTER_QUERIES.map((starter) => [starter.label, starter.query] as const))('runs "%s" without an error', (_label, query) => {
      expect(executeQuery(query, tables, indexes, LAB_QUERY_OPTIONS).error).toBeNull();
    });
  });
});

describe('the public preset queries', () => {
  const indexes = buildIndexes(siteTables);
  const presets = [...new Set(PUBLIC_PRESET_FILES.flatMap(readPresets))];

  it('finds the presets in the public query components', () => {
    for (const file of PUBLIC_PRESET_FILES) expect(readPresets(file).length, file).toBeGreaterThan(0);
  });

  it('runs every preset as the public pages run it, apart from the two that name a missing table', () => {
    const failing = presets.filter((query) => executeQuery(query, siteTables, indexes).error !== null);
    expect(failing.sort()).toEqual(Object.keys(FAILING_PUBLIC_PRESETS).sort());
  });

  it.each(Object.entries(FAILING_PUBLIC_PRESETS))('reports why "%s" fails', (query, expectedError) => {
    expect(executeQuery(query, siteTables, indexes).error).toMatch(expectedError);
  });

  it('lists exactly the presets the strict option would also refuse for a column the table does not have', () => {
    const refusedOnlyWhenStrict = presets.filter((query) =>
      executeQuery(query, siteTables, indexes).error === null && executeQuery(query, siteTables, indexes, LAB_QUERY_OPTIONS).error !== null);
    expect(refusedOnlyWhenStrict.sort()).toEqual(Object.keys(PUBLIC_PRESETS_WITH_A_MISSING_COLUMN).sort());
  });

  it.each(Object.entries(PUBLIC_PRESETS_WITH_A_MISSING_COLUMN))('reports the missing column in "%s" under the strict option', (query, expectedError) => {
    expect(executeQuery(query, siteTables, indexes, LAB_QUERY_OPTIONS).error).toMatch(expectedError);
  });
});
