# lab-kit: the TARA Lab design system

Everything TARA Lab's screens are built from. The kit page at `/atlas/model/kit/` shows every token, mark and component in both themes, drawn with the catalog's own data.

## Direction: a quiet instrument

Apple's manner (clarity, deference to content, depth through material, motion that follows the hand) applied to an expert console (persistent filters, dense sortable tables, an inspector beside the work, linked highlighting, keyboard first).

- **Content first.** Chrome is thin and translucent; data is the loudest thing on screen.
- **One accent.** `--lab-select` means "you selected this" and marks links. Red (`--lab-critical`) is for Critical only. Everything else is ink on ground.
- **Evidence is a mark whose solidity grows with certainty.** "Not assessed" is a hatch on a swatch. These two marks are the product's signature and stay monochrome.
- **Depth.** Sticky bars are a translucent material over scrolling content; drawers and popovers float with one soft shadow; panels are flat with a hairline.

## The motion rule

> Nothing moves until the reader does something or the data changes. It then moves once, quickly, never shows a value that is not true, and the still picture already says the same thing.

- Wanted: view and mode changes through `use-view-transition`; the `Drawer` springing in; rows sliding to their new place (`use-list-reflow`); a `SplitBar` share growing from its old width to its new one; linked highlighting (`use-linked-highlight`); playback the reader starts (`use-sequence-playback`).
- Not allowed: anything that repeats at rest; a number counting through values that were never true (`use-count-transition` swaps at once and flags the change); decorative pulses, glows or shimmer.
- Also wanted, and built here: one thumb that slides to the chosen `Segmented` option (`use-slide-marker`, also used for the shell's tab line); the `Drawer` and any `.lab-float` layer leaving in one move (`use-exit-presence`, `use-exit-end`: the layer stays mounted, inert, showing what it last showed, until its `[data-closing]` animation ends); a press (`:active`, scale .97) on buttons, chips and segments.
- View transitions: `.lab-vt-diagram` and `.lab-vt-identity` name the one diagram slot and the one device header a screen draws, so they travel between views instead of cross-fading. A name may be on one element at a time. The rest cross-fades for `--lab-dur-2`.
- Timing: `--lab-dur-flash` (a changed figure stays marked, 420ms) and `--lab-dur-flow` (one pass of flow along a connection, 630ms, with `--lab-ease`). A changed figure is marked only while it is on screen.
- Always: the reduced-motion path. The three duration tokens go to 0ms (the two above follow them) and every keyframe animation, exit, thumb slide and press is switched off, so state still changes and nothing travels.

## Rules the components and tests enforce

- **Contrast is measured, not judged.** `__tests__/token-contrast.test.ts` reads `styles/lab-tokens.css` and fails if any text pair is under 4.5:1 or any control edge under 3:1, in either theme, on each surface and on each translucent fill laid over each surface. `--lab-material-float` (drawer, palette) is measured over each surface and over ink, the selection colour and Critical, since a floating layer does not choose what is under it; that is why it is 94% opaque. Colour tokens are literals for that reason; do not point one at a site variable.
- **The 4px grid.** `.lab` sets 13px text on a 20px line; every rule that sets 12px sets a 16px line; `.lab-title` is 22/28 and `.lab-panel-title` 15/20. Buttons, fields and the segmented track are 28px, chips 24px, table head and rows 32px. A screen does not set its own line-heights. A stylesheet test holds this.
- **Lit is not hover.** `[data-lit="true"]` takes `--lab-lit` and an ink bar on its leading edge; `--lab-zone` is the fill for a lane behind the diagram.
- **Wide things stay inside themselves.** `Segmented` wraps and a chip wraps under 720px; neither can widen its container.
- **44px on a coarse pointer** for every button, select, summary and field inside `.lab` (min-width too for buttons), at a specificity that outranks a screen's single-class rule; field text is 16px there.
- **Paper is light.** The print block repeats the light colour block exactly (tested), whatever the theme on screen. Marks print with their fills.
- **Forced colours.** Pressed, checked, current and selected states take the system highlight; marks are SVG in the text colour.
- **Evidence is drawn one way.** `EvidenceMark` reads the tier through `describeEvidence` and draws one of seven silhouettes (`evidence-steps.ts`): validated, lab, case study, modelled, proposed, speculative, not stated. Never smaller than 12px. The tiers and their words live in `src/lib`; the kit only maps a tier to a drawing.
- **The hatch means "not assessed", and nothing else.** It is a swatch before the words (`HatchSwatch`) or a share of a `SplitBar`, never a pattern behind text. `FilterChip`, `StatTile` and `EmptyState` never print a bare zero or a clean blank for it.
- **Severity is stripe height in ink.** Only the Critical stripe is red. `--lab-caution` is for notice borders, never words.
- **One family, five sizes, weights 400 and 600, nothing under 12px, prose capped at 72ch, sentence case.** `.lab-id` (monospace) is for identifiers and code only.
- **Quieter means a softer colour, never opacity.**
- **No count is written in a component.** Figures come from the data files at build time or from the device model at run time.

## What is here

| Piece | Use |
|---|---|
| `lab-kit.css` → `styles/` | `lab-tokens` (both themes, print reset, aliases), `lab-base`, `lab-controls`, `lab-tables`, `lab-marks`, `lab-overlay`, `lab-motion`, `lab-access` |
| `EvidenceMark`, `EvidenceGlyph`, `EvidenceStepMark`, `EvidenceLegend`, `EvidenceBar` | One technique's evidence (`labelForm` full, short or hidden); the bare silhouette; the legend; a tally of a set |
| `SeverityMark`, `HatchSwatch`, `Legend` | Stripe and word; the not-assessed swatch; what marks mean |
| `SplitBar`, `CoverageMeter`, `StatTile` | A set split into shares with integers printed; placement coverage; one large figure |
| `FacetBar`, `FilterChip`, `Segmented` | One row of facets with "More filters (n)"; a filter that shows what it would leave; a quiet one-of-n control |
| `DataTable` | Sticky head, own or controlled `sort`, arrow-key rows, `openedKey`, `isRowLit` and `onRowPoint` for linked highlight, `renderCard` under 720px, `ref.focusRow(key)`. A column whose sort value runs against its meaning (rank 0 is Critical) sets `isSortValueReversed`, so `aria-sort` and the arrow say what is shown |
| `Drawer` | Right inspector between `--lab-drawer-top` and `--lab-drawer-bottom`; bottom sheet under 720px, capped so its title stays under the bars. Trapped (the default): a modal dialog, and everything outside it is `inert` while it is open. Not trapped: Tab past either end returns to the opener. Escape, focus returned, one exit move |
| `Panel`, `EmptyState`, `TechniqueLink` | Titled region; "not assessed" or why-and-what-to-do; a technique ID that opens it |
| `PlaybackTransport` | Controls for anything that plays as steps |
| `motion/` | `use-view-transition`, `use-linked-highlight`, `use-count-transition`, `use-list-reflow`, `use-sequence-playback`, `use-slide-marker`, `use-exit-presence`, `use-exit-end`, `use-reduced-motion`, `motion-tokens` (the stylesheet's durations for script; tested equal) |
| `contrast.ts`, `use-media-query`, `use-is-offscreen`, `use-row-focus`, `data-table-sort`, `inert-outside` | WCAG arithmetic; layout decisions CSS cannot make; table internals; making the page behind a modal layer inert |

A subtree can be pinned to a theme with `data-lab-theme="light"` or `"dark"`; the kit page uses it to show both.

## Old names, kept for now

`--lab-line-strong`, `--lab-radius`, `--lab-high`, `--motion-quick`, `--motion-move`, `--motion-ease`, `--motion-flow` and `--motion-trace-step` are aliases in `styles/lab-tokens.css` for screens that still use them. `.lab-hatch` now draws a swatch before the content. Remove each when its last use outside the kit is gone.

## Adding to it

A new piece belongs here only if two screens use it. Show it on the kit page with real data, test its behaviour in `__tests__/`, and if it adds a colour pair, add the pair to the contrast test.
