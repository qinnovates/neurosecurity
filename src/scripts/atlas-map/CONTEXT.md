# scripts/atlas-map/ -- The atlas feature map: one data file, its validator, a lookup and the pages made from it

Start here when changing anything in the TARA Brain Atlas or its framing: `npm run atlas:where -- <words>` prints the files to edit, the commands to run and the checks that must pass. Step-by-step recipes stay in `src/lib/anatomy/CONTEXT.md`; the map points to them.

## What lives here
- `atlas-map.json` -- the source of truth: `modules`, `data`, `checks`, `changes`, `followups`, `provenance`, each a list of records with ids unique across the file. Hand-edited
- `parse-atlas-map.mjs` -- the validator: shapes, ids, references, no dependency cycle, no home paths. Types in `parse-atlas-map.d.mts`
- `check-atlas-map.mjs` -- holds the map to the repository: paths, npm scripts, CI workflow jobs, recipe headings, each module under its map
- `atlas-where.mjs` -- the `npm run atlas:where` lookup
- `render-atlas-docs.mjs` -- writes `docs/atlas/INDEX.md` and `docs/atlas/FOLLOW-UPS.md` (`npm run atlas:docs`); `npm run atlas:docs:check` reports drift
- `load-atlas-map.mjs` -- reads and parses the map from this checkout

## Rules
- Edit `atlas-map.json`, never the two generated pages; then `npm run atlas:docs` and commit both.
- A record whose files live only on an open PR carries `pending_pr`; that alone exempts it from the existence checks. Remove the key when the PR merges.
- A follow-up id is never reused or renumbered. Close one by setting `status` to `done` and naming the PR in `what`.
- Plain Node modules (no build step, no dependency), so the lookup runs in a fresh clone.

## Checks
- `npm test` runs `src/scripts/__tests__/atlas-map.test.mjs` (the map parses and agrees with the repository, and both pages are current) and `src/scripts/__tests__/atlas-where.test.mjs`; CI runs it in `.github/workflows/security.yml` (job `audit`) and `.github/workflows/deploy.yml`.
