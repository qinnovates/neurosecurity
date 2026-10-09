import fs from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { AnatomyIndex, IndexReviewState } from '@/lib/anatomy/anatomy-index-types';
import { readDeclaredAddressingVersion, UNDECLARED_ADDRESSING_VERSION } from '@/lib/anatomy/addressing-version';
import { createStructureStyler, type ColourMode } from '@/lib/anatomy/colour-modes';
import { REVIEWED_ENTRY_COUNTS, countEntriesByKind } from '@/lib/anatomy/review-state';
import { sha256Hex } from '@/lib/anatomy/row-digest';
import { ANATOMY_INDEX_STATUS } from '@/lib/anatomy/status-sentences';
import { loadAnatomyBundle, loadAnatomyData } from '../load-anatomy-data';

/**
 * PINNED STATE OF THE COMMITTED ANATOMY DATA.
 *
 * These four values describe what the committed data files let the site do
 * today. Each changes only when the data changes, in the same reviewed diff;
 * code owner review of exactly these lines is the control. Change one only for
 * the reason given beside it.
 */
const PINNED_ANATOMY_STATE = {
  /** Changes when a source is CLEARED, or its route SETTLED, in the verdict or registry file. Every id here may ship assets. */
  buildableSourceIds: ['mni_icbm152_2009c_asym', 'eeg_positions'],
  /** Changes when GEOMETRY IS ADDED: crosswalk rows land, or the pipeline ships shapes no record maps to. */
  structureCount: 0,
  /** Changes when a region GAINS GEOMETRY (its no_geometry record is removed) or a new one is recorded as having none. */
  noGeometryRegionIds: ['cervical_cord', 'thoracic_cord', 'lumbar_cord', 'sacral_cord', 'cauda_equina'],
  /** Changes when REGIONS ARE MAPPED: every region not listed above reads not_mapped until a row is drafted for it. */
  regionGeometryStates: ['no_geometry', 'not_mapped'],
} as const;

/**
 * The most the anatomy index may weigh, uncompressed. It protects the atlas
 * view's load on a slow connection, not the Lab's first load: the index is
 * fetched only when the atlas view opens, and is never part of the Lab page.
 */
const INDEX_BUDGET_BYTES = 300_000;
/** An import (static or dynamic) of one of the anatomy data files. Parsers name the files in messages; that is not an import. */
const ANATOMY_DATA_FILE_PATTERN = /(from|import\()\s*['"][^'"]*qif-anatomy-[a-z-]+\.json['"]/;
const LOADER_IMPORT_PATTERN = /(from|import\()\s*['"][^'"]*load-anatomy-data['"]/;
const LOADER_PATH = 'src/components/atlas-scene/load-anatomy-data.ts';
const ENDPOINT_PATHS = ['src/pages/atlas/anatomy-evidence.json.ts', 'src/pages/atlas/anatomy-index.json.ts'];
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.astro', '.mjs'];
const SKIPPED_DIRECTORIES = ['__tests__', 'site', 'node_modules'];

const data = loadAnatomyData();
const bundle = loadAnatomyBundle();
const { index } = bundle;

function listSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return SKIPPED_DIRECTORIES.includes(entry.name) ? [] : listSourceFiles(entryPath);
    return SOURCE_EXTENSIONS.includes(path.extname(entry.name)) ? [entryPath] : [];
  });
}

function listFilesMatching(pattern: RegExp): string[] {
  return listSourceFiles('src').filter((filePath) => pattern.test(fs.readFileSync(filePath, 'utf-8'))).map((filePath) => filePath.split(path.sep).join('/')).sort();
}

function listReviewStates(anatomyIndex: AnatomyIndex): IndexReviewState[] {
  return [
    ...anatomyIndex.subjects.map((subject) => subject.review_state),
    ...anatomyIndex.structures.flatMap((structure) => [structure.review_state, ...structure.owners.map((owner) => owner.review_state)]),
    ...anatomyIndex.techniques.flatMap((technique) => technique.links.map((link) => link.review_state)),
    ...anatomyIndex.devices.fiducials.map((fiducial) => fiducial.review_state),
    ...anatomyIndex.devices.leads.map((lead) => lead.review_state),
  ];
}

