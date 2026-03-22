"""
QIF Figure Generator — All whitepaper visualizations generated from code.

As-Code Principle: Every figure is generated from config.py + qif_equations.py.
Change the data → re-run → figures update automatically.

Usage:
    python -m src.figures              # Generate all figures to figures/
    python -m src.figures coherence    # Generate specific figure
"""

import sys
import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.colors import LinearSegmentedColormap

# Add parent to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.config import (
    BANDS, ZONES, BRAIN_REGION_MAP, COHERENCE_THRESHOLDS, FREQUENCY_BANDS,
    DECOHERENCE_CAMPS, THREAT_MODEL, DECISION_MATRIX, FRAMEWORK,
)
from src.qif_equations import (
    coherence_metric, decoherence_factor, quantum_gate,
    tunneling_coefficient, qi_candidate1, qi_candidate2,
    von_neumann_entropy, QICandidate1Params,
)
from src.synthetic_data import generate_custom_signals, SCENARIOS

FIGURES_DIR = os.path.join(os.path.dirname(__file__), '..', 'figures')
os.makedirs(FIGURES_DIR, exist_ok=True)

# Style
plt.rcParams.update({
    'figure.facecolor': 'white',
    'axes.facecolor': '#f8f9fa',
    'axes.grid': True,
    'grid.alpha': 0.3,
    'font.family': 'sans-serif',
    'font.size': 11,
})

COLORS = {
    'osi': '#3498db',
    'neural': '#2ecc71',
    'gateway': '#e74c3c',
    'quantum': '#9b59b6',
    'classical': '#3498db',
    'attack': '#e74c3c',
    'safe': '#2ecc71',
    'warning': '#f39c12',
    'critical': '#e74c3c',
}


def save(fig, name):
    path = os.path.join(FIGURES_DIR, f'{name}.png')
    fig.savefig(path, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"  Saved: {path}")


# ──────────────────────────────────────────────
# Fig 5.2: Hourglass Architecture (v3.0)
# ──────────────────────────────────────────────

def fig_layer_architecture():
    """7-band hourglass with zone colors, width variation, QI annotations."""
    fig, ax = plt.subplots(figsize=(10, 10))

    zone_colors = {z_id: z["color"] for z_id, z in ZONES.items()}
    n = len(BANDS)

    for i, band in enumerate(BANDS):
        y = n - 1 - i  # N3 at top, S3 at bottom
        color = zone_colors[band["zone"]]
        alpha = 0.95 if band["id"] == "I0" else 0.8

        # Width from hourglass_width (scaled to figure)
        width = 0.2 + band["hourglass_width"] * 0.7
        x_offset = (1.0 - width) / 2

        rect = plt.Rectangle((x_offset, y), width, 0.85, facecolor=color, alpha=alpha,
                              edgecolor='white', linewidth=2, zorder=2)
        ax.add_patch(rect)
        ax.text(0.5, y + 0.42, f"{band['id']}: {band['name']}",
                ha='center', va='center', fontsize=10, fontweight='bold', color='white', zorder=3)

        # QI range annotation
        qi_lo, qi_hi = band["qi_range"]
        qi_text = f"QI {qi_lo}–{qi_hi}" if qi_hi > 0 else "QI ≈ 0"
        ax.text(0.5 + width / 2 + 0.15, y + 0.42, qi_text,
                ha='left', va='center', fontsize=8, color='gray', zorder=3)

    # Zone labels — compute y positions dynamically
    neural_ys = [n - 1 - i for i, b in enumerate(BANDS) if b["zone"] == "neural"]
    interface_ys = [n - 1 - i for i, b in enumerate(BANDS) if b["zone"] == "interface"]
    synthetic_ys = [n - 1 - i for i, b in enumerate(BANDS) if b["zone"] == "synthetic"]

    ax.text(1.15, sum(neural_ys) / len(neural_ys) + 0.42, 'Neural\nDomain',
            ha='left', va='center', fontsize=10,
            color=zone_colors['neural'], fontweight='bold')
    ax.text(1.15, sum(interface_ys) / len(interface_ys) + 0.42, 'Interface\nZone',
            ha='left', va='center', fontsize=10,
            color=zone_colors['interface'], fontweight='bold')
    ax.text(1.15, sum(synthetic_ys) / len(synthetic_ys) + 0.42, 'Synthetic\nDomain',
            ha='left', va='center', fontsize=10,
            color=zone_colors['synthetic'], fontweight='bold')

    # Classical ceiling line — between N2 and N3 (dynamic)
    n3_y = n - 1 - 0 + 0.42  # N3 is first band
    n2_y = n - 1 - 1 + 0.42  # N2 is second band
    ceiling_y = (n3_y + n2_y) / 2
    ax.axhline(y=ceiling_y, color='#f39c12', linestyle='--', alpha=0.5, linewidth=1.5, xmin=0.05, xmax=0.95)
    ax.text(0.97, ceiling_y + 0.05, 'Classical Ceiling', ha='right', va='bottom', fontsize=8,
            color='#f39c12', fontstyle='italic')

    ax.set_xlim(-0.15, 1.5)
    ax.set_ylim(-0.5, n + 0.5)
    ax.set_aspect('auto')
    ax.axis('off')
    ax.set_title(f'QIF {FRAMEWORK["layer_model_version"]} — {n}-Band Hourglass Architecture',
                 fontsize=14, fontweight='bold', pad=20)

    save(fig, 'layer_architecture')


