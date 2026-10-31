#!/usr/bin/env node
/**
 * Derives the public datalake inventory from the datasets themselves and emits
 * every published form of it: a machine-readable snapshot, two committed SVG
 * charts, and the generated block in the root README.
 *
 * Why this exists: the README used to carry hand-typed figures ("340+ sources",
 * "174 techniques", "55 CVEs") that drifted the moment a dataset changed. Any
 * number a reader can see here is now counted at build time from the file that
 * owns it, so a stale figure is a failing check rather than a published claim.
 *
 * The SVGs are committed rather than rendered on demand because the README has
 * to draw on github.com, which runs no scripts and fetches no services.
 *
 * Usage:
 *   node src/scripts/generate-datalake-inventory.mjs            # write
 *   node src/scripts/generate-datalake-inventory.mjs --check    # exit 1 if stale
 *
 * Fails loudly: a missing source file, an unreadable one, or an extractor that
 * yields a non-positive count aborts the run. Silently publishing a zero is the
 * failure mode this script exists to prevent.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const INVENTORY_PATH = resolve(ROOT, 'datalake/inventory.json');
const README_PATH = resolve(ROOT, 'README.md');
const CORPUS_SVG_PATH = resolve(ROOT, 'src/site/images/datalake-corpus.svg');
const EVIDENCE_SVG_PATH = resolve(ROOT, 'src/site/images/evidence-profile.svg');

const BEGIN_MARKER = '<!-- BEGIN GENERATED: datalake-inventory -->';
const END_MARKER = '<!-- END GENERATED: datalake-inventory -->';

const checkOnly = process.argv.includes('--check');

/** Palette shared with the site stylesheet; mid-tones so the SVGs read on a light or a dark README. */
const PALETTE = {
  ink: '#0b1120',
  panel: '#111a2e',
  grid: '#24324d',
  text: '#e6ebf5',
  muted: '#93a1bd',
  threat: '#06b6d4',
  anatomy: '#8b5cf6',
  landscape: '#f59e0b',
  evidence: '#10b981',
  caution: '#ef4444',
};

class GenerationError extends Error {}

/** Read and parse a required JSON source, naming the file in every failure path. */
function loadJson(relativePath) {
  const absolute = resolve(ROOT, relativePath);
  let raw;
  try {
    raw = readFileSync(absolute, 'utf8');
  } catch (cause) {
    throw new GenerationError(
      `Cannot read required dataset "${relativePath}". The inventory cannot be derived without it. ` +
        `Restore the file or remove its entry from DATASETS in src/scripts/generate-datalake-inventory.mjs. (${cause.code ?? cause.message})`,
    );
  }
  try {
    return JSON.parse(raw);
  } catch (cause) {
    throw new GenerationError(`Dataset "${relativePath}" is not valid JSON: ${cause.message}`);
  }
}

/** Length of an array at a dotted path, rejecting anything that is not a populated array. */
function countAt(doc, path, relativePath) {
  const value = path === '' ? doc : path.split('.').reduce((node, key) => (node == null ? node : node[key]), doc);
  if (!Array.isArray(value)) {
    throw new GenerationError(
      `Expected an array at "${path || '<root>'}" in "${relativePath}" but found ${
        value === undefined ? 'nothing' : typeof value
      }. The dataset's shape changed — update its entry in DATASETS.`,
    );
  }
  if (value.length === 0) {
    throw new GenerationError(`"${path || '<root>'}" in "${relativePath}" is empty. Refusing to publish a zero.`);
  }
  return value.length;
}

/**
 * Every figure the README publishes, with the file and path it is counted from.
 * `group` drives the chart colour; `headline` marks the figures promoted to tiles.
 */
