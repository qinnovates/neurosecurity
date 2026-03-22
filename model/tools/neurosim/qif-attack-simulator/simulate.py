#!/usr/bin/env python3
"""
neurosim/qif-attack-simulator/simulate.py
QIF Attack Simulator - Generate and analyze attack signals.

Generates synthetic EEG signals with TARA-mapped attack patterns.
Can output raw signal data, spectral analysis, or pipe directly
into Neurowall for detection testing.

Usage:
    # List all available attacks
    python simulate.py --list

    # List attacks by NIC entry point
    python simulate.py --list --group-by nic

    # List attacks by severity
    python simulate.py --list --group-by severity

    # Generate a specific attack signal
    python simulate.py --attack QIF-T0023 --duration 15

    # Generate and show spectral analysis
    python simulate.py --attack QIF-T0023 --duration 15 --analyze

    # Generate clean baseline
    python simulate.py --clean --duration 15

    # Run all attacks and summarize
    python simulate.py --all --duration 15

    # Export signal to CSV
    python simulate.py --attack QIF-T0023 --duration 15 --output signal.csv

Dependencies:
    pip install numpy scipy
"""

import argparse
import sys
import os
import numpy as np

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from registry import REGISTRY, get_generator, list_attacks, list_by_nic, list_by_severity
from attacks.base import generate_clean_eeg, SAMPLE_RATE


def print_attack_list(group_by: str = None):
    """Print all registered attacks."""
    if group_by == "nic":
        groups = list_by_nic()
        print(f"\n  QIF Attack Simulator - {len(REGISTRY)} attacks by NIC entry point")
        print("  " + "=" * 70)
        for band, attacks in sorted(groups.items()):
            print(f"\n  [{band}] ({len(attacks)} attacks)")
            print("  " + "-" * 70)
            for qif_t, meta in attacks:
                print(f"    {qif_t:<25s} {meta.severity:<10s} {meta.name}")
    elif group_by == "severity":
        groups = list_by_severity()
        order = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
        print(f"\n  QIF Attack Simulator - {len(REGISTRY)} attacks by severity")
        print("  " + "=" * 70)
        for sev in order:
            attacks = groups.get(sev, [])
            if not attacks:
                continue
            print(f"\n  [{sev}] ({len(attacks)} attacks)")
            print("  " + "-" * 70)
            for qif_t, meta in attacks:
                print(f"    {qif_t:<25s} {meta.nic_chain:<25s} {meta.name}")
    else:
        attacks = list_attacks()
        print(f"\n  QIF Attack Simulator - {len(REGISTRY)} registered attacks")
        print("  " + "=" * 70)
        print(f"  {'QIF-T ID':<25s} {'Tactic':<12s} {'Sev':<10s} {'NIC':<20s} {'Name'}")
        print("  " + "-" * 70)
        for qif_t, meta in attacks:
            chain = meta.nic_chain[:18] if len(meta.nic_chain) > 18 else meta.nic_chain
            print(f"  {qif_t:<25s} {meta.tactic:<12s} {meta.severity:<10s} "
                  f"{chain:<20s} {meta.name}")
    print()


def analyze_signal(signal: np.ndarray, fs: int, name: str, attack_start: float = 5.0):
    """Print spectral analysis of a signal."""
    n = len(signal)
    duration = n / fs

    # Split into pre-attack and post-attack
    pre_end = int(attack_start * fs)
    pre = signal[:pre_end] if pre_end < n else signal
    post = signal[pre_end:] if pre_end < n else np.array([])

    print(f"\n  Signal Analysis: {name}")
    print("  " + "=" * 60)
    print(f"  Duration: {duration:.1f}s | Samples: {n} | Rate: {fs}Hz")
    print(f"  Range: [{signal.min():.4f}, {signal.max():.4f}]V")
    print(f"  Mean: {signal.mean():.4f}V | Std: {signal.std():.4f}V")

    if len(post) > 0:
        print(f"\n  Pre-attack (0-{attack_start}s):")
        print(f"    Mean: {pre.mean():.4f}V | Std: {pre.std():.4f}V")
        print(f"  Post-attack ({attack_start}s+):")
        print(f"    Mean: {post.mean():.4f}V | Std: {post.std():.4f}V")

        # Spectral comparison
        pre_ac = pre - pre.mean()
        post_ac = post - post.mean()

        if len(pre_ac) > 0 and len(post_ac) > 0:
            pre_fft = np.abs(np.fft.rfft(pre_ac)) ** 2
            post_fft = np.abs(np.fft.rfft(post_ac)) ** 2

            pre_freqs = np.fft.rfftfreq(len(pre_ac), 1.0 / fs)
            post_freqs = np.fft.rfftfreq(len(post_ac), 1.0 / fs)

            # Find dominant frequencies
            pre_top = np.argsort(pre_fft)[-3:][::-1]
            post_top = np.argsort(post_fft)[-3:][::-1]

            print(f"\n  Dominant frequencies:")
            print(f"    Pre-attack:  ", end="")
            for idx in pre_top:
                if idx < len(pre_freqs):
                    print(f"{pre_freqs[idx]:.1f}Hz ", end="")
            print()
            print(f"    Post-attack: ", end="")
            for idx in post_top:
                if idx < len(post_freqs):
                    print(f"{post_freqs[idx]:.1f}Hz ", end="")
            print()

    print()


