import type { APIRoute } from 'astro';
import registry from '../../../datalake/qtara-registrar.json';
import { THREAT_VECTORS, type ThreatVector } from '@/lib/threat-data';
import { STIX_IDENTITY_ID, attackPatternStixId, tacticPhaseName } from '@/lib/stix-ids';

const STIX_SPEC_VERSION = '2.1';
const KILL_CHAIN_NAME = 'qif-tara-tactics';
const OBJECTS_CREATED = '2026-01-01T00:00:00.000Z';
/** The registrar's own timestamp, so repeated builds of the same data give the same bundle. */
const OBJECTS_MODIFIED: string = (registry as { generated?: string }).generated ?? OBJECTS_CREATED;

type StixObject = Record<string, unknown> & { type: string; id: string };

function identityObject(): StixObject {
  return {
    type: 'identity',
    id: STIX_IDENTITY_ID,
    spec_version: STIX_SPEC_VERSION,
    created: OBJECTS_CREATED,
    modified: OBJECTS_MODIFIED,
    name: 'Qinnovate Interface Framework (QIF)',
    identity_class: 'organization',
    sectors: ['technology', 'healthcare', 'research'],
    contact_information: 'https://qinnovate.com',
  };
}

/** Custom properties, omitting ones a technique does not have (matches the SDK). */
function scoringProperties(t: ThreatVector): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    x_qif_severity: t.severity,
    x_qif_severity_source: t.severitySource,
    x_qif_evidence_tier: t.evidence?.tier,
  };
  if (t.nissScored) {
    properties.x_qif_niss_score = t.niss.score;
    properties.x_qif_niss_vector = t.niss.vector;
    properties.x_qif_niss_harm_flag = t.niss.harm_flag;
    properties.x_qif_niss_cognitive_flag = t.niss.cognitive_flag;
    properties.x_qif_niss_np_support = t.niss.np_support;
  }
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined && value !== null));
}

function attackPatternObject(t: ThreatVector): StixObject {
  return {
    type: 'attack-pattern',
    id: attackPatternStixId(t.id),
    spec_version: STIX_SPEC_VERSION,
    created_by_ref: STIX_IDENTITY_ID,
    created: OBJECTS_CREATED,
    modified: OBJECTS_MODIFIED,
    name: t.name,
    description: t.description,
    kill_chain_phases: [{ kill_chain_name: KILL_CHAIN_NAME, phase_name: tacticPhaseName(t.tactic) }],
    external_references: [
      { source_name: 'QIF TARA', external_id: t.id, url: `https://qinnovate.com/atlas/tara/${t.id}` },
    ],
    x_qif_bands: t.bands,
    x_qif_dual_use: t.tara?.dual_use || 'unknown',
    ...scoringProperties(t),
  };
}

export const GET: APIRoute = async () => {
  const enrichedVectors = THREAT_VECTORS.filter((t) => t.enriched);
  const bundle = {
    type: 'bundle',
    id: `bundle--${crypto.randomUUID()}`,
    objects: [identityObject(), ...enrichedVectors.map(attackPatternObject)],
  };

  return new Response(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // NOTE: wildcard CORS is intentional for public data. Do NOT add credentials support without restricting origin.
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
};
