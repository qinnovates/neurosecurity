#!/usr/bin/env python3
"""
Blog citation auditor — scans blog posts for unsourced factual claims.
Advisory only (warnings, not errors).

Usage:
  python3 scripts/verify/audit_blog_claims.py
"""

import re
import sys
from pathlib import Path

from utils import REPO_ROOT, make_result, print_report

BLOGS_DIR = REPO_ROOT / 'blogs'

# Patterns that suggest factual claims needing sources
CLAIM_PATTERNS = [
    (r'\d+(\.\d+)?%', 'percentage'),
    (r'\$[\d,]+\s*(million|billion|trillion|[MBT])', 'dollar amount'),
    (r'\d+\s*(patients?|participants?|subjects?|trials?|studies)', 'study metric'),
    (r'\d+\s*(devices?|implants?|electrodes?)', 'device count'),
    (r'(first|largest|only|most|smallest|fastest)\s+\w+', 'superlative claim'),
    (r'20[12]\d\s+(study|report|paper|survey|analysis|review)', 'dated reference'),
    (r'(research shows|studies show|data shows|evidence suggests)', 'research claim'),
]

# Patterns that indicate a source is present
SOURCE_PATTERNS = [
    r'\[.*?\]\(https?://.*?\)',           # Markdown link
    r'\(.*?et\s+al\..*?\)',               # Author citation
    r'Source:',                            # Explicit source attribution
    r'\[[\d,]+\]',                        # Numeric citation reference
    r'doi:\s*\S+',                        # DOI reference
    r'arXiv:\s*\S+',                      # arXiv reference
]


def has_source(paragraph: str) -> bool:
    """Check if paragraph contains any sourcing pattern."""
    return any(re.search(p, paragraph, re.IGNORECASE) for p in SOURCE_PATTERNS)


def scan_blog(path: Path) -> list[dict]:
    """Scan a blog post for unsourced claims."""
    details = []
    text = path.read_text()
    rel_path = path.relative_to(REPO_ROOT)

    # Skip frontmatter
    if text.startswith('---'):
        end = text.find('---', 3)
        if end != -1:
            text = text[end + 3:]

    # Split into paragraphs
    paragraphs = re.split(r'\n\s*\n', text)

    for i, para in enumerate(paragraphs, 1):
        para = para.strip()
        if not para or para.startswith('#') or para.startswith('```'):
            continue

        if has_source(para):
            continue

        # Check for claim patterns
        for pattern, claim_type in CLAIM_PATTERNS:
            match = re.search(pattern, para, re.IGNORECASE)
            if match:
                # Extract a snippet around the match
                start = max(0, match.start() - 30)
                end = min(len(para), match.end() + 30)
                snippet = para[start:end].replace('\n', ' ').strip()
                if start > 0:
                    snippet = '...' + snippet
                if end < len(para):
                    snippet = snippet + '...'

                details.append({
                    'level': 'warning',
                    'message': f'[{rel_path}] Unsourced {claim_type}: "{snippet}"',
                })
                break  # One warning per paragraph

    return details


def run() -> dict:
    """Run blog citation audit."""
    details = []

    if not BLOGS_DIR.exists():
        details.append({
            'level': 'warning',
            'message': 'blogs/ directory not found',
        })
        return make_result(0, 1, details)

    blog_files = sorted(BLOGS_DIR.glob('*.md'))
    details.append({
        'level': 'info',
        'message': f'Scanning {len(blog_files)} blog posts',
    })

    for blog_path in blog_files:
        blog_details = scan_blog(blog_path)
        details.extend(blog_details)

    errors = sum(1 for d in details if d['level'] == 'error')
    warnings = sum(1 for d in details if d['level'] == 'warning')

    return make_result(errors, warnings, details)


def main():
    result = run()
    print_report('Blog Citation Audit', result)
    return 0  # Advisory only — never fails CI


if __name__ == '__main__':
    sys.exit(main())
