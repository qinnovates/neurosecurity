/**
 * Fails when a built tool page carries anatomy data in its HTML.
 *
 * The anatomy index and its evidence are served as their own static files and fetched
 * by the page when it runs. A page that inlines any of it (in markup, a script or an
 * island's props) ships unreviewed anatomy where no parser checks it and no review mark
 * is guaranteed. This reads what was built; find-anatomy-payload.mjs holds the markers.
 */

import { readFileSync } from 'node:fs';
import { findAnatomyPayload } from './find-anatomy-payload.mjs';
import { DEFAULT_DIST_DIRECTORY, TOOL_PAGES, ToolPageCheckError, resolveBuiltFile } from './tool-pages.mjs';

function readBuiltPage(distDirectory, urlPath) {
  try {
    return readFileSync(resolveBuiltFile(distDirectory, urlPath), 'utf-8');
  } catch (error) {
    if (error instanceof ToolPageCheckError) throw error;
    const detail = error instanceof Error ? error.message : String(error);
    throw new ToolPageCheckError('page-not-built', `Could not read the built page for ${urlPath} (${detail}). Run "npm run build" first.`);
  }
}

/**
 * Checks every listed page in a build directory.
 * Returns one failure per page that carries anatomy data, naming the markers found; empty means all pass.
 * An empty list is a failure. Throws ToolPageCheckError when a listed page was not built.
 */
export function findAnatomyPayloadFailures(distDirectory = DEFAULT_DIST_DIRECTORY, pages = TOOL_PAGES) {
  if (pages.length === 0) return ['no tool pages are listed, so nothing was checked'];
  return pages.flatMap(({ urlPath }) => {
    const markers = findAnatomyPayload(readBuiltPage(distDirectory, urlPath));
    if (markers.length === 0) return [];
    return [`${urlPath}: the page carries anatomy data (found: ${markers.join(', ')}); it must fetch the index when it runs and inline none of it`];
  });
}
