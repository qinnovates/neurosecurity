/**
 * What the atlas holds for one region, counted by the route it arrives
 * through, with what each count is out of beside it.
 *
 * The pane leads with this because the atlas is mostly empty: most regions
 * hold no drafted technique link at all. A severity shown before its coverage
 * reads as a finding about the region rather than as the one entry somebody
 * drafted, so every count here carries its denominator and names its join. A
 * route that holds nothing keeps its row and says which route was tried:
 * nothing linked is not nothing there.
 *
 * A band is not a route. A band holds up to every region in the atlas, so
 * anything reached through one describes the bucket and not the region.
 * Band-tagged techniques are counted apart, as context, and are never added
 * into a region's totals.
 */

import { listLitLinks, type ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { buildRegionDsm } from '@/lib/atlas-explorer/region-dsm';
import type { RegionDetail } from '@/lib/atlas-explorer/region-detail';
import { NISS_STEPS } from '@/lib/anatomy/colour-modes';

/** The joins that reach a region from a record of its own. The band is deliberately absent. */
export const COVERAGE_ROUTES = ['technique', 'pathway', 'device'] as const;
export type CoverageRouteId = typeof COVERAGE_ROUTES[number];

export interface CoverageCount {
  route: CoverageRouteId;
  /** What is counted, in the plural. */
  label: string;
  /** How the count reaches this region: the join, not the result. */
  via: string;
  held: number;
  /** What the count is out of, with the total named: "of 178 techniques in the catalog". */
  outOf: string;
  /** The most any one region of the atlas holds on this route, which is the scale the bars are drawn against. */
  bestInAtlas: number;
}

/** How much of this region's NISS reading is actually scored. Never a step for a region with no link. */
export interface NissCoverage {
  links: number;
  /** Those links whose registrar record carries a NISS severity word. */
  withSeverity: number;
  worstStep: string | null;
}

export interface DsmCoverage {
  viaTechniques: number;
  viaPathways: number;
  /** The pathways that carry a reference here, by name, so the row can state the join. */
  pathwayNames: string[];
}

export interface RegionCoverage {
  counts: CoverageCount[];
  /** No route reaches this region. The atlas's most common state. */
  holdsNothing: boolean;
  niss: NissCoverage;
  dsm: DsmCoverage;
  /** Techniques tagged with the region's band whose text names no structure. Context, counted in no route. */
  bandContext: { bandId: string | null; techniques: number };
}

/** The whole atlas's coverage, counted over every region, for the pane before a region is chosen and for the bars' scale. */
export interface AtlasCoverage {
  regions: number;
  withTechniqueLink: number;
  /** Regions at least one of whose linked techniques carries a NISS severity word: the regions the NISS lens can colour. */
  withNissSeverity: number;
  withoutTechniqueLink: number;
  /** Regions holding a link a person has reviewed. */
  withReviewedLink: number;
  /** The regions that hold at least one drafted technique link, in the index's order. */
  linkedRegions: Array<{ id: string; name: string }>;
  /** The most any one region holds, per route. */
  best: Readonly<Record<CoverageRouteId, number>>;
}

function countDevices(model: ExplorerModel, regionId: string): number {
  return model.index.devices.stated_targets.filter((device) => device.region_ids.includes(regionId)).length;
}

function countRoute(model: ExplorerModel, regionId: string, route: CoverageRouteId): number {
  switch (route) {
    case 'technique': return listLitLinks(model, regionId).length;
    case 'pathway': return model.pathwaysByRegion.get(regionId)?.length ?? 0;
    case 'device': return countDevices(model, regionId);
  }
}

export function buildAtlasCoverage(model: ExplorerModel): AtlasCoverage {
  const withLinks = model.regions.filter((region) => listLitLinks(model, region.id).length > 0);
  const best = Object.fromEntries(COVERAGE_ROUTES.map((route) => (
    [route, model.regions.reduce((most, region) => Math.max(most, countRoute(model, region.id, route)), 0)]
  ))) as Record<CoverageRouteId, number>;
  return {
    regions: model.regions.length,
    withTechniqueLink: withLinks.length,
    withNissSeverity: withLinks.filter((region) => listLitLinks(model, region.id).some((regionLink) => regionLink.technique.niss_severity !== null)).length,
    withoutTechniqueLink: model.regions.length - withLinks.length,
    withReviewedLink: withLinks.filter((region) => listLitLinks(model, region.id).some((regionLink) => regionLink.link.review_state.state === 'reviewed')).length,
    linkedRegions: withLinks.map((region) => ({ id: region.id, name: region.name })),
    best,
  };
}

function worstStep(severities: readonly string[]): string | null {
  const rank = (severity: string): number => (NISS_STEPS as readonly string[]).indexOf(severity);
  return [...severities].sort((first, second) => rank(second) - rank(first))[0] ?? null;
}

export function buildRegionCoverage(model: ExplorerModel, detail: RegionDetail, atlas: AtlasCoverage): RegionCoverage {
  const regionId = detail.region.id;
  const dsm = buildRegionDsm(model, regionId);
  const severities = detail.linked.flatMap((technique) => technique.nissSeverity ?? []);
  const counts: CoverageCount[] = [
    {
      route: 'technique', label: 'attack techniques linked to this region', via: 'a drafted link from the technique’s own catalog text',
      held: detail.linked.length, outOf: `of ${model.catalogTechniqueIds.size} techniques in the catalog`, bestInAtlas: atlas.best.technique,
    },
    {
      route: 'pathway', label: 'pathways that list this region as a start or an end', via: 'QIF’s pathway file',
      held: dsm.pathwayNames.length, outOf: `of ${model.catalog.pathways.length} pathways in the file`, bestInAtlas: atlas.best.pathway,
    },
    {
      route: 'device', label: 'devices whose QIF record lists this region', via: 'the device records in QIF’s atlas file',
      held: countDevices(model, regionId), outOf: `of ${model.index.devices.stated_targets.length} device records`, bestInAtlas: atlas.best.device,
    },
  ];
  return {
    counts,
    holdsNothing: counts.every((count) => count.held === 0) && dsm.viaTechniques.length === 0 && dsm.viaPathways.length === 0,
    niss: { links: detail.linked.length, withSeverity: severities.length, worstStep: worstStep(severities) },
    dsm: { viaTechniques: dsm.viaTechniques.length, viaPathways: dsm.viaPathways.length, pathwayNames: dsm.pathwayNames },
    bandContext: { bandId: detail.region.band_ids[0] ?? null, techniques: detail.bandLevel.length },
  };
}

/** The coverage of one region in a sentence, for the live region that reports a selection. */
export function describeCoverage(coverage: RegionCoverage): string {
  const counts = coverage.counts.map((count) => `${count.held} ${count.label}`).join(', ');
  const niss = `${coverage.niss.withSeverity} of ${coverage.niss.links} ${coverage.niss.links === 1 ? 'link carries' : 'links carry'} a NISS severity`;
  const dsm = `${coverage.dsm.viaTechniques + coverage.dsm.viaPathways} DSM-5-TR category references`;
  return `This region holds ${counts}. ${niss}. ${dsm}.`;
}
