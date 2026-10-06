#!/usr/bin/env node
/**
 * Regenerates the `statistics` block of datalake/qtara-registrar.json from the
 * techniques array, so no published figure can drift away from the catalogue.
 *
 * Why this exists: the block was hand-maintained. `total_techniques` and a few
 * of the top-level `by_*` tallies were kept current, but the enrichment
 * sub-blocks were last touched when the catalogue held 135 techniques. By the
 * time the catalogue reached 165 the block was publishing, through
 * /api/qif.json and /api/tara.json, figures such as enriched_techniques 135,
 * dsm5.techniques_with_dsm5 135 and dsm5.unique_dsm_codes 15 against true
 * values of 165, 76 and 28. The dual-use, cluster, risk-class, CVSS gap-group
 * and physics-tier tallies had drifted too.
 *
 * Nothing here is a historical snapshot: every counted field describes the
 * catalogue as it stands. The handful of fields that are editorial rather than
 * derivable are read from the existing block (or from the specs) and carried
 * through unchanged — see EDITORIAL_FIELDS below.
 *
 * Usage:
 *   node src/scripts/generate-registrar-statistics.mjs            # write
 *   node src/scripts/generate-registrar-statistics.mjs --check    # exit 1 if stale
 *   node src/scripts/generate-registrar-statistics.mjs --dry-run  # print diff only
 *
 * Run after any registrar change, then sync the SDK copy
 * (datalake/qtara/src/qtara/data/qtara-registrar.json) per .claude/rules/registrar.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTRAR_PATH = resolve(ROOT, 'datalake/qtara-registrar.json');

/**
 * Fields in `statistics` that are editorial, provenance or specification
 * metadata rather than tallies over the techniques array. These are preserved
 * verbatim from the current block; they are not derivable and must stay
 * hand-maintained.
 */
const EDITORIAL_FIELDS = [
  'neurorights.taxonomy — the neurorights abbreviation glossary',
  'neurorights.sources — the citations the taxonomy rests on',
  'regulatory.framework — the name of the legal framework the mapping targets',
  'physics_feasibility.constraint_system_ref — provenance pointer to the derivation log',
  'physics_feasibility.analysis_date — when the feasibility analysis was performed',
  'physics_feasibility.notes — prose definitions of the feasibility tiers',
  'tara.dsm5.version, neurorights.version, regulatory.version, physics_feasibility.version, tara_taxonomy_version — enrichment-schema versions',
];

const checkOnly = process.argv.includes('--check');
const dryRun = process.argv.includes('--dry-run');

const registrarRaw = readFileSync(REGISTRAR_PATH, 'utf8');
const registrar = JSON.parse(registrarRaw);
const techniques = registrar.techniques;
const previous = registrar.statistics ?? {};

/** Count items by a key or accessor, skipping entries whose value is null/undefined. */
function countBy(items, key, seed = {}) {
  const totals = { ...seed };
  for (const item of items) {
    const value = typeof key === 'function' ? key(item) : item[key];
    if (value === null || value === undefined) continue;
    totals[value] = (totals[value] ?? 0) + 1;
  }
  return totals;
}

/** Sort a tally so the generated block has a stable key order. */
function sortTally(tally) {
  return Object.fromEntries(Object.entries(tally).sort(([a], [b]) => a.localeCompare(b, 'en')));
}

