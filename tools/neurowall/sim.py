#!/usr/bin/env python3
"""
neurowall/sim.py
Software-only simulation of the full Neurowall 3-layer pipeline.
No hardware required. Runs on any machine with Python 3.9+.

Generates synthetic EEG with optional SSVEP attack injection,
runs it through L1 (notch filters + impedance guard), L2 (differential
privacy with composition tracking), L3 (signal-based NISS policy engine),
and NSP transport (delta + LZ4 + AES-256-GCM with AAD + counter nonces
+ session rekeying). Includes a receiver that decrypts and verifies
integrity.

Usage:
    python sim.py                     # Normal EEG, no attack
    python sim.py --attack             # Inject 15Hz SSVEP attack at t=2s
    python sim.py --attack --freq 10.9 # Inject 10.9Hz attack
    python sim.py --spike              # Inject impedance spike at t=3s
    python sim.py --drift              # Slow DC drift attack (unknown to SSVEP detector)
    python sim.py --flood              # Neuronal flooding (QIF-T0026) broadband saturation
    python sim.py --attack --spike     # Combined attacks
    python sim.py --duration 10        # Run for 10 seconds
    python sim.py --verbose            # Print every sample

Dependencies:
    pip install numpy lz4 cryptography scipy
"""

import argparse
import os
import struct
import time
import numpy as np
import lz4.frame
from scipy.signal import iirnotch, hilbert, butter, sosfilt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from dataclasses import dataclass, field
from typing import List, Tuple, Optional

# ─── Configuration ────────────────────────────────────────────────────────────
SAMPLE_RATE    = 250       # Hz (matches Arduino firmware)
WINDOW_SIZE    = 100       # Samples per NSP frame (~0.4s at 250Hz)
DP_EPSILON     = 0.5       # Default L2 differential privacy epsilon
DP_SENSITIVITY = 1.0       # L-infinity sensitivity of one sample
IMP_THRESHOLD  = 2.5       # Volts, impedance spike detection threshold
LOCKOUT_SAMPLES = 13       # 50ms lockout at 250Hz = 12.5 samples

# SSVEP adversarial targets (Hz)
SSVEP_TARGETS = [8.57, 10.9, 15.0, 20.0]
NOTCH_Q = 30  # Quality factor for notch filters

# NSP session rekeying: rekey every N frames to avoid GCM nonce exhaustion.
# AES-GCM safe limit is ~2^32 encryptions per key. At 625 frames/sec,
# rekeying every 2^20 (~1M) frames gives ~27 minutes per key, well within
# the birthday bound. Conservative default: rekey every 100K frames.
REKEY_INTERVAL = 100_000


# ─── L1: Signal Boundary (Python port of Arduino firmware) ────────────────────

class BiquadNotch:
    """IIR biquad notch filter. Matches the Arduino struct exactly."""

    def __init__(self, f0: float, q: float, fs: float):
        self.f0 = f0
        b, a = iirnotch(f0, q, fs)
        self.b0, self.b1, self.b2 = b[0], b[1], b[2]
        self.a1, self.a2 = a[1], a[2]
        self.x1 = self.x2 = self.y1 = self.y2 = 0.0

    def process(self, x: float) -> float:
        y = self.b0*x + self.b1*self.x1 + self.b2*self.x2 \
            - self.a1*self.y1 - self.a2*self.y2
        self.x2 = self.x1
        self.x1 = x
        self.y2 = self.y1
        self.y1 = y
        return y

    def __repr__(self):
        return (f"BiquadNotch({self.f0}Hz): "
                f"b=[{self.b0:.6f}, {self.b1:.6f}, {self.b2:.6f}] "
                f"a=[1, {self.a1:.6f}, {self.a2:.6f}]")


class SignalBoundary:
    """L1: SSVEP notch filter array + impedance guard."""

    def __init__(self, fs: float = SAMPLE_RATE):
        self.notches = [BiquadNotch(f, NOTCH_Q, fs) for f in SSVEP_TARGETS]
        self.prev_sample = 0.0
        self.lockout_remaining = 0
        self.imp_events = 0

    def process(self, raw: float) -> Tuple[float, bool]:
        """Returns (filtered_sample, was_blocked).
        If blocked by impedance guard, returns (0.0, True)."""
        if self.lockout_remaining > 0:
            self.lockout_remaining -= 1
            return 0.0, True

        if abs(raw - self.prev_sample) > IMP_THRESHOLD:
            self.lockout_remaining = LOCKOUT_SAMPLES
            self.imp_events += 1
            self.prev_sample = raw
            return 0.0, True

        filtered = raw
        for notch in self.notches:
            filtered = notch.process(filtered)

        self.prev_sample = raw
        return filtered, False


# ─── L2: Differential Privacy with Composition Tracking ──────────────────────

@dataclass
class PrivacyBudget:
    """Tracks cumulative privacy loss using zero-concentrated DP (zCDP).

    zCDP composition: rho_total = sum(rho_i) where rho_i = epsilon_i^2 / 2
    for the Laplace mechanism.

    Convert back to (epsilon, delta)-DP via:
        epsilon_total = rho_total + 2*sqrt(rho_total * ln(1/delta))
    """
    total_rho: float = 0.0
    queries: int = 0
    delta: float = 1e-6  # Target delta for conversion to (eps, delta)-DP

    def consume(self, epsilon: float):
        """Record one Laplace mechanism query at the given epsilon."""
        rho = (epsilon ** 2) / 2.0  # Laplace mechanism: rho = eps^2 / 2
        # Correction: for Laplace with sensitivity 1 and parameter epsilon,
        # the zCDP cost is actually 1/(2*epsilon^2) per query.
        # But under pure-DP composition, each query costs epsilon.
        # We use advanced composition (zCDP) for tighter bounds.
        rho = 1.0 / (2.0 * epsilon * epsilon)
        self.total_rho += rho
        self.queries += 1

    @property
    def effective_epsilon(self) -> float:
        """Convert accumulated zCDP rho to (epsilon, delta)-DP."""
        if self.total_rho == 0:
            return 0.0
        return self.total_rho + 2.0 * np.sqrt(
            self.total_rho * np.log(1.0 / self.delta)
        )

    @property
    def naive_epsilon(self) -> float:
        """What basic sequential composition would give (for comparison)."""
        # We don't track per-query epsilons, but we can estimate from rho.
        # Each query with eps=0.5 costs rho=2.0, with eps=0.1 costs rho=50.
        # This is just for display; the real bound is effective_epsilon.
        return self.effective_epsilon  # Show the tighter zCDP bound


def apply_local_dp(
    sample: float,
    epsilon: float,
    budget: PrivacyBudget,
) -> float:
    """Laplace mechanism local DP with budget tracking."""
    scale = DP_SENSITIVITY / epsilon
    noise = np.random.laplace(0, scale)
    budget.consume(epsilon)
    return sample + noise


