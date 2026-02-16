#!/usr/bin/env python3
"""
Fact consistency checker — validates hardcoded stats against source data.
Reads shared/qtara-registrar.json as source of truth.

Usage:
  python3 scripts/verify/verify_facts.py
"""

import json
import re
import sys
from pathlib import Path

from utils import REPO_ROOT, make_result, print_report

REGISTRY_PATH = REPO_ROOT / 'shared' / 'qtara-registrar.json'
STATS_TS_PATH = REPO_ROOT / 'src' / 'lib' / 'whitepaper-stats.ts'


def run() -> dict:
    """Run fact consistency checks."""
    details = []

    if not REGISTRY_PATH.exists():
        details.append({
            'level': 'error',
            'message': f'Registry file not found: {REGISTRY_PATH.relative_to(REPO_ROOT)}',
        })
        return make_result(1, 0, details)

    registry = json.loads(REGISTRY_PATH.read_text())
    stats = registry.get('statistics', {})

    # ── Check 1: total_techniques consistency ──
    total = stats.get('total_techniques', 0)
    techniques = registry.get('techniques', [])
    actual_count = len(techniques) if techniques else total

    if techniques and actual_count != total:
        details.append({
            'level': 'error',
            'message': f'total_techniques ({total}) != len(techniques) ({actual_count})',
        })
    else:
        details.append({
            'level': 'info',
            'message': f'total_techniques: {total} (consistent)',
        })

    # ── Check 2: by_tactic sum ──
    by_tactic = stats.get('by_tactic', {})
    tactic_sum = sum(by_tactic.values())
    # Note: techniques can belong to multiple tactics, so sum may exceed total
    # But it should be >= total
    if tactic_sum < total:
        details.append({
            'level': 'warning',
            'message': f'by_tactic sum ({tactic_sum}) < total_techniques ({total})',
        })
    else:
        details.append({
            'level': 'info',
            'message': f'by_tactic sum: {tactic_sum} (>= total: {total})',
        })

    # ── Check 3: by_status sum ──
    by_status = stats.get('by_status', {})
    status_sum = sum(by_status.values())
    if status_sum != total:
        details.append({
            'level': 'error',
            'message': f'by_status sum ({status_sum}) != total_techniques ({total})',
        })
    else:
        details.append({
            'level': 'info',
            'message': f'by_status sum: {status_sum} (matches total)',
        })

    # ── Check 4: NISS gap percentage ──
    niss_mapping = stats.get('niss_cvss_mapping', {})
    gap_groups = niss_mapping.get('by_gap_group', {})

    # Techniques with gap_group >= 2 have metrics CVSS cannot express
    gap_count = sum(v for k, v in gap_groups.items() if int(k) >= 2)
    if total > 0:
        computed_gap_pct = round(gap_count / total * 100, 1)
    else:
        computed_gap_pct = 0.0

    # Check if whitepaper-stats.ts has a hardcoded value
    if STATS_TS_PATH.exists():
        ts_text = STATS_TS_PATH.read_text()
        hardcoded_match = re.search(r'nissGapPercentage:\s*([\d.]+)', ts_text)
        if hardcoded_match:
            hardcoded_val = float(hardcoded_match.group(1))
            if abs(hardcoded_val - computed_gap_pct) > 0.5:
                details.append({
                    'level': 'error',
                    'message': (
                        f'NISS gap percentage mismatch: '
                        f'whitepaper-stats.ts has {hardcoded_val}% but '
                        f'registry computes to {computed_gap_pct}% '
                        f'({gap_count}/{total} techniques with gap_group >= 2)'
                    ),
                })
            else:
                details.append({
                    'level': 'info',
                    'message': f'NISS gap percentage: {computed_gap_pct}% (consistent)',
                })
        else:
            details.append({
                'level': 'info',
                'message': f'NISS gap percentage computed dynamically: {computed_gap_pct}%',
            })
    else:
        details.append({
            'level': 'warning',
            'message': 'whitepaper-stats.ts not found — cannot check NISS gap percentage',
        })

    # ── Check 5: by_severity sum ──
    by_severity = stats.get('by_severity', {})
    severity_sum = sum(by_severity.values())
    if severity_sum != total:
        details.append({
            'level': 'error',
            'message': f'by_severity sum ({severity_sum}) != total_techniques ({total})',
        })
    else:
        details.append({
            'level': 'info',
            'message': f'by_severity sum: {severity_sum} (matches total)',
        })

    errors = sum(1 for d in details if d['level'] == 'error')
    warnings = sum(1 for d in details if d['level'] == 'warning')

    return make_result(errors, warnings, details)


def main():
    result = run()
    print_report('Fact Consistency', result)
    return 1 if result['errors'] else 0


if __name__ == '__main__':
    sys.exit(main())
