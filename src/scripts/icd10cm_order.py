"""Read official ICD-10-CM titles from the CDC/NCHS order file.

The order file is not committed. Download the FY2027 code-descriptions zip from
CDC/NCHS, unzip it, and pass the path of `icd10cm-order-2027.txt`. The zip's
SHA-256 is recorded below so a reader can confirm they used the same release.

Order-file layout (fixed width, per CDC's icd10OrderFiles.pdf):
  cols 1-5 order number, 7-13 code without the dot, 15 header flag
  (0 = header / non-billable, 1 = valid for submission), 17-76 short title,
  78- long title.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

__all__ = ["SOURCE", "IcdEntry", "load_order_file", "dotted"]

SOURCE = {
    "publisher": "CDC/NCHS",
    "release": "ICD-10-CM FY2027",
    "url": "https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Publications/ICD10CM/2027/icd10cm-code-descriptions-2027.zip",
    "zip_sha256": "93e3ad6004badf470c55bfe679b748ae88fd9b2b421851e409eec382c7713b9a",
    "file": "icd10cm-order-2027.txt",
}

# FY2027 adds categories with a letter in the second position (for example QA0).
_CODE = re.compile(r"^[A-Z][0-9A-Z][0-9A-Z]{1,5}$")


@dataclass(frozen=True)
class IcdEntry:
    code: str
    title: str
    billable: bool

    @property
    def kind(self) -> str:
        return "billable" if self.billable else "category"


def dotted(raw_code: str) -> str:
    """'F200' -> 'F20.0'; three-character categories stay as they are."""
    return raw_code if len(raw_code) <= 3 else f"{raw_code[:3]}.{raw_code[3:]}"


def load_order_file(path: Path) -> dict[str, IcdEntry]:
    """Map dotted code -> IcdEntry for every line of the order file."""
    if path.name != SOURCE["file"]:
        raise ValueError(f"expected {SOURCE['file']}, got {path.name}")
    entries: dict[str, IcdEntry] = {}
    with path.open(encoding="latin-1") as handle:
        for line_number, line in enumerate(handle, start=1):
            raw_code = line[6:13].strip()
            flag = line[14:15]
            if not _CODE.match(raw_code) or flag not in ("0", "1"):
                raise ValueError(f"{path.name}:{line_number}: unexpected layout")
            code = dotted(raw_code)
            entries[code] = IcdEntry(code, line[77:].strip(), flag == "1")
    if len(entries) < 70000:
        raise ValueError(f"{path.name}: only {len(entries)} codes read; wrong file?")
    return entries
