#!/usr/bin/env python3
"""
Citation-store sync, 2026-10-07.

Copies the peer-reviewed sources that the October 2026 registrar migrations
added to datalake/qtara-registrar.json into the three citation stores named in
.claude/rules/sync-protocols.md:

  osi-of-mind/QIF-RESEARCH-SOURCES.md   one table row per source
  research/paper/references.bib         one BibTeX entry per source
  datalake/research-registry.json       one researcher entry per first author

The DOIs come from the two migration plans in _staging/2026-10-refresh/. Each
is resolved at Crossref and its title and author family names are compared with
the plan before anything is written; the citation text is built from the
Crossref record, not from the plan. A source whose DOI is already in a store is
left alone in that store.

Usage (from the repository root):
    python3 datalake/scripts/sync-registrar-citations.py --dry-run
    python3 datalake/scripts/sync-registrar-citations.py
"""

import argparse
import importlib.util
import json
import re
import sys
import time
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Tuple

SCRIPTS_DIR = Path(__file__).resolve().parent
DATALAKE_DIR = SCRIPTS_DIR.parent
REPO_ROOT = DATALAKE_DIR.parent
STAGING_DIR = REPO_ROOT / "_staging" / "2026-10-refresh"
PLAN_PATHS = [STAGING_DIR / "registrar-fix-plan.json", STAGING_DIR / "three-state-niss-plan.json"]
REGISTRAR_PATH = DATALAKE_DIR / "qtara-registrar.json"
SOURCES_PATH = REPO_ROOT / "osi-of-mind" / "QIF-RESEARCH-SOURCES.md"
BIB_PATH = REPO_ROOT / "research" / "paper" / "references.bib"
REGISTRY_PATH = DATALAKE_DIR / "research-registry.json"

SYNC_DATE = "2026-10-07"
CROSSREF_PAUSE_SECONDS = 1.0
SECURITY_VENUE_PATTERN = re.compile(r"IEEE|ACM|Security|Scientific Reports", re.IGNORECASE)
SECURITY_SECTION = {"prefix": "C", "heading": "## 5. Electrode & Neural Interface Technology", "domain": "Cybersecurity & BCI Security",
                    "title": "### TARA Entry Sources: Security and Inference (Registrar Sync, 2026-10-07)"}
NEUROSCIENCE_SECTION = {"prefix": "N", "heading": "## 3. Brain-Computer Interfaces (BCI Technology)", "domain": "Neuroscience",
                        "title": "### TARA Entry Sources: Stimulation, Sensory and Plasticity Physiology (Registrar Sync, 2026-10-07)"}
TABLE_HEADER = "| # | Citation | URL | Source | QIF Relevance |\n|---|----------|-----|--------|---------------|\n"
SECTION_NOTE = ("> Peer-reviewed sources attached to TARA entries by the October 2026 registrar migrations. Each was verified at "
                "Crossref and read at abstract level. A source here supports a mechanism or capability as its abstract reports "
                "it; none shows that an attack was run.\n\n")
SPELLING_CORRECTIONS = {"Merzenieh": "Merzenich"}
PROVENANCE_ROW = f"| TARA Registrar Citation Sync (Oct 7) | ~{{count}} |\n"


def load_fixes_module() -> Any:
    spec = importlib.util.spec_from_file_location("migrate_registrar_fixes", SCRIPTS_DIR / "migrate-registrar-fixes.py")
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load migrate-registrar-fixes.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


FIXES = load_fixes_module()
MigrationError = FIXES.MigrationError


def ascii_slug(text: str) -> str:
    folded = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", folded.lower()).strip("-")


def clean(text: str) -> str:
    return " ".join(re.sub(r"<[^>]+>", "", text or "").split())


