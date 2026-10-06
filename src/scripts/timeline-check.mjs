#!/usr/bin/env node
/**
 * timeline-check.mjs — Detect stale stats and missing milestones in qif-timeline.json
 *
 * Usage:
 *   node scripts/timeline-check.mjs            # report only
 *   node scripts/timeline-check.mjs --dry-run  # show what --fix would change
 *   node scripts/timeline-check.mjs --fix      # auto-update current_stats + as_of
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const args = process.argv.slice(2);
const FIX = args.includes('--fix');
const DRY_RUN = args.includes('--dry-run');

// ---------------------------------------------------------------------------
// Paths (relative to repo root)
// ---------------------------------------------------------------------------
const TIMELINE_PATH = resolve(ROOT, 'src/data/qif-timeline.json');
const REGISTRY_PATH = resolve(ROOT, 'datalake/qtara-registrar.json');
const LANDSCAPE_PATH = resolve(ROOT, 'datalake/bci-landscape.json');
const SOURCES_PATH = resolve(ROOT, 'osi-of-mind/QIF-RESEARCH-SOURCES.md');
const FIELD_JOURNAL_PATH = resolve(ROOT, 'osi-of-mind/QIF-FIELD-JOURNAL.md');
const BLOG_DIR = resolve(ROOT, 'research/blog');
const DSM_MAPPINGS_PATH = resolve(ROOT, 'datalake/qif-dsm-mappings.json');
const DERIVATION_LOG_PATH = resolve(ROOT, 'osi-of-mind/QIF-DERIVATION-LOG.md');
const SDK_MANIFEST_PATH = resolve(ROOT, 'datalake/qtara/pyproject.toml');
const CONSTANTS_PATH = resolve(ROOT, 'src/lib/qif-constants.ts');
const ATLAS_PATH = resolve(ROOT, 'datalake/qif-brain-bci-atlas.json');
const CONSTRAINTS_PATH = resolve(ROOT, 'src/lib/bci-limits-constants.ts');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Reads a text file, or undefined if it cannot be read. */
function readFileSafe(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    console.warn(`  [WARN] Could not read ${path}: ${error.message}`);
    return undefined;
  }
}

/** Counts regex matches in a text file; undefined (reported as SKIP) if the file cannot be read. */
function countMatches(path, pattern) {
  try {
    return (readFileSync(path, 'utf8').match(pattern) ?? []).length;
  } catch (error) {
    console.warn(`  [WARN] Could not read ${path}: ${error.message}`);
    return undefined;
  }
}

/** Reads a version string with a one-group regex; undefined (reported as SKIP) if absent or unreadable. */
function readVersion(path, pattern) {
  try {
    const match = readFileSync(path, 'utf8').match(pattern);
    return match ? `v${match[1]}` : undefined;
  } catch (error) {
    console.warn(`  [WARN] Could not read ${path}: ${error.message}`);
    return undefined;
  }
}

function readJSON(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.error(`[ERROR] Could not read ${path}: ${e.message}`);
    return null;
  }
}

