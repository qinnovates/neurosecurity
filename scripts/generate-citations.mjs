#!/usr/bin/env node
/**
 * generate-citations.mjs
 *
 * Source of truth: datalake/research-registry.json
 * Generates:
 *   1. Landscape-relevant sections appended to QIF-RESEARCH-SOURCES.md
 *      (scholarship + timeline entries not already present)
 *   2. Validates landscape.astro imports from registry (advisory only)
 *
 * Usage:
 *   node scripts/generate-citations.mjs           # Run sync
 *   node scripts/generate-citations.mjs --dry-run  # Preview changes
 *   node scripts/generate-citations.mjs --check     # CI mode: exit 1 if out of sync
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const REGISTRY_PATH = resolve(ROOT, 'datalake/research-registry.json');
const SOURCES_PATH = resolve(ROOT, 'model/QIF-RESEARCH-SOURCES.md');
const LANDSCAPE_PATH = resolve(ROOT, 'src/pages/landscape.astro');

const dryRun = process.argv.includes('--dry-run');
const checkOnly = process.argv.includes('--check');

// ── Load registry ──
const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
const sourcesContent = readFileSync(SOURCES_PATH, 'utf-8');

let issues = [];
let updates = [];

// ── 1. Check landscape.astro imports from registry ──
const landscapeContent = readFileSync(LANDSCAPE_PATH, 'utf-8');
if (!landscapeContent.includes("import registry from '../../datalake/research-registry.json'")) {
  issues.push('landscape.astro does not import from research-registry.json');
}

// ── 2. Check scholarship entries exist in QIF-RESEARCH-SOURCES.md ──
const scholarship = registry.timelines?.scholarship || registry.scholarship || [];
for (const entry of scholarship) {
  // Try multiple matching strategies
  const authors = entry.authors || '';
  const authorLastName = authors.split(',')[0]?.split('.').pop()?.trim();
  const title = entry.title || '';
  const doi = entry.doi || '';

  if (!authorLastName && !title && !doi) continue;

  // Match by DOI (strongest), title substring, or author+year
  const hasDoi = doi && sourcesContent.includes(doi);
  const hasTitle = title && sourcesContent.toLowerCase().includes(title.toLowerCase().slice(0, 40));
  const hasAuthorYear = authorLastName && new RegExp(
    `${escapeRegex(authorLastName)}.*${escapeRegex(entry.year)}`, 'i'
  ).test(sourcesContent);

  if (!hasDoi && !hasTitle && !hasAuthorYear) {
    issues.push(`Missing in QIF-RESEARCH-SOURCES.md: ${authorLastName || 'Unknown'} (${entry.year}) — "${title || entry.desc}"`);
  }
}

// ── 3. Check neurosecurity timeline entries with DOIs exist in sources ──
const secTimeline = registry.timelines?.neurosecurity || [];
for (const entry of secTimeline) {
  if (!entry.doi) continue;

  if (!sourcesContent.includes(entry.doi)) {
    issues.push(`DOI missing in QIF-RESEARCH-SOURCES.md: ${entry.doi} — ${entry.label} (${entry.year})`);
  }
}

// ── 4. Check explorer count matches ──
const explorerCount = registry.explorer?.length || 0;
const ethicsTimelineCount = registry.timelines?.neuroethics?.length || 0;
const secTimelineCount = secTimeline.length || 0;
const scholarshipCount = scholarship.length || 0;

// ── 5. Validate registry has "Next: QIF" entry in security timeline ──
const hasQifEntry = secTimeline.some(e => e.label === 'QIF' || e.year === 'Next');
if (!hasQifEntry) {
  issues.push('Security timeline missing "Next: QIF" entry');
}

// ── Report ──
console.log(`\n📊 Registry: v${registry.version} (${registry.updated})`);
console.log(`   Explorer entries: ${explorerCount}`);
console.log(`   Ethics timeline:  ${ethicsTimelineCount}`);
console.log(`   Security timeline: ${secTimelineCount}`);
console.log(`   Scholarship:      ${scholarshipCount}\n`);

if (issues.length === 0) {
  console.log('All registry entries are synced to QIF-RESEARCH-SOURCES.md');
  process.exit(0);
} else {
  console.log(`Found ${issues.length} sync issue(s):\n`);
  for (const issue of issues) {
    console.log(`  - ${issue}`);
  }
  console.log('');

  if (checkOnly) {
    console.log('CI check failed. Run `node scripts/generate-citations.mjs` to fix.');
    process.exit(1);
  } else if (dryRun) {
    console.log('Dry run — no changes made.');
    process.exit(0);
  } else {
    console.log('Manual sync required. Add missing entries to QIF-RESEARCH-SOURCES.md.');
    process.exit(0);
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
