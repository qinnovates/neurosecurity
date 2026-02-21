"""Feedback and closed-loop attacks (QIF-M.SV).

Attacks that exploit feedback loops in closed-loop BCI systems to amplify
small perturbations into system-destabilizing oscillations.
"""

import numpy as np
from .base import generate_clean_eeg, AttackMetadata, SAMPLE_RATE


# ─── QIF-T0023: Closed-Loop Perturbation Cascade ─────────────────────────────

CASCADE_META = AttackMetadata(
    qif_t="QIF-T0023",
    name="Closed-Loop Perturbation Cascade",
    tactic="QIF-M.SV",
    nic_chain="S2->I0->N5->N6->N7",
    band_ids=["S2", "I0", "N5", "N6", "N7"],
    niss_vector="NISS:1.0/BI:H/CG:H/CV:E/RV:P/NP:S",
    severity="CRITICAL",
    description="Exponentially growing perturbation in closed-loop BCI feedback. "
                "Starts invisible (0.001V), doubles every 1.5s. Early windows look clean. "
                "Caught by growth detector + CUSUM at 15s observation.",
    status="EMERGING",
)


def generate_closed_loop_cascade(
    duration_s: float, fs: int = SAMPLE_RATE,
    attack_start: float = 5.0,
    initial_amplitude: float = 0.001,
    doubling_time: float = 1.5,
    resonance_freq: float = 11.0,
    seed: int = None,
) -> np.ndarray:
    """Exponentially growing perturbation simulating feedback amplification.

    Args:
        initial_amplitude: Starting perturbation in volts (default 0.001).
        doubling_time: Time in seconds for amplitude to double (default 1.5).
        resonance_freq: Frequency of the feedback resonance in Hz (default 11).
    """
    signal = generate_clean_eeg(duration_s, fs, seed=seed)
    n_samples = len(signal)
    t = np.arange(n_samples) / fs
    mask = t >= attack_start
    attack_t = t[mask] - attack_start

    growth_rate = np.log(2) / doubling_time
    perturbation = initial_amplitude * np.exp(growth_rate * attack_t)
    cascade = perturbation * np.sin(2 * np.pi * resonance_freq * t[mask])

    signal[mask] += cascade
    return np.clip(signal, 0.0, 5.0)
