#!/usr/bin/env python3
"""
neurowall/visualize.py
Generates publication-quality charts from Neurowall test data.

Usage:
    # First generate data:
    python test_nic_chains.py --roc --roc-runs 30

    # Then generate charts:
    python visualize.py                    # All charts
    python visualize.py --roc              # ROC curves only
    python visualize.py --heatmap          # Detection heatmap only
    python visualize.py --trajectories     # Cs trajectory plots
    python visualize.py --distributions    # Anomaly score distributions

Dependencies:
    pip install numpy scipy matplotlib
"""

import argparse
import json
import os
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path

# Import pipeline for trajectory generation
from sim import generate_eeg, SignalBoundary, SignalMonitor, SAMPLE_RATE
from test_nic_chains import (
    SCENARIOS, AttackScenario, run_scenario,
    generate_clean, generate_ssvep_15hz, generate_ssvep_novel,
    generate_impedance_spike, generate_drift, generate_flood,
    generate_boiling_frog, generate_envelope_modulation,
    generate_phase_replay, generate_closed_loop_cascade,
)

CHARTS_DIR = Path("charts")
COLORS = {
    "clean": "#4CAF50",
    "detected": "#2196F3",
    "evaded": "#F44336",
    "neutral": "#9E9E9E",
}

SCENARIO_COLORS = [
    "#4CAF50",  # 0: clean (green)
    "#2196F3",  # 1: SSVEP 15Hz (blue)
    "#03A9F4",  # 2: SSVEP 13Hz (light blue)
    "#FF9800",  # 3: impedance (orange)
    "#9C27B0",  # 4: DC drift (purple)
    "#F44336",  # 5: flood (red)
    "#E91E63",  # 6: boiling frog (pink)
    "#FF5722",  # 7: envelope mod (deep orange)
    "#795548",  # 8: phase replay (brown)
    "#607D8B",  # 9: cascade (blue grey)
]

SHORT_NAMES = [
    "Clean", "SSVEP 15Hz", "SSVEP 13Hz", "Impedance",
    "DC Drift", "Flood", "Boiling Frog", "Envelope Mod",
    "Phase Replay", "Cascade",
]


def ensure_charts_dir():
    CHARTS_DIR.mkdir(exist_ok=True)


def plot_roc_curves():
    """Plot ROC curves from roc_data.json."""
    roc_file = Path("roc_data.json")
    if not roc_file.exists():
        print("  No roc_data.json found. Run: python test_nic_chains.py --roc")
        return

    with open(roc_file) as f:
        data = json.load(f)

    durations = data["durations"]
    roc_points = data["roc_points"]

    # One subplot per duration
    fig, axes = plt.subplots(1, len(durations), figsize=(5 * len(durations), 5),
                             sharey=True)
    if len(durations) == 1:
        axes = [axes]

    for ax_idx, dur in enumerate(durations):
        ax = axes[ax_idx]
        dur_points = [rp for rp in roc_points if rp["duration"] == dur]

        # Plot each attack scenario
        for s_id in range(1, 10):
            fprs = [rp["fpr"] for rp in dur_points]
            tprs = [rp["tpr"].get(str(s_id), 0) for rp in dur_points]
            ax.plot(fprs, tprs, 'o-', color=SCENARIO_COLORS[s_id],
                    label=SHORT_NAMES[s_id], markersize=4, linewidth=1.5)

        # Diagonal (random classifier)
        ax.plot([0, 1], [0, 1], '--', color='#BDBDBD', linewidth=0.8)

        ax.set_xlabel("False Positive Rate", fontsize=10)
        ax.set_title(f"Duration: {dur}s", fontsize=11, fontweight='bold')
        ax.set_xlim(-0.02, 1.02)
        ax.set_ylim(-0.02, 1.02)
        ax.grid(True, alpha=0.3)

        if ax_idx == 0:
            ax.set_ylabel("True Positive Rate", fontsize=10)

    # Legend outside
    handles, labels = axes[-1].get_legend_handles_labels()
    fig.legend(handles, labels, loc='lower center', ncol=3,
               fontsize=8, bbox_to_anchor=(0.5, -0.08))

    fig.suptitle("Neurowall v0.6 ROC Curves by Observation Duration",
                 fontsize=13, fontweight='bold', y=1.02)
    plt.tight_layout()
    out = CHARTS_DIR / "roc_curves.png"
    fig.savefig(out, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"  Saved: {out}")


