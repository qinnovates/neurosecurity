#!/usr/bin/env python3
"""
neurowall/test_nic_chains.py
NIC (Neural Impact Chain) attack simulation test suite.

Tests the Neurowall 3-layer pipeline against a range of attack techniques
from the QIF TARA registry, including both "known" attacks (already detected
by existing defenses) and evasion attacks designed to bypass them.

Each test scenario documents:
- TARA technique ID and NIC chain
- Which layers detect the attack (L1, SSVEP signature, coherence monitor)
- Detection gaps and evasion success/failure
- NISS score escalation behavior

The goal is NOT to prove the firewall is perfect. It's to map exactly
where the detection boundaries are, so we know what Phase 1 needs to fix.

Usage:
    python test_nic_chains.py              # Run all scenarios (single run)
    python test_nic_chains.py --scenario 3 # Run scenario 3 only
    python test_nic_chains.py --verbose     # Show per-window coherence diagnostics
    python test_nic_chains.py --sweep       # Duration sweep (10, 20, 30, 60s)
    python test_nic_chains.py --runs 50     # Statistical analysis (50 runs per scenario)

Dependencies:
    pip install numpy lz4 cryptography scipy
"""

import argparse
import sys
import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional

# Import pipeline components from sim.py
from sim import (
    SAMPLE_RATE, WINDOW_SIZE, SSVEP_TARGETS,
    SignalBoundary, SignalMonitor, NissEngine, RunematePolicy,
    PrivacyBudget, NspSession, NspReceiver,
    apply_local_dp, DP_EPSILON, DP_SENSITIVITY,
    generate_eeg,
)


# ─── Attack Scenario Definitions ──────────────────────────────────────────────

@dataclass
class AttackScenario:
    """Defines a single attack test scenario with TARA metadata."""
    id: int
    name: str
    tara_id: str                    # QIF-Txxxx or "N/A"
    tactic: str                     # QIF tactic code
    nic_chain: str                  # Neural Impact Chain path
    niss_vector: str                # NISS scoring vector
    severity: str                   # CRITICAL / HIGH / MEDIUM / LOW
    description: str                # What the attack does
    detection_expected: Dict[str, bool]  # Which layers should catch it
    generate_fn: str                # Name of generator function to call
    # Results (filled after run)
    l1_blocked: int = 0
    ssvep_detected: bool = False
    monitor_detected: bool = False
    monitor_anomaly_count: int = 0
    max_niss: int = 0
    policy_tightened: bool = False
    min_cs: float = 1.0
    max_anomaly_score: float = 0.0
    baseline_cs: float = 0.0


def generate_clean(duration_s: float, fs: int) -> np.ndarray:
    """Control: clean EEG with no attack."""
    return generate_eeg(duration_s, fs)


def generate_ssvep_15hz(duration_s: float, fs: int) -> np.ndarray:
    """Known SSVEP attack at 15Hz. Both detectors should catch this."""
    return generate_eeg(duration_s, fs, attack_freq=15.0, attack_start=5.0)


def generate_ssvep_novel(duration_s: float, fs: int) -> np.ndarray:
    """SSVEP at 13Hz (NOT in notch filter bank).
    Tests: does the monitor catch an SSVEP at an unlisted frequency?
    The notch filters only cover 8.57, 10.9, 15.0, 20.0 Hz.
    13Hz is outside the bank. L1 won't filter it. SSVEP signature
    detector won't flag it (no bin match). Only the coherence monitor
    can catch the spectral distortion.
    """
    return generate_eeg(duration_s, fs, attack_freq=13.0, attack_start=5.0)


def generate_impedance_spike(duration_s: float, fs: int) -> np.ndarray:
    """Impedance spike. L1 guard should catch and lockout."""
    return generate_eeg(duration_s, fs, spike_time=3.0)


def generate_drift(duration_s: float, fs: int) -> np.ndarray:
    """Slow DC drift (simplified QIF-T0066).
    SSVEP detector blind. Monitor catches via spectral entropy shift.
    """
    return generate_eeg(duration_s, fs, drift=True, attack_start=5.0)


def generate_flood(duration_s: float, fs: int) -> np.ndarray:
    """QIF-T0026 neuronal flooding. Broadband saturation."""
    return generate_eeg(duration_s, fs, flood=True, attack_start=5.0)


def generate_boiling_frog(duration_s: float, fs: int) -> np.ndarray:
    """QIF-T0066: Adiabatic phase space manipulation ("boiling frog").

    Unlike the simple drift, this attack is designed to stay below the
    per-window detection threshold. Each window's change is small enough
    to look normal, but cumulative displacement is significant.

    NIC chain: I0 -> N1-N7 (all neural layers, slow accumulation)
    Tactic: QIF-B.EV (evasion)
    Severity: HIGH
    Status: THEORETICAL

    The key insight from the TARA entry: "traces a path through parameter
    space that avoids bifurcation boundaries, ensuring smooth tracking
    without triggering discontinuous transitions that detection systems
    monitor."

    Detection challenge: The coherence monitor uses a per-window Cs
    computation. If each window looks individually normal, the cumulative
    drift is invisible. This requires a STATEFUL drift detector (not yet
    implemented) that tracks Cs trajectory over many windows.
    """
    n_samples = int(duration_s * fs)
    t = np.arange(n_samples) / fs

    # Base alpha rhythm
    signal = 2.5 + 0.05 * np.sin(2 * np.pi * 10 * t)

    # Background noise
    white = np.random.randn(n_samples)
    pink = np.cumsum(white) * 0.001
    pink -= np.mean(pink)
    signal += pink
    signal += 0.01 * np.sin(2 * np.pi * 60 * t)

    # Boiling frog: ultra-slow drift, only 0.001V per second.
    # Over 8 seconds of attack (t=2 to t=10), total displacement = 0.008V.
    # Each 0.5s window sees only ~0.0005V change, well within noise floor.
    # But after 60+ seconds, displacement would reach 0.06V (meaningful).
    # This tests whether the monitor catches sub-threshold accumulation.
    attack_start = 5.0
    drift_mask = t >= attack_start
    drift_region = t[drift_mask] - attack_start
    # Ultra-slow: 0.001V/s (vs 1.5V over 3s for the simple drift)
    signal[drift_mask] += 0.001 * drift_region

    return np.clip(signal, 0.0, 5.0)


