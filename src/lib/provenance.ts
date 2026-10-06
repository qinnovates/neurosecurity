/**
 * Build-time provenance adapter.
 *
 * Answers one question for a site visitor: what are the numbers this site
 * publishes, where does each come from, and when was it last verified?
 *
 * Every value returned here is read at build time from a file in the repo.
 * Nothing is typed in by hand:
 *   - figures            → src/data/qif-timeline.json `current_stats`
 *   - which figures are
 *     re-derived by script → the `fields` array in src/scripts/timeline-check.mjs
 *   - canonical reference → osi-of-mind/whitepapers/QIF-TRUTH.md (parsed)
 *   - decision record    → osi-of-mind/QIF-DERIVATION-LOG.md (parsed)
 *   - research intake    → datalake/intake/ledger.json
 *
 * If a figure has no machine-readable source, it is reported as such rather
 * than presented as verified.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import timelineData from '@/data/qif-timeline.json';
import ledgerData from '@shared/intake/ledger.json';

const REPO_ROOT = process.cwd();

const TIMELINE_CHECK_PATH = 'src/scripts/timeline-check.mjs';
const QIF_TRUTH_PATH = 'osi-of-mind/whitepapers/QIF-TRUTH.md';
const DERIVATION_LOG_PATH = 'osi-of-mind/QIF-DERIVATION-LOG.md';
const LEDGER_PATH = 'datalake/intake/ledger.json';

const GITHUB_BLOB = 'https://github.com/qinnovates/neurosecurity/blob/main';

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf-8');
}

// ─── Tracked figures ────────────────────────────────────────────────────────

export type FigureKind = 'count' | 'version';

export interface TrackedFigure {
  /** Key as it appears in `current_stats`. */
  key: string;
  label: string;
  value: string | number;
  kind: FigureKind;
  /** Repo-relative file the value is derived from, or null if none is recorded. */
  source: string | null;
  /** True when `npm run timeline-check` re-derives this value from `source`. */
  scriptDerived: boolean;
}

/**
 * Human labels for the `current_stats` keys. Labels only — no values live here.
 * A key with no entry falls back to a prettified form of the key itself, so a
 * newly tracked figure still renders instead of silently disappearing.
 */
const FIGURE_LABELS: Record<string, string> = {
  threat_techniques: 'TARA threat techniques',
  tara_tactics: 'TARA tactics',
  tara_domains: 'TARA domains',
  techniques_niss_scored: 'Techniques carrying a NISS score',
  neurorights_mapped: 'Neurorights referenced by techniques',
  bci_devices: 'BCI devices catalogued',
  bci_companies: 'BCI companies catalogued',
  brain_regions: 'Brain regions mapped',
  physics_constraints: 'Physics constraints',
  physics_constants_verified: 'Physics constants verified',
  hourglass_bands: 'Hourglass bands',
  dsm5_diagnoses_mapped: 'DSM-5-TR category references mapped',
  research_sources: 'Research sources catalogued',
  derivation_log_entries: 'Derivation log entries',
  field_journal_entries: 'Field journal entries',
  blog_posts: 'Blog posts',
  cross_ai_validations: 'Cross-AI validation runs',
  niss_version: 'NISS specification',
  registrar_version: 'TARA registrar dataset',
  landscape_dataset_version: 'BCI landscape dataset',
  sdk_version: 'qtara Python SDK',
  whitepaper_version: 'Whitepaper',
  preprint_version: 'Preprint',
  nsp_version: 'NSP protocol draft',
  tara_version: 'TARA framework',
  atlas_version: 'Brain/BCI atlas',
  neurowall_version: 'Neurowall',
};

/**
 * The file each figure is derived from. Mirrors the path constants in
 * src/scripts/timeline-check.mjs. Paths only — no values.
 */
const FIGURE_SOURCES: Record<string, string> = {
  threat_techniques: 'datalake/qtara-registrar.json',
  tara_tactics: 'datalake/qtara-registrar.json',
  tara_domains: 'datalake/qtara-registrar.json',
  techniques_niss_scored: 'datalake/qtara-registrar.json',
  neurorights_mapped: 'datalake/qtara-registrar.json',
  niss_version: 'datalake/qtara-registrar.json',
  registrar_version: 'datalake/qtara-registrar.json',
  bci_devices: 'datalake/bci-landscape.json',
  bci_companies: 'datalake/bci-landscape.json',
  landscape_dataset_version: 'datalake/bci-landscape.json',
  brain_regions: 'datalake/qif-brain-bci-atlas.json',
  physics_constraints: 'src/lib/bci-limits-constants.ts',
  research_sources: 'osi-of-mind/QIF-RESEARCH-SOURCES.md',
  derivation_log_entries: 'osi-of-mind/QIF-DERIVATION-LOG.md',
  sdk_version: 'datalake/qtara/pyproject.toml',
  whitepaper_version: 'src/lib/qif-constants.ts',
};

