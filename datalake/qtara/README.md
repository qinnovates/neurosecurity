# qtara

**Threat Analysis & Risk Assessment (TARA)** framework for Neural Security.

The `qtara` package provides programmatic access to the TARA registry (173 techniques and 1 variant in registrar 4.3), each entry's NISS (Neural Impact Scoring System) scoring state, physics feasibility tiers, and a STIX 2.1 exporter.

TARA, NISS and QIF are a proposed framework. They have not been independently validated or adopted by a standards body.

## Installation

```bash
pip install qtara
```

The release on PyPI can lag this repository. Check what you have with `qtara stats`; the counts in this README describe the registrar bundled in the repository.

## Features

- **TARA Registry:** Query 173 catalogued BCI threat techniques and their enrichment data. Variants are held apart from techniques and are never counted as techniques.
- **Physics Feasibility Tiers:** Filter techniques by physics feasibility tier (0, 1, 2, 3 or X; see the table below).
- **NISS:** Read each technique's scoring state, vector, score and severity, and parse NISS vectors. The SDK reads stored scores; it does not compute them.
- **CVSS + Neurorights:** Access CVSS 4.0 mappings and neuroright impact data on the techniques that carry them (103 and 143 of 173).
- **STIX 2.1:** Export techniques and variants as attack-patterns with deterministic ids.
- **CLI:** Query the registry from the terminal.

## Quick Start

```python
from qtara.core import TaraLoader

loader = TaraLoader()
loader.load()

# List all techniques (variants are not included)
techniques = loader.list_techniques()
print(f"{len(techniques)} techniques loaded")

# Get a specific technique
t = loader.get_technique("QIF-T0001")
print(t.attack, t.niss.scoring_state, t.niss.score, t.niss.severity)

# Filter by physics tier
tier0 = loader.list_by_physics_tier(0)
print(f"{len(tier0)} techniques in tier 0")

# Rank scored techniques by NISS score
scored = [t for t in techniques if t.niss.scoring_state == "scored"]
scored.sort(key=lambda t: t.niss.score, reverse=True)

# Variants
for v in loader.list_variants():
    print(v.id, v.parent, v.differs_in, v.niss.scoring_state)

# Get statistics
stats = loader.get_statistics()
print(stats)
```

## CLI Usage

```bash
# List all techniques
qtara list

# Filter by physics feasibility tier (0, 1, 2, 3 or X)
qtara list --tier 0

# Filter by the filed severity label (not the NISS severity; see "Two severity fields")
qtara list --severity critical

# Filter by neural band, TARA domain or mode
qtara list --band N1
qtara list --domain SIL
qtara list --mode R

# Leave out entries whose enrichment is pending
qtara list --enriched-only

# Detailed info for a technique, including its NISS scoring state
qtara info QIF-T0001

# Counts: techniques, variants, tiers, filed severity, status
qtara stats

# Export to STIX 2.1 (add --include-pending to export entries whose enrichment is pending)
qtara stix --output threats.json

# Get citation
qtara cite
```

Filters on `qtara list` are not combined: the first of `--tier`, `--severity`, `--band`, `--domain`, `--mode` that is given is applied, and `--enriched-only` is applied on top. The CLI has no command that lists variants or filters by scoring state or peer-review status; use the Python API for those.

## NISS scoring states

Every technique carries `niss.scoring_state`. A score is stored only when the entry's sources support all six NISS metrics.

| State | Count | What is stored |
|-------|-------|----------------|
| `scored` | 129 | `vector`, `score`, `severity`, `pins` |
| `provisional` | 10 | `metrics` (unsupported ones are `"unknown"`), `score_min`, `score_max`, `metric_evidence`. No score: the range is a bound, not an estimate |
| `unscored` | 34 | `unscored_reason`: `no_metric_supported` (19), `no_source` (8) or `preprint_only` (7) |

```python
provisional = [t for t in techniques if t.niss.scoring_state == "provisional"]
print(provisional[0].id, provisional[0].niss.score_min, provisional[0].niss.score_max)
```

