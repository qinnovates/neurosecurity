#!/usr/bin/env python3
"""
test_brainflow.py — Validate Neurowall coherence monitor against BrainFlow synthetic EEG.

BrainFlow's synthetic board generates 16-channel EEG at 250Hz with realistic
multi-band spectral content (10Hz alpha sinusoid + band-limited noise).
This is a completely independent EEG source — not our generator.

Tests:
  1. Clean BrainFlow EEG → should produce low anomaly scores (FPR check)
  2. BrainFlow EEG + injected attacks → should be detected
  3. Multi-channel consistency → Cs should be similar across channels
  4. Statistical validation → 50-run FPR and detection rates

Usage:
    python test_brainflow.py              # Single run, all tests
    python test_brainflow.py --runs 50    # Statistical validation
    python test_brainflow.py --channels   # Multi-channel analysis
    python test_brainflow.py --verbose    # Print per-window details

Dependencies:
    pip install numpy scipy lz4 cryptography brainflow
"""

import argparse
import time
import sys
import numpy as np
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds
from dataclasses import dataclass
from typing import List, Tuple

# Import Neurowall pipeline components
from sim import (
    SignalBoundary, SignalMonitor, NissEngine,
    apply_local_dp, PrivacyBudget,
    SAMPLE_RATE, WINDOW_SIZE, DP_EPSILON, DP_SENSITIVITY,
)

# ─── BrainFlow Data Acquisition ──────────────────────────────────────────────

def acquire_brainflow_eeg(duration_s: float = 15.0, channel_idx: int = 0) -> np.ndarray:
    """Acquire EEG from BrainFlow synthetic board.

    Returns a 1D array of voltages in the 0-5V ADC range that Neurowall expects.
    BrainFlow synthetic board outputs microvolts; we scale to match
    a typical 24-bit ADC with 0-5V range and ~100uV/LSB gain.
    """
    board_id = BoardIds.SYNTHETIC_BOARD.value
    params = BrainFlowInputParams()

    # Suppress BrainFlow logging
    BoardShim.disable_board_logger()

    board = BoardShim(board_id, params)
    board.prepare_session()
    board.start_stream()

    # Collect data (add 0.5s buffer for timing jitter)
    time.sleep(duration_s + 0.5)

    data = board.get_board_data()
    board.stop_stream()
    board.release_session()

    # Get EEG channel indices
    eeg_channels = BoardShim.get_eeg_channels(board_id)
    ch = eeg_channels[channel_idx]

    # Extract single channel, trim to exact duration
    n_samples = int(duration_s * SAMPLE_RATE)
    raw_uv = data[ch, :n_samples]

    # Scale: uV → 0-5V ADC range
    # BrainFlow synthetic: roughly -300 to +1000 uV, mean ~100 uV
    # Map to 0-5V centered at 2.5V with gain that preserves relative dynamics
    # Typical BCI ADC: ±500uV maps to full 0-5V range (gain ~5000)
    # We use a more conservative mapping that keeps signal within safe range
    signal_v = 2.5 + (raw_uv - np.mean(raw_uv)) * (1.0 / 500.0)
    signal_v = np.clip(signal_v, 0.0, 5.0)

    return signal_v


def acquire_brainflow_multichannel(duration_s: float = 15.0) -> Tuple[np.ndarray, List[str]]:
    """Acquire all 16 EEG channels from BrainFlow synthetic board.

    Returns (data_2d, channel_names) where data_2d is (16, n_samples) in 0-5V.
    """
    board_id = BoardIds.SYNTHETIC_BOARD.value
    params = BrainFlowInputParams()
    BoardShim.disable_board_logger()

    board = BoardShim(board_id, params)
    board.prepare_session()
    board.start_stream()
    time.sleep(duration_s + 0.5)
    data = board.get_board_data()
    board.stop_stream()
    board.release_session()

    eeg_channels = BoardShim.get_eeg_channels(board_id)
    descr = BoardShim.get_board_descr(board_id)
    names = descr.get("eeg_names", "").split(",")

    n_samples = int(duration_s * SAMPLE_RATE)
    all_channels = []
    for ch in eeg_channels:
        raw_uv = data[ch, :n_samples]
        signal_v = 2.5 + (raw_uv - np.mean(raw_uv)) * (1.0 / 500.0)
        signal_v = np.clip(signal_v, 0.0, 5.0)
        all_channels.append(signal_v)

    return np.array(all_channels), names


