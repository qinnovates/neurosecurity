import { CATALOG_SEVERITIES, EVIDENCE_STATUS_RANK, type CatalogTechnique, type EngineData } from './catalog-types';
import type { DeviceModel, RiskDecision } from './device-model';
import { indexCveIdsByTechnique } from './precedent-cves';
import type { PlacementRules, StrideMap } from './reference-data-types';
import type { RiskRow, TechniqueMatch, ThreatGoal } from './report-types';
import { STRIDE_LABELS, describeElement, listBaselineThreats, strideForTechnique } from './stride';

const RISK_ID_SEPARATOR = '::';
const STRIDE_RISK_PREFIX = 'STRIDE-';
const MAX_CONTROLS_PER_ROW = 6;
const UNRANKED = 99;
const GOAL_BY_MODE: Record<string, ThreatGoal> = { R: 'read', M: 'change', D: 'deny' };

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

export function evidenceRank(evidenceStatus: string | null): number {
  const rank = (EVIDENCE_STATUS_RANK as readonly string[]).indexOf(evidenceStatus ?? '');
  return rank === -1 ? UNRANKED : rank;
}

function severityRank(row: RiskRow): number {
  return row.catalogSeverity === null ? UNRANKED : CATALOG_SEVERITIES.indexOf(row.catalogSeverity);
}

/** Catalog rows first, most severe and best evidenced at the top; baseline rows after. */
export function compareRiskRows(left: RiskRow, right: RiskRow): number {
  return severityRank(left) - severityRank(right)
    || evidenceRank(left.evidenceStatus) - evidenceRank(right.evidenceStatus)
    || left.riskId.localeCompare(right.riskId);
}

function suggestControls(technique: CatalogTechnique, data: EngineData): string[] {
  const fromBands = technique.bandIds.flatMap((bandId) => {
    const controls = data.controlsByBand[bandId];
    return controls === undefined ? [] : [...controls.prevention, ...controls.detection];
  });
  const fromTechnique = technique.detection === null ? [] : [technique.detection];
  return [...new Set([...fromTechnique, ...fromBands])].slice(0, MAX_CONTROLS_PER_ROW);
}

interface RegisterContext {
  model: DeviceModel;
  data: EngineData;
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
    precedentCveIds: context.cveIdsByTechnique.get(technique.id) ?? [],
    controls: suggestControls(technique, context.data),
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
      precedentCveIds: [],
      controls: [],
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
      precedentCveIds: [],
      controls: [],
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
    data,
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

/** A row counts as addressed once the user has dispositioned it or marked one of its controls as in place. */
export function isRiskAddressed(row: RiskRow, controlsInPlace: readonly string[]): boolean {
  return row.status !== 'open' || row.controls.some((control) => controlsInPlace.includes(control));
}

/** Unaddressed catalog risks per element; drives the heat shown on the diagram. */
export function countOpenRisksByElement(rows: readonly RiskRow[], controlsInPlace: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.source !== 'catalog' || isRiskAddressed(row, controlsInPlace)) continue;
    counts.set(row.elementId, (counts.get(row.elementId) ?? 0) + 1);
  }
  return counts;
}