def generate_envelope_modulation(duration_s: float, fs: int) -> np.ndarray:
    """QIF-T0014: Envelope modulation (stealth carrier).

    A high-frequency carrier (>50Hz, outside EEG band of interest) is
    amplitude-modulated at a biologically active frequency. The carrier
    itself looks like noise or powerline artifact. The attack is in the
    envelope, which neural tissue demodulates.

    NIC chain: S1-S2 -> any N (N1-N7)
    Tactic: QIF-E.RD (resource development / staging)
    Severity: HIGH
    Status: DEMONSTRATED (Datta et al. 2009; Chaieb et al. 2011)

    Detection challenge: The carrier frequency (e.g., 80Hz) is outside
    the alpha band that the coherence monitor tracks. The modulation
    envelope at 10Hz matches the existing alpha rhythm, so spectral
    entropy may not shift significantly. This is a sophisticated attack
    that requires demodulation analysis to detect.

    Engineering parameters from TARA:
    - Carrier: >500 Hz (we use 80Hz for sim, limited by 250Hz Nyquist)
    - Envelope: 0.5-40 Hz (we use 10Hz to mimic alpha)
    - Modulation depth: 0-100% (we use 80%)
    """
    n_samples = int(duration_s * fs)
    t = np.arange(n_samples) / fs

    # Base alpha rhythm
    signal = 2.5 + 0.05 * np.sin(2 * np.pi * 10 * t)

    # Background noise
    white = np.random.randn(n_samples)
    pink = np.cumsum(white) * 0.001
    pink -= np.mean(pink)
    signal += pink
    signal += 0.01 * np.sin(2 * np.pi * 60 * t)

    # Envelope modulation attack starting at t=5s (after calibration)
    attack_start = 5.0
    attack_mask = t >= attack_start

    # Carrier at 80 Hz (highest we can do at 250Hz sample rate, Nyquist=125Hz)
    # In a real attack, carrier would be >500Hz with higher sample rate
    carrier_freq = 80.0
    # Envelope at 10 Hz (matches alpha rhythm, maximum stealth)
    envelope_freq = 10.0
    modulation_depth = 0.8  # 80% modulation depth

    carrier = np.sin(2 * np.pi * carrier_freq * t)
    envelope = 0.5 * (1 + modulation_depth * np.sin(2 * np.pi * envelope_freq * t))

    # AM signal: carrier * envelope, scaled to be subtle
    am_signal = np.zeros(n_samples)
    am_signal[attack_mask] = 0.15 * carrier[attack_mask] * envelope[attack_mask]
    signal += am_signal

    return np.clip(signal, 0.0, 5.0)


def generate_phase_replay(duration_s: float, fs: int) -> np.ndarray:
    """QIF-T0067: Phase dynamics replay / mimicry.

    Records (or synthesizes) neural signals that reproduce the dynamical
    system trajectory of legitimate brain activity. The replayed signal
    has correct alpha phase, correct spectral shape, correct amplitude
    statistics. It looks exactly like real EEG.

    NIC chain: S1 -> I0 -> N1, N3, N5-N7
    Tactic: QIF-N.IJ (neural injection)
    Severity: CRITICAL
    Status: DEMONSTRATED (20 verified methods, 2012-2025)

    Detection challenge: This is the hardest attack to detect because
    by definition the replayed signal matches the statistics of legitimate
    brain activity. The coherence monitor computes Cs from spectral entropy
    and phase variance, both of which are DESIGNED to match normal values.

    Current detection rate: 0% against sophisticated replays (per TARA).
    Requires biological TLS (challenge-response) for proper detection,
    which is a Phase 2+ capability.

    For this test, we simulate a replay by generating a second independent
    "clean" EEG signal and substituting it during the attack window. This
    represents a perfect replay: statistically identical to real EEG but
    not the user's actual brain activity.
    """
    n_samples = int(duration_s * fs)
    t = np.arange(n_samples) / fs

    # Legitimate EEG (first 2 seconds)
    signal = 2.5 + 0.05 * np.sin(2 * np.pi * 10 * t)
    white = np.random.randn(n_samples)
    pink = np.cumsum(white) * 0.001
    pink -= np.mean(pink)
    signal += pink
    signal += 0.01 * np.sin(2 * np.pi * 60 * t)

    # At t=5s, swap to a DIFFERENT clean EEG (replay).
    # This has the same statistical properties but different noise seed.
    attack_start = 5.0
    attack_mask = t >= attack_start

    # Generate replay signal with different random seed
    rng = np.random.RandomState(42)  # Deterministic but different from default
    replay_alpha = 0.05 * np.sin(2 * np.pi * 10.0 * t + 0.7)  # Slight phase offset
    replay_white = rng.randn(n_samples)
    replay_pink = np.cumsum(replay_white) * 0.001
    replay_pink -= np.mean(replay_pink)
    replay_signal = 2.5 + replay_alpha + replay_pink
    replay_signal += 0.01 * np.sin(2 * np.pi * 60 * t)

    # Substitute replay during attack window
    signal[attack_mask] = replay_signal[attack_mask]

    return np.clip(signal, 0.0, 5.0)


def generate_closed_loop_cascade(duration_s: float, fs: int) -> np.ndarray:
    """QIF-T0023: Closed-loop perturbation cascade.

    Small adversarial perturbation injected into a closed-loop BCI that
    amplifies through the feedback cycle. Each loop iteration increases
    deviation until the system destabilizes.

    NIC chain: S2 -> I0 -> N5-N7
    Tactic: QIF-M.SV (subversion)
    Severity: CRITICAL
    Status: EMERGING

    We simulate this by injecting a perturbation that starts tiny and
    grows exponentially (simulating feedback amplification). The growth
    rate is tuned so the first few windows look clean, but by the end
    the signal is heavily distorted.

    Engineering parameters from TARA:
    - Loop latency: <50ms
    - Gain limit: bounded (but attacker exceeds it)
    - Detection: loop gain monitoring, oscillation detection

    Detection challenge: Early windows look normal (small perturbation).
    The exponential growth means the attack is only detectable after
    several feedback cycles. This tests the monitor's sensitivity to
    gradual amplitude changes.
    """
    n_samples = int(duration_s * fs)
    t = np.arange(n_samples) / fs

    # Base alpha rhythm
    signal = 2.5 + 0.05 * np.sin(2 * np.pi * 10 * t)

    # Background noise
    white = np.random.randn(n_samples)
    pink = np.cumsum(white) * 0.001
    pink -= np.mean(pink)
    signal += pink
    signal += 0.01 * np.sin(2 * np.pi * 60 * t)

    # Closed-loop cascade: exponential growth starting at t=5s
    attack_start = 5.0
    attack_mask = t >= attack_start
    attack_t = t[attack_mask] - attack_start

    # Perturbation: starts at 0.001V, doubles every 1.5 seconds
    # At t=2s: 0.001V (invisible)
    # At t=3.5s: 0.002V (invisible)
    # At t=5s: 0.004V (barely detectable)
    # At t=6.5s: 0.008V (detectable as alpha amplitude doubles)
    # At t=8s: 0.016V (clearly anomalous, amplitude 4x normal)
    growth_rate = np.log(2) / 1.5  # Doubling time = 1.5s
    perturbation = 0.001 * np.exp(growth_rate * attack_t)

    # The perturbation modulates at a frequency that interacts with alpha
    # (simulating feedback loop resonance at 11Hz, near alpha)
    cascade_signal = np.zeros(n_samples)
    cascade_signal[attack_mask] = perturbation * np.sin(
        2 * np.pi * 11.0 * t[attack_mask]
    )
    signal += cascade_signal

    return np.clip(signal, 0.0, 5.0)


