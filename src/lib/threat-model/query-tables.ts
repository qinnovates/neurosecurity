/**
 * Flattens one report into plain tables for the query mode. Every table describes the
 * device in focus, so a query can never mix findings from two devices.
 */

import type { EngineData } from './catalog-types';
import { entryPathOf } from './catalog-filter';
import { describeEvidence } from './evidence-levels';
import { SCOPE_TERM_LABELS } from './lab-terms';
import type { PlacementRules } from './reference-data-types';
import type { ThreatModelReport } from './report-types';
import { goalOf, isRiskAddressed } from './risk-register';
import { listScopeEntries, summariseScope } from './scope-statement';
import { describeElement } from './stride';

export type QueryRow = Record<string, string | number | boolean | null>;
export type QueryTables = Record<string, QueryRow[]>;

/**
 * Tables about the device in focus are prefixed "my_", so they never collide with the
 * site database's own tables (which include `techniques` and `cves`).
 */
export const QUERY_TABLE_DESCRIPTIONS: Record<string, string> = {
  my_risks: 'One row per risk on this device: catalog techniques and the STRIDE baseline. Evidence is the catalog tier.',
  my_parts: 'The parts of this device, with the open catalog rows on each.',
  my_links: 'The connections of this device: the two parts each joins, the medium, and what it carries.',
  my_chains: 'Generated attack chain hypotheses for this device.',
  my_chain_steps: 'The steps of those chains, in order.',
  my_requirements: 'The US requirements checklist for this device.',
  my_cves: 'CVEs in other products, linked through techniques that apply to this device.',
  placements: 'Every catalog technique with where it stands against this device (scope) and the reason.',
  technique_bands: 'One row per catalog technique and band id.',
};

function buildRiskRows(report: ThreatModelReport): QueryRow[] {
  const sharedComponentIds = new Set(report.model.components.filter((component) => component.isSharedAcrossPatients).map((component) => component.id));
  return report.riskRows.map((row): QueryRow => ({
    risk_id: row.riskId,
    part_id: row.elementId,
    part: row.elementLabel,
    // Carried on each risk so "risks on shared components" needs no join.
    shared_across_patients: sharedComponentIds.has(row.elementId),
    source: row.source,
    technique_id: row.techniqueId,
    threat: row.title,
    entry_path: row.entryPath,
    goal: row.goal,
    severity: row.catalogSeverity,
    // A baseline row is not a catalog technique and has no evidence tier.
    evidence: row.source === 'catalog' ? describeEvidence(row).label : null,
    cvss_vector: row.cvssBaseVector,
    niss: row.nissScore,
    status: row.status,
    addressed: isRiskAddressed(row),
    precedent_cves: row.precedentCveIds.length,
  }));
}

function buildElementTables(report: ThreatModelReport): Pick<QueryTables, 'my_parts' | 'my_links'> {
  const { model } = report;
  const openRisks = (elementId: string): number => report.riskRows.filter((row) =>
    row.elementId === elementId && row.source === 'catalog' && !isRiskAddressed(row)).length;
  return {
    my_parts: model.components.map((component): QueryRow => ({
      id: component.id, label: component.label, kind: component.kind, zone: component.trustZone,
      shared_across_patients: component.isSharedAcrossPatients, neural_interface: component.isNeuralInterface, open_risks: openRisks(component.id),
    })),
    my_links: model.links.map((link): QueryRow => ({
      id: link.id, label: describeElement(model, link.id), from: link.fromComponentId, to: link.toComponentId, medium: link.medium,
      carries_neural_data: link.carriesNeuralData, carries_stimulation_commands: link.carriesStimulationCommands,
      carries_software_updates: link.carriesSoftwareUpdates, open_risks: openRisks(link.id),
    })),
  };
}

function buildPlacementRows(report: ThreatModelReport, engineData: EngineData, rules: PlacementRules): QueryRow[] {
  const scopeById = new Map(listScopeEntries(summariseScope(report.model, engineData, { placementRules: rules })).map((entry) => [entry.techniqueId, entry]));
  return engineData.techniques.flatMap((technique): QueryRow[] => {
    const scope = scopeById.get(technique.id);
    if (scope === undefined) return [];
    return [{
      id: technique.id, name: technique.name, tactic: technique.tactic, domain: technique.domain, goal: goalOf(technique),
      entry_path: entryPathOf(technique.id, rules), severity: technique.severity, evidence: describeEvidence(technique).label,
      on_this_device: scope.term === 'applies', scope: SCOPE_TERM_LABELS[scope.term], reason: scope.reason,
    }];
  });
}

function buildChainTables(report: ThreatModelReport): Pick<QueryTables, 'my_chains' | 'my_chain_steps'> {
  const { chains } = report.chainResult;
  return {
    my_chains: chains.map((chain): QueryRow => ({
      chain_id: chain.chain_id, name: chain.chain_name, origin: chain.origin, steps: chain.steps.length,
      weakest_evidence: describeEvidence({ evidenceTier: chain.weakestEvidenceTier, evidenceStatus: chain.weakestEvidenceStatus }).label,
    })),
    my_chain_steps: chains.flatMap((chain) => chain.steps.map((step): QueryRow => ({
      chain_id: chain.chain_id, position: step.position, role: step.role, technique_id: step.technique_id,
      part: describeElement(report.model, step.elementId), evidence: describeEvidence(step).label,
    }))),
  };
}

export function buildQueryTables(report: ThreatModelReport, engineData: EngineData, rules: PlacementRules): QueryTables {
  return {
    my_risks: buildRiskRows(report),
    ...buildElementTables(report),
    ...buildChainTables(report),
    my_requirements: report.complianceItems.map((item): QueryRow => ({
      id: item.requirementId, title: item.title, applicability: item.applicability, evidence: item.evidence, instrument: item.instrument,
    })),
    my_cves: report.precedentCves.map((cve): QueryRow => ({
      cve_id: cve.cveId, product: cve.product, cvss: cve.cvssScore, via: cve.viaTechniqueIds.join(', '),
    })),
    placements: buildPlacementRows(report, engineData, rules),
    technique_bands: engineData.techniques.flatMap((technique) => technique.bandIds.map((bandId): QueryRow => ({ technique_id: technique.id, band_id: bandId }))),
  };
}
