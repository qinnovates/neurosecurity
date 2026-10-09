# datalake/ -- Cross-Cutting Data & Tools (Source of Truth)

## Structure
- `*.json` -- Source-of-truth data files (registrar, techniques, EEG samples, impact chains, etc.)
- `qtara/` -- Python SDK (`pip install qtara`). Standalone package with Pydantic models, STIX export, CLI
- `scripts/` -- Data pipeline scripts (TARA, NISS, DSM-5, impact chains precompute)
- `validation/` -- Data validation schemas
- `archive/` -- Deprecated/merged data files

## Source of Truth
`qtara-registrar.json` is the canonical TARA technique registry. All other representations (TypeScript, Python, Parquet, KQL tables) are derived from it. Changes here propagate to the entire stack -- see `.claude/rules/registrar.md` for the full update protocol.

## Pipeline
```
JSON source > prebuild copies to src/site/data/ > generate-kql-json.mjs > generate-parquet.py
```
Run `npm run prebuild` after any data change. Run `npm run health` to verify sync.

## SDK (qtara/)
The `qtara/` directory is a standalone Python package. Run `pytest` from `datalake/qtara/` to test. SDK data is synced from the root registrar via step 9 of the registrar update protocol.

## Key Files
- `qtara-registrar.json` -- TARA technique registry (source of truth)
- `impact-chains.json` -- Precomputed attack chains (`npm run compute:chains`)
- `eeg-samples.json` -- EEG dataset catalog
- `research-registry.json` -- Structured citation registry (researchers, institutions, standards)

## Anatomy files (TARA Brain Atlas)
All anatomy content here is AI-drafted and unreviewed, and licence readings were made by AI, not by a lawyer. The files are parsed at build time by `src/lib/anatomy/` through `src/components/atlas-scene/load-anatomy-data.ts`; a malformed file stops the build.
- `qif-anatomy-sources.json` -- upstream atlas registry: stated licence, files, route to the template space
- `qif-anatomy-verdicts.json` -- licence verdict and clearance record per source. A source builds only if `assessBuildability` in `src/lib/anatomy/licence-rules.ts` says so
- `qif-anatomy-crosswalk.json` -- QIF region, pathway and network ids to atlas label ids, and `no_geometry` records. Rows store no band and no review field
- `qif-technique-regions.json` -- per technique, the catalog's own words for brain structures. Never store what a term resolves to
- `qif-anatomy-review-ledger.json` -- the only record of a review. **Only the repository owner edits it; an agent never writes this file.** An entry counts only while its digest matches; adding one also needs `REVIEWED_ENTRY_COUNTS` in `src/lib/anatomy/review-state.ts` changed
- `qif-device-geometry.json` -- scalp fiducials and lead dimensions with their sources
