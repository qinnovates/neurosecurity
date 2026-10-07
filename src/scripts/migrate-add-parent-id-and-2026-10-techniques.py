#!/usr/bin/env python3
"""Add the `parent_id` schema field and the approved 2026-10 refresh techniques.

Schema change
-------------
`techniques[].parent_id` holds the QIF-Txxxx id of the parent technique when an
entry is a sub-technique (child), and is `null`/absent for a top-level entry.
This replaces free-text "variant of ..." prose in `notes` with a queryable
relation, following the MITRE ATT&CK sub-technique and CWE Variant model.

Data change (decision panel option D3-B, as modified by its own condition that a
parent field be accepted; see datalake/intake/2026-10-06/decisions.md
"Exact disposition"):

  top-level NEW : R-078, R-079, R-080, R-085
  children      : R-081 -> QIF-T0019, R-082 -> QIF-T0041, R-083 -> QIF-T0109,
                  R-086 -> QIF-T0024, R-087 -> QIF-T0043
  held          : R-084 (surface-EMG RF source unresolved), R-088 (umbrella over
                  QIF-T0042/T0072/T0086/T0094)

Entries are taken verbatim from the staged proposal
datalake/intake/2026-10-06/tara-mapping.json (`candidates[].proposed_entry`),
except where this script records a deviation in DEVIATIONS below.

Usage: python3 src/scripts/migrate-add-parent-id-and-2026-10-techniques.py [--dry-run]
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
REGISTRAR = REPO / "datalake" / "qtara-registrar.json"
SDK_COPY = REPO / "datalake" / "qtara" / "src" / "qtara" / "data" / "qtara-registrar.json"
PROPOSAL = REPO / "datalake" / "intake" / "2026-10-06" / "tara-mapping.json"

# delta_ref -> (assigned id, parent_id or None)
ALLOCATION = {
    "R-078": ("QIF-T0166", None),
    "R-079": ("QIF-T0167", None),
    "R-080": ("QIF-T0168", None),
    "R-083": ("QIF-T0169", "QIF-T0109"),
    "R-085": ("QIF-T0170", None),
    "R-087": ("QIF-T0171", "QIF-T0043"),
    "R-081": ("QIF-T0172", "QIF-T0019"),
    "R-082": ("QIF-T0173", "QIF-T0041"),
    "R-086": ("QIF-T0174", "QIF-T0024"),
}

# Entries whose only source is the Bagley et al. 2026 review preprint
# (arXiv:2607.10451). Recorded as a sentence on the entry rather than as a new
# boolean field: this change adds exactly one schema field (parent_id), and the
# `preprint_only` flag belongs with the evidence rubric when that is adopted.
REVIEW_PREPRINT_ONLY = {"R-085", "R-086", "R-087"}
REVIEW_ONLY_SENTENCE = (
    " Evidence basis: review only. The sole source for this entry is the Bagley "
    "et al. 2026 review preprint (arXiv:2607.10451v1), which is not peer "
    "reviewed; no demonstration against a neural decoder or BCI pipeline was "
    "found. Status is capped at THEORETICAL on that basis."
)

# Deviations from the staged proposal, each recorded on the entry itself.
DEVIATIONS = {
    # Owner instruction: substituting a deployed decoder is invisible to the
    # subject (CV:I, not CV:P) and restoring a known-good model does not undo
    # decisions already taken on the substituted model's output (RV:P, not RV:T).
    # score/severity/pins below were produced by src/lib/niss-parser.ts
    # (scoreNiss, default weights), not by hand; the same scorer reproduced all
    # 139 stored registrar vectors with 0 mismatches before use.
    "R-087": {
        "niss_vector": "NISS:1.1/BI:L/CR:N/CD:H/CV:I/RV:P/NP:N",
        "niss_score": 4.7,
        "niss_severity": "medium",
        "niss_pins": False,
        "note_suffix": (
            " NISS vector revised from the originally proposed "
            "NISS:1.1/BI:L/CR:N/CD:H/CV:P/RV:T/NP:N (2.7) to "
            "NISS:1.1/BI:L/CR:N/CD:H/CV:I/RV:P/NP:N (4.7) on owner instruction: "
            "CV:I because substitution of a deployed decoder happens without the "
            "subject's knowledge and with no consent step they could refuse, and "
            "RV:P because restoring a known-good model does not undo decisions "
            "already acted on, nor user adaptation to the substituted behaviour. "
            "BI:L, CR:N, CD:H and NP:N are unchanged from the proposal."
        ),
    },
}

# R-082 is the one approved child with no `proposed_entry` in the staged
# proposal (it was staged as evidence-only). Built here from the parent entry
# QIF-T0041 and the single preprint the card rests on; flagged as authored in
# this migration rather than taken from the proposal.
R082_ENTRY = {
    "id": None,
    "attack": "Cross-encoder attribute leakage from released EEG foundation-model embeddings",
    "tactic": "QIF-M.SV",
    "bands": "S1–S2",
    "band_ids": ["S1", "S2"],
    "coupling": None,
    "access": None,
    "classical": None,
    "quantum": None,
    "sources": [
        "Tai J. 2026. Pretrained, Frozen, Still Leaking: Auditing Cross-Encoder "
        "Attribute Transfer in EEG Foundation Models. arXiv:2606.09189v1 "
        "(preprint; spectral attributes only; no identity or waveform recovery shown)"
    ],
    "status": "EMERGING",
    "severity": "medium",
    "ui_category": "DM",
    "notes": (
        "Embeddings released from a frozen EEG foundation encoder carry decodable "
        "signal attributes: an attribute decoder trained on one frozen encoder "
        "transferred to others (95% CI lower bound at least 0.081 over six "
        "directions), and DP-SGD at epsilon 4 and 8 left the channel essentially "
        "unchanged. The attributes shown are spectral, not personal traits: the "
        "author states the work does not show waveform exfiltration or identity "
        "recovery for held-out subjects, and inference of sensitive personal "
        "attributes from released embeddings is PROJECTED, not demonstrated. "
        "Entered as a child of QIF-T0041 (cognitive biometric inference) because "
        "the goal is the same and the representation-release stage is the new "
        "surface; the parent's status is unchanged. Evidence rests on a single "
        "single-author preprint (arXiv:2606.09189), so the status is capped at "
        "EMERGING. The same preprint reports membership inference as weak in this "
        "setting (LiRA AUC 0.50 to 0.70), which qualifies QIF-T0020. This entry "
        "was authored in the migration script, not taken from the staged proposal, "
        "which recorded this card as evidence-only; its NISS vector is therefore "
        "not one of the proposal's computed vectors."
    ),
    "legacy_ids": [],
    "legacy_technique_id": None,
    "niss": {
        "version": "1.1",
        # Read-only leakage of derived signal statistics: no tissue interaction
        # (BI:N), limited confidentiality effect because only spectral
        # attributes are shown (CR:L), nothing disrupted (CD:N), the subject has
        # no part in the later decoding (CV:I), no biological damage (RV:F) and
        # no pathway change (NP:N). Scored by src/lib/niss-parser.ts.
        "vector": "NISS:1.1/BI:N/CR:L/CD:N/CV:I/RV:F/NP:N",
        "score": 2.4,
        "severity": "low",
        "pins": False,
    },
    "cross_references": {
        "related_ids": ["QIF-T0041", "QIF-T0020", "QIF-T0021"],
        "secondary_tactics": [],
    },
    "tara": {
        "mechanism": (
            "Attribute inference from embeddings produced by a released frozen EEG "
            "foundation encoder, transferring across encoders without access to the "
            "original recordings"
        ),
        "dual_use": "silicon_only",
        "clinical": None,
        "governance": {
            "consent_tier": "enhanced",
            "monitoring": ["access_audit_log", "model_release_review", "purpose_limitation_enforcement"],
            "regulations": ["GDPR Art. 9", "HIPAA", "NIST CSF"],
            "data_classification": "sensitive_neural",
            "safety_ceiling": (
                "Attribute-leakage audit before releasing embeddings or a frozen "
                "encoder trained on neural recordings; DP-SGD at epsilon 4 to 8 is "
                "not a sufficient control per the source"
            ),
        },
        "engineering": {
            "coupling": [],
            "parameters": {
                "attacker_knowledge": "released frozen encoder plus a labelled reference set",
                "victim_queries": "none (embeddings or encoder are public)",
            },
            "hardware": ["public_foundation_encoder", "ML_inference_engine"],
            "detection": (
                "Not observable at the device; controls are pre-release leakage "
                "auditing and access logging at the model holder"
            ),
        },
        "dsm5": {
            "primary": [],
            "secondary": [],
            "risk_class": "none",
            "cluster": "non_diagnostic",
            "pathway": "S-domain only — software/silicon attack, no neural pathway",
            "niss_correlation": "Silicon-only technique — no diagnostic mapping",
        },
    },
    "cvss": None,
    "neurorights": {"affected": ["MP"], "cci": None},
    "regulatory": None,
    "physics_feasibility": None,
    "origin": {
        "category": "literature",
        "original_authors": ["Tai 2026"],
        "qif_contribution": "framework_mapping",
    },
    "tara_alias": None,
    "tara_domain_primary": "SIL",
    "tara_domain_secondary": [],
    "tara_mode": "R",
    "tara_enrichment_pending": True,
}

SCHEMA_EXTENSION = {
    "added": "2026-10-06",
    "description": (
        "Parent technique id for a sub-technique (child) entry. A child has its own "
        "QIF-Txxxx id, status, NISS vector and sources, and names a narrower "
        "behaviour within the parent's mechanism, following the MITRE ATT&CK "
        "sub-technique and CWE Variant model. Absent or null means the entry is "
        "top-level. Replaces free-text 'variant of ...' prose in notes with a "
        "queryable relation; exposed as the parent_id column of the TARA techniques "
        "KQL table."
    ),
    "format": {
        "parent_id": "QIF-Txxxx of the parent technique, or null for a top-level technique",
        "note": (
            "A child's status is independent of its parent's and must not be read as "
            "the parent's. Children are counted in statistics.total_techniques like "
            "any other entry; statistics.by_level reports the top-level/child split."
        ),
    },
}


def assign_alias(techniques: list[dict], entry: dict) -> str | None:
    """TARA-{DOMAIN}-{MODE}-{NNN}, sequential within the domain-mode pair.

    Computed from current registrar state per .claude/rules/registrar.md; never
    hardcoded in a technique definition.
    """
    domain = entry.get("tara_domain_primary")
    mode = entry.get("tara_mode")
    if not domain or not mode:
        return None
    used = set()
    for t in techniques:
        alias = t.get("tara_alias")
        if alias and alias.startswith(f"TARA-{domain}-{mode}-"):
            try:
                used.add(int(alias.rsplit("-", 1)[1]))
            except ValueError:
                continue
    nxt = max(used) + 1 if used else 1
    return f"TARA-{domain}-{mode}-{nxt:03d}"


def update_statistics(reg: dict, added: list[dict]) -> None:
    """Apply the delta for the added entries to the stored counters.

    The stored counters are incremented rather than recomputed from scratch:
    `by_niss_severity` and `by_origin` were generated upstream
    (qif-lab/src/config.py) with conventions a recompute here does not
    reproduce, so a full recompute would silently rewrite historical counts.
    `by_level` is new and is therefore computed over all entries.
    """
    techniques = reg["techniques"]
    stats = reg["statistics"]
    stats["total_techniques"] = len(techniques)

    def bump(key: str, values: list[str]) -> None:
        counter = Counter(stats.get(key, {}))
        counter.update(values)
        stats[key] = dict(counter)

    bump("by_tactic", [e["tactic"] for e in added])
    bump("by_status", [e["status"] for e in added])
    bump("by_severity", [e["severity"] for e in added])
    bump("by_ui_category", [e["ui_category"] for e in added])
    bump("by_niss_severity", [e["niss"]["severity"] for e in added if e.get("niss")])
    bump("by_origin", [e["origin"]["category"] for e in added if e.get("origin")])

    stats["by_level"] = {
        "top_level": sum(1 for t in techniques if not t.get("parent_id")),
        "child": sum(1 for t in techniques if t.get("parent_id")),
    }


def main() -> int:
    dry_run = "--dry-run" in sys.argv

    reg = json.loads(REGISTRAR.read_text())
    proposal = json.loads(PROPOSAL.read_text())
    techniques = reg["techniques"]
    existing_ids = {t["id"] for t in techniques}

    cards = {c["delta_ref"]: c for c in proposal["candidates"]}
    added: list[dict] = []

    for delta_ref, (new_id, parent_id) in ALLOCATION.items():
        if new_id in existing_ids:
            print(f"ERROR: {new_id} already exists in the registrar", file=sys.stderr)
            return 1
        if parent_id and parent_id not in existing_ids:
            print(f"ERROR: parent {parent_id} for {new_id} not found", file=sys.stderr)
            return 1

        if delta_ref == "R-082":
            entry = json.loads(json.dumps(R082_ENTRY))
        else:
            proposed = cards[delta_ref].get("proposed_entry")
            if not proposed:
                print(f"ERROR: no proposed_entry for {delta_ref}", file=sys.stderr)
                return 1
            entry = json.loads(json.dumps(proposed))

        entry["id"] = new_id
        entry["parent_id"] = parent_id

        deviation = DEVIATIONS.get(delta_ref)
        if deviation:
            entry["niss"]["vector"] = deviation["niss_vector"]
            entry["niss"]["score"] = deviation["niss_score"]
            entry["niss"]["severity"] = deviation["niss_severity"]
            entry["niss"]["pins"] = deviation["niss_pins"]
            entry["notes"] = entry["notes"].rstrip() + deviation["note_suffix"]

        if delta_ref in REVIEW_PREPRINT_ONLY:
            entry["notes"] = entry["notes"].rstrip() + REVIEW_ONLY_SENTENCE

        if parent_id:
            entry["notes"] = entry["notes"].rstrip() + (
                f" Recorded as a sub-technique of {parent_id} via parent_id: its status, "
                "NISS vector and sources are its own and do not restate the parent's."
            )

        entry["tara_alias"] = assign_alias(techniques, entry)
        techniques.append(entry)
        added.append(entry)
        existing_ids.add(new_id)

    update_statistics(reg, added)
    reg["schema_extensions"]["parent_id"] = SCHEMA_EXTENSION

    for e in added:
        print(
            f"  + {e['id']} parent={e.get('parent_id')} status={e['status']:12s} "
            f"alias={e['tara_alias']} niss={e['niss']['vector']} :: {e['attack'][:60]}"
        )
    print(f"\ntotal_techniques: {reg['statistics']['total_techniques']}")
    print(f"by_level: {reg['statistics']['by_level']}")

    if dry_run:
        print("\n--dry-run: nothing written")
        return 0

    payload = json.dumps(reg, indent=2, ensure_ascii=False) + "\n"
    REGISTRAR.write_text(payload)
    SDK_COPY.write_text(payload)
    print(f"\nwrote {REGISTRAR.relative_to(REPO)}")
    print(f"wrote {SDK_COPY.relative_to(REPO)} (SDK copy, registrar.md step 9)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
