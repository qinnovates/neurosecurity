import path from 'node:path';

/**
 * The built pages that carry the tool-page promise: nothing a visitor enters leaves the
 * browser, and the first visit stays small. The post-build checks read this list, so
 * holding another page to the same promise is one entry here.
 */

/**
 * A first visit is budgeted in two parts, so that growth in one cannot use the other's room.
 * Both are gzip bytes measured on a build of `main` by `npm run check:lab-budget`.
 *
 * Code: everything a first visit downloads without the visitor doing anything. That is the
 * stylesheets, the static import closure of the page's scripts, and the chunks the page
 * imports as it starts (its default mode). The atlas work must not grow this.
 * To re-baseline: run `npm run build && npm run check:lab-budget`, copy the gzip figure
 * on the "code" line here, and say in the pull request which code grew and why.
 */
export const LAB_CODE_BASELINE_GZIP_BYTES = 115_891;

/** Room for a registry entry, a capability check and a fallback before the code budget fails. */
export const CODE_HEADROOM_GZIP_BYTES = 8_192;

/**
 * Document: the page's HTML, which carries the catalog data the Lab needs. It grows
 * whenever the technique catalog grows, with no change to any code.
 * To re-baseline: run the same command, copy the gzip figure on the "document" line here,
 * and say in the pull request which data grew.
 */
export const LAB_DOCUMENT_BASELINE_GZIP_BYTES = 40_724;

/** Larger than the code headroom on purpose: a data-only change should rarely need a re-baseline. */
export const DOCUMENT_HEADROOM_GZIP_BYTES = 16_384;

/**
 * @typedef {object} ToolPage
 * @property {string} urlPath site path of the page, ending in "/"
 * @property {string} islandEntryName chunk name of the island the page must hydrate; a page without it measured nothing
 * @property {readonly string[]} onMountLazyEntryNames chunk names the page imports by `import()` as it starts; they count as first load
 * @property {readonly string[]} interactionGatedEntryNames chunk names fetched only after the visitor asks; the only
 *   `import()` targets behind which a library that must stay lazy (three.js) may sit
 * @property {number} codeGzipBudgetBytes most gzip bytes of stylesheets and scripts a first visit may download
 * @property {number} documentGzipBudgetBytes most gzip bytes the page's HTML may be
 *
 * A chunk name is the built file's name without its hash and extension: `ExploreMode` for
 * `/_astro/ExploreMode.4yAgh4jt.js`. The bundler names a chunk after the module that is imported.
 */

/** @type {readonly ToolPage[]} */
export const TOOL_PAGES = [
  {
    urlPath: '/atlas/model/',
    islandEntryName: 'WorkbenchShell',
    onMountLazyEntryNames: ['ExploreMode'],
    interactionGatedEntryNames: [],
    codeGzipBudgetBytes: LAB_CODE_BASELINE_GZIP_BYTES + CODE_HEADROOM_GZIP_BYTES,
    documentGzipBudgetBytes: LAB_DOCUMENT_BASELINE_GZIP_BYTES + DOCUMENT_HEADROOM_GZIP_BYTES,
  },
];

export const DEFAULT_DIST_DIRECTORY = 'dist';
const DIRECTORY_INDEX_FILE = 'index.html';

/** Why a post-build check could not do its work, as opposed to a check that ran and found a problem. */
export class ToolPageCheckError extends Error {
  /**
   * @param {'page-not-built' | 'outside-build' | 'bad-argument'} reason
   * @param {string} message what failed and what to do about it
   */
  constructor(reason, message) {
    super(message);
    this.name = 'ToolPageCheckError';
    this.reason = reason;
  }
}

/**
 * Maps a site path to a file under the build directory; a path ending in "/" means its index page.
 * Throws when the path would resolve outside the build directory.
 */
export function resolveBuiltFile(distDirectory, urlPath) {
  const root = path.resolve(distDirectory);
  const relative = urlPath.endsWith('/') ? `${urlPath}${DIRECTORY_INDEX_FILE}` : urlPath;
  const filePath = path.resolve(root, `.${path.posix.normalize(`/${relative}`)}`);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    throw new ToolPageCheckError('outside-build', `"${urlPath}" resolves outside ${distDirectory}; refusing to read it.`);
  }
  return filePath;
}
