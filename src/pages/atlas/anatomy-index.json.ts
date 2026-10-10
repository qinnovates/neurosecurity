import type { APIRoute } from 'astro';
import { loadAnatomyBundle } from '@/components/atlas-scene/load-anatomy-data';

/**
 * The anatomy index: ids, owners, review state and asset pins. Built once, at
 * build time; malformed anatomy data stops the build here. A page that uses it
 * is built with this file's length and sha256 and checks them before reading it.
 */
export const GET: APIRoute = () =>
  new Response(loadAnatomyBundle().indexJson, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
