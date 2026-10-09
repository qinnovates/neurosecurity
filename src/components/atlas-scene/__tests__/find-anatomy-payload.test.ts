import { describe, expect, it } from 'vitest';
import { ANATOMY_PAYLOAD_MARKERS, findAnatomyPayload } from '../../../scripts/find-anatomy-payload.mjs';
import { loadAnatomyBundle } from '../load-anatomy-data';

const bundle = loadAnatomyBundle();
const pageWith = (body: string): string => `<!doctype html><html><head><title>TARA Lab</title></head><body>${body}</body></html>`;
const escapeAttribute = (text: string): string => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

describe('findAnatomyPayload', () => {
  it('uses only markers that really occur in the built anatomy files', () => {
    const served = bundle.indexJson + bundle.evidenceJson + 'datalake/qif-anatomy-sources.json';
    expect(ANATOMY_PAYLOAD_MARKERS.length).toBeGreaterThan(3);
    expect(ANATOMY_PAYLOAD_MARKERS.filter((marker: string) => !served.includes(marker))).toEqual([]);
  });

  it('finds nothing in a page that carries only the index pin', () => {
    const island = `<astro-island props="${escapeAttribute(JSON.stringify(bundle.indexPin))}"></astro-island>`;
    expect(findAnatomyPayload(pageWith(island))).toEqual([]);
  });

  it('finds the index inlined in a script tag', () => {
    const found = findAnatomyPayload(pageWith(`<script type="application/json">${bundle.indexJson}</script>`));
    expect(found).toContain('stale_evidence_keys');
    expect(found).toContain('AI-drafted and unreviewed unless an item says otherwise');
  });

  it('finds the index serialised into an island prop, where every quote is an entity', () => {
    const island = `<astro-island props="${escapeAttribute(JSON.stringify({ index: [0, JSON.parse(bundle.indexJson)] }))}"></astro-island>`;
    expect(findAnatomyPayload(pageWith(island)).length).toBeGreaterThan(2);
  });

  it('finds the index embedded as a JSON string inside a script', () => {
    expect(findAnatomyPayload(pageWith(`<script>window.__anatomy = ${JSON.stringify(bundle.indexJson)};</script>`)).length).toBeGreaterThan(2);
  });

  it('finds the evidence file and a single data file name', () => {
    expect(findAnatomyPayload(pageWith(`<script>${bundle.evidenceJson}</script>`))).toContain('technique_rationales');
    expect(findAnatomyPayload(pageWith('<a href="/datalake/qif-anatomy-verdicts.json">x</a>'))).toEqual(['qif-anatomy-']);
  });
});
