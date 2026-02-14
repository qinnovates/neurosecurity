#!/usr/bin/env python3
"""
Generate all figures for the QIF BCI Security paper.
Outputs PDF files to ../figures/
"""

import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import os

FIGDIR = os.path.join(os.path.dirname(__file__), '..', 'figures')
os.makedirs(FIGDIR, exist_ok=True)

# ─── Color palette ───────────────────────────────────────────
COLORS = {
    'critical': '#ef4444',
    'high': '#f97316',
    'medium': '#f59e0b',
    'low': '#10b981',
    'neural': '#166534',
    'interface': '#f59e0b',
    'synthetic': '#3b82f6',
    'confirmed': '#10b981',
    'probable': '#06b6d4',
    'possible': '#8b5cf6',
    'silicon_only': '#94a3b8',
    'cognitive_psychotic': '#8b5cf6',
    'mood_trauma': '#ef4444',
    'motor_neurocognitive': '#f59e0b',
    'persistent_personality': '#ec4899',
    'non_diagnostic': '#94a3b8',
    'group1': '#10b981',
    'group2': '#f59e0b',
    'group3': '#ef4444',
    'bg': '#0f172a',
    'text': '#e2e8f0',
    'muted': '#94a3b8',
}

plt.rcParams.update({
    'figure.facecolor': 'white',
    'axes.facecolor': 'white',
    'text.color': '#1e293b',
    'axes.labelcolor': '#1e293b',
    'xtick.color': '#475569',
    'ytick.color': '#475569',
    'font.family': 'sans-serif',
    'font.size': 10,
})


def save(fig, name):
    path = os.path.join(FIGDIR, name)
    fig.savefig(path, bbox_inches='tight', dpi=300)
    plt.close(fig)
    print(f'  ✓ {name}')


# ═══════════════════════════════════════════════════════════════
# Figure 1: Hourglass Architecture
# ═══════════════════════════════════════════════════════════════
def fig_hourglass():
    fig, ax = plt.subplots(figsize=(5, 8))

    bands = [
        ('N7', 'Neocortex', 'neural', 90),
        ('N6', 'Limbic System', 'neural', 82),
        ('N5', 'Basal Ganglia', 'neural', 72),
        ('N4', 'Diencephalon', 'neural', 62),
        ('N3', 'Cerebellum', 'neural', 55),
        ('N2', 'Brainstem', 'neural', 45),
        ('N1', 'Spinal Cord', 'neural', 38),
        ('I0', 'Neural Interface', 'interface', 30),
        ('S1', 'Analog / Near-Field', 'synthetic', 45),
        ('S2', 'Digital / Telemetry', 'synthetic', 58),
        ('S3', 'Radio / Wireless', 'synthetic', 75),
    ]

    n = len(bands)
    bar_height = 0.7
    gap = 0.15

    for i, (bid, name, zone, width) in enumerate(bands):
        y = (n - 1 - i) * (bar_height + gap)
        color = COLORS[zone]
        alpha = 0.85 if zone != 'interface' else 1.0

        # Centered bar
        x = (100 - width) / 2
        rect = mpatches.FancyBboxPatch(
            (x, y), width, bar_height,
            boxstyle='round,pad=0.05',
            facecolor=color, alpha=alpha,
            edgecolor='white', linewidth=0.5
        )
        ax.add_patch(rect)

        # Label
        label_color = 'white' if zone == 'neural' else ('#1e293b' if zone == 'interface' else 'white')
        ax.text(50, y + bar_height / 2, f'{bid}  {name}',
                ha='center', va='center', fontsize=8,
                fontweight='bold', color=label_color)

    # Zone labels
    ax.text(-8, (n - 1) * (bar_height + gap) - 1.5, 'NEURAL\nZONE',
            ha='center', va='center', fontsize=7, fontweight='bold',
            color=COLORS['neural'], rotation=90)
    ax.text(-8, 3 * (bar_height + gap), 'I0',
            ha='center', va='center', fontsize=7, fontweight='bold',
            color=COLORS['interface'], rotation=90)
    ax.text(-8, 1 * (bar_height + gap), 'SYNTHETIC\nZONE',
            ha='center', va='center', fontsize=7, fontweight='bold',
            color=COLORS['synthetic'], rotation=90)

    ax.set_xlim(-15, 115)
    ax.set_ylim(-0.5, n * (bar_height + gap) + 0.3)
    ax.set_aspect('auto')
    ax.axis('off')
    ax.set_title('QIF Hourglass Architecture', fontweight='bold', fontsize=12, pad=15)

    save(fig, 'hourglass.pdf')


