import { describe, expect, it } from 'vitest';
import { parseAnatomyFiles } from '@/lib/anatomy/anatomy-inputs';
import { buildAnatomyBundle } from '@/lib/anatomy/build-anatomy-index';
import { buildRawFiles } from '@/lib/anatomy/__tests__/raw-files-fixture';
import { ANATOMY_PAYLOAD_MARKERS, findAnatomyPayload } from '../../../scripts/find-anatomy-payload.mjs';
import { loadAnatomyBundle } from '../load-anatomy-data';

/** The committed seed data, and a fixture build that has rows, links and assets, so every section is populated. */
const seed = loadAnatomyBundle();
const populated = buildAnatomyBundle(parseAnatomyFiles(buildRawFiles()));
const index = JSON.parse(populated.indexJson) as Record<string, unknown[]>;
const evidence = JSON.parse(populated.evidenceJson) as Record<string, unknown[]>;
const seedIndex = JSON.parse(seed.indexJson) as Record<string, unknown[]>;

const pageWith = (body: string): string => `<!doctype html><html><head><title>TARA Lab</title></head><body>${body}</body></html>`;
const escapeAttribute = (text: string): string => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const asScript = (value: unknown): string => pageWith(`<script type="application/json">${JSON.stringify(value)}</script>`);
const asIslandProp = (value: unknown): string => pageWith(`<astro-island props="${escapeAttribute(JSON.stringify({ model: [0, value] }))}"></astro-island>`);

/** Renames every key to a short one, as a hand-made view model would, and keeps every value. */
function shortenKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shortenKeys);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(Object.entries(value).map(([, child], position) => [`k${position}`, shortenKeys(child)]));
}

function renameKey(record: unknown, from: string, to: string): unknown {
  const { [from]: moved, ...rest } = record as Record<string, unknown>;
  return { ...rest, [to]: moved };
}

const PROJECTIONS: Array<[string, unknown]> = [
  ['the whole index', index],
  ['the whole evidence file', evidence],
  ['the techniques alone', index.techniques],
  ['one technique\'s links alone', (index.techniques[0] as { links: unknown[] }).links],
  ['the structures alone', index.structures],
  ['one structure\'s owners alone', (index.structures[0] as { owners: unknown[] }).owners],
  ['the subjects alone', index.subjects],
  ['the layers alone', index.layers],
  ['the layers of the seed build alone', seedIndex.layers],
  ['the sources alone', index.sources],
  ['the sources with one key renamed', index.sources.map((source) => renameKey(source, 'clearance_reason', 'why'))],
  ['the sources of the seed build with two keys renamed', seedIndex.sources.map((source) => renameKey(renameKey(source, 'clearance_reason', 'why'), 'stated_license_id', 'stated'))],
  ['the assets alone', index.assets],
  ['a view model of the assets with every key shortened', shortenKeys(index.assets)],
  ['the licence verdicts alone', evidence.verdicts],
  ['the crosswalk evidence alone', evidence.crosswalk_rows],
  ['the link evidence alone', evidence.technique_links],
  ['the techniques of the seed build alone', seedIndex.techniques],
  ['the subjects of the seed build alone', seedIndex.subjects],
  ['a view model of the structures with every key shortened', shortenKeys(index.structures)],
  ['a view model of the techniques with every key shortened', shortenKeys(index.techniques)],
  ['a view model of the seed subjects with every key shortened', shortenKeys(seedIndex.subjects)],
  ['a view model of the seed sources with every key shortened', shortenKeys(seedIndex.sources)],
  ['a view model of the seed layers with every key shortened', shortenKeys(seedIndex.layers)],
];

describe('findAnatomyPayload', () => {
  it('uses only markers that occur in a built index or evidence file', () => {
    const served = seed.indexJson + seed.evidenceJson + populated.indexJson + populated.evidenceJson + 'datalake/qif-anatomy-sources.json';
    expect(ANATOMY_PAYLOAD_MARKERS.length).toBeGreaterThan(10);
    expect(ANATOMY_PAYLOAD_MARKERS.filter((marker: string) => !served.includes(marker))).toEqual([]);
  });

  it('finds nothing in a page that carries only the index pin', () => {
    expect(findAnatomyPayload(asIslandProp(seed.indexPin))).toEqual([]);
    expect(findAnatomyPayload(asScript(populated.indexPin))).toEqual([]);
    expect(findAnatomyPayload(pageWith('<h1>TARA Lab</h1><p>Threat analysis and risk assessment for neural devices.</p>'))).toEqual([]);
  });

  it.each(PROJECTIONS)('finds %s inlined in a script tag', (_name, projection) => {
    expect(findAnatomyPayload(asScript(projection)).length).toBeGreaterThan(0);
  });

  it.each(PROJECTIONS)('finds %s serialised into an island prop, where every quote is an entity', (_name, projection) => {
    expect(findAnatomyPayload(asIslandProp(projection)).length).toBeGreaterThan(0);
  });

  it('decodes quote entities and script-string escapes: the key-and-value marker is found only after decoding', () => {
    const quotedMarker = '"state":"ai_drafted_unreviewed"';
    expect(ANATOMY_PAYLOAD_MARKERS).toContain(quotedMarker);
    const reviewStates = index.subjects.map((subject) => (subject as { review_state: unknown }).review_state);
    const encodings = [
      asIslandProp(reviewStates),
      pageWith(`<script>window.__states = ${JSON.stringify(JSON.stringify(reviewStates))};</script>`),
      pageWith(`<div data-states="${JSON.stringify(reviewStates).replaceAll('"', '&#34;')}"></div>`),
      pageWith(`<div data-states="${JSON.stringify(reviewStates).replaceAll('"', '&#x22;')}"></div>`),
    ];
    for (const page of encodings) {
      expect(page).not.toContain(quotedMarker);
      expect(findAnatomyPayload(page)).toContain(quotedMarker);
    }
  });

  it('finds a single anatomy data file name', () => {
    expect(findAnatomyPayload(pageWith('<a href="/datalake/qif-anatomy-verdicts.json">x</a>'))).toEqual(['qif-anatomy-']);
  });
});
