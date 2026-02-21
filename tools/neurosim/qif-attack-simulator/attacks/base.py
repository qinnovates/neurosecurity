"""Base EEG signal generator for attack simulations.

Generates multi-band synthetic EEG with physiologically realistic spectral
profile. Attack generators import this and overlay their specific attack
patterns on top of the clean baseline.
"""

import numpy as np
from scipy.signal import butter, sosfilt
from dataclasses import dataclass
from typing import Optional


SAMPLE_RATE = 250  # Hz (standard clinical EEG)
DC_OFFSET = 2.5    # Volts (typical ADC midpoint)


@dataclass
class AttackMetadata:
    """TARA metadata for an attack generator."""
    qif_t: str              # e.g. "QIF-T0023"
    name: str               # Human-readable name
    tactic: str             # QIF tactic code (e.g. "QIF-M.SV")
    nic_chain: str          # e.g. "S2->I0->N5-N7"
    band_ids: list          # e.g. ["S2", "I0", "N5", "N6", "N7"]
    niss_vector: str        # e.g. "NISS:1.0/BI:H/CG:H/CV:E/RV:P/NP:S"
    severity: str           # CRITICAL / HIGH / MEDIUM / LOW
    description: str        # What the attack does
    status: str = "THEORETICAL"  # CONFIRMED / DEMONSTRATED / EMERGING / THEORETICAL


def generate_clean_eeg(
    duration_s: float,
    fs: int = SAMPLE_RATE,
    seed: Optional[int] = None,
) -> np.ndarray:
    """Generate clean multi-band EEG signal (no attack).

    Uses band-limited noise for each canonical EEG band with
    physiologically realistic power ratios.

    Returns: 1D numpy array of voltage samples.
    """
    if seed is not None:
        np.random.seed(seed)

    n_samples = int(duration_s * fs)
    t = np.arange(n_samples) / fs
    signal = np.full(n_samples, DC_OFFSET, dtype=np.float64)

    # EEG bands with physiological power ratios
    bands = [
        ("delta",  0.5,  4.0, 0.030),
        ("theta",  4.0,  8.0, 0.020),
        ("alpha",  8.0, 13.0, 0.050),
        ("beta",  13.0, 30.0, 0.010),
        ("gamma", 30.0, 50.0, 0.005),
    ]

    nyq = fs / 2.0
    white = np.random.randn(n_samples + 500)  # extra for filter warmup

    for name, lo, hi, amplitude in bands:
        lo_n = max(lo / nyq, 0.01)
        hi_n = min(hi / nyq, 0.99)
        if lo_n >= hi_n:
            continue
        sos = butter(4, [lo_n, hi_n], btype="band", output="sos")
        filtered = sosfilt(sos, white)[500:]  # discard warmup
        filtered = filtered / (np.std(filtered) + 1e-10) * amplitude
        signal += filtered[:n_samples]

    # Powerline artifact (60 Hz)
    signal += 0.01 * np.sin(2 * np.pi * 60 * t)

    return np.clip(signal, 0.0, 5.0)