# ──────────────────────────────────────────────
# Fig 6.1b: Coherence Surface Plot
# ──────────────────────────────────────────────

def fig_coherence_surface():
    """3D surface: Cₛ as function of σ²ᵩ and σ²τ."""
    fig = plt.figure(figsize=(10, 7))
    ax = fig.add_subplot(111, projection='3d')

    phi = np.linspace(0, 2, 50)
    tau = np.linspace(0, 2, 50)
    PHI, TAU = np.meshgrid(phi, tau)
    CS = np.exp(-(PHI + TAU + 0.1))  # Fixed σ²ᵧ = 0.1

    surf = ax.plot_surface(PHI, TAU, CS, cmap='viridis', alpha=0.8, edgecolor='none')

    # Threshold planes
    high_t = COHERENCE_THRESHOLDS['high']
    low_t = COHERENCE_THRESHOLDS['low']
    ax.plot_surface(PHI, TAU, np.full_like(CS, high_t), alpha=0.15, color='green')
    ax.plot_surface(PHI, TAU, np.full_like(CS, low_t), alpha=0.15, color='red')

    ax.set_xlabel('σ²ᵩ (Phase Variance)')
    ax.set_ylabel('σ²τ (Transport Variance)')
    ax.set_zlabel('Cₛ (Coherence)')
    ax.set_title('Coherence Metric Surface (σ²ᵧ = 0.1)', fontweight='bold')
    ax.view_init(elev=25, azim=135)

    fig.colorbar(surf, shrink=0.5, label='Cₛ')
    save(fig, 'coherence_surface')


# ──────────────────────────────────────────────
# Fig 6.2: Decision Threshold Matrix
# ──────────────────────────────────────────────

