"""Code-replacement rules for migrate-icd10cm-codes-and-titles.py."""

from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass, field

from icd10cm_order import IcdEntry

__all__ = ["WILDCARD", "ICD_CODE", "CODE_CORRECTIONS", "is_chapter_f", "new_code_and_title", "ChangeLog"]

# `F20.x` -> F20, `F43.1x` -> F43.1, `G47.0x` -> G47.0. The `x` is notation, not a code.
WILDCARD = re.compile(r"^([A-Z]\d{2}(?:\.[0-9A-Z]{1,3})?)\.?x$")
# A single code (not a block range such as "F10-F19", which has no order-file title).
ICD_CODE = re.compile(r"^[A-Z][0-9A-Z]{2}(?:\.[0-9A-Z]{1,4})?$")

# (code as written, label as written) -> code that the label names.
# Only where the label names a condition that has its own ICD-10-CM code and
# the written code means a different condition (titles from the FY2027 order file):
#   G99.0 "Autonomic neuropathy in diseases classified elsewhere" vs G90.4 "Autonomic dysreflexia"
#   N94.3 "Premenstrual tension syndrome" vs F32.81 "Premenstrual dysphoric disorder"
#   T85.730A "... ventricular intracranial (communicating) shunt ..." vs T85.731A "... neurostimulator of brain ..."
#   F80.1 is "Expressive language disorder"; F80.2 is "Mixed receptive-expressive language disorder"
CODE_CORRECTIONS: dict[tuple[str, str], str] = {
    ("G99.0", "Autonomic dysreflexia"): "G90.4",
    ("N94.3", "Premenstrual dysphoric disorder (PMDD)"): "F32.81",
    ("T85.730A", "Infection and inflammatory reaction due to implanted electronic "
                 "neurostimulator of brain electrode"): "T85.731A",
    ("F80.2", "Expressive Language Disorder"): "F80.1",
    ("F80.1", "Receptive Language Disorder"): "F80.2",
}


def is_chapter_f(code: str) -> bool:
    """ICD-10-CM chapter 5 (Mental, behavioral and neurodevelopmental) is F01-F99."""
    return code.startswith("F")


def new_code_and_title(code: str, label: str | None, titles: dict[str, IcdEntry]) -> tuple[str, str]:
    match = WILDCARD.match(code)
    if match:
        new_code = match.group(1)
    else:
        new_code = CODE_CORRECTIONS.get((code, label or ""), code)
    entry = titles.get(new_code)
    if entry is None:
        raise KeyError(f"{new_code} (written {code!r}) is not in the ICD-10-CM order file")
    return new_code, entry.title


@dataclass
class ChangeLog:
    rows: list[dict] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)

    def record(self, file: str, record: object, target_field: str, before_code: str, after_code: str,
               before_title: str | None, after_title: str) -> None:
        kinds = []
        if WILDCARD.match(before_code):
            kinds.append("wildcard")
        elif before_code != after_code:
            kinds.append("correction")
        if target_field == "icd10_conditions":
            kinds.append("moved")
        if before_title is not None and before_title != after_title:
            kinds.append("title")
        if not kinds:
            return
        self.rows.append({
            "file": file, "record": record, "field": target_field, "kinds": kinds,
            "before_code": before_code, "after_code": after_code,
            "before_title": before_title, "after_title": after_title,
        })

    def summary(self) -> str:
        counts = Counter(kind for row in self.rows for kind in row["kinds"])
        by_file = Counter(row["file"] for row in self.rows)
        lines = [f"{len(self.rows)} changed code entries"]
        lines += [f"  {kind}: {count}" for kind, count in sorted(counts.items())]
        lines += [f"  {name}: {count}" for name, count in sorted(by_file.items())]
        lines += [f"  skipped: {note}" for note in self.skipped]
        return "\n".join(lines)