def plot_detection_heatmap():
    """Plot detection heatmap from duration sweep data."""
    print("  Generating detection heatmap (running sweep)...")
    durations = [10, 15, 20, 30, 60]
    n_scenarios = len(SCENARIOS)

    # Run sweep
    results = np.zeros((n_scenarios, len(durations)))
    for d_idx, dur in enumerate(durations):
        for s_idx, scenario in enumerate(SCENARIOS):
            s_copy = AttackScenario(
                id=scenario.id, name=scenario.name, tara_id=scenario.tara_id,
                tactic=scenario.tactic, nic_chain=scenario.nic_chain,
                niss_vector=scenario.niss_vector, severity=scenario.severity,
                description=scenario.description,
                detection_expected=scenario.detection_expected,
                generate_fn=scenario.generate_fn,
            )
            result = run_scenario(s_copy, duration=float(dur))
            if scenario.id == 0:
                results[s_idx, d_idx] = result.monitor_anomaly_count
            else:
                detected = (result.l1_blocked > 0 or result.ssvep_detected or
                            result.monitor_anomaly_count > 8)
                results[s_idx, d_idx] = 1.0 if detected else 0.0

    fig, ax = plt.subplots(figsize=(8, 6))

    # Create color-coded heatmap
    attack_results = results[1:, :]
    im = ax.imshow(attack_results, cmap='RdYlGn', aspect='auto',
                   vmin=0, vmax=1)

    ax.set_xticks(range(len(durations)))
    ax.set_xticklabels([f"{d}s" for d in durations])
    ax.set_yticks(range(n_scenarios - 1))
    ax.set_yticklabels(SHORT_NAMES[1:], fontsize=9)
    ax.set_xlabel("Observation Duration", fontsize=11)
    ax.set_ylabel("Attack Scenario", fontsize=11)

    # Add text annotations
    for i in range(n_scenarios - 1):
        for j in range(len(durations)):
            val = attack_results[i, j]
            text = "DET" if val > 0.5 else "EVD"
            color = "white" if val < 0.3 or val > 0.7 else "black"
            ax.text(j, i, text, ha="center", va="center",
                    color=color, fontsize=8, fontweight='bold')

    # Clean signal FPR row at top
    ax.set_title(f"Detection Heatmap (Clean FPR: {' / '.join(str(int(results[0,j])) + 'FP' for j in range(len(durations)))})",
                 fontsize=12, fontweight='bold')

    plt.tight_layout()
    out = CHARTS_DIR / "detection_heatmap.png"
    fig.savefig(out, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"  Saved: {out}")


