# QIF Attack Simulator

> **Part of:** [Neurosim](../README.md) > QIF Attack Simulator
> **Version:** 0.1
> **Date:** 2026-02-21

Generates synthetic EEG signals with TARA-mapped attack patterns for testing BCI security defenses. Each attack generator is tied to a QIF-T technique ID from the [TARA registry](../../../shared/qtara/src/qtara/data/qtara-registrar.json) (103 techniques).

## Quick Start

```bash
# List all available attacks
python simulate.py --list

# List attacks grouped by NIC entry point
python simulate.py --list --group-by nic

# List attacks grouped by severity
python simulate.py --list --group-by severity

# Generate a specific attack with spectral analysis
python simulate.py --attack QIF-T0023 --duration 15 --analyze

# Run all attacks and compare deviations
python simulate.py --all --duration 15

# Export signal to CSV
python simulate.py --attack QIF-T0023 --duration 15 --output signal.csv

# Generate clean baseline
python simulate.py --clean --duration 15 --analyze

# Dependencies
pip install numpy scipy
```

## Architecture

```
qif-attack-simulator/
    simulate.py          # CLI entry point
    registry.py          # Central registry mapping QIF-T IDs to generators
    attacks/
        __init__.py
        base.py          # Clean EEG generator + AttackMetadata dataclass
        signal_injection.py  # SSVEP, impedance, flooding, replay
        evasion.py       # DC drift, boiling frog, envelope modulation
        feedback.py      # Closed-loop cascade
```

## Organization

Attacks are organized by two dimensions:

- **Primary key: QIF-T ID** (unique per technique, from TARA registry)
- **Grouping: NIC chain** (Neural Impact Chain, shows signal flow through the 11-band hourglass)

### By QIF-T ID

| QIF-T | Name | Tactic | Severity | NIC Chain |
|---|---|---|---|---|
| QIF-T0001-ssvep15 | SSVEP 15Hz (Known) | QIF-N.IJ | MEDIUM | S1->I0->N1 |
| QIF-T0001-ssvep-novel | SSVEP 13Hz (Novel) | QIF-N.IJ | MEDIUM | S1->I0->N1 |
| QIF-T0001-impedance | Impedance Spike | QIF-P.DS | LOW | I0 |
| QIF-T0001-notch-aware | Notch-Aware SSVEP 12Hz | QIF-N.IJ | MEDIUM | S1->I0->N1 |
| QIF-T0001-freq-hop | Frequency-Hopping SSVEP | QIF-N.IJ | MEDIUM | S1->I0->N1 |
| QIF-T0001-cusum-aware | CUSUM-Aware Intermittent | QIF-N.IJ | HIGH | S1->I0->N1->N4 |
| QIF-T0014 | Envelope Modulation | QIF-E.RD | HIGH | S1->S2->N1->N4->N7 |
| QIF-T0023 | Closed-Loop Cascade | QIF-M.SV | CRITICAL | S2->I0->N5->N6->N7 |
| QIF-T0026 | Neuronal Flooding | QIF-P.DS | CRITICAL | I0->N4->N5->N6->N7 |
| QIF-T0062 | Slow DC Drift | QIF-B.EV | MEDIUM | I0->N1->N2->N3 |
| QIF-T0066 | Boiling Frog | QIF-B.EV | HIGH | I0->N1->...->N7 |
| QIF-T0066-threshold-aware | Threshold-Aware Ramp | QIF-B.EV | HIGH | I0->N1->...->N4 |
| QIF-T0067 | Phase Replay | QIF-N.IJ | CRITICAL | S1->I0->N1->...->N7 |
| QIF-T0067-spectral-mimicry | Spectral Mimicry | QIF-N.IJ | HIGH | S1->I0->N1->N4->N7 |

### By NIC Entry Point

- **I0 (electrode-tissue):** Impedance spike, flooding, DC drift, boiling frog, threshold-aware ramp
- **S1 (analog front-end):** SSVEP attacks, envelope modulation, phase replay, spectral mimicry, freq-hopping, CUSUM-aware intermittent
- **S2 (digital processing):** Closed-loop cascade

## Adding New Attacks

1. Choose the appropriate category file in `attacks/` (or create a new one).
2. Define an `AttackMetadata` instance with TARA data:

```python
MY_ATTACK_META = AttackMetadata(
    qif_t="QIF-T0099",
    name="My New Attack",
    tactic="QIF-N.IJ",
    nic_chain="S1->I0->N4->N7",
    band_ids=["S1", "I0", "N4", "N7"],
    niss_vector="NISS:1.0/BI:H/CG:H/CV:E/RV:P/NP:S",
    severity="HIGH",
    description="What this attack does.",
    status="THEORETICAL",
)
```

3. Write a generator function:

```python
def generate_my_attack(
    duration_s: float, fs: int = SAMPLE_RATE,
    attack_start: float = 5.0,
    seed: int = None,
) -> np.ndarray:
    signal = generate_clean_eeg(duration_s, fs, seed=seed)
    # ... overlay attack pattern ...
    return np.clip(signal, 0.0, 5.0)
```

4. Register in `registry.py`:

```python
from attacks.my_module import generate_my_attack, MY_ATTACK_META
REGISTRY[MY_ATTACK_META.qif_t] = (generate_my_attack, MY_ATTACK_META)
```

## Generator Interface

All generators follow the same signature:

```python
def generate_attack(
    duration_s: float,          # Signal duration in seconds
    fs: int = 250,              # Sample rate in Hz
    attack_start: float = 5.0,  # Attack onset time (after calibration)
    seed: int = None,           # Random seed for reproducibility
    **kwargs,                   # Attack-specific parameters
) -> np.ndarray:                # 1D voltage array, range [0, 5.0]V
```

Attack starts at `t=5.0s` by default, leaving 4s for calibration (8 windows at 0.5s each). The first 5s are always clean EEG.

## Integration with Neurowall

The generators produce raw voltage signals. To test against Neurowall's 3-layer pipeline, use the integration test harness:

```bash
# From tools/neurowall/
python test_nic_chains.py           # Standard 10-scenario test
python test_nic_chains.py --runs 50 # Statistical analysis
python test_nic_chains.py --roc     # ROC curve sweep
```

The test harness (`test_nic_chains.py`) currently has its own inline generators. These will be migrated to import from neurosim in a future version.

## Data Sources

- **TARA Registry:** `shared/qtara/src/qtara/data/qtara-registrar.json` (103 techniques, v4.0)
- **NIC Bands:** QIF 11-band hourglass model (N1-N7, I0, S1-S3)
- **NISS Scoring:** Neural Impact Scoring System v1.0
- **QIF Tactics:** 16 tactic codes (QIF-S.HV, QIF-N.IJ, QIF-B.EV, etc.)