function countConstraints(path) {
  try {
    const src = readFileSync(path, 'utf8');
    // Count objects in the BCI_CONSTRAINTS array by matching `{ id:` entries
    const matches = src.match(/\{\s*id:\s*\d+/g);
    return matches ? matches.length : 0;
  } catch (e) {
    console.error(`[ERROR] Could not read ${path}: ${e.message}`);
    return 0;
  }
}

function iso() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// 1. Load timeline
// ---------------------------------------------------------------------------
const timeline = readJSON(TIMELINE_PATH);
if (!timeline) {
  console.error('Cannot proceed without qif-timeline.json');
  process.exit(1);
}

const stats = timeline.current_stats;
const milestones = timeline.milestones;

// ---------------------------------------------------------------------------
// 2. Gather actual counts from source data
// ---------------------------------------------------------------------------
const actual = {};
const staleFields = [];

// Threat techniques (from qtara-registrar.json)
const registry = readJSON(REGISTRY_PATH);
if (registry?.techniques) {
  actual.threat_techniques = registry.techniques.length;
}

// TARA tactics and neurorights referenced by techniques (from qtara-registrar.json)
if (Array.isArray(registry?.tactics)) {
  actual.tara_tactics = registry.tactics.length;
}
if (registry?.techniques) {
  const neurorights = new Set();
  for (const technique of registry.techniques) {
    for (const code of technique.neurorights?.affected ?? []) neurorights.add(code);
  }
  actual.neurorights_mapped = neurorights.size;
}

// Scoring coverage, domains and declared versions (from qtara-registrar.json)
if (registry?.techniques) {
  actual.techniques_niss_scored = registry.techniques.filter((technique) => technique.niss?.version).length;
  actual.tara_domains = new Set(registry.techniques.map((technique) => technique.tara_domain_primary).filter(Boolean)).size;
}
if (registry?.niss_spec?.version) actual.niss_version = `v${registry.niss_spec.version}`;
if (registry?.version) actual.registrar_version = `v${registry.version}`;

// BCI devices (from bci-landscape.json, the dataset the device directory reads)
const landscape = readJSON(LANDSCAPE_PATH);
if (Array.isArray(landscape?.companies)) {
  actual.bci_devices = landscape.companies.reduce((total, company) => total + (company.devices?.length ?? 0), 0);
}

if (Array.isArray(landscape?.companies)) actual.bci_companies = landscape.companies.length;
if (landscape?.version) actual.landscape_dataset_version = `v${landscape.version}`;

// Versions declared in the SDK manifest and the site constants
actual.sdk_version = readVersion(SDK_MANIFEST_PATH, /^version\s*=\s*"([^"]+)"/m);
actual.whitepaper_version = readVersion(CONSTANTS_PATH, /LATEST_WHITEPAPER_VERSION\s*=\s*'([^']+)'/);

