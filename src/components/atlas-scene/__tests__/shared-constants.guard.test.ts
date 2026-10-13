/**
 * Facts the atlas has to write down more than once because two runtimes cannot
 * import each other: the Python pipeline, the Node guard scripts and the
 * TypeScript the site builds from. Each fact is listed here once with every
 * place it is written, and the test fails when two copies differ or when a
 * copy can no longer be found where this file says it is.
 *
 * To change a shared fact, change every copy this file lists for it. To add a
 * copy, add a row. The pipeline's Python is read as text and never run.
 */

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ANATOMY_EVIDENCE_PATH, ANATOMY_INDEX_PATH } from '@/lib/anatomy/anatomy-index-types';
import { LICENSE_LINKS } from '@/lib/anatomy/build-attribution';
import { LICENCE_FACTS } from '@/lib/anatomy/licence-rules';
import { POSITION_CHECKS } from '@/lib/anatomy/manifest-types';
import { H01_CARD_PATH } from '@/lib/anatomy/parse-h01-card';
import { REGION_EVIDENCE_PATH } from '@/lib/anatomy/region-evidence-types';
import { LICENCE_IDS } from '@/lib/anatomy/source-types';
import { ATLAS_CHAINS_PATH } from '@/lib/atlas-explorer/chain-file';
import { EXPLORER_CATALOG_PATH } from '@/lib/atlas-explorer/explorer-catalog';

const PIPELINE = 'src/scripts/atlas-pipeline/atlas_pipeline';
const ANATOMY = 'src/lib/anatomy';
const SCENE = 'src/components/atlas-scene';
const ASSET_CHECK = 'src/scripts/check-atlas-assets.mjs';
const ENGINE_DATA = 'src/lib/threat-model/build-engine-data.ts';
const PAGES_DIRECTORY = 'src/pages';
const ENDPOINT_DIRECTORY = 'src/pages/atlas';
const ENDPOINT_PATTERN = /^anatomy-[a-z0-9-]+\.json\.ts$/;
const PATH_SEPARATOR = '/';

/** One place a fact is written: the pattern's capture groups, joined by "/", are the value. */
type Copy = [file: string, pattern: RegExp];

