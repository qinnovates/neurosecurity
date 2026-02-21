# Shared Data Pipeline Scripts

Python scripts that generate, enrich, and maintain the shared data files in `shared/`.

## Table of Contents

- [Scripts](#scripts)
- [Usage](#usage)

## Scripts

| Script | Description |
|--------|-------------|
| `populate-tara.py` | Generates `qtara-registrar.json` from `config.py`. Canonical source for all 103 TARA techniques, CVSS vectors, NISS scores, and MITRE mappings. |
| `populate-dsm5.py` | Populates DSM-5-TR diagnostic mappings (`qif-dsm-mappings.json`). Maps TARA techniques to psychiatric diagnostic codes. |
| `recalculate-niss.py` | Recalculates NISS (Neural Impact Scoring) values across all techniques. Updates scores in `qtara-registrar.json`. |
| `enrich-neurorights.py` | Adds neurorights metadata to technique entries (cognitive liberty, mental privacy, etc.). |
| `enrich-regulatory.py` | Adds regulatory crosswalk data (FDA, EU MDR, IEC, ISO) to technique entries. |
| `transform-registry.py` | Transforms registry data between formats (JSON restructuring, STIX export prep). |
| `sync-package-data.py` | Syncs generated data into the `qtara/` Python SDK package for PyPI distribution. |

## Usage

All scripts run from the repository root:

```bash
# Regenerate the full TARA registry
python shared/scripts/populate-tara.py

# Recalculate NISS scores after technique changes
python shared/scripts/recalculate-niss.py

# Populate DSM-5-TR mappings
python shared/scripts/populate-dsm5.py

# Enrich with neurorights and regulatory data
python shared/scripts/enrich-neurorights.py
python shared/scripts/enrich-regulatory.py

# Sync to qtara SDK
python shared/scripts/sync-package-data.py
```

The typical pipeline after modifying techniques in `config.py`:

```bash
python shared/scripts/populate-tara.py
python shared/scripts/recalculate-niss.py
python shared/scripts/enrich-neurorights.py
python shared/scripts/enrich-regulatory.py
python shared/scripts/sync-package-data.py
```

---

*Source of truth: `config.py` in qif-lab. Change config, re-run scripts, commit results.*
