// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import RegionPicker from '@/components/atlas/brainmap/RegionPicker';
import BandViewPanel from '@/components/brain/BandViewPanel';
import TargetRegionsPanel from '@/components/threat-model/TargetRegionsPanel';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { BrainView } from '@/lib/brain-view-data';
import type { ClinicalRegion } from '@/lib/clinical-data';
import type { RegionViewMountProps } from '../RegionViewMount';

/** What each page's list handed the one mount, in the order it was rendered. The mount itself is tested on its own. */
let mounts: RegionViewMountProps[] = [];
vi.mock('../RegionViewMount', () => ({
  BAND_LENS: { kind: 'band' },
  default: (props: RegionViewMountProps) => {
    mounts.push(props);
    return <button type="button" data-mount="stand-in" onClick={() => props.onRegionPick?.({ regionId: 'picked-region', bandIds: ['N6'] })}>Show the 3D view</button>;
  },
}));

const lastMount = (): RegionViewMountProps => mounts[mounts.length - 1];
const clinicalRegion = (id: string, band: string): ClinicalRegion => ({
  id, name: `Region ${id}`, abbreviation: id, band, function: '', pathwayCount: 1, pathwayIds: [], neurotransmitters: [], dsmCodes: [], icd10Codes: [], threatCount: 0, connections: [],
});
const band = (id: string): BrainView['regions'][number] => ({ id, name: `Band ${id}`, description: '', color: '#000', intensity: 1, stat: { label: 'filed', value: '1' }, badges: [], details: [] });
const VIEWS: BrainView[] = [{ id: 'security', label: 'Security', icon: 'shield', accentColor: '#000', regions: [band('N7'), band('N6')] }];

beforeEach(() => {
  mounts = [];
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  Element.prototype.scrollIntoView = () => undefined;
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('the Lab\'s Target regions panel', () => {
  const regions = [{ id: 'm1', name: 'Primary motor cortex', bandId: 'N7', depthClass: 'cortical' }, { id: 'stn', name: 'Subthalamic nucleus', bandId: 'N5', depthClass: 'deep' }];

  it('gives the view the regions of its own list as the visitor\'s selection, coloured by band alone', () => {
    render(<TargetRegionsPanel summary={{ regions, unknownRegionIds: [] }} interfaceLabel="the electrode array" />);
    expect(screen.getAllByRole('listitem').map((item) => item.querySelector('strong')?.textContent)).toEqual(regions.map((region) => region.name));
    expect(lastMount().lens).toEqual({ kind: 'band' });
    expect(lastMount().selectedRegionIds).toEqual(regions.map((region) => region.id));
    expect(Object.keys(lastMount()).sort()).toEqual(['lens', 'selectedRegionIds']);
  });

  it('keeps its list, its framework sentence and the way to the explorer beside the view', () => {
    const { container } = render(<TargetRegionsPanel summary={{ regions, unknownRegionIds: ['gone'] }} interfaceLabel="the electrode array" />);
    expect(container.textContent).toContain('No risk is attached to a region here');
    expect(container.textContent).toContain('Not in the brain atlas, so not listed: gone.');
    expect(container.querySelector('a[href="/atlas/anatomy/"]')).not.toBeNull();
  });

  it('selects nothing in the view when no region is selected', () => {
    render(<TargetRegionsPanel summary={{ regions: [], unknownRegionIds: [] }} interfaceLabel="the electrode array" />);
    expect(lastMount().selectedRegionIds).toEqual([]);
  });
});

describe('the Clinical page\'s region list', () => {
  const regions = [clinicalRegion('pfc', 'N7'), clinicalRegion('picked-region', 'N6')];

  it('gives the view the region selected in the list, and nothing while none is', () => {
    const { rerender } = render(<RegionPicker regions={regions} selectedRegionId={null} highlightedRegionIds={['pfc']} onRegionSelect={() => undefined} />);
    expect(lastMount().selectedRegionIds).toEqual([]);
    rerender(<RegionPicker regions={regions} selectedRegionId="pfc" highlightedRegionIds={['picked-region']} onRegionSelect={() => undefined} />);
    expect(lastMount().selectedRegionIds).toEqual(['pfc']);
    expect(lastMount().lens).toEqual({ kind: 'band' });
  });

  it('never passes the regions another panel highlights: those are the data\'s, and the selection is the visitor\'s', () => {
    render(<RegionPicker regions={regions} selectedRegionId="pfc" highlightedRegionIds={['picked-region']} onRegionSelect={() => undefined} />);
    expect(JSON.stringify(lastMount())).not.toContain('picked-region');
  });

  it('selects in the list a region picked in the view, when the list holds it', () => {
    const onRegionSelect = vi.fn();
    const { rerender } = render(<RegionPicker regions={regions} selectedRegionId="pfc" highlightedRegionIds={[]} onRegionSelect={onRegionSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show the 3D view' }));
    expect(onRegionSelect).toHaveBeenCalledWith('picked-region');
    onRegionSelect.mockClear();
    rerender(<RegionPicker regions={[regions[0]]} selectedRegionId="pfc" highlightedRegionIds={[]} onRegionSelect={onRegionSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show the 3D view' }));
    expect(onRegionSelect).not.toHaveBeenCalled();
  });
});

describe('the band list', () => {
  it('stays a list on a page that asks for no view', () => {
    render(<BandViewPanel views={VIEWS} />);
    expect(mounts).toEqual([]);
  });

  it('gives the view the page\'s lens and the band selected in the list as the visitor\'s selection', () => {
    render(<BandViewPanel views={VIEWS} regionViewLens={{ kind: 'technique', techniqueId: 'QIF-T0001' }} />);
    expect(lastMount().lens).toEqual({ kind: 'technique', techniqueId: 'QIF-T0001' });
    expect(lastMount().selectedBandId).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Band N7/ }));
    expect(lastMount().selectedBandId).toBe('N7');
    expect(lastMount().selectedRegionIds).toBeUndefined();
  });

  it('passes on the sentence a technique page was built with, and passes none where the page gives none', () => {
    const sentence = limitSentence('view_nothing_coloured_no_own_shape');
    render(<BandViewPanel views={VIEWS} regionViewLens={{ kind: 'technique', techniqueId: 'QIF-T0034' }} regionViewNothingColoured={sentence} />);
    expect(lastMount().nothingColoured).toBe(sentence);
    cleanup();
    render(<BandViewPanel views={VIEWS} regionViewLens={{ kind: 'band' }} />);
    expect(lastMount().nothingColoured).toBeUndefined();
    // A page that lists bands keeps the choice in its list, which is what lets the mount send a visitor there.
    expect(typeof lastMount().onRegionPick).toBe('function');
  });

  it('selects in the list the band of a region picked in the view', () => {
    const onBandSelect = vi.fn();
    render(<BandViewPanel views={VIEWS} selectedBandId="N7" onBandSelect={onBandSelect} regionViewLens={{ kind: 'band' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show the 3D view' }));
    expect(onBandSelect).toHaveBeenCalledWith('N6');
  });
});
