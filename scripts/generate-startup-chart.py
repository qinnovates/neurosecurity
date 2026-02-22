#!/usr/bin/env python3
"""Generate startup funding chart with investors from bci-landscape.json."""

import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import textwrap
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
rounds = data.get('market_data', {}).get('major_funding_rounds', [])

# Build investor map from funding rounds
company_investors = {}
for r in rounds:
    name = r.get('company', '')
    leads = r.get('lead_investors', [])
    all_inv = r.get('all_investors', [])
    if name not in company_investors:
        company_investors[name] = set()
    company_investors[name].update(leads)
    company_investors[name].update(all_inv)

# Filter startups (company_category == 'startup') with funding > 0
startups = []
for c in companies:
    if c.get('company_category') == 'startup':
        funding = c.get('funding_total_usd', 0) or 0
        name = c['name']
        investors = company_investors.get(name, set())
        startups.append({
            'name': name,
            'funding': funding,
            'founded': c.get('founded', '?'),
            'type': c.get('type', 'unknown'),
            'investors': sorted(investors) if investors else ['Undisclosed'],
        })

# Sort by funding descending
startups = sorted(startups, key=lambda x: x['funding'], reverse=True)

# Filter out zero-funding
startups_funded = [s for s in startups if s['funding'] > 0]
total_startup_funding = sum(s['funding'] for s in startups_funded)

# Build chart
fig, ax = plt.subplots(figsize=(14, max(7, len(startups_funded) * 1.2)))

names = [s['name'] for s in startups_funded]
amounts = [s['funding'] / 1e6 for s in startups_funded]

# Color by device type
type_colors = {
    'invasive': WARN,
    'non_invasive': ACCENT,
    'semi_invasive': ACCENT3,
}
colors = [type_colors.get(s['type'], '#64748b') for s in startups_funded]

bars = ax.barh(range(len(names)), amounts, color=colors, edgecolor='none', height=0.6)
ax.set_yticks(range(len(names)))
ax.set_yticklabels(names, fontsize=12, fontweight='bold')
ax.invert_yaxis()
ax.set_xlabel('Total Funding (USD Millions)', fontsize=12)

ax.set_title(
    f'BCI Startups: ${total_startup_funding/1e6:,.0f}M Total Raised',
    fontsize=16, fontweight='bold', pad=20
)

# Add funding amount + investor list to the right of each bar
max_amount = max(amounts) if amounts else 1
for i, s in enumerate(startups_funded):
    amount_str = f'${s["funding"]/1e6:,.1f}M'
    inv_list = s['investors']
    # Show top 3 investors, truncate if more
    if len(inv_list) > 3:
        inv_str = ', '.join(inv_list[:3]) + f' +{len(inv_list)-3} more'
    else:
        inv_str = ', '.join(inv_list)

    label = f'{amount_str}  |  {inv_str}'
    ax.text(amounts[i] + max_amount * 0.02, i, label,
            va='center', fontsize=9, color='#94a3b8')

# Add founded year to the left inside the bar
for i, s in enumerate(startups_funded):
    if amounts[i] > max_amount * 0.15:
        ax.text(amounts[i] * 0.02, i, f"Est. {s['founded']}",
                va='center', fontsize=8, color='#0f172a', fontweight='bold')

ax.set_xlim(0, max_amount * 2.8)  # extra room for investor text
ax.grid(axis='x', alpha=0.3)

# Legend
from matplotlib.patches import Patch
legend_elements = [
    Patch(facecolor=WARN, label='Invasive'),
    Patch(facecolor=ACCENT3, label='Semi-invasive'),
    Patch(facecolor=ACCENT, label='Non-invasive'),
]
ax.legend(handles=legend_elements, loc='lower right', fontsize=9,
          facecolor='#1e293b', edgecolor='#334155')

# Subtitle
fig.text(0.5, 0.01,
         f'{len(startups_funded)} funded startups  |  {len(startups)} total startups tracked  |  Source: QIF BCI Landscape v2.0',
         ha='center', fontsize=9, color='#64748b')

plt.tight_layout(rect=[0, 0.03, 1, 1])
plt.savefig(OUT / '08-startup-funding.png', dpi=150, bbox_inches='tight')
plt.close()

print(f"Chart saved to {OUT / '08-startup-funding.png'}")
print(f"Startups: {len(startups_funded)} funded, {len(startups)} total")
print(f"Total startup funding: ${total_startup_funding/1e6:,.1f}M")
for s in startups_funded:
    inv = ', '.join(s['investors'][:3])
    print(f"  {s['name']}: ${s['funding']/1e6:,.1f}M ({inv})")
