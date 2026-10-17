import { describe, expect, it } from 'vitest';
import { announceLens } from '../announcements';
import { emptyLens, withLensSubject, type Lens } from '../lens-state';
import type { LensTally } from '../region-rows';
import { buildFixtureModel } from './explorer-fixtures';

const model = buildFixtureModel();
const tally: LensTally = { withValue: 3, namedNotCounted: 1, noData: 2, drafted: 4 };
const COUNTS = '3 regions with a value, 4 AI-drafted, 1 named but not counted, 2 with no data.';

describe('announceLens', () => {
  const cases: ReadonlyArray<readonly [string, Lens, string]> = [
    ['band', emptyLens('band'), 'Band lens. 3 regions grouped by band.'],
    ['niss with nothing to choose', emptyLens('niss'), `NISS severity lens. ${COUNTS}`],
    ['technique before a subject is chosen', emptyLens('technique'), 'Technique lens. Choose a subject to see regions.'],
    ['dsm before a subject is chosen', emptyLens('dsm'), 'DSM cluster lens. Choose a subject to see regions.'],
    ['device before a subject is chosen', emptyLens('stated_targets'), 'Device lens. Choose a subject to see regions.'],
    ['technique with a subject', withLensSubject('technique', 'QIF-TX'), `Technique lens: QIF-TX. ${COUNTS}`],
    ['dsm with a subject', withLensSubject('dsm', 'some_cluster'), `DSM cluster lens: some cluster. ${COUNTS}`],
    ['device with a subject', withLensSubject('stated_targets', 'fixture_implant'), "Device lens: fixture implant. 3 regions listed in the device's QIF record, 2 not listed."],
  ];

  it.each(cases)('says the same for %s', (_name, lens, expected) => {
    expect(announceLens(model, lens, tally)).toBe(expected);
  });
});