# ─── Adversarial-Aware Attack Generators ─────────────────────────────────────


def generate_notch_aware_ssvep(duration_s: float, fs: int) -> np.ndarray:
    """SSVEP at 12Hz, precisely between notch filters (10.9 and 15 Hz).
    Tests adaptive spectral peak detection.
    """
    return generate_eeg(duration_s, fs, attack_freq=12.0, attack_start=5.0)


def generate_freq_hopping_ssvep(duration_s: float, fs: int) -> np.ndarray:
    """SSVEP that hops frequency every 0.5s to evade sustained peak detection.
    Peak detector requires 3/4 consecutive windows at same freq bin.
    """
    n_samples = int(duration_s * fs)
    t = np.arange(n_samples) / fs
    signal = generate_eeg(duration_s, fs)

    # Hop between frequencies that avoid the notch bank
    hop_freqs = [6.0, 12.0, 13.0, 17.0, 22.0, 25.0, 7.0, 14.0]
    attack_start = 5.0
    hop_interval = 0.5  # one window

    for i in range(n_samples):
        if t[i] < attack_start:
            continue
        elapsed = t[i] - attack_start
        freq_idx = int(elapsed / hop_interval) % len(hop_freqs)
        signal[i] += 0.4 * np.sin(2 * np.pi * hop_freqs[freq_idx] * t[i])

    return np.clip(signal, 0.0, 5.0)


def generate_threshold_aware_ramp(duration_s: float, fs: int) -> np.ndarray:
    """Perturbation calibrated to stay just below per-window z-score threshold.
    Injects steady 0.025V at 11Hz (near alpha, max interference).
    """
    n_samples = int(duration_s * fs)
    t = np.arange(n_samples) / fs
    signal = generate_eeg(duration_s, fs)

    attack_start = 5.0
    mask = t >= attack_start
    signal[mask] += 0.025 * np.sin(2 * np.pi * 11.0 * t[mask])
    return np.clip(signal, 0.0, 5.0)


def generate_cusum_aware_intermittent(duration_s: float, fs: int) -> np.ndarray:
    """Intermittent SSVEP bursts with clean gaps to let CUSUM drain.
    0.4s bursts at 13Hz with 1.0s clean gaps.
    """
    n_samples = int(duration_s * fs)
    t = np.arange(n_samples) / fs
    signal = generate_eeg(duration_s, fs)

    attack_start = 5.0
    burst_dur = 0.4
    gap_dur = 1.0
    cycle = burst_dur + gap_dur

    for i in range(n_samples):
        if t[i] < attack_start:
            continue
        phase = (t[i] - attack_start) % cycle
        if phase < burst_dur:
            signal[i] += 0.5 * np.sin(2 * np.pi * 13.0 * t[i])

    return np.clip(signal, 0.0, 5.0)


def generate_spectral_mimicry(duration_s: float, fs: int) -> np.ndarray:
    """Broadband noise shaped to match baseline spectral profile.
    Increases total power 1.5x but preserves spectral shape.
    """
    from scipy.signal import butter, sosfilt

    n_samples = int(duration_s * fs)
    t = np.arange(n_samples) / fs
    signal = generate_eeg(duration_s, fs)

    attack_start = 5.0
    mask = t >= attack_start
    nyq = fs / 2.0

    rng = np.random.RandomState(77)
    white = rng.randn(n_samples + 500)
    extra = np.zeros(n_samples)

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
        extra += filtered[:n_samples]

    scale = np.sqrt(1.5) - 1.0
    signal[mask] += scale * extra[mask]
    return np.clip(signal, 0.0, 5.0)


# ─── Scenario Registry ───────────────────────────────────────────────────────

