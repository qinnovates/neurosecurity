/**
 * Builds attack chain hypotheses for a device model.
 *
 * A chain is assembled along a real path through the model: an initial-access
 * technique on one element, optional pivots on the elements between, and a terminal
 * technique (an objective or an exfiltration). Every edge records why its two steps
 * are joined. A chain is always a hypothesis, whatever the evidence behind its steps.
 */

import { CATALOG_SEVERITIES, DEFAULT_EVIDENCE_STATUSES, EVIDENCE_STATUS_RANK, type CatalogTechnique, type EngineData } from './catalog-types';
import { areDirectlyConnected, buildElementGraph, findShortestPath, type ElementGraph } from './chain-graph';
import {
  CHAIN_GENERATOR_VERSION, GENERATED_CHAIN_ID_PREFIX, GENERATED_CHAIN_ORIGIN,
  type ChainGenerationOptions, type ChainGenerationResult, type ChainRole, type EdgeBasis,
  type GeneratedChain, type GeneratedChainEdge, type GeneratedChainStep,
} from './chain-types';
import type { DeviceModel } from './device-model';
import { weakestEvidenceOf } from './evidence-levels';
import type { PlacementRules } from './reference-data-types';
import type { TechniqueMatch } from './report-types';
import { describeElement } from './stride';

export const DEFAULT_CHAIN_OPTIONS: ChainGenerationOptions = {
  allowedEvidenceStatuses: DEFAULT_EVIDENCE_STATUSES,
  maxChains: 5,
  maxSteps: 6,
  nodeBudget: 5_000,
};

const TERMINAL_ROLES: readonly ChainRole[] = ['objective', 'exfiltration'];
const TECHNIQUE_ID_PREFIX = 'QIF-';

export interface ChainInputs {
  model: DeviceModel;
  matches: readonly TechniqueMatch[];
  data: EngineData;
  placementRules: PlacementRules;
}

const UNRANKED = 99;

/**
 * The order the search prefers candidates and chains in. Like the eligibility gate, it reads
 * the legacy status: it decides which chains are generated, so it stays as it was until the
 * owner decides otherwise. What a reader sees of a step's evidence is worded from the tier.
 */
function selectionRank(evidenceStatus: string): number {
  const rank = (EVIDENCE_STATUS_RANK as readonly string[]).indexOf(evidenceStatus);
  return rank === -1 ? UNRANKED : rank;
}

interface Candidate {
  technique: CatalogTechnique;
  elementId: string;
  role: ChainRole;
}

function compareCandidates(left: Candidate, right: Candidate): number {
  return selectionRank(left.technique.evidenceStatus) - selectionRank(right.technique.evidenceStatus)
    || CATALOG_SEVERITIES.indexOf(left.technique.severity) - CATALOG_SEVERITIES.indexOf(right.technique.severity)
    || left.technique.id.localeCompare(right.technique.id)
    || left.elementId.localeCompare(right.elementId);
}

function listCandidates(inputs: ChainInputs, allowedStatuses: readonly string[]): Candidate[] {
  const techniqueById = new Map(inputs.data.techniques.map((technique) => [technique.id, technique]));
  return inputs.matches
    .flatMap((match): Candidate[] => {
      const technique = techniqueById.get(match.techniqueId);
      const role = inputs.placementRules.placements[match.techniqueId]?.chainRole;
      if (technique === undefined || role === undefined || !allowedStatuses.includes(technique.evidenceStatus)) return [];
      return [{ technique, elementId: match.elementId, role }];
    })
    .sort(compareCandidates);
}

function areDocumentedAsRelated(left: CatalogTechnique, right: CatalogTechnique): boolean {
  return left.relatedTechniqueIds.includes(right.id) || right.relatedTechniqueIds.includes(left.id);
}

function classifyEdge(from: Candidate, to: Candidate, graph: ElementGraph): EdgeBasis {
  if (areDocumentedAsRelated(from.technique, to.technique)) return 'documented-relation';
  if (from.elementId === to.elementId) return 'shared-element';
  return areDirectlyConnected(graph, from.elementId, to.elementId) ? 'connected-elements' : 'reachable-elements';
}

/** Picks the best candidate of one role on the given elements, skipping techniques already used. */
function pickOnElements(candidates: readonly Candidate[], role: ChainRole, elementIds: readonly string[], usedIds: ReadonlySet<string>): Candidate | null {
  return candidates.find((candidate) =>
    candidate.role === role && elementIds.includes(candidate.elementId) && !usedIds.has(candidate.technique.id)) ?? null;
}

