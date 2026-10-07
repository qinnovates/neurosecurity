import { describe, it, expect } from 'vitest';
import { EMPTY_CATALOG_FILTERS, countCatalogFacets, filterCatalog, isCatalogFiltered, placementStateOf, type PlacementState } from '../catalog-filter';
import { describeEvidence } from '../evidence-levels';
import { HIDDEN_COLUMNS, HIDDEN_TABLES, applyLabTablePolicy } from '../lab-table-policy';
import { nearestNames } from '../nearest-names';
import { loadEngineBundle, loadReferenceData } from './load-test-data';

const bundle = loadEngineBundle();
const { techniques } = bundle.engineData;
const { placementRules } = loadReferenceData(bundle);
const onDevice = new Set(Object.keys(placementRules.placements).slice(0, 5));
const placementOf = (techniqueId: string): PlacementState => placementStateOf(techniqueId, placementRules, onDevice);

describe('catalog filters', () => {
  it('lets everything through when empty', () => {
    expect(filterCatalog(techniques, EMPTY_CATALOG_FILTERS, placementOf)).toHaveLength(techniques.length);
    expect(isCatalogFiltered(EMPTY_CATALOG_FILTERS)).toBe(false);
  });

  it('combines filters, and each one narrows the result', () => {
    const label = describeEvidence(techniques[0]).label;
    const byEvidence = filterCatalog(techniques, { ...EMPTY_CATALOG_FILTERS, evidence: [label] }, placementOf);
    expect(byEvidence.every((technique) => describeEvidence(technique).label === label)).toBe(true);
    const narrower = filterCatalog(techniques, { ...EMPTY_CATALOG_FILTERS, evidence: [label], severities: ['critical'] }, placementOf);
    expect(narrower.length).toBeLessThanOrEqual(byEvidence.length);
    expect(narrower.every((technique) => technique.severity === 'critical')).toBe(true);
  });

  it('finds a technique by id, name or alias, ignoring case', () => {
    const target = techniques[3];
    expect(filterCatalog(techniques, { ...EMPTY_CATALOG_FILTERS, text: target.id.toLowerCase() }, placementOf)).toContain(target);
    expect(filterCatalog(techniques, { ...EMPTY_CATALOG_FILTERS, text: 'zzz-no-such-technique' }, placementOf)).toEqual([]);
  });

  it('sorts every technique into exactly one placement state', () => {
    const counts = countCatalogFacets(techniques, EMPTY_CATALOG_FILTERS, placementOf).placement;
    expect([...counts.values()].reduce((sum, count) => sum + count, 0)).toBe(techniques.length);
    expect(counts.get('placed-here')).toBe(onDevice.size);
    expect(counts.get('not-placed')).toBe(Object.keys(placementRules.notPlaced).length);
  });

  it('counts a facet with the other filters applied and its own cleared', () => {
    const filters = { ...EMPTY_CATALOG_FILTERS, severities: ['critical' as const], modes: ['R' as const] };
    const counts = countCatalogFacets(techniques, filters, placementOf);
    const criticalOfAnyMode = techniques.filter((technique) => technique.severity === 'critical');
    expect(counts.modes.get('M') ?? 0).toBe(criticalOfAnyMode.filter((technique) => technique.mode === 'M').length);
    const readOfAnySeverity = techniques.filter((technique) => technique.mode === 'R');
    expect(counts.severities.get('high') ?? 0).toBe(readOfAnySeverity.filter((technique) => technique.severity === 'high').length);
  });
});

describe('lab table policy', () => {
  const tables = {
    risk_profile: [{ company: 'Example Co', security_score: '0/4', risk_index: 13.4 }],
    companies: [{ name: 'Example Co', founded: '2016', security_posture: 'none_published', security_notes: 'text' }],
    devices: [{ device: 'Example Device', channels: 1024, cve_count: 0, security_posture: 'none_published' }],
    comms: [{ device: 'Example Device', wireless_protocol: 'Bluetooth Low Energy', data_link_risk: 'HIGH' }],
    techniques: [{ id: 'QIF-T0001', severity: 'high' }],
  };

  it('leaves out tables that score named companies', () => {
    const allowed = applyLabTablePolicy(tables);
    for (const hidden of HIDDEN_TABLES) expect(allowed[hidden]).toBeUndefined();
  });

  it('keeps specifications and drops posture, scores and counts', () => {
    const allowed = applyLabTablePolicy(tables);
    expect(allowed.companies).toEqual([{ name: 'Example Co', founded: '2016' }]);
    expect(allowed.devices).toEqual([{ device: 'Example Device', channels: 1024 }]);
    expect(allowed.comms).toEqual([{ device: 'Example Device', wireless_protocol: 'Bluetooth Low Energy' }]);
    for (const [table, columns] of Object.entries(HIDDEN_COLUMNS)) {
      for (const row of allowed[table] ?? []) for (const column of columns) expect(row).not.toHaveProperty(column);
    }
  });

  it('passes every other table through untouched', () => {
    expect(applyLabTablePolicy(tables).techniques).toEqual(tables.techniques);
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