SCENARIOS: List[AttackScenario] = [
    AttackScenario(
        id=0,
        name="Clean Signal (Control)",
        tara_id="N/A",
        tactic="N/A",
        nic_chain="N/A",
        niss_vector="N/A",
        severity="N/A",
        description="No attack. Establishes false-positive baseline.",
        detection_expected={"l1": False, "ssvep": False, "monitor": False},
        generate_fn="generate_clean",
    ),
    AttackScenario(
        id=1,
        name="SSVEP 15Hz (Known Target)",
        tara_id="N/A (generic SSVEP)",
        tactic="QIF-N.IJ",
        nic_chain="S1 -> I0 -> N1 (visual cortex entrainment)",
        niss_vector="BI:M / CG:M / CV:I / RV:P / NP:S",
        severity="MEDIUM",
        description="Standard SSVEP attack at a known target frequency. "
                    "Both the L1 notch filter and SSVEP signature detector "
                    "should catch this. Coherence monitor also detects via "
                    "spectral entropy shift.",
        detection_expected={"l1": True, "ssvep": True, "monitor": True},
        generate_fn="generate_ssvep_15hz",
    ),
    AttackScenario(
        id=2,
        name="SSVEP 13Hz (Novel Frequency)",
        tara_id="N/A (novel-frequency SSVEP)",
        tactic="QIF-N.IJ",
        nic_chain="S1 -> I0 -> N1 (visual cortex entrainment)",
        niss_vector="BI:M / CG:M / CV:I / RV:P / NP:S",
        severity="MEDIUM",
        description="SSVEP attack at 13Hz, which is NOT in the notch filter "
                    "bank (8.57, 10.9, 15, 20 Hz). L1 won't filter it. "
                    "SSVEP signature detector won't flag it. Only the "
                    "coherence monitor can catch the spectral distortion.",
        detection_expected={"l1": False, "ssvep": False, "monitor": True},
        generate_fn="generate_ssvep_novel",
    ),
    AttackScenario(
        id=3,
        name="Impedance Spike",
        tara_id="N/A (hardware injection)",
        tactic="QIF-P.DS",
        nic_chain="I0 (electrode manipulation)",
        niss_vector="BI:L / CG:L / CV:N / RV:P / NP:N",
        severity="LOW",
        description="Sudden >2.5V jump to trigger L1 impedance guard. "
                    "This is a blunt hardware attack, immediately caught.",
        detection_expected={"l1": True, "ssvep": False, "monitor": False},
        generate_fn="generate_impedance_spike",
    ),
    AttackScenario(
        id=4,
        name="Slow DC Drift",
        tara_id="QIF-T0062",
        tactic="QIF-B.EV",
        nic_chain="I0 -> N1-N3 (gradual parameter shift)",
        niss_vector="BI:L / CG:M / CV:I / RV:P / NP:S",
        severity="MEDIUM",
        description="Slow DC ramp that changes the baseline over time. "
                    "SSVEP detector is blind (no target frequency). "
                    "Coherence monitor detects via spectral entropy shift "
                    "as the DC component changes the power distribution.",
        detection_expected={"l1": False, "ssvep": False, "monitor": True},
        generate_fn="generate_drift",
    ),
    AttackScenario(
        id=5,
        name="Neuronal Flooding (QIF-T0026)",
        tara_id="QIF-T0026",
        tactic="QIF-P.DS",
        nic_chain="I0 -> N4 (thalamic gate overwhelmed) -> N5 (basal ganglia) "
                  "-> N6 (limbic saturation) -> N7 (cortical flooding, seizure risk)",
        niss_vector="BI:H / CG:H / CV:E / RV:P / NP:T (score 6.4)",
        severity="CRITICAL",
        description="Broadband saturation across all frequencies. "
                    "DDoS equivalent for neural tissue. SSVEP detector "
                    "is blind (no single target freq). Coherence monitor "
                    "catches via phase coherence collapse + spectral entropy "
                    "spike. Exceeds BCI thermal budget (software capacitor overflow).",
        detection_expected={"l1": False, "ssvep": False, "monitor": True},
        generate_fn="generate_flood",
    ),
    AttackScenario(
        id=6,
        name="Boiling Frog (QIF-T0066)",
        tara_id="QIF-T0066",
        tactic="QIF-B.EV",
        nic_chain="I0 -> N1-N7 (adiabatic accumulation across all neural layers)",
        niss_vector="BI:L / CG:H / CV:I / RV:P / NP:S (score 7.4)",
        severity="HIGH",
        description="Ultra-slow adiabatic drift designed to stay below "
                    "per-window detection thresholds. Each window looks "
                    "individually normal. Cumulative displacement is the "
                    "danger. Requires STATEFUL trajectory tracking to detect "
                    "(not yet implemented). Expected: EVASION SUCCESS.",
        detection_expected={"l1": False, "ssvep": False, "monitor": False},
        generate_fn="generate_boiling_frog",
    ),
    AttackScenario(
        id=7,
        name="Envelope Modulation (QIF-T0014)",
        tara_id="QIF-T0014",
        tactic="QIF-E.RD",
        nic_chain="S1-S2 -> any N (tissue demodulates envelope at neural freq)",
        niss_vector="BI:H / CG:H / CV:I / RV:P / NP:S (score 8.1)",
        severity="HIGH",
        description="High-freq carrier (80Hz) amplitude-modulated at 10Hz "
                    "(alpha). Carrier looks like noise/powerline artifact. "
                    "Attack is in the modulation envelope. Neural tissue "
                    "demodulates it. Requires demodulation analysis to detect. "
                    "Demonstrated: Datta et al. 2009.",
        detection_expected={"l1": False, "ssvep": False, "monitor": False},
        generate_fn="generate_envelope_modulation",
    ),
    AttackScenario(
        id=8,
        name="Phase Dynamics Replay (QIF-T0067)",
        tara_id="QIF-T0067",
        tactic="QIF-N.IJ",
        nic_chain="S1 -> I0 -> N1, N3, N5-N7 (replayed trajectory hijacks "
                  "motor/cognitive pathways)",
        niss_vector="BI:L / CG:H / CV:I / RV:P / NP:T (score 6.4)",
        severity="CRITICAL",
        description="Replays statistically identical neural signal trajectory. "
                    "Same alpha phase, spectral shape, amplitude stats. "
                    "Current detection rate: 0% against sophisticated replays. "
                    "Requires biological TLS (Phase 2+). Expected: EVASION SUCCESS.",
        detection_expected={"l1": False, "ssvep": False, "monitor": False},
        generate_fn="generate_phase_replay",
    ),
    AttackScenario(
        id=9,
        name="Closed-Loop Cascade (QIF-T0023)",
        tara_id="QIF-T0023",
        tactic="QIF-M.SV",
        nic_chain="S2 -> I0 -> N5 (basal ganglia) -> N6 (limbic) -> N7 "
                  "(cortical destabilization)",
        niss_vector="BI:H / CG:H / CV:E / RV:P / NP:S (score 7.4)",
        severity="CRITICAL",
        description="Exponentially growing perturbation simulating feedback "
                    "amplification in a closed-loop BCI. Starts invisible "
                    "(0.001V), doubles every 1.5s. Early windows look clean. "
                    "At 10s observation, only 9 anomalies (below FPR-adjusted "
                    "threshold of 12). Needs longer observation or loop gain "
                    "monitoring. Expected: EVASION at 10s.",
        detection_expected={"l1": False, "ssvep": False, "monitor": False},
        generate_fn="generate_closed_loop_cascade",
    ),
    # ─── Adversarial-Aware Scenarios ─────────────────────────────────────────
    AttackScenario(
        id=10,
        name="Notch-Aware SSVEP 12Hz",
        tara_id="N/A (adversarial-aware)",
        tactic="QIF-N.IJ",
        nic_chain="S1 -> I0 -> N1 (interstitial frequency)",
        niss_vector="BI:M / CG:M / CV:I / RV:P / NP:S",
        severity="MEDIUM",
        description="SSVEP at 12Hz, precisely between notch filters (10.9 and "
                    "15 Hz). Attacker knows the notch bank. Tests adaptive "
                    "spectral peak detection.",
        detection_expected={"l1": False, "ssvep": False, "monitor": True},
        generate_fn="generate_notch_aware_ssvep",
    ),
    AttackScenario(
        id=11,
        name="Freq-Hopping SSVEP",
        tara_id="N/A (adversarial-aware)",
        tactic="QIF-N.IJ",
        nic_chain="S1 -> I0 -> N1 (frequency-agile)",
        niss_vector="BI:M / CG:M / CV:I / RV:P / NP:S",
        severity="MEDIUM",
        description="SSVEP that hops frequency every 0.5s. Designed to evade "
                    "sustained spectral peak detector (3/4 consecutive windows). "
                    "Each window has a peak but never at the same bin.",
        detection_expected={"l1": False, "ssvep": False, "monitor": True},
        generate_fn="generate_freq_hopping_ssvep",
    ),
    AttackScenario(
        id=12,
        name="Threshold-Aware Ramp",
        tara_id="N/A (adversarial-aware)",
        tactic="QIF-B.EV",
        nic_chain="I0 -> N1-N4 (sub-threshold accumulation)",
        niss_vector="BI:L / CG:H / CV:I / RV:P / NP:S",
        severity="HIGH",
        description="Perturbation calibrated to produce z-score ~1.2 per window "
                    "(below 1.5 threshold). Tests CUSUM and growth detectors.",
        detection_expected={"l1": False, "ssvep": False, "monitor": False},
        generate_fn="generate_threshold_aware_ramp",
    ),
    AttackScenario(
        id=13,
        name="CUSUM-Aware Intermittent",
        tara_id="N/A (adversarial-aware)",
        tactic="QIF-N.IJ",
        nic_chain="S1 -> I0 -> N1-N4 (burst-gap pattern)",
        niss_vector="BI:M / CG:H / CV:I / RV:P / NP:S",
        severity="HIGH",
        description="Intermittent 0.4s SSVEP bursts at 13Hz with 1.0s clean gaps. "
                    "Designed to prevent CUSUM accumulation. Tests stateful "
                    "detection resilience.",
        detection_expected={"l1": False, "ssvep": False, "monitor": True},
        generate_fn="generate_cusum_aware_intermittent",
    ),
    AttackScenario(
        id=14,
        name="Spectral Mimicry",
        tara_id="N/A (adversarial-aware)",
        tactic="QIF-N.IJ",
        nic_chain="S1 -> I0 -> N1-N7 (broadband stealth)",
        niss_vector="BI:M / CG:H / CV:I / RV:P / NP:T",
        severity="HIGH",
        description="Broadband noise shaped to match baseline spectral profile. "
                    "No novel peaks. Spectral entropy stays flat. Only total "
                    "power increases 1.5x. Tests whether coherence monitor "
                    "catches power increase without spectral shape change.",
        detection_expected={"l1": False, "ssvep": False, "monitor": False},
        generate_fn="generate_spectral_mimicry",
    ),
]


