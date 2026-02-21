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

The canonical source of truth for all 103 TARA techniques is `config.py`. JSON output is generated, not hand-edited. To add or modify techniques:

1. Edit `config.py` in `qif-lab/`
2. Run `python shared/scripts/populate-tara.py`
3. Run `python shared/scripts/recalculate-niss.py`
4. Commit the updated `shared/qtara-registrar.json`

## Links

- Generated registry: [`shared/qtara-registrar.json`](../../shared/qtara-registrar.json)
- TARA website: [qinnovate.com/TARA](https://qinnovate.com/TARA/)
- STIX feed: [qinnovate.com/api/stix.json](https://qinnovate.com/api/stix.json)
- Python SDK: `pip install qtara`

---

*103 techniques, 15 tactics, 8 domains. Apache 2.0.*