/** The highest version recorded in the registrar's own changelog. */
function latestChangelogVersion() {
  const versions = (registrar.changelog ?? [])
    .map((entry) => entry.version)
    .filter((version) => typeof version === 'string');
  if (versions.length === 0) return previous.tara?.version ?? null;
  return versions.sort((a, b) => {
    const left = a.split('.').map(Number);
    const right = b.split('.').map(Number);
    for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
      const diff = (left[i] ?? 0) - (right[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }).pop();
}

// ── Populations ───────────────────────────────────────────────────────────
const withTara = techniques.filter((technique) => technique.tara);
const withDsm5Block = techniques.filter((technique) => technique.tara?.dsm5);
const withDsm5Primary = techniques.filter((technique) => technique.tara?.dsm5?.primary?.length > 0);
const withNeurorights = techniques.filter((technique) => technique.neurorights);
const withFdora = techniques.filter((technique) => technique.regulatory?.fdora_524b);
const withPhysics = techniques.filter((technique) => technique.physics_feasibility);
const scored = techniques.filter((technique) => technique.niss?.vector);

// ── DSM-5-TR codes ────────────────────────────────────────────────────────
const primaryCodes = new Set();
const allCodes = new Set();
for (const technique of withDsm5Block) {
  for (const entry of technique.tara.dsm5.primary ?? []) {
    primaryCodes.add(entry.code);
    allCodes.add(entry.code);
  }
  for (const entry of technique.tara.dsm5.secondary ?? []) {
    allCodes.add(entry.code);
  }
}

// ── Neurorights ───────────────────────────────────────────────────────────
const rightsCounts = {};
const cciValues = [];
for (const technique of withNeurorights) {
  for (const right of technique.neurorights.affected ?? []) {
    rightsCounts[right] = (rightsCounts[right] ?? 0) + 1;
  }
  if (typeof technique.neurorights.cci === 'number') cciValues.push(technique.neurorights.cci);
}
const round2 = (value) => Math.round(value * 100) / 100;

// ── FDORA §524B ───────────────────────────────────────────────────────────
const requirementCounts = {};
const gapCounts = {};
const coverageScores = [];
for (const technique of withFdora) {
  const fdora = technique.regulatory.fdora_524b;
  for (const requirement of fdora.applicable_requirements ?? []) {
    requirementCounts[requirement] = (requirementCounts[requirement] ?? 0) + 1;
  }
  for (const gap of fdora.gaps ?? []) {
    const key = gap.split('(')[0].trim();
    gapCounts[key] = (gapCounts[key] ?? 0) + 1;
  }
  if (typeof fdora.coverage_score === 'number') coverageScores.push(fdora.coverage_score);
}
// A technique fails the §524B "cyber device" test when one of its prongs is false.
const prongFailures = {};
for (const technique of withFdora) {
  for (const [prong, passes] of Object.entries(technique.regulatory.fdora_524b.prongs ?? {})) {
    if (passes === false) prongFailures[prong] = (prongFailures[prong] ?? 0) + 1;
  }
}

// ── Build the block ───────────────────────────────────────────────────────
const nissSeveritySeed = Object.fromEntries(
  Object.keys(registrar.niss_spec?.severity_scale ?? {}).map((severity) => [severity, 0]),
);

const statistics = {
  generator: 'src/scripts/generate-registrar-statistics.mjs',
  generated: new Date().toISOString().slice(0, 10),
  total_techniques: techniques.length,
  total_tactics: (registrar.tactics ?? []).length,
  total_domains: Array.isArray(registrar.domains)
    ? registrar.domains.length
    : Object.keys(registrar.domains ?? {}).length,
  by_tactic: sortTally(countBy(techniques, 'tactic')),
  by_status: sortTally(countBy(techniques, 'status')),
  by_severity: sortTally(countBy(techniques, 'severity')),
  by_ui_category: sortTally(countBy(techniques, 'ui_category')),
  by_niss_severity: sortTally(countBy(techniques, (t) => t.niss?.severity ?? 'none', nissSeveritySeed)),
  niss_cvss_mapping: {
    techniques_scored: scored.length,
    techniques_unscored: techniques.length - scored.length,
    pins_flagged: techniques.filter((technique) => technique.niss?.pins).length,
    by_gap_group: sortTally(countBy(techniques, (technique) => technique.cvss?.gap_group)),
    techniques_without_cvss: techniques.filter((technique) => !technique.cvss).length,
  },
  tara: {
    version: latestChangelogVersion(),
    enriched_techniques: withTara.length,
    dual_use_breakdown: sortTally(countBy(withTara, (technique) => technique.tara.dual_use)),
    techniques_with_clinical_analog: withTara.filter((technique) => technique.tara.clinical).length,
    techniques_silicon_only: withTara.filter((technique) => technique.tara.dual_use === 'silicon_only').length,
    dsm5: {
      version: previous.tara?.dsm5?.version ?? registrar.dsm5_spec?.version ?? null,
      techniques_with_dsm5_block: withDsm5Block.length,
      techniques_with_dsm5: withDsm5Primary.length,
      unique_dsm_codes: primaryCodes.size,
      unique_dsm_codes_including_secondary: allCodes.size,
      cluster_breakdown: sortTally(countBy(withDsm5Block, (technique) => technique.tara.dsm5.cluster)),
      risk_class_breakdown: sortTally(countBy(withDsm5Block, (technique) => technique.tara.dsm5.risk_class)),
    },
    neurorights_mapped: withNeurorights.length,
  },
  neurorights: {
    version: previous.neurorights?.version ?? null,
    taxonomy: previous.neurorights?.taxonomy ?? {},
    sources: previous.neurorights?.sources ?? [],
    techniques_mapped: withNeurorights.length,
    techniques_unmapped: techniques.length - withNeurorights.length,
    techniques_by_right: sortTally(rightsCounts),
    cci_stats: {
      mean: cciValues.length ? round2(cciValues.reduce((a, b) => a + b, 0) / cciValues.length) : 0,
      max: cciValues.length ? round2(Math.max(...cciValues)) : 0,
      min: cciValues.length ? round2(Math.min(...cciValues)) : 0,
      techniques_above_2: cciValues.filter((value) => value > 2).length,
    },
  },
  regulatory: {
    version: previous.regulatory?.version ?? null,
    framework: previous.regulatory?.framework ?? null,
    techniques_mapped: withFdora.length,
    techniques_unmapped: techniques.length - withFdora.length,
    cyber_device_techniques: withFdora.filter((t) => t.regulatory.fdora_524b.cyber_device).length,
    non_cyber_device_techniques: withFdora.filter((t) => !t.regulatory.fdora_524b.cyber_device).length,
    prong_failure_reasons: sortTally(prongFailures),
    techniques_per_requirement: sortTally(requirementCounts),
    coverage_stats: {
      mean: coverageScores.length ? round2(coverageScores.reduce((a, b) => a + b, 0) / coverageScores.length) : 0,
      min: coverageScores.length ? round2(Math.min(...coverageScores)) : 0,
      max: coverageScores.length ? round2(Math.max(...coverageScores)) : 0,
      below_0_5: coverageScores.filter((score) => score < 0.5).length,
    },
    top_gaps: Object.fromEntries(Object.entries(gapCounts).sort((a, b) => b[1] - a[1])),
  },
  physics_feasibility: {
    version: previous.physics_feasibility?.version ?? null,
    analysis_date: previous.physics_feasibility?.analysis_date ?? null,
    constraint_system_ref: previous.physics_feasibility?.constraint_system_ref ?? null,
    techniques_assessed: withPhysics.length,
    techniques_unassessed: techniques.length - withPhysics.length,
    by_tier: sortTally(countBy(withPhysics, (technique) => technique.physics_feasibility.tier_label)),
    by_tier_id: sortTally(countBy(withPhysics, (technique) => String(technique.physics_feasibility.tier))),
    notes: previous.physics_feasibility?.notes ?? [],
  },
  by_origin: sortTally(countBy(techniques, (technique) => technique.origin?.category)),
  tara_taxonomy_version: previous.tara_taxonomy_version ?? null,
  editorial_fields: EDITORIAL_FIELDS,
};

// ── Emit ──────────────────────────────────────────────────────────────────
/**
 * Replace only the `statistics` object in the raw file text. Reserialising the
 * whole registrar would rewrite unrelated lines, because JSON.stringify emits
 * NISS scores such as 6.0 as `6`.
 */
function replaceStatisticsBlock(raw, block) {
  const anchor = raw.indexOf('\n  "statistics": {');
  if (anchor === -1) throw new Error('Could not locate the "statistics" block in the registrar.');
  const openBrace = raw.indexOf('{', anchor);
  let depth = 0;
  let closeBrace = -1;
  let inString = false;
  let escaped = false;
  for (let i = openBrace; i < raw.length; i += 1) {
    const char = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        closeBrace = i;
        break;
      }
    }
  }
  if (closeBrace === -1) throw new Error('Unterminated "statistics" block in the registrar.');
  const indented = block.split('\n').map((line, i) => (i === 0 ? line : `  ${line}`)).join('\n');
  return raw.slice(0, openBrace) + indented + raw.slice(closeBrace + 1);
}

