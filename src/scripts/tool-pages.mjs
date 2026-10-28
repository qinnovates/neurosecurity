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
export const LAB_CODE_BASELINE_GZIP_BYTES = 173_337;

/** Room for a registry entry, a capability check and a fallback before the code budget fails. */
export const CODE_HEADROOM_GZIP_BYTES = 8_192;

/**
 * Document: the page's HTML, which carries the catalog data the Lab needs. It grows
 * whenever the technique catalog grows, with no change to any code.
 * To re-baseline: run the same command, copy the gzip figure on the "document" line here,
 * and say in the pull request which data grew.
 */
export const LAB_DOCUMENT_BASELINE_GZIP_BYTES = 62_087;

/** Larger than the code headroom on purpose: a data-only change should rarely need a re-baseline. */
export const DOCUMENT_HEADROOM_GZIP_BYTES = 16_384;

/**
 * The atlas explorer page (/atlas/anatomy/), measured the same way on this branch's build.
 * Code: the page's stylesheets and the explorer island with the parsers it runs on what it fetches.
 * Of the figure, about 30 kB is the explorer itself; the rest is the site stylesheet and React, which
 * every island on the site shares. The 3D view added about 5 kB here: its gate (the button, the WebGL probe and
 * the notices shown when it cannot open) and the check of the index against the page's pin. Everything else of the
 * 3D view, three.js included, is behind the gate and is not part of this figure.
 *
 * Re-pinned from 134_263 by 2_209 when the 3D view was mounted on four other pages. Measured first-load code of this
 * page: 142_136 before, 144_345 after; the room left under the budget is the same 319 bytes as before. What grew:
 * the modules this page shares with those mounts (the gate, the model loader, the limit sentences) are now chunks of
 * their own, and several small files compress worse than one; the limit table gained five sentences for the mounts,
 * and it loads here whole; the gate gained two props. Nothing was moved off this page and no sentence was shortened.
 *
 * Re-pinned again, from 136_472 to 155_481 (the full 8_192 code headroom restored) by three merged slices this
 * check never ran against: T-140's navigation and lens work (selection labels and hover-lift in the 3D view, a
 * lens-description line, the HighlightPicker replacing the old subject picker for techniques and devices, "back
 * to the list"/"back to the 3D view" navigation) and T-186 (NissVectorRadar and NeurorightsRadar mounted in the
 * region inspector's coverage seam, previously an empty div). `npm run check:post-build` could not run on any of
 * it until now -- a Node-version mismatch (`node-version: 22` resolving to 22.23.3 against Astro's `>=22.23.4`
 * requirement) broke every build on this branch and on main since before these landed, so none of them were
 * measured against this budget until the build itself was fixed. All three are real, shipped UI; none of the
 * growth is this session's own homepage hero (a separate page, its own lazy chunk, not loaded here).
 */
export const ATLAS_EXPLORER_CODE_BASELINE_GZIP_BYTES = 155_481;

/**
 * Document: the explorer's HTML carries no data at all (it fetches everything when it starts),
 * so it is only the layout. The headroom is small on purpose: growth here means something was inlined.
 *
 * Re-pinned from 3_513 to 5_317 (the full 1_024 headroom restored) for the same reason and at the same time as
 * the code budget above: the lens-description sentences and the inspector's two new navigation buttons are
 * rendered in the explorer's own markup, not fetched, so they count here too.
 */
export const ATLAS_EXPLORER_DOCUMENT_BASELINE_GZIP_BYTES = 5_317;
export const ATLAS_EXPLORER_DOCUMENT_HEADROOM_GZIP_BYTES = 1_024;