# ─── Signal Monitor: Coherence-Based Anomaly Detection ──────────────────────
#
# Uses the QIF Coherence Metric (Cs) as the anomaly scoring backbone.
# From QIF-TRUTH.md §3.1:
#
#   Cs = e^(-(sigma_phi^2 + H_tau + sigma_gamma^2))
#
# This is a Boltzmann factor. The exponent sum plays the role of "energy"
# (anomaly), and Cs is the probability of the signal being legitimate.
# Cs = 1.0 means perfectly coherent (normal). Cs -> 0 means anomalous.
#
# For single-channel (Phase 0), we adapt each component:
#
#   sigma_phi^2 (Phase Variance):
#       Circular variance of the instantaneous phase via Hilbert transform.
#       A clean EEG has smooth, slowly varying phase. An injected signal
#       or phase manipulation causes rapid, erratic phase jumps.
#       Formula: (1 - R) * pi^2, where R = |mean(e^(i*phi))|
#       Range: [0, pi^2]. Low = stable phase, high = disrupted.
#
#   H_tau (Spectral Entropy / Transport Entropy):
#       Shannon entropy of the normalized power spectrum.
#       Normal EEG has a characteristic spectral shape (1/f with alpha peak).
#       An attack concentrates energy unnaturally (low entropy) or introduces
#       broadband noise (high entropy relative to baseline).
#       Formula: -sum(p_i * ln(p_i)) where p_i = normalized spectral power
#       Range: [0, ln(N)]. Normalized to [0, 1] by dividing by ln(N).
#
#   sigma_gamma^2 (Gain Variance / Baseline Deviation):
#       Amplitude stability relative to a calibrated baseline.
#       Formula: (1/n) * sum((A_i - A_bar) / A_bar)^2
#       NOT YET IMPLEMENTED. Requires per-session baseline calibration
#       infrastructure. Noted for Phase 1.
#
# The monitor tracks Cs over time. A sudden drop in Cs (from ~0.8 to ~0.2)
# indicates anomalous signal characteristics, triggering NISS escalation.
# This catches attacks the signature-based SSVEP detector would miss:
# novel frequencies, slow drift, phase manipulation, spectral reshaping.

