"""Adversarial-aware attacks.

Attacks specifically designed to evade Neurowall's detection layers by
exploiting knowledge of the detection algorithms. These test whether
an attacker who understands the defense architecture can bypass it.
"""

import numpy as np
from scipy.signal import butter, sosfilt
from .base import generate_clean_eeg, AttackMetadata, SAMPLE_RATE, DC_OFFSET


# ─── Notch-Aware SSVEP ───────────────────────────────────────────────────────
# Attacker knows the notch filter bank frequencies and targets gaps between them.

NOTCH_AWARE_META = AttackMetadata(
    qif_t="QIF-T0001-notch-aware",
    name="Notch-Aware SSVEP (Interstitial)",
    tactic="QIF-N.IJ",
    nic_chain="S1->I0->N1",
    band_ids=["S1", "I0", "N1"],
    niss_vector="NISS:1.0/BI:M/CG:M/CV:I/RV:P/NP:S",
    severity="MEDIUM",
    description="SSVEP at 12Hz, precisely between notch filters (10.9Hz and 15Hz). "
                "L1 notch bank is blind. Tests adaptive spectral peak detection.",
    status="THEORETICAL",
)


def generate_notch_aware_ssvep(
    duration_s: float, fs: int = SAMPLE_RATE,
    attack_start: float = 5.0, freq: float = 12.0, amplitude: float = 0.3,
    seed: int = None,
) -> np.ndarray:
    """SSVEP at frequency chosen to fall between notch filter stopbands."""
    signal = generate_clean_eeg(duration_s, fs, seed=seed)
    n = len(signal)
    t = np.arange(n) / fs
    mask = t >= attack_start
    signal[mask] += amplitude * np.sin(2 * np.pi * freq * t[mask])
    return np.clip(signal, 0.0, 5.0)


# ─── Threshold-Aware Ramp ────────────────────────────────────────────────────
# Attacker knows the anomaly threshold (~1.5 z-score) and keeps perturbation
# just below detection level per window, accumulating over many windows.

THRESHOLD_AWARE_META = AttackMetadata(
    qif_t="QIF-T0066-threshold-aware",
    name="Threshold-Aware Sub-Detection Ramp",
    tactic="QIF-B.EV",
    nic_chain="I0->N1->N2->N3->N4",
    band_ids=["I0", "N1", "N2", "N3", "N4"],
    niss_vector="NISS:1.0/BI:L/CG:H/CV:I/RV:P/NP:S",
    severity="HIGH",
    description="Perturbation calibrated to produce z-score of ~1.2 per window "
                "(below the 1.5 threshold). Each window passes individually but "
                "the signal accumulates spectral distortion. Tests CUSUM and "
                "growth detectors.",
    status="THEORETICAL",
)


def generate_threshold_aware_ramp(
    duration_s: float, fs: int = SAMPLE_RATE,
    attack_start: float = 5.0,
    sub_threshold_amplitude: float = 0.025,
    seed: int = None,
) -> np.ndarray:
    """Perturbation calibrated to stay just below per-window z-score threshold.

    Args:
        sub_threshold_amplitude: Attack amplitude per window, tuned to produce
            z-score ~1.2 (below 1.5 threshold). Default 0.025V.
    """
    signal = generate_clean_eeg(duration_s, fs, seed=seed)
    n = len(signal)
    t = np.arange(n) / fs
    mask = t >= attack_start

    # Inject a steady low-amplitude sinusoid at 11Hz (near alpha, max interference)
    signal[mask] += sub_threshold_amplitude * np.sin(2 * np.pi * 11.0 * t[mask])
    return np.clip(signal, 0.0, 5.0)


# ─── Spectral Mimicry ────────────────────────────────────────────────────────
# Attacker shapes the attack signal to match the baseline spectral profile,
# adding power proportionally across all bands instead of at a single frequency.

SPECTRAL_MIMICRY_META = AttackMetadata(
    qif_t="QIF-T0067-spectral-mimicry",
    name="Spectral Profile Mimicry",
    tactic="QIF-N.IJ",
    nic_chain="S1->I0->N1->N4->N7",
    band_ids=["S1", "I0", "N1", "N4", "N7"],
    niss_vector="NISS:1.0/BI:M/CG:H/CV:I/RV:P/NP:T",
    severity="HIGH",
    description="Attack adds broadband noise shaped to match the baseline spectral "
                "profile. No novel peaks appear. Spectral entropy stays flat. "
                "Only total power increases, which the coherence monitor may not catch.",
    status="THEORETICAL",
)