function assembleSteps(entry: Candidate, terminal: Candidate, path: readonly string[], candidates: readonly Candidate[], graph: ElementGraph, maxSteps: number): Candidate[] {
  const usedIds = new Set([entry.technique.id, terminal.technique.id]);
  const take = (candidate: Candidate | null): Candidate[] => {
    if (candidate === null) return [];
    usedIds.add(candidate.technique.id);
    return [candidate];
  };
  // Reconnaissance only counts where the attacker enters: on the entry element or one joined to it.
  const entryVicinity = [entry.elementId, ...(graph.get(entry.elementId) ?? [])];
  const reconnaissance = take(pickOnElements(candidates, 'reconnaissance', entryVicinity, usedIds));
  const persistence = terminal.role === 'objective' ? take(pickOnElements(candidates, 'persistence', path, usedIds)) : [];
  const pivotBudget = Math.max(0, maxSteps - 2 - reconnaissance.length - persistence.length);
  const pivots = path.slice(1)
    .flatMap((elementId) => take(pickOnElements(candidates, 'pivot', [elementId], usedIds)))
    .slice(0, pivotBudget);
  return [...reconnaissance, entry, ...pivots, terminal, ...persistence];
}

/** The weakest legacy status among the steps; orders the chain list. */
function weakestStatus(steps: readonly Candidate[]): string {
  return steps.reduce((weakest, step) =>
    (selectionRank(step.technique.evidenceStatus) > selectionRank(weakest) ? step.technique.evidenceStatus : weakest),
  steps[0].technique.evidenceStatus);
}

function toChainSteps(steps: readonly Candidate[], model: DeviceModel): GeneratedChainStep[] {
  return steps.map((step, index): GeneratedChainStep => ({
    position: index + 1,
    technique_id: step.technique.id,
    tara_alias: step.technique.alias ?? step.technique.id,
    role: step.role,
    action: `${step.technique.name} at ${describeElement(model, step.elementId)}`,
    detection_window: step.technique.detection ?? 'No detection approach is recorded in the catalog.',
    elementId: step.elementId,
    evidenceStatus: step.technique.evidenceStatus,
    evidenceTier: step.technique.evidenceTier,
  }));
}

function toChainEdges(steps: readonly Candidate[], graph: ElementGraph): GeneratedChainEdge[] {
  return steps.slice(1).map((step, index): GeneratedChainEdge => ({
    fromPosition: index + 1, toPosition: index + 2, basis: classifyEdge(steps[index], step, graph),
  }));
}

function toChain(steps: readonly Candidate[], inputs: ChainInputs, graph: ElementGraph): GeneratedChain {
  const { model, data } = inputs;
  const terminal = steps.find((step) => TERMINAL_ROLES.includes(step.role)) ?? steps[steps.length - 1];
  const entry = steps.find((step) => step.role === 'initial_access') ?? steps[0];
  const verb = terminal.role === 'exfiltration' ? 'take data through' : 'reach';
  const weakestByTier = weakestEvidenceOf(steps.map((step) => step.technique)) ?? terminal.technique;
  return {
    origin: GENERATED_CHAIN_ORIGIN,
    chain_id: `${GENERATED_CHAIN_ID_PREFIX}${steps.map((step) => step.technique.id.replace(TECHNIQUE_ID_PREFIX, '')).join('-')}`,
    chain_name: `${terminal.technique.name} via ${describeElement(model, entry.elementId)}`,
    objective: `Hypothesis: ${verb} "${terminal.technique.name}" at ${describeElement(model, terminal.elementId)}.`,
    drift_profile: 'Not assessed for generated chains.',
    steps: toChainSteps(steps, model),
    // The catalog holds no defense for a technique or a chain, so a generated chain names none.
    defenses: [],
    edges: toChainEdges(steps, graph),
    weakestEvidenceStatus: weakestStatus(steps),
    weakestEvidenceTier: weakestByTier.evidenceTier,
    generatorVersion: CHAIN_GENERATOR_VERSION,
    registrarVersion: data.registrarVersion,
  };
}

function countEdges(chain: GeneratedChain, basis: EdgeBasis): number {
  return chain.edges.filter((edge) => edge.basis === basis).length;
}

/** Strongest legacy status first (see `selectionRank`); then chains that never jump across elements with no step; then catalog-linked ones. */
function compareChains(left: GeneratedChain, right: GeneratedChain): number {
  return selectionRank(left.weakestEvidenceStatus) - selectionRank(right.weakestEvidenceStatus)
    || countEdges(left, 'reachable-elements') - countEdges(right, 'reachable-elements')
    || countEdges(right, 'documented-relation') - countEdges(left, 'documented-relation')
    || left.steps.length - right.steps.length
    || left.chain_id.localeCompare(right.chain_id);
}