def run_all(duration: float, fs: int):
    """Run all attacks and print summary."""
    attacks = list_attacks()
    print(f"\n  QIF Attack Simulator - Running {len(attacks)} attacks ({duration}s each)")
    print("  " + "=" * 80)
    print(f"  {'QIF-T ID':<25s} {'Name':<35s} {'Mean dV':>8s} {'Max dV':>8s} {'Std dV':>8s}")
    print("  " + "-" * 80)

    # Generate clean baseline
    clean = generate_clean_eeg(duration, fs)
    clean_post = clean[int(5.0 * fs):]
    clean_mean = clean_post.mean()
    clean_std = clean_post.std()

    for qif_t, meta in attacks:
        gen_fn, _ = get_generator(qif_t)
        signal = gen_fn(duration, fs)
        post = signal[int(5.0 * fs):]

        # Deviation from clean baseline
        mean_dv = abs(post.mean() - clean_mean)
        max_dv = abs(post - clean_post[:len(post)]).max() if len(post) == len(clean_post) else 0
        std_dv = abs(post.std() - clean_std)

        print(f"  {qif_t:<25s} {meta.name:<35s} {mean_dv:>8.4f} {max_dv:>8.4f} {std_dv:>8.4f}")

    print()


def main():
    parser = argparse.ArgumentParser(
        description="QIF Attack Simulator - Generate TARA-mapped attack signals"
    )
    parser.add_argument("--list", action="store_true",
                        help="List all registered attacks")
    parser.add_argument("--group-by", choices=["nic", "severity"],
                        help="Group attacks by NIC entry point or severity")
    parser.add_argument("--attack", type=str,
                        help="QIF-T ID of attack to generate")
    parser.add_argument("--clean", action="store_true",
                        help="Generate clean baseline signal")
    parser.add_argument("--all", action="store_true",
                        help="Run all attacks and summarize")
    parser.add_argument("--duration", type=float, default=15.0,
                        help="Signal duration in seconds (default: 15)")
    parser.add_argument("--analyze", action="store_true",
                        help="Show spectral analysis of generated signal")
    parser.add_argument("--output", type=str,
                        help="Export signal to CSV file")
    parser.add_argument("--seed", type=int, default=None,
                        help="Random seed for reproducibility")

    args = parser.parse_args()

    if args.list:
        print_attack_list(args.group_by)
        return

    if args.all:
        run_all(args.duration, SAMPLE_RATE)
        return

    if args.clean:
        signal = generate_clean_eeg(args.duration, SAMPLE_RATE, seed=args.seed)
        if args.analyze:
            analyze_signal(signal, SAMPLE_RATE, "Clean EEG (no attack)")
        if args.output:
            np.savetxt(args.output, signal, delimiter=",", header="voltage", comments="")
            print(f"  Saved {len(signal)} samples to {args.output}")
        if not args.analyze and not args.output:
            print(f"  Generated clean EEG: {len(signal)} samples, {args.duration}s")
        return

    if args.attack:
        gen_fn, meta = get_generator(args.attack)
        signal = gen_fn(args.duration, SAMPLE_RATE, seed=args.seed)

        print(f"\n  Attack: {meta.name}")
        print(f"  QIF-T: {meta.qif_t} | Tactic: {meta.tactic} | Severity: {meta.severity}")
        print(f"  NIC: {meta.nic_chain}")
        print(f"  NISS: {meta.niss_vector}")
        print(f"  Generated {len(signal)} samples ({args.duration}s)")

        if args.analyze:
            analyze_signal(signal, SAMPLE_RATE, meta.name)
        if args.output:
            np.savetxt(args.output, signal, delimiter=",", header="voltage", comments="")
            print(f"  Saved to {args.output}")
        return

    parser.print_help()


if __name__ == "__main__":
    main()
