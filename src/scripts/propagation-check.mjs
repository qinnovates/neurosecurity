#!/usr/bin/env node
/**
 * Change Propagation Health Check
 *
 * Validates that all known sync relationships in the QIF project are satisfied.
 * Run: npm run health
 *
 * Checks:
 *   A. Data Consistency — JSON validity, KQL tables, parquet catalog
 *   B. Governance Sync — derivation log, decision log, transparency
 *   C. Count Consistency — technique counts match across files
 *   D. Build Artifacts — staleness detection
 *
 * Exit codes:
 *   0 — all checks passed (warnings are OK)
 *   1 — critical failure (missing files, invalid JSON, broken invariants)
 */

import { readFileSync, statSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

// ── Helpers ──────────────────────────────────────────────────────────

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

let passCount = 0;
let warnCount = 0;
let failCount = 0;

function pass(msg) {
  console.log(`  ${GREEN}\u2713${RESET} ${msg}`);
  passCount++;
}

function warn(msg) {
  console.log(`  ${YELLOW}\u26A0${RESET} ${msg}`);
  warnCount++;
}

function fail(msg) {
  console.log(`  ${RED}\u2717${RESET} ${msg}`);
  failCount++;
}

function fileExists(relPath) {
  return existsSync(resolve(ROOT, relPath));
}

function readJSON(relPath) {
  const abs = resolve(ROOT, relPath);
  const raw = readFileSync(abs, 'utf-8');
  return JSON.parse(raw);
}

function fileSizeKB(relPath) {
  const abs = resolve(ROOT, relPath);
  const stat = statSync(abs);
  return Math.round(stat.size / 1024);
}

function fileMtime(relPath) {
  const abs = resolve(ROOT, relPath);
  return statSync(abs).mtimeMs;
}

function readText(relPath) {
  return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

// ── A. Data Consistency ──────────────────────────────────────────────

function checkDataConsistency() {
  console.log(`\n${GREEN}[health]${RESET} Checking data consistency...`);

  // 1. Validate all datalake/*.json files
  const sharedDir = resolve(ROOT, 'datalake');
  let jsonFiles;
  try {
    jsonFiles = readdirSync(sharedDir).filter(f => f.endsWith('.json'));
  } catch {
    fail('Cannot read datalake/ directory');
    return;
  }

  let validCount = 0;
  let invalidFiles = [];
  for (const file of jsonFiles) {
    try {
      const raw = readFileSync(join(sharedDir, file), 'utf-8');
      JSON.parse(raw);
      validCount++;
    } catch (e) {
      invalidFiles.push(file);
    }
  }

  if (invalidFiles.length === 0) {
    pass(`${validCount} JSON files valid`);
  } else {
    fail(`Invalid JSON: ${invalidFiles.join(', ')}`);
  }

  // 2. KQL tables JSON
  const kqlPath = 'src/site/data/kql-tables.json';
  if (fileExists(kqlPath)) {
    try {
      readJSON(kqlPath);
      pass(`KQL tables present (${fileSizeKB(kqlPath)}KB)`);
    } catch {
      fail('src/site/data/kql-tables.json exists but is invalid JSON');
    }
  } else {
    warn('src/site/data/kql-tables.json missing (run: npm run prebuild)');
  }

  // 3. Parquet catalog
  const catalogPath = 'datalake/parquet/catalog.json';
  if (fileExists(catalogPath)) {
    try {
      const catalog = readJSON(catalogPath);
      const datasetCount = catalog.datasets
        ? Object.keys(catalog.datasets).length
        : Array.isArray(catalog) ? catalog.length : Object.keys(catalog).length;
      pass(`Parquet catalog present (${datasetCount} datasets)`);
    } catch {
      fail('datalake/parquet/catalog.json exists but is invalid JSON');
    }
  } else {
    warn('datalake/parquet/catalog.json missing (run: npm run prebuild)');
  }

  // 4. Parquet file count vs catalog dataset count
  const parquetDir = resolve(ROOT, 'datalake/parquet');
  if (fileExists(catalogPath) && existsSync(parquetDir)) {
    try {
      const catalog = readJSON(catalogPath);
      const parquetFiles = readdirSync(parquetDir).filter(f => f.endsWith('.parquet'));
      const catalogCount = catalog.datasets
        ? Object.keys(catalog.datasets).length
        : Array.isArray(catalog) ? catalog.length : Object.keys(catalog).length;

      const diff = Math.abs(parquetFiles.length - catalogCount);
      if (diff <= 2) {
        pass(`Parquet files: ${parquetFiles.length}, catalog: ${catalogCount} datasets (within tolerance)`);
      } else {
        warn(`Parquet files: ${parquetFiles.length}, catalog datasets: ${catalogCount} (drift > 2, run: npm run prebuild)`);
      }
    } catch {
      // Already reported above
    }
  }

  // 5. Technique count in registrar
  const registrarPath = 'datalake/qtara-registrar.json';
  if (fileExists(registrarPath)) {
    try {
      const registrar = readJSON(registrarPath);
      const techniques = Array.isArray(registrar) ? registrar : (registrar.techniques || []);
      pass(`Registrar loaded: ${techniques.length} techniques`);
    } catch {
      fail('Cannot parse datalake/qtara-registrar.json');
    }
  } else {
    fail('datalake/qtara-registrar.json missing');
  }
}

// ── B. Governance Sync ───────────────────────────────────────────────

function checkGovernanceSync() {
  console.log(`\n${GREEN}[health]${RESET} Checking governance sync...`);

  // 1. Derivation log exists
  const derivLogPath = 'model/QIF-DERIVATION-LOG.md';
  if (fileExists(derivLogPath)) {
    const content = readText(derivLogPath);
    const entryHeaders = content.match(/^## Entry \d+/gm) || [];
    pass(`Derivation log: ${entryHeaders.length} entries`);
  } else {
    fail('model/QIF-DERIVATION-LOG.md missing');
  }

  // 2. Decision log AUTO-GENERATED header
  const decisionLogPath = 'governance/DECISION-LOG.md';
  if (fileExists(decisionLogPath)) {
    const content = readText(decisionLogPath);
    if (content.includes('AUTO-GENERATED')) {
      pass('Decision log: AUTO-GENERATED header present');
    } else {
      warn('governance/DECISION-LOG.md missing AUTO-GENERATED header (may have been manually edited)');
    }
  } else {
    fail('governance/DECISION-LOG.md missing');
  }

  // 3. Transparency AUTO-GENERATED header
  const transparencyPath = 'governance/TRANSPARENCY.md';
  if (fileExists(transparencyPath)) {
    const content = readText(transparencyPath);
    if (content.includes('AUTO-GENERATED')) {
      pass('Transparency: AUTO-GENERATED header present');
    } else {
      warn('governance/TRANSPARENCY.md missing AUTO-GENERATED header (may have been manually edited)');
    }
  } else {
    fail('governance/TRANSPARENCY.md missing');
  }

  // 4. Decision log has status column (replaces ship log)
  if (fileExists('governance/DECISION-LOG.md')) {
    const dl = readText('governance/DECISION-LOG.md');
    if (dl.includes('Status')) {
      pass('Decision log has status column');
    } else {
      warn('Decision log missing status column (run: npm run governance)');
    }
  }
}

// ── C. Count Consistency ─────────────────────────────────────────────

function checkCountConsistency() {
  console.log(`\n${GREEN}[health]${RESET} Checking counts...`);

  // Get technique count from registrar
  const registrarPath = 'datalake/qtara-registrar.json';
  let techniqueCount = null;
  if (fileExists(registrarPath)) {
    try {
      const registrar = readJSON(registrarPath);
      const techniques = Array.isArray(registrar) ? registrar : (registrar.techniques || []);
      techniqueCount = techniques.length;
      pass(`Registrar: ${techniqueCount} techniques`);
    } catch {
      fail('Cannot parse registrar for count check');
      return;
    }
  } else {
    fail('Registrar missing, cannot check counts');
    return;
  }

  // Check README.md for technique count references
  const readmePath = 'README.md';
  if (fileExists(readmePath)) {
    const readme = readText(readmePath);
    const lines = readme.split('\n');
    const countPattern = /(\d+)\s*technique/gi;

    for (let i = 0; i < lines.length; i++) {
      // Skip validation table rows (historical test results — counts were correct at test time)
      if (lines[i].includes('val-') || lines[i].includes('VALIDATION') || lines[i].includes('scored,')) continue;
      let match;
      while ((match = countPattern.exec(lines[i])) !== null) {
        const mentioned = parseInt(match[1], 10);
        if (mentioned !== techniqueCount) {
          warn(`README.md line ${i + 1}: says "${mentioned}" but registrar has ${techniqueCount}`);
        }
      }
    }
  }

  // Check additional files for stale technique counts
  const additionalFiles = [
    'model/whitepapers/QIF-TRUTH.md',
    'model/whitepapers/QIF-WHITEPAPER-V8-DRAFT.md',
    'model/whitepapers/QIF-WHITEPAPER.md',
    'model/tara-threat/README.md',
    'model/README.md',
    'datalake/QIF-DATA-MAPPING.md',
    'src/data/convergence-data.ts',
  ];
  for (const fp of additionalFiles) {
    if (fileExists(fp)) {
      const content = readText(fp);
      const lines = content.split('\n');
      const countPattern = /(\d+)\s*technique/gi;
      for (let i = 0; i < lines.length; i++) {
        // Skip changelog/version history lines (historical — correct at that time)
        if (lines[i].includes('changelog') || lines[i].includes('v1.') || lines[i].includes('summary":')) continue;
        let match;
        while ((match = countPattern.exec(lines[i])) !== null) {
          const mentioned = parseInt(match[1], 10);
          if (mentioned !== techniqueCount && mentioned > 50) { // Only flag counts > 50 to avoid false positives
            warn(`${fp} line ${i + 1}: says "${mentioned}" but registrar has ${techniqueCount}`);
          }
        }
      }
    }
  }

  // Check derivation log entry count vs governance reports
  const derivLogPath = 'model/QIF-DERIVATION-LOG.md';
  const transparencyPath = 'governance/TRANSPARENCY.md';
  if (fileExists(derivLogPath) && fileExists(transparencyPath)) {
    const derivContent = readText(derivLogPath);
    const derivEntries = (derivContent.match(/^## Entry \d+/gm) || []).length;

    const transContent = readText(transparencyPath);
    // Look for entry count mentions in transparency
    const transCountMatch = transContent.match(/(\d+)\s*(?:entries|entry|decisions)/i);
    if (transCountMatch) {
      const transCount = parseInt(transCountMatch[1], 10);
      if (transCount !== derivEntries) {
        warn(`Transparency.md reports ${transCount} entries but log has ${derivEntries} (run: npm run governance)`);
      } else {
        pass(`Governance entry counts in sync (${derivEntries})`);
      }
    }
  }
}

// ── D. Build Artifacts ───────────────────────────────────────────────

function checkBuildArtifacts() {
  console.log(`\n${GREEN}[health]${RESET} Checking build artifacts...`);

  const sharedDir = resolve(ROOT, 'datalake');
  let jsonFiles;
  try {
    jsonFiles = readdirSync(sharedDir).filter(f => f.endsWith('.json'));
  } catch {
    fail('Cannot read datalake/ directory');
    return;
  }

  // Find newest datalake/*.json mtime
  let newestSharedMtime = 0;
  let newestSharedFile = '';
  for (const file of jsonFiles) {
    try {
      const mtime = statSync(join(sharedDir, file)).mtimeMs;
      if (mtime > newestSharedMtime) {
        newestSharedMtime = mtime;
        newestSharedFile = file;
      }
    } catch {
      // skip
    }
  }

  // Check KQL tables staleness
  const kqlPath = 'src/site/data/kql-tables.json';
  if (fileExists(kqlPath) && newestSharedMtime > 0) {
    const kqlMtime = fileMtime(kqlPath);
    if (kqlMtime < newestSharedMtime) {
      warn(`src/site/data/kql-tables.json is older than datalake/${newestSharedFile} (run: npm run prebuild)`);
    } else {
      pass('KQL tables up to date');
    }
  }

  // Check parquet catalog staleness
  const catalogPath = 'datalake/parquet/catalog.json';
  if (fileExists(catalogPath) && newestSharedMtime > 0) {
    const catMtime = fileMtime(catalogPath);
    if (catMtime < newestSharedMtime) {
      warn(`datalake/parquet/catalog.json is older than datalake/${newestSharedFile} (run: npm run prebuild)`);
    } else {
      pass('Parquet catalog up to date');
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────

console.log(`\n${'='.repeat(60)}`);
console.log(`  QIF Change Propagation Health Check`);
console.log(`${'='.repeat(60)}`);

checkDataConsistency();
checkGovernanceSync();
checkCountConsistency();
checkBuildArtifacts();

// Summary
console.log(`\n${GREEN}[health]${RESET} Summary: ${passCount} checks passed, ${warnCount} warnings, ${failCount} failures\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
