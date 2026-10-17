/**
 * What the tests of the mounted 3D view share: the data the site serves, a
 * `fetch` that answers with it (geometry files included), and the index pin a
 * mounting page carries. No test reaches a network.
 */

import fs from 'node:fs';
import path from 'node:path';
import { vi } from 'vitest';
import { loadRealModel } from '@/lib/atlas-explorer/__tests__/explorer-fixtures';
import { loadAnatomyBundle } from '../load-anatomy-data';
import { INDEX_PIN_ATTRIBUTE } from '../read-index-pin';
import { buildServedFiles, type ServedFile } from './explorer-test-server';

const ASSET_ROOT = 'src/site/atlas-assets';
const NOT_FOUND = 404;

export const model = loadRealModel();
export const bundle = loadAnatomyBundle();
const assetBytes = new Map(model.index.assets.map((asset) => [`/atlas-assets/${asset.path}`, new Uint8Array(fs.readFileSync(path.join(ASSET_ROOT, asset.path)))]));

/** Serves the site's data files and geometry, or whatever a test puts in their place. Returns the addresses asked for, as they are asked. */
export function serveSite(overrides: Record<string, ServedFile> = {}): string[] {
  const files = { ...buildServedFiles(), ...overrides };
  const fetchLog: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    fetchLog.push(String(input));
    const bytes = assetBytes.get(String(input));
    if (bytes !== undefined) return new Response(bytes as BodyInit);
    const served = files[String(input)] ?? { status: NOT_FOUND };
    return typeof served === 'string' ? new Response(served) : new Response('', { status: served.status });
  }));
  return fetchLog;
}

/** Puts the index pin in the document, as AtlasIndexPin.astro does on a page that mounts the view. */
export function writePin(): void {
  const holder = document.createElement('div');
  holder.hidden = true;
  holder.setAttribute(INDEX_PIN_ATTRIBUTE, JSON.stringify(bundle.indexPin));
  document.body.append(holder);
}
