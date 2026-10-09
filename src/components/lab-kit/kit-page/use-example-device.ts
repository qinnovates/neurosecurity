import { useMemo } from 'react';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import type { EngineData } from '@/lib/threat-model/catalog-types';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import { EMPTY_LENS, countOpenRisks } from '@/lib/threat-model/lens';
import { summarisePlacementCoverage, type PlacementCoverage } from '@/lib/threat-model/placement-coverage';
import type { ReferenceData } from '@/lib/threat-model/reference-data-types';
import { THREAT_GOALS, type ThreatGoal } from '@/lib/threat-model/report-types';

/** The example device carries no moment in time, so its report has no timestamp. */
const NO_TIMESTAMP = '';

export interface GoalFigure {
  goal: ThreatGoal;
  openRisks: number;
  /** True when the zero only means the goal's techniques have not all been placed. */
  isNotAssessed: boolean;
}

export interface ExampleDevice {
  label: string;
  riskRowCount: number;
  goals: readonly GoalFigure[];
  catalogCoverage: PlacementCoverage;
  deviceCoverage: PlacementCoverage;
}

/** The first device class in the reference data, modelled with its default answers, so the kit shows the engine's own figures. */
export function useExampleDevice(engineData: EngineData, referenceData: ReferenceData): ExampleDevice {
  return useMemo(() => {
    const [archetype] = referenceData.archetypes;
    const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, engineData.registrarVersion);
    const report = buildThreatModelReport({ model, engineData, referenceData, generatedAt: NO_TIMESTAMP });
    const techniqueIdsOnDevice = new Set(report.riskRows.flatMap((row) => (row.source === 'catalog' && row.techniqueId !== null ? [row.techniqueId] : [])));
    const openCounts = countOpenRisks(report.riskRows, EMPTY_LENS);
    const goals = THREAT_GOALS.map((goal) => {
      const coverage = report.goalCoverage[goal];
      const openRisks = openCounts.byGoal[goal];
      return { goal, openRisks, isNotAssessed: openRisks === 0 && coverage.placedTechniques < coverage.catalogTechniques };
    });
    return {
      label: archetype.label,
      riskRowCount: report.riskRows.length,
      goals,
      catalogCoverage: summarisePlacementCoverage(engineData.techniques, referenceData.placementRules),
      deviceCoverage: summarisePlacementCoverage(engineData.techniques, referenceData.placementRules, techniqueIdsOnDevice),
    };
  }, [engineData, referenceData]);
}
