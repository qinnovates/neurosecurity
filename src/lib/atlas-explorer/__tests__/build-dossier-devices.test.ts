import { describe, expect, it } from 'vitest';
import atlas from '@shared/qif-brain-bci-atlas.json';
import landscape from '@shared/bci-landscape.json';
import { AnatomyDataError } from '@/lib/anatomy/errors';
import hardware from '../../../site/bci-hardware-inventory.json';
import { buildDossierDevices, matchLandscapeCompany } from '../build-dossier-devices';

const COMPANY = { name: 'Fixture Neuro', type: 'invasive', status: 'active' };
const RECORD = { device_id: 'x', target_regions: [], region_relation: 'implanted_in', interface_type: 'read' };
const devices = buildDossierDevices(atlas, landscape, hardware);
/** Moves only when a record or the landscape file changes. */
const PINNED_MATCHES = {
  records: 24,
  noCompany: ['cochlear-nucleus-profile-plus', 'corticom', 'darpa-n3', 'medel-cochlear'],
};

describe('buildDossierDevices', () => {
  it('holds one record per device of the atlas file, and pins the records no company matches', () => {
    expect(devices).toHaveLength(PINNED_MATCHES.records);
    expect(devices.filter((device) => device.company === null).map((device) => device.id).sort()).toEqual(PINNED_MATCHES.noCompany);
  });

  it('shows every name exactly as the hardware inventory writes it', () => {
    const namesById = new Map(hardware.devices.map((device) => [device.id, device.device_name]));
    expect(devices.map((device) => device.name)).toEqual(devices.map((device) => namesById.get(device.id)));
    expect(devices.find((device) => device.id === 'neuralink-n1')?.name).toBe('N1 Implant (Link)');
  });

  it('keeps the company from the landscape file beside the inventory\'s name', () => {
    expect(devices.find((device) => device.id === 'medtronic-percept-pc')).toMatchObject({ name: 'Percept PC Neurostimulator', company: { name: 'Medtronic DBS' } });
    expect(devices.find((device) => device.id === 'abbott-infinity-dbs')).toMatchObject({ name: 'St. Jude Medical Infinity DBS System', company: { name: 'Abbott Neuromodulation' } });
  });

  it('keeps the atlas file\'s fourth relation apart: a device in a vessel beside a region is not implanted in it', () => {
    expect(devices.find((device) => device.id === 'synchron-stentrode')?.relation).toBe('endovascular_adjacent_to');
  });

  it('refuses a record whose relation is not a known word', () => {
    const broken = { device_region_mappings: [{ ...RECORD, region_relation: 'nearby' }] };
    expect(() => buildDossierDevices(broken, landscape, { devices: [{ id: 'x', device_name: 'X' }] })).toThrow(AnatomyDataError);
  });

  it('refuses a record the hardware inventory does not hold, so no device is shown under a made-up name', () => {
    expect(() => buildDossierDevices({ device_region_mappings: [RECORD] }, landscape, hardware)).toThrow(/bci-hardware-inventory\.json.*x/s);
  });
});

describe('matchLandscapeCompany', () => {
  it('chooses nothing between two candidates', () => {
    expect(matchLandscapeCompany('fixture-one', [COMPANY, { ...COMPANY, name: 'Fixture Labs' }])).toBeNull();
  });

  it('matches on the slug\'s first word as a whole word of the company\'s name', () => {
    expect(matchLandscapeCompany('fixture-probe', [COMPANY])).toEqual(COMPANY);
    expect(matchLandscapeCompany('fix-probe', [COMPANY])).toBeNull();
  });
});
