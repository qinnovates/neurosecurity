#!/usr/bin/env python3
"""
neurowall/sim.py
Software-only simulation of the full Neurowall 3-layer pipeline.
No hardware required. Runs on any machine with Python 3.9+.

Generates synthetic EEG with optional SSVEP attack injection,
runs it through L1 (notch filters + impedance guard), L2 (differential
privacy), L3 (policy engine), and NSP transport (delta + LZ4 + AES-GCM).

Usage:
    python sim.py                     # Normal EEG, no attack
    python sim.py --attack             # Inject 15Hz SSVEP attack at t=2s
    python sim.py --attack --freq 10.9 # Inject 10.9Hz attack
    python sim.py --spike              # Inject impedance spike at t=3s
    python sim.py --attack --spike     # Both attacks
    python sim.py --duration 10        # Run for 10 seconds
    python sim.py --verbose            # Print every sample

Dependencies:
    pip install numpy lz4 cryptography scipy
"""

import argparse
import time
import random
import numpy as np
import lz4.frame
from scipy.signal import iirnotch
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dataclasses import dataclass
from typing import List, Tuple

# ─── Configuration ────────────────────────────────────────────────────────────
SAMPLE_RATE    = 250       # Hz (matches Arduino firmware)
WINDOW_SIZE    = 100       # Samples per NSP frame (~0.4s at 250Hz)
DP_EPSILON     = 0.5       # Default L2 differential privacy epsilon
DP_SENSITIVITY = 1.0       # L-infinity sensitivity of one sample
IMP_THRESHOLD  = 2.5       # Volts, impedance spike detection threshold
LOCKOUT_SAMPLES = 13       # 50ms lockout at 250Hz = 12.5 samples

# Phase 0: Pre-shared test key (32 bytes = AES-256)
NSP_KEY = bytes.fromhex(
    "a3b1c4d5e6f708192a3b4c5d6e7f80910a1b2c3d4e5f60718293a4b5c6d7e8f9"
)

# SSVEP adversarial targets (Hz)
SSVEP_TARGETS = [8.57, 10.9, 15.0, 20.0]
NOTCH_Q = 30  # Quality factor for notch filters


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


# ─── L2: Differential Privacy ────────────────────────────────────────────────

def apply_local_dp(sample: float, epsilon: float = DP_EPSILON) -> float:
    """Laplace mechanism local DP."""
    scale = DP_SENSITIVITY / epsilon
    noise = np.random.laplace(0, scale)
    return sample + noise


# ─── L3: Runemate Stub Policy ────────────────────────────────────────────────

@dataclass
class RunematePolicy:
    """Minimal Runemate Scribe stub with NISS-based trigger."""
    niss_threshold: int = 5
    tight_epsilon: float = 0.1
    events: int = 0

    def evaluate(self, niss_bio: int, current_epsilon: float) -> float:
        if niss_bio > self.niss_threshold:
            if current_epsilon != self.tight_epsilon:
                self.events += 1
            return self.tight_epsilon
        return DP_EPSILON


def get_mock_niss_bio(attack_active: bool) -> int:
    """Mock NISS score. Higher during attacks to show policy response."""
    if attack_active:
        return random.choices([5, 7, 8, 9], weights=[2, 3, 3, 2])[0]
    return random.choices([2, 3, 4, 6], weights=[5, 3, 1, 1])[0]


# ─── NSP Transport ────────────────────────────────────────────────────────────

def nsp_delta_encode(samples: List[float]) -> bytes:
    """Delta encode then LZ4 compress."""
    deltas = np.diff(np.array(samples, dtype=np.float32)).tobytes()
    return lz4.frame.compress(deltas)


def nsp_encrypt(plaintext: bytes) -> bytes:
    """AES-256-GCM encrypt with random nonce."""
    nonce = bytes(random.getrandbits(8) for _ in range(12))
    aesgcm = AESGCM(NSP_KEY)
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)
    return nonce + ciphertext


def build_nsp_frame(samples: List[float]) -> bytes:
    """Full NSP pipeline: Delta -> LZ4 -> AES-256-GCM."""
    compressed = nsp_delta_encode(samples)
    return nsp_encrypt(compressed)


# ─── Synthetic EEG Generator ─────────────────────────────────────────────────

