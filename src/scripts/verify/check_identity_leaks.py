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
SECRETS = (
    ("private key block", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY")),
    ("AWS access key id", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("GitHub token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{36,}\b")),
    ("Slack token", re.compile(r"\bxox[abpr]-[A-Za-z0-9-]{10,}\b")),
    ("hardcoded api key", re.compile(r"(?i)\b(?:api[_-]?key|secret[_-]?key|access[_-]?token)\b\s*[:=]\s*['\"][A-Za-z0-9_\-]{24,}['\"]")),
)


def tracked_files() -> list[Path]:
    out = subprocess.run(["git", "ls-files", "-z"], cwd=REPO_ROOT, capture_output=True, check=True).stdout
    return [REPO_ROOT / name for name in out.decode().split("\0") if name and name not in ALLOWLIST]


def scan(path: Path) -> list[tuple[int, str]]:
    try:
        text = path.read_text()
    except (UnicodeDecodeError, OSError):
        return []  # binary or unreadable: not a text leak
    findings = []
    for number, line in enumerate(text.splitlines(), start=1):
        for match in HOME_PATH.finditer(line):
            if match.group(1).lower() not in GENERIC_NAMES:
                # Never echo the name itself: the report would become the leak.
                findings.append((number, "home-directory path naming a user"))
        for label, pattern in SECRETS:
            if pattern.search(line):
                findings.append((number, label))
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--github", action="store_true")
    args = parser.parse_args()

    total = 0
    for path in tracked_files():
        for number, label in scan(path):
            rel = path.relative_to(REPO_ROOT)
            total += 1
            print(f"::error file={rel},line={number}::{label}" if args.github else f"  LEAK  {rel}:{number}  {label}")

    if total:
        print(f"\n{total} leak(s) in tracked files. Redact with $HOME, ~ or a repo-relative path; "
              "rotate any real credential before removing it.")
        return 1
    print("No identity or secret leaks in tracked files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
