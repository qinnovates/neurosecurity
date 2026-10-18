/**
 * Builds the index's source and layer entries. A layer whose sources may not
 * build is still listed: it is unavailable, and it says why in the words of the
 * clearance record. This is one generic rule, not a case per source.
 */

import type { AnatomyData } from './anatomy-inputs';
import type { IndexAsset, IndexLayer, IndexSource } from './anatomy-index-types';
import type { Buildability, UnbuildableReason } from './licence-rules';
import { LAYER_IDS, type AnatomySource, type LayerId, type LicenceVerdict } from './source-types';

const DEVICES_LAYER: LayerId = 'devices';
const NO_SOURCE_REASON = 'No source is registered for this layer.';
const NO_ASSET_REASON = 'No asset has been built for this layer yet.';
const NO_DEVICE_GEOMETRY_REASON = 'No device geometry has been recorded for this build.';

/** Used when a source is blocked by something other than its clearance record. */
const BLOCKER_SENTENCES: Readonly<Record<UnbuildableReason, string>> = {
  not_cleared: 'The source is not cleared.',
  verdict_not_ship: 'The licence verdict does not allow shipping.',
  grant_not_explicit: 'The licence grant rests on interpretation, not on the publisher\'s words.',
  license_not_commercial: 'The licence does not grant commercial use.',
  not_redistributable: 'The source may be used to compute but not be redistributed.',
  agreement_not_accepted: 'The source is behind an access agreement the owner has not accepted.',
  no_output_folder: 'Nothing under this licence is written into the served assets.',
  route_not_settled: 'How the source reaches the template space is not settled.',
};

interface JudgedSource {
  source: AnatomySource;
  verdict: LicenceVerdict;
  buildability: Buildability;
}

function listJudgedSources(data: AnatomyData): JudgedSource[] {
  return data.sources.sources.map((source) => ({
    source,
    verdict: data.verdictBySource.get(source.id) as LicenceVerdict,
    buildability: data.buildabilityBySource.get(source.id) as Buildability,
  }));
}

export function buildSources(data: AnatomyData): IndexSource[] {
  return listJudgedSources(data).map(({ source, verdict, buildability }) => ({
    id: source.id,
    name: source.name,
    license_id: data.effectiveLicenceBySource.get(source.id) ?? source.license_id,
    stated_license_id: source.license_id,
    verdict: verdict.verdict,
    grant: verdict.grant,
    route_kind: source.route.kind,
    route_status: source.route.status,
    buildable: buildability.buildable,
    pipeline_only: !source.redistribute,
    blockers: buildability.blockers,
    clearance_reason: verdict.clearance.reason,
    human_confirmed: verdict.human_confirmed,
  }));
}

/** Why a source may not build: its clearance record's own reason when it is uncleared, else the first blocker in plain words. */
function describeBlocker({ verdict, buildability }: JudgedSource): string {
  return buildability.blockers.includes('not_cleared') ? verdict.clearance.reason : BLOCKER_SENTENCES[buildability.blockers[0]];
}

function describeUnavailableLayer(sources: readonly JudgedSource[]): string {
  if (sources.length === 0) return NO_SOURCE_REASON;
  if (sources.some((judged) => judged.buildability.buildable)) return NO_ASSET_REASON;
  return [...new Set(sources.map(describeBlocker))].join(' ');
}

function buildLayer(layerId: LayerId, sources: readonly JudgedSource[], assets: readonly IndexAsset[], hasDeviceGeometry: boolean): IndexLayer {
  const layerSources = sources.filter((judged) => judged.source.layers.includes(layerId));
  const assetIds = assets.filter((asset) => asset.layer === layerId).map((asset) => asset.id);
  const entry = { id: layerId, source_ids: layerSources.map((judged) => judged.source.id), asset_ids: assetIds };
  if (layerId === DEVICES_LAYER) return { ...entry, available: hasDeviceGeometry, reason: hasDeviceGeometry ? null : NO_DEVICE_GEOMETRY_REASON };
  if (assetIds.length > 0) return { ...entry, available: true, reason: null };
  return { ...entry, available: false, reason: describeUnavailableLayer(layerSources) };
}

/** Every layer, always, in a fixed order. An unavailable layer carries the reason shown beside its disabled control. */
export function buildLayers(data: AnatomyData, assets: readonly IndexAsset[]): IndexLayer[] {
  const sources = listJudgedSources(data);
  const hasDeviceGeometry = data.deviceGeometry.fiducials.length > 0 || data.deviceGeometry.leads.length > 0;
  return LAYER_IDS.map((layerId) => buildLayer(layerId, sources, assets, hasDeviceGeometry));
}
