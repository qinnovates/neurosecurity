/**
 * This site's own binary format for tract lines, and its reader. No tract file
 * ships: no tract source is cleared for this site, so the layer is unavailable
 * and this reader has nothing to read outside its tests. It reads this format
 * only; it reads no publisher's or tool's tract format.
 *
 * Layout, little-endian:
 *   bytes 0-3   the ASCII letters "QTRK"
 *   uint32      format version (1)
 *   uint32      number of lines
 *   per line:   uint32 number of points (at least 2), then that many x, y, z
 *               float32 triples, in the atlas's millimetres
 * The file ends exactly where the last line does. A line has points and
 * nothing else: no colour, no weight, no direction and no value per point.
 */

import { AnatomyDataError } from './errors';

export const TRACT_MAGIC = 'QTRK';
export const TRACT_FORMAT_VERSION = 1;
const HEADER_BYTES = 12;
const UINT32_BYTES = 4;
const POINT_BYTES = 12;
const COORDINATES_PER_POINT = 3;
const FEWEST_POINTS = 2;
/** Far beyond any head, in millimetres: a coordinate past this is a broken file, not anatomy. */
const MAX_COORDINATE_MM = 1000;
export const MAX_TRACT_LINES = 200_000;
export const MAX_TRACT_POINTS = 4_000_000;
const TRACT_FILE = 'tract file';

export interface TractLine {
  /** x, y, z per point, in the atlas's millimetres, in the order the line runs. */
  positionsMm: Float32Array;
}

function fail(where: string, problem: string): never {
  throw new AnatomyDataError(TRACT_FILE, where, problem, 'Rebuild the file with the atlas pipeline; nothing is drawn from a file that fails here.');
}

function readHeader(view: DataView): number {
  if (view.byteLength < HEADER_BYTES) fail('header', 'the file is shorter than its header');
  const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (magic !== TRACT_MAGIC) fail('header', 'the file does not start with the letters QTRK, so it is not this site\'s tract format');
  const version = view.getUint32(UINT32_BYTES, true);
  if (version !== TRACT_FORMAT_VERSION) fail('header', `format version ${version} is not one this page reads`);
  const lineCount = view.getUint32(UINT32_BYTES * 2, true);
  if (lineCount > MAX_TRACT_LINES) fail('header', `the file claims ${lineCount} lines, more than the ${MAX_TRACT_LINES} allowed`);
  return lineCount;
}

function readLine(view: DataView, offset: number, lineIndex: number, pointsSoFar: number): TractLine {
  const where = `line ${lineIndex}`;
  if (offset + UINT32_BYTES > view.byteLength) fail(where, 'the file ends before the line begins');
  const pointCount = view.getUint32(offset, true);
  if (pointCount < FEWEST_POINTS) fail(where, 'a line needs at least two points');
  if (pointsSoFar + pointCount > MAX_TRACT_POINTS) fail(where, `the file holds more than the ${MAX_TRACT_POINTS} points allowed`);
  if (offset + UINT32_BYTES + pointCount * POINT_BYTES > view.byteLength) fail(where, 'the file ends before the line does');
  const positionsMm = new Float32Array(pointCount * COORDINATES_PER_POINT);
  for (let at = 0; at < positionsMm.length; at += 1) {
    const value = view.getFloat32(offset + UINT32_BYTES + at * UINT32_BYTES, true);
    if (!Number.isFinite(value) || Math.abs(value) > MAX_COORDINATE_MM) fail(where, 'a coordinate is not a number, or lies far outside any head');
    positionsMm[at] = value;
  }
  return { positionsMm };
}

/**
 * Reads untrusted bytes as tract lines. Every count is checked against the
 * bytes actually present before anything is allocated from it.
 *
 * @throws AnatomyDataError naming the first thing wrong; a file with trailing bytes is refused too
 */
export function decodeTracts(bytes: Uint8Array): TractLine[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const lineCount = readHeader(view);
  const lines: TractLine[] = [];
  let offset = HEADER_BYTES;
  let pointCount = 0;
  for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
    const line = readLine(view, offset, lineIndex, pointCount);
    lines.push(line);
    pointCount += line.positionsMm.length / COORDINATES_PER_POINT;
    offset += UINT32_BYTES + line.positionsMm.byteLength;
  }
  if (offset !== view.byteLength) fail('end of file', 'bytes follow the last line');
  return lines;
}

/**
 * The lines as pairs of end points (x, y, z, x, y, z per piece), each piece
 * joining two neighbouring points of one line. Pieces never join two lines.
 */
export function tractSegments(lines: readonly TractLine[]): Float32Array {
  const pieceCount = lines.reduce((total, line) => total + line.positionsMm.length / COORDINATES_PER_POINT - 1, 0);
  const segments = new Float32Array(pieceCount * COORDINATES_PER_POINT * 2);
  let at = 0;
  for (const { positionsMm } of lines) {
    for (let point = 0; point + COORDINATES_PER_POINT < positionsMm.length; point += COORDINATES_PER_POINT) {
      segments.set(positionsMm.subarray(point, point + COORDINATES_PER_POINT * 2), at);
      at += COORDINATES_PER_POINT * 2;
    }
  }
  return segments;
}
