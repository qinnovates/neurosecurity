#!/usr/bin/env python3
"""Generate business charts from bci-landscape.json for the QIF business brief."""

import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np
from pathlib import Path

# Config
DATA = Path(__file__).parent.parent / 'shared' / 'bci-landscape.json'
OUT = Path(__file__).parent.parent / 'docs' / 'charts' / 'business'
OUT.mkdir(parents=True, exist_ok=True)

# Style
plt.rcParams.update({
    'figure.facecolor': '#0f172a',
    'axes.facecolor': '#1e293b',
    'text.color': '#e2e8f0',
    'axes.labelcolor': '#e2e8f0',
    'xtick.color': '#94a3b8',
    'ytick.color': '#94a3b8',
    'axes.edgecolor': '#334155',
    'grid.color': '#334155',
    'grid.alpha': 0.5,
    'font.family': 'sans-serif',
    'font.size': 11,
})

ACCENT = '#3b82f6'
ACCENT2 = '#10b981'
ACCENT3 = '#f59e0b'
WARN = '#ef4444'

with open(DATA) as f:
    data = json.load(f)

companies = data['companies']

# ═══ Chart 1: Funding by Company (Top 12) ═══
print("Chart 1: Funding by company...")
funded = [(c['name'], c.get('funding_total_usd', 0) or 0) for c in companies]
funded = sorted(funded, key=lambda x: x[1], reverse=True)
funded = [(n, f) for n, f in funded if f > 0][:12]

fig, ax = plt.subplots(figsize=(10, 6))
names = [f[0] for f in funded]
amounts = [f[1] / 1e6 for f in funded]
bars = ax.barh(range(len(names)), amounts, color=ACCENT, edgecolor='none', height=0.7)
ax.set_yticks(range(len(names)))
ax.set_yticklabels(names)
ax.invert_yaxis()
ax.set_xlabel('Total Funding (USD Millions)')
ax.set_title('BCI Company Funding (Top 12)', fontsize=14, fontweight='bold', pad=15)
ax.xaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f'${x:,.0f}M'))
for i, v in enumerate(amounts):
    ax.text(v + 10, i, f'${v:,.0f}M', va='center', fontsize=9, color='#94a3b8')
ax.grid(axis='x', alpha=0.3)
plt.tight_layout()
plt.savefig(OUT / '01-funding-by-company.png', dpi=150, bbox_inches='tight')
plt.close()

# ═══ Chart 2: Security Posture Breakdown ═══
print("Chart 2: Security posture...")
postures = {}
for c in companies:
    p = c.get('security_posture', 'unknown')
    postures[p] = postures.get(p, 0) + 1

labels_map = {
    'none_published': 'No Public Security\nDocumentation',
    'basic_encryption': 'Basic Encryption\nOnly',
    'minimal_claims': 'Minimal Security\nClaims',
    'open_source': 'Open Source\n(Community Review)',
    'regulatory_compliance': 'Regulatory\nCompliance Only',
}
colors_map = {
    'none_published': WARN,
    'basic_encryption': ACCENT3,
    'minimal_claims': ACCENT3,
    'open_source': ACCENT2,
    'regulatory_compliance': ACCENT,
}

labels = [labels_map.get(k, k) for k in postures.keys()]
sizes = list(postures.values())
colors = [colors_map.get(k, '#64748b') for k in postures.keys()]

fig, ax = plt.subplots(figsize=(8, 6))
wedges, texts, autotexts = ax.pie(
    sizes, labels=labels, colors=colors, autopct='%1.0f%%',
    startangle=90, textprops={'fontsize': 10},
    pctdistance=0.75, labeldistance=1.15
)
for t in autotexts:
    t.set_fontsize(11)
    t.set_fontweight('bold')
ax.set_title('BCI Industry Security Posture', fontsize=14, fontweight='bold', pad=15)
# Add total count
ax.text(0, -0.05, f'n = {sum(sizes)} companies', ha='center', fontsize=10, color='#94a3b8')
plt.tight_layout()
plt.savefig(OUT / '02-security-posture.png', dpi=150, bbox_inches='tight')
plt.close()

# ═══ Chart 3: Device Types (Invasive vs Non-invasive vs Semi-invasive) ═══
print("Chart 3: Device types...")
types = {}
for c in companies:
    t = c.get('type', 'unknown')
    types[t] = types.get(t, 0) + 1

type_labels = {
    'invasive': 'Invasive\n(implanted)',
    'non_invasive': 'Non-invasive\n(wearable)',
    'semi_invasive': 'Semi-invasive\n(endovascular)',
}
type_colors = {
    'invasive': WARN,
    'non_invasive': ACCENT,
    'semi_invasive': ACCENT3,
}

