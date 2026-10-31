import { describe, expect, it } from 'vitest';
import atlas from '@shared/qif-brain-bci-atlas.json';
import landscape from '@shared/bci-landscape.json';
import { AnatomyDataError } from '@/lib/anatomy/errors';
import { buildDossierDevices, humaniseDeviceId, matchLandscapeDevice } from '../build-dossier-devices';

const COMPANY = { name: 'Fixture Neuro', type: 'invasive', status: 'active' };
const devices = buildDossierDevices(atlas, landscape);
const listedNames = devices.filter((device) => device.has_listed_name);
/** Moves only when a record or the landscape file changes. A rise means a new match to read; a fall, a name lost. */
const PINNED_MATCHES = {
  records: 24,
  listedNames: ['blackrock-utah-array', 'boston-scientific-vercise', 'braingate', 'emotiv-epoc-x', 'emotiv-insight', 'kernel-flow', 'muse-2', 'muse-s', 'neuralink-n1', 'neuropace-rns', 'openbci-cyton', 'openbci-ganglion', 'paradromics-connexus', 'precision-layer7', 'synchron-stentrode'],
  noCompany: ['cochlear-nucleus-profile-plus', 'corticom', 'darpa-n3', 'medel-cochlear'],
};

describe('buildDossierDevices', () => {
  it('names a device from the landscape file only where the rule matches one, and pins which', () => {
    expect(devices).toHaveLength(PINNED_MATCHES.records);
    expect(listedNames.map((device) => device.id).sort()).toEqual(PINNED_MATCHES.listedNames);
    expect(devices.filter((device) => device.company === null).map((device) => device.id).sort()).toEqual(PINNED_MATCHES.noCompany);
  });

  it('shows every listed name exactly as the landscape file writes it', () => {
    const { companies } = landscape as { companies: Array<{ devices?: Array<{ name: string }> }> };
    const landscapeNames = new Set(companies.flatMap((company) => (company.devices ?? []).map((device) => device.name)));
    expect(listedNames.filter((device) => !landscapeNames.has(device.name))).toEqual([]);
  });

  it('never shows a slug, and an unmatched device says only what its id says', () => {
    expect(devices.filter((device) => device.name === device.id)).toEqual([]);
    expect(devices.find((device) => device.id === 'medtronic-percept-pc')).toMatchObject({ name: 'Medtronic Percept PC', has_listed_name: false, company: { name: 'Medtronic DBS' } });
    expect(devices.find((device) => device.id === 'abbott-infinity-dbs')).toMatchObject({ name: 'Abbott Infinity DBS', has_listed_name: false, company: { name: 'Abbott Neuromodulation' } });
  });

  it('keeps the atlas file\'s fourth relation apart: a device in a vessel beside a region is not implanted in it', () => {
    expect(devices.find((device) => device.id === 'synchron-stentrode')?.relation).toBe('endovascular_adjacent_to');
  });

  it('refuses a record whose relation is not a known word', () => {
    const broken = { device_region_mappings: [{ device_id: 'x', target_regions: [], region_relation: 'nearby', interface_type: 'read' }] };
    expect(() => buildDossierDevices(broken, landscape)).toThrow(AnatomyDataError);
  });
});

describe('matchLandscapeDevice', () => {
  it('chooses nothing between two candidates', () => {
    const twoCompanies = [{ ...COMPANY, deviceNames: ['One'] }, { ...COMPANY, name: 'Fixture Labs', deviceNames: ['One'] }];
    expect(matchLandscapeDevice('fixture-one', twoCompanies)).toEqual({ company: null, deviceName: null });
    const twoDevices = [{ ...COMPANY, deviceNames: ['Probe A', 'Probe B'] }];
    expect(matchLandscapeDevice('fixture-probe', twoDevices)).toEqual({ company: COMPANY, deviceName: null });
  });

  it('matches a short slug word only as a whole word', () => {
    const company = { ...COMPANY, deviceNames: ['Muse 2', 'Muse S'] };
    expect(matchLandscapeDevice('fixture-s', [company]).deviceName).toBe('Muse S');
    expect(matchLandscapeDevice('fixture-2', [company]).deviceName).toBe('Muse 2');
  });
});

describe('humaniseDeviceId', () => {
  it('reads an abbreviation as one and adds nothing', () => {
    expect(humaniseDeviceId('cochlear-nucleus-profile-plus')).toBe('Cochlear Nucleus Profile Plus');
    expect(humaniseDeviceId('neuralink-n2')).toBe('Neuralink N2');
  });
});
