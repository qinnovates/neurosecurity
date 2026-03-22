#!/usr/bin/env python3
"""
Generate BCI Industry Cumulative Valuation chart for Q1 2026 Intelligence Report.
Reads from datalake/bci-landscape.json, outputs PNG to docs/images/.
"""

import json
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
LANDSCAPE_PATH = os.path.join(PROJECT_ROOT, 'shared', 'bci-landscape.json')
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'docs', 'images')
OUTPUT_PATH = os.path.join(OUTPUT_DIR, 'bci-valuation-q1-2026.png')
PUBLIC_DIR = os.path.join(PROJECT_ROOT, 'public', 'images')
PUBLIC_PATH = os.path.join(PUBLIC_DIR, 'bci-valuation-q1-2026.png')

# Load data
with open(LANDSCAPE_PATH) as f:
    data = json.load(f)

# Extract companies with known valuations
valuations = []
for company in data['companies']:
    val = company.get('valuation_usd')
    if val and val > 0:
        valuations.append({
            'name': company['name'],
            'valuation': val / 1e9,  # Convert to billions
            'type': company.get('type', 'unknown'),
            'funding': (company.get('funding_total_usd') or 0) / 1e9
        })

# Sort by valuation descending
valuations.sort(key=lambda x: x['valuation'], reverse=True)

# Also get top funded companies without valuations for a secondary view
funded = []
for company in data['companies']:
    funding = company.get('funding_total_usd')
    if funding and funding > 0:
        funded.append({
            'name': company['name'],
            'funding': funding / 1e9,
            'type': company.get('type', 'unknown'),
            'valuation': (company.get('valuation_usd') or 0) / 1e9
        })
funded.sort(key=lambda x: x['funding'], reverse=True)

# Color map by device type
TYPE_COLORS = {
    'invasive': '#dc2626',       # red
    'semi_invasive': '#f59e0b',  # amber
    'non_invasive': '#3b82f6',   # blue
    'unknown': '#6b7280',        # gray
}

# ─── Figure: Two charts side by side ─────────────────────────────────────────

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(18, 8))
fig.patch.set_facecolor('#0f172a')

# ─── Chart 1: Valuation Treemap-style horizontal bar ─────────────────────────

names = [v['name'] for v in valuations]
vals = [v['valuation'] for v in valuations]
colors = [TYPE_COLORS.get(v['type'], '#6b7280') for v in valuations]

bars = ax1.barh(range(len(names)), vals, color=colors, edgecolor='#1e293b', linewidth=0.5)
ax1.set_yticks(range(len(names)))
ax1.set_yticklabels(names, fontsize=11, color='white', fontweight='bold')
ax1.invert_yaxis()
ax1.set_xlabel('Valuation (USD Billions)', fontsize=12, color='white')
ax1.set_title('BCI Industry — Disclosed Valuations', fontsize=14, color='white', fontweight='bold', pad=15)
ax1.set_facecolor('#1e293b')
ax1.tick_params(colors='white')
ax1.spines['top'].set_visible(False)
ax1.spines['right'].set_visible(False)
ax1.spines['bottom'].set_color('#475569')
ax1.spines['left'].set_color('#475569')
ax1.xaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f'${x:.1f}B'))

# Add value labels
for bar, val in zip(bars, vals):
    ax1.text(bar.get_width() + 0.1, bar.get_y() + bar.get_height()/2,
             f'${val:.1f}B', va='center', ha='left', fontsize=10, color='white')

# Total annotation
total_val = sum(vals)
ax1.text(0.98, 0.02, f'Total Disclosed: ${total_val:.1f}B',
         transform=ax1.transAxes, fontsize=13, color='#22d3ee',
         fontweight='bold', ha='right', va='bottom',
         bbox=dict(boxstyle='round,pad=0.4', facecolor='#0f172a', edgecolor='#22d3ee', alpha=0.9))

# ─── Chart 2: Top 15 by Funding ─────────────────────────────────────────────

top_funded = funded[:15]
names2 = [f['name'] for f in top_funded]
funds = [f['funding'] for f in top_funded]
colors2 = [TYPE_COLORS.get(f['type'], '#6b7280') for f in top_funded]

bars2 = ax2.barh(range(len(names2)), funds, color=colors2, edgecolor='#1e293b', linewidth=0.5)
ax2.set_yticks(range(len(names2)))
ax2.set_yticklabels(names2, fontsize=10, color='white', fontweight='bold')
ax2.invert_yaxis()
ax2.set_xlabel('Total Funding Raised (USD Billions)', fontsize=12, color='white')
ax2.set_title('BCI Industry — Top 15 by Funding', fontsize=14, color='white', fontweight='bold', pad=15)
ax2.set_facecolor('#1e293b')
ax2.tick_params(colors='white')
ax2.spines['top'].set_visible(False)
ax2.spines['right'].set_visible(False)
ax2.spines['bottom'].set_color('#475569')
ax2.spines['left'].set_color('#475569')
ax2.xaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f'${x:.2f}B'))

# Add value labels
for bar, val in zip(bars2, funds):
    label = f'${val*1000:.0f}M' if val < 1 else f'${val:.2f}B'
    ax2.text(bar.get_width() + 0.01, bar.get_y() + bar.get_height()/2,
             label, va='center', ha='left', fontsize=9, color='white')

# Total funding annotation
total_fund = sum(f['funding'] for f in funded)
ax2.text(0.98, 0.02, f'Total Tracked Funding: ${total_fund:.2f}B',
         transform=ax2.transAxes, fontsize=13, color='#22d3ee',
         fontweight='bold', ha='right', va='bottom',
         bbox=dict(boxstyle='round,pad=0.4', facecolor='#0f172a', edgecolor='#22d3ee', alpha=0.9))

# ─── Legend ──────────────────────────────────────────────────────────────────

from matplotlib.patches import Patch
legend_elements = [
    Patch(facecolor='#dc2626', label='Invasive'),
    Patch(facecolor='#f59e0b', label='Semi-invasive'),
    Patch(facecolor='#3b82f6', label='Non-invasive'),
]
fig.legend(handles=legend_elements, loc='lower center', ncol=3,
           fontsize=11, frameon=False, labelcolor='white',
           bbox_to_anchor=(0.5, -0.02))

fig.suptitle('Q1 2026 BCI Intelligence Report — Industry Capital Overview',
             fontsize=16, color='white', fontweight='bold', y=0.98)

plt.tight_layout(rect=[0, 0.03, 1, 0.95])

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)
plt.savefig(OUTPUT_PATH, dpi=150, bbox_inches='tight', facecolor=fig.get_facecolor())
plt.savefig(PUBLIC_PATH, dpi=150, bbox_inches='tight', facecolor=fig.get_facecolor())
print(f'Chart saved to {OUTPUT_PATH}')
print(f'Chart saved to {PUBLIC_PATH}')
print(f'Companies with disclosed valuations: {len(valuations)}')
print(f'Total disclosed valuation: ${total_val:.1f}B')
print(f'Companies with disclosed funding: {len(funded)}')
print(f'Total tracked funding: ${total_fund:.2f}B')