fig, ax = plt.subplots(figsize=(8, 5))
x = range(len(types))
bars = ax.bar(x, list(types.values()),
              color=[type_colors.get(k, '#64748b') for k in types.keys()],
              edgecolor='none', width=0.6)
ax.set_xticks(x)
ax.set_xticklabels([type_labels.get(k, k) for k in types.keys()])
ax.set_ylabel('Number of Companies')
ax.set_title('BCI Companies by Device Type', fontsize=14, fontweight='bold', pad=15)
for bar, val in zip(bars, types.values()):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.3,
            str(val), ha='center', fontsize=13, fontweight='bold', color='#e2e8f0')
ax.set_ylim(0, max(types.values()) + 3)
ax.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig(OUT / '03-device-types.png', dpi=150, bbox_inches='tight')
plt.close()

# ═══ Chart 4: TARA Attack Surface by Company (Top 12) ═══
print("Chart 4: Attack surface...")
attack_data = [(c['name'], len(c.get('tara_attack_surface', [])), c.get('type', 'unknown'))
               for c in companies]
attack_data = sorted(attack_data, key=lambda x: x[1], reverse=True)[:12]

fig, ax = plt.subplots(figsize=(10, 6))
names = [a[0] for a in attack_data]
counts = [a[1] for a in attack_data]
colors = [type_colors.get(a[2], '#64748b') for a in attack_data]
bars = ax.barh(range(len(names)), counts, color=colors, edgecolor='none', height=0.7)
ax.set_yticks(range(len(names)))
ax.set_yticklabels(names)
ax.invert_yaxis()
ax.set_xlabel('TARA Techniques Applicable')
ax.set_title('BCI Attack Surface by Company (TARA Techniques)', fontsize=14, fontweight='bold', pad=15)
for i, v in enumerate(counts):
    ax.text(v + 0.3, i, str(v), va='center', fontsize=10, color='#94a3b8')
# Legend
from matplotlib.patches import Patch
legend_elements = [
    Patch(facecolor=WARN, label='Invasive'),
    Patch(facecolor=ACCENT3, label='Semi-invasive'),
    Patch(facecolor=ACCENT, label='Non-invasive'),
]
ax.legend(handles=legend_elements, loc='lower right', fontsize=9,
          facecolor='#1e293b', edgecolor='#334155')
ax.grid(axis='x', alpha=0.3)
plt.tight_layout()
plt.savefig(OUT / '04-attack-surface.png', dpi=150, bbox_inches='tight')
plt.close()

# ═══ Chart 5: Regulatory Coverage Gap ═══
print("Chart 5: Regulatory gap...")
covered_props = ['Device safety', 'Software patching', 'Data confidentiality',
                 'Data integrity', 'Access control', 'Encryption',
                 'Audit logging', 'Consent']
gap_props = ['Neural signal\nauthenticity', 'Adversarial stimulation\nprevention',
             'Cognitive state\nintegrity', 'Neural\nre-identification',
             'Biological impact\nscoring', 'Consent violation\nseverity',
             'Reversibility\nassessment']

fig, ax = plt.subplots(figsize=(12, 5))
all_props = covered_props + gap_props
all_colors = [ACCENT2] * len(covered_props) + [WARN] * len(gap_props)
x = range(len(all_props))
bars = ax.bar(x, [1]*len(all_props), color=all_colors, edgecolor='none', width=0.8)
ax.set_xticks(x)
ax.set_xticklabels(all_props, rotation=45, ha='right', fontsize=8)
ax.set_yticks([])
ax.set_title('BCI Security Properties: Covered vs Unaddressed', fontsize=14, fontweight='bold', pad=15)

# Divider line
ax.axvline(x=len(covered_props) - 0.5, color='#e2e8f0', linestyle='--', alpha=0.5)
ax.text(len(covered_props)/2 - 0.5, 1.08, 'Covered by existing frameworks',
        ha='center', fontsize=10, color=ACCENT2, fontweight='bold')
ax.text(len(covered_props) + len(gap_props)/2 - 0.5, 1.08, 'NO framework addresses these',
        ha='center', fontsize=10, color=WARN, fontweight='bold')
ax.set_ylim(0, 1.2)

legend_elements = [
    Patch(facecolor=ACCENT2, label='Addressed by 1+ frameworks'),
    Patch(facecolor=WARN, label='Unaddressed (QIF only)'),
]
ax.legend(handles=legend_elements, loc='upper right', fontsize=9,
          facecolor='#1e293b', edgecolor='#334155')
plt.tight_layout()
plt.savefig(OUT / '05-regulatory-gap.png', dpi=150, bbox_inches='tight')
plt.close()

