import { describe, expect, it } from 'vitest';
import { AnatomyDataError } from '../errors';
import { buildLeadShape } from '../lead-spans';
import { parseDeviceGeometry, type DeviceLead } from '../parse-device-geometry';
import { parseReviewLedger } from '../parse-review-ledger';
import { deviceRowKey, digestDeviceRow } from '../row-digest';
import { DEVICE_GEOMETRY_STATUS, REVIEW_LEDGER_STATUS } from '../status-sentences';
import { FIXTURE_SPACE } from './anatomy-fixtures';

const LEAD: DeviceLead = {
  id: 'fixture_lead',
  name: 'Fixture lead',
  contacts: 4,
  contact_length_mm: 1.5,
  contact_spacing_mm: 0.5,
  spacing_measure: 'edge_to_edge',
  diameter_mm: 1.27,
  sources: [{ citation: 'Fixture summary of safety data, Table 2', url: 'https://example.org/ssed.pdf', quote: 'the electrodes are spaced 0.5 mm apart' }],
  drafted_by: 'ai',
};
const FIDUCIAL = { id: 'nasion', position_mm: [0, 85, -40] };

function buildFile(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { schema_version: 1, status: DEVICE_GEOMETRY_STATUS, fiducial_space: null, fiducials: [], leads: [], ...overrides };
}

describe('parseDeviceGeometry', () => {
  it('accepts an empty file and a file with a lead', () => {
    expect(parseDeviceGeometry(buildFile(), FIXTURE_SPACE)).toMatchObject({ fiducials: [], leads: [] });
    expect(parseDeviceGeometry(buildFile({ leads: [LEAD] }), FIXTURE_SPACE).leads[0].id).toBe('fixture_lead');
  });

  it('rejects fiducials that do not name the declared space', () => {
    expect(() => parseDeviceGeometry(buildFile({ fiducials: [FIDUCIAL] }), FIXTURE_SPACE))
      .toThrow(/fiducial_space: fiducials are coordinates, so the file must say they are in "FixtureSpace"/);
    expect(() => parseDeviceGeometry(buildFile({ fiducials: [FIDUCIAL], fiducial_space: 'ElsewhereSpace' }), FIXTURE_SPACE)).toThrow(/fiducial_space/);
    expect(parseDeviceGeometry(buildFile({ fiducials: [FIDUCIAL], fiducial_space: FIXTURE_SPACE }), FIXTURE_SPACE).fiducials).toHaveLength(1);
  });

  it('rejects an unknown fiducial, a fiducial listed twice and a malformed position', () => {
    const parseFiducials = (fiducials: unknown[]): unknown => parseDeviceGeometry(buildFile({ fiducials, fiducial_space: FIXTURE_SPACE }), FIXTURE_SPACE);
    expect(() => parseFiducials([{ ...FIDUCIAL, id: 'vertex' }])).toThrow(/fiducials\[0\]\.id: "vertex" is not an allowed value/);
    expect(() => parseFiducials([FIDUCIAL, FIDUCIAL])).toThrow(/fiducial "nasion" appears twice/);
    expect(() => parseFiducials([{ ...FIDUCIAL, position_mm: [0, 85] }])).toThrow(/position_mm: expected a point/);
  });

  it('rejects a lead with no source, a non-HTTPS source, a zero dimension or a duplicate id', () => {
    const parseLeads = (leads: unknown[]): unknown => parseDeviceGeometry(buildFile({ leads }), FIXTURE_SPACE);
    expect(() => parseLeads([{ ...LEAD, sources: [] }])).toThrow(/sources: a dimension must cite where it was read/);
    expect(() => parseLeads([{ ...LEAD, sources: [{ ...LEAD.sources[0], url: 'ftp://example.org/x' }] }])).toThrow(/sources\[0\]\.url/);
    expect(() => parseLeads([{ ...LEAD, diameter_mm: 0 }])).toThrow(/diameter_mm/);
    expect(() => parseLeads([LEAD, LEAD])).toThrow(/lead "fixture_lead" appears twice/);
  });

  it('rejects a review field, a band key, a drafter other than AI, an unknown schema version and a softened status', () => {
    expect(() => parseDeviceGeometry(buildFile({ leads: [{ ...LEAD, reviewed_by: 'owner-1' }] }), FIXTURE_SPACE)).toThrow(/unexpected key "reviewed_by"/);
    expect(() => parseDeviceGeometry(buildFile({ leads: [{ ...LEAD, band: 'I0' }] }), FIXTURE_SPACE)).toThrow(/must not store a QIF band/);
    expect(() => parseDeviceGeometry(buildFile({ leads: [{ ...LEAD, drafted_by: 'human' }] }), FIXTURE_SPACE)).toThrow(/drafted_by/);
    expect(() => parseDeviceGeometry(buildFile({ schema_version: 2 }), FIXTURE_SPACE)).toThrow(/schema_version/);
    expect(() => parseDeviceGeometry(buildFile({ status: 'Verified.' }), FIXTURE_SPACE)).toThrow(/status/);
    expect(() => parseDeviceGeometry(7, FIXTURE_SPACE)).toThrow(AnatomyDataError);
  });
});