# ─── Test Runner ──────────────────────────────────────────────────────────────

def check_ssvep_power(buffer: np.ndarray, fs: int = SAMPLE_RATE) -> Tuple[bool, float]:
    """Check SSVEP power at target frequencies using LOCAL spectral peak
    detection. Compares each target bin to its spectral neighbors (±3 bins),
    not the global median. This avoids false positives from the natural
    1/f^2 spectral slope of pink noise.

    Also excludes the 10.9Hz target which overlaps with the natural 10Hz
    alpha rhythm at 2Hz FFT resolution.

    Returns (detected, max_ratio).
    """
    buf_ac = buffer - np.mean(buffer)
    fft = np.fft.rfft(buf_ac)
    power = np.abs(fft) ** 2
    freq_res = fs / len(buffer) if len(buffer) > 0 else 1.0

    max_ratio = 0.0
    # Skip 10.9Hz (bin 5 at 2Hz resolution) because it overlaps with
    # the natural 10Hz alpha rhythm, causing false positives.
    check_targets = [f for f in SSVEP_TARGETS if abs(f - 10.9) > 1.0]

    for target_hz in check_targets:
        bin_idx = int(round(target_hz / freq_res))
        if bin_idx < 4 or bin_idx >= len(power) - 3:
            continue

        # Local comparison: average of neighboring bins (±3, excluding target)
        neighbors = []
        for offset in [-3, -2, 2, 3]:
            nb = bin_idx + offset
            if 0 < nb < len(power):
                neighbors.append(power[nb])
        if not neighbors:
            continue

        local_avg = np.mean(neighbors) + 1e-10
        ratio = power[bin_idx] / local_avg
        if ratio > max_ratio:
            max_ratio = ratio

    # Threshold: local ratio > 5 indicates a sharp spectral peak
    # at a target frequency (not just 1/f slope)
    return max_ratio > 5.0, max_ratio


def run_scenario(
    scenario: AttackScenario,
    duration: float = 10.0,
    verbose: bool = False,
    seed: int = None,
) -> AttackScenario:
    """Run a single attack scenario through the full Neurowall pipeline.

    Returns the scenario with results filled in.
    """
    # Get the generator function by name
    generators = {
        "generate_clean": generate_clean,
        "generate_ssvep_15hz": generate_ssvep_15hz,
        "generate_ssvep_novel": generate_ssvep_novel,
        "generate_impedance_spike": generate_impedance_spike,
        "generate_drift": generate_drift,
        "generate_flood": generate_flood,
        "generate_boiling_frog": generate_boiling_frog,
        "generate_envelope_modulation": generate_envelope_modulation,
        "generate_phase_replay": generate_phase_replay,
        "generate_closed_loop_cascade": generate_closed_loop_cascade,
        "generate_notch_aware_ssvep": generate_notch_aware_ssvep,
        "generate_freq_hopping_ssvep": generate_freq_hopping_ssvep,
        "generate_threshold_aware_ramp": generate_threshold_aware_ramp,
        "generate_cusum_aware_intermittent": generate_cusum_aware_intermittent,
        "generate_spectral_mimicry": generate_spectral_mimicry,
    }

    # Fixed seed per scenario for reproducible results.
    # Each scenario gets a unique seed so they have independent noise.
    # Optional seed override for statistical analysis (different seed per run).
    if seed is not None:
        np.random.seed(seed)
    else:
        np.random.seed(42 + scenario.id)

    gen_fn = generators[scenario.generate_fn]
    signal = gen_fn(duration, SAMPLE_RATE)

    # Initialize pipeline
    l1 = SignalBoundary()
    # Fix L1 startup artifact: initialize prev_sample to first signal value
    # so the first sample doesn't trigger impedance guard due to 0->2.5V jump.
    l1.prev_sample = signal[0]
    monitor = SignalMonitor(calibration_windows=8)
    niss = NissEngine()
    policy = RunematePolicy()
    budget = PrivacyBudget()

    current_epsilon = DP_EPSILON
    monitor_counter = 0
    detail = None
    max_niss = 0
    ssvep_triggered = False
    ssvep_max_ratio = 0.0

    # Separate SSVEP detection buffer (post-attack only, from t=5s onward)
    ssvep_check_buffer: List[float] = []
    attack_start_sample = int(5.0 * SAMPLE_RATE)

    if verbose:
        print(f"\n  --- Per-window diagnostics for: {scenario.name} ---")

    for i, raw_sample in enumerate(signal):
        t_sec = i / SAMPLE_RATE

        # L1
        filtered, blocked = l1.process(raw_sample)
        if blocked:
            niss.update(0.0, imp_event=True)
            continue

        niss.update(raw_sample)
        monitor.update(raw_sample)

        # Collect post-attack samples for dedicated SSVEP check
        if i >= attack_start_sample:
            ssvep_check_buffer.append(raw_sample)
            if len(ssvep_check_buffer) >= 125:
                detected, ratio = check_ssvep_power(np.array(ssvep_check_buffer))
                if detected:
                    ssvep_triggered = True
                if ratio > ssvep_max_ratio:
                    ssvep_max_ratio = ratio
                ssvep_check_buffer.clear()

        # Coherence monitor
        anomaly_score = 0.0
        monitor_counter += 1
        if monitor_counter >= monitor.window_size:
            monitor_counter = 0
            anomaly_score, detail = monitor.evaluate()

            if verbose and detail.get("status") == "monitoring":
                cs = detail.get("cs", 0)
                flag = ""
                if anomaly_score > 3.0:
                    flag = " *** ANOMALY ***"
                elif anomaly_score > 1.5:
                    flag = " (elevated)"
                traj = ""
                if detail.get("trajectory_flag"):
                    traj = f" [TRAJ drift={detail.get('trajectory_drift', 0):.4f}]"
                growth = ""
                if detail.get("growth_flag"):
                    growth = " [GROWTH DETECTED]"
                print(f"    [{t_sec:6.3f}s] Cs={cs:.4f} "
                      f"ewma={detail.get('cs_ewma', 0):.4f} "
                      f"anomaly={anomaly_score:.2f} "
                      f"H_tau={detail.get('h_tau', 0):.4f}"
                      f"{flag}{traj}{growth}")

            if anomaly_score > scenario.max_anomaly_score:
                scenario.max_anomaly_score = anomaly_score

        # NISS (uses both signature and anomaly inputs)
        niss_bio = niss.score(anomaly_score=anomaly_score)
        if niss_bio > max_niss:
            max_niss = niss_bio

        # Policy (evaluate once per monitor window, not per sample)
        if monitor_counter == 0 and detail is not None:
            policy_result = policy.evaluate(
                niss_bio, current_epsilon, anomaly_score, detail,
            )
            if policy_result["epsilon"] < current_epsilon:
                scenario.policy_tightened = True
            current_epsilon = policy_result["epsilon"]

    # Fill results
    # L1: only count impedance events AFTER startup (first sample excluded
    # by prev_sample initialization, so imp_events should be accurate now)
    scenario.l1_blocked = l1.imp_events
    scenario.ssvep_detected = ssvep_triggered
    scenario.monitor_anomaly_count = monitor.stats["anomaly_count"]
    # monitor_detected is set AFTER all scenarios run, relative to clean baseline
    scenario.monitor_detected = False
    scenario.max_niss = max_niss
    scenario.min_cs = monitor._last_cs
    scenario.baseline_cs = monitor._baseline_cs_mean

    if monitor._calibrated:
        scenario.min_cs = monitor._last_cs
        scenario.baseline_cs = monitor._baseline_cs_mean

    return scenario


