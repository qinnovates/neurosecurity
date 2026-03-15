# qtara

**Threat Analysis & Risk Assessment (TARA)** framework for Neural Security.

The `qtara` package provides programmatic access to the TARA registry (103 techniques), NISS (Neural Impact Scoring System) calculators, physics feasibility tiers, and STIX 2.1 exporters.

## Installation

```bash
pip install qtara
```

## Features

- **TARA Registry:** Query 103 verified BCI threat techniques with full enrichment data.
- **Physics Feasibility Tiers:** Filter techniques by physics feasibility (T0: feasible now, T1: mid-term, T2: far-term, T3: no physics gate).
- **NISS Scorer:** Calculate neural impact scores based on physics-derived metrics.
- **CVSS + Neurorights:** Access CVSS 4.0 mappings and neuroright impact data per technique.
- **STIX 2.1:** Export threat data for industry-standard security tools.
- **CLI:** Instant access to threat intelligence from the terminal.

## Quick Start

```python
from qtara.core import TaraLoader

loader = TaraLoader()
loader.load()

# List all techniques
techniques = loader.list_techniques()
print(f"{len(techniques)} techniques loaded")

# Get a specific technique
t = loader.get_technique("QIF-T0001")
print(t.attack, t.severity, t.physics_feasibility.tier_label)

# Filter by physics tier
tier0 = loader.list_by_physics_tier(0)
print(f"{len(tier0)} techniques feasible now")

# Filter by severity
critical = loader.list_by_severity("critical")
print(f"{len(critical)} critical techniques")

# Get statistics
stats = loader.get_statistics()
print(stats)
```

## CLI Usage

```bash
# List all techniques
qtara list

# Filter by physics feasibility tier (0=feasible now, 1=mid-term, 2=far-term, 3=no gate)
qtara list --tier 0

# Filter by severity
qtara list --severity critical

# Filter by neural band
qtara list --band N1

# Get detailed info for a technique
qtara info QIF-T0001

# Show statistics
qtara stats

# Export to STIX 2.1
qtara stix --output threats.json

# Get citation
qtara cite
```

## Physics Feasibility Tiers

Each technique is classified by its physics feasibility:

| Tier | Label | Timeline | Description |
|------|-------|----------|-------------|
| T0 | feasible_now | now | Attack is possible with current technology |
| T1 | mid_term | 5-10 years | Requires technology advances expected within a decade |
| T2 | far_term | 10+ years | Requires fundamental breakthroughs |
| T3 | no_physics_gate | n/a | No physics constraint (software/protocol attacks) |

## Development

```bash
git clone https://github.com/qinnovates/qinnovate
cd shared/qtara
pip install -e .
```

## License

MIT
