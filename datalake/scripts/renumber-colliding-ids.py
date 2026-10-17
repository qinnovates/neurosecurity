#!/usr/bin/env python3
"""
Renumber the two draft-only techniques whose IDs collide with the published catalogue.

On this line, QIF-T0172 and QIF-T0173 are an air-gap covert channel and a
peripheral silent-speech readout. On main (published: the site, /api/tara.json,
PyPI qtara 0.3.0) the same IDs are two EEG foundation-model attacks, and main
also holds QIF-T0174 to QIF-T0176. Published IDs are never renumbered
(QIF-DERIVATION-LOG: "QIF-T#### remains permanent"), so the draft entries move
to the next free IDs, QIF-T0177 and QIF-T0178. Decided by Kevin, 2026-10-16.

Deliberately not changed:
- datalake/intake/2026-10-06/: dated provenance records of the proposal.
- Earlier changelog entries: history. The mapping is added to the 4.3 entry.
- No legacy_ids alias: an alias "QIF-T0172" on the air-gap technique would
  collide again with main's QIF-T0172 in any alias resolver.

Usage:
  python3 datalake/scripts/renumber-colliding-ids.py --dry-run
  python3 datalake/scripts/renumber-colliding-ids.py
Then: python3 datalake/scripts/sync-package-data.py
"""

from __future__ import annotations

import json
import re
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RENUMBER = {"QIF-T0172": "QIF-T0177", "QIF-T0173": "QIF-T0178"}
ID_PATTERN = re.compile(r"\bQIF-T017[23]\b(?!-V)")
CHANGELOG_NOTES = [
    "QIF-T0172 renumbered QIF-T0177 (air-gap covert channel exfiltration): the ID is published on main for a different technique",
    "QIF-T0173 renumbered QIF-T0178 (peripheral silent-speech readout): the ID is published on main for a different technique",
]
REGISTRAR_FILES = ("datalake/qtara-registrar.json",)
JSON_FILES = ("datalake/tara-scoring-gaps.json", "datalake/research-registry.json")
TEXT_FILES = (
    "osi-of-mind/QIF-RESEARCH-SOURCES.md",
    "osi-of-mind/images/niss-risk-quadrant-v9.svg",
    "osi-of-mind/whitepapers/QIF-WHITEPAPER-V9.md",
    "osi-of-mind/whitepapers/QIF-WHITEPAPER-V9-COMPANION.md",
)
FIXTURE = "datalake/qtara/tests/fixtures/stix_ids.json"
# Prose whose meaning changes, rewritten before the word-level replacement runs.
PROSE_REWRITES = {
    "osi-of-mind/whitepapers/QIF-WHITEPAPER-V9.md": (
        "Two identifiers, QIF-T0172 and QIF-T0173, name different techniques in the two, and the two record sub-techniques differently.",
        "The draft's air-gap and silent-speech techniques were renumbered QIF-T0177 and QIF-T0178 on 2026-10-17, because QIF-T0172 and QIF-T0173 are published for different techniques; the two catalogues still record sub-techniques differently.",
    ),
    "osi-of-mind/whitepapers/QIF-WHITEPAPER-V9-COMPANION.md": (
        "The 38 without it are QIF-T0136 to QIF-T0173.",
        "The 38 without it are QIF-T0136 to QIF-T0171, QIF-T0177 and QIF-T0178.",
    ),
    "datalake/tara-scoring-gaps.json": (
        '"id_range": "QIF-T0061 to QIF-T0173"',
        '"id_range": "QIF-T0061 to QIF-T0171, QIF-T0177, QIF-T0178"',
    ),
}


class RenumberError(Exception):
    """The repository is not in the state this migration expects."""


def replace_ids(text: str) -> tuple[str, int]:
    """Replace whole-word QIF-T0172 / QIF-T0173 (not variant IDs)."""
    return ID_PATTERN.subn(lambda match: RENUMBER[match.group(0)], text)


def rewrite_prose(path: str, text: str) -> str:
    """Apply the single meaning-changing rewrite for this file, if any."""
    if path not in PROSE_REWRITES:
        return text
    old, new = PROSE_REWRITES[path]
    if new in text:
        return text
    if text.count(old) != 1:
        raise RenumberError(f"{path}: expected the sentence {old[:60]!r} once; the file has changed, update PROSE_REWRITES")
    return text.replace(old, new)


def replace_ids_outside_rewrites(text: str) -> tuple[str, int]:
    """Replace old IDs everywhere except inside rewritten sentences, which name them on purpose."""
    protected = [new for _, new in PROSE_REWRITES.values() if new in text]
    for index, sentence in enumerate(protected):
        text = text.replace(sentence, f"\x00PROTECTED{index}\x00")
    text, count = replace_ids(text)
    for index, sentence in enumerate(protected):
        text = text.replace(f"\x00PROTECTED{index}\x00", sentence)
    return text, count


def renumber_registrar(text: str) -> tuple[str, int]:
    """Renumber everywhere except earlier changelog entries, then record the mapping in the 4.3 entry."""
    registrar = json.loads(text)
    changelog = registrar.pop("changelog")
    body, count = replace_ids(json.dumps(registrar, ensure_ascii=False))
    renumbered = json.loads(body)
    changed = changelog[0].setdefault("changed", [])
    changed.extend(note for note in CHANGELOG_NOTES if note not in changed)
    ordered = {key: (changelog if key == "changelog" else renumbered[key]) for key in [*json.loads(text)]}
    return json.dumps(ordered, indent=2, ensure_ascii=False) + "\n", count


def renumber_fixture(text: str) -> tuple[str, int]:
    """Rename fixture keys and recompute their UUIDv5 STIX ids."""
    fixture = json.loads(text)
    patterns = fixture["attack_patterns"]
    count = 0
    for old, new in RENUMBER.items():
        if old in patterns:
            patterns.pop(old)
            patterns[new] = f"attack-pattern--{uuid.uuid5(uuid.NAMESPACE_DNS, f'qif.tara.{new}')}"
            count += 1
    return json.dumps(fixture, indent=2, ensure_ascii=False) + "\n", count


def transform(path: str, text: str) -> tuple[str, int]:
    """Return the migrated text of one file and how many IDs changed."""
    if path in REGISTRAR_FILES:
        return renumber_registrar(text)
    if path == FIXTURE:
        return renumber_fixture(text)
    return replace_ids_outside_rewrites(rewrite_prose(path, text))


def main(argv: list[str]) -> int:
    """Entry point. Returns a process exit code."""
    dry_run = "--dry-run" in argv
    for path in (*REGISTRAR_FILES, *JSON_FILES, *TEXT_FILES, FIXTURE):
        source = ROOT / path
        original = source.read_text(encoding="utf-8")
        migrated, count = transform(path, original)
        print(f"{path}: {count} id(s){' (unchanged)' if migrated == original else ''}")
        if not dry_run and migrated != original:
            source.write_text(migrated, encoding="utf-8")
    remaining = sum(len(ID_PATTERN.findall((ROOT / p).read_text(encoding="utf-8"))) for p in (*JSON_FILES, *TEXT_FILES))
    print(f"{'dry run: ' if dry_run else ''}remaining old IDs outside the registrar and intake: {remaining if not dry_run else 'n/a'}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except (RenumberError, OSError, json.JSONDecodeError, KeyError) as error:
        print(f"renumber-colliding-ids: failed: {error}", file=sys.stderr)
        sys.exit(2)
