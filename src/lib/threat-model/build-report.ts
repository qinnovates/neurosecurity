import { selectArchitectureViews } from './architecture-views';
import type { EngineData } from './catalog-types';
import type { ChainGenerationOptions } from './chain-types';
import { assessCyberDevice, evaluateCompliance } from './compliance-us';
import type { DeviceModel } from './device-model';
import { DEFAULT_CHAIN_OPTIONS, generateChains } from './generate-chains';
import { collectMatches, matchTechniques } from './match-techniques';
import { collectPrecedentCves } from './precedent-cves';
import type { ReferenceData } from './reference-data-types';
import type { AmbientThreat, CatalogCoverage, ElementOutcome, ThemeSummary, ThemeTechnique, ThreatModelReport } from './report-types';
import { buildRiskRegister, evidenceRank, goalOf } from './risk-register';

/** Caveats printed with every report. They describe what the tool is and is not. */
export const REPORT_LIMITATIONS: readonly string[] = [
  'This is a drafting aid. It is not a compliance determination, legal advice, or a substitute for review by a qualified regulatory or security professional.',
  'TARA and NISS are proposed research frameworks. They are not peer reviewed and are not adopted by any standards body.',
  'The device presets, placement rules, STRIDE mapping, chain roles, and requirements checklist are this tool\'s own authored analysis and are unreviewed.',
  'Attack chains are generated hypotheses. A chain shows that a path exists in the model; it is not evidence that the attack has been carried out.',
  'Precedent CVEs come from similar products. They are not findings about the modelled device.',
  'Only catalog techniques with confirmed or demonstrated evidence have a placement decision. The rest of the catalog is not assessed.',
  'Techniques are placed from the answers given. Anything not described in the model is not assessed.',
];

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

/** Evidenced techniques that do not pass through any device, best evidenced first. Classes this tool cannot model are left out. */
function listAmbientThreats(engineData: EngineData, referenceData: ReferenceData): AmbientThreat[] {
  const { notPlaced } = referenceData.placementRules;
  return engineData.techniques
    .flatMap((technique): AmbientThreat[] => {
      const decision = notPlaced[technique.id];
      if (decision === undefined || decision.category === 'other_device_class') return [];
      return [{
        techniqueId: technique.id, name: technique.name, category: decision.category, reason: decision.reason,
        goal: goalOf(technique), evidenceStatus: technique.evidenceStatus,
      }];
    })
    .sort((left, right) => evidenceRank(left.evidenceStatus) - evidenceRank(right.evidenceStatus) || left.techniqueId.localeCompare(right.techniqueId));
}

function summariseThemes(engineData: EngineData, referenceData: ReferenceData, matchedTechniqueIds: ReadonlySet<string>): ThemeSummary[] {
  const { placements, notPlaced } = referenceData.placementRules;
  const techniqueById = new Map(engineData.techniques.map((technique) => [technique.id, technique]));
  const standingOf = (techniqueId: string): ThemeTechnique['standing'] => {
    if (matchedTechniqueIds.has(techniqueId)) return 'in_this_model';
    if (techniqueId in placements) return 'placed_elsewhere';
    return techniqueId in notPlaced ? 'around_device' : 'not_reviewed';
  };
  return referenceData.themes.map((theme): ThemeSummary => ({
    id: theme.id,
    label: theme.label,
    description: theme.description,
    catalogGap: theme.catalogGap,
    techniques: theme.techniqueIds.flatMap((techniqueId): ThemeTechnique[] => {
      const technique = techniqueById.get(techniqueId);
      return technique === undefined ? [] : [{ techniqueId, name: technique.name, evidenceStatus: technique.evidenceStatus, standing: standingOf(techniqueId) }];
    }),
  }));
}

export function buildThreatModelReport(inputs: ReportInputs): ThreatModelReport {
  const { model, engineData, referenceData, generatedAt } = inputs;
  const elementOutcomes = matchTechniques(model, engineData, referenceData.placementRules);
  const matches = collectMatches(elementOutcomes);
  const matchedTechniqueIds = new Set(matches.map((match) => match.techniqueId));

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
    themes: summariseThemes(engineData, referenceData, matchedTechniqueIds),
    catalogCoverage: summariseCatalogCoverage(engineData, referenceData),
    coverageGaps: listCoverageGaps(elementOutcomes),
    limitations: [...REPORT_LIMITATIONS],
  };
}
