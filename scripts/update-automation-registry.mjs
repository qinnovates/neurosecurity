#!/usr/bin/env node
/**
 * update-automation-registry.mjs — Refresh last_triggered and last_status
 * for all GitHub Action entries in the automation registry.
 *
 * Usage:
 *   node scripts/update-automation-registry.mjs
 *
 * Requires: gh CLI authenticated with repo access.
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = resolve(__dirname, '..', 'src', 'data', 'automation-registry.json');

function getWorkflowFilename(sourcePath) {
  if (!sourcePath) return null;
  return basename(sourcePath);
}

function fetchLastRun(workflowFilename) {
  try {
    const cmd = `gh run list --workflow="${workflowFilename}" --limit=1 --json status,conclusion,updatedAt`;
    const output = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 15_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    const runs = JSON.parse(output);
    if (!runs || runs.length === 0) return null;

    const run = runs[0];
    return {
      last_triggered: run.updatedAt || null,
      last_status: mapConclusion(run.conclusion, run.status),
    };
  } catch {
    // gh CLI not available, not authenticated, or workflow never ran
    return null;
  }
}

function mapConclusion(conclusion, status) {
  if (status === 'in_progress' || status === 'queued') return 'unknown';
  if (conclusion === 'success') return 'success';
  if (conclusion === 'failure') return 'failure';
  if (conclusion === 'cancelled') return 'failure';
  return 'unknown';
}

function main() {
  const raw = readFileSync(REGISTRY_PATH, 'utf-8');
  const registry = JSON.parse(raw);
  let changed = false;

  for (const entry of registry.entries) {
    if (entry.type !== 'github_action') continue;

    const filename = getWorkflowFilename(entry.source_file);
    if (!filename) continue;

    // Skip disabled workflows (gh won't find runs for .disabled files)
    if (filename.endsWith('.disabled')) continue;

    console.log(`Checking: ${entry.name} (${filename})...`);
    const result = fetchLastRun(filename);

    if (!result) {
      console.log(`  -> No run data found`);
      continue;
    }

    if (
      entry.last_triggered !== result.last_triggered ||
      entry.last_status !== result.last_status
    ) {
      entry.last_triggered = result.last_triggered;
      entry.last_status = result.last_status;
      changed = true;
      console.log(`  -> Updated: ${result.last_status} at ${result.last_triggered}`);
    } else {
      console.log(`  -> No change`);
    }
  }

  if (changed) {
    registry.last_updated = new Date().toISOString();
    writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
    console.log(`\nRegistry updated at ${registry.last_updated}`);
  } else {
    console.log('\nNo changes detected.');
  }

  // Exit with code 0 if no changes (used by the workflow to skip commit)
  process.exit(changed ? 0 : 2);
}

main();