function explainEmptyResult(candidates: readonly Candidate[], hasEntries: boolean, hasTerminals: boolean, statuses: readonly string[]): string {
  const filter = `evidence status ${statuses.join(' or ')}`;
  if (candidates.length === 0) return `No technique placed on this model has ${filter}.`;
  if (!hasEntries) return `No initial-access technique with ${filter} is placed on this model.`;
  if (!hasTerminals) return `No objective or exfiltration technique with ${filter} is placed on this model.`;
  return 'No entry point is connected to an objective or exfiltration point in this model.';
}

/**
 * A technique placed on several elements is used once. Where one of those elements is the
 * neural interface, that is the one a chain ends on, since it is where the effect lands.
 */
function preferNeuralInterface(terminals: readonly Candidate[], model: DeviceModel): Candidate[] {
  const interfaceId = model.components.find((component) => component.isNeuralInterface)?.id;
  const onInterfaceFirst = (candidate: Candidate): number => (candidate.elementId === interfaceId ? 0 : 1);
  return terminals
    .map((candidate, index) => ({ candidate, index }))
    .sort((left, right) =>
      left.candidate.technique.id === right.candidate.technique.id
        ? onInterfaceFirst(left.candidate) - onInterfaceFirst(right.candidate) || left.index - right.index
        : left.index - right.index)
    .map(({ candidate }) => candidate);
}

/**
 * Entries the catalog cross-references with the terminal come first, then entries no
 * earlier chain has used, so the chains shown differ in more than their last step.
 */
function orderEntries(entries: readonly Candidate[], terminal: Candidate, usedEntryIds: ReadonlySet<string>): Candidate[] {
  const preference = (entry: Candidate): number =>
    (areDocumentedAsRelated(entry.technique, terminal.technique) ? 0 : 2) + (usedEntryIds.has(entry.technique.id) ? 1 : 0);
  return [...entries].sort((left, right) => preference(left) - preference(right));
}

/** One chain per terminal technique: the preferred entry that has a path to it. */
function buildChainForTerminal(terminal: Candidate, entries: readonly Candidate[], candidates: readonly Candidate[], graph: ElementGraph, maxSteps: number, spend: () => boolean): Candidate[] | null {
  for (const entry of entries) {
    if (!spend()) return null;
    if (entry.technique.id === terminal.technique.id) continue;
    const path = findShortestPath(graph, entry.elementId, terminal.elementId);
    if (path !== null) return assembleSteps(entry, terminal, path, candidates, graph, maxSteps);
  }
  return null;
}

export function generateChains(inputs: ChainInputs, options: ChainGenerationOptions = DEFAULT_CHAIN_OPTIONS): ChainGenerationResult {
  const candidates = listCandidates(inputs, options.allowedEvidenceStatuses);
  const entries = candidates.filter((candidate) => candidate.role === 'initial_access');
  const terminals = preferNeuralInterface(candidates.filter((candidate) => TERMINAL_ROLES.includes(candidate.role)), inputs.model);
  const graph = buildElementGraph(inputs.model);

  let remainingBudget = options.nodeBudget;
  const spend = (): boolean => { remainingBudget -= 1; return remainingBudget >= 0; };

  const chainById = new Map<string, GeneratedChain>();
  const seenTerminalIds = new Set<string>();
  const usedEntryIds = new Set<string>();
  for (const terminal of terminals) {
    if (remainingBudget < 0) break;
    if (seenTerminalIds.has(terminal.technique.id)) continue;
    const steps = buildChainForTerminal(terminal, orderEntries(entries, terminal, usedEntryIds), candidates, graph, options.maxSteps, spend);
    if (steps === null) continue;
    seenTerminalIds.add(terminal.technique.id);
    for (const step of steps) if (step.role === 'initial_access') usedEntryIds.add(step.technique.id);
    const chain = toChain(steps, inputs, graph);
    if (!chainById.has(chain.chain_id)) chainById.set(chain.chain_id, chain);
  }

  const chains = [...chainById.values()].sort(compareChains).slice(0, options.maxChains);
  return {
    chains,
    wasTruncated: remainingBudget < 0,
    chainsFound: chainById.size,
    wasCapped: chainById.size > chains.length,
    emptyReason: chains.length > 0 ? null : explainEmptyResult(candidates, entries.length > 0, terminals.length > 0, options.allowedEvidenceStatuses),
  };
}
