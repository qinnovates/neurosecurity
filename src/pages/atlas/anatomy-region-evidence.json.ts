import type { APIRoute } from 'astro';
import { loadCompanionJson } from '@/components/atlas-scene/load-anatomy-data';
import { REGION_EVIDENCE_PATH } from '@/lib/anatomy/region-evidence-types';

/**
 * Statements from the literature, each one verbatim quote from one paper, filed
 * under a QIF region. AI-drafted and AI-checked; no person has reviewed them.
 * Fetched only when a visitor opens a region; malformed data stops the build here.
 * The anatomy index pins this file by length and sha256.
 */
export const GET: APIRoute = () =>
  new Response(loadCompanionJson(REGION_EVIDENCE_PATH), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
