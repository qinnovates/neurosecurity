/** Builds the index's device and tract sections. Both are present from the start, empty until their data exists. */

import { readStatedTargets, type AnatomyData } from './anatomy-inputs';
import type { IndexAsset, IndexDevices, IndexTracts } from './anatomy-index-types';
import type { AssetKind } from './manifest-types';
import { reviewOf } from './review-rows';
import { deviceRowKey, digestDeviceRow } from './row-digest';

export interface ReviewedDeviceRow {
  key: string;
  digest: string;
}

/** The ledger key and digest of every fiducial and lead row. */
export function listDeviceRows(data: AnatomyData): ReviewedDeviceRow[] {
  return [
    ...data.deviceGeometry.fiducials.map((fiducial) => ({ key: deviceRowKey('fiducial', fiducial.id), digest: digestDeviceRow(fiducial) })),
    ...data.deviceGeometry.leads.map((lead) => ({ key: deviceRowKey('lead', lead.id), digest: digestDeviceRow(lead) })),
  ];
}

export function buildDevices(data: AnatomyData): IndexDevices {
  const regionIds = new Set(data.engineData.regions.map((region) => region.id));
  return {
    fiducial_space: data.deviceGeometry.fiducial_space,
    fiducials: data.deviceGeometry.fiducials.map((fiducial) => ({
      ...fiducial,
      review_state: reviewOf(data, deviceRowKey('fiducial', fiducial.id), digestDeviceRow(fiducial)),
    })),
    leads: data.deviceGeometry.leads.map((lead) => {
      const reviewState = reviewOf(data, deviceRowKey('lead', lead.id), digestDeviceRow(lead));
      return {
        id: lead.id,
        name: lead.name,
        contacts: lead.contacts,
        contact_length_mm: lead.contact_length_mm,
        contact_spacing_mm: lead.contact_spacing_mm,
        spacing_measure: lead.spacing_measure,
        diameter_mm: lead.diameter_mm,
        drawable: reviewState.state === 'reviewed',
        review_state: reviewState,
      };
    }),
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