`qtara info <id>` prints the state, and the score, the range or the reason that goes with it.

## Peer-review status

`peer_review_status` is derived from a technique's `sources`: `peer_reviewed` (158), `preprint` (7) or `none` (8). An entry that is `preprint` or `none` may not hold a status above THEORETICAL and carries no NISS score. `defensive_sources` (controls, mitigations, benchmarks) are kept apart and do not count toward it. `peer_reviewed` includes entries whose sources carry no identifier; the field does not verify those.

```python
preprint_only = [t.id for t in techniques if t.peer_review_status == "preprint"]
```

## Variants

A variant has the same signal-level mechanism, tactic and harm as exactly one parent technique and differs in one `differs_in` dimension (`access_path`, `delivery`, `target_model`, `training_setup` or `sensing_site`). Its id is the parent id plus `-Vnn` (for example `QIF-T0024-V01`). Variants are counted in `total_variants`, never in the technique count, and `qtara info` does not look them up.

```python
loader.list_variants()                    # all variants
loader.list_variants(parent="QIF-T0024")  # variants of one technique
v = loader.get_variant("QIF-T0024-V01")
print(v.alias, v.differs_in, v.peer_review_status, v.niss.scoring_state, v.niss.unscored_reason)
```

A variant's scoring state is its own. It is `scored` only when it inherits its parent's vector (`inherits_niss`), which needs a peer-reviewed source and a dimension that does not change impact.

## Two severity fields

A technique carries two severity labels. They are produced differently and differ on 99 of the 129 scored techniques.

| Field | How it is produced | Use |
|-------|--------------------|-----|
| `niss.severity` | Derived from `niss.score` by the scale in the registrar's `niss_spec`: 0.0 none, 0.1-3.9 low, 4.0-6.9 medium, 7.0-8.9 high, 9.0-10.0 critical. Present only on scored techniques | Authoritative for ranking and filtering |
| `severity` (top level) | An editorial label assigned when the entry was filed. Not computed from the NISS vector. Present on every technique | History, and the only label on techniques without a score. Do not rank by it |

`niss.score` is the weighted mean of the six metrics with the default weights in `niss_spec` (CR and CD 0.5 each, the others 1.0), rounded up to one decimal. `qtara list --severity`, the list table and the "By Filed Severity" table in `qtara stats` use the top-level field. `qtara info` prints both and labels them. Neither label has been validated against outcomes.

## STIX export

`qtara stix` writes a STIX 2.1 bundle: one attack-pattern per technique, plus one attack-pattern and one `related-to` relationship per variant whose parent is exported. By default entries whose enrichment is pending are left out (165 techniques and 1 variant); `--include-pending` exports all 173.

Attack-pattern ids are deterministic: UUIDv5 over `qif.tara.<entry id>` in the DNS namespace. The site export at `/api/stix.json` uses the same scheme, and both are pinned to `tests/fixtures/stix_ids.json`, so one technique has one id in both exports. The bundle id is random on each export.

## Physics Feasibility Tiers

Techniques that have been assessed carry a physics feasibility tier (161 of 173; `qtara stats` reports the rest as `unclassified`):

| Tier | Label | Timeline | Description |
|------|-------|----------|-------------|
| 0 | feasible_now | now | Attack hardware exists today |
| 1 | near_term | 2026-2031 | Components exist but integration is new |
| 2 | mid_term | 2031-2038 | Needs denser, higher-channel-count BCI hardware |
| 3 | far_term | 2038+ | Needs nanoscale electrodes or quantum-regime hardware |
| X | no_physics_gate | none | Software, platform or network attack; physics does not constrain it |

`qtara list --tier X` selects the last row. Five entries are stored with tier `0` and the label `no_physics_gate`; `--tier 0` returns them (104 entries) while the label count for `feasible_now` is 99.

## Development

```bash
git clone https://github.com/qinnovates/neurosecurity
cd neurosecurity/datalake/qtara
pip install -e .
python3 -m pytest -q
```

## License

MIT
