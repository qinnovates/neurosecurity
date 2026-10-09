import { describe, it, expect } from 'vitest';
import { loadChainSources } from '../compute-impact-chains.mjs';
import {
  MixedOriginBandError,
  derivePathwayBands,
  findPathwayBandDrift,
  rewritePathwayBands,
} from '../derive-pathway-bands.mjs';
import { createRegionResolver } from '../region-resolver.mjs';
import { FIXTURE_ATLAS } from './atlas-fixture.mjs';

const STALE_PATHWAYS_TEXT = `{
  "pathways": [
    {
      "id": "fixture_descending",
      "origin": ["prefrontal_cortex"],
      "origin_band": "N2",
      "targets": ["hippocampus", "amygdala", "pons"],
      "target_bands": ["N7"],
      "function": "Bands N2 and [\\"N7\\"] in prose stay as written"
    },
    {
      "id": "fixture_current",
      "origin": ["pons"],
      "origin_band": "N2",
      "targets": ["pfc"],
      "target_bands": ["N7"]
    }
  ]
}
`;

describe('derivePathwayBands', () => {
  const resolver = createRegionResolver(FIXTURE_ATLAS);

  it('takes the origin band and the deduplicated target bands from the region table', () => {
    const pathway = { id: 'fixture', origin: ['prefrontal_cortex'], targets: ['hippocampus', 'amygdala', 'pons'] };
    expect(derivePathwayBands(pathway, resolver)).toEqual({ origin_band: 'N7', target_bands: ['N6', 'N2'] });
  });

  it('refuses origins that span bands rather than choosing one', () => {
    const pathway = { id: 'fixture', origin: ['pfc', 'pons'], targets: ['bla'] };
    expect(() => derivePathwayBands(pathway, resolver)).toThrow(MixedOriginBandError);
  });
});

describe('rewritePathwayBands', () => {
  const rewrittenText = rewritePathwayBands(STALE_PATHWAYS_TEXT, FIXTURE_ATLAS);

  it('reports each stale field with its stored and derived value', () => {
    expect(findPathwayBandDrift(JSON.parse(STALE_PATHWAYS_TEXT).pathways, FIXTURE_ATLAS)).toEqual([
      { pathway_id: 'fixture_descending', field: 'origin_band', stored: 'N2', derived: 'N7' },
      { pathway_id: 'fixture_descending', field: 'target_bands', stored: ['N7'], derived: ['N6', 'N2'] },
    ]);
  });

  it('changes only the stale band lines and keeps the hand formatting', () => {
    const originalLines = STALE_PATHWAYS_TEXT.split('\n');
    const changedLines = rewrittenText.split('\n').filter((line, index) => line !== originalLines[index]);
    expect(changedLines).toEqual(['      "origin_band": "N7",', '      "target_bands": ["N6", "N2"],']);
  });

  it('leaves a file with no drift byte-identical', () => {
    expect(rewritePathwayBands(rewrittenText, FIXTURE_ATLAS)).toBe(rewrittenText);
  });
});

describe('pathway bands against the datalake', () => {
  it('stores no band that disagrees with the atlas region table (regenerate with `npm run derive:pathway-bands`)', () => {
    const { atlas, pathways } = loadChainSources();
    expect(findPathwayBandDrift(pathways.pathways, atlas)).toEqual([]);
  });
});
