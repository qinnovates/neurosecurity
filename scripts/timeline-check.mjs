#!/usr/bin/env node
/**
 * timeline-check.mjs — Detect stale stats and missing milestones in qif-timeline.json
 *
 * Usage:
 *   node scripts/timeline-check.mjs            # report only
 *   node scripts/timeline-check.mjs --dry-run  # show what --fix would change
 *   node scripts/timeline-check.mjs --fix      # auto-update current_stats + as_of
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const FIX = args.includes('--fix');
const DRY_RUN = args.includes('--dry-run');

// ---------------------------------------------------------------------------
// Paths (relative to repo root)
// ---------------------------------------------------------------------------
const TIMELINE_PATH = resolve(ROOT, 'src/data/qif-timeline.json');
const REGISTRY_PATH = resolve(ROOT, 'shared/qtara-registrar.json');
const INVENTORY_PATH = resolve(ROOT, 'docs/bci-hardware-inventory.json');
const ATLAS_PATH = resolve(ROOT, 'shared/qif-brain-bci-atlas.json');
const CONSTRAINTS_PATH = resolve(ROOT, 'src/lib/bci-limits-constants.ts');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

// BCI devices (from bci-hardware-inventory.json)
const inventory = readJSON(INVENTORY_PATH);
if (inventory?.devices) {
  actual.bci_devices = inventory.devices.length;
}

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

const fields = ['threat_techniques', 'bci_devices', 'brain_regions', 'physics_constraints'];

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