# ═══ Chart 6: Neurorights Legislation Timeline ═══
print("Chart 6: Regulatory timeline...")
events = [
    (2017, 'Ienca & Andorno\n4 Neurorights', 'academic'),
    (2019, 'OECD Neurotech\nPrinciples', 'international'),
    (2021, 'Chile Constitutional\nAmendment', 'legislation'),
    (2022, 'FDORA Sec 3305\n(Device Cyber)', 'legislation'),
    (2023, 'FDA Cyber\nGuidance', 'regulation'),
    (2024, 'Colorado HB\n24-1058', 'legislation'),
    (2025, 'CA SB 1223\n+ UNESCO', 'legislation'),
    (2026, 'QIF + LSL CVE\n(First BCI Vuln)', 'qif'),
]

fig, ax = plt.subplots(figsize=(12, 4))
years = [e[0] for e in events]
labels = [e[1] for e in events]
cats = [e[2] for e in events]

cat_colors = {
    'academic': '#8b5cf6',
    'international': '#06b6d4',
    'legislation': ACCENT3,
    'regulation': ACCENT,
    'qif': ACCENT2,
}

for i, (y, l, c) in enumerate(events):
    offset = 0.6 if i % 2 == 0 else -0.6
    ax.scatter(y, 0, s=120, color=cat_colors[c], zorder=5, edgecolors='white', linewidth=1)
    ax.annotate(l, (y, 0), textcoords='offset points',
                xytext=(0, 40 if offset > 0 else -50),
                ha='center', fontsize=8, color='#e2e8f0',
                arrowprops=dict(arrowstyle='->', color='#64748b', lw=0.8))

ax.axhline(y=0, color='#475569', linewidth=2)
ax.set_xlim(2016, 2027)
ax.set_ylim(-1.5, 1.5)
ax.set_yticks([])
ax.set_xticks(range(2017, 2027))
ax.set_title('Neurorights & BCI Security Regulatory Timeline', fontsize=14, fontweight='bold', pad=15)

legend_elements = [
    Patch(facecolor='#8b5cf6', label='Academic'),
    Patch(facecolor='#06b6d4', label='International'),
    Patch(facecolor=ACCENT3, label='Legislation'),
    Patch(facecolor=ACCENT, label='Regulation'),
    Patch(facecolor=ACCENT2, label='QIF / Industry'),
]
ax.legend(handles=legend_elements, loc='lower right', fontsize=8, ncol=5,
          facecolor='#1e293b', edgecolor='#334155')
plt.tight_layout()
plt.savefig(OUT / '06-regulatory-timeline.png', dpi=150, bbox_inches='tight')
plt.close()

# ═══ Chart 7: Total Industry Funding ═══
print("Chart 7: Total funding summary...")
total_funding = sum(c.get('funding_total_usd', 0) or 0 for c in companies)
invasive_funding = sum(c.get('funding_total_usd', 0) or 0 for c in companies if c.get('type') == 'invasive')
noninvasive_funding = sum(c.get('funding_total_usd', 0) or 0 for c in companies if c.get('type') == 'non_invasive')
semi_funding = sum(c.get('funding_total_usd', 0) or 0 for c in companies if c.get('type') == 'semi_invasive')
no_sec = sum(1 for c in companies if c.get('security_posture') == 'none_published')

fig, ax = plt.subplots(figsize=(8, 5))
categories = ['Total BCI\nFunding', 'Invasive\nDevices', 'Non-invasive\nDevices', 'Semi-invasive\nDevices']
values = [total_funding/1e9, invasive_funding/1e9, noninvasive_funding/1e9, semi_funding/1e9]
colors = ['#e2e8f0', WARN, ACCENT, ACCENT3]

bars = ax.bar(range(len(categories)), values, color=colors, edgecolor='none', width=0.6)
ax.set_xticks(range(len(categories)))
ax.set_xticklabels(categories)
ax.set_ylabel('Billions USD')
ax.set_title(f'${total_funding/1e9:.1f}B in BCI Funding.\n{no_sec} of {len(companies)} companies have NO public security documentation.',
             fontsize=13, fontweight='bold', pad=15, color=WARN)
for bar, val in zip(bars, values):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.03,
            f'${val:.1f}B', ha='center', fontsize=12, fontweight='bold', color='#e2e8f0')
ax.set_ylim(0, max(values) * 1.2)
ax.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig(OUT / '07-funding-summary.png', dpi=150, bbox_inches='tight')
plt.close()

print(f"\nDone. 7 charts saved to {OUT}/")
print(f"Total funding: ${total_funding/1e6:,.0f}M")
print(f"No security docs: {no_sec}/{len(companies)} companies ({no_sec/len(companies)*100:.0f}%)")
