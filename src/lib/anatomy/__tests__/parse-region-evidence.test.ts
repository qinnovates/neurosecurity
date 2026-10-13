import { describe, expect, it } from 'vitest';
import regionEvidenceFile from '@shared/qif-anatomy-region-evidence.json';
import atlas from '@shared/qif-brain-bci-atlas.json';
import { AnatomyDataError } from '../errors';
import { doiAddress, pubmedAddress } from '../literature-readers';
import { parseRegionEvidence } from '../parse-region-evidence';
import { isAboutRegionItself, type RegionEvidence } from '../region-evidence-types';

const REGION_IDS = new Set(atlas.brain_regions.map((region) => region.id));
const clone = (): RegionEvidence => structuredClone(regionEvidenceFile) as unknown as RegionEvidence;

/** A copy of the real file with one row changed. */
function withRow(change: (row: Record<string, unknown>) => void, rowIndex = 0): unknown {
  const copy = clone();
  change(copy.rows[rowIndex] as unknown as Record<string, unknown>);
  return copy;
}

describe('parseRegionEvidence on the committed file (guard)', () => {
  const evidence = parseRegionEvidence(regionEvidenceFile, REGION_IDS);

  it('reads 58 statements over 35 regions and a reason for each of the other 3', () => {
    expect(evidence.rows).toHaveLength(58);
    expect(new Set(evidence.rows.map((row) => row.region_id)).size).toBe(35);
    expect(evidence.empty_regions.map((region) => region.region_id).sort()).toEqual(['cea', 'sacral_cord', 'thoracic_cord']);
    expect(evidence.empty_regions.every((region) => region.reason.length > 0)).toBe(true);
  });

  it('holds rows that are not about the region itself, so the display rule has something to act on', () => {
    const qualified = evidence.rows.filter((row) => !isAboutRegionItself(row));
    expect(qualified.length).toBeGreaterThan(30);
    expect(evidence.rows.filter((row) => row.anatomy_match === 'outside_region').map((row) => row.region_id)).toEqual(['ppc']);
    expect(evidence.rows.filter((row) => row.contested)).toHaveLength(5);
  });

  it('records no human review on any row', () => {
    expect(evidence.rows.filter((row) => row.human_review !== null || row.drafted_by !== 'ai')).toEqual([]);
  });
});

describe('parseRegionEvidence on bad files', () => {
  const parse = (raw: unknown): RegionEvidence => parseRegionEvidence(raw, REGION_IDS);

  it('throws a typed error that names the file and the field', () => {
    const attempt = (): RegionEvidence => parse(withRow((row) => { row.claim = ''; }, 3));
    expect(attempt).toThrow(AnatomyDataError);
    expect(attempt).toThrow(/qif-anatomy-region-evidence\.json: rows\[3\]\.claim/);
  });

  it('refuses a key it does not know and a row that lacks one', () => {
    expect(() => parse(withRow((row) => { row.reviewed = true; }))).toThrow(/unexpected key "reviewed"/);
    expect(() => parse(withRow((row) => { delete row.scope_note; }))).toThrow(/missing key "scope_note"/);
    expect(() => parse({ ...clone(), extra: 1 })).toThrow(/unexpected key "extra"/);
  });

  it('refuses a softened status sentence or display rule', () => {
    expect(() => parse({ ...clone(), status: 'Reviewed by experts.' })).toThrow(/status: the sentence differs/);
    expect(() => parse({ ...clone(), display_rule: 'Show rows.' })).toThrow(/display_rule: the sentence differs/);
  });

  it('refuses a row that claims a human review or a non-AI drafter', () => {
    expect(() => parse(withRow((row) => { row.human_review = { by: 'someone' }; }))).toThrow(/human_review: no person has reviewed a row/);
    expect(() => parse(withRow((row) => { row.drafted_by = 'neuroanatomist'; }))).toThrow(/drafted_by/);
  });

  it('refuses a row filed under a region other than its own, or under no QIF region', () => {
    expect(() => parse(withRow((row) => { row.filed_under = 'm1'; }))).toThrow(/filed_under: a row is filed under its own region/);
    expect(() => parse(withRow((row) => { row.region_id = 'cortex'; row.filed_under = 'cortex'; }))).toThrow(/"cortex" is not a QIF region id/);
  });

  it('refuses an anatomy match outside the six values, a quote over 40 words and hidden characters', () => {
    expect(() => parse(withRow((row) => { row.anatomy_match = 'same'; }))).toThrow(/anatomy_match: "same" is not an allowed value/);
    expect(() => parse(withRow((row) => { row.quote = Array.from({ length: 41 }, () => 'word').join(' '); }))).toThrow(/quote: the quote is longer than 40 words/);
    expect(() => parse(withRow((row) => { row.claim = 'Safe‮text'; }))).toThrow(/claim: the text holds a control character/);
  });

  it('refuses an identifier or address that is not what it says', () => {
    expect(() => parse(withRow((row) => { row.doi = 'https://doi.org/10.1/x'; }))).toThrow(/doi: .* is not a DOI/);
    expect(() => parse(withRow((row) => { row.pmid = '12a'; }))).toThrow(/pmid: .* is not a PubMed id/);
    expect(() => parse(withRow((row) => { row.url_opened = 'https://evil.example/efetch'; }))).toThrow(/url_opened: .* expected host/);
    expect(() => parse(withRow((row) => { row.url_opened = 'http://eutils.ncbi.nlm.nih.gov/x'; }))).toThrow(/url_opened/);
  });

  it('refuses a row that must be shown with a paper it does not carry', () => {
    expect(() => parse(withRow((row) => { row.requires_citations = [{ pmid: '99999', role: 'contrary' }]; })))
      .toThrow(/requires_citations: PubMed id 99999 must be shown with this row/);
  });

  it('refuses the same quote from the same paper filed twice under one region', () => {
    const doubled = clone();
    doubled.rows.push(structuredClone(doubled.rows[0]));
    expect(() => parse(doubled)).toThrow(/rows: statement \(region, paper and quote\) "pfc:22789779:.+" appears twice/);
  });

  it('requires a closed reason code on every region with no statement', () => {
    const coded = clone();
    (coded.empty_regions[0] as unknown as Record<string, unknown>).reason_code = 'drafter_gave_up';
    expect(() => parse(coded)).toThrow(/empty_regions\[0\]\.reason_code: "drafter_gave_up" is not an allowed value/);
    const uncoded = clone();
    delete (uncoded.empty_regions[0] as unknown as Record<string, unknown>).reason_code;
    expect(() => parse(uncoded)).toThrow(/missing key "reason_code"/);
  });

  it('refuses tallies that disagree with the rows, and a region with neither rows nor a reason', () => {
    expect(() => parse({ ...clone(), rows_surviving: 57 })).toThrow(/rows_surviving: the file says 57 but its contents count 58/);
    expect(() => parse(withRow((row) => { row.kind = 'stimulation_association'; }))).toThrow(/rows_by_kind/);
    const dropped = clone();
    dropped.empty_regions = dropped.empty_regions.filter((region) => region.region_id !== 'cea');
    expect(() => parse(dropped)).toThrow(/region "cea" must have rows or a reason/);
  });
});

describe('citation addresses', () => {
  it('are built from the identifier and never from a field of the file', () => {
    expect(doiAddress('10.1016/j.cortex.2012.05.022')).toBe('https://doi.org/10.1016/j.cortex.2012.05.022');
    expect(pubmedAddress('22789779')).toBe('https://pubmed.ncbi.nlm.nih.gov/22789779/');
    expect(doiAddress('10.1/a b"c')).not.toContain('"');
  });
});