def generate_eeg(
    duration_s: float,
    fs: int = SAMPLE_RATE,
    attack_freq: float = None,
    attack_start: float = 2.0,
    attack_duration: float = None,
    spike_time: float = None,
) -> np.ndarray:
    """Generate synthetic EEG with optional SSVEP attack and impedance spike.

    Base signal: alpha rhythm (10Hz, 20uV) + background pink noise.
    Attack: injects a strong sinusoid at the target SSVEP frequency.
    Spike: injects a sudden >2.5V jump to trigger impedance guard.
    """
    n_samples = int(duration_s * fs)
    t = np.arange(n_samples) / fs

    # Base alpha rhythm (10Hz, ~20uV peak, scaled to 0-5V ADC range)
    # Center around 2.5V (mid-range of Arduino ADC)
    signal = 2.5 + 0.05 * np.sin(2 * np.pi * 10 * t)

    # Background noise (pink-ish, 1/f approximation)
    white = np.random.randn(n_samples)
    # Simple 1/f filter: accumulate and scale
    pink = np.cumsum(white) * 0.001
    pink -= np.mean(pink)
    signal += pink

    # Small 60Hz powerline artifact
    signal += 0.01 * np.sin(2 * np.pi * 60 * t)

    # SSVEP attack injection
    if attack_freq is not None:
        if attack_duration is None:
            attack_duration = duration_s - attack_start
        attack_end = attack_start + attack_duration
        attack_mask = (t >= attack_start) & (t < attack_end)
        # Strong injection: 0.5V amplitude (10x the normal alpha)
        attack_signal = 0.5 * np.sin(2 * np.pi * attack_freq * t)
        signal[attack_mask] += attack_signal[attack_mask]

    # Impedance spike injection
    if spike_time is not None:
        spike_idx = int(spike_time * fs)
        if spike_idx < n_samples:
            signal[spike_idx] = 5.0  # Rail to max voltage

    # Clamp to ADC range
    signal = np.clip(signal, 0.0, 5.0)

    return signal


# ─── Simulation Runner ────────────────────────────────────────────────────────