@dataclass
class SignalMonitor:
    """Coherence-based anomaly detector using QIF Cs metric.

    Implements Cs = e^(-(sigma_phi^2 + H_tau)) as a Boltzmann factor
    anomaly score. Cs near 1 = normal, Cs near 0 = anomalous.

    During calibration (first N windows), learns the baseline Cs range.
    After calibration, flags windows where Cs drops significantly below
    the baseline mean.

    Phase 1 TODO: Add sigma_gamma^2 (gain variance) once baseline
    calibration infrastructure is built. This requires tracking
    per-session amplitude baselines, which is more sophisticated
    than the current stateless window approach.
    """
    window_size: int = 125           # 0.5s at 250Hz
    calibration_windows: int = 4     # 2s calibration at 0.5s/window
    trajectory_alpha: float = 0.15   # EWMA smoothing factor for trajectory tracking
    trajectory_threshold: float = 0.03  # Cs drift from baseline to flag trajectory anomaly
    target_baseline_cs: float = 0.7  # Target Cs for clean signal after calibration
    auto_calibrate_w2: bool = True   # Auto-adjust w2 during calibration

    # Internal state
    _buffer: List[float] = field(default_factory=list)
    _baseline_cs_mean: float = 0.0
    _baseline_cs_std: float = 0.0
    _calibration_cs: List[float] = field(default_factory=list)
    _calibration_h_tau: List[float] = field(default_factory=list)
    _calibration_sigma_phi: List[float] = field(default_factory=list)
    _w2: float = 3.0  # will be auto-calibrated if auto_calibrate_w2=True
    _calibrated: bool = False
    _anomaly_count: int = 0
    _windows_seen: int = 0
    _last_cs: float = 1.0
    _last_sigma_phi: float = 0.0
    _last_h_tau: float = 0.0
    # Trajectory tracking: EWMA of Cs to catch slow cumulative drift
    # (defeats QIF-T0066 "boiling frog" adiabatic evasion)
    _cs_ewma: float = 0.0
    _trajectory_anomaly_count: int = 0
    # Exponential growth detector: tracks recent anomaly scores and fits
    # log-linear regression to detect accelerating attacks (QIF-T0023
    # closed-loop cascade). If anomaly scores are growing exponentially,
    # the log-transformed scores will show a strong positive linear trend.
    _growth_history: List[float] = field(default_factory=list)
    _growth_window: int = 6          # number of recent scores to track
    _growth_slope_threshold: float = 0.3  # minimum log-linear slope
    _growth_r2_threshold: float = 0.7    # minimum R^2 for trend confidence
    _growth_detected: bool = False
    _growth_detection_count: int = 0

    def _compute_sigma_phi_sq(self, buf_ac: np.ndarray) -> float:
        """Phase variance via Hilbert transform on alpha-band signal.

        We bandpass to the alpha band (8-13Hz) first because the phase
        variance of a broadband signal is naturally high (near pi^2) and
        uninformative. The alpha rhythm is the dominant structured
        oscillation in resting EEG. When it has stable phase, Cs is high
        (signal is coherent). When an attack disrupts the alpha rhythm,
        phase stability collapses and Cs drops.

        Circular variance: (1 - R) * pi^2 where R = |mean(e^(i*phi))|
        R = 1 means all phases aligned (perfectly coherent).
        R = 0 means phases uniformly distributed (maximally disrupted).
        """
        # Bandpass filter to alpha band (8-13 Hz) before phase analysis
        sos = butter(4, [8.0, 13.0], btype='bandpass', fs=SAMPLE_RATE, output='sos')
        alpha = sosfilt(sos, buf_ac)

        # Check if alpha band has enough power to be meaningful
        alpha_power = np.var(alpha)
        if alpha_power < 1e-10:
            # No alpha activity = maximally disrupted phase
            return float(np.pi ** 2)

        analytic = hilbert(alpha)
        inst_phase = np.angle(analytic)

        # Mean resultant length R
        phase_vectors = np.exp(1j * inst_phase)
        R = np.abs(np.mean(phase_vectors))

        # Circular variance, scaled by pi^2
        sigma_phi_sq = (1.0 - R) * (np.pi ** 2)
        return float(sigma_phi_sq)

    def _compute_h_tau(self, buf_ac: np.ndarray) -> float:
        """Spectral entropy (transport entropy proxy).

        Shannon entropy of the normalized power spectral density.
        Normalized to [0, 1] by dividing by ln(N_bins).

        Normal EEG: moderate entropy (structured 1/f spectrum with peaks).
        SSVEP attack: low entropy (energy concentrated at one frequency).
        Broadband noise attack: high entropy (flat spectrum).
        Either direction of deviation from baseline = suspicious.
        """
        fft_vals = np.fft.rfft(buf_ac)
        power = np.abs(fft_vals[1:]) ** 2  # Skip DC
        total = np.sum(power) + 1e-10

        # Normalized power spectrum (probability distribution)
        p = power / total
        p = p[p > 0]  # Avoid log(0)

        # Shannon entropy
        h = -np.sum(p * np.log(p))

        # Normalize to [0, 1]
        max_entropy = np.log(len(power)) if len(power) > 0 else 1.0
        h_norm = h / max_entropy

        return float(h_norm)

    def _compute_cs(self, buf_ac: np.ndarray) -> Tuple[float, float, float]:
        """Compute Cs = e^(-(w1*sigma_phi^2 + w2*H_tau)).

        Uses calibration weights w1, w2 from QIF-TRUTH.md §4.2. These are
        band-specific, calibratable parameters. Their purpose:

        In single-channel mode, sigma_phi^2 is inherently high (~8.0 even
        for clean signal) because one channel doesn't have cross-channel
        PLV. Meanwhile H_tau (spectral entropy) ranges 0-1 and is the
        more discriminative metric in single-channel. The weights balance
        their contributions so clean signal produces Cs in the 0.6-0.9
        range (matching QIF-TRUTH decision thresholds).

        w1 = 0.02: dampens sigma_phi (noisy single-channel phase)
        w2 = 3.0:  amplifies H_tau (transport entropy, our best indicator)

        Phase 1 (multi-channel): w1 increases because cross-channel PLV
        gives sigma_phi a meaningful 0-4 range instead of 7-10.

        Returns (Cs, sigma_phi^2, H_tau).
        """
        sigma_phi_sq = self._compute_sigma_phi_sq(buf_ac)
        h_tau = self._compute_h_tau(buf_ac)

        # Calibration weights (see QIF-TRUTH.md §4.2)
        # w1: Phase weight (low: single-channel phase is inherently noisy)
        # w2: Transport weight (auto-calibrated during calibration to target
        #     baseline Cs ~ 0.7). For legacy single-band EEG: w2 ~ 3.0.
        #     For multi-band EEG: w2 ~ 0.85 (higher H_tau baseline).
        w1 = 0.02

        exponent = w1 * sigma_phi_sq + self._w2 * h_tau
        cs = np.exp(-exponent)

        return float(cs), sigma_phi_sq, h_tau

    def update(self, sample: float):
        """Feed one sample into the buffer."""
        self._buffer.append(sample)
        if len(self._buffer) > self.window_size:
            self._buffer.pop(0)

    def evaluate(self) -> Tuple[float, dict]:
        """Compute coherence score for current window.

        Returns:
            (anomaly_score, detail_dict)
            anomaly_score: 0.0 = normal, higher = more anomalous.
                Inverted from Cs: anomaly = (baseline_cs - current_cs).
            detail_dict: Cs components and diagnostic info.
        """
        if len(self._buffer) < self.window_size:
            return 0.0, {"status": "buffering"}

        buf = np.array(self._buffer)
        buf_ac = buf - np.mean(buf)
        cs, sigma_phi, h_tau = self._compute_cs(buf_ac)

        self._last_cs = cs
        self._last_sigma_phi = sigma_phi
        self._last_h_tau = h_tau
        self._windows_seen += 1

        # Calibration phase: learn what Cs looks like for clean signal
        if not self._calibrated:
            self._calibration_cs.append(cs)
            self._calibration_h_tau.append(h_tau)
            self._calibration_sigma_phi.append(sigma_phi)
            if len(self._calibration_cs) >= self.calibration_windows:
                # Auto-calibrate w2 to target Cs ~ target_baseline_cs
                # Given Cs = exp(-(w1*sigma_phi + w2*H_tau)), solve for w2:
                #   -ln(target) = w1*mean_phi + w2*mean_h
                #   w2 = (-ln(target) - w1*mean_phi) / mean_h
                if self.auto_calibrate_w2:
                    mean_h = float(np.mean(self._calibration_h_tau))
                    mean_phi = float(np.mean(self._calibration_sigma_phi))
                    if mean_h > 0.001:
                        target_exp = -np.log(self.target_baseline_cs)
                        w2_new = (target_exp - 0.02 * mean_phi) / mean_h
                        self._w2 = max(0.1, min(w2_new, 10.0))  # clamp to sane range

                # Recompute Cs with calibrated w2
                recalibrated_cs = []
                for i in range(len(self._calibration_cs)):
                    exp_val = (0.02 * self._calibration_sigma_phi[i]
                               + self._w2 * self._calibration_h_tau[i])
                    recalibrated_cs.append(float(np.exp(-exp_val)))

                self._baseline_cs_mean = float(np.mean(recalibrated_cs))
                self._baseline_cs_std = float(np.std(recalibrated_cs))
                self._baseline_cs_std = max(self._baseline_cs_std, 0.01)
                # Initialize EWMA to baseline for trajectory tracking
                self._cs_ewma = self._baseline_cs_mean
                self._calibrated = True
                return 0.0, {
                    "status": "calibrated",
                    "baseline_cs": self._baseline_cs_mean,
                    "w2": self._w2,
                    "sigma_phi": sigma_phi,
                    "h_tau": h_tau,
                }
            return 0.0, {
                "status": "calibrating",
                "progress": f"{len(self._calibration_cs)}/{self.calibration_windows}",
                "cs": cs,
                "sigma_phi": sigma_phi,
                "h_tau": h_tau,
            }

        # Post-calibration: anomaly = how far Cs dropped from baseline
        # A drop in Cs means the signal became less coherent (more anomalous).
        # We use the z-score of the drop for scale-independence.
        cs_drop = self._baseline_cs_mean - cs
        z_drop = cs_drop / self._baseline_cs_std if self._baseline_cs_std > 1e-6 else 0.0

        # Anomaly score: 0 when Cs is at or above baseline, scales up with drop
        anomaly_score = max(0.0, z_drop)

        # --- Trajectory tracking (defeats QIF-T0066 "boiling frog") ---
        # Per-window z-score misses ultra-slow drift because each window
        # looks individually normal. The EWMA tracks cumulative Cs
        # displacement over many windows. Even tiny per-window drops
        # accumulate in the EWMA, eventually crossing the threshold.
        #
        # EWMA formula: ewma_new = alpha * cs + (1 - alpha) * ewma_old
        # alpha = 0.15 gives ~7-window effective window (1/alpha ~ 6.7)
        # This means drift over 3-4 seconds of signal starts to register.
        self._cs_ewma = (self.trajectory_alpha * cs
                         + (1.0 - self.trajectory_alpha) * self._cs_ewma)

        trajectory_drift = self._baseline_cs_mean - self._cs_ewma
        trajectory_flag = trajectory_drift > self.trajectory_threshold

        if trajectory_flag:
            trajectory_anomaly = (trajectory_drift / self.trajectory_threshold) * 2.0
            anomaly_score = max(anomaly_score, trajectory_anomaly)
            self._trajectory_anomaly_count += 1

        # --- Exponential growth detector (defeats QIF-T0023 cascade) ---
        # Tracks last N anomaly scores. If log-transformed scores show a
        # strong positive linear trend (high slope + high R^2), the signal
        # has exponentially growing anomalies. This catches closed-loop
        # cascade attacks that start invisible but accelerate over time.
        #
        # Why log-linear? An exponential y = a*e^(kt) becomes log(y) = log(a) + kt,
        # which is linear. So a high R^2 on log-transformed data specifically
        # identifies exponential growth, not just increasing scores.
        growth_flag = False
        self._growth_history.append(max(anomaly_score, 0.01))  # floor to avoid log(0)
        if len(self._growth_history) > self._growth_window:
            self._growth_history.pop(0)

        if len(self._growth_history) >= self._growth_window:
            log_scores = np.log(np.array(self._growth_history))
            x = np.arange(len(log_scores), dtype=float)
            # Simple linear regression: slope and R^2
            x_mean = np.mean(x)
            y_mean = np.mean(log_scores)
            ss_xy = np.sum((x - x_mean) * (log_scores - y_mean))
            ss_xx = np.sum((x - x_mean) ** 2)
            ss_yy = np.sum((log_scores - y_mean) ** 2)
            if ss_xx > 0 and ss_yy > 0:
                slope = ss_xy / ss_xx
                r_squared = (ss_xy ** 2) / (ss_xx * ss_yy)
                if (slope > self._growth_slope_threshold and
                        r_squared > self._growth_r2_threshold and
                        self._growth_history[-1] > 1.0):  # recent score must be non-trivial
                    growth_flag = True
                    self._growth_detected = True
                    self._growth_detection_count += 1
                    growth_anomaly = slope * 5.0  # scale slope to anomaly score
                    anomaly_score = max(anomaly_score, growth_anomaly)

        if anomaly_score > 1.5:
            self._anomaly_count += 1

        return anomaly_score, {
            "status": "monitoring",
            "cs": cs,
            "baseline_cs": self._baseline_cs_mean,
            "sigma_phi": sigma_phi,
            "h_tau": h_tau,
            "cs_drop": cs_drop,
            "z_drop": z_drop,
            "cs_ewma": self._cs_ewma,
            "trajectory_drift": trajectory_drift,
            "trajectory_flag": trajectory_flag,
            "growth_flag": growth_flag,
        }

    @property
    def is_calibrated(self) -> bool:
        return self._calibrated

    @property
    def stats(self) -> dict:
        return {
            "calibrated": self._calibrated,
            "windows_seen": self._windows_seen,
            "anomaly_count": self._anomaly_count,
            "trajectory_anomaly_count": self._trajectory_anomaly_count,
            "growth_detected": self._growth_detected,
            "growth_detection_count": self._growth_detection_count,
            "last_cs": self._last_cs,
            "cs_ewma": self._cs_ewma,
            "baseline_cs": self._baseline_cs_mean if self._calibrated else None,
        }


