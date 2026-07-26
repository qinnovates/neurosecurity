# TARA Threat Source

Source configurations and proof-of-concept materials for the Therapeutic Atlas of Risks and Applications (TARA).

## Overview

TARA techniques are defined as-code in `config.py` (in `qif-lab/`) and generated into the canonical registry at [`shared/qtara-registrar.json`](../../shared/qtara-registrar.json). This directory holds supplementary source material: technique research and proof-of-concept writeups.

## Structure

```
tara-threat/
└── poc/
    └── 001-transducer-inversion-neural-eavesdropping.md
```

### Proof of Concepts

Each PoC documents a specific technique's feasibility, attack mechanism, and validation status. Named by technique number.

## As-Code Principle

**Correction (2026-07-25):** the workflow below is stale. `qif-lab/` (and `config.py` within it) is archived under `_archive/qif-lab/`; the current generation scripts don't reference it at all. `populate-tara.py` is deprecated — its embedded reference data predates the current 165-technique catalog and the governance/engineering/dsm5 schema, and running it regresses already-enriched techniques (confirmed and reverted 2026-07-25; see its docstring). Adding or modifying techniques currently means editing `datalake/qtara-registrar.json` directly (or the relevant enrichment script's embedded data — `enrich-skeletons.py`, `enrich-regulatory.py`, `enrich-neurorights.py`) and running:

1. `python3 datalake/scripts/recalculate-niss.py` (correctly pathed, safe)
2. `npm run health` to verify consistency
3. Commit the updated `datalake/qtara-registrar.json`

This process itself needs a proper owner-authored rewrite — the note above documents the current known-safe state, not a designed workflow.

<details>
<summary>Original (stale) documented workflow — kept for history, do not follow</summary>

The canonical source of truth for all 165 TARA techniques is `config.py`. JSON output is generated, not hand-edited. To add or modify techniques:

1. Edit `config.py` in `qif-lab/`
2. Run `python shared/scripts/populate-tara.py`
3. Run `python shared/scripts/recalculate-niss.py`
4. Commit the updated `shared/qtara-registrar.json`

</details>

## Links

- Generated registry: [`shared/qtara-registrar.json`](../../shared/qtara-registrar.json)
- TARA website: [qinnovate.com/TARA](https://qinnovate.com/TARA/)
- STIX feed: [qinnovate.com/api/stix.json](https://qinnovate.com/api/stix.json)
- Python SDK: `pip install qtara`

---

*165 techniques, 16 tactics, 8 domains. Apache 2.0.*
