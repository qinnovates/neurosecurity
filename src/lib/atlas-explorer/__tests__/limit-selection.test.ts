import { describe, expect, it } from 'vitest';
import regionEvidenceFile from '@shared/qif-anatomy-region-evidence.json';
import atlas from '@shared/qif-brain-bci-atlas.json';
import { GEOMETRY_STATES } from '@/lib/anatomy/anatomy-index-types';
import { parseRegionEvidence } from '@/lib/anatomy/parse-region-evidence';
import { isAboutRegionItself } from '@/lib/anatomy/region-evidence-types';
import { describeBands, limitForGeometry, limitForLayer, limitForSource, limitsForEvidenceAnatomy, limitsForLens } from '../limit-selection';
import { buildRegionEvidenceView } from '../region-evidence-view';
import { FIXTURE_IDS, buildFixtureModel, loadRealModel } from './explorer-fixtures';

const model = buildFixtureModel();
const evidence = parseRegionEvidence(regionEvidenceFile, new Set(atlas.brain_regions.map((region) => region.id)));
const ids = (limits: ReadonlyArray<{ id: string }>): string[] => limits.map((limit) => limit.id);

describe('limit selection', () => {
  it('has a sentence for every geometry state, with the recorded reason where there is no shape', () => {
    for (const state of GEOMETRY_STATES) expect(limitForGeometry({ geometry: { state, reason: 'Recorded reason.', reason_source: null } }).id).toBe(`geometry_${state}`);
    expect(limitForGeometry({ geometry: { state: 'no_geometry', reason: 'No licence is stated.', reason_source: null } }).text).toBe('No atlas cleared for this site draws this structure. The recorded reason: No licence is stated.');
    expect(limitForGeometry({ geometry: { state: 'no_geometry', reason: null, reason_source: null } }).text).toContain('none is recorded.');
  });

  it('says how a source\'s shapes were made, and only names a source it has no sentence for', () => {
    expect(limitForSource('allen_hra_3d_2020', 'Allen').text).toContain('An anatomist drew these shapes onto an average brain');
    expect(limitForSource('cit168_rl', 'CIT168').id).toBe('source_deep_average');
    expect(limitForSource('harvard_aan_v2', 'AAN').id).toBe('source_arousal_nuclei');
    expect(limitForSource('fixture_atlas', 'Fixture atlas').text).toBe('This shape comes from Fixture atlas. How it was drawn is not described here yet.');
  });

  it('gives an unavailable layer its reason and an available one nothing', () => {
    const [cortical, tracts] = model.index.layers;
    const source = (blockers: string[]) => [{ id: 'fixture_tracts', blockers }] as unknown as Parameters<typeof limitForLayer>[1];
    const blockedTracts = { ...tracts, source_ids: ['fixture_tracts'] };
    expect(limitForLayer(cortical, [])).toBeNull();
    expect(limitForLayer(tracts, [])?.text).toBe('This layer is not available in this build.');
    expect(limitForLayer(blockedTracts, source(['route_not_settled']))?.text).toBe('Not available in this build. The shapes cannot yet be placed reliably in the brain model this site uses.');
    expect(limitForLayer(blockedTracts, source(['route_not_settled', 'not_cleared']))?.id).toBe('layer_blocked_not_cleared');
    expect(limitForLayer(blockedTracts, source(['no_output_folder']))?.id).toBe('layer_unavailable');
    // The registry's own prose never reaches a visitor, whatever the layer's reason field holds.
    expect(limitForLayer({ ...blockedTracts, reason: 'The grant rests on reading an MIT software licence.' }, source(['grant_not_explicit']))?.text).not.toContain('MIT');
    const real = loadRealModel();
    const shown = real.index.layers.flatMap((layer) => limitForLayer(layer, real.index.sources)?.text ?? []);
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.filter((text) => real.index.layers.some((layer) => layer.reason !== null && text.includes(layer.reason)))).toEqual([]);
  });

  it('always puts at least one sentence beside the lens, chosen by what the lens is on', () => {
    expect(ids(limitsForLens(model, { kind: 'band' }))).toEqual(['lens_band']);
    expect(ids(limitsForLens(model, { kind: 'niss' }))).toEqual(['niss_meaning', 'lens_niss', 'counts_are_entries']);
    expect(ids(limitsForLens(model, { kind: 'technique', techniqueId: null }))).toEqual(['lens_technique', 'lens_needs_subject']);
    expect(ids(limitsForLens(model, { kind: 'technique', techniqueId: FIXTURE_IDS.linkedTechnique }))).toEqual(['lens_technique']);
    expect(limitsForLens(model, { kind: 'technique', techniqueId: FIXTURE_IDS.bandLevelTechnique })[0].text).toContain('ties this technique to band N6 and names no region');
    expect(describeBands(['N5', 'N6'])).toBe('bands N5 and N6');
    expect(describeBands(['N4', 'N5', 'N6'])).toBe('bands N4, N5 and N6');
    expect(ids(limitsForLens(model, { kind: 'technique', techniqueId: 'QIF-T0000' }))).toEqual(['lens_technique_unknown']);
    expect(ids(limitsForLens(model, { kind: 'technique', techniqueId: FIXTURE_IDS.notDraftedTechnique }))).toEqual(['lens_technique_not_drafted']);
    expect(ids(limitsForLens(model, { kind: 'technique', techniqueId: FIXTURE_IDS.deviceOnlyTechnique }))).toEqual(['lens_technique_device_only']);
    expect(ids(limitsForLens(model, { kind: 'dsm', cluster: null }))).toEqual(['lens_dsm', 'lens_needs_subject']);
    expect(ids(limitsForLens(model, { kind: 'dsm', cluster: 'mood_trauma' }))).toEqual(['lens_dsm', 'counts_are_entries']);
    expect(ids(limitsForLens(model, { kind: 'stated_targets', deviceId: FIXTURE_IDS.device }))).toEqual(['lens_stated_targets']);
  });
});