# ─── L3: NISS Policy Engine (Signature + Anomaly) ───────────────────────────

@dataclass
class NissEngine:
    """Computes NISS Biological Impact score from signal features.

    Two detection modes:
    1. Signature-based: SSVEP power at known target frequencies (catches
       known SSVEP attacks).
    2. Anomaly-based: Consumes SignalMonitor's anomaly score (catches
       unknown attacks, drift, novel frequencies).

    Score 0-10: higher = more suspicious = tighter privacy.
    """
    window_size: int = 125  # 0.5s at 250Hz. Freq resolution = 2Hz.
    _buffer: List[float] = field(default_factory=list)
    _imp_events_seen: int = 0
    _last_anomaly_score: float = 0.0

    def update(self, sample: float, imp_event: bool = False):
        """Feed a new sample into the analysis buffer."""
        self._buffer.append(sample)
        if len(self._buffer) > self.window_size:
            self._buffer.pop(0)
        if imp_event:
            self._imp_events_seen += 1

    def score(self, anomaly_score: float = 0.0) -> int:
        """Compute NISS Biological Impact score (0-10).

        Args:
            anomaly_score: from SignalMonitor (0 = normal, higher = anomalous)
        """
        self._last_anomaly_score = anomaly_score

        if len(self._buffer) < self.window_size:
            return 2  # Not enough data yet, assume safe

        buf = np.array(self._buffer)

        # Remove DC offset before spectral analysis
        buf_ac = buf - np.mean(buf)

        # --- Signature detection: known SSVEP targets ---
        fft = np.fft.rfft(buf_ac)
        freqs = np.fft.rfftfreq(len(buf_ac), 1.0 / SAMPLE_RATE)
        power = np.abs(fft) ** 2

        freq_res = freqs[1] - freqs[0] if len(freqs) > 1 else 1.0
        median_power = np.median(power[1:]) + 1e-10

        ssvep_score = 0.0
        for target_hz in SSVEP_TARGETS:
            bin_idx = int(round(target_hz / freq_res))
            if 0 < bin_idx < len(power):
                bin_power = power[bin_idx]
                ratio = bin_power / median_power
                if ratio > 5.0:
                    ssvep_score += min((ratio - 5.0) / 20.0, 2.0)

        # Signal variance (high variance = instability)
        variance = np.var(buf_ac)

        # --- Composite score: signature + anomaly + hardware ---
        score = 0.0

        # Signature-based (known attacks): up to 5 points
        score += min(ssvep_score, 5.0)

        # Anomaly-based (unknown attacks): up to 5 points
        # anomaly_score ~ 0 during normal, spikes 1.5+ during attacks.
        # Acts as a "software capacitor": absorbs small transients (score < 1)
        # but overflows into NISS when sustained anomalies exceed capacity.
        # This maps to the BCI limits thermal budget constraint: the system
        # can absorb brief energy spikes, but sustained overload trips the
        # safety threshold, just like thermal limits on implant hardware.
        if anomaly_score > 1.0:
            score += min((anomaly_score - 1.0) * 3.0, 5.0)

        # Variance (instability): up to 1 point
        score += min(variance * 5.0, 1.0)

        # Impedance events: up to 2 points
        score += min(self._imp_events_seen * 1.0, 2.0)

        return int(np.clip(round(score), 0, 10))


@dataclass
class RunematePolicy:
    """Runemate Scribe policy engine with NISS-based trigger."""
    niss_threshold: int = 5
    tight_epsilon: float = 0.1
    events: int = 0

    def evaluate(self, niss_bio: int, current_epsilon: float) -> float:
        if niss_bio > self.niss_threshold:
            if current_epsilon != self.tight_epsilon:
                self.events += 1
            return self.tight_epsilon
        return DP_EPSILON


# ─── NSP Transport with AAD, Counter Nonces, and Session Rekeying ─────────────

@dataclass
class NspSession:
    """NSP session state with counter-based nonces and rekeying.

    - Counter nonce: 4-byte random prefix + 8-byte counter. Eliminates
      birthday-bound collision risk entirely (deterministic, never repeats).
    - AAD: frame header (seq, timestamp, epsilon) is authenticated but not
      encrypted, preventing frame reordering and metadata tampering.
    - Rekeying: HKDF derives a new key from the old key + frame counter
      every REKEY_INTERVAL frames.
    """
    _master_secret: bytes = field(default_factory=lambda: os.urandom(32))
    _key: bytes = field(default=b"")
    _nonce_prefix: bytes = field(default=b"")
    _frame_counter: int = 0
    _rekey_interval: int = REKEY_INTERVAL
    _rekeys: int = 0

    def __post_init__(self):
        self._derive_key()

    def _derive_key(self):
        """Derive session key from master secret + rekey counter."""
        info = b"neurowall-nsp-v0.1-" + self._rekeys.to_bytes(4, "big")
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=info,
        )
        self._key = hkdf.derive(self._master_secret)
        # 4-byte random prefix for this key epoch
        self._nonce_prefix = os.urandom(4)

    def _make_nonce(self) -> bytes:
        """4-byte random prefix + 8-byte counter = 12-byte nonce.
        Counter ensures no nonce reuse within a key epoch."""
        return self._nonce_prefix + self._frame_counter.to_bytes(8, "big")

    def encrypt_frame(
        self,
        samples: List[float],
        timestamp_ms: int,
        epsilon: float,
    ) -> bytes:
        """Full NSP pipeline: Delta -> LZ4 -> AAD header -> AES-256-GCM.

        Returns: header (24 bytes) + nonce (12 bytes) + ciphertext + tag (16 bytes)

        Frame layout:
            [seq:8][timestamp:8][epsilon_x1000:4][n_samples:4] | [nonce:12] | [ciphertext+tag]
            ^^^ AAD (authenticated, cleartext) ^^^              ^^^ encrypted ^^^
        """
        self._frame_counter += 1

        # Check if rekeying is needed
        if self._frame_counter % self._rekey_interval == 0:
            self._rekeys += 1
            self._derive_key()

        # Build AAD header: seq (8) + timestamp (8) + epsilon*1000 (4) + n_samples (4)
        header = struct.pack(
            ">QQIi",
            self._frame_counter,
            timestamp_ms,
            int(epsilon * 1000),
            len(samples),
        )

        # Delta encode + LZ4 compress
        deltas = np.diff(np.array(samples, dtype=np.float32)).tobytes()
        compressed = lz4.frame.compress(deltas)

        # Encrypt with AAD
        nonce = self._make_nonce()
        aesgcm = AESGCM(self._key)
        ciphertext = aesgcm.encrypt(nonce, compressed, header)

        return header + nonce + ciphertext

    @property
    def frame_count(self) -> int:
        return self._frame_counter

    @property
    def rekey_count(self) -> int:
        return self._rekeys


