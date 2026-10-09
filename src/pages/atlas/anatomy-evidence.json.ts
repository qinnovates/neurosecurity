import type { APIRoute } from 'astro';
import { loadAnatomyBundle } from '@/components/atlas-scene/load-anatomy-data';

/**
 * The quotes, rationales and licence readings behind the anatomy index. The
 * index pins this file by length and sha256. Licence readings in it were made
 * by AI, not by a lawyer.
 */
export const GET: APIRoute = () =>
  new Response(loadAnatomyBundle().evidenceJson, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
