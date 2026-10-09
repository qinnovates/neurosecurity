import type { APIRoute } from 'astro';
import { loadH01Card } from '@/components/atlas-scene/load-anatomy-data';

/**
 * The card about the H01 sample of human cortex and the sourced facts behind
 * each of its sentences. AI-drafted and AI-checked; no person has reviewed it.
 * Fetched only when a visitor opens the card; malformed data stops the build here.
 */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(loadH01Card()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