def print_results(scenarios: List[AttackScenario]):
    """Print the results matrix."""
    print()
    print("=" * 90)
    print("  NEUROWALL NIC CHAIN TEST RESULTS")
    print("=" * 90)
    print()

    # Detection matrix
    print("  DETECTION MATRIX")
    print("  " + "-" * 86)
    print(f"  {'#':<3} {'Scenario':<35} {'L1':>4} {'SSVEP':>6} {'Monitor':>8} "
          f"{'NISS':>5} {'Policy':>7} {'Result':<12}")
    print("  " + "-" * 86)

    for s in scenarios:
        l1_str = "YES" if s.l1_blocked > 0 else "---"
        ssvep_str = "YES" if s.ssvep_detected else "---"
        mon_str = f"YES({s.monitor_anomaly_count})" if s.monitor_detected else "---"
        niss_str = str(s.max_niss)
        policy_str = "TIGHT" if s.policy_tightened else "---"

        # Determine result
        if s.id == 0:
            # Control: shows FPR baseline (monitor_detected is always False for clean)
            fpr = s.l1_blocked > 0 or s.ssvep_detected
            result = "BASELINE" if not fpr else "FALSE POS"
        else:
            # Attack: success means at least one layer detected
            any_detection = s.l1_blocked > 0 or s.ssvep_detected or s.monitor_detected
            if any_detection:
                result = "DETECTED"
            else:
                result = "** EVADED **"

        print(f"  {s.id:<3} {s.name:<35} {l1_str:>4} {ssvep_str:>6} {mon_str:>8} "
              f"{niss_str:>5} {policy_str:>7} {result:<12}")

    print("  " + "-" * 86)

    # Expected vs actual
    print()
    print("  EXPECTED vs ACTUAL COMPARISON")
    print("  " + "-" * 86)
    print(f"  {'#':<3} {'Scenario':<35} {'Expected':<25} {'Actual':<25} {'Match':<6}")
    print("  " + "-" * 86)

    all_match = True
    for s in scenarios:
        exp_parts = []
        act_parts = []

        if s.detection_expected.get("l1"):
            exp_parts.append("L1")
        if s.detection_expected.get("ssvep"):
            exp_parts.append("SSVEP")
        if s.detection_expected.get("monitor"):
            exp_parts.append("Monitor")
        if not exp_parts:
            exp_parts.append("None (evasion)")

        if s.l1_blocked > 0:
            act_parts.append("L1")
        if s.ssvep_detected:
            act_parts.append("SSVEP")
        if s.monitor_detected:
            act_parts.append("Monitor")
        if not act_parts:
            act_parts.append("None (evaded)")

        expected_str = ", ".join(exp_parts)
        actual_str = ", ".join(act_parts)

        # Check match (for attacks, "better than expected" is also OK)
        if s.id == 0:
            match = not (s.l1_blocked > 0 or s.ssvep_detected or s.monitor_detected)
        else:
            exp_detect = any(s.detection_expected.values())
            act_detect = s.l1_blocked > 0 or s.ssvep_detected or s.monitor_detected
            match = (exp_detect == act_detect) or (act_detect and not exp_detect)

        match_str = "OK" if match else "DIFF"
        if not match:
            all_match = False

        print(f"  {s.id:<3} {s.name:<35} {expected_str:<25} {actual_str:<25} {match_str:<6}")

    print("  " + "-" * 86)

    # Coherence details
    print()
    print("  COHERENCE MONITOR DETAILS")
    print("  " + "-" * 86)
    print(f"  {'#':<3} {'Scenario':<35} {'Baseline Cs':>12} {'Min Cs':>8} "
          f"{'Max Anomaly':>12} {'Anomalies':>10}")
    print("  " + "-" * 86)

    for s in scenarios:
        baseline_str = f"{s.baseline_cs:.4f}" if s.baseline_cs > 0 else "N/A"
        print(f"  {s.id:<3} {s.name:<35} {baseline_str:>12} {s.min_cs:>8.4f} "
              f"{s.max_anomaly_score:>12.2f} {s.monitor_anomaly_count:>10}")

    print("  " + "-" * 86)

    # NIC chain summary for detected attacks
    print()
    print("  NIC CHAINS & TARA MAPPING")
    print("  " + "-" * 86)
    for s in scenarios:
        if s.id == 0:
            continue
        detected = s.l1_blocked > 0 or s.ssvep_detected or s.monitor_detected
        status = "DETECTED" if detected else "EVADED"
        print(f"  [{status:>8}] {s.tara_id}: {s.name}")
        print(f"             NIC: {s.nic_chain}")
        print(f"             NISS: {s.niss_vector}")
        print(f"             Severity: {s.severity}")
        print()

    print("  " + "-" * 86)

    # Gap analysis
    print()
    print("  DETECTION GAP ANALYSIS")
    print("  " + "-" * 86)
    evaded = [s for s in scenarios if s.id > 0
              and not (s.l1_blocked > 0 or s.ssvep_detected or s.monitor_detected)]
    detected = [s for s in scenarios if s.id > 0
                and (s.l1_blocked > 0 or s.ssvep_detected or s.monitor_detected)]

    print(f"  Attacks detected:  {len(detected)}/{len(scenarios)-1}")
    print(f"  Attacks evaded:    {len(evaded)}/{len(scenarios)-1}")
    print()

    if evaded:
        print("  EVASION DETAILS (Phase 1+ requirements):")
        for s in evaded:
            print(f"    {s.tara_id} ({s.name}):")
            print(f"      Why evaded: {s.description[:120]}...")
            print(f"      Fix needed: ", end="")
            if "T0066" in s.tara_id:
                print("Stateful trajectory tracker (cumulative Cs displacement)")
            elif "T0014" in s.tara_id:
                print("Demodulation analysis (envelope extraction from carrier)")
            elif "T0067" in s.tara_id:
                print("Biological TLS (challenge-response authentication)")
            elif "T0023" in s.tara_id:
                print("Loop gain monitoring (exponential growth detector)")
            else:
                print("Unknown, requires research")
            print()

    print("=" * 90)

    # Overall verdict
    print()
    if all_match and not evaded:
        print("  VERDICT: All attacks detected. No evasions.")
    elif all_match:
        print(f"  VERDICT: Results match expectations. {len(evaded)} known gaps "
              f"documented for Phase 1+.")
    else:
        print(f"  VERDICT: UNEXPECTED RESULTS. Review DIFF entries above.")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="NIC chain attack simulation test suite for Neurowall",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Runs multiple attack scenarios from the QIF TARA registry against the