describe('evidence statements', () => {
  it('never let a paper about somewhere else read as a plain statement about the region', () => {
    expect(ids(limitsForEvidenceAnatomy({ anatomy_match: 'equal', anatomy_inferred: false, anatomy_as_stated: 'STN' }))).toEqual(['evidence_match_equal']);
    expect(ids(limitsForEvidenceAnatomy({ anatomy_match: 'equal', anatomy_inferred: true, anatomy_as_stated: 'STN' }))).toEqual(['evidence_match_equal', 'evidence_inferred']);
    expect(limitsForEvidenceAnatomy({ anatomy_match: 'outside_region', anatomy_inferred: false, anatomy_as_stated: 'superior temporal cortex' })[0].text)
      .toBe('The paper is about superior temporal cortex, which is outside this region. It is shown as a rival view, not as a finding about this region.');
    expect(ids(limitsForEvidenceAnatomy({ anatomy_match: 'larger_structure', anatomy_inferred: true, anatomy_as_stated: 'thalamus' }))).toEqual(['evidence_match_larger_structure', 'evidence_inferred']);
  });

  it('qualify every real row that is not about the region itself, and carry the filed-under line on all 58 (guard)', () => {
    const statements = evidence.rows.map((row) => ({ row, statement: buildRegionEvidenceView(evidence, row.region_id, 'Region').statements.find((candidate) => candidate.quote === row.quote) }));
    const keys = [...new Set(evidence.rows.map((row) => row.region_id))].flatMap((regionId) => buildRegionEvidenceView(evidence, regionId, 'Region').statements.map((statement) => statement.key));
    expect(new Set(keys).size).toBe(58);
    expect(statements).toHaveLength(58);
    expect(statements.filter(({ statement }) => statement === undefined || !statement.filedUnderLine.startsWith('Filed under Region; the paper says "'))).toEqual([]);
    const qualified = statements.filter(({ row }) => !isAboutRegionItself(row));
    expect(qualified.length).toBeGreaterThan(30);
    expect(qualified.filter(({ statement }) => ids(statement?.anatomyLimits ?? []).join() === 'evidence_match_equal')).toEqual([]);
  });

  it('flag contested rows, mark a paper that must be read with the row, and link by DOI and PubMed id', () => {
    const ppc = buildRegionEvidenceView(evidence, 'ppc', 'Posterior Parietal Cortex');
    expect(ppc.statements).toHaveLength(3);
    expect(ppc.statements.filter((statement) => statement.contestedLimit !== null)).toHaveLength(2);
    const vermis = buildRegionEvidenceView(evidence, 'vermis', 'Cerebellar Vermis').statements.find((statement) => statement.requiredCitationLimit !== null);
    expect(vermis?.related.filter((related) => related.required)).toHaveLength(1);
    expect(ppc.statements[0].citation.pubmedAddress).toMatch(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/);
    expect(ppc.statements[0].citation.doiAddress).toMatch(/^https:\/\/doi\.org\/10\./);
  });

  it('give a region with no statement its recorded reason', () => {
    const cea = buildRegionEvidenceView(evidence, 'cea', 'Central Amygdala');
    expect(cea.statements).toEqual([]);
    expect(cea.emptyLimit?.id).toBe('evidence_none_animal_evidence_only');
    expect(cea.emptyLimit?.text).not.toMatch(/this session|filed under bla/);
    expect(buildRegionEvidenceView(evidence, 'sacral_cord', 'Sacral').emptyLimit?.id).toBe('evidence_none_no_abstract_found');
    expect(buildRegionEvidenceView(evidence, 'ppc', 'PPC').emptyLimit).toBeNull();
  });
});
