import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import landscapeJson from '@shared/bci-landscape.json';
import cveMappingJson from '@shared/cve-technique-mapping.json';
import registrarJson from '@shared/qtara-registrar.json';
import { buildIndexes, executeQuery } from '@/lib/kql-engine';
import { getKqlTables } from '@/lib/kql-tables';
import { collectCitedSourceIds, REPORT, resolveSource, UnknownSourceError } from '../report-data';
import {
  capitalByChannel, disclosureByClass, evidenceMaturity, NEURAL_DEVICE_CVE_CATEGORY, neuralDeviceCves, roundsSummary, trackedFunding,
} from '../metrics';
import { formatPercent, formatReportDate, formatUsdCompact, toFractionalYear } from '../format';

interface LedgerItem { id: string; source_url?: string; verification?: string }
interface AuditRecord { company: string; status: string }

const ledgerItems = (JSON.parse(readFileSync(path.resolve('datalake/intake/ledger.json'), 'utf-8')) as { items: LedgerItem[] }).items;
const ledgerById = new Map(ledgerItems.map((item) => [item.id, item]));
const auditFile = JSON.parse(readFileSync(path.resolve('datalake/intake/2026-10-20/disclosure-channel-audit.json'), 'utf-8')) as { companies: AuditRecord[] };
const companies = (landscapeJson as { companies: { name: string }[] }).companies;
const fundingRounds = (landscapeJson as { market_data: { major_funding_rounds: { company: string; amount_usd: number; date: string }[] } }).market_data.major_funding_rounds;
const isoDate = /^\d{4}-\d{2}(-\d{2})?$/;

describe('report sources', () => {
  it('resolves every cited source id', () => {
    for (const id of collectCitedSourceIds()) expect(() => resolveSource(id), id).not.toThrow();
  });

  it('throws a typed error for an unknown id', () => {
    expect(() => resolveSource('NOT-A-SOURCE')).toThrow(UnknownSourceError);
  });

  it('lists no source that is never cited', () => {
    const cited = new Set(collectCitedSourceIds());
    expect(REPORT.sources.filter((source) => !cited.has(source.id)).map((source) => source.id)).toEqual([]);
  });

  it('records every source in the intake ledger as verified, with the same URL', () => {
    for (const source of REPORT.sources) {
      const row = ledgerById.get(source.ledger_id);
      expect(row, `${source.id} -> ${source.ledger_id}`).toBeDefined();
      expect(row?.verification, source.ledger_id).toBe('VERIFIED');
      expect(row?.source_url, source.ledger_id).toBe(source.url);
    }
  });

  it('uses only https links', () => {
    for (const source of REPORT.sources) expect(source.url.startsWith('https://'), source.id).toBe(true);
  });
});

describe('report dataset', () => {
  it('has a disclosure-audit row for exactly the datalake companies, matching the intake record', () => {
    const reportRows = new Map(REPORT.disclosure_audit.companies.map((row) => [row.company, row.status]));
    expect([...reportRows.keys()].sort()).toEqual(companies.map((company) => company.name).sort());
    for (const record of auditFile.companies) expect(reportRows.get(record.company), record.company).toBe(record.status);
  });

  it('cites evidence for every company counted as having a channel', () => {
    for (const row of REPORT.disclosure_audit.companies.filter((entry) => entry.status === 'found')) {
      expect(row.source_ids?.length ?? 0, row.company).toBeGreaterThan(0);
    }
  });

  it('matches datalake funding rows where a round claims a datalake trace', () => {
    for (const round of REPORT.rounds_2026.filter((entry) => entry.datalake_trace)) {
      const row = fundingRounds.find((entry) => entry.company === round.company && entry.date.startsWith('2026'));
      expect(row?.amount_usd, round.company).toBe(round.amount_usd);
    }
  });

  it('keeps dated lists in ISO format and the regulatory clock in order', () => {
    const dated = [...REPORT.rounds_2026, ...REPORT.clinical_milestones, ...REPORT.regulatory_clock];
    for (const entry of dated) expect(entry.date, JSON.stringify(entry)).toMatch(isoDate);
    const clockDates = REPORT.regulatory_clock.map((event) => event.date);
    expect(clockDates).toEqual([...clockDates].sort());
  });

  it('stages only CVEs that are not yet mapped in the datalake', () => {
    const mapped = new Set((cveMappingJson as { mappings: { cve_id: string }[] }).mappings.map((row) => row.cve_id));
    for (const staged of REPORT.staged_cves) expect(mapped.has(staged.cve_id), `${staged.cve_id} is now mapped: remove it from staged_cves`).toBe(false);
  });
});

