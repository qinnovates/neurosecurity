/**
 * Fetches and checks the geometry files the 3D view draws. A file is used only
 * after `verifyAsset` accepts it: the bytes the index pins, in the atlas's own
 * format, holding the shapes the index records. A file that fails is fetched
 * once more past the cache, then refused for good; nothing is drawn from it.
 */

import type { AnatomyIndex, IndexAsset } from '@/lib/anatomy/anatomy-index-types';
import { listExpectedNodes, verifyAsset, type AssetRefusal } from '@/lib/anatomy/asset-integrity';
import type { DecodedNode } from '@/lib/anatomy/decode-glb';
import { AtlasFetchError, fetchAtlasBytes } from './fetch-atlas-json';

export const ATLAS_ASSET_URL_PATH = '/atlas-assets/';

/** `unavailable`: the file could not be fetched. Every other reason is a file that arrived and was refused. */
export type AssetFailureReason = 'unavailable' | AssetRefusal;

export type SceneAssetState =
  | { status: 'loading' }
  | { status: 'ready'; nodes: DecodedNode[] }
  | { status: 'failed'; reason: AssetFailureReason; detail: string };

/** What the visitor is told when a layer's file is not drawn. */
export const ASSET_FAILURE_SENTENCES: Readonly<Record<AssetFailureReason, string>> = {
  unavailable: 'Not drawn: the file could not be fetched.',
  length_mismatch: 'Not drawn: the file is not the one this page was built with. Reload the page.',
  digest_mismatch: 'Not drawn: the file is not the one this page was built with. Reload the page.',
  digest_unavailable: 'Not drawn: this page was not served securely, so the file cannot be checked.',
  not_geometry: 'Not drawn: the file is not a geometry file this page accepts.',
  contents_differ: 'Not drawn: the file holds different shapes from the ones this page expects. Reload the page.',
};

/** Reasons a second fetch past the cache could cure: a stale copy, not a broken file. */
const RETRYABLE: readonly AssetFailureReason[] = ['length_mismatch', 'digest_mismatch', 'contents_differ'];

async function fetchAndVerify(index: AnatomyIndex, asset: IndexAsset, cache: RequestCache, signal: AbortSignal): Promise<SceneAssetState> {
  let bytes: Uint8Array;
  try {
    bytes = await fetchAtlasBytes(`${ATLAS_ASSET_URL_PATH}${asset.path}`, cache, signal);
  } catch (error) {
    if (error instanceof AtlasFetchError) return { status: 'failed', reason: 'unavailable', detail: error.message };
    throw error;
  }
  const verdict = await verifyAsset(bytes, asset, listExpectedNodes(index, asset.id), globalThis.crypto?.subtle);
  return verdict.ok ? { status: 'ready', nodes: verdict.nodes } : { status: 'failed', reason: verdict.refusal, detail: verdict.detail };
}

/** Never throws for a bad or missing file; an aborted load rejects, as fetch does. */
export async function loadSceneAsset(index: AnatomyIndex, asset: IndexAsset, signal: AbortSignal): Promise<SceneAssetState> {
  const first = await fetchAndVerify(index, asset, 'default', signal);
  if (first.status !== 'failed' || !RETRYABLE.includes(first.reason)) return first;
  return fetchAndVerify(index, asset, 'reload', signal);
}
