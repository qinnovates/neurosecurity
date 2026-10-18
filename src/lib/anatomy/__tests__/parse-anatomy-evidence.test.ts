import { describe, expect, it } from 'vitest';
import { loadAnatomyBundle } from '@/components/atlas-scene/load-anatomy-data';
import { AnatomyDataError } from '../errors';
import { parseAnatomyEvidence } from '../parse-anatomy-evidence';

const served = (): Record<string, unknown> => JSON.parse(loadAnatomyBundle().evidenceJson) as Record<string, unknown>;
const firstLink = (file: Record<string, unknown>): Record<string, unknown> => (file.technique_links as Array<Record<string, unknown>>)[0];

describe('parseAnatomyEvidence', () => {
  it('reads the evidence file the build serves, with a quote behind every technique link (guard)', () => {
    const evidence = parseAnatomyEvidence(served());
    expect(evidence.technique_links.length).toBeGreaterThan(50);
    expect(evidence.technique_links.every((item) => item.evidence.source_ref.quote.length > 0 && item.evidence.rationale.length > 0)).toBe(true);
    expect(evidence.technique_rationales.length).toBeGreaterThan(0);
  });

  it('returns only the parts the explorer shows', () => {
    expect(Object.keys(parseAnatomyEvidence(served())).sort()).toEqual(['crosswalk_rows', 'no_geometry', 'technique_links', 'technique_rationales']);
  });

  it('throws a typed error for a file that is not the evidence file', () => {
    expect(() => parseAnatomyEvidence({})).toThrow(AnatomyDataError);
    expect(() => parseAnatomyEvidence({ ...served(), extra: [] })).toThrow(/unexpected key "extra"/);
    expect(() => parseAnatomyEvidence({ ...served(), status: 'Checked.' })).toThrow(/status/);
    expect(() => parseAnatomyEvidence({ ...served(), schema_version: 99 })).toThrow(/schema_version/);
    expect(() => parseAnatomyEvidence({ ...served(), verdicts: 'none' })).toThrow(/verdicts: expected a list/);
  });

  it('refuses a link whose quote, digest or state is malformed', () => {
    const noQuote = served();
    (firstLink(noQuote).evidence as Record<string, Record<string, unknown>>).source_ref.quote = '';
    expect(() => parseAnatomyEvidence(noQuote)).toThrow(/technique_links\[0\]\.evidence\.source_ref\.quote/);
    const badDigest = served();
    firstLink(badDigest).digest = 'abc';
    expect(() => parseAnatomyEvidence(badDigest)).toThrow(/technique_links\[0\]\.digest/);
    const extraField = served();
    firstLink(extraField).resolved_to = 'pfc';
    expect(() => parseAnatomyEvidence(extraField)).toThrow(/unexpected key "resolved_to"/);
  });
});