const DATASETS = [
  {
    key: 'impact_chains',
    label: 'Neural impact chains',
    file: 'datalake/impact-chains.json',
    path: '',
    group: 'threat',
    unit: 'chains',
    note: 'technique x brain region x QIF band permutations',
  },
  { key: 'techniques', label: 'TARA techniques', file: 'datalake/qtara-registrar.json', path: 'techniques', group: 'threat', unit: 'techniques' },
  { key: 'tactics', label: 'TARA tactics', file: 'datalake/qtara-registrar.json', path: 'tactics', group: 'threat', unit: 'tactics' },
  { key: 'domains', label: 'TARA domains', file: 'datalake/qtara-registrar.json', path: 'domains', group: 'threat', unit: 'domains' },
  { key: 'cve_mappings', label: 'CVE to technique mappings', file: 'datalake/cve-technique-mapping.json', path: 'mappings', group: 'threat', unit: 'CVEs' },
  { key: 'hazards', label: 'QIF hazards', file: 'datalake/qif-hazards.json', path: 'hazards', group: 'threat', unit: 'hazards' },
  { key: 'attack_chains', label: 'Composed attack chains', file: 'datalake/tara-chains.json', path: 'chains', group: 'threat', unit: 'chains' },
  { key: 'severity_anchors', label: 'Severity anchors', file: 'datalake/severity-anchors.json', path: 'anchors', group: 'threat', unit: 'anchors' },
  { key: 'guardrails', label: 'Physics guardrails', file: 'datalake/qif-guardrails.json', path: 'guardrails', group: 'threat', unit: 'guardrails' },

  { key: 'bands', label: 'QIF bands', file: 'datalake/qif-brain-bci-atlas.json', path: 'qif_bands', group: 'anatomy', unit: 'bands' },
  { key: 'layers', label: 'Public layers over the bands', file: 'datalake/qif-brain-bci-atlas.json', path: 'layers.entries', group: 'anatomy', unit: 'layers' },
  { key: 'brain_regions', label: 'Brain regions', file: 'datalake/qif-brain-bci-atlas.json', path: 'brain_regions', group: 'anatomy', unit: 'regions' },
  { key: 'device_region_mappings', label: 'Device to region mappings', file: 'datalake/qif-brain-bci-atlas.json', path: 'device_region_mappings', group: 'anatomy', unit: 'mappings' },
  { key: 'neural_pathways', label: 'Neural pathways', file: 'datalake/qif-neural-pathways.json', path: 'pathways', group: 'anatomy', unit: 'pathways' },
  { key: 'conditions', label: 'Neurological condition mappings', file: 'datalake/qif-neurological-mappings.json', path: 'conditions', group: 'anatomy', unit: 'conditions' },
  { key: 'receptor_families', label: 'Receptor families', file: 'datalake/qif-receptors.json', path: 'receptor_families', group: 'anatomy', unit: 'families' },
  { key: 'neurotransmitters', label: 'Neurotransmitters', file: 'datalake/qif-neurotransmitters.json', path: 'neurotransmitters', group: 'anatomy', unit: 'neurotransmitters' },
  { key: 'cranial_nerves', label: 'Cranial nerves', file: 'datalake/qif-cranial-nerves.json', path: 'cranial_nerves', group: 'anatomy', unit: 'nerves' },
  { key: 'glial_types', label: 'Glial cell types', file: 'datalake/qif-glial-cells.json', path: 'glial_types', group: 'anatomy', unit: 'types' },
  { key: 'neuroendocrine_axes', label: 'Neuroendocrine axes', file: 'datalake/qif-neuroendocrine.json', path: 'axes', group: 'anatomy', unit: 'axes' },

  { key: 'anatomy_region_evidence', label: 'Brain-region evidence rows', file: 'datalake/qif-anatomy-region-evidence.json', path: 'rows', group: 'anatomy', unit: 'rows' },
  { key: 'anatomy_crosswalk', label: 'Anatomy atlas crosswalk rows', file: 'datalake/qif-anatomy-crosswalk.json', path: 'rows', group: 'anatomy', unit: 'rows' },
  { key: 'anatomy_sources', label: 'Anatomy sources vetted', file: 'datalake/qif-anatomy-sources.json', path: 'sources', group: 'anatomy', unit: 'sources' },
  { key: 'anatomy_verdicts', label: 'Anatomy review verdicts', file: 'datalake/qif-anatomy-verdicts.json', path: 'verdicts', group: 'anatomy', unit: 'verdicts' },
  { key: 'white_matter_tracts', label: 'White-matter tracts', file: 'datalake/qif-neurosim.json', path: 'whitematterTracts', group: 'anatomy', unit: 'tracts' },
  { key: 'eeg_electrodes', label: 'EEG electrode positions', file: 'datalake/qif-neurosim.json', path: 'eegElectrodes', group: 'anatomy', unit: 'electrodes' },
  { key: 'governance_frameworks', label: 'Governance frameworks mapped', file: 'datalake/qif-ethics-controls.json', path: 'governance_frameworks', group: 'evidence', unit: 'frameworks' },

  {
    key: 'bci_devices',
    label: 'BCI devices with hardware specs',
    file: 'src/site/bci-hardware-inventory.json',
    path: 'devices',
    group: 'landscape',
    unit: 'devices',
    note: 'implant, DBS, cochlear and consumer EEG classes',
  },
  { key: 'companies', label: 'BCI companies tracked', file: 'datalake/bci-landscape.json', path: 'companies', group: 'landscape', unit: 'companies' },
  { key: 'policy_timeline', label: 'Policy timeline entries', file: 'datalake/bci-landscape.json', path: 'policy_timeline', group: 'landscape', unit: 'entries' },
  { key: 'industry_timeline', label: 'Industry timeline entries', file: 'datalake/bci-landscape.json', path: 'industry_timeline', group: 'landscape', unit: 'entries' },

  { key: 'organisations', label: 'Research organisations', file: 'datalake/research-registry.json', path: 'explorer', group: 'evidence', unit: 'organisations' },
  { key: 'researchers', label: 'Researchers catalogued', file: 'datalake/research-registry.json', path: 'researchers', group: 'evidence', unit: 'researchers' },
  { key: 'institutions', label: 'Institutions', file: 'datalake/research-registry.json', path: 'institutions', group: 'evidence', unit: 'institutions' },
  { key: 'standards', label: 'Standards tracked', file: 'datalake/research-registry.json', path: 'standards', group: 'evidence', unit: 'standards' },
  { key: 'legislation', label: 'Legislation tracked', file: 'datalake/research-registry.json', path: 'legislation', group: 'evidence', unit: 'items' },
  { key: 'eeg_datasets', label: 'EEG datasets catalogued', file: 'datalake/eeg-samples.json', path: 'samples', group: 'evidence', unit: 'datasets' },
  { key: 'derivation_milestones', label: 'Derivation milestones', file: 'datalake/derivation-timeline.json', path: 'milestones', group: 'evidence', unit: 'milestones' },
  { key: 'validation_entries', label: 'Validation entries', file: 'datalake/validation-registry.json', path: 'entries', group: 'evidence', unit: 'entries' },
];