Neurowall 3-layer pipeline and reports detection results per layer.

Scenarios include both "detectable" attacks (baseline validation) and
"evasion" attacks designed to bypass current defenses (gap analysis).
        """
    )
    parser.add_argument("--scenario", type=int, default=None,
                        help="Run only this scenario number (0-9)")
    parser.add_argument("--duration", type=float, default=15.0,
                        help="Simulation duration in seconds (default: 15)")
    parser.add_argument("--verbose", action="store_true",
                        help="Show per-window coherence diagnostics")
    parser.add_argument("--sweep", action="store_true",
                        help="Duration sweep: run at 10, 20, 30, 60s")
    parser.add_argument("--runs", type=int, default=1,
                        help="Statistical runs per scenario (default: 1)")
    parser.add_argument("--roc", action="store_true",
                        help="ROC analysis: sweep thresholds x durations")
    parser.add_argument("--roc-runs", type=int, default=30,
                        help="Runs per threshold-duration combo (default: 30)")

    args = parser.parse_args()

    if args.roc:
        run_roc_analysis(args)
    elif args.sweep:
        run_duration_sweep(args)
    elif args.runs > 1:
        run_statistical(args)
    else:
        run_single(args)


def apply_fpr_adjustment(results):
    """Set monitor_detected relative to clean signal FPR baseline."""
    clean_result = next((r for r in results if r.id == 0), None)
    clean_anomalies = clean_result.monitor_anomaly_count if clean_result else 0

    for r in results:
        if r.id == 0:
            r.monitor_detected = False
        else:
            threshold = max(clean_anomalies * 2, clean_anomalies + 3)
            r.monitor_detected = r.monitor_anomaly_count > threshold

    return clean_anomalies


def run_single(args):
    """Standard single run of all scenarios."""
    print("=" * 90)
    print("  NEUROWALL NIC CHAIN ATTACK SIMULATION TEST SUITE")
    print("  Testing Neurowall v0.8 pipeline against TARA threat techniques")
    print("=" * 90)
    print(f"  Duration per scenario: {args.duration}s")
    print(f"  Sample rate: {SAMPLE_RATE} Hz")
    print(f"  Scenarios: {len(SCENARIOS)}")
    print(f"  EEG generator: multi-band (v0.8)")
    print(f"  Calibration windows: 8 (4.0s)")
    print()

    if args.scenario is not None:
        scenarios = [s for s in SCENARIOS if s.id == args.scenario]
        if not scenarios:
            print(f"  ERROR: No scenario with id={args.scenario}")
            sys.exit(1)
    else:
        scenarios = list(SCENARIOS)

    results = []
    for scenario in scenarios:
        print(f"  [{scenario.id}] Running: {scenario.name}...", end="", flush=True)
        result = run_scenario(scenario, duration=args.duration, verbose=args.verbose)
        results.append(result)

        detected = result.l1_blocked > 0 or result.ssvep_detected
        if scenario.id == 0:
            status = f"FPR baseline ({result.monitor_anomaly_count} anomalies)"
        elif detected:
            status = "DETECTED"
        else:
            status = f"({result.monitor_anomaly_count} anomalies, pending baseline)"
        print(f" {status}")

    clean_anomalies = apply_fpr_adjustment(results)
    n_monitor_windows = int(args.duration * SAMPLE_RATE / 125) - 8  # subtract calibration
    print(f"\n  Monitor baseline: clean signal produces {clean_anomalies} "
          f"false positives out of {n_monitor_windows} windows")
    threshold = max(clean_anomalies * 2, clean_anomalies + 3)
    print(f"  Detection threshold: anomaly_count > {threshold}")
    print()

    print_results(results)


def run_duration_sweep(args):
    """Run all scenarios at multiple durations to map detection latency."""
    durations = [10, 20, 30, 60]
    print("=" * 90)
    print("  NEUROWALL DURATION SWEEP")
    print("  Testing detection vs observation time")
    print("=" * 90)
    print(f"  Durations: {durations}s")
    print(f"  EEG generator: multi-band (v0.8)")
    print()

    # Header
    dur_header = "  " + f"{'#':<3} {'Scenario':<30}"
    for d in durations:
        dur_header += f" {d:>4}s"
    print(dur_header)
    print("  " + "-" * (35 + 6 * len(durations)))

    scenarios = list(SCENARIOS)

    for scenario in scenarios:
        row = f"  {scenario.id:<3} {scenario.name[:28]:<30}"
        for d in durations:
            # Fresh copy of scenario for each duration
            s_copy = AttackScenario(
                id=scenario.id, name=scenario.name, tara_id=scenario.tara_id,
                tactic=scenario.tactic, nic_chain=scenario.nic_chain,
                niss_vector=scenario.niss_vector, severity=scenario.severity,
                description=scenario.description,
                detection_expected=scenario.detection_expected,
                generate_fn=scenario.generate_fn,
            )
            result = run_scenario(s_copy, duration=float(d), verbose=False)

            # Simple detection check (L1 or SSVEP or significant anomalies)
            if scenario.id == 0:
                row += f" {result.monitor_anomaly_count:>3}FP"
            else:
                detected = (result.l1_blocked > 0 or result.ssvep_detected or
                            result.monitor_anomaly_count > 8)
                if detected:
                    row += f"  YES"
                else:
                    row += f"   --"

        print(row)

    print("  " + "-" * (35 + 6 * len(durations)))
    print()
    print("  YES = detected, -- = evaded, NNfp = false positives (clean signal)")
    print()


def run_statistical(args):
    """Run each scenario N times with different seeds for statistical analysis."""
    n_runs = args.runs
    print("=" * 90)
    print("  NEUROWALL STATISTICAL ANALYSIS")
    print(f"  {n_runs} runs per scenario, duration={args.duration}s")
    print("=" * 90)
    print()

    scenarios = list(SCENARIOS)
    if args.scenario is not None:
        scenarios = [s for s in scenarios if s.id == args.scenario]

    print(f"  {'#':<3} {'Scenario':<30} {'Det%':>5} {'Mean Anom':>10} "
          f"{'Std':>6} {'Max Score':>10} {'Mean Score':>11}")
    print("  " + "-" * 80)

    for scenario in scenarios:
        anomaly_counts = []
        max_scores = []
        detections = 0

        for run_idx in range(n_runs):
            s_copy = AttackScenario(
                id=scenario.id, name=scenario.name, tara_id=scenario.tara_id,
                tactic=scenario.tactic, nic_chain=scenario.nic_chain,
                niss_vector=scenario.niss_vector, severity=scenario.severity,
                description=scenario.description,
                detection_expected=scenario.detection_expected,
                generate_fn=scenario.generate_fn,
            )
            # Pass unique seed per run for statistical variation
            run_seed = 42 + scenario.id + 1000 * run_idx
            result = run_scenario(s_copy, duration=args.duration, verbose=False,
                                  seed=run_seed)

            anomaly_counts.append(result.monitor_anomaly_count)
            max_scores.append(result.max_anomaly_score)
            detected = (result.l1_blocked > 0 or result.ssvep_detected or
                        result.monitor_anomaly_count > 8)
            if detected:
                detections += 1

        det_pct = detections / n_runs * 100
        mean_anom = np.mean(anomaly_counts)
        std_anom = np.std(anomaly_counts)
        mean_score = np.mean(max_scores)
        max_score = np.max(max_scores)

        print(f"  {scenario.id:<3} {scenario.name[:28]:<30} {det_pct:>4.0f}% "
              f"{mean_anom:>9.1f} {std_anom:>6.1f} {max_score:>9.2f} "
              f"{mean_score:>10.2f}")

    print("  " + "-" * 80)
    print(f"\n  Detection threshold: anomaly_count > 8 (simplified for stats mode)")
    print()


def run_roc_analysis(args):
    """ROC curve analysis: sweep thresholds x durations to find optimal operating point.

    For each (threshold, duration) pair, runs N scenarios and computes:
    - FPR: fraction of clean signal runs that exceed the threshold
    - TPR per attack: fraction of attack runs that exceed the threshold

    Outputs a JSON file (roc_data.json) for the visualization script.
    """
    import json

    thresholds = [2, 4, 6, 8, 10, 12, 15, 20]
    durations = [10, 15, 20, 30]
    n_runs = args.roc_runs
    scenarios = list(SCENARIOS)

    print("=" * 90)
    print("  NEUROWALL ROC ANALYSIS")
    print(f"  Thresholds: {thresholds}")
    print(f"  Durations: {durations}s")
    print(f"  Runs per combo: {n_runs}")
    print("=" * 90)
    print()

    roc_data = {
        "thresholds": thresholds,
        "durations": durations,
        "n_runs": n_runs,
        "scenarios": {},
    }

    for scenario in scenarios:
        print(f"  Scenario {scenario.id}: {scenario.name[:40]}...")
        scenario_data = {}

        for dur in durations:
            dur_data = {"anomaly_counts": [], "max_scores": [],
                        "l1_detections": 0, "ssvep_detections": 0}

            for run_idx in range(n_runs):
                s_copy = AttackScenario(
                    id=scenario.id, name=scenario.name, tara_id=scenario.tara_id,
                    tactic=scenario.tactic, nic_chain=scenario.nic_chain,
                    niss_vector=scenario.niss_vector, severity=scenario.severity,
                    description=scenario.description,
                    detection_expected=scenario.detection_expected,
                    generate_fn=scenario.generate_fn,
                )
                run_seed = 42 + scenario.id + 1000 * run_idx
                result = run_scenario(s_copy, duration=float(dur), seed=run_seed)
                dur_data["anomaly_counts"].append(result.monitor_anomaly_count)
                dur_data["max_scores"].append(float(result.max_anomaly_score))
                if result.l1_blocked > 0:
                    dur_data["l1_detections"] += 1
                if result.ssvep_detected:
                    dur_data["ssvep_detections"] += 1

            scenario_data[str(dur)] = dur_data

        roc_data["scenarios"][str(scenario.id)] = {
            "name": scenario.name,
            "data": scenario_data,
        }

    # Compute ROC points
    print("\n  ROC OPERATING POINTS")
    print("  " + "-" * 90)
    print(f"  {'Duration':>8} {'Thresh':>6} {'FPR':>6} ", end="")
    for s in scenarios:
        if s.id > 0:
            print(f" {'S'+str(s.id):>4}", end="")
    print()
    print("  " + "-" * 90)

    roc_points = []
    for dur in durations:
        clean_counts = roc_data["scenarios"]["0"]["data"][str(dur)]["anomaly_counts"]
        for thresh in thresholds:
            fpr = sum(1 for c in clean_counts if c > thresh) / len(clean_counts)
            row = {"duration": dur, "threshold": thresh, "fpr": fpr, "tpr": {}}
            print(f"  {dur:>6}s {thresh:>6} {fpr:>5.0%} ", end="")

            for s in scenarios:
                if s.id == 0:
                    continue
                s_data = roc_data["scenarios"][str(s.id)]["data"][str(dur)]
                # Detection = L1 OR SSVEP OR anomaly_count > threshold
                tpr = sum(1 for i, c in enumerate(s_data["anomaly_counts"])
                          if c > thresh or s_data["l1_detections"] > 0
                          or s_data["ssvep_detections"] > 0) / n_runs
                row["tpr"][str(s.id)] = tpr
                print(f" {tpr:>4.0%}", end="")
            print()
            roc_points.append(row)

    print("  " + "-" * 90)

    # Find optimal operating point: FPR < 10%, max average TPR
    print("\n  OPTIMAL OPERATING POINTS (FPR < 10%):")
    best = None
    for rp in roc_points:
        if rp["fpr"] <= 0.10:
            avg_tpr = np.mean(list(rp["tpr"].values()))
            if best is None or avg_tpr > best[1]:
                best = (rp, avg_tpr)
    if best:
        rp = best[0]
        print(f"    Duration={rp['duration']}s, Threshold={rp['threshold']}, "
              f"FPR={rp['fpr']:.0%}, Avg TPR={best[1]:.0%}")
    else:
        print("    No operating point achieves FPR < 10%")

    # Save ROC data for visualization
    roc_data["roc_points"] = roc_points
    roc_file = "roc_data.json"
    with open(roc_file, "w") as f:
        json.dump(roc_data, f, indent=2)
    print(f"\n  ROC data saved to {roc_file}")
    print()


if __name__ == "__main__":
    main()
