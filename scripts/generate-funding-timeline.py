#!/usr/bin/env python3
"""Generate logarithmic cumulative funding timeline for BCI industry."""

import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np
from datetime import datetime
from pathlib import Path
from collections import defaultdict

DATA = Path(__file__).parent.parent / 'shared' / 'bci-landscape.json'
OUT = Path(__file__).parent.parent / 'docs' / 'charts' / 'business'
OUT.mkdir(parents=True, exist_ok=True)

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

rounds = data['market_data']['major_funding_rounds']
companies = data['companies']

# Build company category map
cat_map = {c['name']: c.get('company_category', 'unknown') for c in companies}
type_map = {c['name']: c.get('type', 'unknown') for c in companies}

# Parse dates, filter out zero amounts
events = []
for r in rounds:
    amt = r.get('amount_usd') or 0
    if amt <= 0:
        continue
    date_str = r['date']
    # Parse YYYY-MM format
    try:
        dt = datetime.strptime(date_str, '%Y-%m')
    except ValueError:
        dt = datetime.strptime(date_str + '-01', '%Y-%m-%d')
    events.append({
        'date': dt,
        'company': r['company'],
        'amount': amt,
        'series': r['series'],
        'category': cat_map.get(r['company'], 'unknown'),
        'type': type_map.get(r['company'], 'unknown'),
    })

events.sort(key=lambda x: x['date'])

# ── Chart: Cumulative funding over time (log scale), per-company lines ──

# Group by company, compute cumulative
company_timelines = defaultdict(list)
for e in events:
    company_timelines[e['company']].append(e)

# Top companies by total funding
company_totals = {name: sum(e['amount'] for e in evts) for name, evts in company_timelines.items()}
top_companies = sorted(company_totals, key=company_totals.get, reverse=True)[:10]

# Color palette
palette = [
    WARN,       # Neuralink (red, invasive)
    '#06b6d4',  # Synchron (cyan)
    ACCENT,     # BrainCo (blue)
    '#8b5cf6',  # MindMaze (purple)
    ACCENT2,    # Precision (green)
    ACCENT3,    # Merge Labs (amber)
    '#ec4899',  # Kernel (pink)
    '#f97316',  # Paradromics (orange)
    '#14b8a6',  # INBRAIN (teal)
    '#a78bfa',  # Blackrock (light purple)
]

fig, ax = plt.subplots(figsize=(14, 7))

for i, company in enumerate(top_companies):
    evts = sorted(company_timelines[company], key=lambda x: x['date'])
    dates = []
    cumulative = []
    running = 0
    for e in evts:
        running += e['amount']
        dates.append(e['date'])
        cumulative.append(running / 1e6)  # to millions

    color = palette[i % len(palette)]
    ax.plot(dates, cumulative, '-o', color=color, linewidth=2, markersize=5,
            label=company, zorder=3)

    # Label the endpoint
    ax.annotate(f'{company}\n${cumulative[-1]:,.0f}M',
                xy=(dates[-1], cumulative[-1]),
                xytext=(8, 0), textcoords='offset points',
                fontsize=8, color=color, fontweight='bold',
                va='center')

    # Annotate big rounds (>$100M)
    for j, e in enumerate(evts):
        if e['amount'] >= 100_000_000:
            ax.annotate(f"{e['series']}\n${e['amount']/1e6:.0f}M",
                        xy=(e['date'], cumulative[j]),
                        xytext=(0, 15), textcoords='offset points',
                        fontsize=7, color='#94a3b8', ha='center',
                        arrowprops=dict(arrowstyle='->', color='#475569', lw=0.5))

ax.set_yscale('log')
ax.set_ylabel('Cumulative Funding (USD Millions, log scale)', fontsize=12)
ax.set_xlabel('')

# Format x-axis
ax.xaxis.set_major_locator(mdates.YearLocator())
ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y'))
plt.xticks(rotation=0)

# Y-axis formatting
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'${x:,.0f}M'))

# Add industry total
total = sum(e['amount'] for e in events)
ax.set_title(
    f'BCI Industry Funding Timeline: ${total/1e9:.1f}B Cumulative',
    fontsize=16, fontweight='bold', pad=20
)

ax.grid(True, alpha=0.3, which='both')
ax.set_xlim(datetime(2012, 6, 1), datetime(2026, 8, 1))

# Add annotation for the inflection
ax.axvline(x=datetime(2023, 1, 1), color='#475569', linestyle='--', alpha=0.4)
ax.text(datetime(2023, 1, 1), ax.get_ylim()[0] * 2, '  2023: BCI race begins',
        fontsize=9, color='#64748b', va='bottom')

fig.text(0.5, 0.01,
         f'{len(events)} funding rounds  |  {len(company_timelines)} companies  |  Source: QIF BCI Landscape v2.0',
         ha='center', fontsize=9, color='#64748b')

plt.tight_layout(rect=[0, 0.03, 0.88, 1])  # room for right labels
plt.savefig(OUT / '09-funding-timeline-log.png', dpi=150, bbox_inches='tight')
plt.close()

print(f"Chart saved to {OUT / '09-funding-timeline-log.png'}")
print(f"Total: ${total/1e6:,.0f}M across {len(events)} rounds, {len(company_timelines)} companies")