const GROUP_LABELS = {
  threat: 'Threat model',
  anatomy: 'Neuroanatomy',
  landscape: 'Device & market landscape',
  evidence: 'Evidence & provenance',
};

/** Unique resolvable DOIs across the machine-readable corpus — the citation footprint, counted not claimed. */
const DOI_PATTERN = /\b10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+/g;

function countUniqueDois(relativePaths) {
  const dois = new Set();
  for (const relativePath of relativePaths) {
    const absolute = resolve(ROOT, relativePath);
    let raw;
    try {
      raw = readFileSync(absolute, 'utf8');
    } catch (cause) {
      throw new GenerationError(`Cannot read "${relativePath}" while counting DOIs: ${cause.code ?? cause.message}`);
    }
    for (const match of raw.match(DOI_PATTERN) ?? []) {
      dois.add(match.replace(/[.,;)\]"']+$/, ''));
    }
  }
  if (dois.size === 0) throw new GenerationError('Found no DOIs in the corpus. Refusing to publish a zero.');
  return dois.size;
}

/**
 * Top-level dataset files in datalake/. Counted on disk rather than taken from
 * DATASETS so that a dataset added without an inventory entry still shows up in
 * the published total instead of being quietly dropped.
 */
function countDatalakeFiles() {
  const dir = resolve(ROOT, 'datalake');
  let entries;
  try {
    entries = readdirSync(dir);
  } catch (cause) {
    throw new GenerationError(`Cannot list datalake/: ${cause.code ?? cause.message}`);
  }
  // inventory.json is this script's own output, not a source dataset.
  const files = entries.filter((name) => name.endsWith('.json') && name !== 'inventory.json');
  if (files.length === 0) throw new GenerationError('datalake/ holds no JSON datasets. Refusing to publish a zero.');
  return files.length;
}

/** Tally a keyed field across the technique array, rejecting an empty result. */
function tally(items, accessor, relativePath, what) {
  const totals = {};
  for (const item of items) {
    const value = accessor(item);
    if (value === null || value === undefined) continue;
    totals[value] = (totals[value] ?? 0) + 1;
  }
  const entries = Object.entries(totals).sort(([, a], [, b]) => b - a);
  if (entries.length === 0) {
    throw new GenerationError(`Could not tally ${what} from "${relativePath}" — the field is absent on every record.`);
  }
  return Object.fromEntries(entries);
}

function buildInventory() {
  const cache = new Map();
  const read = (relativePath) => {
    if (!cache.has(relativePath)) cache.set(relativePath, loadJson(relativePath));
    return cache.get(relativePath);
  };

  const counts = DATASETS.map((dataset) => ({
    ...dataset,
    count: countAt(read(dataset.file), dataset.path, dataset.file),
  }));

  const byKey = Object.fromEntries(counts.map((entry) => [entry.key, entry.count]));
  const techniques = read('datalake/qtara-registrar.json').techniques;

  const evidenceTiers = tally(techniques, (t) => t.evidence?.tier, 'datalake/qtara-registrar.json', 'evidence tiers');
  const feasibilityTiers = tally(
    techniques,
    (t) => t.physics_feasibility?.tier_label,
    'datalake/qtara-registrar.json',
    'physics feasibility tiers (physics_feasibility.tier_label)',
  );
  const unknownFeasibility = Object.keys(feasibilityTiers).filter((key) => !(key in FEASIBILITY_TIER_LABELS));
  if (unknownFeasibility.length > 0) {
    throw new GenerationError(
      `Unrecognised physics feasibility tier(s): ${unknownFeasibility.join(', ')}. Add them to FEASIBILITY_TIER_LABELS so they are not dropped from the chart.`,
    );
  }
  const unknownEvidence = Object.keys(evidenceTiers).filter((key) => !(key in EVIDENCE_TIER_LABELS));
  if (unknownEvidence.length > 0) {
    throw new GenerationError(
      `Unrecognised evidence tier(s): ${unknownEvidence.join(', ')}. Add them to EVIDENCE_TIER_LABELS so they are not dropped from the chart.`,
    );
  }

  const cveDoc = read('datalake/cve-technique-mapping.json');
  const techniquesWithCve = new Set();
  for (const mapping of cveDoc.mappings) {
    for (const id of mapping.tara_techniques ?? []) techniquesWithCve.add(id);
  }
  if (techniquesWithCve.size === 0) {
    throw new GenerationError(
      'No technique IDs found under `mappings[].tara_techniques` in datalake/cve-technique-mapping.json. The mapping schema changed.',
    );
  }

  const doiSources = [...new Set(DATASETS.map((d) => d.file))];

  return {
    _generator: 'src/scripts/generate-datalake-inventory.mjs',
    _note: 'Derived file. Do not hand-edit — run `npm run datalake:inventory`.',
    generated_on: new Date().toISOString().slice(0, 10),
    totals: {
      datalake_files: countDatalakeFiles(),
      datasets_inventoried: new Set(DATASETS.map((d) => d.file)).size,
      records: counts.reduce((sum, entry) => sum + entry.count, 0),
      unique_dois: countUniqueDois(doiSources),
      techniques_with_cve_evidence: techniquesWithCve.size,
      cve_coverage_ratio: Number((techniquesWithCve.size / byKey.techniques).toFixed(4)),
    },
    counts: counts.map(({ key, label, count, file, path, group, unit, note }) => ({ key, label, count, file, path, group, unit, note })),
    technique_evidence_tiers: evidenceTiers,
    technique_feasibility_tiers: feasibilityTiers,
  };
}

// ---------------------------------------------------------------------------
// SVG rendering
// ---------------------------------------------------------------------------

const escapeXml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);

