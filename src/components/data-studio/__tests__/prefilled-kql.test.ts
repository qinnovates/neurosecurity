import { describe, expect, it } from 'vitest';
import { regionKqlHref } from '@/lib/atlas-explorer/region-kql';
import { readPrefilledKql } from '../prefilled-kql';

const QUERY = 'brain_regions | where id == "m1"';

describe('readPrefilledKql', () => {
  it('reads back what a dossier link writes', () => {
    expect(readPrefilledKql(new URL(regionKqlHref(QUERY), 'https://qinnovate.com').search)).toBe(QUERY);
  });

  it('asks for nothing when the address has no query', () => {
    expect(readPrefilledKql('')).toBeNull();
    expect(readPrefilledKql('?kql=%20%20')).toBeNull();
    expect(readPrefilledKql('?other=1')).toBeNull();
  });

  it('refuses a value that is too long or holds control characters, and shows none of it', () => {
    expect(readPrefilledKql(`?kql=${'a'.repeat(1_001)}`)).toBeNull();
    expect(readPrefilledKql('?kql=techniques%0Atechniques')).toBeNull();
    expect(readPrefilledKql('?kql=techniques%00')).toBeNull();
  });
});
