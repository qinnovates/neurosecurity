import { describe, it, expect } from 'vitest';
import { HEADLINE_FIGURE_IDS, HEADLINE_LABELS, describePlacementDrafting, summariseHeadlineFigures } from '../headline-figures';
import { summariseCoverageBySeverity } from '../placement-coverage';
import { summariseScope } from '../scope-statement';
import { readDataFile } from './load-test-data';
import { PRESETS, PRESET_IDS, engineData, referenceData } from './preset-reports';

/**
 * The headline figures recomputed from the raw data files, with none of the engine's code:
 * no parser, no matcher, no register builder. If the engine and this arithmetic part ways,
 * one of them is wrong about what the files say.
 */
interface RawPart { id: string; kind: string; isNeuralInterface: boolean }
interface RawLink { id: string; medium: string; carriesNeuralData: boolean; carriesStimulationCommands: boolean; carriesSoftwareUpdates: boolean }
interface RawArchetype { id: string; direction: string; defaultRegionIds: string[]; presentsStimuli: boolean; components: RawPart[]; links: RawLink[] }
interface RawPlacement {
  onNeuralInterface: boolean; componentKinds: string[]; linkMedia: string[]; onLinksCarrying: string[];
  requiresDirection: string[] | null; requiresCorticalTarget: boolean; entryPath: string;
}
interface RawTechnique { id: string; severity: string }

const rawArchetypes = (readDataFile('threat-model/archetypes.json') as { archetypes: RawArchetype[] }).archetypes;
const rawPlacement = readDataFile('threat-model/technique-placement.json') as { placements: Record<string, RawPlacement>; notPlaced: Record<string, unknown> };
const rawTechniques = (readDataFile('qtara-registrar.json') as { techniques: RawTechnique[] }).techniques;
const rawRegions = (readDataFile('qif-brain-bci-atlas.json') as { brain_regions: { id: string; depth_class?: string }[] }).brain_regions;
const rawStride = readDataFile('threat-model/stride-map.json') as { strideByComponentKind: Record<string, string[]>; strideForLink: string[] };

const CARRIES_FIELD: Readonly<Record<string, keyof RawLink>> = { neuralData: 'carriesNeuralData', stimulationCommands: 'carriesStimulationCommands', softwareUpdates: 'carriesSoftwareUpdates' };

function meetsPreconditions(placement: RawPlacement, archetype: RawArchetype): boolean {
  const hasCorticalTarget = archetype.defaultRegionIds.some((regionId) => rawRegions.find((region) => region.id === regionId)?.depth_class === 'cortical');
  if (placement.requiresDirection !== null && !placement.requiresDirection.includes(archetype.direction)) return false;
  if (placement.entryPath === 'senses' && !archetype.presentsStimuli) return false;
  return !(placement.requiresCorticalTarget && !hasCorticalTarget);
}

/** How many parts and connections of the class the placement puts the technique on. */
function countPlacedElements(placement: RawPlacement, archetype: RawArchetype): number {
  const parts = archetype.components.filter((part) => (placement.onNeuralInterface && part.isNeuralInterface) || placement.componentKinds.includes(part.kind)).length;
  const links = archetype.links.filter((link) => placement.onLinksCarrying.some((payload) => link[CARRIES_FIELD[payload]] === true) || placement.linkMedia.includes(link.medium)).length;
  return parts + links;
}

function recompute(archetype: RawArchetype) {
  const severityById = new Map(rawTechniques.map((technique) => [technique.id, technique.severity]));
  const applying = Object.entries(rawPlacement.placements)
    .filter(([techniqueId]) => severityById.has(techniqueId))
    .map(([techniqueId, placement]) => ({ techniqueId, rows: meetsPreconditions(placement, archetype) ? countPlacedElements(placement, archetype) : 0 }))
    .filter((entry) => entry.rows > 0);
  const isSevere = (techniqueId: string): boolean => ['critical', 'high'].includes(severityById.get(techniqueId) ?? '');
  const sum = (entries: readonly { rows: number }[]): number => entries.reduce((total, entry) => total + entry.rows, 0);
  return {
    techniquesThatApply: applying.length,
    catalogRows: sum(applying),
    severeRows: sum(applying.filter((entry) => isSevere(entry.techniqueId))),
    baselineRows: archetype.components.reduce((total, part) => total + (rawStride.strideByComponentKind[part.kind]?.length ?? 0), 0) + archetype.links.length * rawStride.strideForLink.length,
    catalogTechniques: rawTechniques.length,
    notAssessed: rawTechniques.filter((technique) => !(technique.id in rawPlacement.placements) && !(technique.id in rawPlacement.notPlaced)).length,
  };
}