const formatNumber = (value) => value.toLocaleString('en-US');

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

/**
 * Hero: a 3x2 grid of KPI tiles.
 *
 * Deliberately not a bar chart or a treemap. These six figures are in six
 * different units — chains, techniques, devices, companies, CVEs, DOIs — so they
 * are not one distribution and nothing is gained by putting them on a shared
 * axis. A linear axis would also collapse everything but the 5,476 impact chains
 * into a hairline, and a log axis would flatten 176 and 5,476 into near-identical
 * bars, which reads as a scale trick rather than a finding. Per-dataset detail
 * lives in the generated README tables below, where the exact counts are text.
 */
function renderCorpusSvg(inventory) {
  const get = (key) => {
    const row = inventory.counts.find((entry) => entry.key === key);
    if (!row) throw new GenerationError(`Hero tile needs the "${key}" count but it is not in DATASETS.`);
    return row.count;
  };

  const tiles = [
    { value: formatNumber(get('impact_chains')), label: 'neural impact chains', sub: 'technique x region x band', accent: PALETTE.threat },
    { value: formatNumber(get('techniques')), label: 'proposed TARA techniques', sub: `${get('tactics')} tactics · ${get('domains')} domains`, accent: PALETTE.threat },
    { value: formatNumber(get('bci_devices')), label: 'BCI devices specced', sub: 'implant, DBS, cochlear, consumer', accent: PALETTE.landscape },
    { value: formatNumber(get('companies')), label: 'BCI companies tracked', sub: `${get('policy_timeline')} policy milestones`, accent: PALETTE.landscape },
    { value: formatNumber(get('cve_mappings')), label: 'CVEs mapped to techniques', sub: `covering ${inventory.totals.techniques_with_cve_evidence} of ${get('techniques')}`, accent: PALETTE.evidence },
    { value: formatNumber(inventory.totals.unique_dois), label: 'unique DOIs cited', sub: `${get('researchers')} researchers catalogued`, accent: PALETTE.evidence },
  ];

  const width = 1200;
  const pad = 36;
  const columns = 3;
  const rows = Math.ceil(tiles.length / columns);
  const gap = 16;
  const tileWidth = (width - pad * 2 - gap * (columns - 1)) / columns;
  const tileHeight = 132;
  const gridTop = 118;
  const height = gridTop + rows * tileHeight + (rows - 1) * gap + 62;

  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Open datalake inventory: ${escapeXml(
      formatNumber(inventory.totals.records),
    )} records across ${inventory.totals.datasets_inventoried} datasets, including ${formatNumber(get('impact_chains'))} neural impact chains, ${get(
      'techniques',
    )} proposed techniques, ${get('bci_devices')} BCI devices and ${inventory.totals.unique_dois} cited DOIs.">`,
  );
  parts.push(`<rect width="${width}" height="${height}" rx="18" fill="${PALETTE.ink}"/>`);
  parts.push(`<text x="${pad}" y="52" font-family="${FONT}" font-size="30" font-weight="700" fill="${PALETTE.text}">Open datalake inventory</text>`);
  parts.push(
    `<text x="${pad}" y="82" font-family="${FONT}" font-size="15" fill="${PALETTE.muted}">${escapeXml(
      formatNumber(inventory.totals.records),
    )} records inventoried from ${inventory.totals.datasets_inventoried} of the ${inventory.totals.datalake_files} open datasets. Every figure is counted from the file that owns it, not hand-typed.</text>`,
  );

  tiles.forEach((tile, index) => {
    const x = pad + (index % columns) * (tileWidth + gap);
    const y = gridTop + Math.floor(index / columns) * (tileHeight + gap);
    parts.push(`<rect x="${x}" y="${y}" width="${tileWidth}" height="${tileHeight}" rx="12" fill="${PALETTE.panel}"/>`);
    parts.push(`<rect x="${x}" y="${y}" width="${tileWidth}" height="4" rx="2" fill="${tile.accent}"/>`);
    parts.push(
      `<text x="${x + 24}" y="${y + 74}" font-family="${FONT}" font-size="54" font-weight="700" fill="${PALETTE.text}">${escapeXml(tile.value)}</text>`,
    );
    parts.push(
      `<text x="${x + 24}" y="${y + 100}" font-family="${FONT}" font-size="15" font-weight="600" fill="${PALETTE.text}">${escapeXml(
        tile.label,
      )}</text>`,
    );
    parts.push(`<text x="${x + 24}" y="${y + 120}" font-family="${FONT}" font-size="12.5" fill="${PALETTE.muted}">${escapeXml(tile.sub)}</text>`);
  });

  parts.push(
    `<text x="${pad}" y="${height - 26}" font-family="${FONT}" font-size="12.5" fill="${PALETTE.muted}">Proposed, unvalidated research artefacts for threat modelling and risk assessment. Generated ${escapeXml(
      inventory.generated_on,
    )} by npm run datalake:inventory.</text>`,
  );
  parts.push('</svg>');
  return `${parts.join('\n')}\n`;
}

