# scripts/ -- Site Scripts & CI Utilities

## Structure
- `prebuild.sh` -- Consolidated prebuild pipeline (copy JSON > generate KQL > generate Parquet > regen governance)
- `verify/` -- Citation & fact verification pipeline
- `generate-kql-json.mjs` -- Transforms datalake JSON into unified KQL table
- `generate-parquet.py` -- Converts JSON datasets to Parquet format
- `update-automation-registry.mjs` -- Syncs automation registry
- `timeline-check.mjs` -- Validates timeline stats (`--fix` to auto-update)
- `compute-impact-chains.mjs` -- Precomputes attack chain relationships
- `version.sh` -- Semantic versioning manager (`major|minor|patch|show`, supports `--dry-run` and `--no-tag`)

## Conventions
- Run `npm run prebuild` (not individual scripts) to ensure correct execution order
- Use `--dry-run` flags before mutating operations
- All scripts should be idempotent -- safe to run multiple times
