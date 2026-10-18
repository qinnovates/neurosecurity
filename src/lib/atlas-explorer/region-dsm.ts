/**
 * The DSM-5-TR category references that reach one region, and the way each
 * arrives: filed with a technique an AI has linked to the region, or filed
 * with a pathway whose record lists the region. A reference is never tied to
 * the region itself, so every entry names what carries it.
 *
 * They are diagnostic category references used for threat modelling, not
 * diagnostic claims.
 */

import type { IndexReviewState } from '@/lib/anatomy/anatomy-index-types';
import { listLitLinks, weakestReviewState, type ExplorerModel } from './explorer-model';

/** One reference with what carries it to the region: technique ids, or pathway names. */
export interface RegionDsmReference {
  code: string;
  /** The name as the datalake file writes it. One code can be filed under more than one wording. */
  name: string;
  carriers: string[];
}

export interface RegionDsm {
  /** Filed by the registrar with techniques whose link to the region counts. */
  viaTechniques: RegionDsmReference[];
  /** The review state of the links those references arrive through. Null when none arrives this way. */
  linkReviewState: IndexReviewState | null;
  /** The pathways whose record lists the region, by name, in file order. */
  pathwayNames: string[];
  /** Filed by the pathway file with those pathways. */
  viaPathways: RegionDsmReference[];
}

interface Carried {
  code: string;
  name: string;
  carrier: string;
}

/** One entry per code and wording, in code order, each with every carrier once. */
function groupReferences(carried: readonly Carried[]): RegionDsmReference[] {
  const byKey = new Map<string, RegionDsmReference>();
  for (const { code, name, carrier } of carried) {
    const key = `${code} ${name}`;
    const entry = byKey.get(key) ?? { code, name, carriers: [] };
    if (!entry.carriers.includes(carrier)) entry.carriers.push(carrier);
    byKey.set(key, entry);
  }
  return [...byKey.values()].sort((first, second) => first.code.localeCompare(second.code) || first.name.localeCompare(second.name));
}

export function buildRegionDsm(model: ExplorerModel, regionId: string): RegionDsm {
  const litLinks = listLitLinks(model, regionId);
  const viaTechniques = groupReferences(litLinks.flatMap(({ technique }) =>
    (model.dsmByTechnique.get(technique.id) ?? []).map((reference) => ({ code: reference.code, name: reference.name, carrier: technique.id }))));
  const pathways = model.pathwaysByRegion.get(regionId) ?? [];
  return {
    viaTechniques,
    linkReviewState: viaTechniques.length === 0 ? null : weakestReviewState(litLinks.map((regionLink) => regionLink.link.review_state)),
    pathwayNames: pathways.map((pathway) => pathway.name),
    viaPathways: groupReferences(pathways.flatMap((pathway) => pathway.dsm_references.map((reference) => ({ ...reference, carrier: pathway.name })))),
  };
}
