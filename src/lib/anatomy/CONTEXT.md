# lib/anatomy/ -- TARA Brain Atlas: data layer and maintainer's map

This is the main map of the atlas stack. The other atlas directories link here for the recipes.

## Rules that never bend
1. Nothing ships whose licence is non-commercial, bars redistribution or is unverified. `licence-rules.ts` decides, never a data file.
2. "AI-drafted, unreviewed" is never removed without a human review. A review exists only as the owner's entry in `datalake/qif-anatomy-review-ledger.json`; an agent never writes that file.
3. No invented anatomy, numbers or citations. Every row quotes its source; an unknown stays unknown.
4. No workstation usernames or absolute home paths in committed files, commit messages or pull-request text.
5. Five files the build rewrites are restored with `git checkout --` after every build: `datalake/parquet/catalog.json`, `datalake/parquet/intel_feed.parquet`, `governance/DECISION-LOG.md`, `governance/TRANSPARENCY.md`, `src/data/external-news-cache.json`. One exception, for which the propagation rule file (propagation.md under .claude/rules, the authority on what is committed after a data change) governs: when an `anatomy_*` parquet file changes, `datalake/parquet/catalog.json` is committed with only that table's entry and `_meta.total_rows` changed (its timestamp and every other entry stay as committed). `__tests__/anatomy-parquet.test.ts` fails unless the committed catalog holds each committed anatomy file's digest, row count and columns.

## The stack
```
datalake/qif-anatomy-*.json + src/site/atlas-assets/   data (untrusted input, parsed at build time)
  -> src/lib/anatomy/            parse, cross-check, build the index and the query tables
  -> src/lib/atlas-explorer/     what the explorer shows, as pure functions of the index
  -> src/components/atlas-scene/ React, three.js, and the page's loader of the data files
  -> src/pages/atlas/anatomy.astro, src/pages/atlas/attribution.astro, six JSON endpoints,
     and the pages that mount the 3D view under a list (recipe 8)
src/scripts/atlas-pipeline/      offline Python: writes src/site/atlas-assets/, never runs in CI
```
Imports point down this list only. Known exceptions, all harmless: tests in the two `lib` directories import `src/components/atlas-scene/load-anatomy-data.ts` (the loader is the composition root), `src/components/atlas-scene/atlas-state.ts` (`INITIAL_EXPLORER_STATE`), `src/components/atlas-scene/LayerPanel.tsx` (`LAYER_LABELS`) and, in `__tests__/anatomy-tables-content.test.ts`, `src/components/bci/anatomy-presets.ts`; `review-state.ts` and `anatomy-index-types.ts` import each other's types.

## What lives here
- `errors.ts`, `field-readers.ts`, `format-readers.ts`, `literature-readers.ts`, `shape-check.ts`, `source-ref.ts` -- the readers every parser is built from; each failure names file, location and fix
- `datalake-files.ts` -- paths of the three catalog files the atlas reads but does not own
- `source-types.ts`, `anatomy-types.ts`, `manifest-types.ts`, `region-evidence-types.ts`, `anatomy-index-types.ts` -- shapes and closed lists (licence ids, verdicts, layers, position checks)
- `parse-*.ts` -- one parser per data file; it names its file's path (`*_FILE`) and holds its schema version
- `licence-rules.ts` -- what each licence permits and the one rule for whether a source may build
- `anatomy-inputs.ts` -- parses every file together and cross-checks them (`parseAnatomyFiles`)
- `crosswalk-rules.ts`, `build-owner-map.ts`, `resolve-region-term.ts`, `addressing-version.ts`, `band-key-scan.ts`, `term-roles.ts`, `lead-spans.ts` -- rules the build applies to rows
- `review-state.ts`, `row-digest.ts`, `review-rows.ts`, `status-sentences.ts` -- review state: computed from the ledger and row digests, never stored in a row
- `build-anatomy-index.ts`, `build-index-*.ts`, `build-anatomy-evidence.ts`, `anatomy-index-schema.ts`, `parse-anatomy-index.ts`, `parse-anatomy-evidence.ts` -- build the two published files, and the checks the page runs on them after fetching
- `build-attribution.ts` -- the attribution page's entries, licence names and required wordings
- `limits-copy.ts` -- every visitor-facing limit sentence. The one home for such text
- `mount-copy.ts` -- the four sentences of the button that asks for the 3D view on another page (what it offers, loading, could not load, where to choose). The home for those; apart from the table because the button ships with the page and the table must not. It imports nothing and the explorer never loads it
- `colour-modes.ts` -- how a shape is drawn under each lens (pure; no colours)
- `decode-glb.ts`, `tract-format.ts`, `ras-to-scene.ts`, `asset-integrity.ts` -- what the browser does to a fetched asset before drawing it
- `asset-guards.ts`, `region-outcome.ts` -- used only by the guard tests
- `anatomy-tables.ts`, `load-anatomy-tables.ts`, `*-table.ts`, `technique-tables.ts`, `table-names.ts`, `table-columns.ts`, `table-prefix.ts`, `describe-tables.ts` -- the `anatomy_*` query tables, built from the same rows as the index