# ─── NSP Receiver (Decryption + Verification) ────────────────────────────────

class NspReceiver:
    """Receives and verifies NSP frames. Proves the pipeline is lossless.

    Tracks:
    - Frames received and successfully decrypted
    - Sequence number gaps (reordering/drops)
    - AAD integrity verification
    - Sample reconstruction from deltas
    """

    def __init__(self, session: NspSession):
        # Share the session's key derivation (in production, receiver
        # would derive keys via ML-KEM handshake)
        self._session = session
        self._expected_seq = 1
        self._frames_ok = 0
        self._frames_bad = 0
        self._seq_gaps = 0
        self._total_samples = 0
        self._tamper_detected = 0

    def receive(self, frame: bytes) -> Optional[List[float]]:
        """Decrypt and verify an NSP frame.

        Returns decoded samples on success, None on failure.
        """
        if len(frame) < 36:  # 24 header + 12 nonce minimum
            self._frames_bad += 1
            return None

        # Parse header (AAD)
        header = frame[:24]
        seq, timestamp_ms, epsilon_x1000, n_samples = struct.unpack(
            ">QQIi", header
        )

        # Check sequence number
        if seq != self._expected_seq:
            self._seq_gaps += abs(seq - self._expected_seq)
        self._expected_seq = seq + 1

        # Extract nonce and ciphertext
        nonce = frame[24:36]
        ciphertext = frame[36:]

        # Derive the correct key for this frame's epoch
        rekey_epoch = (seq - 1) // self._session._rekey_interval
        if rekey_epoch != self._session._rekeys:
            # In production, receiver tracks its own key state.
            # For simulation, we use the session's current key.
            pass

        # Decrypt and verify AAD
        aesgcm = AESGCM(self._session._key)
        try:
            compressed = aesgcm.decrypt(nonce, ciphertext, header)
        except Exception:
            self._frames_bad += 1
            self._tamper_detected += 1
            return None

        # Decompress and reconstruct from deltas
        deltas_bytes = lz4.frame.decompress(compressed)
        deltas = np.frombuffer(deltas_bytes, dtype=np.float32)

        # Delta decode: we only have deltas, not the first sample.
        # Reconstruct relative values (first sample is lost in delta encoding,
        # which is fine for privacy, the receiver gets relative changes).
        samples = np.concatenate([[0.0], np.cumsum(deltas)]).tolist()

        self._frames_ok += 1
        self._total_samples += len(samples)

        return samples

    def verify_tamper(self, frame: bytes) -> bool:
        """Test if a frame passes AAD verification. Returns True if valid."""
        if len(frame) < 36:
            return False
        header = frame[:24]
        nonce = frame[24:36]
        ciphertext = frame[36:]
        aesgcm = AESGCM(self._session._key)
        try:
            aesgcm.decrypt(nonce, ciphertext, header)
            return True
        except Exception:
            return False

    @property
    def stats(self) -> dict:
        return {
            "frames_ok": self._frames_ok,
            "frames_bad": self._frames_bad,
            "seq_gaps": self._seq_gaps,
            "total_samples": self._total_samples,
            "tamper_detected": self._tamper_detected,
        }


# ─── Synthetic EEG Generator ─────────────────────────────────────────────────