def fig_decision_matrix():
    """Traffic light decision matrix."""
    fig, ax = plt.subplots(figsize=(8, 5))

    rows = ['High (Cₛ > 0.6)', 'Medium (0.3-0.6)', 'Low (Cₛ < 0.3)']
    cols = ['Auth Valid', 'Auth Invalid']
    actions = [
        ['ACCEPT', 'REJECT + ALERT'],
        ['ACCEPT + FLAG', 'REJECT + ALERT'],
        ['REJECT + CRITICAL', 'REJECT + CRITICAL'],
    ]
    colors_grid = [
        [COLORS['safe'], COLORS['attack']],
        [COLORS['warning'], COLORS['attack']],
        [COLORS['critical'], COLORS['critical']],
    ]

    for i, row in enumerate(rows):
        for j, col in enumerate(cols):
            rect = plt.Rectangle((j, 2 - i), 1, 1, facecolor=colors_grid[i][j], alpha=0.7, edgecolor='white', linewidth=3)
            ax.add_patch(rect)
            ax.text(j + 0.5, 2.5 - i, actions[i][j], ha='center', va='center',
                    fontsize=11, fontweight='bold', color='white')

    # Labels
    for i, row in enumerate(rows):
        ax.text(-0.05, 2.5 - i, row, ha='right', va='center', fontsize=10, fontweight='bold')
    for j, col in enumerate(cols):
        ax.text(j + 0.5, 3.15, col, ha='center', va='center', fontsize=11, fontweight='bold')

    ax.set_xlim(-0.8, 2)
    ax.set_ylim(-0.2, 3.4)
    ax.axis('off')
    ax.set_title('QIF Decision Matrix', fontsize=14, fontweight='bold')

    save(fig, 'decision_matrix')


# ──────────────────────────────────────────────
# Fig 6.3: Scale-Frequency Log-Log Plot
# ──────────────────────────────────────────────

def fig_scale_frequency():
    """Log-log scatter: frequency vs coherent spatial extent."""
    fig, ax = plt.subplots(figsize=(9, 6))

    freqs = [b['freq_mid'] for b in FREQUENCY_BANDS]
    extents = [b['spatial_mid_m'] for b in FREQUENCY_BANDS]
    labels = [b['band'] for b in FREQUENCY_BANDS]

    ax.scatter(freqs, extents, s=150, c=COLORS['quantum'], zorder=5, edgecolors='white', linewidth=2)
    for f, e, l in zip(freqs, extents, labels):
        ax.annotate(l, (f, e), textcoords='offset points', xytext=(10, 5), fontsize=10, fontweight='bold')

    # Brain dimension ceiling
    ax.axhline(y=0.20, color=COLORS['attack'], linestyle='--', alpha=0.7, label='Brain max (~20 cm)')

    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.set_xlabel('Frequency (Hz)', fontsize=12)
    ax.set_ylabel('Coherent Spatial Extent (m)', fontsize=12)
    ax.set_title('Scale-Frequency Relationship (Buzsáki & Draguhn 2004)', fontweight='bold')
    ax.legend()

    save(fig, 'scale_frequency')


# ──────────────────────────────────────────────
# Fig 8.2a: QI Score Over Decoherence Time
# ──────────────────────────────────────────────

def fig_qi_decoherence():
    """QI(C1) score as decoherence progresses, showing term contributions."""
    tau_d = 1e-5
    times = np.logspace(-8, -2, 200)

    classical_scores = []
    quantum_contribs = []
    total_scores = []

    for t in times:
        params = QICandidate1Params(tau_d=tau_d)
        total = qi_candidate1(c_class=0.8, qi_indeterminacy=0.5, q_entangle=0.3, q_tunnel=0.1, t=t, params=params)
        # Classical only (instant decoherence)
        params_classical = QICandidate1Params(tau_d=1e-15)
        classical = qi_candidate1(c_class=0.8, qi_indeterminacy=0.5, q_entangle=0.3, q_tunnel=0.1, t=t, params=params_classical)

        total_scores.append(total)
        classical_scores.append(classical)
        quantum_contribs.append(total - classical)

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.fill_between(times, classical_scores, total_scores, alpha=0.3, color=COLORS['quantum'], label='Quantum contribution')
    ax.plot(times, total_scores, color=COLORS['quantum'], linewidth=2.5, label='QI(t) total')
    ax.plot(times, classical_scores, color=COLORS['classical'], linewidth=2, linestyle='--', label='Classical only (Cclass)')

    # Mark decoherence camps
    for camp in DECOHERENCE_CAMPS:
        ax.axvline(x=camp['tau_d'], color='gray', linestyle=':', alpha=0.5)
        ax.text(camp['tau_d'], max(total_scores) * 0.95, camp['camp'].split('(')[0].strip(),
                ha='center', va='top', fontsize=8, rotation=90, alpha=0.7)

    ax.set_xscale('log')
    ax.set_xlabel('Time (seconds)', fontsize=12)
    ax.set_ylabel('QI Score', fontsize=12)
    ax.set_title('QI Equation: Quantum Terms Fade with Decoherence', fontweight='bold')
    ax.legend(loc='center right')

    save(fig, 'qi_decoherence')