describe('anatomy index built from the seed files (guards)', () => {
  it('carries the status sentence and an unreviewed mark on every drafted thing', () => {
    const states = listReviewStates(index);
    expect(index.status).toBe(ANATOMY_INDEX_STATUS);
    expect(states.length).toBeGreaterThanOrEqual(index.subjects.length);
    expect(index.subjects.length).toBeGreaterThan(0);
    expect(states.filter((state) => state.mark !== 'AI-drafted, unreviewed')).toEqual([]);
  });

  it('lists every QIF region, pathway and network as a subject', () => {
    const count = (kind: string): number => index.subjects.filter((subject) => subject.kind === kind).length;
    expect(count('region')).toBe(data.engineData.regions.length);
    expect(count('region')).toBeGreaterThan(0);
    expect(count('pathway') + count('network')).toBe(data.subjectNames.pathway.size + data.subjectNames.network.size);
    expect(count('network')).toBeGreaterThan(0);
  });

  it('adding or removing geometry for a region changes PINNED_ANATOMY_STATE: regions with none keep a reason and its source', () => {
    const regions = index.subjects.filter((subject) => subject.kind === 'region');
    const withoutGeometry = regions.filter((subject) => subject.geometry.state === 'no_geometry');
    expect(withoutGeometry.map((subject) => subject.id).sort()).toEqual([...PINNED_ANATOMY_STATE.noGeometryRegionIds].sort());
    expect(withoutGeometry.filter((subject) => !subject.geometry.reason || !subject.geometry.reason_source)).toEqual([]);
    expect([...new Set(regions.map((subject) => subject.geometry.state))].sort()).toEqual([...PINNED_ANATOMY_STATE.regionGeometryStates].sort());
  });

  it('holds no row that predates the current addressing', () => {
    expect(index.subjects.length).toBeGreaterThan(0);
    expect(index.subjects.filter((subject) => subject.geometry.state === 'predates_addressing')).toEqual([]);
    expect(index.techniques.flatMap((technique) => technique.links).filter((link) => !link.valid_for_current_addressing)).toEqual([]);
  });

  it('never fills a real structure that holds a contained owner, in any mode (the exhaustive property is in colour-modes.test.ts)', () => {
    const style = createStructureStyler(index);
    const modes: ColourMode[] = [
      { kind: 'band' }, { kind: 'niss' },
      ...index.techniques.map((technique): ColourMode => ({ kind: 'technique', techniqueId: technique.id })),
      ...index.devices.stated_targets.map((device): ColourMode => ({ kind: 'stated_targets', deviceId: device.device_id })),
    ];
    expect(modes.length).toBeGreaterThan(2);
    const wronglyFilled = index.structures.flatMap((structure) => modes
      .filter((mode) => structure.owners.length > 1 && style(structure.key, mode).mark === 'solid' && structure.owners.some((owner) => owner.extent_match === 'contained'))
      .map((mode) => `${structure.key} in ${mode.kind}`));
    expect(wronglyFilled).toEqual([]);
  });

  it('adding geometry changes PINNED_ANATOMY_STATE.structureCount', () => {
    expect(index.structures).toHaveLength(PINNED_ANATOMY_STATE.structureCount);
  });

  it('lists every technique with a neural band, with no region link drafted yet and nothing lit', () => {
    const neuralTechniques = data.engineData.techniques.filter((technique) => technique.bandIds.some((bandId) => bandId.startsWith('N')));
    expect(neuralTechniques.length).toBeGreaterThan(0);
    expect(index.techniques.map((technique) => technique.id)).toEqual(neuralTechniques.map((technique) => technique.id));
    expect(index.techniques.filter((technique) => technique.scope !== 'not_drafted' || technique.links.some((link) => link.lit))).toEqual([]);
  });

  it('marks every layer unavailable and says why', () => {
    expect(index.layers.map((layer) => layer.id)).toEqual(['outline', 'cortical', 'deep', 'tracts', 'networks', 'devices']);
    expect(index.layers.filter((layer) => layer.available || !layer.reason)).toEqual([]);
    expect(index.layers.find((layer) => layer.id === 'tracts')?.reason).toContain('requires additional acknowledgment');
    expect(index.layers.find((layer) => layer.id === 'networks')?.reason).toContain('MIT software licence');
  });

  it('pins the evidence file, stays inside the index byte budget and reports the compressed size', () => {
    expect(index.evidence).toEqual({ path: '/atlas/anatomy-evidence.json', bytes: Buffer.byteLength(bundle.evidenceJson), sha256: sha256Hex(bundle.evidenceJson) });
    expect(bundle.indexPin.bytes).toBeGreaterThan(0);
    expect(bundle.indexPin.bytes).toBeLessThan(INDEX_BUDGET_BYTES);
    const gzipBytes = gzipSync(bundle.indexJson).length;
    process.stdout.write(`[anatomy index] ${bundle.indexPin.bytes} bytes raw, ${gzipBytes} bytes gzip (budget ${INDEX_BUDGET_BYTES} raw)\n`);
    expect(gzipBytes).toBeLessThan(bundle.indexPin.bytes);
  });
});