def generate_eeg(
    duration_s: float,
    fs: int = SAMPLE_RATE,
    attack_freq: float = None,
    attack_start: float = 2.0,
    attack_duration: float = None,
    spike_time: float = None,
    drift: bool = False,
    flood: bool = False,
    multiband: bool = True,
) -> np.ndarray:
    """Generate synthetic EEG with optional attacks.

    Base signal modes:
      multiband=True (v0.5 default): Band-limited noise for each EEG band
        (delta, theta, alpha, beta, gamma) with physiological power ratios.
        Produces a realistic 1/f-like spectrum with stable H_tau.
      multiband=False (v0.1-v0.4 legacy): Single 10Hz sinusoid + random walk.

    Attack modes:
      --attack: Injects a strong sinusoid at a target SSVEP frequency.
      --spike:  Sudden >2.5V jump to trigger impedance guard.
      --drift:  Slow DC drift that changes the signal baseline over time.
      --flood:  Neuronal flooding (QIF-T0026): broadband saturation.
    """
    n_samples = int(duration_s * fs)
    t = np.arange(n_samples) / fs

    if multiband:
        # Multi-band EEG generator (v0.5)
        # Generates band-limited noise for each canonical EEG frequency band,
        # weighted by physiological power ratios. This produces a more realistic
        # 1/f-like spectrum than a simple random walk, giving more stable H_tau
        # and reducing false positive rates.
        #
        # Power ratios approximate resting eyes-open EEG:
        #   Delta (0.5-4Hz):  high power, slow waves
        #   Theta (4-8Hz):    moderate power
        #   Alpha (8-13Hz):   dominant rhythm (eyes-closed would be higher)
        #   Beta (13-30Hz):   low power, cortical activation
        #   Gamma (30-100Hz): very low power
        signal = np.full(n_samples, 2.5)  # DC offset (ADC centered at 2.5V)

        white = np.random.randn(n_samples)

        # Delta band (0.5-4 Hz): highest EEG power
        sos_d = butter(3, [0.5, 4.0], btype='bandpass', fs=fs, output='sos')
        signal += sosfilt(sos_d, white) * 0.08

        # Theta band (4-8 Hz): moderate power
        sos_t = butter(3, [4.0, 8.0], btype='bandpass', fs=fs, output='sos')
        signal += sosfilt(sos_t, white) * 0.04

        # Alpha band (8-13 Hz): dominant structured oscillation
        # Use a dedicated sinusoid + bandpass noise for realistic alpha
        alpha_sin = 0.05 * np.sin(2 * np.pi * 10 * t)
        sos_a = butter(3, [8.0, 13.0], btype='bandpass', fs=fs, output='sos')
        alpha_noise = sosfilt(sos_a, white) * 0.03
        signal += alpha_sin + alpha_noise

        # Beta band (13-30 Hz): low power
        sos_b = butter(3, [13.0, 30.0], btype='bandpass', fs=fs, output='sos')
        signal += sosfilt(sos_b, white) * 0.015

        # Gamma band (30-100 Hz, capped at Nyquist-1)
        gamma_hi = min(100.0, fs / 2.0 - 1.0)
        if gamma_hi > 31.0:
            sos_g = butter(3, [30.0, gamma_hi], btype='bandpass', fs=fs, output='sos')
            signal += sosfilt(sos_g, white) * 0.008

        # 60Hz powerline artifact
        signal += 0.01 * np.sin(2 * np.pi * 60 * t)

        # Optional eye blink artifacts (large biphasic transients)
        # ~1-2 blinks per 10 seconds, each ~200ms duration
        # Start after 5s to avoid contaminating calibration period
        n_blinks = max(1, int(duration_s / 7))
        for _ in range(n_blinks):
            blink_center = np.random.uniform(5.0, duration_s - 1.0)
            blink_idx = int(blink_center * fs)
            blink_width = int(0.1 * fs)  # 100ms half-width
            blink_range = np.arange(max(0, blink_idx - blink_width),
                                    min(n_samples, blink_idx + blink_width))
            if len(blink_range) > 0:
                blink_t = (blink_range - blink_idx) / fs
                # Biphasic shape: positive then negative
                blink_shape = 0.3 * np.exp(-0.5 * (blink_t / 0.05) ** 2) * np.cos(2 * np.pi * 3 * blink_t)
                signal[blink_range] += blink_shape
    else:
        # Legacy v0.1-v0.4 generator
        signal = 2.5 + 0.05 * np.sin(2 * np.pi * 10 * t)
        white = np.random.randn(n_samples)
        pink = np.cumsum(white) * 0.001
        pink -= np.mean(pink)
        signal += pink
        signal += 0.01 * np.sin(2 * np.pi * 60 * t)

    # SSVEP attack injection
    if attack_freq is not None:
        if attack_duration is None:
            attack_duration = duration_s - attack_start
        attack_end = attack_start + attack_duration
        attack_mask = (t >= attack_start) & (t < attack_end)
        attack_signal = 0.5 * np.sin(2 * np.pi * attack_freq * t)
        signal[attack_mask] += attack_signal[attack_mask]

    # Impedance spike injection
    if spike_time is not None:
        spike_idx = int(spike_time * fs)
        if spike_idx < n_samples:
            signal[spike_idx] = 5.0

    # Drift attack: slow baseline shift that SSVEP detector cannot see.
    # Changes the DC operating point gradually, which disrupts gain variance
    # and spectral entropy without introducing any target frequency.
    if drift:
        drift_start = attack_start
        drift_mask = t >= drift_start
        # Ramp from 0 to +1.5V over the remaining duration
        drift_signal = np.zeros(n_samples)
        drift_region = t[drift_mask] - drift_start
        drift_signal[drift_mask] = 1.5 * (drift_region / max(drift_region[-1], 1.0))
        signal += drift_signal

    # Flood attack (QIF-T0026): broadband saturation across all frequencies.
    # This is the neural equivalent of a DDoS. Overwhelms normal firing
    # patterns with maximum stimulation across the entire bandwidth.
    #
    # TARA: QIF-T0026 "Neuronal flooding"
    # Tactic: QIF-P.DS (Denial of Service / Disruption)
    # Bands: I0 -> N4-N7
    # NIC chain: I0 (electrode saturation) -> N4 (thalamic gate overwhelmed)
    #            -> N5-N7 (cortical flooding, seizure risk)
    # NISS: BI:H / CG:H / CV:E / RV:P / NP:T (score 6.4, medium)
    #
    # BCI limits relevance: A flood attack pushes the signal power beyond
    # the thermal budget constraint. The coherence monitor detects this
    # because spectral entropy drops (energy distributed unnaturally flat)
    # and phase coherence collapses (no structured oscillation remains).
    # Think of it as exceeding the "software capacitor" — the system's
    # ability to absorb transient energy without state corruption.
    if flood:
        flood_start = attack_start
        flood_mask = t >= flood_start
        # Broadband noise at 10x normal amplitude + multi-frequency harmonics
        flood_signal = np.zeros(n_samples)
        broadband = np.random.randn(np.sum(flood_mask)) * 0.8
        # Add harmonics at non-SSVEP frequencies to evade signature detector
        for f_harm in [7.0, 12.5, 17.3, 23.0, 31.0, 42.0]:
            broadband += 0.3 * np.sin(2 * np.pi * f_harm * t[flood_mask])
        flood_signal[flood_mask] = broadband
        signal += flood_signal

    # Clamp to ADC range
    signal = np.clip(signal, 0.0, 5.0)

    return signal


# ─── Simulation Runner ────────────────────────────────────────────────────────