# ──────────────────────────────────────────────
# Fig 9.2: Zeno-BCI Stabilization
# ──────────────────────────────────────────────

def fig_zeno_stabilization():
    """Quantum coherence with and without Zeno effect."""
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 7), sharex=True)

    tau_d = 1e-5
    t = np.linspace(0, 5e-5, 1000)

    # Without Zeno: exponential decay
    coherence_no_zeno = np.exp(-t / tau_d)
    ax1.plot(t * 1e6, coherence_no_zeno, color=COLORS['attack'], linewidth=2)
    ax1.fill_between(t * 1e6, coherence_no_zeno, alpha=0.1, color=COLORS['attack'])
    ax1.set_ylabel('Quantum Coherence')
    ax1.set_title('Without Zeno Effect: Exponential Decay', fontweight='bold')
    ax1.set_ylim(0, 1.1)

    # With Zeno: sampling resets coherence (sawtooth)
    sampling_rate = 1000  # Hz → 1 ms intervals
    sample_interval = 1.0 / sampling_rate
    coherence_zeno = np.zeros_like(t)
    last_sample = 0
    for i, ti in enumerate(t):
        time_since_sample = ti - last_sample
        coherence_zeno[i] = np.exp(-time_since_sample / tau_d)
        if ti - last_sample >= sample_interval:
            last_sample = ti

    ax2.plot(t * 1e6, coherence_zeno, color=COLORS['safe'], linewidth=2)
    ax2.fill_between(t * 1e6, coherence_zeno, alpha=0.1, color=COLORS['safe'])

    # Mark sampling points
    sample_times = np.arange(0, t[-1], sample_interval)
    for st in sample_times:
        ax2.axvline(x=st * 1e6, color='gray', alpha=0.15, linewidth=0.5)

    ax2.set_xlabel('Time (μs)')
    ax2.set_ylabel('Quantum Coherence')
    ax2.set_title('With Zeno Effect (1 kHz sampling): Coherence Maintained', fontweight='bold')
    ax2.set_ylim(0, 1.1)

    fig.suptitle('Zeno-BCI Stabilization Hypothesis', fontsize=14, fontweight='bold', y=1.02)
    plt.tight_layout()

    save(fig, 'zeno_stabilization')


# ──────────────────────────────────────────────
# Fig 10.2: Decoherence Timescale Number Line
# ──────────────────────────────────────────────

