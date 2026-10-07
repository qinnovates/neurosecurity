import fs from 'node:fs';
import path from 'node:path';
import type { AttackChain, ChainEvidence, ChainStep, ClinicalParallel, StepEvidence } from './AttackChainViz';
import { EVIDENCE_LABELS, ROLE_CONFIG } from './chain-constants';
import { GENERATED_CHAIN_ID_PREFIX } from '../../lib/threat-model/chain-types';

const TARA_CHAINS_PATH = 'datalake/tara-chains.json';
const TARA_REGISTRAR_PATH = 'datalake/qtara-registrar.json';

export class TaraChainsFormatError extends Error {
  constructor(detail: string) {
    super(`${TARA_CHAINS_PATH} is not usable: ${detail}. Fix the file or update load-tara-chains.ts.`);
    this.name = 'TaraChainsFormatError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isEvidenceLabel(value: unknown): boolean {
  return typeof value === 'string' && Object.hasOwn(EVIDENCE_LABELS, value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

/** A step may carry a realism anchor; if it does, the label must be one the page can draw. */
function isOptionalStepEvidence(value: unknown): value is StepEvidence | undefined {
  return (
    value === undefined ||
    (isRecord(value) &&
      isEvidenceLabel(value.label) &&
      typeof value.note === 'string' &&
      isOptionalString(value.source_url))
  );
}

/** A chain may carry a realism anchor; `extrapolation` is required to be text when present. */
function isOptionalChainEvidence(value: unknown): value is ChainEvidence | undefined {
  return (
    value === undefined ||
    (isRecord(value) &&
      isEvidenceLabel(value.overall_label) &&
      typeof value.rationale === 'string' &&
      isOptionalString(value.device_class) &&
      isOptionalString(value.extrapolation))
  );
}

function isChainStep(value: unknown): value is ChainStep {
  return (
    isRecord(value) &&
    typeof value.position === 'number' &&
    typeof value.technique_id === 'string' &&
    typeof value.tara_alias === 'string' &&
    typeof value.role === 'string' &&
    Object.hasOwn(ROLE_CONFIG, value.role) &&
    typeof value.action === 'string' &&
    typeof value.detection_window === 'string' &&
    isOptionalStepEvidence(value.evidence)
  );
}

function isOptionalClinicalParallel(value: unknown): value is ClinicalParallel | undefined {
  return value === undefined || (isRecord(value) && typeof value.name === 'string' && typeof value.note === 'string');
}

/** The shape every chain shares, curated or generated. */
export function isAttackChain(value: unknown): value is AttackChain {
  return (
    isRecord(value) &&
    typeof value.chain_id === 'string' &&
    typeof value.chain_name === 'string' &&
    typeof value.objective === 'string' &&
    typeof value.drift_profile === 'string' &&
    Array.isArray(value.steps) &&
    value.steps.every(isChainStep) &&
    isOptionalClinicalParallel(value.clinical_parallel) &&
    isStringArray(value.defenses) &&
    isOptionalChainEvidence(value.evidence)
  );
}

function findUnknownTechnique(chain: AttackChain, knownTechniqueIds: ReadonlySet<string>): string | undefined {
  return chain.steps.find((step) => !knownTechniqueIds.has(step.technique_id))?.technique_id;
}

/**
 * Validates parsed chain data so a bad file fails the build with a clear message.
 * Every step must name a technique that exists in the catalog.
 */
export function parseTaraChains(raw: unknown, knownTechniqueIds: ReadonlySet<string>): AttackChain[] {
  if (!isRecord(raw) || !Array.isArray(raw.chains)) {
    throw new TaraChainsFormatError('the top level must be an object with a "chains" array');
  }
  return raw.chains.map((chain, index) => {
    if (!isAttackChain(chain)) {
      throw new TaraChainsFormatError(`chains[${index}] is missing a required field or has a step with an unknown role`);
    }
    // Generated chains are hypotheses and must never be stored alongside curated ones.
    if (chain.chain_id.startsWith(GENERATED_CHAIN_ID_PREFIX)) {
      throw new TaraChainsFormatError(`chains[${index}] uses the id prefix "${GENERATED_CHAIN_ID_PREFIX}", which is reserved for machine-generated chains; give a curated chain another id`);
    }
    const unknownTechnique = findUnknownTechnique(chain, knownTechniqueIds);
    if (unknownTechnique !== undefined) {
      throw new TaraChainsFormatError(`chains[${index}] (${chain.chain_id}) references ${unknownTechnique}, which is not in ${TARA_REGISTRAR_PATH}`);
    }
    return chain;
  });
}

function readJson(relativePath: string): unknown {
  const contents = fs.readFileSync(path.resolve(relativePath), 'utf-8');
  try {
    return JSON.parse(contents);
  } catch (error) {
    throw new TaraChainsFormatError(`${relativePath} is not valid JSON (${error instanceof Error ? error.message : String(error)})`);
  }
}

function readCatalogTechniqueIds(): Set<string> {
  const registrar = readJson(TARA_REGISTRAR_PATH);
  if (!isRecord(registrar) || !Array.isArray(registrar.techniques)) {
    throw new TaraChainsFormatError(`${TARA_REGISTRAR_PATH} has no "techniques" array to check chain steps against`);
  }
  return new Set(registrar.techniques.filter(isRecord).map((technique) => String(technique.id)));
}

/** Build-time loader for the attack-chain catalog. Throws if a file is missing or malformed. */
export function loadTaraChains(): AttackChain[] {
  return parseTaraChains(readJson(TARA_CHAINS_PATH), readCatalogTechniqueIds());
}
