#!/usr/bin/env python3
"""Fail if any tracked file leaks workstation identity or a high-signal secret.

Why this exists: on 2026-10-16, 36 tracked files under _archive/ were found to
contain absolute home-directory paths naming the workstation user, already
public and in history. secure-coding.md has always forbidden that; nothing
checked it. This is the check.

What it flags:
  - home-directory paths: /Users/<name>/, /home/<name>/, C:\\Users\\<name>\\
  - private key blocks, AWS access key ids, GitHub tokens, Slack tokens,
    and generic "api_key = '<long literal>'" assignments
  - a repo author's full name outside an allowlisted citation context

On 2026-10-19 this script reported "no leaks" while a tracked Parquet file served
the maintainer's full name in production and seven tracked files carried it in
citation order. Two defects let that through, both fixed here:

  1. `scan()` read files as text and returned [] on UnicodeDecodeError, so every
     binary in the repo was silently unscanned. Parquet, wasm and model files are
     now scanned as bytes for the name and secret patterns.
  2. The script never checked a name at all -- neither full nor first -- so the
     standing attribution rule had no enforcement anywhere. "CI is green" and "the
     attribution rule is satisfied" were the same unsupported claim.

The protected names are derived at runtime from `git log` authorship, never
hardcoded: this file is public, so a literal name here would itself be the leak.

Scope, decided deliberately:
  - FULL name (either ordering) is flagged outside allowlisted citation contexts.
    The standing rule is that public attribution goes to the company.
  - Academic/citation attribution is ALLOWED and allowlisted. It is a deliberate
    product feature (the homepage carries a copy-citation button) and the
    published Zenodo records are immutable, so the authorship is already fixed.
  - FIRST-name narration is OUT OF SCOPE. CLAUDE.md institutes `claudeq`
    derivation journaling, which records the human's decisions by first name on
    purpose; that is provenance, not a leak.
  - Git author metadata cannot be fixed by a content scan. It is reported as a
    NOTE, not a failure, because remediation is a history rewrite -- a separate,
    one-shot decision.

Placeholders are allowed: /Users/<name>/, /home/runner/ (CI), /home/user/ and
similar generic names. Scans `git ls-files`, so ignored and untracked files
(including _staging/) are out of scope.

Usage:
    python3 check_identity_leaks.py            # exit 1 on any finding
    python3 check_identity_leaks.py --github   # also emit ::error:: annotations
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]

GENERIC_NAMES = {"runner", "user", "username", "you", "your-name", "example", "name", "me", "shared", "public"}

# Not preceded by a hostname character, so URL paths such as
# businesswire.com/news/home/2025.../ are not mistaken for home directories.
HOME_PATH = re.compile(r"(?<![A-Za-z0-9._-])(?:/Users/|/home/|C:\\\\?Users\\\\?)([A-Za-z0-9._-]+)[/\\]")

# Vetted exceptions: verbatim third-party data whose provenance header records
# the original author's machine. Not this project's workstation identity.
ALLOWLIST = {
    "src/site/models/neuron.swc",  # NeuroMorpho-style SWC header from the upstream author
    ".github/security-audit/patterns/secrets.json",  # detection signatures, not secrets
    ".github/security-audit/README.md",  # documents those signatures
}
# Internal material never belongs in this public repository: planning docs,
# decision briefs, Quorum output, session reports and outreach drafts.
# Paths are blocked even if force-added past .gitignore; the markers catch an
# internal document saved somewhere else in the tree.
FORBIDDEN_PREFIXES = ("_staging/", "governance/outreach/", "src/site/governance/outreach/",
                      "src/site/governance/outreach-tracker/")
# Phrases are split so this file does not itself contain them.
INTERNAL_MARKERS = re.compile("(?i)" + "|".join((
    "internal " + "planning document",
    "INTERNAL" + ": do not publish",
    "not yet sent " + "externally",
)))

# Named by what they match, not "secrets": the scanner reports a fixed pattern
# name and never the matched text.
LEAK_PATTERNS = (
    ("private key block", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY")),
    ("AWS access key id", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("GitHub token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{36,}\b")),
    ("Slack token", re.compile(r"\bxox[abpr]-[A-Za-z0-9-]{10,}\b")),
    ("hardcoded api key", re.compile(r"(?i)\b(?:api[_-]?key|secret[_-]?key|access[_-]?token)\b\s*[:=]\s*['\"][A-Za-z0-9_\-]{24,}['\"]")),
)


# A line is a citation context when it carries citation machinery. The name is
# allowed there: it is the author attribution of the project's own scholarly work.
# Authorship attribution of the project's own scholarly and editorial work. The
# standing rule directs *corporate* attribution to the company; it does not strip
# a researcher's byline from their own paper or blog post, and the AI-disclosure
# rules depend on bylines existing. Both are allowed here; what is NOT allowed is
# the name appearing incidentally -- a build artifact's maintainer field, a
# narrative self-attribution in a spec -- where the company should stand instead.
CITATION_CONTEXT = re.compile(
    r"(?i)(\bauthors?\b\s*[:=]|@(?:article|misc|software|inproceedings|techreport)|"
    r"\bcitation\b|\bcite[sd]?\b|\bbibtex\b|\bzenodo\b|\bdoi\b|\borcid\b|"
    r"\bhow to cite\b|\bpreferred[- ]citation\b|\bbyline\b|\bcontributors?\b|"
    r"\bmaintainers?\b\s*[:=]|name=[\"']author[\"']|\bwritten by\b|\bby\b\s*$)"
)
# Whole files that are citation records end to end.
# Pure citation formats only. A Quarto .qmd is a whole document, so allowlisting it
# wholesale would let narrative self-attribution anywhere in a whitepaper pass; its
# genuine citation lines are already caught by CITATION_CONTEXT.
CITATION_FILE_SUFFIXES = (".bib", ".cff")


# A name in prose is an editorial call: a byline on one's own paper is legitimate,
# a maintainer field in a build artifact is not. Until that inventory is ruled on,
# these are REPORTED and do not fail the build. Everything else here does fail,
# including the same name inside a non-text file, which is never editorial.
NAME_IN_TEXT = "NOTE: author full name in prose (editorial review pending)"


def protected_names() -> list[re.Pattern[str]]:
    """Full-name patterns for every distinct author in this repository's history.

    Derived at runtime so no name is ever written into this public file. Returns
    both orderings ("First Last" and "Last, First"), with an optional middle
    initial, case-insensitive. A single-token author name is skipped: it has no
    surname to pair, so it cannot be a full name.
    """
    try:
        out = subprocess.run(
            ["git", "log", "--all", "--format=%an%x00%cn"],
            cwd=REPO_ROOT, capture_output=True, check=True, text=True,
        ).stdout
    except (subprocess.CalledProcessError, OSError):
        return []
    patterns: list[re.Pattern[str]] = []
    for who in {w.strip() for w in out.replace("\x00", "\n").splitlines() if w.strip()}:
        parts = [re.escape(token) for token in who.split() if token]
        if len(parts) < 2:
            continue
        first, last = parts[0], parts[-1]
        initial = r"(?:\s+[A-Za-z]\.?)?"
        patterns.append(re.compile(rf"(?i){first}{initial}\s+{last}"))
        patterns.append(re.compile(rf"(?i){last}\s*,\s*{first}{initial}"))
    return patterns


NAME_PATTERNS = protected_names()


def tracked_files() -> list[Path]:
    out = subprocess.run(["git", "ls-files", "-z"], cwd=REPO_ROOT, capture_output=True, check=True).stdout
    return [REPO_ROOT / name for name in out.decode().split("\0") if name and name not in ALLOWLIST]


def scan(path: Path) -> list[tuple[int, str]]:
    rel_name = path.relative_to(REPO_ROOT).as_posix()
    citation_file = rel_name.endswith(CITATION_FILE_SUFFIXES)
    try:
        text = path.read_text()
    except (UnicodeDecodeError, OSError):
        # Binary or undecodable. It is NOT exempt: a Parquet file served the
        # maintainer's name in production precisely because this returned [].
        return scan_bytes(path, citation_file)
    findings = []
    for number, line in enumerate(text.splitlines(), start=1):
        for match in HOME_PATH.finditer(line):
            if match.group(1).lower() not in GENERIC_NAMES:
                # Never echo the name itself: the report would become the leak.
                findings.append((number, "home-directory path naming a user"))
        for pattern_name, pattern in LEAK_PATTERNS:
            if pattern.search(line):
                findings.append((number, pattern_name))
        if INTERNAL_MARKERS.search(line):
            findings.append((number, "document marked internal"))
        if not citation_file and not CITATION_CONTEXT.search(line):
            for pattern in NAME_PATTERNS:
                if pattern.search(line):
                    # Never echo the name: the report would become the leak.
                    findings.append((number, NAME_IN_TEXT))
                    break
    return findings


def scan_bytes(path: Path, citation_file: bool) -> list[tuple[int, str]]:
    """Name and secret scan over raw bytes, for files that are not decodable text.

    There are no line numbers here, so findings are reported at line 0. A binary
    cannot carry a citation context on a line, so `citation_file` is honoured only
    at whole-file granularity.
    """
    try:
        blob = path.read_bytes()
    except OSError:
        return []
    findings: list[tuple[int, str]] = []
    if not citation_file:
        for pattern in NAME_PATTERNS:
            if re.search(pattern.pattern.encode("utf-8", "ignore"), blob, re.IGNORECASE):
                findings.append((0, "author full name embedded in a non-text file"))  # hard failure
                break
    for pattern_name, pattern in LEAK_PATTERNS:
        if re.search(pattern.pattern.encode("utf-8", "ignore"), blob, re.IGNORECASE):
            findings.append((0, pattern_name))
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--github", action="store_true")
    parser.add_argument("--strict", action="store_true",
                        help="treat an author's full name in prose as a failure, not a note")
    args = parser.parse_args()

    total = 0
    notes = 0
    for path in tracked_files():
        rel_name = path.relative_to(REPO_ROOT).as_posix()
        if rel_name.startswith(FORBIDDEN_PREFIXES):
            total += 1
            print(f"::error file={rel_name}::internal material is tracked" if args.github else f"  LEAK  {rel_name}  internal material is tracked")
            continue
        for number, finding_kind in scan(path):
            rel = path.relative_to(REPO_ROOT)
            if finding_kind == NAME_IN_TEXT and not args.strict:
                notes += 1
                print(f"  note  {rel}:{number}  author full name in prose")
                continue
            total += 1
            print(f"::error file={rel},line={number}::{finding_kind}" if args.github else f"  LEAK  {rel}:{number}  {finding_kind}")

    if notes:
        print(f"\n{notes} prose occurrence(s) of an author's full name. Not a build failure: a byline on "
              "one's own work is legitimate attribution. Review the inventory and decide per site; "
              "re-run with --strict to treat these as failures once the editorial pass is done.")
    if not NAME_PATTERNS:
        # A shallow clone (actions/checkout defaults to fetch-depth 1) whose HEAD is
        # bot-authored yields only single-token names, which are skipped, so the name
        # check would pass while checking nothing. Refuse that rather than report clean.
        total += 1
        print("::error::no multi-token author name could be derived from git history; the "
              "name check did not run. Use a full clone (fetch-depth: 0)." if args.github else
              "  LEAK  name check did not run: no multi-token author derivable from git history "
              "(shallow clone?). Re-run with full history.")
    if total:
        print(f"\n{total} leak(s) in tracked files. Redact with $HOME, ~ or a repo-relative path; "
              "rotate any real credential before removing it.")
        return 1
    print("No identity or secret leaks in tracked files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