describe('licence clearance against the committed verdict file (guards)', () => {
  it('clearing a source or settling its route changes PINNED_ANATOMY_STATE.buildableSourceIds: exactly the pinned sources may build', () => {
    expect(index.sources.length).toBeGreaterThan(0);
    expect(index.sources.filter((source) => source.buildable).map((source) => source.id).sort()).toEqual([...PINNED_ANATOMY_STATE.buildableSourceIds].sort());
  });

  it('has a verdict for every source, none confirmed by a person, every clearance marked AI-drafted', () => {
    expect(data.verdicts.verdicts.map((verdict) => verdict.source_id).sort()).toEqual(data.sources.sources.map((source) => source.id).sort());
    expect(data.verdicts.verdicts.length).toBeGreaterThan(0);
    expect(data.verdicts.verdicts.filter((verdict) => verdict.human_confirmed !== false || verdict.clearance.drafted_by !== 'ai')).toEqual([]);
    expect(data.verdicts.verifiers.filter((verifier) => verifier.kind !== 'ai')).toEqual([]);
  });

  it('keeps every uncleared or interpretation-granted source from building', () => {
    const blocked = data.verdicts.verdicts.filter((verdict) => !verdict.clearance.cleared || verdict.grant !== 'explicit');
    expect(blocked.length).toBeGreaterThan(0);
    expect(blocked.filter((verdict) => data.buildabilityBySource.get(verdict.source_id)?.buildable !== false)).toEqual([]);
  });

  it('handles the reinforcement-learning atlas as share-alike and records the two expert-drawn atlases as such', () => {
    expect(data.effectiveLicenceBySource.get('cit168_rl')).toBe('cc-by-sa-4.0');
    const basisOf = (sourceId: string): unknown => data.sources.sources.find((source) => source.id === sourceId)?.delineation.basis;
    expect([basisOf('allen_hra_3d_2020'), basisOf('harvard_aan_v2')]).toEqual(['expert_drawing_on_template', 'expert_drawing_on_template']);
  });
});

describe('review ledger and addressing tripwires (guards)', () => {
  it('holds exactly the number of ledger entries the ratchet expects', () => {
    expect(countEntriesByKind(data.ledger)).toEqual(REVIEWED_ENTRY_COUNTS);
    expect(data.ledger.reviewers.length).toBeGreaterThan(0);
  });

  it('fails the day the atlas file declares an addressing version: remove UNDECLARED_ADDRESSING_VERSION then', () => {
    expect(readDeclaredAddressingVersion(data.atlas)).toBeUndefined();
    expect(index.addressing_version).toBe(UNDECLARED_ADDRESSING_VERSION);
  });
});

describe('where anatomy data may be imported (guards)', () => {
  it('lets only the loader import the anatomy data files', () => {
    expect(listFilesMatching(ANATOMY_DATA_FILE_PATTERN)).toEqual([LOADER_PATH]);
  });

  it('lets only the two static endpoints import the loader, so nothing is serialised into a page', () => {
    expect(listFilesMatching(LOADER_IMPORT_PATTERN).filter((filePath) => filePath !== LOADER_PATH)).toEqual(ENDPOINT_PATHS);
  });
});
