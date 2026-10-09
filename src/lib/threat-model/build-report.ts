import { selectArchitectureViews } from './architecture-views';
import type { EngineData } from './catalog-types';
import type { ChainGenerationOptions } from './chain-types';
import { assessCyberDevice, evaluateCompliance } from './compliance-us';
import type { DeviceModel } from './device-model';
import { evidenceRankOf } from './evidence-levels';
import { DEFAULT_CHAIN_OPTIONS, generateChains } from './generate-chains';
import { collectMatches, matchTechniques } from './match-techniques';
import { collectPrecedentCves } from './precedent-cves';
import type { ScopeTerm } from './lab-terms';
import type { ReferenceData } from './reference-data-types';
import type {
  AmbientThreat, CatalogCoverage, ElementOutcome, GoalCoverage, ThemeSummary, ThemeTechnique, ThreatGoal, ThreatModelReport,
} from './report-types';
import { buildRiskRegister, goalOf } from './risk-register';
import { indexScopeTerms, summariseScope } from './scope-statement';

/** Caveats printed with every report, in order. They describe what the tool is and is not. One more, computed from the placement table, follows `CVES_LIMITATION`. */
const CVES_LIMITATION = 'CVEs in other products are records about similar products. They are not findings about the modelled device.';
export const REPORT_LIMITATIONS: readonly string[] = [
  'This is a drafting aid. It is not a compliance determination, legal advice, or a substitute for review by a qualified regulatory or security professional.',
  'TARA and NISS are proposed research frameworks. They are not peer reviewed and are not adopted by any standards body.',
  'The device presets, placement rules, entry paths, themes, STRIDE mapping, chain roles, and requirements checklist are this tool\'s own analysis. They were drafted with an AI assistant and have not yet been reviewed line by line by the author.',
  'Attack chains are generated hypotheses. A chain shows that a path exists in the model; it is not evidence that the attack has been carried out.',
  CVES_LIMITATION,
  'Techniques are placed from the answers given. Anything not described in the model is not assessed.',
];

/** How much of the catalog the placement table decides on: techniques placed plus techniques reviewed and left outside, of the catalog's total. */
export function describePlacementCoverage(coverage: CatalogCoverage): string {
  const decided = coverage.totalTechniques - coverage.notReviewedTechniques;
  return `${decided} of ${coverage.totalTechniques} catalog techniques have a placement decision. The rest of the catalog is not assessed.`;
}

/** The standing caveats with the computed coverage sentence in its place. */
export function listLimitations(coverage: CatalogCoverage): string[] {
  return REPORT_LIMITATIONS.flatMap((limitation) => (limitation === CVES_LIMITATION ? [limitation, describePlacementCoverage(coverage)] : [limitation]));
}

export interface ReportInputs {
  model: DeviceModel;
  engineData: EngineData;
  referenceData: ReferenceData;
  /** ISO timestamp from the caller; the engine never reads the clock. */
  generatedAt: string;
  chainOptions?: ChainGenerationOptions;
}

function listCoverageGaps(outcomes: readonly ElementOutcome[]): string[] {
  return [...new Set(outcomes.flatMap((outcome) => (outcome.kind === 'not_modelled' ? [outcome.detail] : [])))];
}

function summariseCatalogCoverage(engineData: EngineData, referenceData: ReferenceData): CatalogCoverage {
  const { placements, notPlaced } = referenceData.placementRules;
  const notPlacedByCategory: Record<string, number> = {};
  for (const decision of Object.values(notPlaced)) {
    notPlacedByCategory[decision.category] = (notPlacedByCategory[decision.category] ?? 0) + 1;
  }
  const placedTechniques = Object.keys(placements).length;
  const totalTechniques = engineData.techniques.length;
  return {
    totalTechniques,
    placedTechniques,
    notPlacedByCategory,
    notReviewedTechniques: totalTechniques - placedTechniques - Object.keys(notPlaced).length,
  };
}