## Imports
- May import: `src/lib/threat-model/guards.ts`, `src/lib/threat-model/catalog-types.ts`, `datalake/scripts/region-resolver.mjs` and `datalake/scripts/region-term.mjs`. No React and no three.js. Only `load-anatomy-tables.ts` imports data files (it is the query tables' loader, with `src/lib/threat-model/build-engine-data.ts`); everything else takes parsed values as arguments.
- Imported by: `src/lib/atlas-explorer/`, `src/components/atlas-scene/`, `src/lib/kql-tables.ts` (the tables only) and the atlas pages.
- No Lab page may reach the loaders, builders or data files: `src/scripts/tool-page-imports.mjs` lists them and fails the build.

## Derived files and the command that regenerates each
| File | Command |
|---|---|
| `datalake/qif-anatomy-technique-regions.json` | `node datalake/scripts/draft-technique-regions.mjs` (source: `datalake/scripts/technique-region-curation.json`) |
| `datalake/impact-chains.json` | `npm run compute:chains` |
| `src/site/atlas-assets/` (meshes, label tables, notices, `src/site/atlas-assets/manifest.json`) | `npm run atlas:build` |
| `datalake/qif-anatomy-device-geometry.json` (landmark and electrode rows only) | `npm run atlas:devices` |
| `src/scripts/atlas-pipeline/registry/buildability.json` | `bash src/scripts/atlas-pipeline/atlas.sh buildability` |
| query tables (git-ignored) and `datalake/parquet/anatomy_*.parquet` | `npm run prebuild` |
| the six `/atlas/anatomy-*.json` files (never committed) | `npm run build` |

## Checks that guard this directory
- `npm test` -- parsers, cross-checks and the guards over committed files: `__tests__/atlas-assets.guard.test.ts`, `__tests__/device-geometry.guard.test.ts`, `__tests__/region-outcome.guard.test.ts`, `__tests__/anatomy-tables-content.test.ts`
- `src/components/atlas-scene/__tests__/shared-constants.guard.test.ts` -- every fact written in more than one language or runtime, with each place it is written
- `__tests__/context-maps.guard.test.ts` -- every path and npm script named in an atlas `CONTEXT.md` exists
- `npm run check:post-build` -- built site serves exactly the manifest's files; attribution wording; no anatomy data in a Lab page; first-load budgets; three.js behind the button on every page that mounts the 3D view
- `npm run type-check`; the pipeline's pytest (see `src/scripts/atlas-pipeline/CONTEXT.md`)

## Recipes
The guard on these maps checks that every path exists, including those after `npx vitest run`; it does not check symbol names.
Each ends with the same gate: `npm test`, `npm run build`, `git checkout --` on the five files of rule 5, `npm run check:post-build`, `npm run type-check` (in a fresh checkout run `npm run build` once first: the type checker needs the generated types). A pinned number that moves is re-pinned on purpose, in the same commit, for the reason written beside it.

### 1. Add or replace an atlas source
1. Read the publisher's licence yourself and quote it. `datalake/qif-anatomy-sources.json`: add the source row (stated licence, files with sha256 pins, route to the template space).
2. `datalake/qif-anatomy-verdicts.json`: add the verdict and clearance record. It is an AI reading; say so. A source with no verdict does not build.
3. Only for a licence id not yet known: add it to `LICENCE_IDS` in `source-types.ts`, `LICENCE_FACTS` in `licence-rules.ts`, `LICENSE_LINKS` in `build-attribution.ts`, `LICENSE_FACTS` in `src/scripts/atlas-pipeline/atlas_pipeline/sources.py`, and, if it can ship, `LICENCE_NAMES` in `src/scripts/atlas-pipeline/atlas_pipeline/notices.py` and `SHIPPING_LICENSE_NAMES` in `src/scripts/check-atlas-assets.mjs`. `src/components/atlas-scene/__tests__/shared-constants.guard.test.ts` fails when `LICENSE_FACTS` in `src/scripts/atlas-pipeline/atlas_pipeline/sources.py` differs from the TypeScript table, or when a licence with a served folder is missing from `LICENCE_NAMES` (the one named exception is `mit`) or from `SHIPPING_LICENSE_NAMES`; `__tests__/build-attribution.test.ts` fails when a name in `SHIPPING_LICENSE_NAMES` differs from the attribution page's.
4. `src/scripts/atlas-pipeline/registry/pipeline-inputs.json`: download host, archive members, build plan. A new kind of input needs a stage in `src/scripts/atlas-pipeline/atlas_pipeline/structures.py`.
5. Run recipe 6. It writes the meshes, the label table, the notices and the manifest.
6. `load-anatomy-tables.ts`: import the new label table and add it to `LABEL_TABLES_BY_PATH` (a test fails until it is there). The page's loader finds it by pattern.
7. Map it: recipe 2. The attribution page needs no edit; it is built from the sources and the manifest.
8. Re-pin in `src/components/atlas-scene/__tests__/load-anatomy-data.test.ts` (`buildableSourceIds`, `structureCount`, `availableLayerIds`) and the asset budget in `__tests__/atlas-assets.guard.test.ts` only if it truly must grow.
Checks: `__tests__/atlas-assets.guard.test.ts`, `__tests__/build-attribution.test.ts`, `src/scripts/atlas-pipeline/tests/test_manifest_records.py`, attribution check in `npm run check:post-build`.

### 2. Add a region or change a region's mapping
1. A new region is a catalog change first: `datalake/qif-brain-bci-atlas.json`, under the registrar update protocol. The atlas does not own that file.
2. `datalake/qif-anatomy-crosswalk.json`: add or edit the row (region, pathway or network id to atlas label ids), or a `no_geometry` record. Quote the label table. A row stores no band and no review field.
   - `rationale` is one line of at most 200 characters. `source_ref` may cite only a JSON file in this repository (under `datalake/` or `src/site/atlas-assets/`), so a paper is cited in the rationale as a bare PMID, resolved and read first (rule 3).
   - A subject draws from one atlas only. A row for it on a second atlas sets `draws` to false; it still makes the subject an owner of that shape. A subject has drawing rows or a `no_geometry` record, never both.
   - When two subjects name one label, say so in both rationales.
   - `contains` (parent, child) has effects beyond the file: every shape of the parent lists the child as lying somewhere inside it, every shape of the child lists the parent, and picking the child's shape then selects the shape, not the region. The existing example is thalamus over ant and vim.
3. Nothing else is edited by hand: owners, geometry state, review state and the index are computed. An edited row gets a new digest and loses any review it had.
4. Re-pin what moved. In `__tests__/region-outcome.guard.test.ts`: `REGION_COUNT`, `OWN_SHAPE_COUNT`, `CONTAINED_REGION_IDS`, `NAMED_STAND_IN_REGION_IDS`, `NO_BOUNDARY_REGION_IDS`, `NO_GEOMETRY_REGION_IDS`, `MARKER_ONLY_REGION_IDS`, and the counts written in two test titles ("is N with a shape of their own, N contained and N with none"; "... or there is no boundary at all: N and N"). In `src/components/atlas-scene/__tests__/load-anatomy-data.test.ts`: `structureCount`, `noGeometryRegionIds`, `regionGeometryStates`.
5. `npm run prebuild` rewrites `datalake/parquet/anatomy_crosswalk.parquet` and `datalake/parquet/anatomy_structures.parquet`; commit them with their two entries in `datalake/parquet/catalog.json` (rule 5).
Checks: `__tests__/parse-crosswalk.test.ts`, `__tests__/region-outcome.guard.test.ts`, `__tests__/anatomy-tables-content.test.ts`, `src/lib/atlas-explorer/__tests__/mapping-coverage.test.ts`.

### 3. Add a lens (colour mode)
Edit in this order. The type checker names every exhaustive switch (`src/lib/atlas-explorer/lens-state.ts`, including `lensNeedsSubject`, `colour-modes.ts`, `src/lib/atlas-explorer/region-lens.ts`, `src/lib/atlas-explorer/limit-selection.ts`).
1. `src/lib/atlas-explorer/lens-state.ts` -- `LENS_KINDS`, the `Lens` union, `LENS_LABELS`
2. `colour-modes.ts` -- the `ColourMode` it maps to and how a shape reads under it
3. `src/lib/atlas-explorer/region-lens.ts` -- each region's value and standing under the lens
4. `src/lib/atlas-explorer/subject-options.ts` -- its subjects, if it has a picker
5. `limits-copy.ts` then `src/lib/atlas-explorer/limit-selection.ts` -- the sentence saying what the lens cannot tell you, and when it shows. Then `npx vitest run src/lib/anatomy/__tests__/limits-copy.test.ts -u` and read the snapshot diff.
6. `src/lib/atlas-explorer/viewport-caption.ts`, `src/lib/atlas-explorer/announcements.ts` -- caption and screen-reader text
7. `src/lib/atlas-explorer/scene-shapes.ts` -- colours, only if it needs new ones
8. `src/components/atlas-scene/atlas-state.ts`, `src/components/atlas-scene/LensPanel.tsx`, `src/components/atlas-scene/ExplorerWorkspace.tsx` -- state and controls. `src/components/atlas-scene/ColourModePicker.tsx` and `src/components/atlas-scene/ViewportLegend.tsx` read the lists and usually need nothing
Checks: `__tests__/limits-copy.test.ts`, `__tests__/colour-modes.test.ts`, `src/lib/atlas-explorer/__tests__/region-lens.test.ts`, `src/lib/atlas-explorer/__tests__/limit-selection.test.ts`, `src/components/atlas-scene/__tests__/explorer-source-rules.test.ts` (no three.js outside the canvas chunk, no monospace), code budget in `src/scripts/tool-pages.mjs`.

The explorer's first-load code budget (`src/scripts/tool-pages.mjs`) has under 350 bytes of gzip headroom. A real new lens will probably need code moved behind the interaction-gated chunks or a deliberate, stated re-pin of the budget. Never shorten a limit sentence, qualifier or review mark to fit.

### 4. Add a device (lead or electrode layout)
- A lead: add the row and its sourced facts by hand to `datalake/qif-anatomy-device-geometry.json`. Every dimension cites a source and a verbatim quote; a lead has sizes and no position. Add its contact span to `LEAD_CONTACT_SPANS_MM` in `__tests__/device-geometry.guard.test.ts`. If the row has a new field: `parse-device-geometry.ts`, `lead-spans.ts`, `src/lib/atlas-explorer/lead-figure.ts`.
- An electrode layout: positions come from the pipeline, never by hand. Define it beside `src/scripts/atlas-pipeline/atlas_pipeline/layout_1020.py`, place it in `src/scripts/atlas-pipeline/atlas_pipeline/electrodes.py`, then `npm run atlas:devices` (not run here) rewrites the landmark and electrode rows and `src/scripts/atlas-pipeline/evidence/device-placement.json`. If the shape changes: `parse-electrode-layouts.ts`, `build-index-devices.ts`, `src/lib/atlas-explorer/device-drawing.ts`.
- Any pipeline `.py` edit changes the code hash: finish with recipe 6.
Checks: `__tests__/parse-device-geometry.test.ts`, `__tests__/device-geometry.guard.test.ts`, `src/scripts/atlas-pipeline/tests/test_lead_rows.py`, `src/scripts/atlas-pipeline/tests/test_layout_checks.py`.

### 5. Refresh the technique links after a registrar update
1. `node datalake/scripts/draft-technique-regions.mjs --check` -- says whether the data file is stale against the curation record.
2. `node datalake/scripts/audit-technique-regions.mjs` -- prints what every term resolves to and every mention read and not linked. `--candidates <technique id>` lists one technique's mentions.
3. An AI re-drafts `datalake/scripts/technique-region-curation.json` for new and changed techniques: the catalog's own words only, each with a role or a reason from the closed lists. It stores no resolved region.
4. `node datalake/scripts/draft-technique-regions.mjs` rewrites `datalake/qif-anatomy-technique-regions.json`. Never edit that file by hand.
5. Recomputed, not typed: what each term resolves to, the technique scopes, the index, `anatomy_technique_terms` and its summary table.
6. Labelling: the file's status sentence (`status-sentences.ts`) and every row's review state stay "AI-drafted, unreviewed". A changed row loses any review it had.
7. Pins that move: every `EXPECTED_*` in `src/components/atlas-scene/__tests__/technique-regions-content.test.ts`; `techniqueScopes` in `src/components/atlas-scene/__tests__/load-anatomy-data.test.ts`; `PINNED_CHAIN_STATE` in `src/lib/atlas-explorer/__tests__/chain-steps.test.ts` if `datalake/tara-chains.json` changed.
8. `npm run prebuild`; commit `datalake/parquet/anatomy_technique_terms.parquet` and `datalake/parquet/anatomy_technique_term_summary.parquet`.

### 6. Re-run the pipeline
Full detail: `src/scripts/atlas-pipeline/README.md`. None of these commands was run when this map was written; they need the offline cache.
1. Environment: `ATLAS_CACHE_DIR` (downloads, archived transform, review sheets; outside git) and `ATLAS_VENV_DIR`. Defaults are in the README.
2. Commit pipeline and registry changes first: the build refuses a dirty tree so the code hash names a real state.
3. `npm run atlas:fetch`, then `npm run atlas:build`, then `npm run atlas:devices`.
4. Expected output, as `src/scripts/atlas-pipeline/atlas_pipeline/manifest.py` states it: a second run on unchanged inputs changes nothing, so `git status` shows nothing under `src/site/atlas-assets/`. After a code-only change the manifest's `pipeline_code_hash` and fingerprints change; a mesh, label table or notice whose bytes change needs an explanation before it is committed. This was not verified when the map was written.
5. When the code hash changes (any edit to `src/scripts/atlas-pipeline/atlas_pipeline/`, `src/scripts/atlas-pipeline/requirements.txt` or `src/scripts/atlas-pipeline/registry/pipeline-inputs.json`): `src/scripts/atlas-pipeline/tests/test_manifest_records.py` fails until the pipeline is re-run and the new manifest committed. Never type a hash into the manifest.
6. A file whose bytes change gets a new name (its digest prefix). Look at the review sheets in the cache before committing. The archived registration is never recomputed silently.
7. `bash src/scripts/atlas-pipeline/atlas.sh buildability` after any licence or verdict change.

### 7. Full data refresh
Regenerate in this order; each step reads what the one before wrote.
1. Catalog files, under the registrar protocol (`datalake/qtara-registrar.json`, `datalake/qif-brain-bci-atlas.json`, `datalake/qif-neural-pathways.json`, `datalake/tara-chains.json`).
2. `npm run compute:chains` -- `datalake/impact-chains.json`.
3. Recipe 5 -- technique links. Recipe 2 for any new region. Recipe 6 only if sources, the build plan or pipeline code changed.
4. `npm run prebuild` -- query tables, then parquet from them. `npm run health` reports what is out of sync.
5. `npm run build` -- index, evidence, catalog, chains, region evidence and H01 card, each pinned by the index; then `git checkout --` the five files of rule 5 (keeping the catalog's anatomy entries if step 4 changed an anatomy parquet file).
6. `npm run check:post-build`.

Pins that a refresh can move. Nothing else in the atlas stack is a typed count or hash.
| Pin | File |
|---|---|
| `PINNED_ANATOMY_STATE`, `INDEX_BUDGET_BYTES` | `src/components/atlas-scene/__tests__/load-anatomy-data.test.ts` |
| every `EXPECTED_*` | `src/components/atlas-scene/__tests__/technique-regions-content.test.ts` |
| `PINNED_CHAIN_STATE` | `src/lib/atlas-explorer/__tests__/chain-steps.test.ts` |
| `REGION_COUNT`, `OWN_SHAPE_COUNT`, the five `*_REGION_IDS` lists, two test titles | `__tests__/region-outcome.guard.test.ts` |
| `TOTAL_ASSET_BUDGET_BYTES` | `__tests__/atlas-assets.guard.test.ts` |
| `HEAD_SURFACE_BUDGET_BYTES`, `LEAD_CONTACT_SPANS_MM` | `__tests__/device-geometry.guard.test.ts` |
| `REVIEWED_ENTRY_COUNTS` (owner only, with a ledger entry) | `review-state.ts` |
| `PINNED_ALIAS_KINDS` | `datalake/scripts/__tests__/region-resolver.test.mjs` |
| `ATLAS_EXPLORER_*_GZIP_BYTES`, `REGION_VIEW_PAGES` | `src/scripts/tool-pages.mjs` |
| asset sha256 values, `pipeline_code_hash` (written by the pipeline only) | `src/site/atlas-assets/manifest.json` |

To print the new values: `npx vitest run src/components/atlas-scene/__tests__ src/lib/anatomy/__tests__ src/lib/atlas-explorer/__tests__ datalake/scripts/__tests__` shows expected against received for each pin that moved, and, after a build, `npm run check:lab-budget` prints each tool page's measured first-load bytes beside its budget.

### 8. Mount the region view on a page
One component, `src/components/atlas-scene/RegionViewMount.tsx`, configured by props. Never copy the camera, colours, sentences or fetching into a page.
1. In the page's `.astro` file: import `src/components/atlas-scene/AtlasIndexPin.astro` and place `<AtlasIndexPin />` once. Without it the view says the page is unpinned and draws nothing.
2. In the React component that holds the page's list: `<RegionViewMount lens={...} />`. `lens` (a `Lens` from `src/lib/atlas-explorer/lens-state.ts`, or `BAND_LENS`) decides every fill, from the data. The visitor's own choice goes in `selectedRegionIds` or `selectedBandId`: it is marked with corner brackets, never filled, and worded as the visitor's choice. `onRegionPick` tells the page which region was picked. There is no prop for a list of regions to fill; need something else, add a prop to `src/components/atlas-scene/AtlasRegionView.tsx`, do not fork it. A page that passes `onRegionPick` is taken to keep the choice in a list of its own: with nothing chosen, the button and the view then tell the visitor to choose there. A technique page also passes `nothingColoured`, read in its `.astro` file from `src/components/atlas-scene/build-technique-colouring.ts`: the limit sentence for a technique whose links colour no shape, chosen at build time from the same index by the same function as the view's caption (`src/lib/atlas-explorer/technique-colouring.ts`). The button shows it; the view is not handed it.
3. Import nothing else from `src/components/atlas-scene/` in the page or the list: the button is all that ships with the page. The data, `src/components/atlas-scene/RegionViewPanel.tsx`, the open view and three.js load after the button is pressed.
4. Declare the chunk in `src/scripts/tool-pages.mjs`: for a tool page add `'RegionViewPanel'` to its `interactionGatedEntryNames`; for any other page add an entry to `REGION_VIEW_PAGES`. Add the page to `MOUNTS` in `src/components/atlas-scene/__tests__/region-view-source-rules.test.ts`.
5. A new sentence goes in `limits-copy.ts` and is chosen in `src/lib/atlas-explorer/region-view-notes.ts`; then update the snapshot as in recipe 3. Every sentence added there also loads on the explorer's first visit. A sentence of the button's own, shown before anything is fetched, goes in `mount-copy.ts` (it loads on every mounting page's first visit, so keep it to what the button needs); the same test holds its snapshot. A limit sentence the button must show is built into the page as a prop instead, as `nothingColoured` is, and stays in `limits-copy.ts`. What the open picture's caption already says is left out of the notes beside it (`withoutCaptionCopies`), so write a sentence once and let both choose it.
6. Budget: after a build, `npm run check:lab-budget` for the tool pages and `node src/scripts/measure-lab-first-load.mjs --page /your/page/ --gate RegionViewPanel` for another page. It must print "three.js reachable without the visitor asking: no".
Checks: `src/components/atlas-scene/__tests__/region-view-source-rules.test.ts`, `src/components/atlas-scene/__tests__/region-view-mount.test.tsx`, `src/components/atlas-scene/__tests__/region-view-hosts.test.tsx`, `src/components/atlas-scene/__tests__/region-view-open.test.tsx`, `src/lib/atlas-explorer/__tests__/region-view-notes.test.ts`, `src/lib/atlas-explorer/__tests__/technique-colouring.test.ts`, `src/scripts/__tests__/tool-page-imports.test.mjs`, `src/scripts/__tests__/tool-page-index-pin.test.mjs`, and in `npm run check:post-build` the budgets, "no tool page is built with anatomy data in it" and "pages that mount the 3D view keep three.js behind its button". Look at the page in a browser, with WebGL on and off.