const EVIDENCE_TIER_LABELS = {
  demonstrated_lab: 'Demonstrated in lab',
  demonstrated_case: 'Demonstrated in a real case',
  theoretical_modeled: 'Modelled, not demonstrated',
  theoretical_proposed: 'Proposed, not modelled',
  speculative: 'Speculative',
};

const FEASIBILITY_TIER_LABELS = {
  feasible_now: 'Hardware exists today',
  near_term: 'Near term (integration new)',
  mid_term: 'Mid term',
  far_term: 'Far term',
  no_physics_gate: 'Software — no physics gate',
};

const EVIDENCE_COLOURS = [PALETTE.evidence, '#34d399', PALETTE.landscape, '#fbbf24', PALETTE.caution];
const FEASIBILITY_COLOURS = [PALETTE.threat, '#38bdf8', PALETTE.anatomy, '#c084fc', PALETTE.muted];

/**
 * Honesty chart: how much of the catalogue is demonstrated versus proposed, and
 * how much is reachable with hardware that exists. Published because a reader
 * who has to dig for the theoretical share is right to distrust the total.
 */
function renderEvidenceSvg(inventory) {
  const width = 1200;
  const pad = 32;
  const barHeight = 44;
  const height = 272;
  const barWidth = width - pad * 2;

  const series = [
    {
      title: 'Evidence tier',
      subtitle: 'What the published literature actually shows for each technique',
      y: 104,
      labels: EVIDENCE_TIER_LABELS,
      colours: EVIDENCE_COLOURS,
      data: inventory.technique_evidence_tiers,
    },
    {
      title: 'Physics feasibility tier',
      subtitle: 'Whether the hardware an attack would need exists yet',
      y: 220,
      labels: FEASIBILITY_TIER_LABELS,
      colours: FEASIBILITY_COLOURS,
      data: inventory.technique_feasibility_tiers,
    },
  ];

  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Evidence and physics-feasibility profile of the ${inventory.counts.find(
      (r) => r.key === 'techniques',
    ).count} catalogued techniques.">`,
  );
  parts.push(`<rect width="${width}" height="${height}" rx="18" fill="${PALETTE.ink}"/>`);
  const techniqueCount = inventory.counts.find((r) => r.key === 'techniques').count;
  const tiers = inventory.technique_evidence_tiers;
  const demonstrated = (tiers.demonstrated_lab ?? 0) + (tiers.demonstrated_case ?? 0);
  parts.push(
    `<text x="${pad}" y="44" font-family="${FONT}" font-size="26" font-weight="700" fill="${PALETTE.text}">What the catalogue is actually made of</text>`,
  );
  parts.push(
    `<text x="${pad}" y="70" font-family="${FONT}" font-size="14" fill="${PALETTE.muted}">${demonstrated} of ${techniqueCount} techniques rest on a lab or case demonstration in the literature; the rest are modelled or proposed. Nothing here is validated.</text>`,
  );

  for (const group of series) {
    const ordered = Object.keys(group.labels).filter((key) => group.data[key] > 0);
    const total = ordered.reduce((sum, key) => sum + group.data[key], 0);
    parts.push(
      `<text x="${pad}" y="${group.y - 12}" font-family="${FONT}" font-size="13" font-weight="600" fill="${PALETTE.text}">${escapeXml(
        group.title,
      )}</text>`,
    );
    parts.push(
      `<text x="${pad + 150}" y="${group.y - 12}" font-family="${FONT}" font-size="12" fill="${PALETTE.muted}">${escapeXml(group.subtitle)}</text>`,
    );

    let x = pad;
    ordered.forEach((key, index) => {
      const count = group.data[key];
      const segment = (count / total) * barWidth;
      const colour = group.colours[index % group.colours.length];
      parts.push(`<rect x="${x.toFixed(1)}" y="${group.y}" width="${segment.toFixed(1)}" height="${barHeight}" fill="${colour}"/>`);
      if (segment > 54) {
        parts.push(
          `<text x="${(x + segment / 2).toFixed(1)}" y="${group.y + 20}" text-anchor="middle" font-family="${FONT}" font-size="15" font-weight="700" fill="${
            PALETTE.ink
          }">${count}</text>`,
        );
      }
      if (segment > 118) {
        parts.push(
          `<text x="${(x + segment / 2).toFixed(1)}" y="${group.y + 36}" text-anchor="middle" font-family="${FONT}" font-size="10.5" fill="${
            PALETTE.ink
          }">${escapeXml(group.labels[key])}</text>`,
        );
      }
      x += segment;
    });

    const unlabelled = ordered.filter((key) => (group.data[key] / total) * barWidth <= 118);
    if (unlabelled.length > 0) {
      const legend = unlabelled.map((key) => `${group.labels[key]} ${group.data[key]}`).join('   ·   ');
      parts.push(
        `<text x="${pad}" y="${group.y + barHeight + 18}" font-family="${FONT}" font-size="11" fill="${PALETTE.muted}">${escapeXml(legend)}</text>`,
      );
    }
  }

  parts.push('</svg>');
  return `${parts.join('\n')}\n`;
}

