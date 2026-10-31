import { describe, expect, it } from 'vitest';
import hazardsFile from '@shared/qif-hazards.json';
import { loadCompanionJson } from '@/components/atlas-scene/load-anatomy-data';
import { buildIndexes, executeQuery } from '@/lib/kql-engine';
import { getKqlTables } from '@/lib/kql-tables';
import { REGION_DOSSIER_PATH, parseRegionDossier } from '../dossier-file';
import { listLitLinks } from '../explorer-model';
import { buildRegionDetail, type RegionDetail } from '../region-detail';
import { buildRegionKqlQuery, regionKqlHref } from '../region-kql';
import { loadRealModel } from './explorer-fixtures';

const model = loadRealModel();
const served = loadCompanionJson(REGION_DOSSIER_PATH);
const file = parseRegionDossier(JSON.parse(served));
const detailOf = (regionId: string): RegionDetail => {
  const detail = buildRegionDetail(model, regionId, file);
  if (detail === null) throw new Error(`The real index holds no region ${regionId}.`);
  return detail;
};
const details = model.regions.map((region) => detailOf(region.id));
const emptyRegion = details.find((detail) => detail.linked.length === 0 && detail.namedNotCounted.length === 0 && detail.region.band_ids[0] === 'N7');
const litRegionId = model.regions.find((region) => listLitLinks(model, region.id).length > 0)?.id ?? '';
const taggedN7 = model.index.techniques.filter((technique) => technique.band_ids.includes('N7')).length;

describe('the dossier\'s fields on RegionDetail', () => {
  it('reads null until the file has arrived, so "not loaded" never reads as "none recorded"', () => {
    const unloaded = buildRegionDetail(model, 'm1');
    expect(unloaded).toMatchObject({ controls: null, hazards: null, chainSteps: null, deviceGroups: null, companies: null, cves: null, conditions: null, layerName: null });
    expect(unloaded?.linked.every((technique) => technique.facts === null)).toBe(true);
    expect(unloaded?.pathways.every((pathway) => pathway.naming === null)).toBe(true);
    expect(detailOf('m1').hazards?.length).toBeGreaterThan(0);
  });

  it('files controls and hazards by the region\'s own band and by nothing narrower', () => {
    for (const detail of details) {
      const [band] = detail.region.band_ids;
      expect(detail.controls?.map((controls) => controls.band_id)).toEqual([band]);
      const expected = hazardsFile.hazards.filter((hazard) => hazard.bands.includes(band)).map((hazard) => hazard.id);
      expect(detail.hazards?.map((hazard) => hazard.id)).toEqual(expected);
    }
  });

  it('holds every region\'s layer name, read through layerOf', () => {
    expect(details.filter((detail) => detail.layerName === null)).toEqual([]);
    expect(detailOf('m1').layerName).toBe('Neocortex');
  });

  it('counts a band-inherited technique only when it does not name this structure', () => {
    expect(emptyRegion?.bandInheritedCount).toBe(taggedN7);
    const litInN7 = details.find((detail) => detail.region.band_ids[0] === 'N7' && detail.linked.length > 0);
    expect(litInN7?.bandInheritedCount).toBeLessThan(taggedN7);
  });

  it('brings companies in through devices alone, one entry each', () => {
    for (const detail of details) {
      const companyNames = detail.deviceGroups?.flatMap((group) => group.devices).flatMap((device) => device.company?.name ?? []) ?? [];
      expect(detail.companies?.map((company) => company.name).sort()).toEqual([...new Set(companyNames)].sort());
    }
  });

  it('marks tiers by outline, and gives every shown technique a record in the file', () => {
    const shown = details.flatMap((detail) => [...detail.linked, ...detail.namedNotCounted]);
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.filter((technique) => technique.facts === null)).toEqual([]);
    const marks = new Map(shown.map((technique) => [technique.facts?.evidenceTier, technique.facts?.tierMark]));
    for (const [tier, mark] of marks) {
      if (tier?.startsWith('demonstrated') === true) expect(mark).toBe('solid');
      if (tier?.startsWith('theoretical') === true) expect(mark).toBe('dashed');
      if (tier === 'speculative') expect(mark).toBe('dotted');
    }
  });

  it('states a folded neuroright as folded, never as the code it folds into', () => {
    const rights = details.flatMap((detail) => detail.neurorights);
    expect(rights.length).toBeGreaterThan(0);
    for (const right of rights.filter((entry) => entry.code === 'DI')) expect(right).toMatchObject({ name: 'Dynamical Integrity', foldsInto: 'Mental Integrity' });
  });

  it('gives each pathway the file\'s own word for this end', () => {
    const naming = details.flatMap((detail) => detail.pathways.map((pathway) => pathway.naming));
    expect(naming.length).toBeGreaterThan(0);
    expect(naming.filter((word) => word === null)).toEqual([]);
  });

  it('joins a CVE to the technique it is mapped to and to no other', () => {
    const [{ id }] = file.techniques.filter((technique) => (model.linksByRegion.get('m1') ?? []).some((regionLink) => regionLink.technique.id === technique.id));
    const withCve = { ...file, techniques: file.techniques.map((technique) => (technique.id === id ? { ...technique, cve_ids: ['CVE-2000-0001'] } : technique)) };
    expect(buildRegionDetail(model, 'm1', withCve)?.cves).toEqual([{ id: 'CVE-2000-0001', techniqueId: id }]);
    expect(buildRegionDetail(model, 'a1', withCve)?.cves).toEqual([]);
  });

  it('carries no product name out of the CVE mapping', () => {
    expect(served).not.toMatch(/Natus|NeuroWorks|Xltek/);
    expect(file.techniques.flatMap((technique) => technique.cve_ids).every((id) => /^CVE-\d{4}-\d+$/.test(id))).toBe(true);
  });
});

describe('kqlQuery', () => {
  const tables = getKqlTables();
  const indexes = buildIndexes(tables);

  it('runs on the real tables for every region and never opens on an empty table', () => {
    for (const detail of details) {
      const { rows, error } = executeQuery(detail.kqlQuery, tables, indexes, { strictColumns: true });
      expect(error, detail.region.id).toBeNull();
      expect(rows.length, detail.region.id).toBeGreaterThan(0);
    }
  });

  it('joins through the technique links only for a region that has one', () => {
    expect(detailOf(litRegionId).kqlQuery).toContain('join anatomy_technique_terms');
    expect(buildRegionKqlQuery('pfc', false)).not.toContain('anatomy_technique_terms');
  });

  it('quotes the region id and encodes the whole query in the link', () => {
    expect(buildRegionKqlQuery('a"b', false)).toContain(String.raw`id == "a\"b"`);
    expect(regionKqlHref('x == "1"')).toBe('/data-studio/?kql=x+%3D%3D+%221%22');
  });
});
