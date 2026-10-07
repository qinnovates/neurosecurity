# lab-kit: the TARA Lab design system

Everything TARA Lab's screens are built from. The kit page at `/atlas/model/kit/` shows each piece with the catalog's own data.

## Rules that the components enforce

- **Evidence is drawn as solidity, not colour.** `EvidenceMark` reads the catalog's evidence tier first (`src/lib/evidence-tiers.ts`) and falls back to the legacy status. Solid is validated, half is demonstrated, dashed is theoretical, dotted is speculative. A value neither scheme knows is shown under its own word. Never draw evidence any other way.
- **The hatch means "not assessed", and nothing else.** `CoverageMeter`, `FilterChip` and the catalog use it. An empty state must never read as "clean".
- **A filter shows what choosing it would leave.** `FilterChip` always carries a count, or the words "not assessed".
- **Labels are set in the sans face.** `.lab-id` (monospace) is for identifiers, vectors and queries only.
- **Severity is a stripe beside the word**, never a fill behind text.
- **Every motion encodes something in the data.** There is no ambient animation. Motion hooks live in `motion/`; each one respects the reduced-motion setting. Sequences start on the complete picture and never loop.
- **No count is written in a component.** Figures come from the data files at build time or from the device model at run time.

## What is here

| Piece | Use |
|---|---|
| `lab-kit.css` | Tokens for both themes, type roles, panels, tables, chips, buttons, steps |
| `EvidenceMark`, `EvidenceBar` | One technique's evidence; a set split by evidence |
| `SeverityMark`, `CoverageMeter`, `FilterChip`, `Panel` | Marks, coverage, filters, titled regions |
| `DataTable` | Sticky header, sorting, arrow-key rows, rows that re-flow |
| `PlaybackTransport` + `motion/use-sequence-playback` | Anything that plays as steps in order |
| `motion/use-count-transition`, `motion/use-list-reflow`, `motion/use-reduced-motion` | Count changes, list re-flow, the viewer's setting |
| `use-media-query`, `use-is-offscreen` | Layout decisions that CSS alone cannot make |

## Adding to it

A new piece belongs here only if two screens use it. Show it on the kit page with real data, and test its behaviour in `__tests__/`.
