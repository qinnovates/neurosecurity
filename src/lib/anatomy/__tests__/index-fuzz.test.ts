import { describe, expect, it } from 'vitest';
import { parseAnatomyFiles } from '../anatomy-inputs';
import { buildAnatomyBundle } from '../build-anatomy-index';
import { AnatomyDataError } from '../errors';
import { parseAnatomyIndex } from '../parse-anatomy-index';
import { parseManifest } from '../parse-manifest';
import { DEVICE_GEOMETRY_STATUS } from '../status-sentences';
import { FIXTURE_SPACE } from './anatomy-fixtures';
import { buildAsset, buildManifest, buildManifestContext } from './manifest-fixtures';
import { buildRawFiles } from './raw-files-fixture';

type Path = Array<string | number>;

const DEVICE_GEOMETRY = {
  schema_version: 1,
  status: DEVICE_GEOMETRY_STATUS,
  fiducial_space: FIXTURE_SPACE,
  fiducials: [{ id: 'nasion', position_mm: [0, 85, -40] }],
  leads: [{
    id: 'fixture_lead', name: 'Fixture lead', contacts: 4, contact_length_mm: 1.5, contact_spacing_mm: 0.5, spacing_measure: 'edge_to_edge', diameter_mm: 1.27,
    sources: [{ citation: 'Fixture summary', url: 'https://example.org/ssed.pdf', quote: 'spaced 0.5 mm apart' }], drafted_by: 'ai',
  }],
};

/** A value of every JSON type. Each leaf is replaced by the ones whose type differs from its own. */
const REPLACEMENTS: unknown[] = [true, 7.5, 'fuzz', [], {}, null];

function typeName(value: unknown): string {
  if (value === null) return 'null';
  return Array.isArray(value) ? 'array' : typeof value;
}

function listLeafPaths(value: unknown, path: Path = []): Path[] {
  if (Array.isArray(value)) return value.length === 0 ? [path] : value.flatMap((item, index) => listLeafPaths(item, [...path, index]));
  if (typeof value === 'object' && value !== null) return Object.entries(value).flatMap(([key, child]) => listLeafPaths(child, [...path, key]));
  return [path];
}

function readAt(value: unknown, path: Path): unknown {
  return path.reduce<unknown>((current, key) => (current as Record<string | number, unknown>)[key], value);
}

function replaceAt(value: unknown, path: Path, replacement: unknown): unknown {
  const copy = structuredClone(value);
  const parent = readAt(copy, path.slice(0, -1)) as Record<string | number, unknown>;
  parent[path[path.length - 1]] = replacement;
  return copy;
}

/** Every (path, wrong-typed value) pair that the parser accepted, or rejected with anything but the typed error. */
function listEscapes(valid: unknown, parse: (candidate: unknown) => unknown, nullablePaths: RegExp): { escapes: string[]; tried: number } {
  const escapes: string[] = [];
  let tried = 0;
  for (const path of listLeafPaths(valid)) {
    const original = readAt(valid, path);
    for (const replacement of REPLACEMENTS) {
      const label = `${path.join('.')} <- ${JSON.stringify(replacement)}`;
      const isSameType = typeName(replacement) === typeName(original);
      const isAllowedNull = replacement === null && nullablePaths.test(path.join('.'));
      const isAllowedNumber = typeof replacement === 'number' && original === null;
      const isAllowedText = typeof replacement === 'string' && original === null;
      if (isSameType || isAllowedNull || isAllowedNumber || isAllowedText) continue;
      tried += 1;
      try {
        parse(replaceAt(valid, path, replacement));
        escapes.push(`accepted: ${label}`);
      } catch (error) {
        if (!(error instanceof AnatomyDataError)) escapes.push(`untyped error: ${label}`);
      }
    }
  }
  return { escapes, tried };
}

describe('parseAnatomyIndex: wrong types', () => {
  const { indexJson } = buildAnatomyBundle(parseAnatomyFiles(buildRawFiles({ deviceGeometry: DEVICE_GEOMETRY })));
  const index: unknown = JSON.parse(indexJson);
  /** Fields the index type declares nullable. Null is a valid value there, so it is not a wrong type. */
  const NULLABLE = /(reason|reason_source|name|extent_match|niss_severity|dsm_cluster|resolved_region_id|index_asset_id|proximity_asset_id|fiducial_space|role|reviewed_on)$/;

  it('accepts the index the build emits, with every section populated', () => {
    const parsed = parseAnatomyIndex(index);
    expect([parsed.assets.length, parsed.structures.length, parsed.techniques[0].links.length, parsed.devices.leads.length, parsed.devices.fiducials.length]
      .every((count) => count > 0)).toBe(true);
  });

  it('rejects every leaf replaced by a value of another type, always with the typed error', () => {
    const { escapes, tried } = listEscapes(index, parseAnatomyIndex, NULLABLE);
    expect(tried).toBeGreaterThan(1500);
    expect(escapes).toEqual([]);
  });

  it('rejects a removed key anywhere in the index', () => {
    const accepted = listLeafPaths(index).filter((path) => typeof path[path.length - 1] === 'string').filter((path) => {
      const copy = structuredClone(index);
      delete (readAt(copy, path.slice(0, -1)) as Record<string, unknown>)[path[path.length - 1] as string];
      try {
        parseAnatomyIndex(copy);
        return true;
      } catch (error) {
        return !(error instanceof AnatomyDataError);
      }
    });
    expect(accepted.map((path) => path.join('.')).filter((path) => !/review_state\.(reviewer_role|reviewed_on)$/.test(path))).toEqual([]);
  });
});

describe('parseManifest: wrong types', () => {
  const manifest = buildManifest([buildAsset()]);
  const context = buildManifestContext();
  const NULLABLE = /(subjects|acquisition_voxel_mm|measured|threshold|stage_fingerprints\.[a-z]+)$/;

  it('rejects every leaf replaced by a value of another type, always with the typed error', () => {
    const { escapes, tried } = listEscapes(manifest, (candidate) => parseManifest(candidate, context), NULLABLE);
    expect(tried).toBeGreaterThan(200);
    expect(escapes).toEqual([]);
  });

  it('rejects a stage fingerprint that is not a digest', () => {
    const asset = buildAsset({ stage_fingerprints: { ...buildAsset().stage_fingerprints, register: { anything: 'goes' } as never } });
    expect(() => parseManifest(buildManifest([asset]), context)).toThrow(/stage_fingerprints\.register/);
  });
});
