"""
Shared utilities for the citation verification pipeline.
BibTeX parser, DOI/URL resolver, HTTP cache, report formatting.
"""

import json
import os
import re
import time
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional

CACHE_DIR = Path(__file__).parent / '.cache'
CACHE_DIR.mkdir(exist_ok=True)

REPO_ROOT = Path(__file__).parent.parent.parent

# Rate limiting
_last_request_time = 0.0
RATE_LIMIT_SECONDS = 0.5

USER_AGENT = 'QInnovate-VerifyBot/1.0 (citation verification; mailto:noreply@qinnovate.com)'


def _rate_limit():
    """Enforce minimum delay between HTTP requests."""
    global _last_request_time
    elapsed = time.time() - _last_request_time
    if elapsed < RATE_LIMIT_SECONDS:
        time.sleep(RATE_LIMIT_SECONDS - elapsed)
    _last_request_time = time.time()


def _cache_path(key: str) -> Path:
    """Get cache file path for a given key."""
    safe_key = re.sub(r'[^a-zA-Z0-9._-]', '_', key)[:200]
    return CACHE_DIR / f'{safe_key}.json'


def cache_get(key: str) -> Optional[dict]:
    """Read from cache if exists and less than 7 days old."""
    path = _cache_path(key)
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text())
        if time.time() - data.get('_cached_at', 0) > 7 * 86400:
            return None
        return data
    except (json.JSONDecodeError, KeyError):
        return None


def cache_set(key: str, data: dict):
    """Write to cache with timestamp."""
    data['_cached_at'] = time.time()
    _cache_path(key).write_text(json.dumps(data, indent=2))


# ── BibTeX Parser ──

def parse_bibtex(text: str) -> list[dict]:
    """
    Regex-based BibTeX parser. Returns list of entries with:
    - entry_type, key, and all fields as lowercase keys.
    """
    entries = []
    # Split on entry boundaries
    pattern = r'@(\w+)\s*\{([^,]+),\s*(.*?)\n\}'
    for match in re.finditer(pattern, text, re.DOTALL):
        entry_type = match.group(1).lower()
        key = match.group(2).strip()
        body = match.group(3)

        entry = {'entry_type': entry_type, 'key': key}

        # Extract fields: field = {value} or field = value
        field_pattern = r'(\w+)\s*=\s*(?:\{((?:[^{}]|\{[^{}]*\})*)\}|(\S+))'
        for fm in re.finditer(field_pattern, body):
            field_name = fm.group(1).lower()
            value = fm.group(2) if fm.group(2) is not None else fm.group(3)
            # Clean up LaTeX commands for comparison
            entry[field_name] = value.strip().rstrip(',')

        entries.append(entry)

    return entries


# ── HTTP Resolvers ──

def resolve_doi(doi: str) -> Optional[dict]:
    """Resolve DOI via Crossref API. Returns {title, authors} or None."""
    cached = cache_get(f'doi:{doi}')
    if cached:
        return cached

    _rate_limit()
    url = f'https://api.crossref.org/works/{doi}'
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            work = data.get('message', {})
            result = {
                'status': 'ok',
                'title': ' '.join(work.get('title', [])),
                'authors': [
                    f"{a.get('given', '')} {a.get('family', '')}".strip()
                    for a in work.get('author', [])
                ],
                'year': str(work.get('published-print', work.get('published-online', {}))
                           .get('date-parts', [[None]])[0][0] or ''),
            }
            cache_set(f'doi:{doi}', result)
            return result
    except (urllib.error.HTTPError, urllib.error.URLError, Exception) as e:
        result = {'status': 'error', 'error': str(e)}
        cache_set(f'doi:{doi}', result)
        return result


def resolve_arxiv(eprint: str) -> Optional[dict]:
    """Resolve arXiv eprint ID. Returns {title, status} or None."""
    cached = cache_get(f'arxiv:{eprint}')
    if cached:
        return cached

    _rate_limit()
    url = f'https://arxiv.org/abs/{eprint}'
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='replace')
            title_match = re.search(r'<meta name="citation_title" content="([^"]+)"', html)
            title = title_match.group(1) if title_match else ''
            result = {'status': 'ok', 'title': title}
            cache_set(f'arxiv:{eprint}', result)
            return result
    except (urllib.error.HTTPError, urllib.error.URLError) as e:
        result = {'status': 'error', 'error': str(e)}
        cache_set(f'arxiv:{eprint}', result)
        return result


def check_url(url: str) -> dict:
    """Check if URL is reachable. HEAD then GET fallback."""
    cached = cache_get(f'url:{url}')
    if cached:
        return cached

    _rate_limit()
    for method in ['HEAD', 'GET']:
        req = urllib.request.Request(url, method=method, headers={'User-Agent': USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                result = {'status': 'ok', 'code': resp.status}
                cache_set(f'url:{url}', result)
                return result
        except urllib.error.HTTPError as e:
            if method == 'GET':
                result = {'status': 'error', 'code': e.code, 'error': str(e)}
                cache_set(f'url:{url}', result)
                return result
        except (urllib.error.URLError, Exception) as e:
            if method == 'GET':
                result = {'status': 'error', 'error': str(e)}
                cache_set(f'url:{url}', result)
                return result

    return {'status': 'error', 'error': 'unreachable'}


# ── Fuzzy Matching ──

def normalize_title(title: str) -> str:
    """Normalize title for fuzzy comparison."""
    title = re.sub(r'[{}\\\'"`,.]', '', title)
    title = re.sub(r'\s+', ' ', title)
    return title.lower().strip()


def titles_match(a: str, b: str, threshold: float = 0.8) -> bool:
    """Check if two titles are similar enough (simple word overlap)."""
    words_a = set(normalize_title(a).split())
    words_b = set(normalize_title(b).split())
    if not words_a or not words_b:
        return False
    overlap = len(words_a & words_b)
    return overlap / max(len(words_a), len(words_b)) >= threshold


# ── Report Format ──

def make_result(errors: int = 0, warnings: int = 0, details: list | None = None) -> dict:
    """Create a standard result dict."""
    return {
        'errors': errors,
        'warnings': warnings,
        'details': details or [],
    }


def print_report(name: str, result: dict):
    """Print a formatted report section."""
    errors = result['errors']
    warnings = result['warnings']

    status = '✗ FAIL' if errors else ('⚠ WARN' if warnings else '✓ PASS')
    print(f'\n{"=" * 60}')
    print(f'  {name}: {status}  ({errors} errors, {warnings} warnings)')
    print(f'{"=" * 60}')

    for d in result['details']:
        level = d.get('level', 'info')
        prefix = {'error': '  ✗', 'warning': '  ⚠', 'info': '  ·'}.get(level, '  ·')
        print(f'{prefix} {d["message"]}')