const EVIDENCE = {
  claim_basis: 'analyst_inference', check_status: 'unchecked', rationale: 'Placed on the fixture head surface.',
  source_ref: { file: 'src/site/atlas-assets/manifest.json', pointer: '/assets/scalp/modification_note', quote: 'average head' },
};
const SET = { id: 'fixture_rules', scalp_asset_id: 'scalp', method: 'Placed by rule on the fixture head.', drafted_by: 'ai', evidence: EVIDENCE };
const FOUR_FIDUCIALS = [
  { id: 'nasion', position_mm: [0, 85, -40], method: 'front midline hollow' }, { id: 'inion', position_mm: [0, -120, -30] },
  { id: 'left_preauricular', position_mm: [-78, -28, -55] }, { id: 'right_preauricular', position_mm: [78, -28, -55] },
];
const LAYOUT = {
  id: '10-20', name: 'Fixture layout', scalp_asset_id: 'scalp', fiducial_set_id: 'fixture_rules', construction: 'Shares of measured arc length.', shown_by_default: true,
  electrodes: [{ id: 'Cz', position_mm: [0, -10, 100], arc: 'midline', share: 0.5 }, { id: 'T7', position_mm: [-85, -24, -17], arc: 'ear_to_ear', share: 0.1, also_called: 'T3' }],
  drafted_by: 'ai', evidence: EVIDENCE,
};
const FACT = {
  id: 'fixture_fact', statement: 'In one study the place varied.', citation: 'Fixture A. A study. 2009.', url: 'https://doi.org/10.1000/fixture', quote: 'a grand standard deviation',
  read_depth: 'abstract_only', drawable: false, drafted_by: 'ai',
};
const SOURCED = { ...LEAD.sources[0], kind: 'fda_document', supports: ['contacts', 'contact_length_mm', 'contact_spacing_mm', 'spacing_measure', 'diameter_mm'] };