# ═══════════════════════════════════════════════════════════════
# Figure 2: Severity Distribution Bar Chart
# ═══════════════════════════════════════════════════════════════
def fig_severity_dist():
    fig, ax = plt.subplots(figsize=(6, 3.5))

    labels = ['Critical', 'High', 'Medium', 'Low']
    counts = [29, 54, 16, 3]
    colors = [COLORS['critical'], COLORS['high'], COLORS['medium'], COLORS['low']]

    bars = ax.barh(labels[::-1], counts[::-1], color=colors[::-1],
                   edgecolor='white', linewidth=0.5, height=0.6)

    for bar, count in zip(bars, counts[::-1]):
        ax.text(bar.get_width() + 1, bar.get_y() + bar.get_height() / 2,
                str(count), va='center', fontweight='bold', fontsize=10)

    ax.set_xlabel('Number of Techniques')
    ax.set_title('TARA Severity Distribution (102 Techniques)', fontweight='bold')
    ax.set_xlim(0, 65)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    save(fig, 'severity-dist.pdf')


# ═══════════════════════════════════════════════════════════════
# Figure 3: Dual-Use Breakdown (Donut Chart)
# ═══════════════════════════════════════════════════════════════
def fig_dual_use():
    fig, ax = plt.subplots(figsize=(5, 5))

    labels = ['Confirmed\n(52)', 'Probable\n(16)', 'Possible\n(9)', 'Silicon Only\n(25)']
    sizes = [52, 16, 9, 25]
    colors = [COLORS['confirmed'], COLORS['probable'],
              COLORS['possible'], COLORS['silicon_only']]

    wedges, texts, autotexts = ax.pie(
        sizes, labels=labels, colors=colors, autopct='%1.0f%%',
        startangle=90, pctdistance=0.78,
        wedgeprops=dict(width=0.4, edgecolor='white', linewidth=2),
        textprops=dict(fontsize=9)
    )
    for t in autotexts:
        t.set_fontweight('bold')
        t.set_fontsize(8)

    ax.text(0, 0, '102\nTechniques', ha='center', va='center',
            fontsize=14, fontweight='bold', color='#1e293b')
    ax.set_title('Dual-Use Classification', fontweight='bold', fontsize=12, pad=15)

    save(fig, 'dual-use-breakdown.pdf')


# ═══════════════════════════════════════════════════════════════
# Figure 4: CVSS vs NISS Gap
# ═══════════════════════════════════════════════════════════════
def fig_niss_gap():
    fig, ax = plt.subplots(figsize=(6, 4))

    groups = ['Group 1\n(CVSS sufficient\nwith nuance)', 'Group 2\n(CVSS captures\nhalf the impact)',
              'Group 3\n(CVSS fundamentally\ninadequate)']
    counts = [12, 28, 58]
    colors_list = [COLORS['group1'], COLORS['group2'], COLORS['group3']]

    bars = ax.bar(groups, counts, color=colors_list, edgecolor='white',
                  linewidth=1, width=0.6)

    for bar, count in zip(bars, counts):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 1,
                str(count), ha='center', fontweight='bold', fontsize=12)

    # Annotation
    ax.axhline(y=0, color='#cbd5e1', linewidth=0.5)
    ax.text(2, 50, '96.1% need\nNISS extension',
            ha='center', va='bottom', fontsize=9, fontweight='bold',
            color=COLORS['group3'],
            bbox=dict(boxstyle='round,pad=0.3', facecolor='white',
                      edgecolor=COLORS['group3'], alpha=0.9))

    ax.set_ylabel('Number of Techniques')
    ax.set_title('CVSS v4.0 Gap Analysis (102 Techniques)', fontweight='bold')
    ax.set_ylim(0, 70)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    save(fig, 'niss-gap.pdf')


