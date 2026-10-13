import type { APIRoute } from 'astro';
import { loadCompanionJson } from '@/components/atlas-scene/load-anatomy-data';
import { EXPLORER_CATALOG_PATH } from '@/lib/atlas-explorer/explorer-catalog';

/**
 * Band names, each region's description in the atlas file's own words, and the
 * techniques that carry a device-side band. Built once, at build time; the atlas
 * explorer fetches it beside the anatomy index and parses it before use.
 * The anatomy index pins this file by length and sha256.
 */
export const GET: APIRoute = () =>
  new Response(loadCompanionJson(EXPLORER_CATALOG_PATH), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
