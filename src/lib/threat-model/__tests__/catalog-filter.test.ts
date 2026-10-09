import { describe, it, expect } from 'vitest';
import { BAND_ORDER } from '../catalog-types';
import {
  EMPTY_CATALOG_FILTERS, buildCatalogFilterContext, countCatalogFacets, countScopeTermsShown, entryPathOf, filterCatalog, isCatalogFiltered,
} from '../catalog-filter';
import { describeEvidence } from '../evidence-levels';
import { nearestNames } from '../nearest-names';
import { PLACED_ENTRY_PATHS } from '../reference-data-types';
import { loadEngineBundle, loadReferenceData } from './load-test-data';

const bundle = loadEngineBundle();
const { techniques, precedentCves } = bundle.engineData;
const { placementRules } = loadReferenceData(bundle);
const onDevice = new Set(Object.keys(placementRules.placements).slice(0, 5));
const context = buildCatalogFilterContext(bundle.engineData, placementRules, onDevice);
const shownFor = (text: string) => filterCatalog(techniques, { ...EMPTY_CATALOG_FILTERS, text }, context);

describe('catalog filters', () => {
  it('lets everything through when empty', () => {
    expect(filterCatalog(techniques, EMPTY_CATALOG_FILTERS, context)).toHaveLength(techniques.length);
    expect(isCatalogFiltered(EMPTY_CATALOG_FILTERS)).toBe(false);
    expect(isCatalogFiltered({ ...EMPTY_CATALOG_FILTERS, bandIds: ['N3'] })).toBe(true);
  });

  it('combines filters, and each one narrows the result', () => {
    const label = describeEvidence(techniques[0]).label;
    const byEvidence = filterCatalog(techniques, { ...EMPTY_CATALOG_FILTERS, evidence: [label] }, context);
    expect(byEvidence.every((technique) => describeEvidence(technique).label === label)).toBe(true);
    const narrower = filterCatalog(techniques, { ...EMPTY_CATALOG_FILTERS, evidence: [label], severities: ['critical'] }, context);
    expect(narrower.length).toBeLessThanOrEqual(byEvidence.length);
    expect(narrower.every((technique) => technique.severity === 'critical')).toBe(true);
  });

  it('sorts every technique into exactly one scope term', () => {
    const counts = countCatalogFacets(techniques, EMPTY_CATALOG_FILTERS, context).placement;
    expect([...counts.values()].reduce((sum, count) => sum + count, 0)).toBe(techniques.length);
    expect(counts.get('applies')).toBe(onDevice.size);
    expect(counts.get('would_apply_if')).toBe(Object.keys(placementRules.placements).length - onDevice.size);
    expect(counts.get('reviewed_outside')).toBe(Object.keys(placementRules.notPlaced).length);
  });

  it('counts a facet with the other filters applied and its own cleared', () => {
    const filters = { ...EMPTY_CATALOG_FILTERS, severities: ['critical' as const], modes: ['R' as const] };
    const counts = countCatalogFacets(techniques, filters, context);
    const criticalOfAnyMode = techniques.filter((technique) => technique.severity === 'critical');
    expect(counts.modes.get('M') ?? 0).toBe(criticalOfAnyMode.filter((technique) => technique.mode === 'M').length);
    const readOfAnySeverity = techniques.filter((technique) => technique.mode === 'R');
    expect(counts.severities.get('high') ?? 0).toBe(readOfAnySeverity.filter((technique) => technique.severity === 'high').length);
  });
});

describe('text search', () => {
  it('finds a technique by id, name or alias, ignoring case', () => {
    const target = techniques[3];
    expect(shownFor(target.id.toLowerCase())).toContain(target);
    expect(shownFor(target.name.toUpperCase())).toContain(target);
    expect(shownFor('zzz-no-such-technique')).toEqual([]);
  });

  it('returns more than zero for "bluetooth"', () => {
    expect(shownFor('bluetooth').length).toBeGreaterThan(0);
  });

  it('reads the detection note and the sources', () => {
    const withNote = techniques.find((technique) => technique.detection !== null);
    const withSource = techniques.find((technique) => technique.sources.length > 0);
    if (withNote === undefined || withNote.detection === null || withSource === undefined) throw new Error('test setup: the catalog has no detection note or no source');
    expect(shownFor(withNote.detection)).toContain(withNote);
    expect(shownFor(withSource.sources[0])).toContain(withSource);
  });

  it('finds every technique a CVE is linked to by the CVE id and by its product name', () => {
    const [cve] = precedentCves;
    const linked = techniques.filter((technique) => cve.techniqueIds.includes(technique.id));
    expect(linked.length).toBeGreaterThan(0);
    expect(shownFor(cve.cveId)).toEqual(linked);
    for (const technique of linked) expect(shownFor(cve.product)).toContain(technique);
  });
});