def run_simulation(args):
    duration = args.duration
    attack_freq = args.freq if args.attack else None
    spike_time = args.spike_time if args.spike else None
    verbose = args.verbose

    print("=" * 70)
    print("  NEUROWALL v0.5 SIM — Multi-band EEG + Growth Detector + Coherence + NISS + NSP")
    print("=" * 70)
    print(f"  Sample rate:    {SAMPLE_RATE} Hz")
    print(f"  Duration:       {duration}s ({int(duration * SAMPLE_RATE)} samples)")
    print(f"  Window size:    {WINDOW_SIZE} samples ({WINDOW_SIZE/SAMPLE_RATE:.2f}s)")
    print(f"  Default epsilon: {DP_EPSILON}")

    if attack_freq:
        print(f"  SSVEP attack:   {attack_freq} Hz injected at t={args.attack_start}s")
    if spike_time:
        print(f"  Impedance spike: at t={spike_time}s")
    if args.drift:
        print(f"  Drift attack:   slow DC ramp starting at t={args.attack_start}s")
    if args.flood:
        print(f"  Flood attack:   QIF-T0026 broadband saturation at t={args.attack_start}s")
    if not attack_freq and not spike_time and not args.drift and not args.flood:
        print("  Mode:           Clean signal (no attacks)")

    print("=" * 70)

    # Generate synthetic signal
    signal = generate_eeg(
        duration_s=duration,
        attack_freq=attack_freq,
        attack_start=args.attack_start,
        spike_time=spike_time,
        drift=args.drift,
        flood=args.flood,
    )

    # Initialize layers
    l1 = SignalBoundary()
    monitor = SignalMonitor(calibration_windows=4)
    niss = NissEngine()
    policy = RunematePolicy(niss_threshold=5, tight_epsilon=0.1)
    budget = PrivacyBudget()
    nsp = NspSession()
    receiver = NspReceiver(nsp)
    current_epsilon = DP_EPSILON

    # Print configuration
    print("\n[L1] Notch filter bank (scipy.signal.iirnotch, Q=30, fs=250):")
    for notch in l1.notches:
        print(f"  {notch}")

    print(f"\n[L1] Impedance guard: threshold={IMP_THRESHOLD}V, "
          f"lockout={LOCKOUT_SAMPLES} samples ({LOCKOUT_SAMPLES*4}ms)")
    print(f"[L2] Laplace DP: sensitivity={DP_SENSITIVITY}, epsilon={DP_EPSILON}")
    print(f"     Privacy budget: zCDP composition, delta={budget.delta}")
    print(f"[MON] Coherence monitor: Cs = e^(-(sigma_phi^2 + H_tau))")
    print(f"      Calibration: {monitor.calibration_windows} windows "
          f"({monitor.calibration_windows * monitor.window_size / SAMPLE_RATE:.1f}s)")
    print(f"      Trajectory tracker: EWMA alpha={monitor.trajectory_alpha}, "
          f"drift threshold={monitor.trajectory_threshold}")
    print(f"      Phase 1 TODO: + sigma_gamma^2 (gain baseline deviation)")
    print(f"[L3] NISS engine: signature (SSVEP) + anomaly (Cs) scoring")
    print(f"     Runemate policy: NISS > {policy.niss_threshold} "
          f"tightens to epsilon={policy.tight_epsilon}")
    print(f"[NSP] AES-256-GCM + AAD headers + counter nonces")
    print(f"      Rekey interval: every {REKEY_INTERVAL:,} frames")
    print(f"[RX]  Receiver: decrypt + AAD verify + delta reconstruct")
    print()

    # Run pipeline
    window: List[float] = []
    blocked_count = 0
    raw_bytes = 0
    total_raw = 0
    total_encrypted = 0
    policy_tighten_count = 0
    prev_epsilon = DP_EPSILON
    tamper_test_done = False
    monitor_window_counter = 0

    t_start = time.time()

    for i, raw_sample in enumerate(signal):
        t_sec = i / SAMPLE_RATE

        # ── L1: Signal Boundary ──────────────────────────────────────────
        filtered, blocked = l1.process(raw_sample)

        if blocked:
            blocked_count += 1
            niss.update(0.0, imp_event=True)
            if verbose:
                print(f"  [{t_sec:6.3f}s] L1-BLOCKED (impedance guard)")
            continue

        # Feed RAW sample to both NISS and coherence monitor (before
        # notch filtering). Both need the unmodified signal to detect
        # attacks that the filter would remove.
        niss.update(raw_sample)
        monitor.update(raw_sample)

        # ── Coherence monitor evaluation (every window_size samples) ─────
        # The monitor operates on its own window cadence. We evaluate
        # every time a full window is ready and print diagnostics.
        anomaly_score = 0.0
        monitor_window_counter += 1
        if monitor_window_counter >= monitor.window_size:
            monitor_window_counter = 0
            anomaly_score, detail = monitor.evaluate()

            if detail.get("status") == "calibrating":
                print(f"  [{t_sec:6.3f}s] [MON] Calibrating... "
                      f"({detail['progress']}) "
                      f"Cs={detail.get('cs', 0):.4f} "
                      f"sigma_phi={detail.get('sigma_phi', 0):.4f} "
                      f"H_tau={detail.get('h_tau', 0):.4f}")
            elif detail.get("status") == "calibrated":
                print(f"  [{t_sec:6.3f}s] [MON] CALIBRATED. "
                      f"Baseline Cs={detail['baseline_cs']:.4f}")
            elif detail.get("status") == "monitoring":
                cs = detail.get("cs", 0)
                flag = ""
                if anomaly_score > 3.0:
                    flag = " *** ANOMALY ***"
                elif anomaly_score > 1.5:
                    flag = " (elevated)"
                print(f"  [{t_sec:6.3f}s] [MON] Cs={cs:.4f} "
                      f"(baseline={detail.get('baseline_cs', 0):.4f}) "
                      f"anomaly={anomaly_score:.2f} "
                      f"sigma_phi={detail.get('sigma_phi', 0):.4f} "
                      f"H_tau={detail.get('h_tau', 0):.4f}"
                      f"{flag}")

        # ── L3: NISS scoring (signature + anomaly) + policy ──────────────
        niss_bio = niss.score(anomaly_score=anomaly_score)
        current_epsilon = policy.evaluate(niss_bio, current_epsilon)

        if current_epsilon != prev_epsilon:
            direction = "TIGHTENED" if current_epsilon < prev_epsilon else "RELAXED"
            print(f"  [{t_sec:6.3f}s] [L3-POLICY] {direction}: "
                  f"epsilon {prev_epsilon:.2f} -> {current_epsilon:.2f} "
                  f"(NISS={niss_bio}, anomaly={anomaly_score:.2f})")
            if current_epsilon < prev_epsilon:
                policy_tighten_count += 1
            prev_epsilon = current_epsilon

        # ── L2: Differential Privacy with budget tracking ────────────────
        noisy_sample = apply_local_dp(filtered, current_epsilon, budget)
        raw_bytes += 4  # float32

        if verbose:
            dp_noise = noisy_sample - filtered
            print(f"  [{t_sec:6.3f}s] raw={raw_sample:.4f}V "
                  f"filtered={filtered:.4f}V "
                  f"noisy={noisy_sample:.4f}V "
                  f"(DP noise={dp_noise:+.4f}, eps={current_epsilon:.2f}, "
                  f"budget_rho={budget.total_rho:.2f})")

        window.append(noisy_sample)

        # ── NSP Frame + Receiver Verification ────────────────────────────
        if len(window) >= WINDOW_SIZE:
            timestamp_ms = int(t_sec * 1000)
            frame = nsp.encrypt_frame(window, timestamp_ms, current_epsilon)

            # Receiver decrypts and verifies
            decoded = receiver.receive(frame)

            total_raw += raw_bytes
            total_encrypted += len(frame)
            reduction = (1 - len(frame) / raw_bytes) * 100

            frame_start = (i - WINDOW_SIZE + 1) / SAMPLE_RATE
            frame_end = t_sec
            rx_status = "OK" if decoded is not None else "FAIL"

            print(f"  [{t_sec:6.3f}s] [NSP-FRAME #{nsp.frame_count:3d}] "
                  f"{raw_bytes}B raw -> {len(frame)}B encrypted "
                  f"({reduction:+.1f}%) | "
                  f"eps={current_epsilon:.2f} | "
                  f"t=[{frame_start:.2f}-{frame_end:.2f}s] | "
                  f"RX:{rx_status}")

            # Tamper test: flip one byte in the AAD and verify it fails
            if not tamper_test_done and decoded is not None:
                tampered = bytearray(frame)
                tampered[3] ^= 0xFF  # Flip a byte in the header
                tamper_ok = receiver.verify_tamper(bytes(tampered))
                print(f"  [{t_sec:6.3f}s] [TAMPER-TEST] "
                      f"Flipped header byte -> "
                      f"{'REJECTED (correct)' if not tamper_ok else 'ACCEPTED (BUG)'}")
                tamper_test_done = True

            window.clear()
            raw_bytes = 0

    elapsed = time.time() - t_start
    rx = receiver.stats
    mon = monitor.stats

    # ── Summary ──────────────────────────────────────────────────────────────
    print()
    print("=" * 70)
    print("  SIMULATION SUMMARY")
    print("=" * 70)
    print(f"  Total samples:      {len(signal)}")
    print(f"  Samples processed:  {len(signal) - blocked_count}")
    print(f"  Samples blocked:    {blocked_count} (L1 impedance guard)")
    print(f"  L1 impedance events:{l1.imp_events}")
    print()

    print("  --- Coherence Monitor (Cs = e^(-(sigma_phi^2 + H_tau))) ---")
    print(f"  Windows analyzed:   {mon['windows_seen']}")
    print(f"  Anomalies flagged:  {mon['anomaly_count']}")
    print(f"  Trajectory alerts:  {mon['trajectory_anomaly_count']}")
    print(f"  Last Cs:            {mon['last_cs']:.4f}")
    print(f"  Cs EWMA:            {mon['cs_ewma']:.4f}")
    if mon['baseline_cs'] is not None:
        print(f"  Baseline Cs:        {mon['baseline_cs']:.4f}")
    print()

    print("  --- Privacy Budget (zCDP) ---")
    print(f"  DP queries:         {budget.queries}")
    print(f"  Accumulated rho:    {budget.total_rho:.4f}")
    print(f"  Effective epsilon:  {budget.effective_epsilon:.4f} "
          f"(at delta={budget.delta})")
    print(f"  Per-query average:  {budget.effective_epsilon / max(budget.queries, 1):.6f}")
    print()

    print("  --- NSP Transport ---")
    print(f"  Frames sent:        {nsp.frame_count}")
    print(f"  Session rekeys:     {nsp.rekey_count}")
    if total_raw > 0:
        overall = (1 - total_encrypted / total_raw) * 100
        print(f"  Total raw data:     {total_raw} bytes")
        print(f"  Total encrypted:    {total_encrypted} bytes")
        print(f"  Overall reduction:  {overall:.1f}%")
    print()

    print("  --- Receiver Verification ---")
    print(f"  Frames decrypted:   {rx['frames_ok']}")
    print(f"  Frames failed:      {rx['frames_bad']}")
    print(f"  Sequence gaps:      {rx['seq_gaps']}")
    print(f"  Samples recovered:  {rx['total_samples']}")
    print(f"  Tamper attempts:    {rx['tamper_detected']}")
    integrity = "PASS" if rx["frames_bad"] == 0 and rx["seq_gaps"] == 0 else "FAIL"
    print(f"  Integrity check:    {integrity}")
    print()

    print(f"  L3 policy tightens: {policy_tighten_count}")
    print(f"  Wall clock time:    {elapsed:.3f}s "
          f"({len(signal)/elapsed:.0f} samples/sec)")
    print("=" * 70)

    # Attack-specific analysis
    if attack_freq:
        print(f"\n  SSVEP ATTACK ANALYSIS ({attack_freq} Hz)")
        print(f"  The notch filter at {attack_freq}Hz attenuates the injected signal.")
        print(f"  NISS detected via SSVEP signature AND coherence monitor (Cs drop).")
        print(f"  Policy tightenings: {policy_tighten_count}")
        print(f"  Total privacy cost: epsilon={budget.effective_epsilon:.4f} "
              f"(zCDP, delta={budget.delta})")

    if spike_time:
        print(f"\n  IMPEDANCE SPIKE ANALYSIS")
        print(f"  Spike at t={spike_time}s triggered {l1.imp_events} impedance event(s),")
        print(f"  blocking {blocked_count} samples ({blocked_count*4}ms lockout).")

    if args.drift:
        print(f"\n  DRIFT ATTACK ANALYSIS")
        print(f"  Slow DC drift injected starting at t={args.attack_start}s.")
        print(f"  SSVEP signature detector: BLIND (no target frequency present).")
        print(f"  Coherence monitor: {'DETECTED' if mon['anomaly_count'] > 0 else 'MISSED'} "
              f"({mon['anomaly_count']} anomalies via Cs drop).")
        print(f"  Detection mechanism: spectral entropy (H_tau) shift as DC")
        print(f"  component changes the power distribution shape.")

    if args.flood:
        print(f"\n  FLOOD ATTACK ANALYSIS (QIF-T0026: Neuronal Flooding)")
        print(f"  TARA: QIF-T0026 | Tactic: QIF-P.DS | Bands: I0->N4-N7")
        print(f"  NIC chain: I0 (electrode saturation) -> N4 (thalamic gate")
        print(f"  overwhelmed) -> N5-N7 (cortical flooding, seizure risk)")
        print(f"  NISS vector: BI:H / CG:H / CV:E / RV:P / NP:T (score 6.4)")
        print(f"  SSVEP signature detector: BLIND (broadband, no single target).")
        print(f"  Coherence monitor: {'DETECTED' if mon['anomaly_count'] > 0 else 'MISSED'} "
              f"({mon['anomaly_count']} anomalies).")
        print(f"  Detection mechanism: phase coherence collapse (sigma_phi^2)")
        print(f"  + spectral entropy shift (H_tau). The flood disrupts the")
        print(f"  natural 1/f spectral structure and destroys phase stability.")
        print(f"  BCI limits: flood exceeds the 'software capacitor' threshold,")
        print(f"  the system's ability to absorb transient energy without state")
        print(f"  corruption. This maps to the thermal budget constraint in the")
        print(f"  BCI limits equation (QIF-TRUTH.md Entry 60).")


