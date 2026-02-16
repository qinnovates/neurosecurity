#!/usr/bin/env python3
"""
BibTeX citation verification — resolves DOIs, URLs, and arXiv eprints.
Checks each entry for verification status, dead links, and metadata mismatches.

Usage:
  python3 scripts/verify/verify_citations.py [--verify]
  --verify: Auto-add 'note = {Verified ...}' to entries that resolve successfully
"""

import re
import sys
from datetime import date
from pathlib import Path

from utils import (
    REPO_ROOT, parse_bibtex, resolve_doi, resolve_arxiv, check_url,
    titles_match, make_result, print_report,
)

BIB_FILES = [
    REPO_ROOT / 'paper' / 'references.bib',
    REPO_ROOT / 'paper' / 'woot26' / 'references.bib',
]


def verify_entry(entry: dict) -> list[dict]:
    """Verify a single BibTeX entry. Returns list of detail dicts."""
    details = []
    key = entry['key']

    # Check for verification note
    note = entry.get('note', '')
    has_verified = bool(re.search(r'[Vv]erified\s+\d{4}', note))
    if not has_verified:
        details.append({
            'level': 'warning',
            'message': f'[{key}] Missing verification timestamp in note field',
        })

    # Check for empty/unknown author
    author = entry.get('author', '')
    if not author or author.lower() in ('unknown', '{unknown}'):
        details.append({
            'level': 'warning',
            'message': f'[{key}] Author is empty or "Unknown"',
        })

    # DOI resolution
    doi = entry.get('doi', '')
    if doi:
        result = resolve_doi(doi)
        if result and result.get('status') == 'ok':
            bib_title = entry.get('title', '')
            crossref_title = result.get('title', '')
            if bib_title and crossref_title and not titles_match(bib_title, crossref_title):
                details.append({
                    'level': 'warning',
                    'message': f'[{key}] Title mismatch — BibTeX: "{bib_title[:60]}..." vs Crossref: "{crossref_title[:60]}..."',
                })
        elif result and result.get('status') == 'error':
            details.append({
                'level': 'error',
                'message': f'[{key}] DOI {doi} failed to resolve: {result.get("error", "unknown")}',
            })

    # arXiv eprint resolution
    eprint = entry.get('eprint', '')
    if eprint:
        result = resolve_arxiv(eprint)
        if result and result.get('status') == 'error':
            details.append({
                'level': 'error',
                'message': f'[{key}] arXiv eprint {eprint} not found',
            })

    # URL check (only if no DOI — DOI already validates the resource)
    url = entry.get('url', '')
    if url and not doi:
        result = check_url(url)
        if result.get('status') == 'error':
            details.append({
                'level': 'error',
                'message': f'[{key}] URL unreachable: {url} ({result.get("error", "")})',
            })

    return details


def add_verification_notes(bib_path: Path, entries: list[dict]):
    """Add verification timestamps to entries that resolved successfully."""
    text = bib_path.read_text()
    today = date.today().isoformat()
    modified = False

    for entry in entries:
        key = entry['key']
        note = entry.get('note', '')
        if re.search(r'[Vv]erified\s+\d{4}', note):
            continue

        # Only mark verified if DOI or URL resolved
        doi = entry.get('doi', '')
        if doi:
            result = resolve_doi(doi)
            if not result or result.get('status') != 'ok':
                continue
            source = 'Crossref API'
        elif entry.get('url', ''):
            result = check_url(entry['url'])
            if not result or result.get('status') != 'ok':
                continue
            source = 'URL check'
        else:
            continue

        # Add note field
        verify_note = f'Verified {today} via {source}'
        if note:
            new_note = f'{note}. {verify_note}'
        else:
            new_note = verify_note

        # Find entry in text and add/update note
        # Look for the closing } of this entry
        entry_pattern = rf'(@\w+\{{{re.escape(key)},.*?)\n\}}'
        match = re.search(entry_pattern, text, re.DOTALL)
        if match:
            entry_text = match.group(1)
            if 'note' in entry:
                # Update existing note
                old_note_pattern = r'note\s*=\s*\{[^}]*\}'
                entry_text = re.sub(old_note_pattern, f'note = {{{new_note}}}', entry_text)
            else:
                # Add note before closing
                entry_text = entry_text.rstrip() + f',\n  note = {{{new_note}}}'
            text = text[:match.start()] + entry_text + '\n}' + text[match.end():]
            modified = True

    if modified:
        bib_path.write_text(text)
        print(f'  Updated {bib_path.name} with verification timestamps')


def run(auto_verify: bool = False) -> dict:
    """Run citation verification on all BibTeX files."""
    all_details = []

    for bib_path in BIB_FILES:
        if not bib_path.exists():
            all_details.append({
                'level': 'warning',
                'message': f'BibTeX file not found: {bib_path.relative_to(REPO_ROOT)}',
            })
            continue

        text = bib_path.read_text()
        entries = parse_bibtex(text)
        rel_path = bib_path.relative_to(REPO_ROOT)

        all_details.append({
            'level': 'info',
            'message': f'Scanning {rel_path} ({len(entries)} entries)',
        })

        for entry in entries:
            details = verify_entry(entry)
            for d in details:
                d['file'] = str(rel_path)
            all_details.extend(details)

        if auto_verify:
            add_verification_notes(bib_path, entries)

    errors = sum(1 for d in all_details if d['level'] == 'error')
    warnings = sum(1 for d in all_details if d['level'] == 'warning')

    return make_result(errors, warnings, all_details)


def main():
    auto_verify = '--verify' in sys.argv
    result = run(auto_verify=auto_verify)
    print_report('Citation Verification', result)
    return 1 if result['errors'] else 0


if __name__ == '__main__':
    sys.exit(main())
