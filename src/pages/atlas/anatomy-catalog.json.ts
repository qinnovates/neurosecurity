import type { APIRoute } from 'astro';
import { loadExplorerCatalog } from '@/components/atlas-scene/load-anatomy-data';

/**
 * Band names, each region's description in the atlas file's own words, and the
 * techniques that carry a device-side band. Built once, at build time; the atlas
 * explorer fetches it beside the anatomy index and parses it before use.
 */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(loadExplorerCatalog()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
