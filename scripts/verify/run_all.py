#!/usr/bin/env python3
"""
Orchestrator — runs all verification modules and produces a unified report.

Usage:
  python3 scripts/verify/run_all.py [--ci] [--changed-only file1 file2 ...]
  --ci: Write verify-report.json artifact
  --changed-only: Only run modules relevant to the listed files
"""

import json
import sys
import os
from pathlib import Path

# Ensure scripts/verify is on the path
sys.path.insert(0, str(Path(__file__).parent))

from utils import REPO_ROOT, print_report

import verify_citations
import verify_facts
import audit_blog_claims
import verify_crossrefs
import fact_check_field_journal

MODULES = [
    ('Citations', verify_citations, ['paper/', '.bib']),
    ('Facts', verify_facts, ['shared/qtara-registrar.json', 'whitepaper-stats']),
    ('Blog Claims', audit_blog_claims, ['blogs/']),
    ('Cross-References', verify_crossrefs, ['src/', 'qif-framework/', 'README']),
    ('Field Journal Fact-Check', fact_check_field_journal, ['blogs/', 'qif-framework/QIF-FIELD-JOURNAL']),
]


def should_run(module_triggers: list[str], changed_files: list[str] | None) -> bool:
    """Check if module should run based on changed files."""
    if changed_files is None:
        return True
    return any(
        any(trigger in f for trigger in module_triggers)
        for f in changed_files
    )


def main():
    ci_mode = '--ci' in sys.argv
    changed_only = None

    if '--changed-only' in sys.argv:
        idx = sys.argv.index('--changed-only')
        changed_only = sys.argv[idx + 1:]

    results = {}
    total_errors = 0
    total_warnings = 0

    print('\n╔══════════════════════════════════════════════════════════╗')
    print('║         Citation & Fact Verification Pipeline           ║')
    print('╚══════════════════════════════════════════════════════════╝')

    for name, module, triggers in MODULES:
        if not should_run(triggers, changed_only):
            print(f'\n  ⊘ {name}: skipped (no relevant changes)')
            continue

        result = module.run()
        results[name] = result
        total_errors += result['errors']
        total_warnings += result['warnings']
        print_report(name, result)

    # Summary
    print(f'\n{"─" * 60}')
    status = '✗ FAIL' if total_errors else ('⚠ WARNINGS' if total_warnings else '✓ ALL PASSED')
    print(f'  TOTAL: {status}  ({total_errors} errors, {total_warnings} warnings)')
    print(f'{"─" * 60}\n')

    if ci_mode:
        report_path = REPO_ROOT / 'verify-report.json'
        report = {
            'status': 'fail' if total_errors else 'pass',
            'errors': total_errors,
            'warnings': total_warnings,
            'modules': {
                name: {
                    'errors': r['errors'],
                    'warnings': r['warnings'],
                    'details': r['details'],
                }
                for name, r in results.items()
            },
        }
        report_path.write_text(json.dumps(report, indent=2))
        print(f'  Report written to {report_path.relative_to(REPO_ROOT)}')

    return 1 if total_errors else 0


if __name__ == '__main__':
    sys.exit(main())
