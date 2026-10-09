import { describe, expect, it } from 'vitest';
import { AnatomyDataError } from '../errors';
import { MAX_RATIONALE_LENGTH, parseEvidence } from '../evidence';
import { rootOf } from '../field-readers';
import { SOURCE_REF_STATES, checkSourceRef, resolvePointer } from '../source-ref';

const LOCATION = rootOf('datalake/fixture.json');

function buildEvidence(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    claim_basis: 'catalog_text',
    source_ref: { file: 'datalake/qtara-registrar.json', pointer: '/techniques/QIF-T9001/tara/dsm5/pathway', quote: 'N3 (amygdala)' },
    check_status: 'unchecked',
    rationale: 'The text names the amygdala.',
    ...overrides,
  };
}

describe('parseEvidence', () => {
  it('accepts a block that cites catalog text', () => {
    expect(parseEvidence(buildEvidence(), LOCATION).claim_basis).toBe('catalog_text');
  });

  it.each(['human_status', 'evidence_species'])('rejects "%s", which belongs to anatomical projections only', (key) => {
    expect(() => parseEvidence(buildEvidence({ [key]: 'demonstrated' }), LOCATION))
      .toThrow(new RegExp(`"${key}" describes an anatomical projection`));
  });

  it('rejects an evidence method on a claim that is not from the literature', () => {
    expect(() => parseEvidence(buildEvidence({ evidence_method: 'tracing' }), LOCATION))
      .toThrow(/evidence_method: only a claim whose claim_basis is "literature" has a method/);
  });

  it('requires an evidence method on a literature claim', () => {
    expect(() => parseEvidence(buildEvidence({ claim_basis: 'literature' }), LOCATION)).toThrow(/missing key "evidence_method"/);
    expect(parseEvidence(buildEvidence({ claim_basis: 'literature', evidence_method: 'review' }), LOCATION).evidence_method).toBe('review');
  });

  it('rejects a missing, over-long or multi-line rationale', () => {
    const { rationale: _omitted, ...withoutRationale } = buildEvidence();
    expect(() => parseEvidence(withoutRationale, LOCATION)).toThrow(/missing key "rationale"/);
    expect(() => parseEvidence(buildEvidence({ rationale: 'x'.repeat(MAX_RATIONALE_LENGTH + 1) }), LOCATION)).toThrow(AnatomyDataError);
    expect(() => parseEvidence(buildEvidence({ rationale: 'one\ntwo' }), LOCATION)).toThrow(/rationale: must be one line/);
  });

  it('rejects an unknown claim basis or check status', () => {
    expect(() => parseEvidence(buildEvidence({ claim_basis: 'hunch' }), LOCATION)).toThrow(/"hunch" is not an allowed value/);
    expect(() => parseEvidence(buildEvidence({ check_status: 'verified' }), LOCATION)).toThrow(/"verified" is not an allowed value/);
  });

  it.each([
    ['../secrets.json', 'a parent path'],
    ['/etc/passwd.json', 'an absolute path'],
    ['datalake/notes.md', 'a non-JSON file'],
    ['research/paper/data.json', 'a folder outside the data'],
  ])('rejects a source file of "%s" (%s)', (file) => {
    const sourceRef = { file, pointer: '/a', quote: 'q' };
    expect(() => parseEvidence(buildEvidence({ source_ref: sourceRef }), LOCATION)).toThrow(/source_ref\.file/);
  });

  it('rejects a pointer that does not start at the root', () => {
    const sourceRef = { file: 'datalake/qtara-registrar.json', pointer: 'techniques/0', quote: 'q' };
    expect(() => parseEvidence(buildEvidence({ source_ref: sourceRef }), LOCATION)).toThrow(/source_ref\.pointer/);
  });
});

describe('resolvePointer', () => {
  const document = { techniques: [{ id: 'QIF-T9001', tara: { 'a/b': 'slash', 'c~d': 'tilde' } }], labels: [{ id: '15', name: 'Subthalamic Nucleus' }] };

  it('addresses a list item by its id, never by position', () => {
    expect(resolvePointer(document, '/labels/15/name')).toBe('Subthalamic Nucleus');
    expect(resolvePointer(document, '/labels/0/name')).toBeUndefined();
  });

  it('unescapes ~1 and ~0', () => {
    expect(resolvePointer(document, '/techniques/QIF-T9001/tara/a~1b')).toBe('slash');
    expect(resolvePointer(document, '/techniques/QIF-T9001/tara/c~0d')).toBe('tilde');
  });

  it('does not walk into inherited keys', () => {
    expect(resolvePointer(document, '/constructor/name')).toBeUndefined();
  });
});

describe('checkSourceRef', () => {
  const documents = new Map<string, unknown>([
    ['datalake/qtara-registrar.json', { techniques: [{ id: 'QIF-T9001', tara: { dsm5: { pathway: 'N3 (amygdala) then N4 (hypothalamus/PAG)' } } }] }],
  ]);
  const sourceRef = { file: 'datalake/qtara-registrar.json', pointer: '/techniques/QIF-T9001/tara/dsm5/pathway', quote: 'N3 (amygdala)' };

  it('finds a quote that still appears at its pointer', () => {
    expect(checkSourceRef(sourceRef, documents)).toBe(SOURCE_REF_STATES.QUOTE_FOUND);
  });

  it('reports a quote the text no longer contains', () => {
    expect(checkSourceRef({ ...sourceRef, quote: 'N6 (amygdala)' }, documents)).toBe(SOURCE_REF_STATES.QUOTE_MISSING);
  });

  it('reports a pointer that leads nowhere or to something that is not text', () => {
    expect(checkSourceRef({ ...sourceRef, pointer: '/techniques/QIF-T0000/tara' }, documents)).toBe(SOURCE_REF_STATES.POINTER_UNRESOLVED);
    expect(checkSourceRef({ ...sourceRef, pointer: '/techniques/QIF-T9001/tara' }, documents)).toBe(SOURCE_REF_STATES.POINTER_UNRESOLVED);
  });

  it('reports a file the build did not load', () => {
    expect(checkSourceRef({ ...sourceRef, file: 'datalake/other.json' }, documents)).toBe(SOURCE_REF_STATES.FILE_NOT_LOADED);
  });
});
