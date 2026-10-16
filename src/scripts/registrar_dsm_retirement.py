"""Registrar step of migrate-icd10cm-codes-and-titles.py.

Corrects code titles in every technique's `tara.dsm5` / `tara.icd10` block and
retires `dsm5_spec.niss_dsm_bridge`, whose "each NISS metric maps to DSM
chapters" table and the sentence "NISS metrics predict diagnostic clusters"
contradict the guardrails: NISS scores technique impact, and DSM-5-TR names are
category references for threat modeling, not diagnostic claims.
"""

from __future__ import annotations

from icd_code_rules import ICD_CODE, ChangeLog, WILDCARD, new_code_and_title

__all__ = ["apply", "DSM5_SPEC_VERSION", "CHANGELOG_VERSION"]

DSM5_SPEC_VERSION = "1.1"
CHANGELOG_VERSION = "1.10"
CHANGE_DATE = "2026-10-16"

DESCRIPTION = (
    "Maps BCI techniques to DSM-5-TR diagnostic categories (ICD-10-CM chapter F codes) through the "
    "hourglass band model, for threat modeling purposes. These are diagnostic category references, "
    "not diagnostic claims. NISS is a separate score of technique impact (BI, CR, CD, CV, RV, NP); "
    "it does not predict diagnoses or diagnostic clusters."
)
POSITIONING = (
    "RDoC-aligned and BCI-specific category references to traditional nosology (DSM-5-TR), for "
    "threat modeling. NISS is not a bridge to diagnosis."
)
CLUSTER_NOTE = (
    "Each technique's tara.dsm5.cluster was assigned by datalake/scripts/populate-dsm5.py from band "
    "weights plus a NISS-vector bonus. It is a display grouping, not a prediction; whether NISS "
    "should remain an input is an open follow-up."
)


def _fix_entries(technique: dict, block: str, titles, log: ChangeLog) -> None:
    section = (technique.get("tara") or {}).get(block) or {}
    for rank in ("primary", "secondary"):
        for entry in section.get(rank, []):
            if not ICD_CODE.match(entry["code"]) and not WILDCARD.match(entry["code"]):
                log.skipped.append(f"{technique['id']} tara.{block}.{rank}: {entry['code']!r} is a range, left as is")
                continue
            code, title = new_code_and_title(entry["code"], entry.get("name"), titles)
            log.record("qtara-registrar.json", technique["id"], f"tara.{block}.{rank}",
                       entry["code"], code, entry.get("name"), title)
            entry["code"], entry["name"] = code, title


def _retire_bridge(registrar: dict) -> None:
    spec = registrar["dsm5_spec"]
    if "niss_dsm_bridge" not in spec:
        raise ValueError("dsm5_spec.niss_dsm_bridge is already absent; migration already applied?")
    rebuilt: dict = {}
    for key, value in spec.items():
        if key == "niss_dsm_bridge":
            continue
        rebuilt[key] = value
        if key == "positioning":
            rebuilt["cluster_note"] = CLUSTER_NOTE
    rebuilt["version"] = DSM5_SPEC_VERSION
    rebuilt["description"] = DESCRIPTION
    rebuilt["positioning"] = POSITIONING
    registrar["dsm5_spec"] = rebuilt
    registrar["statistics"]["tara"]["dsm5"]["version"] = DSM5_SPEC_VERSION


def _changelog_entry(log: ChangeLog) -> dict:
    rows = [row for row in log.rows if row["file"] == "qtara-registrar.json"]
    corrected = sorted({f"{row['before_code']} -> {row['after_code']}" for row in rows
                        if "correction" in row["kinds"]})
    retitled = sum(1 for row in rows if "title" in row["kinds"])
    return {
        "version": CHANGELOG_VERSION,
        "date": CHANGE_DATE,
        "title": "ICD-10-CM Code Titles and NISS-DSM Bridge Retirement",
        "summary": (
            "Retired dsm5_spec.niss_dsm_bridge and the wording 'NISS metrics predict diagnostic "
            "clusters': NISS scores technique impact (BI, CR, CD, CV, RV, NP), and DSM-5-TR names are "
            "category references for threat modeling, not diagnostic claims. Every tara.dsm5 and "
            "tara.icd10 entry now carries its code's official ICD-10-CM FY2027 title, and two swapped "
            "language-disorder codes were corrected."
        ),
        "added": [],
        "removed": [
            "dsm5_spec.niss_dsm_bridge - per-metric NISS-to-DSM-chapter table; its only reader was "
            "the /api/qif.json pass-through of dsm5_spec"
        ],
        "changed": [
            f"dsm5_spec.version {DSM5_SPEC_VERSION}: description and positioning reworded; "
            "cluster_note records that tara.dsm5.cluster used a NISS bonus",
            f"{retitled} tara.dsm5 / tara.icd10 entries retitled to the official ICD-10-CM FY2027 title",
            *[f"code corrected: {pair}" for pair in corrected],
        ],
    }


def apply(registrar: dict, titles, log: ChangeLog) -> None:
    for technique in registrar["techniques"]:
        _fix_entries(technique, "dsm5", titles, log)
        _fix_entries(technique, "icd10", titles, log)
    _retire_bridge(registrar)
    registrar["changelog"].append(_changelog_entry(log))
