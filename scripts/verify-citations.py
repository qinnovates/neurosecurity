#!/usr/bin/env python3
"""
Citation Verification Utility for TARA Migration Scripts.
Verifies DOIs via Crossref API before techniques are accepted.

Usage:
  # Verify all citations in the registrar
  python3 scripts/verify-citations.py

  # Verify a single DOI
  python3 scripts/verify-citations.py --doi 10.1126/science.aaq1144

  # Verify citations for new techniques only (T0136+)
  python3 scripts/verify-citations.py --new-only
"""

import json
import re
import sys
import time
from pathlib import Path

try:
    import urllib.request
    import urllib.error
except ImportError:
    pass

REGISTRAR_PATH = Path(__file__).parent.parent / "datalake" / "qtara-registrar.json"
CROSSREF_API = "https://api.crossref.org/works/"
PUBMED_API = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"

# Rate limit: Crossref asks for max 50 req/sec; we'll be conservative
RATE_LIMIT_SEC = 0.5


def resolve_doi(doi: str) -> dict | None:
    """Resolve a DOI via Crossref API. Returns metadata or None."""
    url = f"{CROSSREF_API}{doi}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "QIF-TARA-Verifier/1.0 (mailto:research@qinnovate.com)"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return data.get("message", {})
    except (urllib.error.HTTPError, urllib.error.URLError, Exception):
        return None


def resolve_pmid(pmid: str) -> dict | None:
    """Resolve a PMID via PubMed API. Returns metadata or None."""
    url = f"{PUBMED_API}?db=pubmed&id={pmid}&retmode=json"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            result = data.get("result", {}).get(pmid, {})
            if result and "error" not in result:
                return result
    except Exception:
        pass
    return None


def extract_identifiers(sources: list) -> list:
    """Extract DOIs and PMIDs from a sources list."""
    ids = []
    for src in (sources or []):
        # DOI patterns
        doi_match = re.search(r'(?:DOI:|doi:)\s*(10\.\S+?)(?:\s|$|,|\))', src)
        if doi_match:
            ids.append(("DOI", doi_match.group(1).rstrip('.')))

        # PMID patterns
        pmid_match = re.search(r'PMID:?\s*(\d{7,8})', src)
        if pmid_match:
            ids.append(("PMID", pmid_match.group(1)))
    return ids


def verify_technique(tech: dict) -> list:
    """Verify all citations for a technique. Returns list of (status, message)."""
    results = []
    sources = tech.get("sources", [])
    tara_sources = []
    if tech.get("tara") and isinstance(tech["tara"], dict):
        # Some sources are nested in tara.clinical or tara.governance
        pass  # Sources are typically in top-level sources array

    identifiers = extract_identifiers(sources)

    if not identifiers and tech.get("status") in ("CONFIRMED", "DEMONSTRATED", "EMERGING"):
        results.append(("WARN", f"{tech['id']}: No DOI/PMID in sources but status is {tech['status']}"))
        return results

    for id_type, id_value in identifiers:
        time.sleep(RATE_LIMIT_SEC)
        if id_type == "DOI":
            meta = resolve_doi(id_value)
            if meta:
                title = meta.get("title", [""])[0][:80] if meta.get("title") else "untitled"
                results.append(("PASS", f"{tech['id']}: DOI {id_value} -> {title}"))
            else:
                results.append(("FAIL", f"{tech['id']}: DOI {id_value} UNRESOLVABLE"))
        elif id_type == "PMID":
            meta = resolve_pmid(id_value)
            if meta:
                title = meta.get("title", "")[:80]
                results.append(("PASS", f"{tech['id']}: PMID {id_value} -> {title}"))
            else:
                results.append(("FAIL", f"{tech['id']}: PMID {id_value} UNRESOLVABLE"))

    return results


def main():
    args = sys.argv[1:]

    # Single DOI mode
    if "--doi" in args:
        idx = args.index("--doi")
        doi = args[idx + 1] if idx + 1 < len(args) else None
        if not doi:
            print("Usage: --doi 10.xxxx/yyyy")
            sys.exit(1)
        meta = resolve_doi(doi)
        if meta:
            title = meta.get("title", [""])[0] if meta.get("title") else "untitled"
            authors = ", ".join([a.get("family", "") for a in meta.get("author", [])[:3]])
            year = meta.get("published-print", {}).get("date-parts", [[None]])[0][0] or meta.get("created", {}).get("date-parts", [[None]])[0][0]
            print(f"RESOLVED: {doi}")
            print(f"  Title: {title}")
            print(f"  Authors: {authors}")
            print(f"  Year: {year}")
        else:
            print(f"UNRESOLVABLE: {doi}")
            sys.exit(1)
        sys.exit(0)

    # Registrar mode
    with open(REGISTRAR_PATH) as f:
        reg = json.load(f)

    techniques = reg["techniques"]
    new_only = "--new-only" in args

    if new_only:
        # Only check T0136+ (new techniques from this session)
        techniques = [t for t in techniques if int(t["id"].replace("QIF-T", "")) >= 136]
        print(f"Verifying citations for {len(techniques)} new techniques (T0136+)")
    else:
        print(f"Verifying citations for {len(techniques)} techniques")

    print()

    passes = 0
    fails = 0
    warns = 0

    for tech in techniques:
        results = verify_technique(tech)
        for status, msg in results:
            if status == "PASS":
                passes += 1
                if "--verbose" in args:
                    print(f"  PASS: {msg}")
            elif status == "FAIL":
                fails += 1
                print(f"  FAIL: {msg}")
            elif status == "WARN":
                warns += 1
                print(f"  WARN: {msg}")

    print()
    print(f"Results: {passes} passed, {fails} failed, {warns} warnings")
    if fails > 0:
        print("ACTION: Fix or flag failed citations before committing")
    sys.exit(1 if fails > 0 else 0)


if __name__ == "__main__":
    main()
