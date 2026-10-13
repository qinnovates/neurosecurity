import { describe, expect, it } from 'vitest';
import { loadAnatomyBundle, loadAnatomyData } from '@/components/atlas-scene/load-anatomy-data';
import type { AnatomyIndex } from '../anatomy-index-types';
import { parseAnatomyFiles } from '../anatomy-inputs';
import { buildAnatomyBundle } from '../build-anatomy-index';
import type { EvidenceBlock } from '../evidence';
import { buildLeadShape } from '../lead-spans';
import { LEAD_DIMENSION_FIELDS } from '../parse-device-geometry';
import { SOURCE_REF_STATES, checkSourceRef } from '../source-ref';
import { DEVICE_GEOMETRY_STATUS } from '../status-sentences';
import { buildRawFiles } from './raw-files-fixture';

/**
 * The committed device geometry: a head surface, landmarks and electrodes placed on it, and leads
 * as sizes with sources. These rows are AI-drafted. No person has checked where the landmarks
 * landed, and nothing here says what brain tissue lies under an electrode or around a lead.
 */
const ELECTRODE_IDS = ['Fpz', 'Fp1', 'Fp2', 'F7', 'F3', 'Fz', 'F4', 'F8', 'T7', 'C3', 'Cz', 'C4', 'T8', 'P7', 'P3', 'Pz', 'P4', 'P8', 'O1', 'Oz', 'O2'];
const LEAD_CONTACT_SPANS_MM = { medtronic_3387: 10.5, medtronic_3389: 7.5, boston_scientific_db_2201: 15.5 };
const HEAD_SURFACE_BUDGET_BYTES = 50_000;
const REGION_WORD = /region|structure|gyrus|cortex|nucleus/i;

const data = loadAnatomyData();
const index = JSON.parse(loadAnatomyBundle().indexJson) as AnatomyIndex;

function listKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(listKeys);
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) => [key, ...listKeys(child)]);
}

describe('the committed device geometry (guard)', () => {
  it('ships one light head surface on the devices layer, and the layout sits on it', () => {
    const headSurfaces = (data.manifest?.assets ?? []).filter((asset) => asset.layer === 'devices');
    expect(headSurfaces.map((asset) => asset.id)).toEqual(['scalp']);
    expect(headSurfaces[0].bytes).toBeLessThanOrEqual(HEAD_SURFACE_BUDGET_BYTES);
    expect(headSurfaces[0].delineation.hemispheres).toBe('not_applicable');
    expect(index.devices.electrode_layouts.map((layout) => layout.scalp_asset_id)).toEqual(['scalp']);
    expect(index.devices.fiducial_space).toBe(data.sources.declared_space);
  });

  it('lists the 21 positions of the 10-20 layout, left names on the left and right names on the right', () => {
    const [layout] = index.devices.electrode_layouts;
    expect(layout.electrodes.map((electrode) => electrode.id)).toEqual(ELECTRODE_IDS);
    for (const electrode of layout.electrodes) {
      const digit = Number(electrode.id.slice(-1));
      if (Number.isNaN(digit)) expect(Math.abs(electrode.position_mm[0])).toBeLessThan(2);
      else expect(Math.sign(electrode.position_mm[0])).toBe(digit % 2 === 1 ? -1 : 1);
    }
    expect(layout.electrodes.filter((electrode) => electrode.also_called !== null).map((electrode) => `${electrode.id}=${electrode.also_called}`)).toEqual(['T7=T3', 'T8=T4', 'P7=T5', 'P8=T6']);
  });

  it('draws nothing until a person has reviewed it: no ledger entry covers a landmark, the layout or a lead', () => {
    expect(data.deviceGeometry.status).toBe(DEVICE_GEOMETRY_STATUS);
    expect(index.devices.electrode_layouts.map((layout) => layout.drawable)).toEqual([false]);
    expect(index.devices.leads.map((lead) => lead.drawable)).toEqual([false, false, false]);
    const states = [...index.devices.fiducials, ...index.devices.electrode_layouts, ...index.devices.leads].map((row) => row.review_state.state);
    expect(new Set(states)).toEqual(new Set(['ai_drafted_unreviewed']));
    expect(states).toHaveLength(4 + 1 + 3);
  });

  it('gives no electrode or lead a brain region, and adds no device-to-region link of its own', () => {
    const { stated_targets: statedTargets, ...geometry } = index.devices;
    expect(listKeys(geometry).filter((key) => REGION_WORD.test(key))).toEqual([]);
    expect(listKeys(data.deviceGeometry).filter((key) => REGION_WORD.test(key))).toEqual([]);
    const recorded = (data.atlas as { device_region_mappings: unknown[] }).device_region_mappings;
    expect(statedTargets).toHaveLength(recorded.length);
    expect(recorded.length).toBeGreaterThan(0);
  });

  it('carries each lead as sizes with a source for every one of them, and nothing that places it', () => {
    expect(data.deviceGeometry.leads.map((lead) => lead.id)).toEqual(Object.keys(LEAD_CONTACT_SPANS_MM));
    for (const lead of data.deviceGeometry.leads) {
      for (const field of LEAD_DIMENSION_FIELDS) expect(lead.sources.some((source) => source.supports?.includes(field)), `${lead.id} ${field}`).toBe(true);
      expect(lead.sources.every((source) => source.kind !== undefined)).toBe(true);
      expect(buildLeadShape(lead).contact_span_mm).toBe(LEAD_CONTACT_SPANS_MM[lead.id as keyof typeof LEAD_CONTACT_SPANS_MM]);
    }
    expect(listKeys(index.devices.leads).filter((key) => /position|mm$/.test(key) && !/^(contact_length_mm|contact_spacing_mm|diameter_mm)$/.test(key))).toEqual([]);
  });

  it('rests the landmarks and the layout on the head surface, whose note still says what each row quotes', () => {
    const blocks = [data.deviceGeometry.fiducial_set?.evidence, ...data.deviceGeometry.electrode_layouts.map((layout) => layout.evidence)];
    expect(blocks).toHaveLength(2);
    for (const evidence of blocks) {
      expect(evidence).toMatchObject({ claim_basis: 'analyst_inference', check_status: 'unchecked' });
      expect(evidence === undefined ? null : checkSourceRef(evidence.source_ref, data.documentsByFile)).toBe(SOURCE_REF_STATES.QUOTE_FOUND);
      const stale = { ...(evidence as EvidenceBlock).source_ref, quote: 'the skin of a person' };
      expect(checkSourceRef(stale, data.documentsByFile)).toBe(SOURCE_REF_STATES.QUOTE_MISSING);
    }
  });

  it('keeps the variability figure as words with its source and how much of it was read', () => {
    expect(index.devices.facts).toHaveLength(1);
    expect(index.devices.facts[0]).toMatchObject({ id: 'electrode_to_cortex_variability', read_depth: 'abstract_only' });
    expect(index.devices.facts[0].statement).toMatch(/16 adults.*not this template/);
    expect(Object.keys(index.devices.facts[0]).sort()).toEqual(['citation', 'id', 'read_depth', 'statement', 'url']);
  });
});

describe('a layout that names a head surface the manifest does not ship', () => {
  it('stops the build', () => {
    const geometry = { ...structuredClone(data.deviceGeometry), leads: [], facts: [] };
    const raw = buildRawFiles({ deviceGeometry: { ...geometry, fiducial_space: 'FixtureSpace' } });
    expect(() => buildAnatomyBundle(parseAnatomyFiles(raw))).toThrow(/electrode_layouts\[0\]\.scalp_asset_id: "scalp" is not a head surface asset in the manifest/);
  });
});