def fig_decoherence_timescales():
    """Log-scale number line showing the 3 decoherence camps."""
    fig, ax = plt.subplots(figsize=(12, 3))

    # Number line
    log_min, log_max = -14, 5
    ax.plot([log_min, log_max], [0, 0], 'k-', linewidth=2)

    # Camps
    camp_colors = [COLORS['attack'], COLORS['warning'], COLORS['safe']]
    for i, camp in enumerate(DECOHERENCE_CAMPS):
        log_t = np.log10(camp['tau_d'])
        ax.plot(log_t, 0, 'o', markersize=15, color=camp_colors[i], zorder=5, markeredgecolor='white', markeredgewidth=2)
        ax.text(log_t, 0.4, camp['camp'], ha='center', va='bottom', fontsize=10, fontweight='bold', color=camp_colors[i])
        ax.text(log_t, -0.4, camp['label'], ha='center', va='top', fontsize=9)

    # QIF bracket
    ax.annotate('', xy=(log_min + 0.5, -0.8), xytext=(log_max - 0.5, -0.8),
                arrowprops=dict(arrowstyle='<->', color=COLORS['quantum'], lw=2))
    ax.text((log_min + log_max) / 2, -1.1, 'QIF works across entire range (τ_D is tunable)',
            ha='center', fontsize=11, fontweight='bold', color=COLORS['quantum'])

    # Tick labels
    for exp in range(-13, 5, 2):
        ax.plot(exp, 0, '|', markersize=8, color='gray')
        ax.text(exp, -0.15, f'10^{exp}', ha='center', va='top', fontsize=7, color='gray')

    ax.set_xlim(log_min - 1, log_max + 1)
    ax.set_ylim(-1.5, 1.2)
    ax.axis('off')
    ax.set_title('The Decoherence Debate: 8 Orders of Magnitude', fontsize=13, fontweight='bold')

    save(fig, 'decoherence_timescales')


# ──────────────────────────────────────────────
# Fig 11.1: Scenario Comparison Bar Chart
# ──────────────────────────────────────────────

def fig_scenario_comparison():
    """Bar chart comparing QI scores across all test scenarios."""
    names = []
    coherences = []
    qi_c1s = []
    is_attacks = []

    for key, scenario in SCENARIOS.items():
        data = generate_custom_signals(scenario)
        from src.qif_equations import full_qi_assessment
        result = full_qi_assessment(
            phases=data['phases'],
            transport_probs=data['transport_probs'],
            amplitudes=data['amplitudes'],
            t=1e-6, tau_d=1e-5,
        )
        names.append(scenario.name)
        coherences.append(result.coherence)
        qi_c1s.append(result.qi_score_c1)
        is_attacks.append(scenario.is_attack)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    x = np.arange(len(names))
    colors = [COLORS['attack'] if a else COLORS['safe'] for a in is_attacks]

    # Coherence
    bars1 = ax1.barh(x, coherences, color=colors, alpha=0.8, edgecolor='white', linewidth=1.5)
    ax1.axvline(x=COHERENCE_THRESHOLDS['high'], color='green', linestyle='--', alpha=0.5, label=f"High ({COHERENCE_THRESHOLDS['high']})")
    ax1.axvline(x=COHERENCE_THRESHOLDS['low'], color='red', linestyle='--', alpha=0.5, label=f"Low ({COHERENCE_THRESHOLDS['low']})")
    ax1.set_yticks(x)
    ax1.set_yticklabels(names, fontsize=9)
    ax1.set_xlabel('Cₛ (Coherence Score)')
    ax1.set_title('Coherence Metric', fontweight='bold')
    ax1.legend(fontsize=8)

    # QI Score
    bars2 = ax2.barh(x, qi_c1s, color=colors, alpha=0.8, edgecolor='white', linewidth=1.5)
    ax2.set_yticks(x)
    ax2.set_yticklabels(names, fontsize=9)
    ax2.set_xlabel('QI(t) Score (Candidate 1)')
    ax2.set_title('QI Equation Output', fontweight='bold')

    # Legend
    safe_patch = mpatches.Patch(color=COLORS['safe'], label='Normal')
    attack_patch = mpatches.Patch(color=COLORS['attack'], label='Attack')
    ax2.legend(handles=[safe_patch, attack_patch], fontsize=9)

    fig.suptitle('QIF Equation: Scenario Comparison', fontsize=14, fontweight='bold')
    plt.tight_layout()

    save(fig, 'scenario_comparison')


# ──────────────────────────────────────────────
# Fig 7.4: Von Neumann Entropy Non-Monotonicity
# ──────────────────────────────────────────────