def run_simulation(args):
    duration = args.duration
    attack_freq = args.freq if args.attack else None
    spike_time = args.spike_time if args.spike else None
    verbose = args.verbose

    print("=" * 65)
    print("  NEUROWALL v0.1 SIM — Full 3-Layer Pipeline Simulation")
    print("=" * 65)
    print(f"  Sample rate:    {SAMPLE_RATE} Hz")
    print(f"  Duration:       {duration}s ({int(duration * SAMPLE_RATE)} samples)")
    print(f"  Window size:    {WINDOW_SIZE} samples ({WINDOW_SIZE/SAMPLE_RATE:.2f}s)")
    print(f"  Default epsilon: {DP_EPSILON}")

    if attack_freq:
        print(f"  SSVEP attack:   {attack_freq} Hz injected at t={args.attack_start}s")
    if spike_time:
        print(f"  Impedance spike: at t={spike_time}s")
    if not attack_freq and not spike_time:
        print("  Mode:           Clean signal (no attacks)")

    print("=" * 65)

    # Generate synthetic signal
    signal = generate_eeg(
        duration_s=duration,
        attack_freq=attack_freq,
        attack_start=args.attack_start,
        spike_time=spike_time,
    )

    # Initialize layers
    l1 = SignalBoundary()
    policy = RunematePolicy(niss_threshold=5, tight_epsilon=0.1)
    current_epsilon = DP_EPSILON

    # Print notch filter coefficients (scipy-computed, not placeholders)
    print("\n[L1] Notch filter bank (scipy.signal.iirnotch, Q=30, fs=250):")
    for notch in l1.notches:
        print(f"  {notch}")

    print(f"\n[L1] Impedance guard: threshold={IMP_THRESHOLD}V, "
          f"lockout={LOCKOUT_SAMPLES} samples ({LOCKOUT_SAMPLES*4}ms)")
    print(f"[L2] Laplace DP: sensitivity={DP_SENSITIVITY}, epsilon={DP_EPSILON}")
    print(f"[L3] Runemate policy: NISS > {policy.niss_threshold} "
          f"tightens to epsilon={policy.tight_epsilon}")
    print(f"[NSP] Delta + LZ4 + AES-256-GCM (key: ...{NSP_KEY[-4:].hex()})")
    print()

    # Run pipeline
    window: List[float] = []
    frame_count = 0
    blocked_count = 0
    raw_bytes = 0
    total_raw = 0
    total_encrypted = 0
    policy_tighten_count = 0
    prev_epsilon = DP_EPSILON

    t_start = time.time()

    for i, raw_sample in enumerate(signal):
        t_sec = i / SAMPLE_RATE

        # Determine if attack is active this sample (for NISS mock)
        attack_active = (attack_freq is not None
                         and t_sec >= args.attack_start)

        # ── L1: Signal Boundary ──────────────────────────────────────────
        filtered, blocked = l1.process(raw_sample)

        if blocked:
            blocked_count += 1
            if verbose:
                print(f"  [{t_sec:6.3f}s] L1-BLOCKED (impedance guard)")
            continue

        # ── L3: Policy evaluation ────────────────────────────────────────
        niss_bio = get_mock_niss_bio(attack_active)
        current_epsilon = policy.evaluate(niss_bio, current_epsilon)

        if current_epsilon != prev_epsilon:
            direction = "TIGHTENED" if current_epsilon < prev_epsilon else "RELAXED"
            print(f"  [{t_sec:6.3f}s] [L3-POLICY] {direction}: "
                  f"epsilon {prev_epsilon:.2f} -> {current_epsilon:.2f} "
                  f"(NISS_BIO={niss_bio})")
            if current_epsilon < prev_epsilon:
                policy_tighten_count += 1
            prev_epsilon = current_epsilon

        # ── L2: Differential Privacy ─────────────────────────────────────
        noisy_sample = apply_local_dp(filtered, epsilon=current_epsilon)
        raw_bytes += 4  # float32

        if verbose:
            dp_noise = noisy_sample - filtered
            print(f"  [{t_sec:6.3f}s] raw={raw_sample:.4f}V "
                  f"filtered={filtered:.4f}V "
                  f"noisy={noisy_sample:.4f}V "
                  f"(DP noise={dp_noise:+.4f}, eps={current_epsilon:.2f})")

        window.append(noisy_sample)

        # ── NSP Frame ────────────────────────────────────────────────────
        if len(window) >= WINDOW_SIZE:
            frame = build_nsp_frame(window)
            frame_count += 1
            reduction = (1 - len(frame) / raw_bytes) * 100

            total_raw += raw_bytes
            total_encrypted += len(frame)

            frame_start = (i - WINDOW_SIZE + 1) / SAMPLE_RATE
            frame_end = i / SAMPLE_RATE

            print(f"  [{t_sec:6.3f}s] [NSP-FRAME #{frame_count:3d}] "
                  f"{raw_bytes}B raw -> {len(frame)}B encrypted "
                  f"({reduction:+.1f}% reduction) | "
                  f"eps={current_epsilon:.2f} | "
                  f"t=[{frame_start:.2f}-{frame_end:.2f}s]")

            window.clear()
            raw_bytes = 0

    elapsed = time.time() - t_start

    # ── Summary ──────────────────────────────────────────────────────────────
    print()
    print("=" * 65)
    print("  SIMULATION SUMMARY")
    print("=" * 65)
    print(f"  Total samples:      {len(signal)}")
    print(f"  Samples processed:  {len(signal) - blocked_count}")
    print(f"  Samples blocked:    {blocked_count} (L1 impedance guard)")
    print(f"  L1 impedance events:{l1.imp_events}")
    print(f"  NSP frames sent:    {frame_count}")
    if total_raw > 0:
        overall = (1 - total_encrypted / total_raw) * 100
        print(f"  Total raw data:     {total_raw} bytes")
        print(f"  Total encrypted:    {total_encrypted} bytes")
        print(f"  Overall reduction:  {overall:.1f}%")
    print(f"  L3 policy tightens: {policy_tighten_count}")
    print(f"  Wall clock time:    {elapsed:.3f}s "
          f"({len(signal)/elapsed:.0f} samples/sec)")
    print("=" * 65)

    # Attack-specific analysis
    if attack_freq:
        print(f"\n  SSVEP ATTACK ANALYSIS ({attack_freq} Hz)")
        print(f"  The notch filter at {attack_freq}Hz should attenuate the")
        print(f"  injected signal. Check the filtered vs raw values above")
        print(f"  (use --verbose to see per-sample values).")
        print(f"  Policy tightened {policy_tighten_count} times during the attack,")
        print(f"  reducing DP epsilon from {DP_EPSILON} to {policy.tight_epsilon}")
        print(f"  (adding {DP_SENSITIVITY/policy.tight_epsilon:.1f}x more noise).")

    if spike_time:
        print(f"\n  IMPEDANCE SPIKE ANALYSIS")
        print(f"  Spike injected at t={spike_time}s (sample "
              f"#{int(spike_time * SAMPLE_RATE)})")
        print(f"  Impedance guard triggered {l1.imp_events} time(s),")
        print(f"  blocking {blocked_count} samples ({blocked_count*4}ms lockout).")


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
  python sim.py --attack --spike       Both attacks
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
                        help="Time to start SSVEP attack (default: 2.0s)")
    parser.add_argument("--spike", action="store_true",
                        help="Inject impedance spike")
    parser.add_argument("--spike-time", type=float, default=3.0,
                        help="Time of impedance spike (default: 3.0s)")
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
