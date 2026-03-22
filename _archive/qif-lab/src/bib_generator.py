"""
BibTeX Generator — Parses QIF-RESEARCH-SOURCES.md and emits references.bib.

As-Code Principle: The bibliography is generated from the living research sources
document, not manually maintained. Run this script after adding new sources.

Usage:
    python -m src.bib_generator                    # default paths
    python -m src.bib_generator --output refs.bib  # custom output
"""

import re
import argparse
from pathlib import Path
from typing import Optional

# Default paths (relative to qif-lab/)
DEFAULT_SOURCES = Path(__file__).parent.parent.parent / "QIF-RESEARCH-SOURCES.md"
DEFAULT_OUTPUT = Path(__file__).parent.parent / "whitepaper" / "references.bib"


def _sanitize_key(ref_id: str) -> str:
    """Convert source ID (e.g. Q1, N17, C30) to a BibTeX-safe key."""
    return ref_id.strip().replace(" ", "_")


def _extract_year(citation: str) -> str:
    """Extract the first 4-digit year from a citation string."""
    match = re.search(r'\b(19|20)\d{2}\b', citation)
    return match.group(0) if match else "n.d."


def _extract_authors(citation: str) -> str:
    """Extract author names from citation. Returns 'Unknown' if none found."""
    # Pattern: "LastName FirstInitial..." or "LastName et al."
    # Try to get everything before the year/parenthetical
    match = re.match(r'^([^(]+?)\s*[\(.]', citation)
    if match:
        authors = match.group(1).strip().rstrip(',').rstrip('.')
        if authors and len(authors) > 2 and not authors.startswith('"'):
            return authors
    return "Unknown"


def _extract_title(citation: str) -> str:
    """Extract quoted title from citation."""
    match = re.search(r'"([^"]+)"', citation)
    return match.group(1) if match else citation[:80]


def _extract_journal(citation: str) -> str:
    """Extract journal/source from citation (text after closing quote, before URL)."""
    # After the title in quotes, look for journal name
    match = re.search(r'"\s*(.+?)(?:\.\s*$|\s*\|)', citation)
    if match:
        after_title = match.group(1).strip()
        # Remove the title part and get what remains
        parts = citation.split('"')
        if len(parts) >= 3:
            remainder = parts[-1].strip().rstrip('.')
            # Clean up
            remainder = re.sub(r'^[,.\s]+', '', remainder)
            if remainder and len(remainder) > 3:
                return remainder
    return ""


def _extract_url(row_cells: list) -> str:
    """Extract URL from table row cells."""
    for cell in row_cells:
        match = re.search(r'https?://[^\s|)]+', cell)
        if match:
            return match.group(0).rstrip('.')
    return ""


def _extract_arxiv_id(url: str) -> str:
    """Extract arXiv ID from URL if present."""
    match = re.search(r'arxiv\.org/(?:abs|html|pdf)/(\d+\.\d+)', url)
    return match.group(1) if match else ""


def parse_sources_markdown(sources_path: Path) -> list[dict]:
    """Parse QIF-RESEARCH-SOURCES.md and extract structured source entries.

    Returns list of dicts with keys: id, citation, url, agent, relevance, year, authors, title
    """
    text = sources_path.read_text(encoding="utf-8")
    entries = []

    # Match markdown table rows: | ID | Citation | URL | Agent | Relevance |
    # Skip header rows (containing "---" or "Citation")
    table_row_pattern = re.compile(
        r'^\|\s*([A-Z]\d+)\s*\|(.+?)\|(.+?)\|(.+?)\|(.+?)\|\s*$',
        re.MULTILINE
    )

    for match in table_row_pattern.finditer(text):
        ref_id = match.group(1).strip()
        citation = match.group(2).strip()
        url_cell = match.group(3).strip()
        agent = match.group(4).strip()
        relevance = match.group(5).strip()

        url = ""
        url_match = re.search(r'https?://[^\s|)]+', url_cell)
        if url_match:
            url = url_match.group(0).rstrip('.')

        year = _extract_year(citation)
        authors = _extract_authors(citation)
        title = _extract_title(citation)
        journal = _extract_journal(citation)
        arxiv_id = _extract_arxiv_id(url)

        entries.append({
            "id": ref_id,
            "citation": citation,
            "url": url,
            "agent": agent,
            "relevance": relevance,
            "year": year,
            "authors": authors,
            "title": title,
            "journal": journal,
            "arxiv_id": arxiv_id,
        })

    return entries


def _bibtex_escape(s: str) -> str:
    """Escape special LaTeX characters in BibTeX values."""
    s = s.replace("&", r"\&")
    s = s.replace("%", r"\%")
    s = s.replace("_", r"\_")
    s = s.replace("#", r"\#")
    return s


def entry_to_bibtex(entry: dict) -> str:
    """Convert a parsed source entry to a BibTeX @article or @misc entry."""
    key = _sanitize_key(entry["id"])
    title = _bibtex_escape(entry["title"])
    authors = _bibtex_escape(entry["authors"])
    year = entry["year"]
    url = entry["url"]
    journal = _bibtex_escape(entry["journal"])
    arxiv_id = entry["arxiv_id"]

    # Use @article if journal found, otherwise @misc
    entry_type = "article" if journal and "arXiv" not in journal else "misc"

    lines = [f"@{entry_type}{{{key},"]
    lines.append(f"  author = {{{authors}}},")
    lines.append(f"  title = {{{{{title}}}}},")
    lines.append(f"  year = {{{year}}},")
    if journal and entry_type == "article":
        lines.append(f"  journal = {{{journal}}},")
    if arxiv_id:
        lines.append(f"  eprint = {{{arxiv_id}}},")
        lines.append(f"  archiveprefix = {{arXiv}},")
    if url:
        lines.append(f"  url = {{{url}}},")
    # Add QIF metadata as note
    lines.append(f"  note = {{Validation agent: {entry['agent']}}},")
    lines.append("}")

    return "\n".join(lines)


def generate_bib(sources_path: Path, output_path: Path) -> int:
    """Parse sources markdown and write references.bib.

    Returns number of entries written.
    """
    entries = parse_sources_markdown(sources_path)

    bib_blocks = []
    bib_blocks.append("% QIF References — Auto-generated from QIF-RESEARCH-SOURCES.md")
    bib_blocks.append(f"% {len(entries)} entries")
    bib_blocks.append(f"% Generator: qif-lab/src/bib_generator.py")
    bib_blocks.append("")

    # Group by domain prefix
    current_prefix = ""
    for entry in entries:
        prefix = entry["id"][0]
        if prefix != current_prefix:
            domain_names = {
                "Q": "Quantum Physics & Biology",
                "N": "Neuroscience",
                "B": "BCI Technology",
                "C": "Cybersecurity & BCI Security",
                "E": "Electrode & Neural Interface Technology",
            }
            bib_blocks.append(f"% === {domain_names.get(prefix, prefix)} ===")
            bib_blocks.append("")
            current_prefix = prefix

        bib_blocks.append(entry_to_bibtex(entry))
        bib_blocks.append("")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(bib_blocks), encoding="utf-8")
    return len(entries)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate references.bib from QIF-RESEARCH-SOURCES.md")
    parser.add_argument("--sources", type=Path, default=DEFAULT_SOURCES, help="Path to QIF-RESEARCH-SOURCES.md")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Output .bib file path")
    args = parser.parse_args()

    count = generate_bib(args.sources, args.output)
    print(f"Generated {count} BibTeX entries → {args.output}")
