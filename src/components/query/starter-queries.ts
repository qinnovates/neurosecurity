export interface StarterQuery {
  label: string;
  query: string;
  /** True when the query reads the site database, which loads separately from the device tables. */
  needsSiteDatabase: boolean;
}

/** Questions a reviewer is likely to ask first, written in the query language so they can be edited. */
export const STARTER_QUERIES: readonly StarterQuery[] = [
  { label: 'Open risks from the neural catalog', query: 'my_risks | where source == "catalog" | where addressed == false | project threat, part, severity, evidence', needsSiteDatabase: false },
  { label: 'Open critical risks on shared components', query: 'my_risks | where severity == "critical" | where addressed == false | where shared_across_patients == true | project threat, part, evidence', needsSiteDatabase: false },
  { label: 'Risks per part', query: 'my_risks | where source == "catalog" | summarize count() by part', needsSiteDatabase: false },
  { label: 'Chain steps in order', query: 'my_chain_steps | project chain_id, position, role, technique_id, part', needsSiteDatabase: false },
  { label: 'What I must supply for FDA', query: 'my_requirements | where evidence == "user_must_supply" | project title, applicability', needsSiteDatabase: false },
  { label: 'Why techniques were not placed', query: 'placements | where decision == "not_placed" | project id, name, reason', needsSiteDatabase: false },
  { label: 'Catalog coverage', query: 'placements | summarize count() by decision', needsSiteDatabase: false },
  { label: 'My risks with their catalog tactic', query: 'my_risks | where source == "catalog" | join techniques on technique_id == id | project threat, part, tactic, status', needsSiteDatabase: true },
  { label: 'Catalog: critical techniques', query: 'techniques | where severity == "critical" | project id, name, tactic, status', needsSiteDatabase: true },
  { label: 'Devices with over 100 channels', query: 'devices | where channels > 100 | project name, company, type, channels | sort by channels desc', needsSiteDatabase: true },
];