# ─── Attack Injection (on real EEG) ──────────────────────────────────────────

def inject_ssvep(signal: np.ndarray, freq: float = 15.0,
                 amplitude_v: float = 0.3, start_s: float = 5.0) -> np.ndarray:
    """Inject SSVEP attack onto real EEG signal."""
    out = signal.copy()
    t = np.arange(len(out)) / SAMPLE_RATE
    mask = t >= start_s
    out[mask] += amplitude_v * np.sin(2 * np.pi * freq * t[mask])
    return np.clip(out, 0.0, 5.0)


def inject_flooding(signal: np.ndarray, start_s: float = 5.0) -> np.ndarray:
    """Inject broadband flooding attack onto real EEG signal."""
    out = signal.copy()
    t = np.arange(len(out)) / SAMPLE_RATE
    mask = t >= start_s
    n_attack = np.sum(mask)
    flood = np.random.randn(n_attack) * 0.5
    for f in [7.0, 12.5, 17.3, 23.0, 31.0]:
        flood += 0.2 * np.sin(2 * np.pi * f * t[mask])
    out[mask] += flood
    return np.clip(out, 0.0, 5.0)


def inject_envelope_mod(signal: np.ndarray, start_s: float = 5.0) -> np.ndarray:
    """Inject amplitude modulation attack onto real EEG signal."""
    out = signal.copy()
    t = np.arange(len(out)) / SAMPLE_RATE
    mask = t >= start_s
    mod = 1.0 + 0.8 * np.sin(2 * np.pi * 0.5 * t[mask])
    out[mask] = 2.5 + (out[mask] - 2.5) * mod
    return np.clip(out, 0.0, 5.0)


def inject_dc_drift(signal: np.ndarray, start_s: float = 5.0,
                     rate_v_per_s: float = 0.1) -> np.ndarray:
    """Inject slow DC drift onto real EEG signal."""
    out = signal.copy()
    t = np.arange(len(out)) / SAMPLE_RATE
    mask = t >= start_s
    drift = rate_v_per_s * (t[mask] - start_s)
    out[mask] += drift
    return np.clip(out, 0.0, 5.0)


# ─── Pipeline Runner ─────────────────────────────────────────────────────────

def run_pipeline(signal: np.ndarray, verbose: bool = False) -> dict:
    """Run a signal through the full Neurowall 3-layer pipeline.

    Matches the sim.py main loop: L1 (notch + impedance) -> coherence monitor
    -> NISS scoring. Evaluates every window_size samples.
    """
    l1 = SignalBoundary()
    monitor = SignalMonitor(calibration_windows=4)
    niss = NissEngine()

    cs_values = []
    anomaly_scores = []
    niss_scores = []
    windows_processed = 0
    blocked_samples = 0
    monitor_counter = 0

    for i in range(len(signal)):
        sample = float(signal[i])

        # L1: notch filters + impedance guard
        filtered, was_blocked = l1.process(sample)
        if was_blocked:
            blocked_samples += 1
            niss.update(0.0, imp_event=True)
            continue

        # Feed raw sample to NISS and coherence monitor (before notch,
        # matching sim.py behavior)
        niss.update(sample)
        monitor.update(sample)

        # Evaluate every window_size samples (matching sim.py main loop)
        monitor_counter += 1
        if monitor_counter >= monitor.window_size:
            monitor_counter = 0
            anomaly_score, detail = monitor.evaluate()

            if detail.get("status") == "monitoring":
                windows_processed += 1
                cs = detail.get("cs", 0.0)
                cs_values.append(cs)
                anomaly_scores.append(anomaly_score)
                niss_bio = niss.score(anomaly_score=anomaly_score)
                niss_scores.append(niss_bio)
                if verbose:
                    t_sec = i / SAMPLE_RATE
                    print(f"  t={t_sec:6.2f}s  Cs={cs:.4f}  "
                          f"z={anomaly_score:.2f}  NISS={niss_bio}")

    # Count anomalies using same threshold as test_nic_chains.py
    threshold = 1.5
    anomaly_count = sum(1 for s in anomaly_scores if s > threshold)

    return {
        "windows": windows_processed,
        "anomaly_count": anomaly_count,
        "cs_values": cs_values,
        "anomaly_scores": anomaly_scores,
        "niss_scores": niss_scores,
        "blocked_samples": blocked_samples,
        "cs_mean": float(np.mean(cs_values)) if cs_values else 0.0,
        "cs_std": float(np.std(cs_values)) if cs_values else 0.0,
    }