def fetch_verified_record(key: str, citation: Dict[str, Any]) -> Dict[str, Any]:
    message = FIXES.fetch_crossref_record(citation["doi"])
    title = clean(" ".join(message.get("title", [])))
    families = [author.get("family") or author.get("name") for author in message.get("author", [])]
    if FIXES.normalise(title) != FIXES.normalise(citation["title"]) or families != citation["authors"]:
        raise MigrationError(f"DOI {citation['doi']} ({key}): Crossref title or authors differ from the plan")
    authors = [{"family": SPELLING_CORRECTIONS.get(author.get("family", ""), author.get("family") or author.get("name", "")),
                "given": author.get("given", ""),
                "affiliation": clean((author.get("affiliation") or [{}])[0].get("name", "")) if author.get("affiliation") else ""}
               for author in message.get("author", [])]
    dated = message.get("published-print") or message.get("issued") or {}
    year = (dated.get("date-parts") or [[None]])[0][0]
    return {"key": key, "doi": citation["doi"], "title": title, "authors": authors,
            "is_author_list_partial": "et al" in (citation.get("citation") or "") and len(authors) == 1,
            "year": year, "container": clean((message.get("container-title") or [""])[0]),
            "volume": message.get("volume", ""), "issue": message.get("issue", ""), "pages": message.get("page", ""),
            "type": message.get("type", "")}


def technique_usage(doi: str, techniques: List[Dict[str, Any]]) -> Tuple[List[str], List[str]]:
    in_sources = [t["id"] for t in techniques if any(doi in source for source in t.get("sources", []))]
    in_defensive = [t["id"] for t in techniques if any(doi in source for source in t.get("defensive_sources", []))]
    return in_sources, in_defensive


def relevance_text(in_sources: List[str], in_defensive: List[str]) -> str:
    parts = []
    if in_sources:
        parts.append(f"Cited in sources by {', '.join(in_sources)} as abstract-level support for the mechanism or capability the entry names")
    if in_defensive:
        parts.append(f"Cited in defensive_sources by {', '.join(in_defensive)} as a control, mitigation or benchmark; not counted by the citation gate")
    return "; ".join(parts) + ". Does not show that an attack was run."


def author_string(record: Dict[str, Any]) -> str:
    names = [f"{author['family']} {''.join(part[0] for part in author['given'].replace('-', ' ').split())}".strip()
             for author in record["authors"]]
    shown = ", ".join(names[:6]) + (" et al." if len(names) > 6 or record["is_author_list_partial"] else ".")
    return shown


def locator(record: Dict[str, Any]) -> str:
    text = record["container"]
    if record["volume"]:
        text += f" {record['volume']}" + (f"({record['issue']})" if record["issue"] else "")
    if record["pages"]:
        text += f":{record['pages']}" if record["volume"] else f", pp. {record['pages']}"
    return text


def markdown_row(catalogue_id: str, record: Dict[str, Any], relevance: str) -> str:
    citation = f"{author_string(record)} ({record['year']}). \"{record['title']}.\" {locator(record)}. DOI:{record['doi']}."
    return f"| {catalogue_id} | {citation} | https://doi.org/{record['doi']} | Verified: Crossref {SYNC_DATE} | {relevance} |\n"


def bib_key(record: Dict[str, Any]) -> str:
    title_words = [word for word in ascii_slug(record["title"]).split("-") if len(word) > 3]
    return ascii_slug(record["authors"][0]["family"]).replace("-", "") + str(record["year"]) + "".join(title_words[:2])


def bib_entry(record: Dict[str, Any], catalogue_id: str) -> str:
    is_proceedings = record["type"] == "proceedings-article"
    authors = " and ".join(f"{author['family']}, {author['given']}".rstrip(", ") for author in record["authors"])
    if record["is_author_list_partial"]:
        authors += " and others"
    fields = [("author", authors), ("title", record["title"]),
              ("booktitle" if is_proceedings else "journal", record["container"]),
              ("volume", record["volume"]), ("number", record["issue"]), ("pages", record["pages"].replace("-", "--")),
              ("year", str(record["year"])), ("doi", record["doi"]),
              ("note", f"AI-suggested, verified {SYNC_DATE} via Crossref API (title and author family names matched). Catalogue ID {catalogue_id}")]
    body = ",\n".join(f"  {name:<9} = {{{value}}}" for name, value in fields if value)
    return f"\n@{'inproceedings' if is_proceedings else 'article'}{{{bib_key(record)},\n{body}\n}}\n"


