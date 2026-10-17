/**
 * The prefix every exported anatomy table's name starts with, alone in its
 * module so that code that runs in a page can tell an anatomy table by name
 * and bundle nothing else about the tables.
 *
 * src/scripts/generate-parquet.py and src/scripts/propagation-check.mjs each
 * hold a copy; a test compares both with this one.
 */
export const ANATOMY_TABLE_PREFIX = 'anatomy_';

export function isAnatomyTableName(name: string): boolean {
  return name.startsWith(ANATOMY_TABLE_PREFIX);
}
