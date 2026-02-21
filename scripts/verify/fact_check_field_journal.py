#!/usr/bin/env python3
"""
Field journal blog post fact-checker.
Validates links, DOIs, arXiv refs, and flags unsourced claims.

Usage:
  python3 scripts/verify/fact_check_field_journal.py           # Advisory scan of all #FieldJournal posts
  python3 scripts/verify/fact_check_field_journal.py --inject   # Scan + write fact_check metadata to frontmatter
  python3 scripts/verify/fact_check_field_journal.py --inject --posts file1.md file2.md  # Specific posts only
"""

import re
import sys
import json
from datetime import date
from pathlib import Path

from utils import (
    REPO_ROOT,
    make_result,
    print_report,
    resolve_doi,
    resolve_arxiv,
    check_url,
    cache_get,
    cache_set,
    USER_AGENT,
    _rate_limit,
)

import urllib.request
import urllib.error

BLOGS_DIR = REPO_ROOT / 'blogs'

# ── Patterns ──

DOI_PATTERN = re.compile(r'(?:doi:\s*|https?://doi\.org/)(10\.\d{4,}/[^\s\)>\]]+)', re.IGNORECASE)
ARXIV_PATTERN = re.compile(r'(?:arXiv:\s*|https?://arxiv\.org/abs/)(\d{4}\.\d{4,}(?:v\d+)?)', re.IGNORECASE)
URL_PATTERN = re.compile(r'https?://[^\s\)\]>"]+')
NAMED_CITATION_PATTERN = re.compile(
    r'(?:^|[\s(])'
    r'([A-Z][a-z]+(?:\s(?:&|and)\s[A-Z][a-z]+)?'
    r'(?:\s(?:et\s+al\.?))?)'
    r'[,\s]+(\d{4})',
)
STANDARDS_PATTERN = re.compile(
    r'\b(IEC\s*\d+|FDA\s+\d+|NIST\s+SP[\s-]?\d+|IEEE\s+\d+|ISO\s+\d+)',
    re.IGNORECASE,
)
NUMERICAL_CLAIM_PATTERN = re.compile(
    r'(?:'
    r'\d+(?:\.\d+)?%'
    r'|\d+\s*(?:million|billion|trillion)'
    r'|\d+\s*(?:devices?|implants?|electrodes?|channels?|patients?|subjects?|participants?)'
    r'|(?:first|largest|only|most|smallest|fastest|highest|lowest)\s+\w+'
    r')',
    re.IGNORECASE,
)

# URLs to skip (anchors within same repo, relative paths)
SKIP_URL_PREFIXES = [
    'https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-FIELD-JOURNAL.md#',
]

# Source patterns that indicate a claim is backed
SOURCE_PATTERNS = [
    re.compile(r'\[.*?\]\(https?://.*?\)'),
    re.compile(r'\(.*?et\s+al\..*?\)', re.IGNORECASE),
    re.compile(r'Source:', re.IGNORECASE),
    re.compile(r'\[[\d,]+\]'),
    re.compile(r'doi:\s*\S+', re.IGNORECASE),
    re.compile(r'arXiv:\s*\S+', re.IGNORECASE),
]


def is_field_journal_post(path: Path) -> bool:
    """Check if a blog post is a field journal entry."""
    text = path.read_text()
    return '#FieldJournal' in text or 'field-journal' in path.name


def strip_frontmatter(text: str) -> tuple[str, str]:
    """Split frontmatter from body. Returns (frontmatter, body)."""
    if text.startswith('---'):
        end = text.find('---', 3)
        if end != -1:
            return text[:end + 3], text[end + 3:]
    return '', text


def has_source_nearby(text: str, match_start: int, match_end: int) -> bool:
    """Check if there's a source pattern near the match (same paragraph)."""
    # Find paragraph boundaries
    para_start = text.rfind('\n\n', 0, match_start)
    para_start = 0 if para_start == -1 else para_start
    para_end = text.find('\n\n', match_end)
    para_end = len(text) if para_end == -1 else para_end
    paragraph = text[para_start:para_end]
    return any(p.search(paragraph) for p in SOURCE_PATTERNS)


