#!/usr/bin/env node
/**
 * Prebuild: Export KQL tables as static JSON files for client-side fetching.
 *
 * Splits the data into:
 *   src/site/data/kql-tables.json         — all tables EXCEPT impact_chains (~800KB)
 *   src/site/data/kql-impact-chains.json  — impact_chains only (~2.1MB, lazy-loaded)
 *
 * This eliminates the 2-3MB prop serialization overhead where Astro embedded
 * the entire KQL table set as inline JSON in every BciKql page.
 *
 * Run: node scripts/generate-kql-json.mjs
 * Called automatically by: npm run prebuild
 */

import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

// We can't import TypeScript directly from Node, so we use a dynamic
// Vite-based approach. Instead, we'll import the raw JSON and replicate
// the minimal table-building needed for the static export.
//
// However, the cleanest approach is to use Astro's own build system.
// Since kql-tables.ts is already run at build time by Astro, we add
// a simple Astro endpoint that writes the JSON during the build.
//
// For now, we generate from a simpler Node script that calls tsx.

async function main() {
  const outDir = resolve(ROOT, 'src/site/data');
  mkdirSync(outDir, { recursive: true });

  // Use tsx to run the TypeScript table builder
  const { execSync } = await import('child_process');

  // Generate via a tiny inline script that imports kql-tables and writes JSON
  const script = `
    import { getKqlTables } from './src/lib/kql-tables.ts';
    import { writeFileSync } from 'fs';

    const tables = getKqlTables();

    // Split: core tables vs impact chains
    const { impact_chains, ...coreTables } = tables;

    // Write core tables (everything except impact_chains)
    writeFileSync(
      '${outDir}/kql-tables.json',
      JSON.stringify(coreTables)
    );

    // Write impact chains separately (lazy-loaded)
    if (impact_chains && impact_chains.length > 0) {
      writeFileSync(
        '${outDir}/kql-impact-chains.json',
        JSON.stringify({ impact_chains })
      );
    }

    // Write table manifest (for catalog / stats)
    const manifest = {};
    for (const [name, rows] of Object.entries(tables)) {
      manifest[name] = {
        rows: rows.length,
        columns: rows.length > 0 ? Object.keys(rows[0]).length : 0,
      };
    }
    writeFileSync(
      '${outDir}/kql-manifest.json',
      JSON.stringify(manifest, null, 2)
    );

    const coreSize = Buffer.byteLength(JSON.stringify(coreTables));
    const chainsSize = impact_chains ? Buffer.byteLength(JSON.stringify({ impact_chains })) : 0;
    console.log('[kql-export] Core tables: ' + (coreSize / 1024).toFixed(0) + 'KB (' + Object.keys(coreTables).length + ' tables)');
    console.log('[kql-export] Impact chains: ' + (chainsSize / 1024).toFixed(0) + 'KB (' + (impact_chains?.length ?? 0) + ' rows)');
    console.log('[kql-export] Saved: eliminated ~' + ((coreSize + chainsSize) / 1024 * 5).toFixed(0) + 'KB of prop serialization (5 pages × full dataset)');
  `;

  const tmpScript = resolve(ROOT, '.tmp-kql-export.ts');
  writeFileSync(tmpScript, script);

  try {
    execSync(`npx tsx ${tmpScript}`, {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, NODE_OPTIONS: '' },
    });
  } finally {
    // Clean up temp file
    try { execSync(`rm ${tmpScript}`); } catch { /* ignore */ }
  }
}

main().catch(err => {
  console.error('[kql-export] Failed:', err.message);
  process.exit(1);
});