// Hourglass bands and DSM-5 codes come from the data they describe
actual.hourglass_bands = countMatches(CONSTANTS_PATH, /^\s*\{\s*id:\s*'[NIS]\d'/gm) || undefined;
// Same source and definition as the Atlas hub's "DSM-5 Codes" stat, so the two cannot diverge.
const dsmMappings = readJSON(DSM_MAPPINGS_PATH);
if (dsmMappings?.diagnostic_clusters) {
  actual.dsm5_diagnoses_mapped = Object.values(dsmMappings.diagnostic_clusters)
    .reduce((total, cluster) => total + (cluster.conditions?.length ?? 0), 0);
}
if (registry?.techniques) {
  actual.techniques_with_dsm5 = registry.techniques.filter((technique) => technique.tara?.dsm5?.primary?.length).length;
}

// Field journal entries (unique numbered headings) and blog posts (committed markdown)
actual.field_journal_entries = new Set(
  (readFileSafe(FIELD_JOURNAL_PATH)?.match(/^#+\s*Entry\s*(\d+)/gm) ?? []).map((heading) => heading.match(/\d+/)[0]),
).size || undefined;
try {
  actual.blog_posts = readdirSync(BLOG_DIR).filter((name) => /\.mdx?$/.test(name)).length;
} catch (error) {
  console.warn(`  [WARN] Could not read ${BLOG_DIR}: ${error.message}`);
}

// Research sources (ID rows in the sources catalog) and derivation log entries
actual.research_sources = countMatches(SOURCES_PATH, /^\| *[A-Z]{1,3}\d+ *\|/gm);
// Numbered entries only: the "Entry Index" heading also starts with "## Entry".
actual.derivation_log_entries = countMatches(DERIVATION_LOG_PATH, /^## Entry \d+/gm);

// Brain regions (from qif-brain-bci-atlas.json)
const atlas = readJSON(ATLAS_PATH);
if (atlas?.brain_regions) {
  actual.brain_regions = atlas.brain_regions.length;
}

// Physics constraints (from bci-limits-constants.ts)
actual.physics_constraints = countConstraints(CONSTRAINTS_PATH);

// ---------------------------------------------------------------------------
// 3. Compare stats
// ---------------------------------------------------------------------------
console.log('\n=== QIF Timeline Stats Check ===\n');
console.log(`Timeline as_of: ${stats.as_of}`);
console.log(`Check date:     ${iso()}\n`);

const fields = [
  'threat_techniques', 'tara_tactics', 'neurorights_mapped', 'bci_devices', 'brain_regions',
  'physics_constraints', 'research_sources', 'derivation_log_entries',
  'techniques_niss_scored', 'tara_domains', 'bci_companies',
  'niss_version', 'registrar_version', 'landscape_dataset_version', 'sdk_version', 'whitepaper_version',
  'hourglass_bands', 'dsm5_diagnoses_mapped', 'techniques_with_dsm5', 'field_journal_entries', 'blog_posts',
];

for (const field of fields) {
  const expected = stats[field];
  const got = actual[field];
  if (got === undefined) {
    console.log(`  ${field}: [SKIP] could not read source data`);
    continue;
  }
  if (got !== expected) {
    staleFields.push({ field, expected, actual: got });
    console.log(`  ${field}: STALE  timeline=${expected}  actual=${got}`);
  } else {
    console.log(`  ${field}: OK (${got})`);
  }
}

// ---------------------------------------------------------------------------
// 4. Scan git log for potentially missing milestones
// ---------------------------------------------------------------------------
console.log('\n=== Potential Missing Milestones ===\n');

const lastDate = milestones.length > 0
  ? milestones[milestones.length - 1].date
  : '2026-01-01';

let commits = [];
try {
  const raw = execSync(
    `git log --since="${lastDate}" --format="%H|%ai|%s" --no-merges`,
    { cwd: ROOT, encoding: 'utf8', timeout: 10000 }
  ).trim();
  if (raw) {
    commits = raw.split('\n').map(line => {
      const [hash, dateStr, ...rest] = line.split('|');
      return { hash, date: dateStr.slice(0, 10), subject: rest.join('|') };
    });
  }
} catch (e) {
  // Not a git repo or git not available
  if (e.message?.includes('not a git repository') || e.status) {
    console.log('  (Not a git repository or git unavailable -- skipping commit scan)\n');
  } else {
    console.log(`  (Git error: ${e.message})\n`);
  }
}

const MILESTONE_PREFIXES = /^\[(Add|Update|Research|Release)\]/i;
const existingTitles = new Set(milestones.map(m => m.title.toLowerCase()));

const candidates = commits.filter(c => MILESTONE_PREFIXES.test(c.subject));
const missing = [];

for (const c of candidates) {
  // Rough check: if the commit subject (minus prefix) already appears in a milestone title, skip
  const cleaned = c.subject.replace(MILESTONE_PREFIXES, '').trim().toLowerCase();
  const alreadyCovered = [...existingTitles].some(t =>
    t.includes(cleaned) || cleaned.includes(t)
  );
  if (!alreadyCovered) {
    missing.push(c);
  }
}

if (missing.length === 0) {
  console.log('  No obvious missing milestones found.\n');
} else {
  console.log(`  Found ${missing.length} commit(s) that may warrant a milestone:\n`);
  for (const c of missing) {
    console.log(`  ${c.date}  ${c.subject}`);
    console.log(`           (${c.hash.slice(0, 8)})`);
  }
  console.log();
}

// ---------------------------------------------------------------------------
// 5. Summary and optional fix
// ---------------------------------------------------------------------------
console.log('=== Summary ===\n');

if (staleFields.length === 0 && missing.length === 0) {
  console.log('  Timeline is up to date. No action needed.');
  process.exit(0);
}

if (staleFields.length > 0) {
  console.log(`  ${staleFields.length} stat(s) are stale:`);
  for (const s of staleFields) {
    console.log(`    - ${s.field}: ${s.expected} -> ${s.actual}`);
  }
}

if (missing.length > 0) {
  console.log(`  ${missing.length} commit(s) may be missing from milestones (review manually).`);
}

console.log();

// Apply fix if requested
if (FIX || DRY_RUN) {
  if (staleFields.length === 0) {
    console.log('  Nothing to fix in current_stats.\n');
  } else {
    const updatedStats = { ...stats };
    for (const s of staleFields) {
      updatedStats[s.field] = s.actual;
    }
    updatedStats.as_of = iso();

    if (DRY_RUN) {
      console.log('  [DRY RUN] Would update current_stats to:');
      console.log(JSON.stringify(updatedStats, null, 2).split('\n').map(l => `    ${l}`).join('\n'));
      console.log();
    }

    if (FIX) {
      timeline.current_stats = updatedStats;
      writeFileSync(TIMELINE_PATH, JSON.stringify(timeline, null, 2) + '\n', 'utf8');
      console.log(`  [FIXED] Updated current_stats in ${TIMELINE_PATH}`);
      console.log(`          as_of set to ${updatedStats.as_of}\n`);
    }
  }
}

// Exit with code 1 if stale (useful for CI warnings)
if (staleFields.length > 0 && !FIX) {
  process.exit(1);
}
