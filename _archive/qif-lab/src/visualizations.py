"""
QIF Visualizations — All whitepaper figures generated from code.

Every figure in the whitepaper is generated here from equation code + config.
Change the equation → re-run → figures update → re-render whitepaper.
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path

from .config import (
    BANDS, ZONES, BRAIN_REGION_MAP, COHERENCE_THRESHOLDS, FREQUENCY_BANDS,
    BRAIN_MAX_DIMENSION_M, DECOHERENCE_CAMPS, DEFAULT_C1_PARAMS, FRAMEWORK,
)
from .qif_equations import (
    coherence_metric, decoherence_factor, quantum_gate,
    qi_candidate1, qi_candidate2, tunneling_coefficient,
    von_neumann_entropy, QICandidate1Params,
)

FIGURES_DIR = Path(__file__).parent.parent / "figures"
FIGURES_DIR.mkdir(exist_ok=True)

# Style
plt.rcParams.update({
    'figure.facecolor': '#0d1117',
    'axes.facecolor': '#161b22',
    'text.color': '#c9d1d9',
    'axes.labelcolor': '#c9d1d9',
    'xtick.color': '#8b949e',
    'ytick.color': '#8b949e',
    'axes.edgecolor': '#30363d',
    'grid.color': '#21262d',
    'font.family': 'sans-serif',
    'font.size': 11,
})

COLORS = {
    'classical': '#58a6ff',
    'quantum': '#bc8cff',
    'neural': '#3fb950',
    'danger': '#f85149',
    'warning': '#d29922',
    'accent': '#79c0ff',
    'highlight': '#f0883e',
}


def fig_coherence_surface(save=True):
    """[VIS 6.1b] 3D surface: Cₛ vs phase variance and transport variance."""
    fig = plt.figure(figsize=(10, 7))
    ax = fig.add_subplot(111, projection='3d')

    sigma_phi = np.linspace(0, 2, 100)
    sigma_tau = np.linspace(0, 2, 100)
    PHI, TAU = np.meshgrid(sigma_phi, sigma_tau)

    sigma_gamma_fixed = 0.1
    CS = np.exp(-(PHI + TAU + sigma_gamma_fixed))

    surf = ax.plot_surface(PHI, TAU, CS, cmap='viridis', alpha=0.85, edgecolor='none')

    # Threshold planes
    high_t = COHERENCE_THRESHOLDS['high']
    med_t = COHERENCE_THRESHOLDS['low']
    ax.plot_surface(PHI, TAU, np.full_like(CS, high_t), alpha=0.15, color=COLORS['classical'])
    ax.plot_surface(PHI, TAU, np.full_like(CS, med_t), alpha=0.15, color=COLORS['danger'])

    ax.set_xlabel('Phase Variance (σ²ᵩ)')
    ax.set_ylabel('Transport Variance (σ²τ)')
    ax.set_zlabel('Coherence (Cₛ)')
    ax.set_title(f'QIF Coherence Metric Surface (σ²ᵧ = {sigma_gamma_fixed})')
    ax.view_init(elev=25, azim=45)

    fig.colorbar(surf, ax=ax, shrink=0.5, label='Cₛ')

    if save:
        fig.savefig(FIGURES_DIR / 'coherence_surface.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    return fig


def fig_decoherence_dial(save=True):
    """[VIS 10.1/10.2] Decoherence spectrum across timescales."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Left: ΓD(t) curves for different tau_D
    t_range = np.logspace(-15, 5, 1000)

    for camp in DECOHERENCE_CAMPS:
        tau = camp['tau_d']
        gamma_d = np.array([decoherence_factor(t, tau) for t in t_range])
        ax1.semilogx(t_range, gamma_d, linewidth=2, label=camp['camp'])

    ax1.axhline(y=0.5, color=COLORS['warning'], linestyle='--', alpha=0.5, label='50% decoherence')
    ax1.set_xlabel('Time (seconds)')
    ax1.set_ylabel('Decoherence Factor ΓD(t)')
    ax1.set_title('Decoherence Across Disputed Timescales')
    ax1.legend(fontsize=9)
    ax1.set_ylim(-0.05, 1.05)
    ax1.grid(True, alpha=0.3)

    # Right: QI score vs time for different tau_D
    t_range2 = np.logspace(-8, 0, 200)

    for camp in DECOHERENCE_CAMPS:
        tau = camp['tau_d']
        qi_scores = [
            qi_candidate1(
                c_class=0.8, qi_indeterminacy=0.5, q_entangle=0.3, q_tunnel=0.1,
                t=t, params=QICandidate1Params(tau_d=tau)
            )
            for t in t_range2
        ]
        ax2.semilogx(t_range2, qi_scores, linewidth=2, label=camp['camp'])

    # Classical-only baseline
    qi_classical = qi_candidate1(
        c_class=0.8, qi_indeterminacy=0.5, q_entangle=0.3, q_tunnel=0.1,
        t=1e10, params=QICandidate1Params(tau_d=1e-15)
    )
    ax2.axhline(y=qi_classical, color=COLORS['danger'], linestyle=':', alpha=0.7, label='Classical only')

    ax2.set_xlabel('Time (seconds)')
    ax2.set_ylabel('QI Score (Candidate 1)')
    ax2.set_title('QI Security Decay Over Time')
    ax2.legend(fontsize=9)
    ax2.grid(True, alpha=0.3)

    fig.suptitle('The Decoherence Spectrum — τ_D as Tunable Parameter', fontsize=14, y=1.02)
    fig.tight_layout()

    if save:
        fig.savefig(FIGURES_DIR / 'decoherence_spectrum.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    return fig


def fig_scale_frequency(save=True):
    """[VIS 6.3] Log-log scatter: frequency vs coherent spatial extent."""
    fig, ax = plt.subplots(figsize=(10, 6))

    for band in FREQUENCY_BANDS:
        freq_mid = band['freq_mid']
        spatial_mid = band['spatial_mid_m']

        ax.plot(
            freq_mid, spatial_mid,
            'o', markersize=10,
            color=COLORS['quantum'],
        )
        ax.annotate(
            band['band'],
            (freq_mid, spatial_mid),
            textcoords="offset points", xytext=(10, 10),
            fontsize=9, color=COLORS['accent'],
        )

    # Brain dimension ceiling
    ax.axhline(y=BRAIN_MAX_DIMENSION_M, color=COLORS['danger'], linestyle='--',
               alpha=0.7, linewidth=1.5, label=f'Brain max ({BRAIN_MAX_DIMENSION_M*100:.0f} cm)')

    # Trend line (power law on log-log)
    freqs = [b['freq_mid'] for b in FREQUENCY_BANDS]
    spatials = [b['spatial_mid_m'] for b in FREQUENCY_BANDS]
    log_f = np.log10(freqs)
    log_s = np.log10(spatials)
    coeffs = np.polyfit(log_f, log_s, 1)
    trend_f = np.logspace(-0.5, 2.5, 100)
    trend_s = 10 ** (coeffs[0] * np.log10(trend_f) + coeffs[1])
    ax.plot(trend_f, trend_s, '--', color=COLORS['warning'], alpha=0.5,
            label=f'Power law (slope={coeffs[0]:.2f})')

    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.set_xlabel('Frequency (Hz)')
    ax.set_ylabel('Coherent Spatial Extent (m)')
    ax.set_title('Scale-Frequency Relationship (Buzsáki & Draguhn 2004)')
    ax.legend()
    ax.grid(True, alpha=0.3)

    if save:
        fig.savefig(FIGURES_DIR / 'scale_frequency.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    return fig


def fig_hourglass(save=True):
    """[VIS 5.2] The 7-band hourglass architecture (v3.1, 3-1-3 symmetric)."""
    n_bands = len(BANDS)
    fig, ax = plt.subplots(figsize=(10, 11))
    ax.set_xlim(0, 10)
    ax.set_ylim(-1, n_bands + 1)
    ax.axis('off')

    zone_colors = {z_id: z["color"] for z_id, z in ZONES.items()}

    for i, band in enumerate(BANDS):
        y = n_bands - 1 - i  # N3 at top, S3 at bottom
        color = zone_colors[band["zone"]]
        alpha = 0.95 if band["id"] == "I0" else 0.7

        # Width from hourglass_width config (scaled to figure units)
        width = 2.0 + band["hourglass_width"] * 5.0
        x_start = 5 - width / 2

        rect = mpatches.FancyBboxPatch(
            (x_start, y - 0.35), width, 0.7,
            boxstyle="round,pad=0.05",
            facecolor=color, alpha=alpha, edgecolor='white', linewidth=0.8
        )
        ax.add_patch(rect)

        # Band label
        label = f"{band['id']}: {band['name']}"
        fontweight = 'bold' if band["id"] == "I0" else 'normal'
        ax.text(5, y, label, ha='center', va='center', fontsize=10,
                fontweight=fontweight, color='white')

        # QI annotation on the right
        qi_lo, qi_hi = band["qi_range"]
        qi_label = f"QI {qi_lo}–{qi_hi}" if qi_hi > 0 else "QI ≈ 0"
        ax.text(5 + width / 2 + 0.3, y, qi_label, ha='left', va='center',
                fontsize=8, color='#8b949e')

        # Determinacy annotation on the left
        ax.text(5 - width / 2 - 0.3, y, band["determinacy"], ha='right',
                va='center', fontsize=8, color='#8b949e')

    # Zone labels — compute y positions dynamically
    neural_bands = [n_bands - 1 - i for i, b in enumerate(BANDS) if b["zone"] == "neural"]
    interface_bands = [n_bands - 1 - i for i, b in enumerate(BANDS) if b["zone"] == "interface"]
    silicon_bands = [n_bands - 1 - i for i, b in enumerate(BANDS) if b["zone"] == "silicon"]

    ax.text(0.3, sum(neural_bands) / len(neural_bands), 'NEURAL\nDOMAIN',
            ha='center', va='center', fontsize=11,
            color=zone_colors['neural'], fontweight='bold')
    ax.text(0.3, sum(interface_bands) / len(interface_bands), 'INTERFACE\nZONE',
            ha='center', va='center', fontsize=11,
            color=zone_colors['interface'], fontweight='bold')
    ax.text(0.3, sum(silicon_bands) / len(silicon_bands), 'SILICON\nDOMAIN',
            ha='center', va='center', fontsize=11,
            color=zone_colors['silicon'], fontweight='bold')

    # Classical ceiling line — between N2 and N3 (chaotic/stochastic → quantum uncertain)
    # N3 is index 0, N2 is index 1 in BANDS
    n3_y = n_bands - 1 - 0  # N3 position
    n2_y = n_bands - 1 - 1  # N2 position
    ceiling_y = (n3_y + n2_y) / 2
    ax.axhline(y=ceiling_y, color=COLORS['warning'], linestyle='--', alpha=0.6, linewidth=1.5)
    ax.text(9.5, ceiling_y + 0.15, 'Classical\nCeiling', ha='right', va='bottom',
            fontsize=9, color=COLORS['warning'], fontstyle='italic')

    ax.set_title(f'QIF {FRAMEWORK["layer_model_version"]} — {n_bands}-Band Hourglass Architecture',
                 fontsize=14, pad=20, color='#c9d1d9')

    if save:
        fig.savefig(FIGURES_DIR / 'hourglass.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    return fig


def fig_brain_dependency_graph(save=True):
    """[VIS 5.3] Brain region dependency graph — regions positioned by band."""
    try:
        import networkx as nx
    except ImportError:
        print("  [SKIP] brain_dependency_graph: networkx not installed")
        return None

    fig, ax = plt.subplots(figsize=(14, 10))

    G = nx.DiGraph()

    # Assign y-positions based on band, x-positions spread within band
    band_y = {b["id"]: len(BANDS) - 1 - i for i, b in enumerate(BANDS)}
    band_regions = {}
    for region, info in BRAIN_REGION_MAP.items():
        band_id = info["band"]
        # Handle multi-band regions like "N1/N2" — place at midpoint
        if "/" in band_id:
            parts = band_id.split("/")
            primary_band = parts[0]  # use first band for grouping
        else:
            primary_band = band_id
        band_regions.setdefault(primary_band, []).append(region)

    pos = {}
    for band_id, regions in band_regions.items():
        if band_id in band_y:
            y = band_y[band_id]
        elif "/" in band_id:
            # Multi-band: average y position
            parts = band_id.split("/")
            y = sum(band_y.get(p, 0) for p in parts) / len(parts)
        else:
            y = 0
        n = len(regions)
        for j, region in enumerate(regions):
            x = 2 + (j / max(n - 1, 1)) * 10 if n > 1 else 7
            # Multi-band regions get offset y to show spanning
            region_band = BRAIN_REGION_MAP[region]["band"]
            if "/" in region_band:
                parts = region_band.split("/")
                y_actual = sum(band_y.get(p, 0) for p in parts) / len(parts)
                pos[region] = (x, y_actual)
            else:
                pos[region] = (x, y)
            G.add_node(region)

    # Add edges from connection lists (connections are region names or band IDs)
    for region, info in BRAIN_REGION_MAP.items():
        for conn in info["connections"]:
            if conn in BRAIN_REGION_MAP:
                G.add_edge(region, conn)

    zone_colors = {z_id: z["color"] for z_id, z in ZONES.items()}
    bands_by_id = {b["id"]: b for b in BANDS}
    node_colors = []
    for node in G.nodes():
        band_id = BRAIN_REGION_MAP[node]["band"]
        # Handle multi-band regions like "N1/N2"
        primary_band = band_id.split("/")[0]
        if primary_band in bands_by_id:
            zone_id = bands_by_id[primary_band]["zone"]
        else:
            zone_id = "neural"  # fallback
        node_colors.append(zone_colors[zone_id])

    nx.draw_networkx_nodes(G, pos, ax=ax, node_color=node_colors,
                           node_size=1200, alpha=0.85, edgecolors='white', linewidths=1.5)
    nx.draw_networkx_labels(G, pos, ax=ax, font_size=7, font_color='white', font_weight='bold')
    nx.draw_networkx_edges(G, pos, ax=ax, edge_color='#8b949e', alpha=0.4,
                           arrows=True, arrowsize=12, connectionstyle='arc3,rad=0.1')

    # Band labels on left
    for band_id, y_val in band_y.items():
        if band_id in band_regions:
            ax.text(0.5, y_val, band_id, ha='center', va='center', fontsize=12,
                    fontweight='bold', color='#c9d1d9',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='#161b22', edgecolor='#30363d'))

    ax.set_title('Brain Region Dependency Graph (by QIF Band)', fontsize=14,
                 pad=20, color='#c9d1d9')
    ax.axis('off')

    if save:
        fig.savefig(FIGURES_DIR / 'brain_dependency_graph.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    return fig


def fig_qi_stacked_bar(save=True):
    """[VIS 8.2a] QI score components at three time points."""
    fig, ax = plt.subplots(figsize=(10, 6))

    tau_d = 1e-5
    times = [1e-8, 1e-5, 1e-2]
    labels = ['t << τ_D\n(Fully Quantum)', 't ≈ τ_D\n(Hybrid)', 't >> τ_D\n(Classical)']

    c_class = 0.8
    qi_indet = 0.5
    q_entangle = 0.3
    q_tunnel = 0.1
    params = QICandidate1Params(tau_d=tau_d)

    x = np.arange(len(times))
    width = 0.6

    classical_vals = []
    qi_vals = []
    entangle_vals = []
    tunnel_vals = []

    for t in times:
        gate = quantum_gate(t, tau_d)
        classical_vals.append(params.alpha * c_class)
        qi_vals.append(params.beta * gate * qi_indet)
        entangle_vals.append(params.beta * gate * params.delta * q_entangle)
        tunnel_vals.append(params.gamma * q_tunnel)

    # Stack: classical + qi + entangle (positive), tunnel (negative)
    bars1 = ax.bar(x, classical_vals, width, label=f'α·Cclass', color=COLORS['classical'])
    bars2 = ax.bar(x, qi_vals, width, bottom=classical_vals, label=f'β·gate·Qi', color=COLORS['quantum'])
    bottoms = [c + q for c, q in zip(classical_vals, qi_vals)]
    bars3 = ax.bar(x, entangle_vals, width, bottom=bottoms, label=f'β·gate·δ·Qentangle', color=COLORS['neural'])
    bars4 = ax.bar(x, [-t for t in tunnel_vals], width, label=f'−γ·Qtunnel', color=COLORS['danger'], alpha=0.7)

    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylabel('QI Score Components')
    ax.set_title('QI Equation (Candidate 1) — Component Breakdown Over Time')
    ax.legend(loc='upper right')
    ax.grid(True, alpha=0.2, axis='y')
    ax.axhline(y=0, color='white', linewidth=0.5)

    if save:
        fig.savefig(FIGURES_DIR / 'qi_stacked_bar.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    return fig


def fig_tunneling_profiles(save=True):
    """[VIS 9.1] Quantum biometric — unique tunneling profiles per person."""
    fig, ax = plt.subplots(figsize=(10, 6))

    energies = np.linspace(0.01, 0.95, 200)  # eV

    # Simulate 3 different people with different ion channel properties
    profiles = [
        {"V0": 1.0, "d": 0.8e-9, "label": "Person A", "color": COLORS['classical']},
        {"V0": 1.1, "d": 0.9e-9, "label": "Person B", "color": COLORS['quantum']},
        {"V0": 0.95, "d": 1.0e-9, "label": "Person C", "color": COLORS['neural']},
    ]

    for profile in profiles:
        T_vals = [tunneling_coefficient(profile["V0"], E, profile["d"]) for E in energies]
        ax.semilogy(energies, T_vals, linewidth=2.5, label=profile["label"],
                    color=profile["color"])

    ax.set_xlabel('Particle Energy (eV)')
    ax.set_ylabel('Tunneling Probability T(E)')
    ax.set_title('Quantum Biometric — Ion Channel Tunneling Profiles Are Unique')
    ax.legend()
    ax.grid(True, alpha=0.3)
    ax.set_ylim(1e-20, 1)

    if save:
        fig.savefig(FIGURES_DIR / 'tunneling_profiles.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    return fig


def fig_entropy_nonmonotonicity(save=True):
    """[VIS 7.4] Von Neumann entropy: subsystem > total (entanglement signature)."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

    # Classical: subsystem ≤ total
    labels_c = ['Subsystem A', 'Subsystem B', 'Total AB']
    vals_c = [0.5, 0.3, 0.7]
    bars_c = ax1.bar(labels_c, vals_c, color=[COLORS['classical'], COLORS['classical'], COLORS['accent']],
                     alpha=0.8, edgecolor='white', linewidth=0.5)
    ax1.set_ylabel('Shannon Entropy')
    ax1.set_title('Classical: Subsystem ≤ Total')
    ax1.set_ylim(0, 1.0)
    ax1.grid(True, alpha=0.2, axis='y')

    # Quantum entangled: subsystem > total!
    labels_q = ['Subsystem A', 'Subsystem B', 'Total AB']
    # Maximally entangled: subsystems have max entropy, total has zero
    vals_q = [np.log(2), np.log(2), 0.0]
    bars_q = ax2.bar(labels_q, vals_q, color=[COLORS['quantum'], COLORS['quantum'], COLORS['danger']],
                     alpha=0.8, edgecolor='white', linewidth=0.5)
    ax2.set_ylabel('Von Neumann Entropy')
    ax2.set_title('Quantum Entangled: Subsystem > Total!')
    ax2.set_ylim(0, 1.0)
    ax2.grid(True, alpha=0.2, axis='y')

    # Annotate the paradox
    ax2.annotate('ZERO\n(pure entangled state)',
                 xy=(2, 0.02), fontsize=9, ha='center', color=COLORS['danger'], fontweight='bold')
    ax2.annotate('MAX\n(appears random\nto eavesdropper)',
                 xy=(0, vals_q[0] + 0.05), fontsize=8, ha='center', color=COLORS['quantum'])

    fig.suptitle('The Quantum Security Paradox: The Part Is More Uncertain Than the Whole',
                 fontsize=13, y=1.02)
    fig.tight_layout()

    if save:
        fig.savefig(FIGURES_DIR / 'entropy_nonmonotonicity.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    return fig


def fig_scenario_comparison(save=True):
    """[VIS 11/13] Scenario comparison from test data."""
    from .synthetic_data import generate_custom_signals, SCENARIOS
    from .qif_equations import full_qi_assessment

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

    names = []
    coherences = []
    qi_c1 = []
    qi_c2 = []
    is_attacks = []

    for name, scenario in SCENARIOS.items():
        if name in ('quantum_regime_short', 'decoherence_boundary'):
            continue  # Skip non-comparison scenarios
        data = generate_custom_signals(scenario)
        result = full_qi_assessment(
            phases=data['phases'],
            transport_probs=data['transport_probs'],
            amplitudes=data['amplitudes'],
            t=1e-6, tau_d=1e-5,
        )
        names.append(scenario.name.replace(' ', '\n'))
        coherences.append(result.coherence)
        qi_c1.append(result.qi_score_c1)
        qi_c2.append(result.qi_score_c2)
        is_attacks.append(scenario.is_attack)

    x = np.arange(len(names))
    colors = [COLORS['danger'] if a else COLORS['neural'] for a in is_attacks]

    # Left: Coherence scores
    ax1.bar(x, coherences, color=colors, alpha=0.8, edgecolor='white', linewidth=0.5)
    ax1.axhline(y=COHERENCE_THRESHOLDS['high'], color=COLORS['classical'], linestyle='--',
                alpha=0.7, label=f'High threshold ({COHERENCE_THRESHOLDS["high"]})')
    ax1.axhline(y=COHERENCE_THRESHOLDS['low'], color=COLORS['warning'], linestyle='--',
                alpha=0.7, label=f'Low threshold ({COHERENCE_THRESHOLDS["low"]})')
    ax1.set_xticks(x)
    ax1.set_xticklabels(names, fontsize=8)
    ax1.set_ylabel('Coherence (Cₛ)')
    ax1.set_title('Coherence Metric Across Scenarios')
    ax1.legend(fontsize=8)
    ax1.grid(True, alpha=0.2, axis='y')

    # Right: QI scores (both candidates)
    width = 0.35
    ax2.bar(x - width/2, qi_c1, width, label='Candidate 1', color=COLORS['classical'], alpha=0.8)
    ax2.bar(x + width/2, qi_c2, width, label='Candidate 2', color=COLORS['quantum'], alpha=0.8)
    ax2.set_xticks(x)
    ax2.set_xticklabels(names, fontsize=8)
    ax2.set_ylabel('QI Score')
    ax2.set_title('QI Equation — Both Candidates')
    ax2.legend()
    ax2.grid(True, alpha=0.2, axis='y')

    # Legend patches for attack vs normal
    normal_patch = mpatches.Patch(color=COLORS['neural'], label='Normal')
    attack_patch = mpatches.Patch(color=COLORS['danger'], label='Attack')
    ax1.legend(handles=[normal_patch, attack_patch,
                        plt.Line2D([0], [0], color=COLORS['classical'], linestyle='--', label=f'High ({COHERENCE_THRESHOLDS["high"]})'),
                        plt.Line2D([0], [0], color=COLORS['warning'], linestyle='--', label=f'Low ({COHERENCE_THRESHOLDS["low"]})')],
               fontsize=8)

    fig.tight_layout()

    if save:
        fig.savefig(FIGURES_DIR / 'scenario_comparison.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    return fig


def generate_all_figures():
    """Generate all whitepaper figures."""
    print("Generating QIF whitepaper figures...")
    figs = {
        'coherence_surface': fig_coherence_surface,
        'decoherence_spectrum': fig_decoherence_dial,
        'scale_frequency': fig_scale_frequency,
        'hourglass': fig_hourglass,
        'brain_dependency_graph': fig_brain_dependency_graph,
        'qi_stacked_bar': fig_qi_stacked_bar,
        'tunneling_profiles': fig_tunneling_profiles,
        'entropy_nonmonotonicity': fig_entropy_nonmonotonicity,
        'scenario_comparison': fig_scenario_comparison,
    }

    for name, func in figs.items():
        try:
            func(save=True)
            print(f"  [OK] {name}")
        except Exception as e:
            print(f"  [FAIL] {name}: {e}")

    print(f"\nAll figures saved to: {FIGURES_DIR}")


if __name__ == "__main__":
    generate_all_figures()