const nextBlock = JSON.stringify(statistics, null, 2);
const nextRaw = replaceStatisticsBlock(registrarRaw, nextBlock);
// Compare ignoring `generated`, so a re-run on a later day is not "stale".
const normalise = (block) => {
  const { generated, ...rest } = block ?? {};
  return JSON.stringify(rest, null, 2);
};
const isUnchanged = normalise(statistics) === normalise(previous);

if (checkOnly) {
  if (isUnchanged) {
    console.log(`[registrar-stats] statistics block is current (${techniques.length} techniques).`);
    process.exit(0);
  }
  console.error('[registrar-stats] statistics block is stale. Run: node src/scripts/generate-registrar-statistics.mjs');
  process.exit(1);
}

if (dryRun) {
  console.log(nextBlock);
  console.log(`\n[registrar-stats] dry run — ${isUnchanged ? 'no change' : 'block would change'}.`);
  process.exit(0);
}

writeFileSync(REGISTRAR_PATH, nextRaw);
console.log(
  `[registrar-stats] ${techniques.length} techniques; TARA v${statistics.tara.version}; ` +
    `DSM-5 primary ${statistics.tara.dsm5.techniques_with_dsm5} over ${statistics.tara.dsm5.unique_dsm_codes} codes ` +
    `(${statistics.tara.dsm5.unique_dsm_codes_including_secondary} incl. secondary); ` +
    `neurorights ${statistics.neurorights.techniques_mapped}; FDORA ${statistics.regulatory.techniques_mapped}.`,
);
