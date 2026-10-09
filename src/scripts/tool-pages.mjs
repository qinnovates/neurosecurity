import path from 'node:path';

/**
 * The built pages that carry the tool-page promise: nothing a visitor enters leaves the
 * browser, and the first visit stays small. The post-build checks read this list, so
 * holding another page to the same promise is one entry here.
 */

/**
 * First load of /atlas/model/ in gzip bytes, measured on a build of `main`
 * (HTML, stylesheets, and the static import closure of the island).
 *
 * To re-baseline: run `npm run build && npm run check:lab-budget`, copy the gzip
 * total printed for the page here, and say in the pull request what grew and why.
 * Change this number, not the headroom. The page's HTML carries the catalog data it
 * needs, so growth in that data moves this number too.
 */
export const LAB_FIRST_LOAD_BASELINE_GZIP_BYTES = 153_244;

/** Room for a registry entry, a capability check and a fallback before the budget fails. */
export const FIRST_LOAD_HEADROOM_GZIP_BYTES = 8_192;

/**
 * @typedef {object} ToolPage
 * @property {string} urlPath site path of the page, ending in "/"
 * @property {number} firstLoadGzipBudgetBytes most gzip bytes a first visit may download
 */

/** @type {readonly ToolPage[]} */
export const TOOL_PAGES = [
  { urlPath: '/atlas/model/', firstLoadGzipBudgetBytes: LAB_FIRST_LOAD_BASELINE_GZIP_BYTES + FIRST_LOAD_HEADROOM_GZIP_BYTES },
];

export const DEFAULT_DIST_DIRECTORY = 'dist';
const DIRECTORY_INDEX_FILE = 'index.html';

/**
 * Maps a site path to a file under the build directory; a path ending in "/" means its index page.
 * Throws when the path would resolve outside the build directory.
 */
export function resolveBuiltFile(distDirectory, urlPath) {
  const root = path.resolve(distDirectory);
  const relative = urlPath.endsWith('/') ? `${urlPath}${DIRECTORY_INDEX_FILE}` : urlPath;
  const filePath = path.resolve(root, `.${path.posix.normalize(`/${relative}`)}`);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    throw new Error(`"${urlPath}" resolves outside ${distDirectory}; refusing to read it.`);
  }
  return filePath;
}
