# scripts/ -- Site Scripts & CI Utilities

## Structure
- `prebuild.sh` -- Consolidated prebuild pipeline (copy JSON > generate KQL > generate Parquet > regen governance)
- `verify/` -- Citation & fact verification pipeline
- `generate-kql-json.mjs` -- Transforms datalake JSON into unified KQL table
- `generate-parquet.py` -- Converts JSON datasets to Parquet format
- `update-automation-registry.mjs` -- Syncs automation registry
- `timeline-check.mjs` -- Validates timeline stats (`--fix` to auto-update)
- `compute-impact-chains.mjs` -- Precomputes attack chain relationships
- `tool-pages.mjs` -- The built pages held to the tool-page promise, with each page's island, its lazy chunks by class (on-mount, interaction-gated, on-demand) and its two first-load budgets (code; document)
- `first-load-closure.mjs` -- Finds a built page's entries and walks the import graph of its JavaScript
- `built-html.mjs` -- Reads tag attributes and blanks inert content in built HTML, for the post-build checks
- `check-post-build.mjs` -- Runs every check that needs `dist/` (`npm run check:post-build`): `check-model-page.mjs` (isolation, policy by equality) and `measure-lab-first-load.mjs` (first-load budgets; three.js only behind a named interaction gate)
- `browser-evidence/` -- Real-browser evidence run for a pull request: a Playwright driver (Playwright is not a dependency) and the manual checklist
- `version.sh` -- Semantic versioning manager (`major|minor|patch|show`, supports `--dry-run` and `--no-tag`)

## Conventions
- Run `npm run prebuild` (not individual scripts) to ensure correct execution order
- Use `--dry-run` flags before mutating operations
- All scripts should be idempotent -- safe to run multiple times
