# lib/atlas-explorer/ -- What the atlas explorer shows

Pure functions from the anatomy index and the explorer catalog to what a visitor sees: rows, lens values, captions, limit notes, drawing instructions. No React, no three.js, no fetch, no data-file imports. Recipes and the rules that never bend: `src/lib/anatomy/CONTEXT.md`.

## What lives here
- `explorer-catalog.ts`, `catalog-dsm.ts`, `chain-file.ts` -- build-time builders of two published files (`/atlas/anatomy-catalog.json`, `/atlas/anatomy-chains.json`) and the parsers the page runs on them after fetching
- `explorer-model.ts` -- the index and catalog joined into the one model every view reads
- `lens-state.ts`, `region-lens.ts`, `subject-options.ts`, `technique-summary.ts` -- lenses: the kinds, their subjects, each region's value under one
- `region-rows.ts`, `region-detail.ts`, `region-dsm.ts`, `region-evidence-view.ts`, `rail-stages.ts` -- the list, the inspector and the signal-chain rail
- `chain-steps.ts`, `chain-playback.ts` -- a curated threat model as steps over regions and device stages
- `region-view-notes.ts` -- the words beside a 3D view mounted on another page: the visitor's selection, the regions a technique's links name, what has no shape, the limits; and which of them the open picture's caption already says
- `technique-colouring.ts` -- whether a technique's drafted links colour any shape, asked of the style function itself; read at build time for a technique page and by the view for its caption
- `limit-selection.ts`, `viewport-caption.ts`, `announcements.ts` -- which limit sentence, caption and screen-reader text show; the sentences themselves live in `src/lib/anatomy/limits-copy.ts`
- `scene-shapes.ts`, `scene-drawing.ts`, `camera-views.ts`, `slice-plane.ts`, `resolve-pick.ts` -- what the 3D view draws, as plain data: colours, opacities, camera, slice, picking
- `device-drawing.ts`, `devices-layer.ts`, `lead-figure.ts` -- electrode layouts and the lead figure

## Imports
- May import: `src/lib/anatomy/` (types, readers, `src/lib/anatomy/colour-modes.ts`, `src/lib/anatomy/limits-copy.ts`), and from the Lab's library only `src/lib/threat-model/guards.ts`, `src/lib/threat-model/catalog-types.ts` and `src/lib/threat-model/chain-types.ts`.
- Imported by: `src/components/atlas-scene/` and the atlas pages. `src/lib/anatomy/` never imports from here.
- Tests here import `src/components/atlas-scene/load-anatomy-data.ts` (the loader), `src/components/atlas-scene/atlas-state.ts` (`INITIAL_EXPLORER_STATE`) and `src/components/atlas-scene/LayerPanel.tsx` (`LAYER_LABELS`); nothing else does.

## Derived files
None are committed. The two published files above are built by `npm run build` through `src/components/atlas-scene/load-anatomy-data.ts`.

## Checks
- `npm test` -- `__tests__/mapping-coverage.test.ts` (every catalog link is accounted for), `__tests__/chain-steps.test.ts` (pins the curated models), most modules have a test file of the same name
- `src/components/atlas-scene/__tests__/explorer-source-rules.test.ts` -- no three.js import and no monospace face in this directory
- `npm run check:post-build` -- the explorer's first-load budget in `src/scripts/tool-pages.mjs`
