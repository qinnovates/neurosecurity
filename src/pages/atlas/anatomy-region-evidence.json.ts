import type { APIRoute } from 'astro';
import { loadRegionEvidence } from '@/components/atlas-scene/load-anatomy-data';

/**
 * Statements from the literature, each one verbatim quote from one paper, filed
 * under a QIF region. AI-drafted and AI-checked; no person has reviewed them.
 * Fetched only when a visitor opens a region; malformed data stops the build here.
 */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(loadRegionEvidence()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
