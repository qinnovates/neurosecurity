/**
 * Builds the index's technique entries. What a stored term resolves to, whether
 * it agrees with the technique's band tags and whether it may light a region
 * are all computed here, at build time, and never stored in the data file.
 */

import { isValidForAddressing } from './addressing-version';
import { readTechniqueTags, type AnatomyData } from './anatomy-inputs';
import type { IndexTechnique, IndexTechniqueLink } from './anatomy-index-types';
import type { TechniqueLink } from './anatomy-types';
import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import { createTermResolver, lightsRegion, type TermResolution } from './resolve-region-term';
import { checkEvidence, reviewOf, type CheckedEvidence } from './review-rows';
import { digestTechniqueLink, techniqueLinkKey } from './row-digest';
import { SOURCE_REF_STATES } from './source-ref';

const NEURAL_BAND_PREFIX = 'N';

/** A technique link with everything the build derived for it. */
export interface ReviewedLink extends CheckedEvidence {
  technique_id: string;
  link: TechniqueLink;
  key: string;
  digest: string;
  resolution: TermResolution;
  entry: IndexTechniqueLink;
}

interface LinkContext {
  data: AnatomyData;
  resolveTerm: (term: string) => TermResolution;
  bandsByRegion: ReadonlyMap<string, string>;
}

function reviewLink(technique: CatalogTechnique, link: TechniqueLink, context: LinkContext): ReviewedLink {
  const resolution = context.resolveTerm(link.term);
  const key = techniqueLinkKey(technique.id, link.term);
  const digest = digestTechniqueLink(technique.id, link, resolution);
  const checked = checkEvidence(link.evidence, context.data);
  const regionBand = resolution.resolved_region_id === null ? undefined : context.bandsByRegion.get(resolution.resolved_region_id);
  const bandAgrees = regionBand !== undefined && technique.bandIds.includes(regionBand);
  const isCurrent = isValidForAddressing(link, context.data.addressingVersion);
  const entry: IndexTechniqueLink = {
    term: link.term,
    ...resolution,
    band_agrees: bandAgrees,
    valid_for_current_addressing: isCurrent,
    quote_state: checked.quote_state,
    lit: lightsRegion(resolution.resolution) && bandAgrees && isCurrent && checked.quote_state === SOURCE_REF_STATES.QUOTE_FOUND,
    claim_basis: link.evidence.claim_basis,
    review_state: reviewOf(context.data, key, digest),
    check_status: checked.check_status,
  };
  return { technique_id: technique.id, link, key, digest, resolution, entry, ...checked };
}

/** Every drafted link of every technique, in file order, with its derived state. */
export function reviewTechniqueLinks(data: AnatomyData): ReviewedLink[] {
  const context: LinkContext = {
    data,
    resolveTerm: createTermResolver(data.atlas),
    bandsByRegion: new Map(data.engineData.regions.map((region) => [region.id, region.bandId])),
  };
  return data.engineData.techniques.flatMap((technique) =>
    (data.techniqueRegions.techniques[technique.id]?.links ?? []).map((link) => reviewLink(technique, link, context)));
}

/** One entry per registrar technique with a neural band. A technique with no drafted entry is listed and lights nothing. */
export function buildTechniques(data: AnatomyData, links: readonly ReviewedLink[], registrar: unknown): IndexTechnique[] {
  return data.engineData.techniques
    .filter((technique) => technique.bandIds.some((bandId) => bandId.startsWith(NEURAL_BAND_PREFIX)))
    .map((technique) => ({
      id: technique.id,
      name: technique.name,
      band_ids: technique.bandIds,
      severity: technique.severity,
      ...readTechniqueTags(registrar, technique.id),
      scope: data.techniqueRegions.techniques[technique.id]?.scope ?? 'not_drafted',
      links: links.filter((reviewed) => reviewed.technique_id === technique.id).map((reviewed) => reviewed.entry),
    }));
}
