import { describe, expect, it } from 'vitest';
import { AnatomyDataError } from '../errors';
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