# ─── Test Scenarios ──────────────────────────────────────────────────────────

@dataclass
class TestResult:
    name: str
    anomaly_count: int
    total_windows: int
    cs_mean: float
    cs_std: float
    detected: bool  # True if anomaly_count exceeds FPR-adjusted threshold


def run_single_test(duration_s: float = 15.0, verbose: bool = False) -> dict:
    """Run all attack scenarios against one BrainFlow acquisition."""

    print("Acquiring BrainFlow synthetic EEG...")
    clean_signal = acquire_brainflow_eeg(duration_s)
    print(f"  Acquired {len(clean_signal)} samples ({duration_s}s)")
    print(f"  Signal range: [{clean_signal.min():.3f}, {clean_signal.max():.3f}]V")
    print(f"  Mean: {clean_signal.mean():.3f}V, Std: {clean_signal.std():.4f}V")
    print()

    # Define attack scenarios
    scenarios = [
        ("Clean (baseline)", clean_signal),
        ("SSVEP 15Hz", inject_ssvep(clean_signal, 15.0)),
        ("SSVEP 10.9Hz", inject_ssvep(clean_signal, 10.9)),
        ("Flooding", inject_flooding(clean_signal)),
        ("Envelope Mod", inject_envelope_mod(clean_signal)),
        ("DC Drift", inject_dc_drift(clean_signal)),
    ]

    results = []
    clean_anomalies = None

    for name, sig in scenarios:
        print(f"--- {name} ---")
        r = run_pipeline(sig, verbose=verbose)

        if clean_anomalies is None:
            clean_anomalies = r["anomaly_count"]
            detection_threshold = max(clean_anomalies * 2, clean_anomalies + 3)
            print(f"  Clean baseline: {clean_anomalies} anomalies "
                  f"(threshold for detection: >{detection_threshold})")

        detected = r["anomaly_count"] > detection_threshold if clean_anomalies is not None else False

        result = TestResult(
            name=name,
            anomaly_count=r["anomaly_count"],
            total_windows=r["windows"],
            cs_mean=r["cs_mean"],
            cs_std=r["cs_std"],
            detected=detected,
        )
        results.append(result)

        status = "DETECTED" if detected else ("BASELINE" if name.startswith("Clean") else "EVADED")
        print(f"  Windows: {r['windows']}, Anomalies: {r['anomaly_count']}, "
              f"Cs: {r['cs_mean']:.4f} +/- {r['cs_std']:.4f}  [{status}]")
        print()

    return {
        "results": results,
        "clean_anomalies": clean_anomalies,
        "detection_threshold": detection_threshold,
    }


def run_multichannel_test(duration_s: float = 15.0) -> None:
    """Test coherence monitor across all 16 BrainFlow channels."""
    print("Acquiring 16-channel BrainFlow EEG...")
    channels, names = acquire_brainflow_multichannel(duration_s)
    print(f"  Acquired {channels.shape[1]} samples x {channels.shape[0]} channels")
    print()

    print(f"{'Channel':<8} {'Name':<6} {'Windows':>8} {'Anomalies':>10} "
          f"{'Cs_mean':>8} {'Cs_std':>8}")
    print("-" * 56)

    cs_means = []
    anomaly_counts = []
    for i in range(channels.shape[0]):
        r = run_pipeline(channels[i])
        cs_means.append(r["cs_mean"])
        anomaly_counts.append(r["anomaly_count"])
        print(f"Ch{i:<5d} {names[i] if i < len(names) else '?':<6} "
              f"{r['windows']:>8d} {r['anomaly_count']:>10d} "
              f"{r['cs_mean']:>8.4f} {r['cs_std']:>8.4f}")

    print()
    print(f"Cs consistency across channels: "
          f"mean={np.mean(cs_means):.4f}, std={np.std(cs_means):.4f}")
    print(f"Anomaly count range: [{min(anomaly_counts)}, {max(anomaly_counts)}]")
    max_spread = max(cs_means) - min(cs_means)
    if max_spread < 0.15:
        print(f"PASS: Cs spread {max_spread:.4f} < 0.15 (auto-calibration works)")
    else:
        print(f"WARN: Cs spread {max_spread:.4f} >= 0.15 (calibration may need tuning)")