// ---------------------------------------------------------------------------
// README block
// ---------------------------------------------------------------------------

function renderReadmeBlock(inventory) {
  const byGroup = new Map();
  for (const row of inventory.counts) {
    if (!byGroup.has(row.group)) byGroup.set(row.group, []);
    byGroup.get(row.group).push(row);
  }

  const lines = [];
  lines.push(BEGIN_MARKER);
  lines.push(
    `<!-- Generated by src/scripts/generate-datalake-inventory.mjs — run \`npm run datalake:inventory\`. Hand edits are overwritten. -->`,
  );
  lines.push('');
  const get = (key) => inventory.counts.find((entry) => entry.key === key).count;

  lines.push('![Open datalake inventory](src/site/images/datalake-corpus.svg)');
  lines.push('');
  lines.push(
    `**${formatNumber(inventory.totals.records)} records inventoried below, from ${inventory.totals.datasets_inventoried} of the ${inventory.totals.datalake_files} datasets in [\`datalake/\`](datalake/).** ` +
      `${formatNumber(get('impact_chains'))} neural impact chains · ${formatNumber(get('techniques'))} proposed techniques · ` +
      `${formatNumber(get('bci_devices'))} BCI devices specced · ${formatNumber(get('companies'))} companies tracked · ` +
      `${formatNumber(get('cve_mappings'))} CVEs mapped · ${formatNumber(inventory.totals.unique_dois)} unique DOIs cited.`,
  );
  lines.push('');
  lines.push(
    `Counted from the files themselves on ${inventory.generated_on}. Re-run \`npm run datalake:inventory\` and every figure on this page moves with the data; ` +
      `\`npm run datalake:inventory:check\` fails the build if it has drifted.`,
  );
  lines.push('');

  for (const [group, label] of Object.entries(GROUP_LABELS)) {
    const rows = byGroup.get(group) ?? [];
    if (rows.length === 0) continue;
    lines.push(`### ${label}`);
    lines.push('');
    lines.push('| Inventory | Count | Derived from |');
    lines.push('|---|---:|---|');
    for (const row of rows.sort((a, b) => b.count - a.count)) {
      const label2 = row.note ? `${row.label} <sub>${row.note}</sub>` : row.label;
      lines.push(`| ${label2} | **${formatNumber(row.count)}** | [\`${row.file}\`](${row.file}) |`);
    }
    lines.push('');
  }

  lines.push('### How strong is the evidence');
  lines.push('');
  lines.push('![Evidence and feasibility profile](src/site/images/evidence-profile.svg)');
  lines.push('');
  const tiers = inventory.technique_evidence_tiers;
  const demonstrated = (tiers.demonstrated_lab ?? 0) + (tiers.demonstrated_case ?? 0);
  const total = Object.values(tiers).reduce((a, b) => a + b, 0);
  const feasibility = inventory.technique_feasibility_tiers;
  lines.push(
    `- **${demonstrated} of ${total} techniques** rest on a lab or case demonstration in the published literature ` +
      `(${tiers.demonstrated_lab ?? 0} lab, ${tiers.demonstrated_case ?? 0} case). The remaining ${total - demonstrated} are modelled, proposed or speculative.`,
  );
  lines.push(
    `- Hardware that exists today would suffice for **${feasibility.feasible_now ?? 0} of them**; ${
      feasibility.no_physics_gate ?? 0
    } are software or network attacks that physics does not constrain at all.`,
  );
  lines.push(
    `- **${formatNumber(get('cve_mappings'))} CVEs** are mapped to ${inventory.totals.techniques_with_cve_evidence} of ${total} techniques (${(
      inventory.totals.cve_coverage_ratio * 100
    ).toFixed(1)}%). Mapping is ongoing — [contributions welcome](#collaboration).`,
  );
  lines.push('');
  lines.push(
    `These splits are published here rather than buried, because anyone can compute them from the JSON in a minute, and a catalogue that hides its theoretical share is not worth scoring against.`,
  );
  lines.push('');
  lines.push(END_MARKER);
  return lines.join('\n');
}

