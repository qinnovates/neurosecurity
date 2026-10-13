# components/atlas-scene/ -- The atlas explorer's React and three.js

The island on `/atlas/anatomy/`, its gated 3D view, and the build-time loader of the anatomy data. Recipes and the rules that never bend: `src/lib/anatomy/CONTEXT.md`.

## What lives here
- `load-anatomy-data.ts` -- build time only. The page's one importer of the data files: parses them all, builds the index, the evidence file and the four companions, and answers the six JSON endpoints (`respondWithAtlasJson`). Malformed data throws here and stops the build
- `AtlasExplorer.tsx`, `ExplorerWorkspace.tsx`, `atlas-state.ts`, `explorer-data.ts`, `use-explorer-views.ts`, `use-loaded.ts` -- the island: fetch, check against the page's pin, parse, then state
- `fetch-atlas-json.ts`, `scene-assets.ts`, `use-scene-assets.ts` -- every fetch. Same-site paths only, each checked by length and sha256 before use
- `StructureList.tsx`, `RegionRowButton.tsx`, `RegionInspector.tsx`, `Inspector*.tsx`, `SignalChainRail.tsx`, `ChainView.tsx`, `use-chain-view.ts`, `NetworkNames.tsx`, `H01Card.tsx` -- list, inspector, rail, threat-model steps
- `ColourModePicker.tsx`, `LensPanel.tsx`, `SubjectPicker.tsx`, `LayerPanel.tsx`, `ViewportLegend.tsx`, `ViewportControls.tsx` -- lens, layer and view controls
- `LimitsPanel.tsx`, `LimitNote.tsx`, `LoadNotice.tsx`, `ReviewMark.tsx`, `MarkGlyph.tsx`, `Disclosure.tsx` -- limits, load states, the unreviewed mark
- `AtlasViewport.tsx`, `viewport-gate.ts`, `OpenViewport.tsx`, `ViewportStage.tsx`, `use-viewport-scene.ts` -- the gate: the 3D view opens only on request, and says why when it cannot
- `AtlasCanvas.tsx`, `scene-renderer.ts`, `scene-objects.ts`, `scene-marks.ts`, `device-objects.ts`, `TractLines.tsx` -- the canvas chunk, the only files that may import three.js
- `DeviceGeometry.tsx`, `LeadFigure.tsx` -- electrode layout controls and the lead figure
- `AtlasRegionView.tsx` -- the viewport for one region, for embedding; no page uses it yet
- `atlas-scene.css`, `atlas-chain-devices.css` -- all explorer styles

## Imports
- May import: `src/lib/atlas-explorer/`, `src/lib/anatomy/`, React; three.js in the canvas chunk only. Only `load-anatomy-data.ts` imports data files.
- Imported by: `src/pages/atlas/anatomy.astro`, `src/pages/atlas/attribution.astro` and the six `src/pages/atlas/anatomy-*.json.ts` endpoints. No Lab page may reach `load-anatomy-data.ts`.
- Visitor-facing limit sentences belong in `src/lib/anatomy/limits-copy.ts`, not in a component.

## Derived files
None are committed. `npm run build` writes the six `/atlas/anatomy-*.json` files from `load-anatomy-data.ts`; the page carries only the index's path, length and digest.

## Checks
- `__tests__/explorer-source-rules.test.ts` -- three.js stays in the canvas chunk, no monospace, reduced motion is honoured, the page passes only the pin
- `__tests__/load-anatomy-data.test.ts` -- `PINNED_ANATOMY_STATE` and the index budget; `__tests__/technique-regions-content.test.ts` -- the technique links' pins
- `__tests__/shared-constants.guard.test.ts` -- facts written in more than one runtime (paths, schema versions, the licence table)
- `__tests__/find-anatomy-payload.test.ts` with `npm run check:anatomy-payload` -- no anatomy data in a built Lab page
- `npm run check:post-build` -- first-load budgets in `src/scripts/tool-pages.mjs`; a real-browser run is `npm run evidence:browser` (not run here; Playwright is not a dependency)