/** Facts with one value. Path facts written with Python's `/` operator capture each segment. */
const SINGLE_VALUE_FACTS: Record<string, Copy[]> = {
  'the manifest\'s path': [
    [`${ANATOMY}/parse-manifest.ts`, /^export const MANIFEST_FILE = '([^']+)';$/m],
    [ASSET_CHECK, /^export const DEFAULT_MANIFEST_FILE = '([^']+)';$/m],
    [`${SCENE}/load-anatomy-data.ts`, /import\.meta\.glob<unknown>\('\/([^'*]+\/manifest\.json)'/],
    [`${PIPELINE}/devices.py`, /"source_ref": \{"file": "([^"]+)"/],
  ],
  'the folder the served assets are committed to': [
    [`${ANATOMY}/parse-manifest.ts`, /^export const MANIFEST_FILE = '([^']+)\/manifest\.json';$/m],
    [`${PIPELINE}/cli.py`, /^ASSET_DIR = sources\.REPO_ROOT \/ "([^"]+)" \/ "([^"]+)" \/ "([^"]+)"$/m],
    ['src/scripts/generate-parquet.py', /^ {4}assets = ROOT \/ "([^"]+)" \/ "([^"]+)" \/ "([^"]+)"$/m],
    [`${ANATOMY}/__tests__/atlas-assets.guard.test.ts`, /^const ASSET_DIRECTORY = '([^']+)';$/m],
  ],
  'the source registry\'s path': [
    [`${ANATOMY}/parse-sources.ts`, /^export const SOURCES_FILE = '([^']+)';$/m],
    [ASSET_CHECK, /^export const DEFAULT_SOURCES_FILE = '([^']+)';$/m],
    [`${PIPELINE}/sources.py`, /^SOURCES_PATH = REPO_ROOT \/ "([^"]+)" \/ "([^"]+)"$/m],
  ],
  'the licence verdicts\' path': [
    [`${ANATOMY}/parse-verdicts.ts`, /^export const VERDICTS_FILE = '([^']+)';$/m],
    [`${PIPELINE}/sources.py`, /^VERDICTS_PATH = REPO_ROOT \/ "([^"]+)" \/ "([^"]+)"$/m],
  ],
  'the review ledger\'s path': [
    [`${ANATOMY}/parse-review-ledger.ts`, /^export const REVIEW_LEDGER_FILE = '([^']+)';$/m],
    [`${PIPELINE}/sources.py`, /^LEDGER_PATH = REPO_ROOT \/ "([^"]+)" \/ "([^"]+)"$/m],
  ],
  'the device geometry file\'s path': [
    [`${ANATOMY}/parse-device-geometry.ts`, /^export const DEVICE_GEOMETRY_FILE = '([^']+)';$/m],
    [`${PIPELINE}/cli.py`, /^DEVICE_GEOMETRY_PATH = sources\.REPO_ROOT \/ "([^"]+)" \/ "([^"]+)"$/m],
  ],
  'the registrar\'s path': [
    [`${ANATOMY}/datalake-files.ts`, /^export const REGISTRAR_FILE = '([^']+)';$/m],
    ['datalake/scripts/technique-region-candidates.mjs', /^export const REGISTRAR_FILE = '([^']+)';$/m],
    [ENGINE_DATA, /^const REGISTRAR_FILE = '([^']+)';$/m],
  ],
  'the region table\'s path': [
    [`${ANATOMY}/datalake-files.ts`, /^export const ATLAS_FILE = '([^']+)';$/m],
    [ENGINE_DATA, /^const ATLAS_FILE = '([^']+)';$/m],
  ],
  'the URL path the assets are served under': [
    [`${SCENE}/scene-assets.ts`, /^export const ATLAS_ASSET_URL_PATH = '([^']+)';$/m],
    [ASSET_CHECK, /^export const ATLAS_ASSET_URL_PATH = '([^']+)';$/m],
  ],
  'the attribution page\'s URL path': [
    [`${SCENE}/ViewportStage.tsx`, /^export const ATTRIBUTION_PATH = '([^']+)';$/m],
    [ASSET_CHECK, /^export const ATTRIBUTION_URL_PATH = '([^']+)';$/m],
  ],
  'the manifest\'s schema version': [
    [`${ANATOMY}/parse-manifest.ts`, /^const MANIFEST_SCHEMA_VERSION = (\d+);$/m],
    [`${PIPELINE}/manifest.py`, /^MANIFEST_SCHEMA_VERSION = (\d+)$/m],
  ],
  'a label table\'s schema version': [
    [`${ANATOMY}/parse-label-table.ts`, /^const LABEL_TABLE_SCHEMA_VERSION = (\d+);$/m],
    [`${PIPELINE}/manifest.py`, /^LABEL_TABLE_SCHEMA_VERSION = (\d+)$/m],
  ],
  'how many digest characters an asset\'s file name carries': [
    [`${ANATOMY}/parse-manifest.ts`, /^const HASH_PREFIX_LENGTH = (\d+);$/m],
    [`${PIPELINE}/manifest.py`, /^HASH_PREFIX_LENGTH = (\d+)$/m],
    [`${ANATOMY}/__tests__/manifest-fixtures.ts`, /^const HASH_PREFIX_LENGTH = (\d+);$/m],
  ],
  'the longest modification note the manifest allows': [
    [`${ANATOMY}/parse-manifest.ts`, /^const MAX_NOTE_LENGTH = (\d+);$/m],
    [`${PIPELINE}/notices.py`, /^MAX_NOTE_LENGTH = (\d+)$/m],
  ],
};

