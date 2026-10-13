/** Builds the index's device and tract sections. Both are present from the start, empty until their data exists. */

import { readStatedTargets, type AnatomyData } from './anatomy-inputs';
import type { IndexAsset, IndexDevices, IndexTracts } from './anatomy-index-types';
import { AnatomyDataError } from './errors';
import type { AssetKind } from './manifest-types';
import { DEVICE_GEOMETRY_FILE } from './parse-device-geometry';
import { reviewOf } from './review-rows';
import { deviceRowKey, digestDeviceRow } from './row-digest';

export interface ReviewedDeviceRow {
  key: string;
  digest: string;
}

/** The ledger key and digest of every fiducial, electrode layout and lead row. */
export function listDeviceRows(data: AnatomyData): ReviewedDeviceRow[] {
  return [
    ...data.deviceGeometry.fiducials.map((fiducial) => ({ key: deviceRowKey('fiducial', fiducial.id), digest: digestDeviceRow(fiducial) })),
    ...data.deviceGeometry.electrode_layouts.map((layout) => ({ key: deviceRowKey('electrode_layout', layout.id), digest: digestDeviceRow(layout) })),
    ...data.deviceGeometry.leads.map((lead) => ({ key: deviceRowKey('lead', lead.id), digest: digestDeviceRow(lead) })),
  ];
}

const REVIEWED = 'reviewed';
const DEVICES_LAYER = 'devices';

/** An electrode layout sits on a head surface. The build stops when that asset is not one the manifest ships on the devices layer. */
function requireScalpAsset(data: AnatomyData, assetId: string, where: string): void {
  const asset = data.manifest?.assets.find((candidate) => candidate.id === assetId);
  if (asset === undefined || asset.layer !== DEVICES_LAYER) {
    throw new AnatomyDataError(DEVICE_GEOMETRY_FILE, where, `"${assetId}" is not a head surface asset in the manifest`,
      'Build the head surface first, or name the asset on the devices layer that the positions were placed on.');
  }
}

function buildFiducials(data: AnatomyData): IndexDevices['fiducials'] {
  return data.deviceGeometry.fiducials.map((fiducial) => ({
    id: fiducial.id,
    position_mm: fiducial.position_mm,
    review_state: reviewOf(data, deviceRowKey('fiducial', fiducial.id), digestDeviceRow(fiducial)),
  }));
}

function buildLayouts(data: AnatomyData, areFiducialsReviewed: boolean): IndexDevices['electrode_layouts'] {
  return data.deviceGeometry.electrode_layouts.map((layout, index) => {
    requireScalpAsset(data, layout.scalp_asset_id, `electrode_layouts[${index}].scalp_asset_id`);
    const reviewState = reviewOf(data, deviceRowKey('electrode_layout', layout.id), digestDeviceRow(layout));
    return {
      id: layout.id,
      name: layout.name,
      scalp_asset_id: layout.scalp_asset_id,
      construction: layout.construction,
      shown_by_default: layout.shown_by_default,
      electrodes: layout.electrodes.map((electrode) => ({ id: electrode.id, position_mm: electrode.position_mm, also_called: electrode.also_called ?? null })),
      drawable: areFiducialsReviewed && reviewState.state === REVIEWED,
      review_state: reviewState,
    };
  });
}

function buildLeads(data: AnatomyData): IndexDevices['leads'] {
  return data.deviceGeometry.leads.map((lead) => {
    const reviewState = reviewOf(data, deviceRowKey('lead', lead.id), digestDeviceRow(lead));
    return {
      id: lead.id,
      name: lead.name,
      contacts: lead.contacts,
      contact_length_mm: lead.contact_length_mm,
      contact_spacing_mm: lead.contact_spacing_mm,
      spacing_measure: lead.spacing_measure,
      diameter_mm: lead.diameter_mm,
      drawable: reviewState.state === REVIEWED,
      review_state: reviewState,
    };
  });
}

export function buildDevices(data: AnatomyData): IndexDevices {
  const regionIds = new Set(data.engineData.regions.map((region) => region.id));
  const fiducials = buildFiducials(data);
  return {
    fiducial_space: data.deviceGeometry.fiducial_space,
    fiducial_method: data.deviceGeometry.fiducial_set?.method ?? null,
    fiducials,
    electrode_layouts: buildLayouts(data, fiducials.length > 0 && fiducials.every((fiducial) => fiducial.review_state.state === REVIEWED)),
    leads: buildLeads(data),
    facts: data.deviceGeometry.facts.map((fact) => ({ id: fact.id, statement: fact.statement, citation: fact.citation, url: fact.url, read_depth: fact.read_depth })),
    stated_targets: readStatedTargets(data.atlas, regionIds),
  };
}

export function buildTracts(assets: readonly IndexAsset[]): IndexTracts {
  const idsOfKind = (kind: AssetKind): string[] => assets.filter((asset) => asset.kind === kind).map((asset) => asset.id);
  return {
    index_asset_id: idsOfKind('tract_index')[0] ?? null,
    proximity_asset_id: idsOfKind('tract_proximity')[0] ?? null,
    group_asset_ids: idsOfKind('tracts'),
  };
}