describe('electrode layouts, sourced facts and lead sources', () => {
  const withScalp = (overrides: Record<string, unknown> = {}): Record<string, unknown> =>
    buildFile({ fiducial_space: FIXTURE_SPACE, fiducial_set: SET, fiducials: FOUR_FIDUCIALS, electrode_layouts: [LAYOUT], ...overrides });
  const parse = (file: Record<string, unknown>): ReturnType<typeof parseDeviceGeometry> => parseDeviceGeometry(file, FIXTURE_SPACE);

  it('reads a layout with its landmarks, the rule that placed a landmark and an older electrode name', () => {
    const parsed = parse(withScalp({ facts: [FACT] }));
    expect(parsed.electrode_layouts[0].electrodes.map((electrode) => electrode.id)).toEqual(['Cz', 'T7']);
    expect(parsed.electrode_layouts[0].electrodes[1].also_called).toBe('T3');
    expect(parsed.fiducials[0].method).toBe('front midline hollow');
    expect(parsed.fiducial_set?.scalp_asset_id).toBe('scalp');
    expect(parsed.facts[0].read_depth).toBe('abstract_only');
    expect(parse(buildFile())).toMatchObject({ fiducial_set: null, electrode_layouts: [], facts: [] });
  });

  it('rejects a layout that does not name the landmarks and head surface it was placed on', () => {
    expect(() => parse(withScalp({ electrode_layouts: [{ ...LAYOUT, fiducial_set_id: 'another_set' }] }))).toThrow(/fiducial_set_id: "another_set" is not the landmark record of this file/);
    expect(() => parse(withScalp({ electrode_layouts: [{ ...LAYOUT, scalp_asset_id: 'outline' }] }))).toThrow(/scalp_asset_id: "outline" is not the head surface the landmarks were found on/);
    const { fiducial_set: _set, ...withoutSet } = withScalp();
    expect(() => parse(withoutSet)).toThrow(/fiducial_set_id/);
    const { scalp_asset_id: _asset, ...unplaced } = LAYOUT;
    expect(() => parse(withScalp({ electrode_layouts: [unplaced] }))).toThrow(/missing key "scalp_asset_id"/);
    expect(() => parse(withScalp({ fiducials: FOUR_FIDUCIALS.slice(0, 3) }))).toThrow(/fiducials: an electrode layout needs all four landmarks/);
    const { evidence: _evidence, ...bare } = LAYOUT;
    expect(() => parse(withScalp({ electrode_layouts: [bare] }))).toThrow(/missing key "evidence"/);
    const { evidence: _setEvidence, ...bareSet } = SET;
    expect(() => parse(withScalp({ fiducial_set: bareSet }))).toThrow(/the landmark record carries no evidence block/);
    expect(() => parse(withScalp({ electrode_layouts: [{ ...LAYOUT, evidence: { ...EVIDENCE, check_status: 'verified' } }] }))).toThrow(/check_status/);
  });

  it('rejects an electrode that names a brain region, has no real name, sits at an arc end or appears twice', () => {
    const withElectrodes = (electrodes: unknown[]): Record<string, unknown> => withScalp({ electrode_layouts: [{ ...LAYOUT, electrodes }] });
    const cz = LAYOUT.electrodes[0];
    expect(() => parse(withElectrodes([{ ...cz, region_id: 'm1' }]))).toThrow(/electrodes\[0\]: unexpected key "region_id"/);
    expect(() => parse(withElectrodes([{ ...cz, nearest_region: 'm1' }]))).toThrow(/unexpected key "nearest_region"/);
    expect(() => parse(withElectrodes([{ ...cz, id: 'motor cortex' }]))).toThrow(/id: "motor cortex" is not an electrode name/);
    expect(() => parse(withElectrodes([{ ...cz, share: 1 }]))).toThrow(/share: a share of an arc lies between its two ends/);
    expect(() => parse(withElectrodes([{ ...cz, share: 0 }]))).toThrow(/share/);
    expect(() => parse(withElectrodes([cz, cz]))).toThrow(/electrode "Cz" appears twice/);
    expect(() => parse(withElectrodes([]))).toThrow(/electrodes: a layout with no electrode/);
  });

  it('rejects a lead that carries a place in the brain, under any of the names one could give it', () => {
    for (const key of ['position_mm', 'tip_mm', 'target_region_id', 'trajectory', 'entry_point', 'coordinates', 'transform', 'orientation', 'template_space']) {
      expect(() => parse(buildFile({ leads: [{ ...LEAD, [key]: [0, 0, 0] }] }))).toThrow(new RegExp(`leads\\[0\\]\\.${key}: "${key}" would give the lead a place in the brain`));
    }
    expect(() => parse(buildFile({ leads: [{ ...LEAD, sources: [{ ...SOURCED, position_mm: [0, 0, 0] }] }] }))).toThrow(/unexpected key "position_mm"/);
  });

  it('holds a lead whose sources say what they support to a source for every dimension, each of a stated kind', () => {
    expect(parse(buildFile({ leads: [{ ...LEAD, sources: [SOURCED] }] })).leads[0].sources[0].kind).toBe('fda_document');
    const partial = { ...SOURCED, supports: ['contacts', 'contact_length_mm'] };
    expect(() => parse(buildFile({ leads: [{ ...LEAD, sources: [partial] }] }))).toThrow(/sources: no source states "contact_spacing_mm"/);
    expect(() => parse(buildFile({ leads: [{ ...LEAD, sources: [SOURCED, LEAD.sources[0]] }] }))).toThrow(/sources\[1\]: this source does not say what it supports/);
    expect(() => parse(buildFile({ leads: [{ ...LEAD, sources: [{ ...SOURCED, kind: 'brochure' }] }] }))).toThrow(/kind/);
    expect(() => parse(buildFile({ leads: [{ ...LEAD, sources: [{ ...SOURCED, supports: ['length_to_target'] }] }] }))).toThrow(/supports\[0\]: "length_to_target" is not a dimension of a lead/);
  });

  it('rejects a sourced fact marked as something to draw, or with no statement of how much was read', () => {
    expect(() => parse(buildFile({ facts: [{ ...FACT, drawable: true }] }))).toThrow(/facts\[0\]\.drawable: a sourced fact is never drawn/);
    expect(() => parse(buildFile({ facts: [{ ...FACT, read_depth: 'skimmed' }] }))).toThrow(/read_depth/);
    expect(() => parse(buildFile({ facts: [FACT, FACT] }))).toThrow(/fact "fixture_fact" appears twice/);
    expect(() => parse(buildFile({ facts: [{ ...FACT, radius_mm: 7 }] }))).toThrow(/unexpected key "radius_mm"/);
  });
});