def plot_cs_trajectories():
    """Plot Cs coherence score trajectories over time for each attack."""
    print("  Generating Cs trajectory plots...")
    duration = 15.0

    generators = {
        0: generate_clean,
        1: generate_ssvep_15hz,
        2: generate_ssvep_novel,
        4: generate_drift,
        5: generate_flood,
        6: generate_boiling_frog,
        7: generate_envelope_modulation,
        9: generate_closed_loop_cascade,
    }

    fig, axes = plt.subplots(2, 4, figsize=(16, 8), sharey=True)
    axes = axes.flatten()

    for ax_idx, (s_id, gen_fn) in enumerate(generators.items()):
        ax = axes[ax_idx]
        np.random.seed(42 + s_id)
        signal = gen_fn(duration, SAMPLE_RATE)

        # Run through monitor
        l1 = SignalBoundary()
        l1.prev_sample = signal[0]
        monitor = SignalMonitor(calibration_windows=8)
        counter = 0
        cs_values = []
        cs_times = []
        anomaly_scores = []

        for i, raw in enumerate(signal):
            t_sec = i / SAMPLE_RATE
            filtered, blocked = l1.process(raw)
            if blocked:
                continue
            monitor.update(raw)
            counter += 1
            if counter >= monitor.window_size:
                counter = 0
                score, detail = monitor.evaluate()
                if detail.get("status") == "monitoring":
                    cs_values.append(detail["cs"])
                    cs_times.append(t_sec)
                    anomaly_scores.append(score)

        if cs_values:
            ax.plot(cs_times, cs_values, '-', color=SCENARIO_COLORS[s_id],
                    linewidth=1.5, label='Cs')
            # Add baseline
            if monitor._calibrated:
                ax.axhline(y=monitor._baseline_cs_mean, color='gray',
                           linestyle='--', linewidth=0.8, alpha=0.6)
            # Attack start line
            ax.axvline(x=5.0, color='red', linestyle=':', linewidth=0.8,
                       alpha=0.5, label='Attack start')

        ax.set_title(SHORT_NAMES[s_id], fontsize=10, fontweight='bold')
        ax.set_xlim(3, duration)
        ax.set_ylim(0, 1.0)
        ax.grid(True, alpha=0.2)
        if ax_idx >= 4:
            ax.set_xlabel("Time (s)", fontsize=9)
        if ax_idx % 4 == 0:
            ax.set_ylabel("Cs", fontsize=9)

    fig.suptitle("Coherence Score (Cs) Trajectories Under Attack",
                 fontsize=14, fontweight='bold')
    plt.tight_layout()
    out = CHARTS_DIR / "cs_trajectories.png"
    fig.savefig(out, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"  Saved: {out}")


def plot_anomaly_distributions():
    """Box plots of anomaly count distributions from statistical runs."""
    print("  Generating anomaly distributions (running 30 seeds)...")
    n_runs = 30
    duration = 15.0

    all_counts = {}
    for scenario in SCENARIOS:
        counts = []
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
            result = run_scenario(s_copy, duration=duration, seed=run_seed)
            counts.append(result.monitor_anomaly_count)
        all_counts[scenario.id] = counts

    fig, ax = plt.subplots(figsize=(12, 6))

    positions = range(len(SCENARIOS))
    bp_data = [all_counts[s.id] for s in SCENARIOS]

    bp = ax.boxplot(bp_data, positions=positions, patch_artist=True,
                    widths=0.6, showfliers=True)

    for i, patch in enumerate(bp['boxes']):
        patch.set_facecolor(SCENARIO_COLORS[i])
        patch.set_alpha(0.7)

    # Threshold line
    ax.axhline(y=8, color='red', linestyle='--', linewidth=1.5,
               label='Detection threshold (8)')

    ax.set_xticks(positions)
    ax.set_xticklabels(SHORT_NAMES, rotation=30, ha='right', fontsize=9)
    ax.set_ylabel("Anomaly Count", fontsize=11)
    ax.set_title(f"Anomaly Count Distributions ({n_runs} runs, {duration}s)",
                 fontsize=13, fontweight='bold')
    ax.legend(fontsize=9)
    ax.grid(True, axis='y', alpha=0.3)

    plt.tight_layout()
    out = CHARTS_DIR / "anomaly_distributions.png"
    fig.savefig(out, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"  Saved: {out}")


def plot_spectral_comparison():
    """Compare power spectra of clean signal vs key attacks."""
    print("  Generating spectral comparison...")
    duration = 15.0
    fs = SAMPLE_RATE

    attacks = {
        "Clean": (generate_clean, "#4CAF50"),
        "SSVEP 15Hz": (generate_ssvep_15hz, "#2196F3"),
        "SSVEP 13Hz": (generate_ssvep_novel, "#03A9F4"),
        "Flood": (generate_flood, "#F44336"),
        "Envelope Mod": (generate_envelope_modulation, "#FF5722"),
    }

    fig, ax = plt.subplots(figsize=(10, 5))

    for name, (gen_fn, color) in attacks.items():
        np.random.seed(42)
        sig = gen_fn(duration, fs)
        # Take a 1s window from attack region (t=7-8s)
        start = int(7.0 * fs)
        end = int(8.0 * fs)
        window = sig[start:end]
        window_ac = window - np.mean(window)

        freqs = np.fft.rfftfreq(len(window_ac), 1.0 / fs)
        power = np.abs(np.fft.rfft(window_ac)) ** 2
        # Smooth with 3-bin moving average
        power_smooth = np.convolve(power, np.ones(3)/3, mode='same')

        ax.semilogy(freqs[1:60], power_smooth[1:60], '-', color=color,
                    linewidth=1.5, label=name, alpha=0.8)

    ax.set_xlabel("Frequency (Hz)", fontsize=11)
    ax.set_ylabel("Power (log scale)", fontsize=11)
    ax.set_title("Power Spectra: Clean vs Attack Signals (t=7-8s window)",
                 fontsize=13, fontweight='bold')
    ax.legend(fontsize=9)
    ax.grid(True, alpha=0.3)
    ax.set_xlim(0, 60)

    plt.tight_layout()
    out = CHARTS_DIR / "spectral_comparison.png"
    fig.savefig(out, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"  Saved: {out}")


