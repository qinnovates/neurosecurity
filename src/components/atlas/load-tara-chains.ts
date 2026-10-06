import fs from 'node:fs';
import path from 'node:path';
import type { AttackChain, ChainStep } from './AttackChainViz';
import { ROLE_CONFIG } from './chain-constants';

const TARA_CHAINS_PATH = 'datalake/tara-chains.json';

export class TaraChainsFormatError extends Error {
  constructor(detail: string) {
    super(`${TARA_CHAINS_PATH} is not in the expected shape: ${detail}. Fix the file or update load-tara-chains.ts.`);
    this.name = 'TaraChainsFormatError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isChainStep(value: unknown): value is ChainStep {
  return (
    isRecord(value) &&
    typeof value.position === 'number' &&
    typeof value.technique_id === 'string' &&
    typeof value.tara_alias === 'string' &&
    typeof value.role === 'string' &&
    value.role in ROLE_CONFIG &&
    typeof value.action === 'string' &&
    typeof value.detection_window === 'string'
  );
}

function isAttackChain(value: unknown): value is AttackChain {
  return (
    isRecord(value) &&
    typeof value.chain_id === 'string' &&
    typeof value.chain_name === 'string' &&
    typeof value.objective === 'string' &&
    typeof value.drift_profile === 'string' &&
    Array.isArray(value.steps) &&
    value.steps.every(isChainStep) &&
    isStringArray(value.defenses)
  );
}

/** Validates parsed chain data so a malformed file fails the build with a clear message. */
export function parseTaraChains(raw: unknown): AttackChain[] {
  if (!isRecord(raw) || !Array.isArray(raw.chains)) {
    throw new TaraChainsFormatError('the top level must be an object with a "chains" array');
  }
  return raw.chains.map((chain, index) => {
    if (!isAttackChain(chain)) {
      throw new TaraChainsFormatError(`chains[${index}] is missing a required field or has a step with an unknown role`);
    }
    return chain;
  });
}

/** Build-time loader for the attack-chain catalog. Throws if the file is missing or malformed. */
export function loadTaraChains(): AttackChain[] {
  return parseTaraChains(JSON.parse(fs.readFileSync(path.resolve(TARA_CHAINS_PATH), 'utf-8')));
}
