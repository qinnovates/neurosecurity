import { describe, expect, it } from 'vitest';
import { buildSearchIndex, filterSearch } from './search-index';

const named = { id: 'T1', name: 'Public technique', sessions: ['private'], eeg: 'private', incidents: 'private', savedProfiles: 'private', dataset: 'private' };
const index = buildSearchIndex([named], [{ id: 'r1', name: 'Motor cortex' }], [{ id: 'N1', name: 'Spinal cord' }]);
describe('public search index', () => {
  it('filters case insensitively by all words, name and id', () => {
    expect(filterSearch(index, ' CORTEX motor ')).toEqual([index[1]]);
    expect(filterSearch(index, 'n1')).toEqual([index[2]]);
    expect(filterSearch(index, 'missing')).toEqual([]);
  });
  it('groups hits and links techniques to their existing detail route', () => {
    expect(filterSearch(index, '').map((hit) => hit.kind)).toEqual(['TARA technique', 'region', 'band']);
    expect(index[0].href).toBe('/atlas/tara/T1/');
  });
  it('projects only public allowlisted fields even if input includes private data', () => {
    expect(Object.keys(index[0]).sort()).toEqual(['href', 'id', 'kind', 'name']);
    expect(JSON.stringify(index)).not.toContain('private');
    expect(Object.keys(index[1]).sort()).toEqual(['id', 'kind', 'name']);
  });
});
