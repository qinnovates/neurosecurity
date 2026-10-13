import type { APIRoute } from 'astro';
import { loadCompanionJson } from '@/components/atlas-scene/load-anatomy-data';
import { H01_CARD_PATH } from '@/lib/anatomy/parse-h01-card';

/**
 * The card about the H01 sample of human cortex and the sourced facts behind
 * each of its sentences. AI-drafted and AI-checked; no person has reviewed it.
 * Fetched only when a visitor opens the card; malformed data stops the build here.
 * The anatomy index pins this file by length and sha256.
 */
export const GET: APIRoute = () =>
  new Response(loadCompanionJson(H01_CARD_PATH), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