def run_statistical_test(n_runs: int = 50, duration_s: float = 15.0) -> None:
    """Run multiple iterations for statistical validation."""
    print(f"Statistical validation: {n_runs} runs x {duration_s}s")
    print()

    attack_names = ["SSVEP 15Hz", "SSVEP 10.9Hz", "Flooding",
                    "Envelope Mod", "DC Drift"]
    detection_counts = {name: 0 for name in attack_names}
    clean_anomaly_counts = []

    for run in range(n_runs):
        sys.stdout.write(f"\r  Run {run + 1}/{n_runs}...")
        sys.stdout.flush()

        result = run_single_quiet(duration_s)
        clean_anomaly_counts.append(result["clean_anomalies"])

        for name in attack_names:
            if result["detected"].get(name, False):
                detection_counts[name] += 1

    print(f"\r  Completed {n_runs} runs.          ")
    print()

    # Clean FPR
    mean_clean = np.mean(clean_anomaly_counts)
    std_clean = np.std(clean_anomaly_counts)
    print(f"Clean signal: {mean_clean:.1f} +/- {std_clean:.1f} anomalies/run")
    print()

    # Detection rates
    print(f"{'Attack':<20} {'Detected':>10} {'Rate':>8}")
    print("-" * 42)
    for name in attack_names:
        count = detection_counts[name]
        rate = count / n_runs * 100
        status = "OK" if rate >= 80 else "LOW" if rate >= 50 else "FAIL"
        print(f"{name:<20} {count:>7}/{n_runs:<3} {rate:>6.1f}%  [{status}]")


def run_single_quiet(duration_s: float = 15.0) -> dict:
    """Run all scenarios quietly (no output), return detection results."""
    clean_signal = acquire_brainflow_eeg(duration_s)

    scenarios = {
        "SSVEP 15Hz": inject_ssvep(clean_signal, 15.0),
        "SSVEP 10.9Hz": inject_ssvep(clean_signal, 10.9),
        "Flooding": inject_flooding(clean_signal),
        "Envelope Mod": inject_envelope_mod(clean_signal),
        "DC Drift": inject_dc_drift(clean_signal),
    }

    clean_r = run_pipeline(clean_signal)
    clean_anomalies = clean_r["anomaly_count"]
    threshold = max(clean_anomalies * 2, clean_anomalies + 3)

    detected = {}
    for name, sig in scenarios.items():
        r = run_pipeline(sig)
        detected[name] = r["anomaly_count"] > threshold

    return {
        "clean_anomalies": clean_anomalies,
        "detected": detected,
    }


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Validate Neurowall against BrainFlow synthetic EEG")
    parser.add_argument("--runs", type=int, default=0,
                        help="Number of statistical runs (0 = single run)")
    parser.add_argument("--channels", action="store_true",
                        help="Multi-channel consistency test")
    parser.add_argument("--duration", type=float, default=15.0,
                        help="Signal duration in seconds (default: 15)")
    parser.add_argument("--verbose", action="store_true",
                        help="Print per-window details")
    args = parser.parse_args()

    print("=" * 60)
    print("NEUROWALL v0.8 — BrainFlow Validation")
    print("=" * 60)
    print(f"Source: BrainFlow synthetic board (16ch, 250Hz)")
    print(f"Duration: {args.duration}s per acquisition")
    print()

    if args.channels:
        run_multichannel_test(args.duration)
    elif args.runs > 0:
        run_statistical_test(args.runs, args.duration)
    else:
        result = run_single_test(args.duration, verbose=args.verbose)

        # Summary
        print("=" * 60)
        print("SUMMARY")
        print("=" * 60)
        detected_count = sum(1 for r in result["results"][1:] if r.detected)
        total_attacks = len(result["results"]) - 1
        print(f"Detection: {detected_count}/{total_attacks} attacks detected")
        print(f"Clean baseline: {result['clean_anomalies']} anomalies")
        print(f"Detection threshold: >{result['detection_threshold']}")
        print()
        for r in result["results"]:
            status = ("BASELINE" if r.name.startswith("Clean")
                      else "DETECTED" if r.detected else "EVADED")
            print(f"  {r.name:<20} {r.anomaly_count:>3} anomalies  "
                  f"Cs={r.cs_mean:.4f}  [{status}]")


if __name__ == "__main__":
    main()
