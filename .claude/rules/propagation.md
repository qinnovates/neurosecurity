---
paths:
  - "datalake/**"
  - "src/data/**"
  - "src/lib/kql-*.ts"
  - "src/lib/threat-data.ts"
  - "docs/data/**"
---

# Change Propagation Matrix

When a file changes, these downstream files must be updated. Run `npm run health` to detect stale or mismatched data.

## When datalake/*.json changes (any data file)
| Update | How | Automated? |
|--------|-----|-----------|
| docs/data/kql-tables.json | `npm run prebuild` (runs generate-kql-json.mjs) | Yes (prebuild) |
| docs/data/parquet/*.parquet | `npm run prebuild` (runs generate-parquet.py) | Yes (prebuild) |
| docs/data/parquet/catalog.json | `npm run prebuild` (runs generate-parquet.py) | Yes (prebuild) |
| src/lib/kql-tables.ts imports | Add import if new file; update builder function | Manual |
| DataStudioBrowser.tsx DESCRIPTIONS | Add description if new dataset | Manual |

## When datalake/qif-anatomy-*.json, src/site/atlas-assets/manifest.json or a label table changes (TARA Brain Atlas)
| Update | How | Automated? |
|--------|-----|-----------|
| The five `anatomy_*` query tables | `npm run prebuild`. Built by `src/lib/anatomy/anatomy-tables.ts` from the same reviewed rows as the anatomy index; never add a second flattener | Yes (prebuild) |
| datalake/parquet/anatomy_*.parquet and catalog.json | `npm run prebuild` with pyarrow installed, then commit them. `generate-parquet.py` copies the rows the TypeScript builder wrote | Script (`npm test` fails if a committed file differs from a fresh build; `npm run health` fails if a table is missing from the catalog) |
| src/lib/anatomy/load-anatomy-tables.ts | Add the import when the pipeline ships a new label table | Manual (`npm test` fails if it is missing) |
| Data Studio descriptions | None: `src/lib/anatomy/describe-tables.ts` computes every count from the rows | Yes (build) |

Every anatomy table row opens with its review mark, review state, reviewer role and date, a drafter column and `status_sentence` (on `anatomy_structures` the first five are prefixed `mapping_`, because only the mapping is reviewed, and are followed by the shape's own `visual_check_state` and `position_check`). A new anatomy table or column must not state a reading as a fact: a region id goes in `single_region_id` only on a single-region match and in `other_match_region_id` otherwise, and no column name or composed cell may hold a word that reads as an effect (`target`, `affect`, `effect`, `impact`, `attack`, `acts_on`, `hit`, `cause`, `reach`, `coverage`). A new column must be put in one of the two column lists in `src/scripts/find-anatomy-payload.mjs` on purpose: a key marker if only the tables use the name, unmarked if it is an ordinary word. `npm test` enforces all three.

No page is built with anatomy rows in it; they are fetched at run time. Each tool page states `scriptsMayCarryAnatomy` in `src/scripts/tool-pages.mjs`. Where it is false, `npm test` walks the page's source imports with the TypeScript parser and fails if they reach `kql-tables`, an anatomy loader or builder, or an anatomy data file, and `npm run check:post-build` scans every script chunk the page can load for the tables and data files. For every tool page, the walk forbids the generated files (`src/site/data/`, `datalake/parquet/`) and any build-time file read not on its allow-list, and the built HTML is scanned. The Lab's query database leaves the `anatomy_*` tables out.

## When datalake/qtara-registrar.json changes (TARA techniques)
| Update | How | Automated? |
|--------|-----|-----------|
| All of the above, plus: | | |
| datalake/qtara-registrar.json `statistics` | `npm run registrar:stats` (check with `npm run registrar:stats:check`) | Script |
| README.md technique count | Verify technique count references | Manual (npm run health warns) |
| datalake/impact-chains.json | `npm run compute:chains` | Script (`npm test` fails if stale) |
| datalake/qtara/src/qtara/data/ | Copy registrar to SDK data dir | Manual |
| src/lib/threat-data.ts | Verify ThreatVector interface matches | Manual |
| datalake/qif-anatomy-technique-regions.json | When a technique's text or band tags change: re-read it, edit `datalake/scripts/technique-region-curation.json`, run `node datalake/scripts/draft-technique-regions.mjs`. Never hand-edit the data file | Script (`npm test` fails if stale, if a neural-band technique has no entry, or if a quote is gone) |

Region links are AI-drafted and unreviewed. The registrar, the public API, the Python SDK and the STIX export carry no region links until a link has an owner's review in the ledger. They are published only as the `anatomy_technique_terms` table, where every row carries its review state and the quoted catalog text, and as counts in `anatomy_technique_term_summary`, which names no region.

## When datalake/qif-brain-bci-atlas.json or datalake/qif-neural-pathways.json changes
| Update | How | Automated? |
|--------|-----|-----------|
| All datalake/*.json propagation, plus: | | |
| qif-neural-pathways.json `origin_band` / `target_bands` | `npm run derive:pathway-bands` (derived from `brain_regions[].qif_band`; never hand-edit) | Script (`npm test` fails if stale) |
| datalake/impact-chains.json | `npm run compute:chains` | Script (`npm test` fails if stale) |
| qif-brain-bci-atlas.json `region_alias_relations` | Give every new alias exactly one kind (`synonym`, `whole_to_part` or `part_to_whole`) and add it to the pinned table in `datalake/scripts/__tests__/region-resolver.test.mjs`. An alias with no kind stops `compute:chains` and `derive:pathway-bands` and lights no region | Manual (`npm test` fails if missing) |

## When osi-of-mind/QIF-DERIVATION-LOG.md changes
| Update | How | Automated? |
|--------|-----|-----------|
| governance/DECISION-LOG.md | `npm run governance` | Semi-auto (run after commit) |
| governance/TRANSPARENCY.md | `npm run governance` | Semi-auto (run after commit) |
| governance/SHIP-LOG.md | Add entry manually if feature shipped | Manual |
| src/data/qif-timeline.json derivation_log_entries count | `npm run health` warns if stale | Manual |

## When a new page/component is created
| Update | How | Automated? |
|--------|-----|-----------|
| governance/SHIP-LOG.md | Add entry | Manual |
| CHANGELOG.md | Auto-generated on next commit | Yes (changelog workflow) |

## When datalake/eeg-samples.json changes
| Update | How | Automated? |
|--------|-----|-----------|
| All datalake/*.json propagation, plus: | | |
| EEGBrowser.tsx / EEGDatasetCard.tsx | Verify new fields are rendered | Manual |
| src/scripts/process-eeg-to-parquet.py | Add new dataset processing config | Manual |

## When package.json scripts change
| Update | How | Automated? |
|--------|-----|-----------|
| CLAUDE.md Commands section | Update command reference | Manual |
| README.md if command is user-facing | Update documentation | Manual |

## When .claude/rules/*.md changes
| Update | How | Automated? |
|--------|-----|-----------|
| Verify CLAUDE.md references are still valid | Check cross-references | Manual |
| _memory/MEMORY.md if rule affects persistent behavior | Update memory | Manual |
