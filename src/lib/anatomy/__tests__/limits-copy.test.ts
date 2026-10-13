import { describe, expect, it } from 'vitest';
import { LIMIT_TEMPLATES, LimitValueError, isLimitId, limitSentence, matchesLimitTemplate, type LimitId } from '../limits-copy';

const LIMIT_IDS = Object.keys(LIMIT_TEMPLATES) as LimitId[];
const MAX_SENTENCES = 3;
/** Words that would say a signal moves or that one place acts on another. No limit sentence may use them. */
const DIRECTION_WORDS = /\b(flows?|travels?|propagates?|spreads?|upstream|downstream|projects? to|sends?|drives?)\b|[→←↔]/i;
const SPECIALIST_WORDS = /\b(parcellation|tractography|delineation|ontology|homolog|voxel)\b/i;

describe('limit sentences', () => {
  it('are held word for word, so any change of wording is a visible diff', () => {
    expect(LIMIT_TEMPLATES).toMatchSnapshot();
  });

  it('are short, end as sentences and use plain words', () => {
    expect(LIMIT_IDS.length).toBeGreaterThan(40);
    for (const id of LIMIT_IDS) {
      const template: string = LIMIT_TEMPLATES[id];
      const sentences = template.replace(/\{[a-z_]+\}$/, 'x.').split(/[.?!](?:"|\s|$)/).filter((part) => part.trim().length > 0);
      expect(sentences.length, id).toBeLessThanOrEqual(MAX_SENTENCES);
      // One sentence denies that the order shows a direction, and has to name what it denies.
      if (id !== 'band_order') expect(template, id).not.toMatch(DIRECTION_WORDS);
      expect(template, id).not.toMatch(SPECIALIST_WORDS);
    }
  });

  it('never call unlinked regions safe or low', () => {
    expect(LIMIT_TEMPLATES.lens_niss).toContain('"no data", not "low"');
    expect(LIMIT_TEMPLATES.lens_no_data).toContain('does not mean low');
    expect(LIMIT_TEMPLATES.techniques_none).toContain('does not mean the region is safe');
  });

  it('fill their values from what they are given', () => {
    expect(limitSentence('techniques_band_level', { band: 'N6' })).toEqual({ id: 'techniques_band_level', text: 'Tagged with band N6; the catalog\'s text names no structure. This is not a link to this region.' });
    expect(limitSentence('lens_band').text).toBe(LIMIT_TEMPLATES.lens_band);
  });

  it('refuse to leave a hole where a value is missing or blank', () => {
    expect(() => limitSentence('techniques_band_level', { band: ' ' })).toThrow(LimitValueError);
    expect(() => limitSentence('techniques_band_level', {} as { band: string })).toThrow(/needs a non-empty value for \{band\}/);
  });

  it('recognise their own output and nothing else', () => {
    for (const id of LIMIT_IDS) expect(matchesLimitTemplate(id, LIMIT_TEMPLATES[id].replace(/\{[a-z_]+\}/g, 'a (value).')), id).toBe(true);
    expect(matchesLimitTemplate('lens_niss', `${LIMIT_TEMPLATES.lens_niss} Trust it.`)).toBe(false);
    expect(matchesLimitTemplate('lens_niss', LIMIT_TEMPLATES.lens_niss.replace('unreviewed', 'validated'))).toBe(false);
    expect(matchesLimitTemplate('techniques_band_level', 'Linked to band N6; the catalog names it.')).toBe(false);
    expect(isLimitId('lens_niss')).toBe(true);
    expect(isLimitId('made_up')).toBe(false);
  });
});
