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

## When datalake/qtara-registrar.json changes (TARA techniques)
| Update | How | Automated? |
|--------|-----|-----------|
| All of the above, plus: | | |
| datalake/qtara-registrar.json `statistics` | `npm run registrar:stats` (check with `npm run registrar:stats:check`) | Script |
| README.md technique count | Verify technique count references | Manual (npm run health warns) |
| datalake/impact-chains.json | `npm run compute:chains` | Script (`npm test` fails if stale) |
| datalake/qtara/src/qtara/data/ | Copy registrar to SDK data dir | Manual |
| src/lib/threat-data.ts | Verify ThreatVector interface matches | Manual |

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