def plot_detection_summary():
    """Summary bar chart: detection rates across versions."""
    fig, ax = plt.subplots(figsize=(10, 5))

    versions = ["v0.4\n(Entry 007)", "v0.5\n(Entry 008)", "v0.6\n(Current)"]
    # Detection counts at default duration
    detected = [6, 5, 7]
    evaded = [3, 4, 2]

    x = np.arange(len(versions))
    width = 0.35

    bars1 = ax.bar(x - width/2, detected, width, label='Detected',
                   color='#4CAF50', alpha=0.8)
    bars2 = ax.bar(x + width/2, evaded, width, label='Evaded',
                   color='#F44336', alpha=0.8)

    # Add value labels
    for bar in bars1:
        ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.1,
                f'{int(bar.get_height())}', ha='center', va='bottom',
                fontweight='bold')
    for bar in bars2:
        ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.1,
                f'{int(bar.get_height())}', ha='center', va='bottom',
                fontweight='bold')

    ax.set_ylabel("Number of Attacks", fontsize=11)
    ax.set_title("Detection Progress Across Neurowall Versions (9 attacks, default duration)",
                 fontsize=12, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(versions)
    ax.legend(fontsize=10)
    ax.set_ylim(0, 10)
    ax.grid(True, axis='y', alpha=0.3)

    # Annotations
    ax.annotate("+ spectral peak\n+ CUSUM\n+ growth hardening",
                xy=(2, 7), xytext=(2.4, 8.5),
                arrowprops=dict(arrowstyle='->', color='gray'),
                fontsize=8, color='gray', ha='center')

    plt.tight_layout()
    out = CHARTS_DIR / "detection_summary.png"
    fig.savefig(out, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"  Saved: {out}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate Neurowall visualization charts")
    parser.add_argument("--roc", action="store_true",
                        help="ROC curves (requires roc_data.json)")
    parser.add_argument("--heatmap", action="store_true",
                        help="Detection heatmap")
    parser.add_argument("--trajectories", action="store_true",
                        help="Cs trajectory plots")
    parser.add_argument("--distributions", action="store_true",
                        help="Anomaly score distributions")
    parser.add_argument("--spectral", action="store_true",
                        help="Spectral comparison")
    parser.add_argument("--summary", action="store_true",
                        help="Detection summary bar chart")

    args = parser.parse_args()

    ensure_charts_dir()

    # If no specific chart requested, generate all
    run_all = not any([args.roc, args.heatmap, args.trajectories,
                       args.distributions, args.spectral, args.summary])

    print("=" * 60)
    print("  NEUROWALL VISUALIZATION SUITE")
    print("=" * 60)
    print()

    if run_all or args.summary:
        plot_detection_summary()

    if run_all or args.spectral:
        plot_spectral_comparison()

    if run_all or args.trajectories:
        plot_cs_trajectories()

    if run_all or args.roc:
        plot_roc_curves()

    if run_all or args.heatmap:
        plot_detection_heatmap()

    if run_all or args.distributions:
        plot_anomaly_distributions()

    print()
    print(f"  All charts saved to {CHARTS_DIR}/")
    print()


if __name__ == "__main__":
    main()