/**
 * @typedef {object} ToolPage
 * @property {string} urlPath site path of the page, ending in "/"
 * @property {string} islandEntryName chunk name of the island the page must hydrate; a page without it measured nothing
 * @property {readonly string[]} onMountLazyEntryNames chunks the page imports by `import()` as it starts.
 *   They and what they import count against the code budget.
 * @property {readonly string[]} interactionGatedEntryNames chunks fetched only after the visitor asks for the
 *   heavy thing behind them. Only these may lead to a library that must stay lazy (three.js). A browser run
 *   (src/scripts/browser-evidence, with --forbid-request) confirms each is not requested before the interaction.
 * @property {readonly string[]} onDemandLazyEntryNames chunks fetched when the visitor goes somewhere else in
 *   the page. Not counted, and they must not lead to three.js.
 * @property {boolean} scriptsMayCarryAnatomy whether the page's scripts are meant to hold anatomy code and data: true for a page
 *   that exists to show the anatomy (the atlas explorer), false for every other page. Where it is false, the built-page check scans
 *   every script the page can load for the anatomy tables and data files, and the source walk (tool-page-imports.mjs) forbids the
 *   anatomy loaders and builders. The page's HTML is scanned for inlined anatomy rows either way, and no page may import the
 *   generated table files: rows are fetched at run time and validated, never built in.
 * @property {number} codeGzipBudgetBytes most gzip bytes of stylesheets and scripts a first visit may download
 * @property {number} documentGzipBudgetBytes most gzip bytes the page's HTML may be
 *
 * Every `import()` the page's scripts can reach must be named in exactly one of the three lists;
 * an unnamed one fails the check, because its bytes would otherwise load unseen.
 * A chunk name is the built file's name without its hash and extension: `ExploreMode` for
 * `/_astro/ExploreMode.4yAgh4jt.js`. The bundler names a chunk after the module that is imported.
 */

/** The three lists that between them must name every `import()` a page can reach. */
export const LAZY_ENTRY_LISTS = ['onMountLazyEntryNames', 'interactionGatedEntryNames', 'onDemandLazyEntryNames'];

/** @type {readonly ToolPage[]} */
export const TOOL_PAGES = [
  {
    urlPath: '/atlas/model/',
    islandEntryName: 'WorkbenchShell',
    // The shell renders one mode at a time (mode-registry.ts). Explore is the default mode, so it loads on every plain visit.
    onMountLazyEntryNames: ['ExploreMode'],
    // The Target regions panel's 3D view. Nothing of it loads until the visitor presses "Show the 3D view" there:
    // then the panel that fetches and checks the atlas data, then the open view, then the canvas with three.js.
    interactionGatedEntryNames: ['RegionViewPanel'],
    // The other modes load when the visitor picks one, by its button or by an address such as "#model".
    onDemandLazyEntryNames: ['ThreatModelStudio', 'MonitorMode', 'QueryMode'],
    // The Lab models a device. It fetches the anatomy index when its atlas view opens and is built with none of it.
    scriptsMayCarryAnatomy: false,
    codeGzipBudgetBytes: LAB_CODE_BASELINE_GZIP_BYTES + CODE_HEADROOM_GZIP_BYTES,
    documentGzipBudgetBytes: LAB_DOCUMENT_BASELINE_GZIP_BYTES + DOCUMENT_HEADROOM_GZIP_BYTES,
  },
  {
    urlPath: '/atlas/anatomy/',
    islandEntryName: 'AtlasExplorer',
    // The explorer's data arrives by fetch. Its one `import()` is the open 3D view, which in turn imports the
    // canvas and three.js. It is fetched when the visitor presses "Show the 3D view", and only after the page has
    // checked that it is pinned to its index, that files can be verified, and that the browser gives a WebGL context.
    onMountLazyEntryNames: [],
    interactionGatedEntryNames: ['OpenViewport'],
    // The electrode layout panel and the lead drawings, in words and SVG: fetched when the visitor turns that layer on.
    onDemandLazyEntryNames: ['DeviceGeometry'],
    // This page exists to show the anatomy: its scripts are meant to hold the anatomy code. Its data still arrives by fetch.
    scriptsMayCarryAnatomy: true,
    codeGzipBudgetBytes: ATLAS_EXPLORER_CODE_BASELINE_GZIP_BYTES + CODE_HEADROOM_GZIP_BYTES,
    documentGzipBudgetBytes: ATLAS_EXPLORER_DOCUMENT_BASELINE_GZIP_BYTES + ATLAS_EXPLORER_DOCUMENT_HEADROOM_GZIP_BYTES,
  },
];

/**
 * Pages outside the tool list that mount the 3D region view (RegionViewMount) under one of their lists. They are
 * ordinary site pages and carry no byte budget. The post-build check holds each to one thing: three.js, and every
 * `import()` that leads to it, can be reached only through the chunk the visitor's button fetches. One technique
 * page stands for all of them, since they are built from one template.
 *
 * @type {readonly { urlPath: string, interactionGatedEntryNames: readonly string[] }[]}
 */
export const REGION_VIEW_PAGES = [
  { urlPath: '/atlas/', interactionGatedEntryNames: ['RegionViewPanel'] },
  { urlPath: '/atlas/clinical/', interactionGatedEntryNames: ['RegionViewPanel'] },
  { urlPath: '/atlas/tara/QIF-T0001/', interactionGatedEntryNames: ['RegionViewPanel'] },
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
