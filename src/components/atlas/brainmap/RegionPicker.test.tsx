// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import RegionPicker from './RegionPicker';
import { QIF_BANDS_FRAMEWORK_NOTE } from '../../../lib/brain-view-data';
import type { ClinicalRegion } from '../../../lib/clinical-data';

afterEach(cleanup);

const REGION: ClinicalRegion = {
  id: 'region-test',
  name: 'Test Region',
  abbreviation: 'TR',
  band: 'N7',
  function: '',
  pathwayCount: 1,
  pathwayIds: [],
  neurotransmitters: [],
  dsmCodes: [],
  icd10Codes: [],
  threatCount: 0,
  connections: [],
};

describe('RegionPicker', () => {
  it('says the bands belong to a proposed, unreviewed framework', () => {
    render(<RegionPicker regions={[REGION]} selectedRegionId={null} highlightedRegionIds={[]} onRegionSelect={() => undefined} />);
    expect(screen.getByText(new RegExp(QIF_BANDS_FRAMEWORK_NOTE))).toBeTruthy();
    expect(QIF_BANDS_FRAMEWORK_NOTE).toContain('unreviewed');
  });
});
