/**
 * The three groups the console's tables are listed under. Every table the Lab can hold is
 * named here once; a test fails if a table is added to the Lab and not placed in a group.
 */

export const SCHEMA_GROUPS = [
  {
    id: 'device',
    label: 'This device',
    tables: ['my_risks', 'my_parts', 'my_links', 'my_chains', 'my_chain_steps', 'my_requirements', 'my_cves', 'placements'],
  },
  { id: 'catalog', label: 'Catalog', tables: ['techniques', 'technique_bands', 'tactics', 'cves', 'attack_chains'] },
  { id: 'specifications', label: 'Published specifications', tables: ['devices', 'hardware_specs', 'comms'] },
] as const;

export type SchemaGroupId = typeof SCHEMA_GROUPS[number]['id'];

/** A table no group names is listed with the catalog, so it can never be hidden. */
const FALLBACK_GROUP_ID: SchemaGroupId = 'catalog';

export function groupOfTable(tableName: string): SchemaGroupId {
  return SCHEMA_GROUPS.find((group) => (group.tables as readonly string[]).includes(tableName))?.id ?? FALLBACK_GROUP_ID;
}

/** The given tables under their groups: in the group's own order first, then any the group does not name, by name. */
export function groupTables(tableNames: readonly string[]): { id: SchemaGroupId; label: string; tables: string[] }[] {
  return SCHEMA_GROUPS.map((group) => {
    const named = (group.tables as readonly string[]).filter((name) => tableNames.includes(name));
    const unnamed = tableNames.filter((name) => groupOfTable(name) === group.id && !named.includes(name)).sort();
    return { id: group.id, label: group.label, tables: [...named, ...unnamed] };
  });
}
