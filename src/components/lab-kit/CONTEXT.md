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
- Always: the reduced-motion path. The three duration tokens go to 0ms and the kit's two keyframe animations are switched off, so state still changes and nothing travels.

## Rules the components and tests enforce

- **Contrast is measured, not judged.** `__tests__/token-contrast.test.ts` reads `styles/lab-tokens.css` and fails if any text pair is under 4.5:1 or any control edge under 3:1, in either theme, on each surface and on each translucent fill laid over each surface. Colour tokens are literals for that reason; do not point one at a site variable.
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
| `DataTable` | Sticky head, own or controlled `sort`, arrow-key rows, `openedKey`, `isRowLit` and `onRowPoint` for linked highlight, `renderCard` under 720px, `ref.focusRow(key)` |
| `Drawer` | Right inspector; bottom sheet under 720px; focus trapped (or not, `isFocusTrapped`), Escape, focus returned |
| `Panel`, `EmptyState`, `TechniqueLink` | Titled region; "not assessed" or why-and-what-to-do; a technique ID that opens it |
| `PlaybackTransport` | Controls for anything that plays as steps |
| `motion/` | `use-view-transition`, `use-linked-highlight`, `use-count-transition`, `use-list-reflow`, `use-sequence-playback`, `use-reduced-motion`, `motion-tokens` (the stylesheet's durations for script; tested equal) |
| `contrast.ts`, `use-media-query`, `use-is-offscreen`, `use-row-focus`, `data-table-sort` | WCAG arithmetic; layout decisions CSS cannot make; table internals |

A subtree can be pinned to a theme with `data-lab-theme="light"` or `"dark"`; the kit page uses it to show both.

## Old names, kept for now

`--lab-line-strong`, `--lab-radius`, `--lab-high`, `--motion-quick`, `--motion-move`, `--motion-ease`, `--motion-flow` and `--motion-trace-step` are aliases in `styles/lab-tokens.css` for screens that still use them. `.lab-hatch` now draws a swatch before the content. Remove each when its last use outside the kit is gone.

## Adding to it

A new piece belongs here only if two screens use it. Show it on the kit page with real data, test its behaviour in `__tests__/`, and if it adds a colour pair, add the pair to the contrast test.
