#!/usr/bin/env python3
"""
Cross-reference consistency checker.
Validates DOI usage, QIF version consistency, and glossary sync.

Usage:
  python3 scripts/verify/verify_crossrefs.py
"""

import re
import sys
from pathlib import Path

from utils import REPO_ROOT, make_result, print_report

# Version-specific DOIs that should NOT appear in public-facing files
VERSION_DOIS = [
    '10.5281/zenodo.18640106',   # v1.0
    '10.5281/zenodo.18653372',   # v1.2
    '10.5281/zenodo.18654573',   # v1.3
]

ALL_VERSIONS_DOI = '10.5281/zenodo.18640105'

# Files to check for version-specific DOIs
PUBLIC_FILE_GLOBS = [
    'src/**/*.ts',
    'src/**/*.tsx',
    'src/**/*.astro',
    'README.md',
]

QIF_CONSTANTS = REPO_ROOT / 'src' / 'lib' / 'qif-constants.ts'
QIF_TRUTH = REPO_ROOT / 'qif-framework' / 'QIF-TRUTH.md'
GLOSSARY = REPO_ROOT / 'src' / 'lib' / 'glossary-constants.ts'
WHITEPAPER_MD = REPO_ROOT / 'qif-framework' / 'QIF-WHITEPAPER.md'


def check_version_dois() -> list[dict]:
    """Check that version-specific DOIs don't appear in public files."""
    details = []

    for glob_pattern in PUBLIC_FILE_GLOBS:
        for path in REPO_ROOT.glob(glob_pattern):
            text = path.read_text()
            rel = path.relative_to(REPO_ROOT)

            for doi in VERSION_DOIS:
                if doi in text:
                    details.append({
                        'level': 'error',
                        'message': (
                            f'[{rel}] Contains version-specific DOI {doi}. '
                            f'Use all-versions DOI {ALL_VERSIONS_DOI} instead.'
                        ),
                    })

    if not details:
        details.append({
            'level': 'info',
            'message': 'No version-specific DOIs found in public files',
        })

    return details


def check_qif_version() -> list[dict]:
    """Check QIF version consistency across files."""
    details = []

    if not QIF_CONSTANTS.exists():
        details.append({
            'level': 'warning',
            'message': 'qif-constants.ts not found',
        })
        return details

    constants_text = QIF_CONSTANTS.read_text()
    version_match = re.search(r"QIF_VERSION\s*=\s*['\"]([^'\"]+)['\"]", constants_text)
    if not version_match:
        details.append({
            'level': 'warning',
            'message': 'Could not extract QIF_VERSION from qif-constants.ts',
        })
        return details

    canonical_version = version_match.group(1)
    details.append({
        'level': 'info',
        'message': f'QIF_VERSION in constants: {canonical_version}',
    })

    # Check whitepaper header
    if WHITEPAPER_MD.exists():
        wp_text = WHITEPAPER_MD.read_text()
        if canonical_version not in wp_text:
            details.append({
                'level': 'warning',
                'message': f'QIF-WHITEPAPER.md does not contain version {canonical_version}',
            })

    return details


def check_glossary_sync() -> list[dict]:
    """Check that QIF-TRUTH.md terms have glossary entries."""
    details = []

    if not QIF_TRUTH.exists() or not GLOSSARY.exists():
        if not QIF_TRUTH.exists():
            details.append({'level': 'warning', 'message': 'QIF-TRUTH.md not found'})
        if not GLOSSARY.exists():
            details.append({'level': 'warning', 'message': 'glossary-constants.ts not found'})
        return details

    truth_text = QIF_TRUTH.read_text()
    glossary_text = GLOSSARY.read_text()

    # Extract defined terms from QIF-TRUTH.md (Entry headers)
    entry_pattern = r'###\s+Entry\s+\d+[:\s]+(.+?)(?:\s*\(|$)'
    truth_terms = []
    for match in re.finditer(entry_pattern, truth_text, re.MULTILINE):
        term = match.group(1).strip().rstrip(')')
        truth_terms.append(term)

    # Extract glossary term IDs
    glossary_ids = set(re.findall(r"term:\s*['\"]([^'\"]+)['\"]", glossary_text))

    missing = []
    for term in truth_terms:
        # Check if term (or close variant) exists in glossary
        normalized = term.lower().replace(' ', '').replace('-', '')
        found = any(
            normalized in gid.lower().replace(' ', '').replace('-', '')
            or gid.lower().replace(' ', '').replace('-', '') in normalized
            for gid in glossary_ids
        )
        if not found:
            # Also check if the term text appears anywhere in glossary
            if term.lower() not in glossary_text.lower():
                missing.append(term)

    if missing:
        for term in missing[:10]:  # Cap at 10 to avoid noise
            details.append({
                'level': 'warning',
                'message': f'QIF-TRUTH entry "{term}" may be missing from glossary-constants.ts',
            })
    else:
        details.append({
            'level': 'info',
            'message': f'All {len(truth_terms)} QIF-TRUTH entries found in glossary',
        })

    return details


def run() -> dict:
    """Run all cross-reference checks."""
    details = []

    details.extend(check_version_dois())
    details.extend(check_qif_version())
    details.extend(check_glossary_sync())

    errors = sum(1 for d in details if d['level'] == 'error')
    warnings = sum(1 for d in details if d['level'] == 'warning')

    return make_result(errors, warnings, details)


def main():
    result = run()
    print_report('Cross-Reference Consistency', result)
    return 1 if result['errors'] else 0


if __name__ == '__main__':
    sys.exit(main())