function summariseGoalCoverage(engineData: EngineData, referenceData: ReferenceData): Record<ThreatGoal, GoalCoverage> {
  const coverage: Record<ThreatGoal, GoalCoverage> = {
    read: { placedTechniques: 0, catalogTechniques: 0, isIncomplete: false },
    change: { placedTechniques: 0, catalogTechniques: 0, isIncomplete: false },
    deny: { placedTechniques: 0, catalogTechniques: 0, isIncomplete: false },
  };
  const { placements, notPlaced } = referenceData.placementRules;
  for (const technique of engineData.techniques) {
    const goal = goalOf(technique);
    if (goal === null) continue;
    coverage[goal].catalogTechniques += 1;
    if (technique.id in placements) coverage[goal].placedTechniques += 1;
    else if (!(technique.id in notPlaced)) coverage[goal].isIncomplete = true;
  }
  return coverage;
}

/** Evidenced techniques that do not pass through any device, best evidenced first. Classes this tool cannot model are left out. */
function listAmbientThreats(engineData: EngineData, referenceData: ReferenceData): AmbientThreat[] {
  const { notPlaced } = referenceData.placementRules;
  return engineData.techniques
    .flatMap((technique): AmbientThreat[] => {
      const decision = notPlaced[technique.id];
      if (decision === undefined || decision.category === 'other_device_class') return [];
      return [{
        techniqueId: technique.id, name: technique.name, category: decision.category, reason: decision.reason,
        goal: goalOf(technique), evidenceStatus: technique.evidenceStatus, evidenceTier: technique.evidenceTier,
      }];
    })
    .sort((left, right) => evidenceRankOf(left) - evidenceRankOf(right) || left.techniqueId.localeCompare(right.techniqueId));
}

function summariseThemes(engineData: EngineData, referenceData: ReferenceData, termByTechniqueId: ReadonlyMap<string, ScopeTerm>): ThemeSummary[] {
  const techniqueById = new Map(engineData.techniques.map((technique) => [technique.id, technique]));
  return referenceData.themes.map((theme): ThemeSummary => ({
    id: theme.id,
    label: theme.label,
    description: theme.description,
    catalogGap: theme.catalogGap,
    techniques: theme.techniqueIds.flatMap((techniqueId): ThemeTechnique[] => {
      const technique = techniqueById.get(techniqueId);
      const standing = termByTechniqueId.get(techniqueId);
      if (technique === undefined || standing === undefined) return [];
      return [{ techniqueId, name: technique.name, evidenceStatus: technique.evidenceStatus, evidenceTier: technique.evidenceTier, standing }];
    }),
  }));
}

export function buildThreatModelReport(inputs: ReportInputs): ThreatModelReport {
  const { model, engineData, referenceData, generatedAt } = inputs;
  const elementOutcomes = matchTechniques(model, engineData, referenceData.placementRules);
  const matches = collectMatches(elementOutcomes);
  const matchedTechniqueIds = new Set(matches.map((match) => match.techniqueId));

  const catalogCoverage = summariseCatalogCoverage(engineData, referenceData);

  return {
    generatedAt,
    registrarVersion: engineData.registrarVersion,
    model,
    elementOutcomes,
    architectureViews: selectArchitectureViews(model),
    chainResult: generateChains(
      { model, matches, data: engineData, placementRules: referenceData.placementRules },
      inputs.chainOptions ?? DEFAULT_CHAIN_OPTIONS,
    ),
    riskRows: buildRiskRegister(model, matches, engineData, referenceData.strideMap, referenceData.placementRules),
    precedentCves: collectPrecedentCves(matchedTechniqueIds, engineData.precedentCves),
    precedentCvesAsOf: engineData.precedentCvesAsOf,
    cyberDeviceAssessment: assessCyberDevice(model, referenceData.compliance),
    complianceItems: evaluateCompliance(model, referenceData.compliance),
    ambientThreats: listAmbientThreats(engineData, referenceData),
    themes: summariseThemes(engineData, referenceData, indexScopeTerms(summariseScope(model, engineData, referenceData))),
    catalogCoverage,
    goalCoverage: summariseGoalCoverage(engineData, referenceData),
    coverageGaps: listCoverageGaps(elementOutcomes),
    limitations: listLimitations(catalogCoverage),
  };
}
