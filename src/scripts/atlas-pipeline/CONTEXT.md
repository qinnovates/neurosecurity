# scripts/atlas-pipeline/ -- Offline pipeline for the atlas assets

Python, run on a developer machine, never in CI. `README.md` is the full description: stages, the registration and its evidence, devices, size classes, what no check can detect. This file adds only what the README does not say. Recipes (re-run: recipe 6) and the rules that never bend: `src/lib/anatomy/CONTEXT.md`.

## What lives here
- `atlas.sh` -- runner; `atlas_build.py` -- entry point; `atlas_pipeline/` -- the stages (layout in `README.md`)
- `registry/pipeline-inputs.json` -- hosts, archive members, pins of the archived registration, build plan. Hand-edited, reviewed
- `registry/buildability.json`, `evidence/registration-evidence.json`, `evidence/build-report.json`, `evidence/device-placement.json` -- written by the pipeline, committed, never edited by hand
- `requirements.txt`, `requirements-dev.txt` -- hash-locked; `tests/` -- pytest on synthetic fixtures

## Imports
- Reads `datalake/qif-anatomy-sources.json`, `datalake/qif-anatomy-verdicts.json`, `datalake/qif-anatomy-review-ledger.json`. Writes `src/site/atlas-assets/` and the landmark and electrode rows of `datalake/qif-anatomy-device-geometry.json`.
- Shares no code with the site. What both must agree on is written twice and held together by `src/components/atlas-scene/__tests__/shared-constants.guard.test.ts` (paths, schema versions, the licence table, licence names, served folders) and by `registry/buildability.json` (the buildability rule's answers, compared with `src/lib/anatomy/licence-rules.ts`).

## Editing rule the README does not state
Every file in `atlas_pipeline/`, plus `atlas_build.py`, `requirements.txt` and `registry/pipeline-inputs.json`, is hashed into `pipeline_code_hash` in `src/site/atlas-assets/manifest.json` (`atlas_pipeline/codehash.py`). Any edit, even a comment, makes `tests/test_manifest_records.py` fail until the pipeline is re-run and the new manifest committed. Do not tidy this code in passing.

## Derived files
| File | Command |
|---|---|
| `src/site/atlas-assets/`, `evidence/build-report.json` | `npm run atlas:build` (not run here) |
| `evidence/device-placement.json`, device geometry rows | `npm run atlas:devices` (not run here) |
| `evidence/registration-evidence.json` | `bash src/scripts/atlas-pipeline/atlas.sh evidence` (not run here) |
| `registry/buildability.json` | `bash src/scripts/atlas-pipeline/atlas.sh buildability` (not run here) |

## Checks
- CI (`.github/workflows/security.yml`, job `audit`): `python -I -m pytest -p no:cacheprovider -rs src/scripts/atlas-pipeline/tests` in a virtual environment installed from `requirements-dev.txt`. Tests that need the imaging stack skip themselves there
- Locally, with the imaging stack: `npm run atlas:test` (not run here)
- `npm test` -- `src/lib/anatomy/__tests__/atlas-assets.guard.test.ts` re-verifies every committed asset against the manifest
