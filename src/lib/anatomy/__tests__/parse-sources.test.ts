import { describe, expect, it } from 'vitest';
import { AnatomyDataError } from '../errors';
import { parseSources } from '../parse-sources';
import { parseVerdicts } from '../parse-verdicts';
import { FIXTURE_ATLAS_ID, FIXTURE_SHA256, buildSource, buildSourcesFile, buildVerdict, buildVerdictsFile } from './anatomy-fixtures';

const SOURCE_IDS = new Set([FIXTURE_ATLAS_ID]);

describe('parseSources', () => {
  it('accepts a valid registry', () => {
    expect(parseSources(buildSourcesFile()).sources.map((source) => source.id)).toEqual([FIXTURE_ATLAS_ID]);
  });

  it('rejects an unknown schema version and says what to do', () => {
    expect(() => parseSources({ ...buildSourcesFile(), schema_version: 99 }))
      .toThrow(/datalake\/qif-anatomy-sources\.json: schema_version: version 99 is not one this build understands\. Use schema_version 1/);
  });

  it('rejects a softened status sentence', () => {
    expect(() => parseSources({ ...buildSourcesFile(), status: 'Reviewed by experts.' })).toThrow(/status: the status sentence differs/);
  });

  it('rejects a licence id outside the closed list', () => {
    const source = { ...buildSource(), licence_id: 'cc-by-nc-4.0' };
    expect(() => parseSources(buildSourcesFile([source as never]))).toThrow(/sources\[0\]\.licence_id: "cc-by-nc-4\.0" is not an allowed value/);
  });

  it('rejects a hand-typed licence fact', () => {
    const source = { ...buildSource(), share_alike: false };
    expect(() => parseSources(buildSourcesFile([source as never]))).toThrow(/unexpected key "share_alike"/);
  });

  it('rejects two rows with one id', () => {
    expect(() => parseSources(buildSourcesFile([buildSource(), buildSource()]))).toThrow(/source id "fixture_atlas" appears twice/);
  });

  it('rejects an unknown route that claims to be settled', () => {
    const route = { kind: 'unknown', status: 'settled', note: 'n' } as const;
    expect(() => parseSources(buildSourcesFile([buildSource({ route })]))).toThrow(/route\.status: a route of kind "unknown" cannot be settled/);
  });

  it('rejects a publisher-registered route with no record of the publisher\'s registration', () => {
    const route = { kind: 'publisher_registered', status: 'open', note: 'n' } as const;
    expect(() => parseSources(buildSourcesFile([buildSource({ route })]))).toThrow(/missing key "publisher_registration"/);
  });

  it('rejects a declared-space route on a source that arrives in another space', () => {
    const route = { kind: 'declared_space', status: 'settled', note: 'n' } as const;
    expect(() => parseSources(buildSourcesFile([buildSource({ route, arrives_in: 'ElsewhereSpace' })])))
      .toThrow(/route\.kind: only a source that arrives in "FixtureSpace" can be the declared space/);
  });

  it('rejects a download that is not HTTPS, a malformed pin, and a pin with no origin', () => {
    const file = { name: 'a.nii.gz', url: 'http://example.org/a.nii.gz', sha256: null, bytes: null, digest_origin: null };
    expect(() => parseSources(buildSourcesFile([buildSource({ files: [file] })]))).toThrow(/files\[0\]\.url: .* is not an HTTPS URL/);
    const badPin = { ...file, url: 'https://example.org/a.nii.gz', sha256: 'abc' };
    expect(() => parseSources(buildSourcesFile([buildSource({ files: [badPin] })]))).toThrow(/files\[0\]\.sha256/);
    const pinWithoutOrigin = { ...badPin, sha256: FIXTURE_SHA256, bytes: 10 };
    expect(() => parseSources(buildSourcesFile([buildSource({ files: [pinWithoutOrigin] })]))).toThrow(/files\[0\]\.digest_origin: a pinned file must say where its digest came from/);
  });

  it('rejects a band key anywhere in the file', () => {
    const source = { ...buildSource(), qif_band: 'N7' };
    expect(() => parseSources(buildSourcesFile([source as never]))).toThrow(/must not store a QIF band/);
  });

  it('throws the typed error', () => {
    expect(() => parseSources(null)).toThrow(AnatomyDataError);
  });
});

describe('parseVerdicts', () => {
  it('accepts one verdict per source', () => {
    expect(parseVerdicts(buildVerdictsFile(), parseSources(buildSourcesFile())).verdicts).toHaveLength(1);
  });

  it('rejects a source with no verdict and a verdict for no source', () => {
    const sources = parseSources(buildSourcesFile());
    expect(() => parseVerdicts(buildVerdictsFile([]), sources)).toThrow(/source "fixture_atlas" has no verdict/);
    const stray = buildVerdict({ source_id: 'stray_atlas' });
    expect(() => parseVerdicts(buildVerdictsFile([buildVerdict(), stray]), sources)).toThrow(/"stray_atlas" is not a source in the registry/);
  });

  it('rejects a claim of human confirmation', () => {
    const verdict = { ...buildVerdict(), human_confirmed: true };
    expect(() => parseVerdicts(buildVerdictsFile([verdict as never]), parseSources(buildSourcesFile())))
      .toThrow(/human_confirmed: no person has confirmed any licence reading/);
  });

  it('rejects a clearance that does not say it is AI-drafted', () => {
    const clearance = { cleared: true, reason: 'r', unlocks_when: [], drafted_by: 'human' };
    const verdict = { ...buildVerdict(), clearance };
    expect(() => parseVerdicts(buildVerdictsFile([verdict as never]), parseSources(buildSourcesFile()))).toThrow(/clearance\.drafted_by/);
  });

  it('rejects an uncleared source that does not say what would clear it', () => {
    const clearance = { cleared: false, reason: 'Not settled.', unlocks_when: [], drafted_by: 'ai' as const };
    expect(() => parseVerdicts(buildVerdictsFile([buildVerdict({ clearance })]), parseSources(buildSourcesFile())))
      .toThrow(/clearance\.unlocks_when: an uncleared source must say what would clear it/);
  });

  it('rejects treat_as that is looser than the stated licence', () => {
    const sources = parseSources(buildSourcesFile([buildSource({ licence_id: 'cc-by-sa-4.0' })]));
    expect(() => parseVerdicts(buildVerdictsFile([buildVerdict({ treat_as: 'cc-by-4.0' })]), sources))
      .toThrow(/treat_as: "cc-by-4\.0" is not stricter than the stated licence "cc-by-sa-4\.0"/);
  });

  it('rejects a verifier that the file does not list', () => {
    expect(() => parseVerdicts(buildVerdictsFile([buildVerdict({ verified_by: ['someone'] })]), parseSources(buildSourcesFile())))
      .toThrow(/verified_by: "someone" is not in this file's verifiers list/);
  });

  it('rejects a hand-typed commercial-use flag and a malformed read date', () => {
    const typed = { ...buildVerdict(), commercial_use: true };
    expect(() => parseVerdicts(buildVerdictsFile([typed as never]), parseSources(buildSourcesFile()))).toThrow(/unexpected key "commercial_use"/);
    expect(() => parseVerdicts(buildVerdictsFile([buildVerdict({ read_on: 'last week' })]), parseSources(buildSourcesFile()))).toThrow(/read_on/);
  });

  it('keeps the source id set it was checked against', () => {
    const verdicts = parseVerdicts(buildVerdictsFile(), parseSources(buildSourcesFile()));
    expect(new Set(verdicts.verdicts.map((verdict) => verdict.source_id))).toEqual(SOURCE_IDS);
  });
});