def researcher_entry(record: Dict[str, Any], catalogue_id: str, relevance: str) -> Dict[str, Any]:
    first = record["authors"][0]
    name = f"{first['given']} {first['family']}".strip()
    return {"id": ascii_slug(name), "name": name, "institution": first["affiliation"] or "Not listed in the Crossref record",
            "country": "UNKNOWN", "expertise": [], "papers": [catalogue_id], "bibKeys": [bib_key(record)],
            "qifRelevance": relevance, "tags": ["tara-source"], "layer": "HOW"}


def next_catalogue_number(sources_text: str, prefix: str) -> int:
    return max(int(number) for number in re.findall(rf"^\| {prefix}(\d+) \|", sources_text, re.MULTILINE)) + 1


def add_to_sources(sources_text: str, rows_by_section: List[Tuple[Dict[str, str], List[str]]]) -> str:
    total_added = 0
    for section, rows in rows_by_section:
        if not rows:
            continue
        marker = f"---\n\n{section['heading']}"
        if sources_text.count(marker) != 1:
            raise MigrationError(f"cannot place the {section['domain']} rows: heading {section['heading']!r} not found once")
        block = f"{section['title']}\n\n{SECTION_NOTE}{TABLE_HEADER}{''.join(rows)}\n"
        sources_text = sources_text.replace(marker, block + marker)
        pattern = re.compile(rf"^\| {re.escape(section['domain'])} \| (\d+) \|", re.MULTILINE)
        match = pattern.search(sources_text)
        if not match:
            raise MigrationError(f"appendix row for {section['domain']} not found")
        sources_text = pattern.sub(f"| {section['domain']} | {int(match.group(1)) + len(rows)} |", sources_text, count=1)
        total_added += len(rows)
    for pattern, template in [(r"> \*\*Total unique sources:\*\* (\d+)", "> **Total unique sources:** {}"),
                              (r"\| \*\*Total\*\* \| \*\*(\d+)\*\* \|", "| **Total** | **{}** |")]:
        match = re.search(pattern, sources_text)
        if not match:
            raise MigrationError(f"total line not found: {pattern}")
        sources_text = sources_text.replace(match.group(0), template.format(int(match.group(1)) + total_added), 1)
    sources_text = re.sub(r"> \*\*Last updated:\*\* \d{4}-\d{2}-\d{2}", f"> **Last updated:** {SYNC_DATE}", sources_text, count=1)
    anchor = "| Scholar Crawl Integration (Oct 6) |"
    line_end = sources_text.index("\n", sources_text.index(anchor)) + 1
    return sources_text[:line_end] + PROVENANCE_ROW.format(count=total_added) + sources_text[line_end:]


def add_to_registry(registry_text: str, entries: List[Dict[str, Any]]) -> str:
    """Insert researcher entries as text so the file's existing escaping and layout are untouched."""
    start = registry_text.index('"researchers": [')
    end = registry_text.index("\n  ]", start)
    rendered = "".join(",\n" + "\n".join("    " + line for line in json.dumps(entry, indent=2, ensure_ascii=False).splitlines())
                       for entry in entries)
    updated = registry_text[:end] + rendered + registry_text[end:]
    total = re.search(r'"totalEntities": (\d+)', updated)
    updated = updated.replace(total.group(0), f'"totalEntities": {int(total.group(1)) + len(entries)}', 1)
    updated = re.sub(r'"lastUpdated": "\d{4}-\d{2}-\d{2}"', f'"lastUpdated": "{SYNC_DATE}"', updated, count=1)
    json.loads(updated)
    return updated


