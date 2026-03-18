---
paths:
  - "datalake/qtara-registrar.json"
  - "datalake/tara-chains.json"
  - "datalake/qtara/**"
  - "src/lib/threat-data.ts"
---

# Registrar Update Protocol

**When:** New techniques added, fields renamed/added, taxonomy changes, NISS version updates, or any structural change to the TARA registrar.

**This is a large-scale update that touches the entire stack.** Follow this checklist in order:

```
1.  Branch:      git checkout -b feature-name
2.  Tag:         git tag pre-feature-name
3.  Script:      Write migration script (datalake/scripts/migrate-*.py), run --dry-run first
4.  Source:      Update datalake/qtara-registrar.json (source of truth)
5.  Chains:      Update datalake/tara-chains.json if attack chains affected
6.  TypeScript:  src/lib/threat-data.ts > kql-tables.ts > kql-engine.ts > neurogovernance-data.ts
7.  Python:      datalake/qtara/src/qtara/models.py > scripts > SDK > stix.py > cli.py
8.  Precompute:  Run all datalake/scripts/ pipelines (impact chains, DSM mappings)
9.  SDK sync:    Copy registrar to datalake/qtara/src/qtara/data/qtara-registrar.json
10. Pages:       Update Astro pages (atlas/tara/[id].astro, guardrails), API endpoints
11. Components:  Update React dashboard components if new fields need UI
12. Docs:        Changelog, timeline (qif-timeline.json), current whitepaper draft only
13. Taxonomy:    Verify domain x mode matrix has no empty cells (11 domains x 3 modes = 33 cells)
14. Validation:  Run registrar-sync-check workflow locally or via CI
15. Build:       npm run build && npm run type-check
16. Test:        pytest (SDK), KQL queries, API responses, visual check
17. PR:          Single atomic PR with all changes
```

**DO NOT TOUCH during registrar updates:**
- Old blog posts (archived content)
- Old whitepaper versions (`src/pages/research/whitepaper/v*.astro`, `docs/research/whitepaper/`)
- Published DOIs or Zenodo uploads
- Git history

**Key files in dependency order:**
1. `datalake/qtara-registrar.json` — source of truth
2. `src/lib/threat-data.ts` — TypeScript adapter (ThreatVector interface)
3. `src/lib/kql-tables.ts` — KQL table builder (flattens JSON > queryable columns)
4. `src/lib/kql-engine.ts` — KQL engine (field aliases, indexes)
5. `datalake/qtara/src/qtara/models.py` — Python SDK Pydantic models
6. `datalake/scripts/compute-impact-chains.mjs` — precompute pipeline

**Field rename protocol:** When renaming a field (e.g., `attack` > `technique`):
- Keep old field as deprecated alias
- Add KQL field alias in `kql-engine.ts` so old queries still work
- Use fallback pattern everywhere: `t.technique || t.attack`
- New code references new field name only
