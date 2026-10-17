import { describe, expect, it } from 'vitest';
import { AnatomyDataError } from '../errors';
import { MAX_TRACT_LINES, TRACT_FORMAT_VERSION, TRACT_MAGIC, decodeTracts, tractSegments } from '../tract-format';

const HEADER_BYTES = 12;

/** Writes the site's tract format. It lives in the tests: no tract file ships, so nothing outside them needs to write one. */
function encodeTracts(lines: ReadonlyArray<ReadonlyArray<readonly [number, number, number]>>, header: { magic?: string; version?: number; lineCount?: number } = {}): Uint8Array {
  const size = HEADER_BYTES + lines.reduce((total, line) => total + 4 + line.length * 12, 0);
  const bytes = new Uint8Array(size);
  const view = new DataView(bytes.buffer);
  [...(header.magic ?? TRACT_MAGIC)].forEach((letter, at) => view.setUint8(at, letter.charCodeAt(0)));
  view.setUint32(4, header.version ?? TRACT_FORMAT_VERSION, true);
  view.setUint32(8, header.lineCount ?? lines.length, true);
  let offset = HEADER_BYTES;
  for (const line of lines) {
    view.setUint32(offset, line.length, true);
    offset += 4;
    for (const coordinate of line.flat()) {
      view.setFloat32(offset, coordinate, true);
      offset += 4;
    }
  }
  return bytes;
}

/** Two invented lines. They are not anatomy: an arc of four points and a straight run of two. */
const SYNTHETIC = [
  [[0, 0, 0], [1, 2, 0], [2, 3, 0], [3, 3, 0]],
  [[-10, 5, 5], [-12, 5, 9]],
] as const;

describe('decodeTracts', () => {
  it('reads a synthetic file back as the lines written, with positions and nothing else', () => {
    const lines = decodeTracts(encodeTracts(SYNTHETIC));
    expect(lines.map((line) => [...line.positionsMm])).toEqual(SYNTHETIC.map((line) => line.flat()));
    expect(lines.map((line) => Object.keys(line))).toEqual([['positionsMm'], ['positionsMm']]);
    expect(decodeTracts(encodeTracts([]))).toEqual([]);
  });

  it('reads a file that sits inside a larger buffer', () => {
    const file = encodeTracts(SYNTHETIC);
    const padded = new Uint8Array(file.byteLength + 16);
    padded.set(file, 8);
    expect(decodeTracts(padded.subarray(8, 8 + file.byteLength))).toHaveLength(2);
  });

  it.each([
    ['another format\'s first letters', encodeTracts(SYNTHETIC, { magic: 'TRAC' })],
    ['a version it does not read', encodeTracts(SYNTHETIC, { version: 2 })],
    ['a header that claims more lines than the file holds', encodeTracts(SYNTHETIC, { lineCount: 3 })],
    ['a header that claims fewer lines than the file holds', encodeTracts(SYNTHETIC, { lineCount: 1 })],
    ['a line count beyond the limit', encodeTracts([], { lineCount: MAX_TRACT_LINES + 1 })],
    ['a file cut short', encodeTracts(SYNTHETIC).subarray(0, 40)],
    ['a file shorter than its header', new Uint8Array(5)],
    ['a line of one point', encodeTracts([[[0, 0, 0]]])],
    ['a coordinate that is not a number', encodeTracts([[[0, 0, 0], [Number.NaN, 0, 0]]])],
    ['a coordinate far outside any head', encodeTracts([[[0, 0, 0], [5000, 0, 0]]])],
  ])('refuses %s', (_case, bytes) => {
    expect(() => decodeTracts(bytes)).toThrow(AnatomyDataError);
  });

  it('refuses a point count that would run past the end, before allocating for it', () => {
    const bytes = encodeTracts(SYNTHETIC);
    new DataView(bytes.buffer).setUint32(HEADER_BYTES, 0xffffffff, true);
    expect(() => decodeTracts(bytes)).toThrow(AnatomyDataError);
  });
});

describe('tractSegments', () => {
  it('joins neighbouring points of one line, and never the end of one line to the start of the next', () => {
    const segments = [...tractSegments(decodeTracts(encodeTracts(SYNTHETIC)))];
    expect(segments).toEqual([0, 0, 0, 1, 2, 0, 1, 2, 0, 2, 3, 0, 2, 3, 0, 3, 3, 0, -10, 5, 5, -12, 5, 9]);
    const pieces = Array.from({ length: segments.length / 6 }, (_unused, at) => segments.slice(at * 6, at * 6 + 6).join());
    expect(pieces).not.toContain([3, 3, 0, -10, 5, 5].join());
  });
});
