#!/usr/bin/env python3
"""Inject real funding data into the interactive timeline HTML."""

import json
from pathlib import Path

DATA = Path(__file__).parent.parent / 'shared' / 'bci-landscape.json'
TEMPLATE = Path(__file__).parent.parent / 'docs' / 'charts' / 'business' / 'funding-timeline-interactive.html'

with open(DATA) as f:
    data = json.load(f)

rounds = data['market_data']['major_funding_rounds']
companies = data['companies']

cat_map = {c['name']: c.get('company_category', 'unknown') for c in companies}
type_map = {c['name']: c.get('type', 'unknown') for c in companies}

processed = []
for r in rounds:
    amt = r.get('amount_usd') or 0
    if amt <= 0:
        continue
    processed.append({
        'date': r['date'] + '-15',
        'company': r['company'],
        'amount': amt,
        'series': r['series'],
        'investors': r.get('all_investors', []),
        'leadInvestors': r.get('lead_investors', []),
        'category': cat_map.get(r['company'], 'unknown'),
        'deviceType': type_map.get(r['company'], 'unknown'),
        'note': r.get('note', ''),
    })

processed.sort(key=lambda x: x['date'])
payload = json.dumps(processed, indent=2)

html = TEMPLATE.read_text()
html = html.replace('FUNDING_DATA_PLACEHOLDER', payload)
TEMPLATE.write_text(html)

print(f"Injected {len(processed)} rounds into interactive timeline")
print(f"File: {TEMPLATE.resolve()}")
