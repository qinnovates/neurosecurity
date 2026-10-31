# components/atlas-scene/ -- The atlas explorer's React and three.js

The island on `/atlas/anatomy/`, its gated 3D view, and the build-time loader of the anatomy data. Recipes and the rules that never bend: `src/lib/anatomy/CONTEXT.md`.

## What lives here
- `load-anatomy-data.ts` -- build time only. The page's one importer of the data files: parses them all, builds the index, the evidence file and the four companions, and answers the six JSON endpoints (`respondWithAtlasJson`). Malformed data throws here and stops the build
- `AtlasExplorer.tsx`, `ExplorerWorkspace.tsx`, `atlas-state.ts`, `explorer-data.ts`, `use-explorer-views.ts`, `use-loaded.ts` -- the island: fetch, check against the page's pin, parse, then state
- `fetch-atlas-json.ts`, `scene-assets.ts`, `use-scene-assets.ts` -- every fetch. Same-site paths only, each checked by length and sha256 before use
- `StructureList.tsx`, `RegionRowButton.tsx`, `RegionInspector.tsx`, `Inspector*.tsx`, `SignalChainRail.tsx`, `ChainView.tsx`, `use-chain-view.ts`, `NetworkNames.tsx`, `H01Card.tsx` -- list, inspector, rail, threat-model steps
- `ColourModePicker.tsx`, `LensPanel.tsx`, `SubjectPicker.tsx`, `LayerPanel.tsx`, `ViewportLegend.tsx`, `ViewportControls.tsx` -- lens, layer and view controls
- `LimitsPanel.tsx`, `LimitNote.tsx`, `LoadNotice.tsx`, `MarkGlyph.tsx`, `Disclosure.tsx` -- limits, load states, lens marks. Review state (`review_state` in the index, `src/lib/anatomy/review-state.ts`) is recorded per row and surfaced once, in `LimitsPanel.tsx`'s "What this page holds" disclosure, not as a per-item mark beside each row
- `AtlasViewport.tsx`, `viewport-gate.ts`, `OpenViewport.tsx`, `ViewportStage.tsx`, `use-viewport-scene.ts` -- the gate: the 3D view opens only on request, and says why when it cannot
- `AtlasCanvas.tsx`, `scene-renderer.ts`, `scene-objects.ts`, `scene-brackets.ts`, `scene-marks.ts`, `device-objects.ts`, `TractLines.tsx` -- the canvas chunk, the only files that may import three.js
- `use-scene-theme.ts` -- the one reader of which surface the page is on. The canvas chunk is handed the answer (`AtlasCanvas`'s `theme` prop, the renderer's `setTheme`) and never asks the document itself; what each surface's inks are lives in `src/lib/atlas-explorer/`
- `DeviceGeometry.tsx`, `LeadFigure.tsx` -- electrode layout controls and the lead figure
- `AtlasRegionView.tsx`, `RegionViewNotes.tsx` -- the one 3D view other pages mount, with its words. A lens decides every fill; a page may add only the visitor's own selection (`selectedRegionIds`, `selectedBandId`), which is marked and never filled
- `RegionViewMount.tsx`, `region-view-mount.css` -- all that ships with a mounting page: the button and its sentences, which come from `src/lib/anatomy/mount-copy.ts`. `RegionViewPanel.tsx`, `atlas-region-mount.css` -- the lazy chunk behind it: reads the page's pin, loads the model, links the styles by address
- `AtlasIndexPin.astro`, `build-index-pin.ts`, `read-index-pin.ts` -- the index pin a mounting page is built with, and how the panel reads it
- `BrainHeroMount.tsx`, `brain-hero-mount.css` -- the homepage's brain: the shell that ships with the page and fetches the chunk as it mounts (no button; the brain is the page's first picture). `BrainHeroPanel.tsx`, `BrainHeroView.tsx`, `BrainHeroSummary.tsx`, `BrainHeroRegionList.tsx`, `brain-hero.css` -- the lazy chunk: reads the pin, loads the model, decides the gate with `viewport-gate.ts`, then mounts `AtlasViewport` open with a summary card beside it whose one link opens the explorer at that region; where the view cannot open, every region as such a link. Its sentences come from `src/lib/anatomy/hero-copy.ts`
- `atlas-deep-link.ts` -- `?region=<id>` on the explorer's address: read once as the model is ready, matched against the index's regions, and handed to `ExplorerWorkspace` as its initial selection
- `use-view-stylesheets.ts` -- links a lazy chunk's stylesheets by address, once per page
- `build-technique-colouring.ts` -- build time only: the limit sentence for a technique whose drafted links colour no shape, which a technique page is built with for its button
- `explorer-companions.ts` -- the files beside the index that load only when opened (quotes, statements, H01 card, threat models); kept out of `explorer-data.ts` so a mount never reaches their parsers
- `atlas-scene.css`, `atlas-chain-devices.css` -- all explorer styles

## Imports
- May import: `src/lib/atlas-explorer/`, `src/lib/anatomy/`, `src/components/brain/AtlasExplorerLink.tsx`, React; three.js in the canvas chunk only. Only `load-anatomy-data.ts` imports data files.
- Imported by: `src/pages/atlas/anatomy.astro`, `src/pages/atlas/attribution.astro` and the six `src/pages/atlas/anatomy-*.json.ts` endpoints. `src/pages/index.astro` imports `BrainHeroMount.tsx` and `AtlasIndexPin.astro` alone. `src/pages/atlas/tara/[id].astro` imports `build-technique-colouring.ts` at build time. The mounts import `RegionViewMount.tsx` alone: `src/components/threat-model/TargetRegionsPanel.tsx`, `src/components/brain/BandViewPanel.tsx`, `src/components/atlas/brainmap/RegionPicker.tsx`, `src/components/atlas/AtlasDashboard.tsx`. No Lab page may reach `load-anatomy-data.ts` except through `AtlasIndexPin.astro` and its import of `build-index-pin.ts`, for the pin alone: the import walk (`src/scripts/tool-page-imports.mjs`) leaves only that one edge unfollowed, holds `build-index-pin.ts` to its exact statements (`INDEX_PIN_STATEMENTS`) and `AtlasIndexPin.astro` to having no `<script>`, and walks into it from any other importer.
- Visitor-facing limit sentences belong in `src/lib/anatomy/limits-copy.ts`, and the button's own in `src/lib/anatomy/mount-copy.ts`, not in a component.

## Derived files
None are committed. `npm run build` writes the six `/atlas/anatomy-*.json` files from `load-anatomy-data.ts`; the page carries only the index's path, length and digest.

## Checks
- `__tests__/explorer-source-rules.test.ts` -- three.js stays in the canvas chunk, no monospace, reduced motion is honoured, the page passes only the pin
- `__tests__/region-view-source-rules.test.ts`, `__tests__/region-view-mount.test.tsx`, `__tests__/region-view-hosts.test.tsx` -- the mounts: no static way to three.js, the selection changes no fill, each page hands over its own list, every fallback
- `__tests__/load-anatomy-data.test.ts` -- `PINNED_ANATOMY_STATE` and the index budget; `__tests__/technique-regions-content.test.ts` -- the technique links' pins
- `__tests__/shared-constants.guard.test.ts` -- facts written in more than one runtime (paths, schema versions, the licence table)
- `__tests__/find-anatomy-payload.test.ts` with `npm run check:anatomy-payload` -- no anatomy data in a built Lab page
- `npm run check:post-build` -- first-load budgets in `src/scripts/tool-pages.mjs`; a real-browser run is `npm run evidence:browser` (not run here; Playwright is not a dependency)