def search_crossref(query: str, year: str) -> dict:
    """Search Crossref for a named citation like 'Cogan 2008'."""
    cache_key = f'crossref_search:{query}_{year}'
    cached = cache_get(cache_key)
    if cached:
        return cached

    _rate_limit()
    encoded = urllib.request.quote(f'{query}')
    url = f'https://api.crossref.org/works?query={encoded}&rows=3&filter=from-pub-date:{year},until-pub-date:{year}'
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            items = data.get('message', {}).get('items', [])
            if items:
                result = {'status': 'found', 'count': len(items), 'top_title': ' '.join(items[0].get('title', []))}
            else:
                result = {'status': 'not_found'}
            cache_set(cache_key, result)
            return result
    except Exception as e:
        result = {'status': 'error', 'error': str(e)}
        cache_set(cache_key, result)
        return result


def check_blog(path: Path) -> dict:
    """Fact-check a single blog post. Returns result with errors, warnings, metadata."""
    text = path.read_text()
    rel_path = path.relative_to(REPO_ROOT)
    frontmatter, body = strip_frontmatter(text)

    errors = []
    warnings = []

    # 1. Check inline DOIs
    for m in DOI_PATTERN.finditer(body):
        doi = m.group(1).rstrip('.')
        result = resolve_doi(doi)
        if not result or result.get('status') != 'ok':
            errors.append(f'Dead DOI: {doi}')
        # else: DOI resolves fine

    # 2. Check arXiv refs
    for m in ARXIV_PATTERN.finditer(body):
        eprint = m.group(1)
        result = resolve_arxiv(eprint)
        if not result or result.get('status') != 'ok':
            errors.append(f'Dead arXiv: {eprint}')

    # 3. Check hyperlinks
    seen_urls = set()
    for m in URL_PATTERN.finditer(body):
        url = m.group(0).rstrip('.,;:)')
        if url in seen_urls:
            continue
        seen_urls.add(url)

        # Skip repo-internal anchors
        if any(url.startswith(prefix) for prefix in SKIP_URL_PREFIXES):
            continue

        result = check_url(url)
        if result.get('status') == 'bot_blocked':
            warnings.append(f'URL bot-blocked (403): {url} — verify manually')
        elif result.get('status') != 'ok':
            code = result.get('code', '')
            errors.append(f'Dead URL ({code}): {url}')

    # 4. Search named citations via Crossref (warning only)
    for m in NAMED_CITATION_PATTERN.finditer(body):
        author = m.group(1).strip()
        year = m.group(2)
        # Skip if there's already a link nearby
        if has_source_nearby(body, m.start(), m.end()):
            continue
        result = search_crossref(author, year)
        if result.get('status') == 'not_found':
            warnings.append(f'Named citation not found on Crossref: {author} {year}')

    # 5. Flag standards references (warning with lookup suggestion)
    for m in STANDARDS_PATTERN.finditer(body):
        std = m.group(1)
        if not has_source_nearby(body, m.start(), m.end()):
            warnings.append(f'Standards ref without link: {std}')

    # 6. Flag unsourced numerical claims (warning only)
    for m in NUMERICAL_CLAIM_PATTERN.finditer(body):
        if has_source_nearby(body, m.start(), m.end()):
            continue
        snippet = body[max(0, m.start() - 20):min(len(body), m.end() + 20)].replace('\n', ' ').strip()
        warnings.append(f'Unsourced numerical claim: "...{snippet}..."')

    # Build metadata
    has_errors = len(errors) > 0
    metadata = {
        'fact_checked': not has_errors,
        'fact_check_date': date.today().isoformat(),
        'fact_check_notes': errors + [f'[advisory] {w}' for w in warnings],
    }

    # Build details for report
    details = []
    for e in errors:
        details.append({'level': 'error', 'message': f'[{rel_path}] {e}'})
    for w in warnings:
        details.append({'level': 'warning', 'message': f'[{rel_path}] {w}'})

    return {
        'errors': len(errors),
        'warnings': len(warnings),
        'details': details,
        'metadata': metadata,
        'path': path,
    }


