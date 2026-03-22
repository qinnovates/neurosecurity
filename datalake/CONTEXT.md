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
JSON source > prebuild copies to site/data/ > generate-kql-json.mjs > generate-parquet.py
```
Run `npm run prebuild` after any data change. Run `npm run health` to verify sync.

## SDK (qtara/)
The `qtara/` directory is a standalone Python package. Run `pytest` from `datalake/qtara/` to test. SDK data is synced from the root registrar via step 9 of the registrar update protocol.

## Key Files
- `qtara-registrar.json` -- TARA technique registry (source of truth)
- `impact-chains.json` -- Precomputed attack chains (`npm run compute:chains`)
- `eeg-samples.json` -- EEG dataset catalog
- `research-registry.json` -- Structured citation registry (researchers, institutions, standards)