describe('reproduction queries', () => {
  const tables = getKqlTables();
  const indexes = buildIndexes(tables);
  for (const reproduce of REPORT.reproduce_queries) {
    it(`returns ${reproduce.expected_count} for: ${reproduce.query}`, () => {
      const outcome = executeQuery(reproduce.query, tables, indexes);
      expect(outcome.error).toBeNull();
      expect(outcome.rows[0]?.count).toBe(reproduce.expected_count);
    });
  }
});

describe('metrics', () => {
  it('splits the evidence tiers without losing an entry', () => {
    const evidence = evidenceMaturity();
    const techniques = (registrarJson as { techniques: { id: string; evidence?: { tier?: string } }[] }).techniques;
    expect(evidence.replicated + evidence.demonstrated + evidence.theoretical + evidence.speculative).toBe(evidence.total);
    expect(evidence.demonstratedLab + evidence.demonstratedCase).toBe(evidence.demonstrated);
    for (const id of REPORT.strict_demonstrated_exclusions.technique_ids) {
      expect(techniques.find((technique) => technique.id === id)?.evidence?.tier, id).toBe('demonstrated_case');
    }
    expect(evidence.demonstratedStrict).toBe(evidence.demonstrated - REPORT.strict_demonstrated_exclusions.technique_ids.length);
  });

  it('counts mapped neural-device CVEs plus staged ones, in date order', () => {
    const mapped = (cveMappingJson as { mappings: { category: string }[] }).mappings.filter((row) => row.category === NEURAL_DEVICE_CVE_CATEGORY);
    const cves = neuralDeviceCves();
    expect(cves.length).toBe(mapped.length + REPORT.staged_cves.length);
    expect(cves.map((cve) => cve.published)).toEqual([...cves.map((cve) => cve.published)].sort());
  });

  it('allocates all tracked funding and all companies to a disclosure status', () => {
    const split = capitalByChannel();
    expect(split.found + split.none_found + split.not_checked).toBe(trackedFunding().totalUsd);
    const byClass = disclosureByClass();
    const counted = Object.values(byClass).reduce((sum, row) => sum + row.found + row.none_found + row.not_checked, 0);
    expect(counted).toBe(companies.length);
  });

  it('sums the 2026 rounds and their concentration', () => {
    const summary = roundsSummary();
    expect(summary.totalUsd).toBe(REPORT.rounds_2026.reduce((sum, round) => sum + round.amount_usd, 0));
    expect(summary.topFourShare).toBeGreaterThan(0);
    expect(summary.topFourShare).toBeLessThanOrEqual(1);
  });
});

describe('format', () => {
  it('formats money without false precision', () => {
    expect(formatUsdCompact(1_224_100_000)).toBe('$1.22B');
    expect(formatUsdCompact(21_600_000)).toBe('$21.6M');
    expect(formatUsdCompact(250_000_000)).toBe('$250M');
    expect(formatPercent(0.8316)).toBe('83%');
  });

  it('formats dates and places them on a year axis', () => {
    expect(formatReportDate('2026-03-13')).toBe('13 Mar 2026');
    expect(formatReportDate('2026-04')).toBe('Apr 2026');
    expect(toFractionalYear('2026-01-01')).toBe(2026);
    expect(toFractionalYear('2026-07-02')).toBeCloseTo(2026.5, 2);
  });
});