def run(is_dry_run: bool) -> None:
    citations: Dict[str, Dict[str, Any]] = {}
    for plan_path in PLAN_PATHS:
        citations.update(json.loads(plan_path.read_text(encoding="utf-8"))["citations"])
    techniques = json.loads(REGISTRAR_PATH.read_text(encoding="utf-8"))["techniques"]
    sources_text, bib_text, registry_text = (path.read_text(encoding="utf-8") for path in (SOURCES_PATH, BIB_PATH, REGISTRY_PATH))
    known_researchers = {entry["id"] for entry in json.loads(registry_text)["researchers"]}
    next_number = {section["prefix"]: next_catalogue_number(sources_text, section["prefix"])
                   for section in (SECURITY_SECTION, NEUROSCIENCE_SECTION)}
    rows: Dict[str, List[str]] = {"C": [], "N": []}
    bib_entries: List[str] = []
    researchers: List[Dict[str, Any]] = []
    skipped: List[str] = []
    for key, citation in citations.items():
        doi_lower = citation["doi"].lower()
        in_sources_store = doi_lower in sources_text.lower()
        in_bib_store = doi_lower in bib_text.lower()
        if in_sources_store and in_bib_store:
            skipped.append(f"{citation['doi']} already in the catalogue and the bibliography")
            continue
        record = fetch_verified_record(key, citation)
        time.sleep(CROSSREF_PAUSE_SECONDS)
        usage = technique_usage(citation["doi"], techniques)
        if not usage[0] and not usage[1]:
            raise MigrationError(f"DOI {citation['doi']} is not cited by any registrar entry")
        relevance = relevance_text(*usage)
        existing_id = re.search(rf"^\| ([A-Z]+\d+) \|[^\n]*{re.escape(citation['doi'])}", sources_text, re.MULTILINE | re.IGNORECASE)
        section = SECURITY_SECTION if SECURITY_VENUE_PATTERN.search(record["container"]) else NEUROSCIENCE_SECTION
        if existing_id:
            catalogue_id = existing_id.group(1)
        else:
            catalogue_id = f"{section['prefix']}{next_number[section['prefix']]}"
            next_number[section["prefix"]] += 1
            rows[section["prefix"]].append(markdown_row(catalogue_id, record, relevance))
        if not in_bib_store:
            bib_entries.append(bib_entry(record, catalogue_id))
        entry = researcher_entry(record, catalogue_id, relevance)
        if entry["id"] in known_researchers:
            skipped.append(f"{citation['doi']}: researcher {entry['id']} already in the registry; entry not duplicated")
        else:
            known_researchers.add(entry["id"])
            researchers.append(entry)
        print(f"  {catalogue_id:<5} {bib_key(record):<34} {citation['doi']}")
    print(f"\n{'DRY RUN: ' if is_dry_run else ''}catalogue rows +{len(rows['C']) + len(rows['N'])} "
          f"(C {len(rows['C'])}, N {len(rows['N'])}), BibTeX entries +{len(bib_entries)}, researcher entries +{len(researchers)}")
    for line in skipped:
        print(f"  skipped: {line}")
    if is_dry_run:
        print("DRY RUN: no file was written.")
        return
    if rows["C"] or rows["N"]:
        SOURCES_PATH.write_text(add_to_sources(sources_text, [(SECURITY_SECTION, rows["C"]), (NEUROSCIENCE_SECTION, rows["N"])]), encoding="utf-8")
    if bib_entries:
        BIB_PATH.write_text(bib_text.rstrip("\n") + "\n" + "".join(bib_entries), encoding="utf-8")
    if researchers:
        REGISTRY_PATH.write_text(add_to_registry(registry_text, researchers), encoding="utf-8")
    print("Wrote the three citation stores.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync registrar sources into the three citation stores.")
    parser.add_argument("--dry-run", action="store_true", help="resolve and report; write nothing")
    arguments = parser.parse_args()
    try:
        run(arguments.dry_run)
    except MigrationError as error:
        print(f"ERROR: {error}. Nothing was changed.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
