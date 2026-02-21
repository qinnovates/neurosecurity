"""Signal injection attacks (QIF-N.IJ, QIF-P.DS).

Attacks that inject signals through the electrode-tissue interface (I0)
or analog front-end (S1). These are the most direct attack vectors.
"""

import numpy as np
from .base import generate_clean_eeg, AttackMetadata, SAMPLE_RATE, DC_OFFSET


# ─── QIF-T0001: Generic Signal Injection ─────────────────────────────────────

SSVEP_15HZ_META = AttackMetadata(
    qif_t="QIF-T0001-ssvep15",
    name="SSVEP 15Hz (Known Target)",
    tactic="QIF-N.IJ",
    nic_chain="S1->I0->N1",
    band_ids=["S1", "I0", "N1"],
    niss_vector="NISS:1.0/BI:M/CG:M/CV:I/RV:P/NP:S",
    severity="MEDIUM",
    description="Standard SSVEP attack at a known target frequency (15Hz). "
                "Both L1 notch filter and SSVEP signature detector catch this.",
    status="CONFIRMED",
)


def generate_ssvep_15hz(
    duration_s: float, fs: int = SAMPLE_RATE,
    attack_start: float = 5.0, amplitude: float = 0.5,
    seed: int = None,
) -> np.ndarray:
    """SSVEP at 15Hz (known notch filter target)."""
    signal = generate_clean_eeg(duration_s, fs, seed=seed)
    n_samples = len(signal)
    t = np.arange(n_samples) / fs
    mask = t >= attack_start
    signal[mask] += amplitude * np.sin(2 * np.pi * 15.0 * t[mask])
    return np.clip(signal, 0.0, 5.0)


# ─── Novel SSVEP (outside notch bank) ────────────────────────────────────────

SSVEP_NOVEL_META = AttackMetadata(
    qif_t="QIF-T0001-ssvep-novel",
    name="SSVEP 13Hz (Novel Frequency)",
    tactic="QIF-N.IJ",
    nic_chain="S1->I0->N1",
    band_ids=["S1", "I0", "N1"],
    niss_vector="NISS:1.0/BI:M/CG:M/CV:I/RV:P/NP:S",
    severity="MEDIUM",
    description="SSVEP at 13Hz, outside the notch filter bank (8.57, 10.9, 15, 20 Hz). "
                "L1 won't filter it. Only coherence monitor's spectral peak detector catches it.",
    status="DEMONSTRATED",
)


def generate_ssvep_novel(
    duration_s: float, fs: int = SAMPLE_RATE,
    attack_start: float = 5.0, freq: float = 13.0, amplitude: float = 0.5,
    seed: int = None,
) -> np.ndarray:
    """SSVEP at arbitrary frequency (default 13Hz, outside notch bank)."""
    signal = generate_clean_eeg(duration_s, fs, seed=seed)
    n_samples = len(signal)
    t = np.arange(n_samples) / fs
    mask = t >= attack_start
    signal[mask] += amplitude * np.sin(2 * np.pi * freq * t[mask])
    return np.clip(signal, 0.0, 5.0)


# ─── Impedance Spike ─────────────────────────────────────────────────────────

IMPEDANCE_SPIKE_META = AttackMetadata(
    qif_t="QIF-T0001-impedance",
    name="Impedance Spike",
    tactic="QIF-P.DS",
    nic_chain="I0",
    band_ids=["I0"],
    niss_vector="NISS:1.0/BI:L/CG:L/CV:N/RV:P/NP:N",
    severity="LOW",
    description="Sudden >2.5V jump triggers L1 impedance guard. Blunt hardware attack.",
    status="CONFIRMED",
)


def generate_impedance_spike(
    duration_s: float, fs: int = SAMPLE_RATE,
    spike_time: float = 3.0, spike_voltage: float = 4.5,
    seed: int = None,
) -> np.ndarray:
    """Single high-voltage spike at spike_time."""
    signal = generate_clean_eeg(duration_s, fs, seed=seed)
    spike_idx = int(spike_time * fs)
    if 0 <= spike_idx < len(signal):
        signal[spike_idx] = spike_voltage
    return np.clip(signal, 0.0, 5.0)


# ─── QIF-T0026: Neuronal Flooding ────────────────────────────────────────────

FLOODING_META = AttackMetadata(
    qif_t="QIF-T0026",
    name="Neuronal Flooding",
    tactic="QIF-P.DS",
    nic_chain="I0->N4->N5->N6->N7",
    band_ids=["I0", "N4", "N5", "N6", "N7"],
    niss_vector="NISS:1.0/BI:H/CG:H/CV:E/RV:P/NP:T",
    severity="CRITICAL",
    description="Broadband saturation across all frequencies. DDoS for neural tissue. "
                "Overwhelms thalamic gate, causes phase coherence collapse.",
    status="EMERGING",
)


def generate_flood(
    duration_s: float, fs: int = SAMPLE_RATE,
    attack_start: float = 5.0, amplitude: float = 1.0,
    seed: int = None,
) -> np.ndarray:
    """Broadband noise flooding starting at attack_start."""
    signal = generate_clean_eeg(duration_s, fs, seed=seed)
    n_samples = len(signal)
    t = np.arange(n_samples) / fs
    mask = t >= attack_start
    rng = np.random.RandomState(seed if seed else 99)
    signal[mask] += amplitude * rng.randn(np.sum(mask))
    return np.clip(signal, 0.0, 5.0)


# ─── QIF-T0067: Phase Dynamics Replay ────────────────────────────────────────

PHASE_REPLAY_META = AttackMetadata(
    qif_t="QIF-T0067",
    name="Phase Dynamics Replay",
    tactic="QIF-N.IJ",
    nic_chain="S1->I0->N1->N3->N5->N6->N7",
    band_ids=["S1", "I0", "N1", "N3", "N5", "N6", "N7"],
    niss_vector="NISS:1.0/BI:L/CG:H/CV:I/RV:P/NP:T",
    severity="CRITICAL",
    description="Replays statistically identical neural signal trajectory. "
                "Same alpha phase, spectral shape, amplitude stats. "
                "0% detection rate. Requires biological TLS (Phase 2+).",
    status="DEMONSTRATED",
)


def generate_phase_replay(
    duration_s: float, fs: int = SAMPLE_RATE,
    attack_start: float = 5.0,
    seed: int = None,
) -> np.ndarray:
    """Substitute clean EEG with independent clean EEG (replay)."""
    signal = generate_clean_eeg(duration_s, fs, seed=seed)
    n_samples = len(signal)
    t = np.arange(n_samples) / fs
    mask = t >= attack_start

    # Generate replay with different seed
    replay = generate_clean_eeg(duration_s, fs, seed=42)
    signal[mask] = replay[mask]
    return np.clip(signal, 0.0, 5.0)
