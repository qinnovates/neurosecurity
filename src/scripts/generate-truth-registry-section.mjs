#!/usr/bin/env node
/**
 * Regenerates sections 10.1 to 10.4 of osi-of-mind/whitepapers/QIF-TRUTH.md from
 * the registrar, so the canonical reference cannot drift from the data it
 * describes. Sections 10.5 and 10.6 are editorial prose and are left alone.
 *
 * Why this exists: the section was hand-maintained, and after techniques were
 * added it stated 174 techniques above a severity table that still summed to
 * 139. Run after any registrar change.
 *
 * Usage: node src/scripts/generate-truth-registry-section.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTRAR_PATH = resolve(ROOT, 'datalake/qtara-registrar.json');
const TRUTH_PATH = resolve(ROOT, 'osi-of-mind/whitepapers/QIF-TRUTH.md');
const SECTION_START = '> **Last computed:';
const SECTION_END = '### 10.5 TARA Interactive Visualization';

const RIGHT_NAMES = {
  MP: 'Mental Privacy', MI: 'Mental Integrity', CL: 'Cognitive Liberty',
  PC: 'Psychological Continuity', DI: 'Dynamical Integrity', IDA: 'Informational Disassociation',
};
const SEVERITY_ROWS = [
  ['Critical (9.0-10.0)', 'critical'], ['High (7.0-8.9)', 'high'],
  ['Medium (4.0-6.9)', 'medium'], ['Low (0.1-3.9)', 'low'], ['None (0.0)', 'none'],
];

function tally(items, key) {
  return items.reduce((totals, item) => {
    const value = key(item);
    if (value !== undefined && value !== null) totals[value] = (totals[value] ?? 0) + 1;
    return totals;
  }, {});
}

const registrar = JSON.parse(readFileSync(REGISTRAR_PATH, 'utf8'));
const techniques = registrar.techniques;
const scored = techniques.filter((technique) => technique.niss?.vector);
const unscored = techniques.filter((technique) => !technique.niss?.vector);
const children = techniques.filter((technique) => technique.parent_id);
const severity = tally(scored, (technique) => technique.niss.severity);
const status = tally(techniques, (technique) => technique.status);
const rights = tally(
  techniques.flatMap((technique) => technique.neurorights?.affected ?? []),
  (code) => code,
);
const domains = [...new Set(techniques.map((technique) => technique.tara_domain_primary).filter(Boolean))].sort();
const modes = [...new Set(techniques.map((technique) => technique.tara_mode).filter(Boolean))].sort();
const nissVersions = [...new Set(scored.map((technique) => technique.niss.version))].sort();
const percent = (count, total) => `${((100 * count) / total).toFixed(1)}%`;
const statusText = Object.entries(status)
  .sort(([, a], [, b]) => b - a)
  .map(([name, count]) => `${name.charAt(0)}${name.slice(1).toLowerCase()} ${count}`)
  .join(', ');

const computedOn = new Date().toISOString().slice(0, 10);
const section = `> **Last computed: ${computedOn} from \`datalake/qtara-registrar.json\`** by \`npm run truth:registry\`. Sections 10.1-10.4 are generated; do not edit them by hand. 10.5 and 10.6 are editorial.

### 10.1 Technique Count & Taxonomy

| Metric | Value |
|--------|-------|
| **Total techniques** | ${techniques.length} (${techniques.length - children.length} top-level, ${children.length} sub-techniques) |
| **NISS version** | v${nissVersions.join(', v')} on ${scored.length} techniques; ${unscored.length} not yet scored${unscored.length ? ` (${unscored[0].id} to ${unscored[unscored.length - 1].id})` : ''} |
| **Domains** | ${domains.length} (${domains.join(', ')}) |
| **Modes** | ${modes.length} (${modes.join(', ')}) |
| **Tactics** | ${(registrar.tactics ?? []).length} unique |
| **PINS flagged** | ${scored.filter((technique) => technique.niss.pins).length} |
| **Evidence status** | ${statusText} |

**Open items**, documented per technique in \`datalake/tara-scoring-gaps.json\` and published at \`/atlas/scoring/#coverage\`:
- ${unscored.length} techniques carry no NISS score. Each entry supports only one of the six metrics, so the other five would have to be invented. They stay unscored until their entries carry a measured effect, a functional outcome mapping, an access model and persistence evidence.
- Two severity fields disagree. \`niss.severity\` is formula-derived over the ${scored.length} scored techniques and is what the site shows; the legacy \`severity\` field predates NISS, has no recorded formula, and is retained only because the unscored techniques carry nothing else.
- \`PLAUSIBLE\` and \`SPECULATIVE\` appear as status values but are not among the four documented levels.

### 10.2 NISS Severity Distribution

Percentages are of the ${scored.length} scored techniques.

| Severity | Count | Percentage |
|----------|-------|------------|
${SEVERITY_ROWS.filter(([, key]) => severity[key]).map(([label, key]) => `| ${label} | ${severity[key]} | ${percent(severity[key], scored.length)} |`).join('\n')}

**NP levels:** N (None), T (Temporary/3.3), P (Partial/6.7), S (Structural/10.0) — 4-level scale since v1.1.1

### 10.3 Clinical Mappings

| Mapping | Techniques Covered |
|---------|--------------------|
| DSM-5-TR (F-codes) | ${techniques.filter((technique) => technique.tara?.dsm5?.primary?.length).length} of ${techniques.length} |
| ICD-10 (G/H/R-codes) | ${techniques.filter((technique) => technique.tara?.icd10).length} of ${techniques.length} |

**Schema note:** DSM-5-TR codes (F-codes) live in \`tara.dsm5\`. ICD-10 codes (G/H/R-codes for neurological conditions) live in \`tara.icd10\`. These were split on 2026-03-15. Both are diagnostic category references for threat modeling, not diagnostic claims.

### 10.4 Neurorights Distribution

| Right | Techniques | % |
|-------|-----------|---|
${Object.entries(rights).sort(([, a], [, b]) => b - a).map(([code, count]) => `| ${code} (${RIGHT_NAMES[code] ?? 'Unknown'}) | ${count} | ${percent(count, techniques.length)} |`).join('\n')}

`;

const document = readFileSync(TRUTH_PATH, 'utf8');
const start = document.indexOf(SECTION_START);
const end = document.indexOf(SECTION_END);
if (start === -1 || end === -1 || end < start) {
  console.error(`[truth-registry] Could not locate the generated block in ${TRUTH_PATH}. The 'Last computed' marker or the 10.5 heading may have been renamed.`);
  process.exit(1);
}
const updated = document.slice(0, start) + section + document.slice(end);

if (process.argv.includes('--check')) {
  if (updated !== document) {
    console.error(`[truth-registry] QIF-TRUTH.md sections 10.1-10.4 are stale. Run: npm run truth:registry`);
    process.exit(1);
  }
  console.log(`[truth-registry] sections 10.1-10.4 are current (${techniques.length} techniques).`);
} else {
  writeFileSync(TRUTH_PATH, updated);
  console.log(`[truth-registry] ${techniques.length} techniques (${children.length} sub); ${scored.length} scored, ${unscored.length} unscored; neurorights ${Object.keys(rights).length}.`);
}
