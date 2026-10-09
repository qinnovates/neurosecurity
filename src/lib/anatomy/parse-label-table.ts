/**
 * Parser for a per-atlas label table (src/site/atlas-assets/<folder>/labels-<atlas>.json),
 * written by the offline pipeline. Crosswalk rows may only name label ids that
 * appear in their atlas's table.
 */

import { HEMISPHERES, type AtlasLabel, type LabelTable } from './anatomy-types';
import { childOf, failAt, itemOf, readEnum, readList, readRecord, readString, rejectDuplicates, rootOf, show, type FieldLocation } from './field-readers';
import { readId, readSchemaVersion } from './format-readers';

const LABEL_TABLE_SCHEMA_VERSION = 1;
const LABEL_FILE_PATTERN = /\/labels-([a-z0-9_]+)\.json$/;
const MAX_LABEL_ID_LENGTH = 40;
const MAX_LABEL_NAME_LENGTH = 200;

function parseLabel(value: unknown, location: FieldLocation): AtlasLabel {
  const record = readRecord(value, location, { required: ['id', 'name', 'hemisphere'] });
  return {
    id: readString(record, 'id', location, MAX_LABEL_ID_LENGTH),
    name: readString(record, 'name', location, MAX_LABEL_NAME_LENGTH),
    hemisphere: readEnum(record, 'hemisphere', location, HEMISPHERES),
  };
}

/**
 * @param filePath the table's path from the repository root; its name must agree with the atlas inside
 * @param sourceIds every id in the source registry
 */
export function parseLabelTable(raw: unknown, filePath: string, sourceIds: ReadonlySet<string>): LabelTable {
  const root = rootOf(filePath);
  const record = readRecord(raw, root, { required: ['schema_version', 'atlas', 'labels'] });
  const atlas = readId(record, 'atlas', root);
  if (!sourceIds.has(atlas)) failAt(childOf(root, 'atlas'), `"${atlas}" is not a source in the registry`, 'Add the source to qif-anatomy-sources.json first.');
  const atlasInFileName = LABEL_FILE_PATTERN.exec(filePath)?.[1];
  if (atlasInFileName !== atlas) {
    failAt(childOf(root, 'atlas'), `the file name says "${show(atlasInFileName)}" but the table says "${atlas}"`, 'Name the file labels-<atlas>.json for the atlas it holds.');
  }
  const labels = readList(record, 'labels', root).map((label, index) => parseLabel(label, itemOf(root, 'labels', index)));
  if (labels.length === 0) failAt(childOf(root, 'labels'), 'a label table must list at least one label', 'Regenerate the table with the pipeline.');
  rejectDuplicates(labels.map((label) => label.id), childOf(root, 'labels'), 'label id');
  return { schema_version: readSchemaVersion(record, root, LABEL_TABLE_SCHEMA_VERSION), atlas, labels };
}
