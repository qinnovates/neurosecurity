#!/usr/bin/env python3
"""Catch the LaTeX source defects that only surface when someone compiles.

Two real bugs sat in this paper for months because nothing in CI ever built it:

  1. references.bib defined `oecd2019neurotechnology` twice (since 2026-02-14).
     BibTeX treats a repeated entry as an error and aborts, so `make pdf`
     failed outright and the bibliography silently went missing from any build
     that ignored the exit code.

  2. main.tex:50 wrote `(71.6%)` with an unescaped percent (since 2026-02-26).
     A bare `%` opens a comment, so the rest of that line vanished and the
     abstract read "78 techniques (71.6establishing a dual-use atlas". This one
     compiles cleanly -- it is only visible by reading the output -- and it
     reached the published PDF.

Both are cheap to detect in the source, which is what this does. It needs no
TeX installation, so it can run anywhere.

Usage:
    python3 lint_paper.py           # report and exit non-zero on any error
    python3 lint_paper.py --github  # also emit ::error:: annotations for CI
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path

PAPER_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = PAPER_DIR.parent.parent
BIB = PAPER_DIR / "references.bib"

BIB_ENTRY = re.compile(r"^@(\w+)\s*\{\s*([^,\s]+)\s*,", re.MULTILINE)
# A percent sign used as a unit, not as a comment: preceded by a digit, and not
# already escaped. This is the shape that silently truncates a sentence.
UNESCAPED_PERCENT = re.compile(r"(?<!\\)(?<=\d)\s*%")
CITE = re.compile(r"\\cite[tp]?\*?(?:\[[^\]]*\])*\{([^}]*)\}")


class Finding:
    def __init__(self, path: Path, line: int, message: str, *, error: bool = True):
        self.path, self.line, self.message, self.error = path, line, message, error

    def render(self, github: bool) -> str:
        where = f"{self.path.relative_to(REPO_ROOT)}:{self.line}"
        if github:
            level = "error" if self.error else "warning"
            return f"::{level} file={self.path.relative_to(REPO_ROOT)},line={self.line}::{self.message}"
        return f"  {'ERROR' if self.error else 'warn '}  {where}  {self.message}"


def tex_files() -> list[Path]:
    return sorted([PAPER_DIR / "main.tex", *(PAPER_DIR / "sections").glob("*.tex")])


def check_duplicate_bib_keys() -> list[Finding]:
    """A repeated key makes BibTeX abort, which kills the whole bibliography."""
    text = BIB.read_text()
    lines_by_key: dict[str, list[int]] = defaultdict(list)
    for match in BIB_ENTRY.finditer(text):
        line = text.count("\n", 0, match.start()) + 1
        lines_by_key[match.group(2)].append(line)

    findings = []
    for key, lines in sorted(lines_by_key.items()):
        if len(lines) > 1:
            others = ", ".join(str(line) for line in lines[1:])
            findings.append(Finding(
                BIB, lines[0],
                f"BibTeX key '{key}' is defined {len(lines)} times (also at line {others}). "
                f"BibTeX aborts on a repeated entry, so the bibliography is lost.",
            ))
    return findings


def check_unescaped_percent() -> list[Finding]:
    """A bare % after a number opens a comment and eats the rest of the line."""
    findings = []
    for path in tex_files():
        for number, line in enumerate(path.read_text().splitlines(), start=1):
            if line.lstrip().startswith("%"):
                continue  # a deliberate whole-line comment
            match = UNESCAPED_PERCENT.search(line)
            if match:
                swallowed = line[match.end():].strip()
                findings.append(Finding(
                    path, number,
                    f"unescaped '%' after a number; LaTeX will discard the rest of the line "
                    f"({swallowed[:60]!r}...). Write \\% instead."
                    if swallowed else
                    "unescaped '%' after a number; write \\% instead.",
                ))
    return findings


def check_citations_resolve() -> list[Finding]:
    """Every \\cite key should exist in references.bib."""
    defined = {match.group(2) for match in BIB_ENTRY.finditer(BIB.read_text())}
    findings = []
    for path in tex_files():
        for number, line in enumerate(path.read_text().splitlines(), start=1):
            if line.lstrip().startswith("%"):
                continue
            for match in CITE.finditer(line):
                for key in (part.strip() for part in match.group(1).split(",")):
                    if key and key not in defined:
                        findings.append(Finding(
                            path, number, f"\\cite key '{key}' is not in references.bib",
                        ))
    return findings


CHECKS = (
    ("duplicate BibTeX keys", check_duplicate_bib_keys),
    ("unescaped percent signs", check_unescaped_percent),
    ("citation keys resolve", check_citations_resolve),
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--github", action="store_true", help="emit GitHub Actions annotations")
    args = parser.parse_args()

    total_errors = 0
    for label, check in CHECKS:
        findings = check()
        errors = [finding for finding in findings if finding.error]
        total_errors += len(errors)
        status = "FAIL" if errors else "ok"
        print(f"[{status}] {label}" + (f" — {len(findings)} finding(s)" if findings else ""))
        for finding in findings:
            print(finding.render(args.github))

    print()
    if total_errors:
        print(f"{total_errors} error(s). The paper source has defects that a build would hit.")
        return 1
    print("Paper source is clean.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