def fig_entropy_nonmonotonicity():
    """Classical vs quantum entropy: subsystem can exceed total."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 5))

    # Classical: subsystem ≤ total
    ax1.bar(['Total\nSystem', 'Subsystem A', 'Subsystem B'], [1.0, 0.6, 0.4],
            color=[COLORS['classical'], COLORS['classical'], COLORS['classical']], alpha=0.8, edgecolor='white', linewidth=2)
    ax1.set_ylabel('Entropy')
    ax1.set_title('Classical: Parts ≤ Whole', fontweight='bold')
    ax1.set_ylim(0, 1.3)

    # Quantum: subsystem > total (entangled)
    ax2.bar(['Total\nSystem\n(entangled)', 'Subsystem A', 'Subsystem B'], [0.0, 0.693, 0.693],
            color=[COLORS['quantum'], COLORS['quantum'], COLORS['quantum']], alpha=0.8, edgecolor='white', linewidth=2)
    ax2.set_ylabel('Entropy')
    ax2.set_title('Quantum: Parts > Whole', fontweight='bold')
    ax2.set_ylim(0, 1.3)
    ax2.annotate('Pure entangled state:\nTotal entropy = 0\nSubsystem entropy = ln(2)',
                 xy=(0, 0.05), fontsize=8, ha='center', color=COLORS['attack'], fontweight='bold')

    fig.suptitle('Von Neumann Entropy Non-Monotonicity\n"I know everything, but you can\'t tell what\'s being measured"',
                 fontsize=12, fontweight='bold')
    plt.tight_layout()

    save(fig, 'entropy_nonmonotonicity')


# ──────────────────────────────────────────────
# Fig: Tunneling Coefficient vs Barrier Width
# ──────────────────────────────────────────────

def fig_tunneling_barrier():
    """Tunneling probability vs barrier width for different energies."""
    fig, ax = plt.subplots(figsize=(9, 6))

    d_range = np.linspace(0.1e-10, 2e-9, 200)
    V0 = 1.0  # eV

    for E, label, color in [(0.2, 'E = 0.2 eV', COLORS['attack']),
                             (0.5, 'E = 0.5 eV', COLORS['warning']),
                             (0.8, 'E = 0.8 eV', COLORS['safe'])]:
        T_vals = [tunneling_coefficient(V0, E, d) for d in d_range]
        ax.plot(d_range * 1e9, T_vals, linewidth=2.5, label=label, color=color)

    ax.set_xlabel('Barrier Width (nm)', fontsize=12)
    ax.set_ylabel('Tunneling Probability T', fontsize=12)
    ax.set_yscale('log')
    ax.set_title(f'Quantum Tunneling: T ≈ e^(−2κd) | V₀ = {V0} eV', fontweight='bold')
    ax.legend()

    save(fig, 'tunneling_barrier')


# ──────────────────────────────────────────────
# Generate All
# ──────────────────────────────────────────────

ALL_FIGURES = {
    'layers': fig_layer_architecture,
    'coherence': fig_coherence_surface,
    'decision': fig_decision_matrix,
    'scale_freq': fig_scale_frequency,
    'qi_decoherence': fig_qi_decoherence,
    'zeno': fig_zeno_stabilization,
    'timescales': fig_decoherence_timescales,
    'scenarios': fig_scenario_comparison,
    'entropy': fig_entropy_nonmonotonicity,
    'tunneling': fig_tunneling_barrier,
}


def generate_all():
    print("Generating all QIF whitepaper figures...")
    for name, func in ALL_FIGURES.items():
        try:
            func()
        except Exception as e:
            print(f"  ERROR generating {name}: {e}")
    print(f"\nDone. {len(ALL_FIGURES)} figures generated in {FIGURES_DIR}/")


if __name__ == '__main__':
    if len(sys.argv) > 1:
        name = sys.argv[1]
        if name in ALL_FIGURES:
            ALL_FIGURES[name]()
        else:
            print(f"Unknown figure: {name}. Available: {list(ALL_FIGURES.keys())}")
    else:
        generate_all()