describe('a lead drawn from its dimensions', () => {
  it('lays contacts along the lead by either spacing measure and reproduces a span the regulator states', () => {
    const quadripolar = buildLeadShape({ contacts: 4, contact_length_mm: 1.5, contact_spacing_mm: 0.5, spacing_measure: 'edge_to_edge', diameter_mm: 1.27 });
    expect(quadripolar.contacts).toEqual([{ start_mm: 0, end_mm: 1.5 }, { start_mm: 2, end_mm: 3.5 }, { start_mm: 4, end_mm: 5.5 }, { start_mm: 6, end_mm: 7.5 }]);
    const octopolar = buildLeadShape({ contacts: 8, contact_length_mm: 1.5, contact_spacing_mm: 2, spacing_measure: 'centre_to_centre', diameter_mm: 1.3 });
    expect(octopolar.contact_span_mm).toBe(15.5);
    expect(buildLeadShape({ contacts: 8, contact_length_mm: 1.5, contact_spacing_mm: 2, spacing_measure: 'edge_to_edge', diameter_mm: 1.3 }).contact_span_mm).toBe(26);
    expect(Object.keys(octopolar).sort()).toEqual(['contact_span_mm', 'contacts', 'diameter_mm']);
  });

  it('refuses contacts that would overlap', () => {
    expect(() => buildLeadShape({ contacts: 4, contact_length_mm: 1.5, contact_spacing_mm: 1, spacing_measure: 'centre_to_centre', diameter_mm: 1.27 })).toThrow(/lead contacts would overlap/);
  });
});

describe('device rows in the review ledger', () => {
  it('keys a lead and a fiducial, and changes the digest when a dimension changes', () => {
    expect(deviceRowKey('lead', LEAD.id)).toBe('lead:fixture_lead');
    expect(deviceRowKey('fiducial', 'nasion')).toBe('fiducial:nasion');
    expect(digestDeviceRow(LEAD)).not.toBe(digestDeviceRow({ ...LEAD, diameter_mm: 1.3 }));
  });

  it('accepts a ledger entry keyed to a lead', () => {
    const entry = { kind: 'row_review', key: deviceRowKey('lead', LEAD.id), digest: digestDeviceRow(LEAD), reviewer_id: 'owner-1', reviewed_on: '2026-10-09' };
    const ledger = { schema_version: 1, status: REVIEW_LEDGER_STATUS, reviewers: [{ id: 'owner-1', role: 'owner' }], entries: [entry] };
    expect(parseReviewLedger(ledger).entries).toHaveLength(1);
  });
});