function spliceReadme(readme, block) {
  const start = readme.indexOf(BEGIN_MARKER);
  const end = readme.indexOf(END_MARKER);
  if (start === -1 || end === -1) {
    throw new GenerationError(
      `README.md is missing the generated-block markers. Add "${BEGIN_MARKER}" and "${END_MARKER}" where the inventory belongs.`,
    );
  }
  if (end < start) throw new GenerationError('README.md has the inventory markers in the wrong order.');
  return readme.slice(0, start) + block + readme.slice(end + END_MARKER.length);
}

// ---------------------------------------------------------------------------

function main() {
  const inventory = buildInventory();
  const artefacts = [
    { path: INVENTORY_PATH, label: 'datalake/inventory.json', content: `${JSON.stringify(inventory, null, 2)}\n` },
    { path: CORPUS_SVG_PATH, label: 'src/site/images/datalake-corpus.svg', content: renderCorpusSvg(inventory) },
    { path: EVIDENCE_SVG_PATH, label: 'src/site/images/evidence-profile.svg', content: renderEvidenceSvg(inventory) },
    { path: README_PATH, label: 'README.md', content: spliceReadme(readFileSync(README_PATH, 'utf8'), renderReadmeBlock(inventory)) },
  ];

  /** `generated_on` moves every day, so it is excluded when deciding whether content drifted. */
  const normalise = (text) => text.replace(/\d{4}-\d{2}-\d{2}/g, '<date>');

  if (checkOnly) {
    const stale = artefacts.filter((artefact) => {
      let current;
      try {
        current = readFileSync(artefact.path, 'utf8');
      } catch {
        return true;
      }
      return normalise(current) !== normalise(artefact.content);
    });
    if (stale.length > 0) {
      console.error(`Datalake inventory is stale: ${stale.map((a) => a.label).join(', ')}`);
      console.error('Run `npm run datalake:inventory` and commit the result.');
      process.exit(1);
    }
    console.log(`Datalake inventory is current (${formatNumber(inventory.totals.records)} records, ${inventory.totals.datalake_files} datasets).`);
    return;
  }

  for (const artefact of artefacts) writeFileSync(artefact.path, artefact.content);
  console.log(`Wrote ${artefacts.map((a) => a.label).join(', ')}`);
  console.log(`${formatNumber(inventory.totals.records)} records · ${inventory.totals.datalake_files} datasets · ${inventory.totals.unique_dois} DOIs`);
}

try {
  main();
} catch (error) {
  if (error instanceof GenerationError) {
    console.error(`generate-datalake-inventory: ${error.message}`);
    process.exit(1);
  }
  throw error;
}
