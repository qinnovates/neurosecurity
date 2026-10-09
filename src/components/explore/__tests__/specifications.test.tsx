// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { getKqlTables } from '@/lib/kql-tables';
import { ALLOWED_SITE_TABLES, applyLabTablePolicy } from '@/lib/threat-model/lab-table-policy';
import DeviceSpecifications, { SPECIFICATIONS_STATEMENT } from '../DeviceSpecifications';
import {
  DEVICES_TABLE, NOT_RECORDED, SPEC_COLUMNS, countDeviceTypes, deviceTypeLabel, filterSpecRows, readSpecText, specSortValue, type SpecRow,
} from '../specifications/spec-rows';
import { createMemoryStore, engineData, inLab } from './lab-harness';

/** The site database built from the data files, cut down by the Lab's own allow-list, as the page receives it. */
const siteTables = applyLabTablePolicy(getKqlTables());
const devices = siteTables[DEVICES_TABLE];

vi.mock('@/components/query/use-site-database', () => ({ useSiteDatabase: () => ({ tables: siteTables, error: null }) }));

afterEach(cleanup);

const noop = (): void => undefined;

function bodyRows(): HTMLElement[] {
  return screen.getAllByRole('row').slice(1);
}

function search(text: string): void {
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search every column' }), { target: { value: text } });
}

describe('specification rows', () => {
  it('reads only columns the Lab allows from the devices table, and none that scores or counts', () => {
    const keys = SPEC_COLUMNS.map((column) => column.key);
    expect(keys.every((key) => ALLOWED_SITE_TABLES[DEVICES_TABLE].includes(key))).toBe(true);
    expect(keys.filter((key) => /cve|score|posture|count|risk|technique|niss/i.test(key))).toEqual([]);
  });

  it('merges the spellings of a device type for display, leaving the data as it is', () => {
    expect(deviceTypeLabel('non_invasive')).toBe(deviceTypeLabel('non-invasive'));
    const rawSpellings = new Set(devices.map((row) => String(row.type)));
    const types = countDeviceTypes(devices);
    expect(new Set(types.map((type) => type.label)).size).toBe(types.length);
    expect(types.length).toBeLessThanOrEqual(rawSpellings.size);
    expect(types.reduce((sum, type) => sum + type.count, 0)).toBe(devices.length);
    expect(new Set(devices.map((row) => String(row.type)))).toEqual(rawSpellings);
  });

  it('says "Not recorded" for a channel count of 0 and for an empty field', () => {
    expect(readSpecText({ channels: 0 }, 'channels')).toBe(NOT_RECORDED);
    expect(readSpecText({ channels: 1024 }, 'channels')).toBe('1,024');
    expect(readSpecText({ first_human: '' }, 'first_human')).toBe(NOT_RECORDED);
    expect(specSortValue({ channels: 0 }, 'channels')).toBe(0);
  });

  it('prints the regulatory status exactly as recorded', () => {
    for (const row of devices) expect(readSpecText(row, 'fda_status')).toBe(String(row.fda_status));
  });

  it('searches every shown column', () => {
    for (const column of SPEC_COLUMNS) {
      const sample = devices.map((row) => readSpecText(row, column.key)).find((text) => text !== NOT_RECORDED);
      expect(sample, column.key).toBeDefined();
      expect(filterSpecRows(devices, [], sample ?? '').length, column.key).toBeGreaterThan(0);
    }
  });
});