describe('band and entry-path facets', () => {
  const facets = countCatalogFacets(techniques, EMPTY_CATALOG_FILTERS, context);

  it('counts distinct techniques per band, in band order', () => {
    expect(facets.bands.slice(0, BAND_ORDER.length).map((entry) => entry.bandId)).toEqual([...BAND_ORDER]);
    for (const { bandId, count } of facets.bands) expect(count, bandId).toBe(techniques.filter((technique) => technique.bandIds.includes(bandId)).length);
    expect(facets.bands.find((entry) => entry.bandId === 'N3')?.count).toBe(techniques.filter((technique) => technique.bandIds.includes('N3')).length);
  });

  it('selects several bands at once, and a technique in two of them is shown once', () => {
    const shown = filterCatalog(techniques, { ...EMPTY_CATALOG_FILTERS, bandIds: ['N3', 'N4'] }, context);
    expect(shown).toEqual(techniques.filter((technique) => technique.bandIds.includes('N3') || technique.bandIds.includes('N4')));
    expect(new Set(shown).size).toBe(shown.length);
  });

  it('takes the entry path from the placement table', () => {
    for (const entryPath of PLACED_ENTRY_PATHS) {
      const expected = Object.values(placementRules.placements).filter((placement) => placement.entryPath === entryPath).length;
      expect(facets.entryPaths.get(entryPath) ?? 0, entryPath).toBe(expected);
    }
    expect(facets.entryPaths.get('around_device')).toBe(Object.keys(placementRules.notPlaced).length);
    const senses = filterCatalog(techniques, { ...EMPTY_CATALOG_FILTERS, entryPaths: ['senses'] }, context);
    expect(senses.every((technique) => entryPathOf(technique.id, placementRules) === 'senses')).toBe(true);
    expect(senses.length).toBeGreaterThan(0);
  });
});

describe('the counts line', () => {
  it('counts the techniques shown under each scope term, and says whether the placement facet is on', () => {
    const off = countScopeTermsShown(techniques, EMPTY_CATALOG_FILTERS, context);
    expect(off.isPlacementFacetOn).toBe(false);
    expect(off.shown).toBe(techniques.length);
    expect(off.byTerm.applies + off.byTerm.would_apply_if + off.byTerm.reviewed_outside + off.byTerm.not_assessed).toBe(techniques.length);
    const filters = { ...EMPTY_CATALOG_FILTERS, placement: ['applies' as const, 'not_assessed' as const], severities: ['critical' as const] };
    const on = countScopeTermsShown(techniques, filters, context);
    const critical = techniques.filter((technique) => technique.severity === 'critical');
    expect(on).toEqual({
      isPlacementFacetOn: true,
      shown: critical.filter((technique) => ['applies', 'not_assessed'].includes(context.placementOf(technique.id))).length,
      byTerm: {
        applies: critical.filter((technique) => context.placementOf(technique.id) === 'applies').length,
        would_apply_if: 0,
        reviewed_outside: 0,
        not_assessed: critical.filter((technique) => context.placementOf(technique.id) === 'not_assessed').length,
      },
    });
  });
});

describe('nearestNames', () => {
  const known = ['techniques', 'tactics', 'devices', 'my_risks', 'my_chain_steps'];

  it('suggests the name someone probably meant', () => {
    expect(nearestNames('technique', known)[0]).toBe('techniques');
    expect(nearestNames('devics', known)).toContain('devices');
    expect(nearestNames('risks', known)).toContain('my_risks');
  });

  it('suggests nothing when nothing is close, or nothing was typed', () => {
    expect(nearestNames('zzzzzzzzzz', known)).toEqual([]);
    expect(nearestNames('  ', known)).toEqual([]);
  });
});
