import { describe, it, expect } from 'vitest';
import registrar from '@shared/qtara-registrar.json';
import {
  getCatalogCoverage,
  PURPOSE_AND_LIMITS,
  STATEMENT_LINKS,
  PURPOSE_ONE_SENTENCE,
  PURPOSE_SUMMARY,
} from '@/lib/purpose-and-limits';

type RegistrarTechnique = { id: string; niss?: unknown; tara?: { engineering?: { detection?: string } } };
const techniques = (registrar as { techniques: RegistrarTechnique[] }).techniques;

describe('catalog coverage', () => {
  const coverage = getCatalogCoverage();

  it('counts detection guidance from tara.engineering.detection in the registrar', () => {
    const withDetection = techniques.filter((technique) => (technique.tara?.engineering?.detection ?? '').trim().length > 0);
    expect(coverage.total).toBe(techniques.length);
    expect(coverage.detected).toBe(withDetection.length);
  });

  it('lists exactly the techniques without detection guidance', () => {
    expect(coverage.detected + coverage.withoutDetection.length).toBe(coverage.total);
    for (const technique of coverage.withoutDetection) {
      expect((technique.tara?.engineering?.detection ?? '').trim()).toBe('');
    }
  });

  it('counts NISS scores from techniques that carry a niss block', () => {
    expect(coverage.scored).toBe(techniques.filter((technique) => technique.niss).length);
  });
});

describe('purpose and limits statement', () => {
  it('resolves every link a statement segment names', () => {
    for (const section of PURPOSE_AND_LIMITS.sections) {
      for (const segment of section.segments) {
        if (segment.link) expect(STATEMENT_LINKS[segment.link]).toBeTruthy();
      }
    }
  });

  it('keeps the status qualifiers in the short forms', () => {
    expect(PURPOSE_ONE_SENTENCE).toMatch(/proposed, unvalidated/);
    expect(PURPOSE_SUMMARY).toMatch(/unvalidated/);
    expect(PURPOSE_SUMMARY).toMatch(/not .*compliance tool/);
  });
});
