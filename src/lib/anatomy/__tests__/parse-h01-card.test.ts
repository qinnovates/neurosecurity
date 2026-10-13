import { describe, expect, it } from 'vitest';
import h01File from '@shared/qif-anatomy-h01-card.json';
import { AnatomyDataError } from '../errors';
import { parseH01Card, type H01Card } from '../parse-h01-card';

const clone = (): H01Card => structuredClone(h01File) as unknown as H01Card;

describe('parseH01Card on the committed file (guard)', () => {
  const card = parseH01Card(h01File);

  it('reads five sentences resting on 24 sourced facts', () => {
    expect(card.card.sentences).toHaveLength(5);
    expect(card.facts).toHaveLength(24);
    expect(card.facts.every((fact) => fact.quote.length > 0 && fact.source_description.length > 0)).toBe(true);
    expect(card.must_not_imply.length).toBeGreaterThan(5);
  });

  it('cites a fact for every sentence', () => {
    const factIds = new Set(card.facts.map((fact) => fact.id));
    expect(card.card.sentences.every((sentence) => sentence.fact_ids.length > 0 && sentence.fact_ids.every((factId) => factIds.has(factId)))).toBe(true);
  });
});

describe('parseH01Card on bad files', () => {
  it('throws a typed error for a sentence that cites a fact the file does not hold', () => {
    const bad = clone();
    bad.card.sentences[0].fact_ids = ['donor_age'];
    expect(() => parseH01Card(bad)).toThrow(AnatomyDataError);
    expect(() => parseH01Card(bad)).toThrow(/"donor_age" is cited but is not a fact in this file/);
  });

  it('refuses a sentence with no fact behind it', () => {
    const bad = clone();
    bad.card.sentences[1].fact_ids = [];
    expect(() => parseH01Card(bad)).toThrow(/a card sentence cites no fact/);
  });

  it('refuses a softened status, a tally that disagrees and an emptied "must not imply" list', () => {
    expect(() => parseH01Card({ ...clone(), status: 'Reviewed.' })).toThrow(/status: the status sentence differs/);
    expect(() => parseH01Card({ ...clone(), facts_by_source_version: { accepted_manuscript_pmc: 1, release_page: 9, version_of_record_abstract: 4 } })).toThrow(/facts_by_source_version\.accepted_manuscript_pmc/);
    expect(() => parseH01Card({ ...clone(), must_not_imply: [] })).toThrow(/must_not_imply/);
  });

  it('refuses an address on another host, a claimed human review and an unknown key', () => {
    expect(() => parseH01Card({ ...clone(), release_page: 'https://example.org/landing.html' })).toThrow(/release_page: .* expected host/);
    const reviewed = clone();
    (reviewed.facts[0] as unknown as Record<string, unknown>).human_review = 'yes';
    expect(() => parseH01Card(reviewed)).toThrow(/facts\[0\]\.human_review/);
    expect(() => parseH01Card({ ...clone(), donor: 'unknown' })).toThrow(/unexpected key "donor"/);
  });

  it('requires one visitor sentence for each drafting note, AI-drafted, and none of the drafting voice', () => {
    const card = parseH01Card(h01File);
    expect(card.visitor_caveats.map((caveat) => caveat.must_not_imply_index)).toEqual(card.must_not_imply.map((_note, index) => index));
    expect(card.visitor_caveats.filter((caveat) => caveat.drafted_by !== 'ai' || /\bmust not\b|(^|\. )Do not\b|\bthe card\b/.test(caveat.text))).toEqual([]);
    const missing = clone();
    missing.visitor_caveats = missing.visitor_caveats.slice(1);
    expect(() => parseH01Card(missing)).toThrow(/visitor_caveats: each drafting note needs exactly one visitor sentence/);
    const doubled = clone();
    doubled.visitor_caveats[1].must_not_imply_index = 0;
    expect(() => parseH01Card(doubled)).toThrow(/visitor_caveats/);
    const without = clone() as unknown as Record<string, unknown>;
    delete without.visitor_caveats;
    expect(() => parseH01Card(without)).toThrow(/missing key "visitor_caveats"/);
  });
});
