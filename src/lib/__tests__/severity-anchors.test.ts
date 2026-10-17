/**
 * Guards datalake/severity-anchors.json.
 *
 * The schema tests check that every rate row is a measurement rather than a
 * number: endpoint as the source defines it, denominator family, N, rate, and
 * time base, plus a band and a citation.
 *
 * The scope tests are the load-bearing ones. This table is keyed by
 * recoverability band and device CLASS. A per-record map of stimulation target
 * to mental state is the artefact this project stopped building, and the way
 * such a table returns is by accretion — one `target` field, added for a good
 * local reason, by someone who never read the staging document. These tests
 * fail on any anatomical target, contact, amplitude, frequency or programming
 * field at any depth, and on any value naming an anatomical structure.
 *
 * They also assert the negative facts the band set depends on: that death is
 * not a band, and that the forbidden join is named by path in the metadata so
 * the refusal is actionable rather than rhetorical.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  FORBIDDEN_FIELD_SUBSTRINGS,
  VALID_BANDS,
  findForbiddenFields,
  findForbiddenValues,
  findSchemaErrors,
} from '../../scripts/validate-severity-anchors.mjs';

const FILE = fileURLToPath(new URL('../../../datalake/severity-anchors.json', import.meta.url));
const doc = JSON.parse(readFileSync(FILE, 'utf-8'));

describe('severity-anchors.json schema', () => {
  it('parses and holds rows', () => {
    expect(Array.isArray(doc.anchors)).toBe(true);
    expect(doc.anchors.length).toBeGreaterThan(0);
  });

  it('has no schema errors', () => {
    expect(findSchemaErrors(doc)).toEqual([]);
  });

  it('gives every row the five fields that make a rate comparable', () => {
    for (const row of doc.anchors) {
      expect(typeof row.endpoint, row.id).toBe('string');
      expect(row.endpoint.length, row.id).toBeGreaterThan(10);
      expect(typeof row.denominator_family, row.id).toBe('string');
      expect(row.n, row.id).toBeGreaterThan(0);
      expect(row.rate, row.id).toBeDefined();
      // null is a legitimate value: it records that the source reported no time
      // base, which is the fact that makes the row non-comparable.
      expect(['string', 'object'], row.id).toContain(typeof row.time_base);
    }
  });

  it('cites at least one source per row', () => {
    for (const row of doc.anchors) {
      expect(Array.isArray(row.source_ids), row.id).toBe(true);
      expect(row.source_ids.length, row.id).toBeGreaterThan(0);
    }
  });

  it('uses only the five bands, and death is not one of them', () => {
    expect(VALID_BANDS).not.toContain('B5');
    expect(VALID_BANDS).not.toContain('B0');
    for (const row of doc.anchors) {
      expect(VALID_BANDS, row.id).toContain(row.band);
    }
    expect(Object.keys(doc._metadata.bands)).not.toContain('B5');
  });

  it('records that a row with no time base may not be compared', () => {
    const noTimeBase = doc.anchors.filter((row: { time_base: unknown }) => row.time_base === null);
    expect(noTimeBase.length).toBeGreaterThan(0);
    expect(doc._metadata.commensurability_warning).toMatch(/time_base/);
  });

  it('marks the rows that measure a cause rather than a band endpoint', () => {
    const spanning = doc.anchors.filter((row: { band: string }) => row.band === 'B2-B4');
    expect(spanning.length).toBeGreaterThan(0);
    for (const row of spanning) {
      expect(row.endpoint, row.id).toMatch(/no explant numerator|INFECTION/i);
    }
  });
});

describe('severity-anchors.json scope guard', () => {
  it('carries no anatomical target or stimulation setting field, at any depth', () => {
    expect(findForbiddenFields(doc)).toEqual([]);
  });

  it('names no anatomical structure in any row value', () => {
    expect(findForbiddenValues(doc)).toEqual([]);
  });

  it('is keyed by device class, not by device instance or target', () => {
    const classes = new Set(doc.anchors.map((row: { device_class: string }) => row.device_class));
    // Class-level labels only: DBS, SCS, RNS, TMS, tDCS, cortical_array.
    for (const deviceClass of classes) {
      expect(String(deviceClass).length, String(deviceClass)).toBeLessThan(20);
    }
    expect(classes.size).toBeLessThanOrEqual(10);
  });

  it('would reject a target field if one were added', () => {
    const poisoned = { anchors: [{ ...doc.anchors[0], anatomical_target: 'subthalamic nucleus' }] };
    const hits = findForbiddenFields(poisoned);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].matched).toBe('target');
  });

  it('would reject an amplitude or frequency field if one were added', () => {
    for (const field of ['amplitude_ma', 'stim_frequency_hz', 'pulse_width_us', 'contact_number']) {
      const poisoned = { anchors: [{ ...doc.anchors[0], [field]: 1 }] };
      expect(findForbiddenFields(poisoned).length, field).toBeGreaterThan(0);
    }
  });

  it('would reject an anatomical structure smuggled into a value', () => {
    const poisoned = {
      anchors: [{ ...doc.anchors[0], finding_direction: 'Effects observed under globus pallidus stimulation.' }],
    };
    const hits = findForbiddenValues(poisoned);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].term).toBe('globus pallidus');
  });

  it('guards every field name the review named', () => {
    for (const required of ['target', 'site', 'contact', 'amplitude', 'frequency', 'programming']) {
      expect(FORBIDDEN_FIELD_SUBSTRINGS, required).toContain(required);
    }
  });

  it('names the forbidden join by repository path, so the refusal is actionable', () => {
    expect(doc._metadata.forbidden_join).toMatch(/band_profiles/);
    expect(doc._metadata.forbidden_join).toMatch(/bci_attack_vector/);
  });

  it('states that these rates are not evidence about an adversary', () => {
    expect(doc._metadata.note).toMatch(/no evidence/i);
    expect(doc._metadata.note).toMatch(/adversary cannot cause|cannot cause/i);
  });

  it('records that the bands order intervention magnitude, not harm', () => {
    expect(doc._metadata.ordering_note).toMatch(/not a monotone proxy for harm/i);
  });

  it('records the publication-bias direction', () => {
    expect(doc._metadata.publication_bias).toMatch(/lower/i);
  });
});

describe('severity-anchors.json provenance', () => {
  it('records the same-cohort relationship so two reports are not counted as two sources', () => {
    const engelRows = doc.anchors.filter((row: { source_ids: string[] }) => row.source_ids.includes('SA-11'));
    expect(engelRows.length).toBeGreaterThan(0);
    // SA-11 (Engel 2018) and SA-02 (Buhmann 2017) are the same 123-patient cohort.
    const paired = engelRows.filter((row: { same_cohort_as: string[] }) => (row.same_cohort_as ?? []).includes('SA-02'));
    expect(paired.length).toBeGreaterThan(0);
  });

  it('labels itself a purposive sample rather than a systematic review', () => {
    expect(doc._metadata.status).toMatch(/NOT a systematic review/i);
  });

  it('points at the staging document it was transcribed from', () => {
    expect(doc._metadata.source_document).toMatch(/severity-anchors\.md/);
  });
});
