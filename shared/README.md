# QIF Threat Registry

This folder contains the unified BCI/neural security threat taxonomy using MITRE ATT&CK-compatible identifiers.

## Files

```
shared/
├── threat-registry.json         # 60 techniques, 11 tactics, MITRE-compatible (CURRENT)
├── threat-matrix.json           # DEPRECATED - legacy ONI 24-technique matrix
├── validation/                  # Validation tools
│   ├── bridge.py                # ONI<>QIF validator
│   ├── validate_metadata.py     # Metadata validation
│   └── generate_progress.py     # Progress tracking
└── README.md                    # This file
```

## threat-registry.json (Current)

**60 techniques** across **11 MITRE-compatible tactics**, generated from `config.py` (as-code).

### ID Scheme

| Range | Category | Count |
|-------|----------|-------|
| T2001-T2099 | Signal/Interface attacks | 9 |
| T2100-T2199 | Directed Energy / Frequency-domain | 6 |
| T2200-T2299 | Adversarial ML / Decoder attacks | 8 |
| T2300-T2399 | Neuron-level / Biological attacks | 6 |
| T2400-T2499 | Cognitive / Identity attacks | 10 |
| T2500-T2599 | Infrastructure / Supply chain | 8 |
| T2600-T2699 | Collection / Privacy | 6 |
| T2700-T2799 | Reconnaissance / Profiling | 1 |
| T2800-T2899 | Persistence / Evasion | 6 |

### Tactics

| ID | Name | MITRE Native | Description |
|----|------|:---:|-------------|
| TA0043 | Reconnaissance | Yes | Profiling neural signals, mapping BCI networks |
| TA0001 | Initial Access | Yes | Gaining access to BCI system or neural pathway |
| TA0002 | Execution | Yes | Running attack payload on BCI or neural target |
| TA0003 | Persistence | Yes | Maintaining foothold in BCI/neural system |
| TA0005 | Defense Evasion | Yes | Avoiding detection by classical/quantum sensors |
| TA0009 | Collection | Yes | Harvesting neural data, cognitive states |
| TA0040 | Impact | Yes | Disrupting neural function, physical harm |
| TA0050 | Neural Manipulation | **BCI-specific** | Direct neural state modification |
| TA0051 | Cognitive Exploitation | **BCI-specific** | Exploiting cognitive processes |
| TA0052 | Directed Energy | **BCI-specific** | EM/RF attacks on neural tissue |
| TA0053 | Adversarial ML | **BCI-specific** | Attacking BCI decoder models |

### MITRE Compatibility

- **Technique IDs**: T2001-T2899 (avoids collision with MITRE ATT&CK T1001-T1659)
- **Tactic IDs**: Standard MITRE TA#### where applicable; TA0050-TA0053 for BCI-specific
- **Cross-references**: Each technique includes a `mitre` field linking to relevant ATT&CK techniques

### Usage

```python
import json

with open('threat-registry.json') as f:
    registry = json.load(f)

# All techniques
print(f"{registry['statistics']['total_techniques']} techniques")

# Filter by tactic
execution = [t for t in registry['techniques'] if t['category'] == 'TA0002']

# Filter by status
confirmed = [t for t in registry['techniques'] if t['status'] == 'CONFIRMED']

# Find MITRE cross-references
with_mitre = [t for t in registry['techniques'] if t['mitre']['techniques']]
```

```javascript
// Browser / Node.js
const registry = await fetch('threat-registry.json').then(r => r.json());

// Group by category
const grouped = Object.groupBy(registry.techniques, t => t.category);
```

### Status Levels

| Status | Count | Meaning |
|--------|-------|---------|
| CONFIRMED | 13 | Demonstrated in real BCI systems or documented incidents |
| DEMONSTRATED | 15 | Proven in research/lab settings |
| THEORETICAL | 19 | Physically plausible, not yet demonstrated |
| EMERGING | 13 | Recently identified, under active research |

## threat-matrix.json (DEPRECATED)

> **This file is deprecated.** It contains the legacy ONI-era taxonomy with 24 techniques using ONI-T### identifiers. All entries have been merged into `threat-registry.json` with MITRE-compatible IDs. See the `legacy_ids` field on each technique for the migration mapping.

## Source of Truth

The canonical source is `config.py` in the QIF Lab. The JSON is generated via:

```bash
cd qif-lab && python generate_threat_registry.py
```

Change config.py, re-run the generator, copy to this repo. As-code, single source of truth.

---

*Last updated: 2026-02-06*