/** Facts that are a set of values: the one capture group holds the list, and its items are compared in sorted order. */
const LIST_FACTS: Record<string, { item: RegExp; copies: Copy[] }> = {
  'the verdicts that let a source ship': {
    item: /[a-z_]+/g,
    copies: [
      [`${ANATOMY}/licence-rules.ts`, /^const SHIPPING_VERDICTS: readonly Verdict\[\] = \[([^\]]*)\];$/m],
      [`${PIPELINE}/sources.py`, /^SHIPPING_VERDICTS = frozenset\(\{([^}]*)\}\)$/m],
    ],
  },
  'the blockers that stop shipping but not computing': {
    item: /[a-z_]+/g,
    copies: [
      [`${ANATOMY}/licence-rules.ts`, /^const SHIPPING_ONLY_BLOCKERS: readonly UnbuildableReason\[\] = \[([^\]]*)\];$/m],
      [`${PIPELINE}/sources.py`, /^PIPELINE_ONLY_BLOCKERS = frozenset\(\{([^}]*)\}\)$/m],
    ],
  },
  'the probability levels a structure\'s volume is recorded at': {
    item: /[0-9.]+/g,
    copies: [
      [`${ANATOMY}/parse-manifest-node.ts`, /^const VOLUME_THRESHOLDS = \[([^\]]*)\] as const;$/m],
      [`${PIPELINE}/structures.py`, /^PROBABILITY_LEVELS = \(([^)]*)\)$/m],
    ],
  },
};

/** Every pattern in these files that names the served folders as an alternation, as in `(open|by-sa)\/`. */
const FOLDER_PATTERN_FILES = [`${ANATOMY}/parse-manifest.ts`, `${ANATOMY}/anatomy-inputs.ts`, `${SCENE}/fetch-atlas-json.ts`];
const FOLDER_ALTERNATION = /\(([a-z-]+(?:\|[a-z-]+)+)\)\\\//g;
const PIPELINE_FOLDERS: Copy = [`${PIPELINE}/outputs.py`, /^FOLDERS = \(([^)]*)\)$/m];
const PIPELINE_LICENCE_FACT = /"([a-z0-9.-]+)": \((True|False), (True|False), (?:"([a-z-]+)"|None)\)/g;
const PIPELINE_LICENCE_FACTS_BLOCK = /^LICENSE_FACTS: [^=]+= \{\n([\s\S]*?)\n\}$/m;
const PIPELINE_LICENCE_NAMES_BLOCK = /^LICENCE_NAMES = \{\n([\s\S]*?)\n\}$/m;
const PIPELINE_LICENCE_NAME = /"([a-z0-9.-]+)": \("([^"]+)", "([^"]+)"\)/g;
const PIPELINE_POSITION_CHECK = /^(?:NOT_INDEPENDENTLY_CHECKED|CHECKED_IN_AGGREGATE) = "([^"]+)"$/gm;
/** The files the page fetches, each named by the constant its endpoint serves. */
const PUBLISHED_PATHS = [ANATOMY_INDEX_PATH, ANATOMY_EVIDENCE_PATH, EXPLORER_CATALOG_PATH, ATLAS_CHAINS_PATH, H01_CARD_PATH, REGION_EVIDENCE_PATH];

const readSource = (file: string): string => fs.readFileSync(file, 'utf-8');

/** @throws Error naming the file when the copy is no longer written the way this guard reads it */
function readCopy([file, pattern]: Copy): string {
  const match = pattern.exec(readSource(file));
  if (match === null) throw new Error(`${file} no longer holds a line matching ${String(pattern)}. Update the row in shared-constants.guard.test.ts to wherever the fact now lives.`);
  return match.slice(1).join(PATH_SEPARATOR);
}

/** A number is compared by value, so `0.50` in one language equals `0.5` in another. */
const normaliseItem = (text: string): string => (Number.isFinite(Number(text)) ? String(Number(text)) : text);
const readItems = (copy: Copy, item: RegExp): string[] => [...readCopy(copy).matchAll(item)].map(([text]) => normaliseItem(text)).sort();
const sorted = (values: Iterable<string>): string[] => [...values].sort();