def inject_frontmatter(path: Path, metadata: dict):
    """Write fact_check metadata into the blog post frontmatter. Idempotent."""
    text = path.read_text()
    if not text.startswith('---'):
        return

    end = text.find('---', 3)
    if end == -1:
        return

    fm = text[3:end]
    body = text[end + 3:]

    # Strip existing fact_check keys
    fm_lines = []
    skip_array = False
    for line in fm.split('\n'):
        stripped = line.strip()
        if stripped.startswith('fact_check'):
            # If it's fact_check_notes, skip following indented array lines
            if 'fact_check_notes' in stripped:
                skip_array = not stripped.endswith('[]')
            continue
        if skip_array:
            if stripped.startswith('- ') or stripped.startswith('"') or stripped == ']':
                continue
            skip_array = False
        fm_lines.append(line)

    # Remove trailing empty lines from frontmatter
    while fm_lines and fm_lines[-1].strip() == '':
        fm_lines.pop()

    # Add new metadata
    fm_lines.append(f'fact_checked: {str(metadata["fact_checked"]).lower()}')
    fm_lines.append(f'fact_check_date: "{metadata["fact_check_date"]}"')

    notes = metadata.get('fact_check_notes', [])
    if notes:
        fm_lines.append('fact_check_notes:')
        for note in notes:
            # Escape quotes in YAML
            escaped = note.replace('"', '\\"')
            fm_lines.append(f'  - "{escaped}"')
    else:
        fm_lines.append('fact_check_notes: []')

    fm_lines.append('')  # trailing newline before closing ---

    new_text = '---\n' + '\n'.join(fm_lines) + '---' + body
    path.write_text(new_text)


def run(post_paths=None, inject=False) -> dict:
    """Run fact-check on field journal blog posts.

    Args:
        post_paths: List of specific paths to check. None = all #FieldJournal posts.
        inject: If True, write fact_check metadata into frontmatter.
    """
    all_details = []

    if post_paths:
        paths = [(REPO_ROOT / p).resolve() if not Path(p).is_absolute() else Path(p) for p in post_paths]
    else:
        if not BLOGS_DIR.exists():
            return make_result(0, 1, [{'level': 'warning', 'message': 'blogs/ directory not found'}])

        paths = [p for p in sorted(BLOGS_DIR.glob('*.md')) if is_field_journal_post(p)]

    all_details.append({'level': 'info', 'message': f'Fact-checking {len(paths)} field journal post(s)'})

    total_errors = 0
    total_warnings = 0

    for path in paths:
        if not path.exists():
            all_details.append({'level': 'error', 'message': f'File not found: {path}'})
            total_errors += 1
            continue

        result = check_blog(path)
        total_errors += result['errors']
        total_warnings += result['warnings']
        all_details.extend(result['details'])

        if inject:
            inject_frontmatter(path, result['metadata'])
            status = 'PASS' if result['metadata']['fact_checked'] else 'FAIL'
            all_details.append({
                'level': 'info',
                'message': f'  Injected fact_check metadata ({status}) into {path.name}',
            })

    return make_result(total_errors, total_warnings, all_details)


def main():
    inject = '--inject' in sys.argv
    post_paths = None

    if '--posts' in sys.argv:
        idx = sys.argv.index('--posts')
        post_paths = sys.argv[idx + 1:]

    result = run(post_paths=post_paths, inject=inject)
    print_report('Field Journal Fact-Check', result)

    # Write JSON report for CI artifact
    if '--ci' in sys.argv or inject:
        report_path = REPO_ROOT / 'fact-check-report.json'
        report_path.write_text(json.dumps({
            'errors': result['errors'],
            'warnings': result['warnings'],
            'details': result['details'],
        }, indent=2, default=str))

    return 1 if result['errors'] else 0


if __name__ == '__main__':
    sys.exit(main())