# ═══════════════════════════════════════════════════════════════
# Figure 5: Neural Impact Chain Flow
# ═══════════════════════════════════════════════════════════════
def fig_neural_impact_chain():
    fig, ax = plt.subplots(figsize=(10, 3))

    stages = [
        ('Technique', '#3b82f6'),
        ('Hourglass\nBand', '#166534'),
        ('Neural\nStructure', '#059669'),
        ('Cognitive\nFunction', '#8b5cf6'),
        ('NISS\nScore', '#f59e0b'),
        ('DSM-5-TR\nCode', '#ef4444'),
    ]

    box_w = 1.3
    box_h = 0.8
    gap = 0.5
    y = 0

    for i, (label, color) in enumerate(stages):
        x = i * (box_w + gap)
        rect = mpatches.FancyBboxPatch(
            (x, y), box_w, box_h,
            boxstyle='round,pad=0.1',
            facecolor=color, alpha=0.85,
            edgecolor='white', linewidth=1
        )
        ax.add_patch(rect)
        ax.text(x + box_w / 2, y + box_h / 2, label,
                ha='center', va='center', fontsize=8,
                fontweight='bold', color='white')

        # Arrow to next
        if i < len(stages) - 1:
            ax.annotate('', xy=(x + box_w + gap * 0.1, y + box_h / 2),
                        xytext=(x + box_w - 0.05, y + box_h / 2),
                        arrowprops=dict(arrowstyle='->', color='#64748b',
                                        lw=1.5))

    # Example below
    examples = [
        'QIF-T0001', 'N7, N6', 'Motor Cortex\nHippocampus',
        'Motor Control\nMemory', 'BI:C CG:H\n8.7 (High)',
        'G25.9\nF06.0'
    ]
    for i, ex in enumerate(examples):
        x = i * (box_w + gap) + box_w / 2
        ax.text(x, y - 0.35, ex, ha='center', va='top',
                fontsize=6.5, color='#64748b', style='italic')

    ax.set_xlim(-0.3, len(stages) * (box_w + gap))
    ax.set_ylim(-0.8, box_h + 0.5)
    ax.axis('off')
    ax.set_title('Neural Impact Chain: From Technique to Diagnosis',
                 fontweight='bold', fontsize=11, pad=15)

    save(fig, 'neural-impact-chain.pdf')


# ═══════════════════════════════════════════════════════════════
# Figure 6: DSM-5-TR Cluster Distribution
# ═══════════════════════════════════════════════════════════════
def fig_dsm5_clusters():
    fig, ax = plt.subplots(figsize=(6, 4))

    clusters = ['Non-\nDiagnostic', 'Mood/\nTrauma', 'Cognitive/\nPsychotic',
                'Motor/\nNeurocognitive', 'Persistent/\nPersonality']
    counts = [42, 21, 16, 16, 7]
    colors_list = [
        COLORS['non_diagnostic'], COLORS['mood_trauma'],
        COLORS['cognitive_psychotic'], COLORS['motor_neurocognitive'],
        COLORS['persistent_personality']
    ]

    bars = ax.bar(clusters, counts, color=colors_list, edgecolor='white',
                  linewidth=1, width=0.65)

    for bar, count in zip(bars, counts):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.5,
                str(count), ha='center', fontweight='bold', fontsize=10)

    # Diagnostic risk annotation
    ax.axhline(y=0, color='#cbd5e1', linewidth=0.5)

    ax.set_ylabel('Number of Techniques')
    ax.set_title('DSM-5-TR Diagnostic Cluster Distribution', fontweight='bold')
    ax.set_ylim(0, 50)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    save(fig, 'dsm5-clusters.pdf')


# ═══════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════
if __name__ == '__main__':
    print('Generating figures...')
    fig_hourglass()
    fig_severity_dist()
    fig_dual_use()
    fig_niss_gap()
    fig_neural_impact_chain()
    fig_dsm5_clusters()
    print(f'Done — {6} figures written to {FIGDIR}/')
