import type { APIRoute } from 'astro';
import { loadCompanionJson, respondWithAtlasJson } from '@/components/atlas-scene/load-anatomy-data';
import { ATLAS_CHAINS_PATH } from '@/lib/atlas-explorer/chain-file';

/**
 * The curated threat models as the atlas explorer shows them: each model's
 * ordered steps, copied from datalake/tara-chains.json. None is a report of an
 * incident. Fetched only when a visitor asks for the steps; malformed data
 * stops the build here. The anatomy index pins this file by length and sha256.
 */
export const GET: APIRoute = () =>
  respondWithAtlasJson(loadCompanionJson(ATLAS_CHAINS_PATH));
