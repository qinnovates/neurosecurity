/**
 * The curated threat models (datalake/tara-chains.json) as the atlas explorer
 * reads them: each model's ordered steps, the technique each step names and the
 * evidence label the file gives it. Built once at build time, served as its own
 * static file, pinned by the anatomy index, and parsed again by the page that
 * fetches it. Nothing here is new: every word is copied from the datalake file.
 *
 * A step holds a technique and a place in an order. It holds no region, no
 * path and nothing that joins one step to the next.
 */

import { AnatomyDataError } from '@/lib/anatomy/errors';
import { childOf, failAt, itemOf, rootOf } from '@/lib/anatomy/field-readers';
import { readSchemaVersion } from '@/lib/anatomy/format-readers';
import { checkShape, shapes } from '@/lib/anatomy/shape-check';
import { CHAIN_ROLES, GENERATED_CHAIN_ID_PREFIX, type ChainRole } from '@/lib/threat-model/chain-types';
import { isRecord } from '@/lib/threat-model/guards';

export const ATLAS_CHAINS_PATH = '/atlas/anatomy-chains.json';
export const ATLAS_CHAINS_SCHEMA_VERSION = 1;
const CHAINS_FILE = 'datalake/tara-chains.json';

/** How well evidenced a step is, in the datalake file's own vocabulary. */
export const STEP_EVIDENCE_LABELS = ['demonstrated', 'partly_demonstrated', 'projected'] as const;
export type StepEvidenceLabel = typeof STEP_EVIDENCE_LABELS[number];

export interface AtlasChainStep {
  /** The step's place in the threat model's order, from 1. */
  position: number;
  technique_id: string;
  role: ChainRole;
  /** The datalake file's own wording of the step. */
  action: string;
  /** Null when the file labels the step with nothing. */
  evidence_label: StepEvidenceLabel | null;
}

export interface AtlasChain {
  chain_id: string;
  chain_name: string;
  evidence_label: StepEvidenceLabel | null;
  steps: AtlasChainStep[];
}

export interface AtlasChains {
  schema_version: number;
  /** What each evidence label means, in the datalake file's own words. */
  label_rules: Record<StepEvidenceLabel, string>;
  chains: AtlasChain[];
}

const MAX_ID_LENGTH = 120;
const MAX_TEXT_LENGTH = 600;
const id = shapes.text(MAX_ID_LENGTH);
const text = shapes.text(MAX_TEXT_LENGTH);
const label = shapes.nullable(shapes.word(STEP_EVIDENCE_LABELS));

const ATLAS_CHAINS_SHAPE = shapes.record({
  schema_version: shapes.integer(ATLAS_CHAINS_SCHEMA_VERSION),
  label_rules: shapes.record({ demonstrated: text, partly_demonstrated: text, projected: text }),
  chains: shapes.list(shapes.record({
    chain_id: id, chain_name: text, evidence_label: label,
    steps: shapes.list(shapes.record({ position: shapes.integer(1), technique_id: id, role: shapes.word(CHAIN_ROLES), action: text, evidence_label: label })),
  })),
});

function fail(path: string, problem: string, fix: string): never {
  throw new AnatomyDataError(CHAINS_FILE, path, problem, fix);
}

function readRecordAt(value: unknown, path: string): Record<string, unknown> {
  return isRecord(value) ? value : fail(path, 'expected an object', 'Restore the object.');
}

function readListAt(value: unknown, path: string): unknown[] {
  return Array.isArray(value) ? value : fail(path, 'expected a list', 'Restore the list.');
}

/** The label an entry's `evidence` object gives, or null when the entry has none. */
function readLabel(evidence: unknown, key: string): unknown {
  return isRecord(evidence) ? evidence[key] ?? null : null;
}

function toStep(raw: unknown, path: string): AtlasChainStep {
  const step = readRecordAt(raw, path);
  return {
    position: step.position as number, technique_id: step.technique_id as string, role: step.role as ChainRole, action: step.action as string,
    evidence_label: readLabel(step.evidence, 'label') as StepEvidenceLabel | null,
  };
}

function toChain(raw: unknown, path: string): AtlasChain {
  const chain = readRecordAt(raw, path);
  return {
    chain_id: chain.chain_id as string, chain_name: chain.chain_name as string, evidence_label: readLabel(chain.evidence, 'overall_label') as StepEvidenceLabel | null,
    steps: readListAt(chain.steps, `${path}.steps`).map((step, index) => toStep(step, `${path}.steps[${index}]`)),
  };
}

/**
 * Copies what the explorer shows out of the datalake file. Every field is then
 * held to the served file's shape, so a wrong type in the datalake stops the build here.
 *
 * @throws AnatomyDataError when the file is malformed or a step names a technique the catalog does not hold
 */
export function buildAtlasChains(rawFile: unknown, knownTechniqueIds: ReadonlySet<string>): AtlasChains {
  const file = readRecordAt(rawFile, '(top level)');
  const rules = readRecordAt(readRecordAt(file.label_rules, 'label_rules').step, 'label_rules.step');
  const built = {
    schema_version: ATLAS_CHAINS_SCHEMA_VERSION,
    label_rules: Object.fromEntries(STEP_EVIDENCE_LABELS.map((name) => [name, rules[name]])),
    chains: readListAt(file.chains, 'chains').map((chain, index) => toChain(chain, `chains[${index}]`)),
  };
  const chains = parseAtlasChains(JSON.parse(JSON.stringify(built)));
  for (const chain of chains.chains) {
    const unknown = chain.steps.find((step) => !knownTechniqueIds.has(step.technique_id));
    if (unknown !== undefined) fail(`chain ${chain.chain_id}`, `step ${unknown.position} names ${unknown.technique_id}, which the catalog does not hold`, 'Name a technique in the registrar.');
  }
  return chains;
}

/** @throws AnatomyDataError naming the first field that is wrong, a chain with no step, or steps that are not numbered 1, 2, 3 in order */
export function parseAtlasChains(raw: unknown): AtlasChains {
  const root = rootOf(ATLAS_CHAINS_PATH);
  checkShape(raw, ATLAS_CHAINS_SHAPE, root);
  const chains = raw as AtlasChains;
  readSchemaVersion({ schema_version: chains.schema_version }, root, ATLAS_CHAINS_SCHEMA_VERSION);
  const seen = new Set<string>();
  chains.chains.forEach((chain, index) => {
    const location = itemOf(root, 'chains', index);
    if (seen.has(chain.chain_id)) failAt(childOf(location, 'chain_id'), `"${chain.chain_id}" is listed twice`, 'Give each threat model its own id.');
    seen.add(chain.chain_id);
    // A generated chain is a hypothesis and is never stored beside the curated ones.
    if (chain.chain_id.startsWith(GENERATED_CHAIN_ID_PREFIX)) failAt(childOf(location, 'chain_id'), 'a generated chain cannot be served as a curated one', 'Give a curated chain another id.');
    if (chain.steps.length === 0 || chain.steps.some((step, at) => step.position !== at + 1)) {
      failAt(childOf(location, 'steps'), 'steps must be numbered 1, 2, 3 in the order they are listed, with at least one', 'Number the steps in order.');
    }
  });
  return chains;
}