def generate_spectral_mimicry(
    duration_s: float, fs: int = SAMPLE_RATE,
    attack_start: float = 5.0, power_increase: float = 1.5,
    seed: int = None,
) -> np.ndarray:
    """Broadband noise shaped to match baseline spectral profile.

    Instead of injecting at a single frequency (detectable via spectral peak),
    this attack adds noise proportionally across all EEG bands, preserving
    the spectral shape while increasing total power.

    Args:
        power_increase: Multiplicative factor for noise power (default 1.5x).
    """
    signal = generate_clean_eeg(duration_s, fs, seed=seed)
    n = len(signal)
    t = np.arange(n) / fs
    mask = t >= attack_start

    # Generate additional band-matched noise
    rng = np.random.RandomState(seed + 1 if seed else 77)
    extra = np.zeros(n)
    nyq = fs / 2.0
    white = rng.randn(n + 500)

    bands = [
        (0.5,  4.0, 0.030),
        (4.0,  8.0, 0.020),
        (8.0, 13.0, 0.050),
        (13.0, 30.0, 0.010),
        (30.0, 50.0, 0.005),
    ]
    for lo, hi, amp in bands:
        lo_n = max(lo / nyq, 0.01)
        hi_n = min(hi / nyq, 0.99)
        if lo_n >= hi_n:
            continue
        sos = butter(4, [lo_n, hi_n], btype="band", output="sos")
        filtered = sosfilt(sos, white)[500:]
        filtered = filtered / (np.std(filtered) + 1e-10) * amp
        extra[:n] += filtered[:n]

    # Scale to desired power increase
    scale = np.sqrt(power_increase) - 1.0
    signal[mask] += scale * extra[mask]
    return np.clip(signal, 0.0, 5.0)


# ─── Frequency Hopping ───────────────────────────────────────────────────────
# Attacker rapidly switches SSVEP frequency to evade sustained peak detection
# (which requires 3/4 consecutive windows at the same frequency).

FREQ_HOPPING_META = AttackMetadata(
    qif_t="QIF-T0001-freq-hop",
    name="Frequency-Hopping SSVEP",
    tactic="QIF-N.IJ",
    nic_chain="S1->I0->N1",
    band_ids=["S1", "I0", "N1"],
    niss_vector="NISS:1.0/BI:M/CG:M/CV:I/RV:P/NP:S",
    severity="MEDIUM",
    description="SSVEP that switches frequency every 0.5s (one window). "
                "Designed to evade sustained spectral peak detector (3/4 windows). "
                "Each window has a peak, but never the same bin consecutively.",
    status="THEORETICAL",
)


def generate_freq_hopping_ssvep(
    duration_s: float, fs: int = SAMPLE_RATE,
    attack_start: float = 5.0, amplitude: float = 0.4,
    hop_interval: float = 0.5,
    seed: int = None,
) -> np.ndarray:
    """SSVEP that hops between frequencies every hop_interval seconds.

    Frequencies are chosen to avoid the notch filter bank and to never
    repeat in consecutive windows.

    Args:
        hop_interval: Seconds between frequency changes (default 0.5, one window).
        amplitude: Attack signal amplitude (default 0.4V).
    """
    signal = generate_clean_eeg(duration_s, fs, seed=seed)
    n = len(signal)
    t = np.arange(n) / fs

    # Frequencies that avoid the notch bank (8.57, 10.9, 15.0, 20.0 Hz)
    hop_freqs = [6.0, 12.0, 13.0, 17.0, 22.0, 25.0, 7.0, 14.0, 18.0, 23.0]
    rng = np.random.RandomState(seed if seed else 55)
    rng.shuffle(hop_freqs)

    for i in range(n):
        if t[i] < attack_start:
            continue
        elapsed = t[i] - attack_start
        freq_idx = int(elapsed / hop_interval) % len(hop_freqs)
        freq = hop_freqs[freq_idx]
        signal[i] += amplitude * np.sin(2 * np.pi * freq * t[i])

    return np.clip(signal, 0.0, 5.0)


# ─── CUSUM-Aware Intermittent ────────────────────────────────────────────────
# Attacker knows CUSUM accumulates positive deviations and resets after trigger.
# Injects attack in bursts with clean gaps to let CUSUM drain.

CUSUM_AWARE_META = AttackMetadata(
    qif_t="QIF-T0001-cusum-aware",
    name="CUSUM-Aware Intermittent Attack",
    tactic="QIF-N.IJ",
    nic_chain="S1->I0->N1->N4",
    band_ids=["S1", "I0", "N1", "N4"],
    niss_vector="NISS:1.0/BI:M/CG:H/CV:I/RV:P/NP:S",
    severity="HIGH",
    description="Intermittent SSVEP bursts with clean gaps. Each burst is too short "
                "to trigger sustained peak detection or CUSUM accumulation. "
                "Clean gaps let CUSUM state drain. Tests stateful detection resilience.",
    status="THEORETICAL",
)


def generate_cusum_aware_intermittent(
    duration_s: float, fs: int = SAMPLE_RATE,
    attack_start: float = 5.0,
    burst_duration: float = 0.4,
    gap_duration: float = 1.0,
    amplitude: float = 0.5,
    seed: int = None,
) -> np.ndarray:
    """Intermittent attack bursts designed to evade CUSUM accumulation.

    Args:
        burst_duration: Length of each attack burst in seconds (default 0.4s, < 1 window).
        gap_duration: Clean gap between bursts in seconds (default 1.0s).
        amplitude: Burst amplitude (default 0.5V).
    """
    signal = generate_clean_eeg(duration_s, fs, seed=seed)
    n = len(signal)
    t = np.arange(n) / fs

    cycle = burst_duration + gap_duration
    for i in range(n):
        if t[i] < attack_start:
            continue
        elapsed = t[i] - attack_start
        phase_in_cycle = elapsed % cycle
        if phase_in_cycle < burst_duration:
            signal[i] += amplitude * np.sin(2 * np.pi * 13.0 * t[i])

    return np.clip(signal, 0.0, 5.0)
