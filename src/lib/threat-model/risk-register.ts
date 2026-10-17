import { CATALOG_SEVERITIES, type CatalogTechnique, type EngineData } from './catalog-types';
import type { DeviceModel, RiskDecision } from './device-model';
import { evidenceRankOf } from './evidence-levels';
import { GOAL_BY_MODE } from './lab-terms';
import { indexCveIdsByTechnique } from './precedent-cves';
import type { PlacementRules, StrideMap } from './reference-data-types';
import type { RiskRow, TechniqueMatch, ThreatGoal } from './report-types';
import { STRIDE_LABELS, describeElement, listBaselineThreats, strideForTechnique } from './stride';

export const RISK_ID_SEPARATOR = '::';
export const STRIDE_RISK_PREFIX = 'STRIDE-';
const UNRANKED = 99;

/** Read, change, or deny, from the catalog's mode for the technique. */
export function goalOf(technique: CatalogTechnique): ThreatGoal | null {
  return technique.mode === null ? null : GOAL_BY_MODE[technique.mode];
}

export function catalogRiskId(elementId: string, techniqueId: string): string {
  return `${elementId}${RISK_ID_SEPARATOR}${techniqueId}`;
}

function baselineRiskId(elementId: string, category: string): string {
  return `${elementId}${RISK_ID_SEPARATOR}${STRIDE_RISK_PREFIX}${category}`;
}

function severityRank(row: RiskRow): number {
  return row.catalogSeverity === null ? UNRANKED : CATALOG_SEVERITIES.indexOf(row.catalogSeverity);
}

/** Most severe first, then the stronger evidence tier, then by id. */
export function compareRiskRows(left: RiskRow, right: RiskRow): number {
  return severityRank(left) - severityRank(right)
    || evidenceRankOf(left) - evidenceRankOf(right)
    || left.riskId.localeCompare(right.riskId);
}

interface RegisterContext {
  model: DeviceModel;
  strideMap: StrideMap;
  placementRules: PlacementRules;
  decisionByRiskId: ReadonlyMap<string, RiskDecision>;
  cveIdsByTechnique: ReadonlyMap<string, string[]>;
}

function toCatalogRow(match: TechniqueMatch, technique: CatalogTechnique, context: RegisterContext): RiskRow {
  const riskId = catalogRiskId(match.elementId, technique.id);
  const decision = context.decisionByRiskId.get(riskId);
  return {
    riskId,
    elementId: match.elementId,
    elementLabel: describeElement(context.model, match.elementId),
    source: 'catalog',
    techniqueId: technique.id,
    title: technique.name,
    strideCategories: strideForTechnique(technique, context.strideMap),
    entryPath: context.placementRules.placements[technique.id]?.entryPath ?? null,
    goal: goalOf(technique),
    catalogSeverity: technique.severity,
    cvssBaseVector: technique.cvssBaseVector,
    nissScore: technique.nissScore,
    evidenceStatus: technique.evidenceStatus,
    evidenceTier: technique.evidenceTier,
    precedentCveIds: context.cveIdsByTechnique.get(technique.id) ?? [],
    detectionNote: technique.detection,
    fdaRequirementCodes: technique.fdaRequirementCodes,
    status: decision?.status ?? 'open',
    note: decision?.note ?? '',
    catalogState: 'current',
  };
}

function toBaselineRows(context: RegisterContext): RiskRow[] {
  return listBaselineThreats(context.model, context.strideMap).map((threat): RiskRow => {
    const riskId = baselineRiskId(threat.elementId, threat.category);
    const decision = context.decisionByRiskId.get(riskId);
    return {
      riskId,
      elementId: threat.elementId,
      elementLabel: threat.elementLabel,
      source: 'stride',
      techniqueId: null,
      title: `${STRIDE_LABELS[threat.category]}: ${threat.elementLabel}`,
      strideCategories: [threat.category],
      entryPath: null,
      goal: null,
      catalogSeverity: null,
      cvssBaseVector: null,
      nissScore: null,
      evidenceStatus: null,
      evidenceTier: null,
      precedentCveIds: [],
      detectionNote: null,
      fdaRequirementCodes: [],
      status: decision?.status ?? 'open',
      note: decision?.note ?? '',
      catalogState: 'current',
    };
  });
}

/**
 * Rows for saved decisions whose technique is no longer in the catalog. They are
 * kept and flagged so a decision someone recorded never disappears silently.
 */
function toMissingTechniqueRows(context: RegisterContext, knownTechniqueIds: ReadonlySet<string>): RiskRow[] {
  return context.model.riskDecisions.flatMap((decision): RiskRow[] => {
    const [elementId, subjectId] = decision.riskId.split(RISK_ID_SEPARATOR);
    const isMissingTechnique = subjectId !== undefined
      && !subjectId.startsWith(STRIDE_RISK_PREFIX)
      && !knownTechniqueIds.has(subjectId);
    if (!isMissingTechnique) return [];
    return [{
      riskId: decision.riskId,
      elementId,
      elementLabel: describeElement(context.model, elementId),
      source: 'catalog',
      techniqueId: subjectId,
      title: 'Technique no longer in the catalog',
      strideCategories: [],
      entryPath: null,
      goal: null,
      catalogSeverity: null,
      cvssBaseVector: null,
      nissScore: null,
      evidenceStatus: null,
      evidenceTier: null,
      precedentCveIds: [],
      detectionNote: null,
      fdaRequirementCodes: [],
      status: decision.status,
      note: decision.note,
      catalogState: 'missing',
    }];
  });
}

export function buildRiskRegister(model: DeviceModel, matches: readonly TechniqueMatch[], data: EngineData, strideMap: StrideMap, placementRules: PlacementRules): RiskRow[] {
  const techniqueById = new Map(data.techniques.map((technique) => [technique.id, technique]));
  const context: RegisterContext = {
    model,
    strideMap,
    placementRules,
    decisionByRiskId: new Map(model.riskDecisions.map((decision) => [decision.riskId, decision])),
    cveIdsByTechnique: indexCveIdsByTechnique(data.precedentCves),
  };
  const catalogRows = matches.flatMap((match): RiskRow[] => {
    const technique = techniqueById.get(match.techniqueId);
    return technique === undefined ? [] : [toCatalogRow(match, technique, context)];
  });
  return [
    ...catalogRows.sort(compareRiskRows),
    ...toMissingTechniqueRows(context, new Set(techniqueById.keys())),
    ...toBaselineRows(context),
  ];
}

/** A row closes only by the decision recorded on that row. Nothing recorded elsewhere can close it. */
export function isRiskAddressed(row: RiskRow): boolean {
  return row.status !== 'open';
}

/**
 * Files saved under the older scheme list control names that used to close every row naming
 * them. The list is kept so those files round-trip, and counted here so the screen can say once
 * that it no longer has any effect.
 */
export function countLegacyControlsInPlace(model: DeviceModel): number {
  return model.controlsInPlace.length;
}

/** The one notice for such a file, or null when there is nothing to say. */
export function describeLegacyControls(model: DeviceModel): string | null {
  const count = countLegacyControlsInPlace(model);
  if (count === 0) return null;
  return `This file marks ${count} control${count === 1 ? '' : 's'} in place under an older scheme. ${count === 1 ? 'It no longer closes' : 'They no longer close'} rows.`;
}

/** Unaddressed catalog risks per element; drives the heat shown on the diagram. */
export function countOpenRisksByElement(rows: readonly RiskRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.source !== 'catalog' || isRiskAddressed(row)) continue;
    counts.set(row.elementId, (counts.get(row.elementId) ?? 0) + 1);
  }
  return counts;
}