describe('facts the atlas writes in more than one runtime', () => {
  it.each(Object.entries(SINGLE_VALUE_FACTS))('%s is the same in every copy', (_fact, copies) => {
    const values = copies.map(readCopy);
    expect(copies.length).toBeGreaterThan(1);
    expect(values[0].length).toBeGreaterThan(0);
    expect(Object.fromEntries(copies.map(([file], index) => [file, values[index]])))
      .toEqual(Object.fromEntries(copies.map(([file]) => [file, values[0]])));
  });

  it.each(Object.entries(LIST_FACTS))('%s hold the same items in every copy', (_fact, { item, copies }) => {
    const lists = copies.map((copy) => readItems(copy, item));
    expect(lists[0].length).toBeGreaterThan(0);
    for (const list of lists) expect(list).toEqual(lists[0]);
  });

  it('reads the pipeline\'s licence table as the site\'s: the same ids, grants, agreements and folders', () => {
    const rows = [...readCopy([`${PIPELINE}/sources.py`, PIPELINE_LICENCE_FACTS_BLOCK]).matchAll(PIPELINE_LICENCE_FACT)];
    expect(sorted(rows.map(([, id]) => id))).toEqual(sorted(LICENCE_IDS));
    const pipelineFacts = Object.fromEntries(rows.map(([, id, commercialUse, requiresAgreement, folder]) => [
      id, { commercial_use: commercialUse === 'True', requires_agreement: requiresAgreement === 'True', output_folder: folder ?? null },
    ]));
    const siteFacts = Object.fromEntries(LICENCE_IDS.map((id) => [
      id, { commercial_use: LICENCE_FACTS[id].commercial_use, requires_agreement: LICENCE_FACTS[id].requires_agreement, output_folder: LICENCE_FACTS[id].output_folder },
    ]));
    expect(pipelineFacts).toEqual(siteFacts);
  });

  it('names each licence in the pipeline\'s notices as the attribution page names it, with the same link', () => {
    const rows = [...readCopy([`${PIPELINE}/notices.py`, PIPELINE_LICENCE_NAMES_BLOCK]).matchAll(PIPELINE_LICENCE_NAME)];
    expect(rows.length).toBeGreaterThan(0);
    for (const [, id, name, url] of rows) {
      expect(LICENCE_IDS, id).toContain(id);
      expect({ name, url }, id).toEqual(LICENSE_LINKS[id as keyof typeof LICENSE_LINKS]);
    }
  });

  it('serves the folders the licence table writes to, in the pipeline and in every path pattern', () => {
    const folders = sorted(new Set(LICENCE_IDS.flatMap((id) => LICENCE_FACTS[id].output_folder ?? [])));
    expect(readItems(PIPELINE_FOLDERS, /[a-z-]+/g)).toEqual(folders);
    for (const file of FOLDER_PATTERN_FILES) {
      const alternations = [...readSource(file).matchAll(FOLDER_ALTERNATION)].map(([, names]) => sorted(names.split('|')));
      expect(alternations.length, file).toBeGreaterThan(0);
      for (const names of alternations) expect(names, file).toEqual(folders);
    }
  });

  it('uses position check wordings in the pipeline that the manifest parser accepts', () => {
    const wordings = [...readSource(`${PIPELINE}/manifest.py`).matchAll(PIPELINE_POSITION_CHECK)].map(([, wording]) => wording);
    expect(wordings).toHaveLength(2);
    for (const wording of wordings) expect(POSITION_CHECKS).toContain(wording);
  });

  it('has one endpoint file for each file the page fetches, named as its path constant says', () => {
    const endpoints = fs.readdirSync(ENDPOINT_DIRECTORY).filter((name) => ENDPOINT_PATTERN.test(name)).map((name) => `${ENDPOINT_DIRECTORY}/${name}`);
    expect(sorted(endpoints)).toEqual(sorted(PUBLISHED_PATHS.map((publishedPath) => `${PAGES_DIRECTORY}${publishedPath}.ts`)));
  });

  it('builds the attribution page at the path the viewport links to', () => {
    const [, urlPath] = /^\/(.+)\/$/.exec(readCopy(SINGLE_VALUE_FACTS['the attribution page\'s URL path'][0])) ?? [];
    expect(fs.existsSync(`${PAGES_DIRECTORY}/${urlPath}.astro`)).toBe(true);
  });
});