function prettifyKey(key: string): string {
  const words = key.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Reads the `fields` array out of src/scripts/timeline-check.mjs — the list of
 * `current_stats` keys that script re-derives from source data. Parsing the
 * script rather than restating the list keeps the two from drifting apart.
 *
 * @throws if the array cannot be parsed, so a refactor of the script fails the
 *   build instead of silently downgrading every figure to "not re-derived".
 */
export function getScriptDerivedFieldNames(): string[] {
  const source = readRepoFile(TIMELINE_CHECK_PATH);
  const match = source.match(/const fields = \[([\s\S]*?)\];/);
  const names = match
    ? [...match[1].matchAll(/'([a-z0-9_]+)'/g)].map((entry) => entry[1])
    : [];

  if (names.length === 0) {
    throw new Error(
      `Could not parse the 'fields' array from ${TIMELINE_CHECK_PATH}. ` +
        'The provenance page derives which figures are script-checked from that array; ' +
        'update src/lib/provenance.ts if the script changed shape.'
    );
  }
  return names;
}

export interface TrackedFigures {
  /** The `as_of` date recorded alongside the figures. */
  asOf: string;
  counts: TrackedFigure[];
  versions: TrackedFigure[];
  scriptDerivedCount: number;
  manualCount: number;
  timelineSource: string;
  checkCommand: string;
}

export function getTrackedFigures(): TrackedFigures {
  const stats = timelineData.current_stats as Record<string, string | number>;
  const scriptDerived = new Set(getScriptDerivedFieldNames());

  const figures: TrackedFigure[] = Object.entries(stats)
    .filter(([key]) => key !== 'as_of')
    .map(([key, value]) => ({
      key,
      label: FIGURE_LABELS[key] ?? prettifyKey(key),
      value,
      kind: (typeof value === 'string' ? 'version' : 'count') as FigureKind,
      source: FIGURE_SOURCES[key] ?? null,
      scriptDerived: scriptDerived.has(key),
    }));

  const byLabel = (a: TrackedFigure, b: TrackedFigure) => a.label.localeCompare(b.label);

  return {
    asOf: String(stats.as_of),
    counts: figures.filter((f) => f.kind === 'count').sort(byLabel),
    versions: figures.filter((f) => f.kind === 'version').sort(byLabel),
    scriptDerivedCount: figures.filter((f) => f.scriptDerived).length,
    manualCount: figures.filter((f) => !f.scriptDerived).length,
    timelineSource: 'src/data/qif-timeline.json',
    checkCommand: 'node src/scripts/timeline-check.mjs',
  };
}

// ─── Canonical reference: QIF-TRUTH.md ──────────────────────────────────────

export interface CanonicalReference {
  path: string;
  url: string;
  /** Document version from the footer, e.g. "4.4". Null if not stated. */
  documentVersion: string | null;
  lastUpdated: string | null;
  lastValidated: string | null;
  /** The document's own note about audit currency, if it carries one. */
  auditNote: string | null;
  /** Section headings, so the page can show what the reference covers. */
  sections: string[];
  /** The "Last computed" line from the TARA current-state section. */
  taraCurrentStateComputed: string | null;
  taraCurrentStateAnchor: string;
}

export function getCanonicalReference(): CanonicalReference {
  const text = readRepoFile(QIF_TRUTH_PATH);

  const firstGroup = (pattern: RegExp): string | null => {
    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  };

  const sections = [...text.matchAll(/^## (\d+)\. (.+)$/gm)].map(
    (match) => `${match[1]}. ${match[2].trim()}`
  );

  return {
    path: QIF_TRUTH_PATH,
    url: `${GITHUB_BLOB}/${QIF_TRUTH_PATH}`,
    documentVersion: firstGroup(/^\*Document version: *([^*]+)\*/m),
    lastUpdated: firstGroup(/^\*Last updated: *([^*]+)\*/m),
    lastValidated: firstGroup(/\*\*Last validated: *([^*]+)\*\*/),
    auditNote: firstGroup(/\*\*Next audit due:\*\* *(.+)$/m),
    sections,
    taraCurrentStateComputed: firstGroup(/\*\*Last computed: *([^*]+)\*\*/),
    taraCurrentStateAnchor: '#10-tara-registry-current-state',
  };
}

// ─── Decision record: QIF-DERIVATION-LOG.md ─────────────────────────────────

export interface DerivationEntry {
  number: number;
  title: string;
  anchor: string;
  url: string;
}

export interface DecisionRecord {
  path: string;
  url: string;
  /** Count of numbered `## Entry N` headings in the log. */
  entryCount: number;
  /** Highest-numbered entry, with a deep link. */
  latest: DerivationEntry | null;
  /** Count as tracked in `current_stats`, for comparison. */
  trackedEntryCount: number | string | undefined;
}

export function getDecisionRecord(): DecisionRecord {
  const text = readRepoFile(DERIVATION_LOG_PATH);
  const stats = timelineData.current_stats as Record<string, string | number>;

  const entries: DerivationEntry[] = [
    ...text.matchAll(/^## Entry (\d+): *(.+?)(?: *\{#([^}]+)\})? *$/gm),
  ].map((match) => {
    const anchor = match[3] ?? '';
    return {
      number: Number(match[1]),
      title: match[2].trim(),
      anchor,
      url: `${GITHUB_BLOB}/${DERIVATION_LOG_PATH}${anchor ? `#${anchor}` : ''}`,
    };
  });

  const latest = entries.reduce<DerivationEntry | null>(
    (best, entry) => (best === null || entry.number > best.number ? entry : best),
    null
  );

  return {
    path: DERIVATION_LOG_PATH,
    url: `${GITHUB_BLOB}/${DERIVATION_LOG_PATH}`,
    entryCount: entries.length,
    latest,
    trackedEntryCount: stats.derivation_log_entries,
  };
}

// ─── Research intake ledger ─────────────────────────────────────────────────

export interface IntakeArtifactSummary {
  artifact: string;
  gathered: number;
  published: number;
  held: number;
}

export interface IntakeVerdict {
  verdict: string;
  count: number;
}

export interface IntakeBatchSummary {
  batch: string;
  collected: string;
  baseline: string;
  gathered: number;
  published: number;
  held: number;
  sourcesCollected: number;
  siteInconsistenciesFound: number;
  rawFileCount: number;
  withheldFileCount: number;
  heldReason: string;
  artifacts: IntakeArtifactSummary[];
  review: {
    reviewed: string;
    method: string;
    verdicts: IntakeVerdict[];
    citations: string;
    coverageGaps: string;
    /** Count of delta-report statements the review contradicted. */
    blockedStatementCount: number;
    /** The review's own framing of what a BLOCKED verdict means. */
    blockedStatementNote: string;
  } | null;
}

export interface IntakeSummary {
  path: string;
  url: string;
  description: string;
  dispositions: string[];
  batches: IntakeBatchSummary[];
  /** Disposition tallies over every item the ledger publishes. */
  itemDispositions: IntakeVerdict[];
}

type LedgerCount = { artifact: string; verification: string; items: number };

export function getIntakeSummary(): IntakeSummary {
  const ledger = ledgerData as any;

  const batches: IntakeBatchSummary[] = (ledger.batches ?? []).map((batch: any) => {
    const counts: LedgerCount[] = batch.counts ?? [];
    const artifactNames = [...new Set(counts.map((c) => c.artifact))].sort();

    const sumFor = (artifact: string, verification?: string) =>
      counts
        .filter((c) => c.artifact === artifact && (!verification || c.verification === verification))
        .reduce((total, c) => total + c.items, 0);

    const review = batch.independent_review ?? null;

    return {
      batch: batch.batch,
      collected: batch.collected,
      baseline: batch.baseline,
      gathered: counts.reduce((total, c) => total + c.items, 0),
      published: batch.published_items,
      held: batch.held_items,
      sourcesCollected: batch.sources_collected,
      siteInconsistenciesFound: batch.site_inconsistencies_found,
      rawFileCount: (batch.raw_files ?? []).length,
      withheldFileCount: (batch.raw_files_withheld?.files ?? []).length,
      heldReason: batch.raw_files_withheld?.why ?? '',
      artifacts: artifactNames.map((artifact) => ({
        artifact,
        gathered: sumFor(artifact),
        published: sumFor(artifact, 'VERIFIED'),
        held: sumFor(artifact, 'UNVERIFIED'),
      })),
      review: review
        ? {
            reviewed: review.reviewed,
            method: review.method,
            verdicts: Object.entries(review.item_verdicts ?? {})
              .map(([verdict, count]) => ({ verdict, count: Number(count) }))
              .sort((a, b) => b.count - a.count),
            citations: review.citations ?? '',
            coverageGaps: review.coverage_gaps ?? '',
            blockedStatementCount: (review.prose_claims_blocked ?? []).length,
            blockedStatementNote: review.note_on_blocked ?? '',
          }
        : null,
    };
  });

  const dispositionTally = new Map<string, number>();
  for (const item of ledger.items ?? []) {
    const key = String(item.disposition);
    dispositionTally.set(key, (dispositionTally.get(key) ?? 0) + 1);
  }

  return {
    path: LEDGER_PATH,
    url: `${GITHUB_BLOB}/${LEDGER_PATH}`,
    description: ledger.description ?? '',
    dispositions: ledger.dispositions ?? [],
    batches,
    itemDispositions: [...dispositionTally.entries()]
      .map(([verdict, count]) => ({ verdict, count }))
      .sort((a, b) => b.count - a.count),
  };
}