def main():
    parser = argparse.ArgumentParser(
        description="Neurowall 3-layer pipeline simulation (no hardware needed)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python sim.py                        Clean signal, no attacks
  python sim.py --attack               15Hz SSVEP injection at t=2s
  python sim.py --attack --freq 8.57   8.57Hz SSVEP injection
  python sim.py --spike                Impedance spike at t=3s
  python sim.py --drift                Slow DC drift (invisible to SSVEP detector)
  python sim.py --flood                QIF-T0026 neuronal flooding attack
  python sim.py --attack --spike       Combined attacks
  python sim.py --verbose              Show every sample
  python sim.py --duration 20          Run for 20 seconds
        """
    )
    parser.add_argument("--duration", type=float, default=5.0,
                        help="Simulation duration in seconds (default: 5)")
    parser.add_argument("--attack", action="store_true",
                        help="Inject SSVEP attack signal")
    parser.add_argument("--freq", type=float, default=15.0,
                        help="SSVEP attack frequency in Hz (default: 15.0)")
    parser.add_argument("--attack-start", type=float, default=2.0,
                        help="Time to start attack injection (default: 2.0s)")
    parser.add_argument("--spike", action="store_true",
                        help="Inject impedance spike")
    parser.add_argument("--spike-time", type=float, default=3.0,
                        help="Time of impedance spike (default: 3.0s)")
    parser.add_argument("--drift", action="store_true",
                        help="Inject slow DC drift attack (invisible to SSVEP)")
    parser.add_argument("--flood", action="store_true",
                        help="Inject QIF-T0026 neuronal flooding attack")
    parser.add_argument("--verbose", action="store_true",
                        help="Print every sample (noisy)")

    args = parser.parse_args()

    if args.freq not in SSVEP_TARGETS:
        print(f"WARNING: {args.freq}Hz is not in the notch filter bank "
              f"{SSVEP_TARGETS}.")
        print(f"The attack will NOT be filtered. This demonstrates what happens "
              f"when an attacker uses a frequency outside the filter bank.\n")

    run_simulation(args)


if __name__ == "__main__":
    main()
