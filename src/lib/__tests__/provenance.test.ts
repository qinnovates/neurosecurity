import { describe, it, expect } from 'vitest';
import timelineData from '@/data/qif-timeline.json';
import {
  getTrackedFigures,
  getScriptDerivedFieldNames,
  getCanonicalReference,
  getDecisionRecord,
  getIntakeSummary,
} from '@/lib/provenance';

describe('tracked figures', () => {
  const figures = getTrackedFigures();
  const all = [...figures.counts, ...figures.versions];

  it('surfaces every current_stats field except as_of', () => {
    const statKeys = Object.keys(timelineData.current_stats).filter((k) => k !== 'as_of');
    expect(all.map((f) => f.key).sort()).toEqual(statKeys.sort());
  });

  it('carries the as_of date from the data', () => {
    expect(figures.asOf).toBe(timelineData.current_stats.as_of);
  });

  it('gives every figure a non-empty label', () => {
    for (const figure of all) {
      expect(figure.label.length, `missing label for ${figure.key}`).toBeGreaterThan(0);
    }
  });

  it('marks exactly the fields timeline-check.mjs re-derives as script-derived', () => {
    const scriptFields = new Set(getScriptDerivedFieldNames());
    for (const figure of all) {
      expect(figure.scriptDerived, figure.key).toBe(scriptFields.has(figure.key));
    }
    expect(figures.scriptDerivedCount + figures.manualCount).toBe(all.length);
  });

  it('records a source file for every script-derived figure', () => {
    for (const figure of all.filter((f) => f.scriptDerived)) {
      expect(figure.source, `no source recorded for ${figure.key}`).toBeTruthy();
    }
  });

  it('classifies string values as versions and numeric values as counts', () => {
    expect(figures.counts.every((f) => typeof f.value === 'number')).toBe(true);
    expect(figures.versions.every((f) => typeof f.value === 'string')).toBe(true);
  });
});

describe('canonical reference', () => {
  const reference = getCanonicalReference();

  it('parses the document version and dates out of QIF-TRUTH.md', () => {
    expect(reference.documentVersion).toMatch(/^\d+\.\d+/);
    expect(reference.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(reference.lastValidated).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('lists the numbered sections', () => {
    expect(reference.sections.length).toBeGreaterThan(5);
    expect(reference.sections.some((s) => /TARA Registry/i.test(s))).toBe(true);
  });

  it('reports when the TARA current-state section was last computed', () => {
    expect(reference.taraCurrentStateComputed).toContain('2026');
  });
});

describe('decision record', () => {
  const record = getDecisionRecord();

  it('counts numbered entries in the derivation log', () => {
    expect(record.entryCount).toBeGreaterThan(0);
    expect(record.entryCount).toBe(record.trackedEntryCount);
  });

  it('deep-links the latest entry', () => {
    expect(record.latest).not.toBeNull();
    expect(record.latest!.number).toBeGreaterThanOrEqual(106);
    expect(record.latest!.url).toContain('#');
  });
});

describe('research intake ledger', () => {
  const intake = getIntakeSummary();

  it('summarises at least one batch', () => {
    expect(intake.batches.length).toBeGreaterThan(0);
  });

  it('reconciles published plus held against the gathered total', () => {
    for (const batch of intake.batches) {
      expect(batch.published + batch.held, batch.batch).toBe(batch.gathered);
    }
  });

  it('reconciles per-artifact tallies against the batch totals', () => {
    for (const batch of intake.batches) {
      const published = batch.artifacts.reduce((t, a) => t + a.published, 0);
      const held = batch.artifacts.reduce((t, a) => t + a.held, 0);
      expect(published).toBe(batch.published);
      expect(held).toBe(batch.held);
    }
  });

  it('exposes independent-review verdict counts', () => {
    const review = intake.batches[0].review;
    expect(review).not.toBeNull();
    expect(review!.verdicts.length).toBeGreaterThan(0);
    expect(review!.verdicts.every((v) => v.count > 0)).toBe(true);
  });

  it('does not expose the text of blocked or held claims', () => {
    const serialised = JSON.stringify(intake);
    expect(serialised).not.toContain('prose_claims_blocked');
    expect(serialised).not.toMatch(/"claim"/);
    // The review's blocked-statement reasons are summarised by count only.
    expect(intake.batches[0].review!.blockedStatementCount).toBeGreaterThanOrEqual(0);
  });
});
