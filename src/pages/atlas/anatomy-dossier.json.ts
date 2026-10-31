import type { APIRoute } from 'astro';
import { loadCompanionJson, respondWithAtlasJson } from '@/components/atlas-scene/load-anatomy-data';
import { REGION_DOSSIER_PATH } from '@/lib/atlas-explorer/dossier-file';

/**
 * What the region dossier shows beyond the index and the catalog, copied from
 * the datalake's own files. Fetched only once a region is opened; malformed data
 * stops the build here. The anatomy index pins this file by length and sha256.
 */
export const GET: APIRoute = () =>
  respondWithAtlasJson(loadCompanionJson(REGION_DOSSIER_PATH));
