"""Evasion attacks (QIF-B.EV, QIF-E.RD).

Attacks designed to evade detection by staying below per-window thresholds,
using frequency-domain steganography, or mimicking legitimate signal profiles.
"""

import numpy as np
from .base import generate_clean_eeg, AttackMetadata, SAMPLE_RATE, DC_OFFSET


# ─── QIF-T0062: Slow DC Drift ────────────────────────────────────────────────

DC_DRIFT_META = AttackMetadata(
    qif_t="QIF-T0062",
    name="Slow DC Drift",
    tactic="QIF-B.EV",
    nic_chain="I0->N1->N2->N3",
    band_ids=["I0", "N1", "N2", "N3"],
    niss_vector="NISS:1.0/BI:L/CG:M/CV:I/RV:P/NP:S",
    severity="MEDIUM",
    description="Slow DC ramp shifts baseline over time. Caught by spectral peak detector.",
    status="CONFIRMED",
)


def generate_dc_drift(
    duration_s: float, fs: int = SAMPLE_RATE,
    attack_start: float = 5.0, drift_rate: float = 0.5,
    seed: int = None,
) -> np.ndarray:
    """Linear DC drift starting at attack_start.

    Args:
        drift_rate: Volts per second of drift (default 0.5 V/s).
    """
    signal = generate_clean_eeg(duration_s, fs, seed=seed)
    n_samples = len(signal)
    t = np.arange(n_samples) / fs
    mask = t >= attack_start
    drift_t = t[mask] - attack_start
    signal[mask] += drift_rate * drift_t
    return np.clip(signal, 0.0, 5.0)


# ─── QIF-T0066: Boiling Frog ─────────────────────────────────────────────────

BOILING_FROG_META = AttackMetadata(
    qif_t="QIF-T0066",
    name="Boiling Frog (Adiabatic Phase Manipulation)",
    tactic="QIF-B.EV",
    nic_chain="I0->N1->N2->N3->N4->N5->N6->N7",
    band_ids=["I0", "N1", "N2", "N3", "N4", "N5", "N6", "N7"],
    niss_vector="NISS:1.0/BI:L/CG:H/CV:I/RV:P/NP:S",
    severity="HIGH",
    description="Ultra-slow adiabatic drift (0.001V/s). Each window looks normal. "
                "Cumulative displacement is the danger. AC coupling in Cs computation "
                "makes the coherence monitor mathematically blind to DC drift. "
                "Requires hardware reference electrode (Phase 1).",
    status="THEORETICAL",
)


def generate_boiling_frog(
    duration_s: float, fs: int = SAMPLE_RATE,
    attack_start: float = 5.0, drift_rate: float = 0.001,
    seed: int = None,
) -> np.ndarray:
    """Ultra-slow DC drift designed to stay below per-window thresholds.

    Args:
        drift_rate: Volts per second (default 0.001, well below noise floor).
    """
    signal = generate_clean_eeg(duration_s, fs, seed=seed)
    n_samples = len(signal)
    t = np.arange(n_samples) / fs
    mask = t >= attack_start
    drift_t = t[mask] - attack_start
    signal[mask] += drift_rate * drift_t
    return np.clip(signal, 0.0, 5.0)


# ─── QIF-T0014: Envelope Modulation ──────────────────────────────────────────

ENVELOPE_MOD_META = AttackMetadata(
    qif_t="QIF-T0014",
    name="Envelope Modulation (Stealth Carrier)",
    tactic="QIF-E.RD",
    nic_chain="S1->S2->N1->N4->N7",
    band_ids=["S1", "S2", "N1", "N4", "N7"],
    niss_vector="NISS:1.0/BI:H/CG:H/CV:I/RV:P/NP:S",
    severity="HIGH",
    description="High-freq carrier (80Hz) AM-modulated at 10Hz (alpha). "
                "Carrier looks like noise/powerline. Neural tissue demodulates the envelope. "
                "Demonstrated: Datta et al. 2009.",
    status="DEMONSTRATED",
)


def generate_envelope_modulation(
    duration_s: float, fs: int = SAMPLE_RATE,
    attack_start: float = 5.0,
    carrier_freq: float = 80.0, envelope_freq: float = 10.0,
    modulation_depth: float = 0.8, amplitude: float = 0.15,
    seed: int = None,
) -> np.ndarray:
    """AM-modulated carrier signal.

    Args:
        carrier_freq: Carrier frequency in Hz (default 80, limited by Nyquist).
        envelope_freq: Modulation frequency in Hz (default 10, alpha band).
        modulation_depth: AM modulation depth 0-1 (default 0.8).
        amplitude: Overall attack signal amplitude (default 0.15V).
    """
    signal = generate_clean_eeg(duration_s, fs, seed=seed)
    n_samples = len(signal)
    t = np.arange(n_samples) / fs
    mask = t >= attack_start

    carrier = np.sin(2 * np.pi * carrier_freq * t)
    envelope = 0.5 * (1 + modulation_depth * np.sin(2 * np.pi * envelope_freq * t))
    am_signal = amplitude * carrier * envelope

    signal[mask] += am_signal[mask]
    return np.clip(signal, 0.0, 5.0)