describe.each(PRESETS)('headline figures of the preset %s', (presetId, { model, report }) => {
  const archetype = rawArchetypes.find((candidate) => candidate.id === presetId);
  if (archetype === undefined) throw new Error(`test setup: ${presetId} is not in archetypes.json`);
  const raw = recompute(archetype);
  const figures = summariseHeadlineFigures(report);
  const byId = new Map(figures.map((figure) => [figure.id, figure]));

  it('are the four agreed tiles, in order, under the agreed labels', () => {
    expect(figures.map((figure) => figure.id)).toEqual([...HEADLINE_FIGURE_IDS]);
    expect(figures.map((figure) => figure.label)).toEqual(['Open rows', 'Critical and high still open', 'Techniques that apply', 'Catalog techniques not assessed']);
    for (const figure of figures) expect(figure.label).toBe(HEADLINE_LABELS[figure.id]);
  });

  it('equal the figures recomputed from the raw data files, with no decision recorded', () => {
    expect(raw.catalogRows).toBeGreaterThan(0);
    expect(byId.get('open-rows')).toMatchObject({ figure: raw.catalogRows, unit: `of ${raw.catalogRows}`, note: `${raw.baselineRows} of ${raw.baselineRows} baseline rows open`, isNotAssessed: false });
    expect(byId.get('severe-open')).toMatchObject({ figure: raw.severeRows, unit: `of ${raw.severeRows}`, isNotAssessed: false });
    expect(byId.get('techniques-that-apply')).toMatchObject({ figure: raw.techniquesThatApply, unit: `of ${raw.catalogTechniques}` });
    expect(byId.get('techniques-not-assessed')).toMatchObject({ figure: raw.notAssessed, unit: `of ${raw.catalogTechniques}` });
  });

  it('agree with the scope statement and the register the screens are drawn from', () => {
    const scope = summariseScope(model, engineData, referenceData);
    expect(byId.get('techniques-that-apply')?.figure).toBe(scope.applies.length);
    expect(byId.get('techniques-not-assessed')?.figure).toBe(scope.notAssessed.length);
    expect(report.riskRows.filter((row) => row.source === 'catalog')).toHaveLength(raw.catalogRows);
    expect(report.riskRows.filter((row) => row.source === 'stride')).toHaveLength(raw.baselineRows);
    expect(summariseHeadlineFigures(report, summariseCoverageBySeverity(engineData.techniques, scope))).toEqual(figures);
  });

  it('count a row as closed only once a decision is recorded on it', () => {
    const [first] = report.riskRows.filter((row) => row.source === 'catalog' && (row.catalogSeverity === 'critical' || row.catalogSeverity === 'high'));
    const decided = { ...report, riskRows: report.riskRows.map((row) => (row.riskId === first.riskId ? { ...row, status: 'mitigated' as const } : row)) };
    const after = new Map(summariseHeadlineFigures(decided).map((figure) => [figure.id, figure]));
    expect(after.get('open-rows')).toMatchObject({ figure: raw.catalogRows - 1, unit: `of ${raw.catalogRows}` });
    expect(after.get('severe-open')).toMatchObject({ figure: raw.severeRows - 1, unit: `of ${raw.severeRows}` });
  });
});

describe('a figure that is zero because nothing was assessed', () => {
  const [, { report }] = PRESETS[0];
  const empty = { ...report, riskRows: [] };

  it('is said in words and never printed as a bare zero', () => {
    const figures = summariseHeadlineFigures(empty);
    expect(report.catalogCoverage.notReviewedTechniques).toBeGreaterThan(0);
    expect(figures.filter((figure) => figure.isNotAssessed).map((figure) => figure.id)).toEqual(['open-rows', 'severe-open', 'techniques-that-apply']);
  });

  it('is a plain zero only when the whole catalog is assessed', () => {
    const assessed = { ...empty, catalogCoverage: { ...report.catalogCoverage, notReviewedTechniques: 0 } };
    expect(summariseHeadlineFigures(assessed).some((figure) => figure.isNotAssessed)).toBe(false);
  });
});

describe('the placement drafting sentence', () => {
  it('counts every decision in the placement file, placed or left outside, and reports no review the file does not record', () => {
    const placed = Object.keys(rawPlacement.placements).length;
    const outside = Object.keys(rawPlacement.notPlaced).length;
    expect(describePlacementDrafting(referenceData.placementTable))
      .toBe(`${placed + outside} placement decisions (${placed} placed, ${outside} reviewed, outside the device) drafted with an AI assistant; the placement file records no review yet.`);
  });

  it('prints a review count only when it is above zero', () => {
    expect(describePlacementDrafting({ placementCount: 3, notPlacedCount: 2, reviewedPlacementCount: 1 }))
      .toBe('5 placement decisions (3 placed, 2 reviewed, outside the device) drafted with an AI assistant; 1 reviewed.');
  });

  it('is checked on all three presets, which share one placement table', () => {
    expect(PRESET_IDS).toHaveLength(3);
  });
});