describe('Published device specifications', () => {
  it('states the rule for named products and leads to Start', () => {
    const onOpenStart = vi.fn();
    inLab(<DeviceSpecifications onOpenStart={onOpenStart} />);
    expect(screen.getByText(SPECIFICATIONS_STATEMENT)).toBeTruthy();
    expect(SPECIFICATIONS_STATEMENT).toBe('TARA Lab does not assess named products. These rows are published specifications only. To model a device, start from a generic class.');
    fireEvent.click(screen.getByRole('button', { name: 'Start from a generic class' }));
    expect(onOpenStart).toHaveBeenCalledTimes(1);
  });

  it('shows specification columns only, with the regulatory status headed as recorded', () => {
    inLab(<DeviceSpecifications onOpenStart={noop} />);
    const region = screen.getByRole('region', { name: 'Published device specifications' });
    expect(region.id).toBe('lab-results');
    expect(within(region).getAllByRole('columnheader').map((header) => header.textContent)).toEqual(SPEC_COLUMNS.map((column) => column.header));
    expect(within(region).getByRole('columnheader', { name: 'Regulatory status, as recorded' })).toBeTruthy();
    expect(bodyRows()).toHaveLength(devices.length);
  });

  it('puts no technique, count or score beside a product', () => {
    const { container } = inLab(<DeviceSpecifications onOpenStart={noop} />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/QIF-T\d+|NISS|CVSS|CVE-\d|techniques? appl|not assessed/i);
    for (const technique of engineData.techniques.slice(0, 30)) expect(text).not.toContain(technique.id);
    expect(container.querySelector('.lab-evidence, .lab-severity, .lab-hatch-swatch')).toBeNull();
    for (const row of bodyRows()) expect(within(row).getAllByRole('cell')).toHaveLength(SPEC_COLUMNS.length);
  });

  it('prints "Not recorded" where the file holds a channel count of 0', () => {
    inLab(<DeviceSpecifications onOpenStart={noop} />);
    const channelsIndex = SPEC_COLUMNS.findIndex((column) => column.key === 'channels');
    const withoutCount = devices.filter((row) => row.channels === 0).length;
    expect(withoutCount).toBeGreaterThan(0);
    const cells = bodyRows().map((row) => within(row).getAllByRole('cell')[channelsIndex].textContent);
    expect(cells.filter((cell) => cell === NOT_RECORDED)).toHaveLength(withoutCount);
    expect(cells).not.toContain('0');
  });

  it('shows one chip per device type and filters by it', () => {
    inLab(<DeviceSpecifications onOpenStart={noop} />);
    const types = countDeviceTypes(devices);
    const chips = within(screen.getByRole('group', { name: 'Type' })).getAllByRole('button');
    expect(chips.map((chip) => chip.textContent)).toEqual(types.map((type) => `${type.label} ${type.count}`));
    fireEvent.click(chips[0]);
    expect(bodyRows()).toHaveLength(types[0].count);
  });

  it.each(['penetrating', 'IDE', 'medical'])('finds "%s" although it is in neither the device nor the company column', (needle) => {
    inLab(<DeviceSpecifications onOpenStart={noop} />);
    search(needle);
    const expected = filterSpecRows(devices, [], needle);
    const inNameColumns = devices.filter((row) => ['device', 'company'].some((key) => readSpecText(row, key).toLowerCase().includes(needle.toLowerCase())));
    expect(expected.length).toBeGreaterThan(inNameColumns.length);
    expect(bodyRows()).toHaveLength(expected.length);
    expect(screen.getByText(`${expected.length} of ${devices.length} devices`)).toBeTruthy();
  });

  it('keeps the search and the chosen type when the view is left and reopened', () => {
    const store = createMemoryStore();
    const first = inLab(<DeviceSpecifications onOpenStart={noop} />, store);
    search('IDE');
    const kept = bodyRows().length;
    first.unmount();
    inLab(<DeviceSpecifications onOpenStart={noop} />, store);
    expect((screen.getByRole('searchbox', { name: 'Search every column' }) as HTMLInputElement).value).toBe('IDE');
    expect(bodyRows()).toHaveLength(kept);
  });

  it('says why the table is empty', () => {
    inLab(<DeviceSpecifications onOpenStart={noop} />);
    search('no device is called this');
    expect(screen.getByText('No device matches. Clear the search or a type to see the rest.')).toBeTruthy();
  });
});
