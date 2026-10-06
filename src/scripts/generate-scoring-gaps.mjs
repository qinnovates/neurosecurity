#!/usr/bin/env node
/**
 * Generates datalake/tara-scoring-gaps.json: an honest, computed record of two
 * known gaps in the TARA catalog, so neither is silently carried by the site.
 *
 * 1. Techniques that carry no NISS vector, and what each entry would need
 *    before it could be scored without inventing evidence.
 * 2. The two severity fields, which disagree and are computed over different
 *    populations.
 *
 * Everything here is derived from the registrar. Run after any registrar change.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTRAR_PATH = resolve(ROOT, 'datalake/qtara-registrar.json');
const OUTPUT_PATH = resolve(ROOT, 'datalake/tara-scoring-gaps.json');

/**
 * What each NISS metric needs from a technique entry, and how to tell from the
 * entry alone whether that evidence is present. A metric whose evidence is
 * absent cannot be coded without inventing it.
 */
const METRIC_REQUIREMENTS = [
  {
    metric: 'BI',
    name: 'Biological Impact',
    needs: 'A described physical or biological effect on tissue, with its magnitude or a cited measurement.',
    isPresent: (technique) => Boolean(technique.notes) || Boolean(technique.tara?.mechanism?.detail),
    absent_means: 'The entry names the modality but not what it does to tissue at what dose.',
  },
  {
    metric: 'CR',
    name: 'Cognitive Reconnaissance',
    needs: 'Whether the technique reads neural or cognitive content.',
    isPresent: (technique) => Boolean(technique.tara_mode),
    absent_means: 'No read/manipulate/disrupt mode recorded.',
  },
  {
    metric: 'CD',
    name: 'Cognitive/Functional Disruption',
    needs: 'A described disruption of cognition, perception, movement or autonomic function.',
    isPresent: (technique) => Boolean(technique.tara?.dsm5?.primary?.length) || Boolean(technique.tara?.icd10),
    absent_means: 'No functional or clinical outcome mapping on the entry.',
  },
  {
    metric: 'CV',
    name: 'Consent Violation',
    needs: 'The access model: what proximity, equipment or authorisation an operator needs.',
    isPresent: (technique) => Boolean(technique.access) || Boolean(technique.coupling),
    absent_means: 'No access or coupling recorded, so the consent model cannot be derived.',
  },
  {
    metric: 'RV',
    name: 'Reversibility',
    needs: 'Evidence of how long the effect persists and whether it resolves or is treatable.',
    isPresent: (technique) => Boolean(technique.tara_drift_window) || Boolean(technique.tara_drift),
    absent_means: 'No persistence or drift evidence on the entry.',
  },
  {
    metric: 'NP',
    name: 'Neuroplasticity',
    needs: 'Evidence of lasting structural or synaptic change, or of its absence.',
    isPresent: (technique) => Boolean(technique.tara_drift) && Boolean(technique.notes),
    absent_means: 'No evidence either way about lasting neural change.',
  },
];

const registrar = JSON.parse(readFileSync(REGISTRAR_PATH, 'utf8'));
const techniques = registrar.techniques;
const unscored = techniques.filter((technique) => !technique.niss?.vector);
const scored = techniques.filter((technique) => technique.niss?.vector);

function countBy(items, key) {
  return items.reduce((totals, item) => {
    const value = typeof key === 'function' ? key(item) : item[key];
    totals[value] = (totals[value] ?? 0) + 1;
    return totals;
  }, {});
}

const unscoredRecords = unscored.map((technique) => {
  const missing = METRIC_REQUIREMENTS.filter((requirement) => !requirement.isPresent(technique));
  return {
    id: technique.id,
    attack: technique.attack,
    status: technique.status,
    legacy_severity: technique.severity,
    tara_mode: technique.tara_mode ?? null,
    source_count: (technique.sources ?? []).length,
    metrics_determinable: METRIC_REQUIREMENTS.length - missing.length,
    missing_evidence: missing.map((requirement) => ({
      metric: requirement.metric,
      name: requirement.name,
      needs: requirement.needs,
      absent_means: requirement.absent_means,
    })),
  };
});

const output = {
  version: '1.0',
  generated: new Date().toISOString().slice(0, 10),
  generator: 'src/scripts/generate-scoring-gaps.mjs',
  description:
    'Known gaps in the TARA catalog, computed from the registrar. Published rather than hidden so that any figure derived from the catalog can be read with its limits.',
  unscored_techniques: {
    summary: {
      total_techniques: techniques.length,
      scored: scored.length,
      unscored: unscored.length,
      id_range: unscored.length ? `${unscored[0].id} to ${unscored[unscored.length - 1].id}` : null,
      by_status: countBy(unscored, 'status'),
      by_mode: countBy(unscored, (technique) => technique.tara_mode ?? 'none'),
    },
    why_unscored:
      'NISS codes six metrics. Four of them (Biological Impact, Cognitive/Functional Disruption, Reversibility, Neuroplasticity) are claims about physical effect and persistence. These entries record the modality, its dual-use clinical counterpart and a physics feasibility tier, but not the effect, dose, persistence or access model, so those metrics cannot be coded from the entry without inventing evidence. Scoring them would produce numbers that look computed but are not.',
    what_would_change_this:
      'Per technique: a cited measurement of the physical effect and its dose, a functional or clinical outcome mapping, an access and coupling model, and evidence on persistence. The sources already cited on each entry are the place to start.',
    requirements: METRIC_REQUIREMENTS.map(({ metric, name, needs }) => ({ metric, name, needs })),
    techniques: unscoredRecords,
  },
  severity_fields: {
    issue:
      'The catalog carries two severity answers that disagree. They are computed differently, over different populations, and are not interchangeable.',
    fields: [
      {
        field: 'niss.severity',
        source: 'Derived from the NISS vector by the scoring formula in niss_spec.',
        population: `${scored.length} scored techniques`,
        scale: registrar.niss_spec.severity_scale,
        distribution: countBy(scored, (technique) => technique.niss.severity),
        authoritative_for: 'Any statement about neural impact severity. This is what the site displays.',
      },
      {
        field: 'severity',
        source: 'An original per-technique assessment that predates NISS scoring. No formula is recorded for it.',
        population: `all ${techniques.length} techniques`,
        distribution: countBy(techniques, 'severity'),
        authoritative_for:
          'Nothing published. Retained because it is the only severity value the 26 unscored techniques carry.',
      },
    ],
    known_conflict:
      'No scored technique reaches NISS critical, while the legacy field marks some critical. The two are not comparable: the legacy field was not produced by the NISS formula.',
    resolution_status:
      'Open framework decision: whether to retire the legacy field, rename it so it cannot be mistaken for a NISS score, or keep it as a separate recorded assessment.',
  },
};

writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
console.log(
  `[scoring-gaps] ${unscored.length} unscored of ${techniques.length}; ` +
    `metrics determinable per technique: ${[...new Set(unscoredRecords.map((r) => r.metrics_determinable))].sort().join(', ')} of 6`,
);
