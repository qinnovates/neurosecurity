#!/usr/bin/env node
/**
 * Generates the Autodidactive lesson's TARA data module from the registrar.
 *
 * Why: `src/site/learn/autodidactive/` is plain static JavaScript that Astro
 * copies verbatim, so it cannot import from `datalake/` at build time the way a
 * component can. Its data module was therefore hand-copied, went stale at 109
 * techniques against the registrar's current count, and read `name` and
 * `description` keys the registrar does not have -- so every technique card
 * rendered with a blank title. Generating the module keeps the lesson honest
 * and makes drift a CI failure rather than something noticed months later.
 *
 * Usage:
 *   node src/scripts/generate-autodidactive-tara.mjs           # write
 *   node src/scripts/generate-autodidactive-tara.mjs --check   # fail on drift
 */
import fs from 'node:fs';
import path from 'node:path';

const REGISTRAR_PATH = 'datalake/qtara-registrar.json';
const OUTPUT_PATH = 'src/site/learn/autodidactive/js/data/tara.js';
const CATALOG_URL = 'https://github.com/qinnovates/neurosecurity/blob/main/datalake/qtara-registrar.json';

/** Only the fields the lesson's views actually read. Everything else stays in the registrar. */
function toLessonTechnique(technique) {
  return {
    id: technique.id,
    name: technique.attack,
    tactic: technique.tactic,
    description: technique.notes ?? '',
    status: technique.status,
    severity: technique.severity,
    bands: technique.band_ids ?? [],
    dualUse: technique.tara?.dual_use ?? '',
    clinicalAnalog: technique.tara?.clinical?.therapeutic_analog ?? '',
    niss_severity: technique.niss?.severity ?? 'none',
  };
}

function buildModule(registrar) {
  const techniques = registrar.techniques.map(toLessonTechnique);
  const header = [
    '// Autodidactive -- TARA Threat Atlas Data',
    `// GENERATED from ${REGISTRAR_PATH} (registrar v${registrar.version}) by`,
    '// src/scripts/generate-autodidactive-tara.mjs. Do not edit by hand:',
    '// run `npm run autodidactive:tara` instead.',
    `// Catalog: ${CATALOG_URL}`,
    '',
  ].join('\n');
  const stats = `export const TARA_STATS = ${JSON.stringify(registrar.statistics, null, 2)};\n`;
  const rows = techniques.map((technique) => `  ${JSON.stringify(technique)},`).join('\n');
  return `${header}\n${stats}\nexport const TARA_CATALOG_URL = ${JSON.stringify(CATALOG_URL)};\n\nexport const TARA_TECHNIQUES = [\n${rows}\n];\n`;
}

function main() {
  const isCheck = process.argv.includes('--check');
  const registrar = JSON.parse(fs.readFileSync(path.resolve(REGISTRAR_PATH), 'utf8'));
  const generated = buildModule(registrar);
  const outputPath = path.resolve(OUTPUT_PATH);
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  const total = registrar.statistics.total_techniques;

  if (current === generated) {
    console.log(`[autodidactive-tara] ${OUTPUT_PATH} is current (${total} techniques).`);
    return;
  }
  if (isCheck) {
    console.error(
      `[autodidactive-tara] ${OUTPUT_PATH} is stale against ${REGISTRAR_PATH} (${total} techniques). Run \`npm run autodidactive:tara\`.`,
    );
    process.exitCode = 1;
    return;
  }
  fs.writeFileSync(outputPath, generated);
  console.log(`[autodidactive-tara] wrote ${OUTPUT_PATH} (${total} techniques).`);
}

try {
  main();
} catch (error) {
  console.error(`[autodidactive-tara] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
