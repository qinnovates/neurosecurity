/**
 * Flattens one report into plain tables for the query mode. Every table describes the
 * device in focus, so a query can never mix findings from two devices.
 */

import type { EngineData } from './catalog-types';
import type { PlacementRules } from './reference-data-types';
import type { ThreatModelReport } from './report-types';
import { goalOf, isRiskAddressed } from './risk-register';
import { describeElement } from './stride';

export type QueryRow = Record<string, string | number | boolean | null>;
export type QueryTables = Record<string, QueryRow[]>;

/**
 * Tables about the device in focus are prefixed "my_", so they never collide with the
 * site database's own tables (which include `techniques` and `cves`).
 */
export const QUERY_TABLE_DESCRIPTIONS: Record<string, string> = {
  my_risks: 'One row per risk on this device: neural techniques and the STRIDE baseline.',
  my_parts: 'The components and connections of this device.',
  my_chains: 'Generated attack chain hypotheses for this device.',
  my_chain_steps: 'The steps of those chains, in order.',
  my_requirements: 'The US requirements checklist for this device.',
  my_cves: 'Precedent CVEs in similar products, linked through placed techniques.',
  placements: 'Every catalog technique with its placement decision, and whether it is on this device.',
};

function decisionFor(techniqueId: string, rules: PlacementRules): { decision: string; reason: string } {
  const placement = rules.placements[techniqueId];
  if (placement !== undefined) return { decision: 'placed', reason: placement.basis };
  const notPlaced = rules.notPlaced[techniqueId];
  if (notPlaced !== undefined) return { decision: 'not_placed', reason: notPlaced.reason };
  return { decision: 'not_reviewed', reason: 'Weaker evidence; not yet reviewed for device applicability.' };
}

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
    evidence: row.evidenceStatus,
    cvss_vector: row.cvssBaseVector,
    niss: row.nissScore,
    status: row.status,
    addressed: isRiskAddressed(row, report.model.controlsInPlace),
    precedent_cves: row.precedentCveIds.length,
  }));
}

function buildPartRows(report: ThreatModelReport): QueryRow[] {
  const { model } = report;
  const openRisks = (elementId: string): number => report.riskRows.filter((row) =>
    row.elementId === elementId && row.source === 'catalog' && !isRiskAddressed(row, model.controlsInPlace)).length;
  const components = model.components.map((component): QueryRow => ({
    id: component.id, label: component.label, kind: component.kind, zone: component.trustZone,
    shared_across_patients: component.isSharedAcrossPatients, open_risks: openRisks(component.id),
  }));
  const links = model.links.map((link): QueryRow => ({
    id: link.id, label: describeElement(model, link.id), kind: `link:${link.medium}`, zone: null,
    shared_across_patients: false, open_risks: openRisks(link.id),
  }));
  return [...components, ...links];
}

function buildChainTables(report: ThreatModelReport): Pick<QueryTables, 'my_chains' | 'my_chain_steps'> {
  const { chains } = report.chainResult;
  return {
    my_chains: chains.map((chain): QueryRow => ({
      chain_id: chain.chain_id, name: chain.chain_name, origin: chain.origin, steps: chain.steps.length,
      weakest_evidence: chain.weakestEvidenceStatus,
    })),
    my_chain_steps: chains.flatMap((chain) => chain.steps.map((step): QueryRow => ({
      chain_id: chain.chain_id, position: step.position, role: step.role, technique_id: step.technique_id,
      part: describeElement(report.model, step.elementId), evidence: step.evidenceStatus,
    }))),
  };
}

export function buildQueryTables(report: ThreatModelReport, engineData: EngineData, rules: PlacementRules): QueryTables {
  const placedHere = new Set(report.riskRows.filter((row) => row.source === 'catalog').map((row) => row.techniqueId));
  return {
    my_risks: buildRiskRows(report),
    my_parts: buildPartRows(report),
    ...buildChainTables(report),
    my_requirements: report.complianceItems.map((item): QueryRow => ({
      id: item.requirementId, title: item.title, applicability: item.applicability, evidence: item.evidence, instrument: item.instrument,
    })),
    my_cves: report.precedentCves.map((cve): QueryRow => ({
      cve_id: cve.cveId, product: cve.product, cvss: cve.cvssScore, via: cve.viaTechniqueIds.join(', '),
    })),
    placements: engineData.techniques.map((technique): QueryRow => ({
      id: technique.id, name: technique.name, tactic: technique.tactic, domain: technique.domain, goal: goalOf(technique),
      entry_path: rules.placements[technique.id]?.entryPath ?? (technique.id in rules.notPlaced ? 'around_device' : null),
      severity: technique.severity,
      evidence: technique.evidenceStatus, on_this_device: placedHere.has(technique.id), ...decisionFor(technique.id, rules),
    })),
  };
}
