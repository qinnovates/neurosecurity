/**
 * What the /atlas/ device tile counts, and the note in the atlas that says so.
 * The tile states devices mapped to regions, so it reads the mappings; a change
 * to the hardware inventory alone must not move it.
 */

import { describe, expect, it } from 'vitest';
import atlas from '@shared/qif-brain-bci-atlas.json';
import landscape from '@shared/bci-landscape.json';
import hardwareInventory from '../../site/bci-hardware-inventory.json';
import { getAtlasData } from '@/lib/atlas-data';

const mappedDeviceIds = atlas.device_region_mappings.map((mapping) => mapping.device_id);

describe('the device population the atlas states', () => {
  it('counts each mapped device once on the tile', () => {
    expect(getAtlasData().mappedDeviceCount).toBe(new Set(mappedDeviceIds).size);
    expect(new Set(mappedDeviceIds).size).toBe(mappedDeviceIds.length);
  });

  it('points at a hardware inventory that specifies exactly the mapped ids', () => {
    expect(atlas.bci_devices).toContain('src/site/bci-hardware-inventory.json');
    expect(hardwareInventory.devices.map((device) => device.id).sort()).toEqual([...mappedDeviceIds].sort());
  });

  it('says in its notes that the landscape holds the wider list, with no region mappings', () => {
    expect(atlas._metadata.notes.join(' ')).toContain('bci-landscape.json companies[].devices');
    const devices = (landscape.companies as unknown as { devices?: Record<string, unknown>[] }[]).flatMap((company) => company.devices ?? []);
    expect(devices.length).toBeGreaterThan(mappedDeviceIds.length);
    expect(devices.filter((device) => Object.keys(device).some((key) => key.includes('region')))).toEqual([]);
  });
});
