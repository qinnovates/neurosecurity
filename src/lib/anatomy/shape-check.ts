/**
 * A small declarative shape checker. A shape says, for every field of a JSON
 * value, exactly what type it must have; checking a value against it names the
 * first field that differs. Used where a whole document must be held to its
 * type rather than read field by field.
 */

import {
  MAX_NUMBER, childOf, failAt, readRecord, requireBoolean, requireEnum, requireInteger, requireList, requireNumber, requireText, type FieldLocation,
} from './field-readers';
import { requireDate, requireSha256 } from './format-readers';

const POINT_DIMENSIONS = 3;

export type Shape =
  | { kind: 'text'; maxLength: number }
  | { kind: 'boolean' }
  | { kind: 'always_false' }
  | { kind: 'integer'; minimum: number }
  | { kind: 'number'; minimum: number }
  | { kind: 'word'; allowed: readonly string[] }
  | { kind: 'sha256' }
  | { kind: 'date' }
  | { kind: 'point' }
  | { kind: 'nullable'; of: Shape }
  | { kind: 'list'; of: Shape }
  | { kind: 'record'; fields: Readonly<Record<string, Shape>>; optional?: readonly string[] };

export const shapes = {
  text: (maxLength: number): Shape => ({ kind: 'text', maxLength }),
  boolean: { kind: 'boolean' } as Shape,
  /** A flag that nothing may set: it is false or the value is refused. */
  alwaysFalse: { kind: 'always_false' } as Shape,
  integer: (minimum: number): Shape => ({ kind: 'integer', minimum }),
  number: (minimum: number): Shape => ({ kind: 'number', minimum }),
  word: (allowed: readonly string[]): Shape => ({ kind: 'word', allowed }),
  sha256: { kind: 'sha256' } as Shape,
  date: { kind: 'date' } as Shape,
  point: { kind: 'point' } as Shape,
  nullable: (of: Shape): Shape => ({ kind: 'nullable', of }),
  list: (of: Shape): Shape => ({ kind: 'list', of }),
  record: (fields: Readonly<Record<string, Shape>>, optional: readonly string[] = []): Shape => ({ kind: 'record', fields, optional }),
};

function checkPoint(value: unknown, location: FieldLocation): void {
  const isPoint = Array.isArray(value) && value.length === POINT_DIMENSIONS
    && value.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate) && Math.abs(coordinate) <= MAX_NUMBER);
  if (!isPoint) failAt(location, 'expected a point', 'Write three finite numbers: x, y and z in millimetres.');
}

function checkRecord(value: unknown, shape: Extract<Shape, { kind: 'record' }>, location: FieldLocation): void {
  const optional = shape.optional ?? [];
  const required = Object.keys(shape.fields).filter((key) => !optional.includes(key));
  const record = readRecord(value, location, { required, optional });
  for (const [key, fieldShape] of Object.entries(shape.fields)) {
    if (Object.hasOwn(record, key)) checkShape(record[key], fieldShape, childOf(location, key));
  }
}

/** Checks `value`, which sits at `location`, against `shape`. Throws AnatomyDataError naming the first field that differs. */
export function checkShape(value: unknown, shape: Shape, location: FieldLocation): void {
  switch (shape.kind) {
    case 'text': requireText(value, location, shape.maxLength); return;
    case 'boolean': requireBoolean(value, location); return;
    case 'always_false': if (value !== false) failAt(location, 'this flag can only be false', 'Remove the claim; nothing in the data may set it.'); return;
    case 'integer': requireInteger(value, location, shape.minimum); return;
    case 'number': requireNumber(value, location, shape.minimum); return;
    case 'word': requireEnum(value, location, shape.allowed); return;
    case 'sha256': requireSha256(value, location); return;
    case 'date': requireDate(value, location); return;
    case 'point': checkPoint(value, location); return;
    case 'nullable': if (value !== null) checkShape(value, shape.of, location); return;
    case 'list': requireList(value, location).forEach((item, index) => checkShape(item, shape.of, { dataFile: location.dataFile, path: `${location.path}[${index}]` })); return;
    case 'record': checkRecord(value, shape, location); return;
  }
}
