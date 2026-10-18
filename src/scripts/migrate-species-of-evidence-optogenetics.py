#!/usr/bin/env python3
"""Record species and preparation on the three memory/optogenetics entries, and fix one misattributed citation.

Why this migration exists
-------------------------
The seven evidence tiers in `src/lib/evidence-tiers.ts` grade evidence
STRENGTH only. `demonstrated_lab` renders as "Demonstrated" and carries no
organism, so an effect obtained in a mouse, an effect obtained in a vinegar fly
and an effect obtained in a person are indistinguishable once tagged. Three
registrar entries rest entirely on animal evidence while carrying the
registrar's highest cognitive metric values, and nothing in the record says so.

Two options were available: move a tier so that it encodes species, or record
the species in its own field. The first corrupts the strength scale -- there is
no rung for "demonstrated, in a fly" and inventing one would change what every
other entry's tier means. So the tier is left exactly as
`migrate-populate-evidence-tier.py` derived it, and two new descriptive fields
are written on `tara.clinical`, beside the `evidence_level` field that already
grades the therapeutic analog. Neither new field is scored and neither changes
`evidence.tier`, `niss` or `severity`.

Entries touched (no new ids; no technique added or removed)
-----------------------------------------------------------
QIF-T0137  UCNP-mediated optogenetic dopamine release (980nm)
QIF-T0054  Memory extraction
QIF-T0060  Memory implant (cross-session persistence)
QIF-H0004  the non-adversarial hazard pointer at QIF-T0137

Citation correction
-------------------
QIF-T0137 listed "Gong 2018 DOI:10.1126/science.aaq1144". That DOI resolves to
Chen S, Weitemier AZ, Zeng X and fifteen co-authors, Science 359:679-684, 2018.
No author named Gong appears in the author list Crossref returns. A real DOI
carrying the wrong author is the failure mode the project's citation gate
exists to catch, so the attribution is corrected here. Verified at Crossref in
the 2026-10-17 intake batch and recorded in `datalake/intake/ledger.json`.

QIF-T0054's clinical sources listed "Ngo et al. 2013 (Neuron, sleep memory
consolidation)" with no DOI. It was not resolved in either intake pass, so it
is marked unverified in place rather than deleted or quietly relied on.

Deliberate non-changes
----------------------
No NISS vector is recomputed. The 2026-10-17 batch proposed a vector for
QIF-T0137 that would lower its public severity from high to medium; that
proposal names the chain-builder alias join as a prerequisite and is not
landed here.

No brain region, pathway or impact chain is added. The engram literature's
primary target, the dentate gyrus, has no region in
`datalake/qif-brain-bci-atlas.json`, and the atlas's own alias scheme would
only let it be joined as `part_to_whole` onto `hippocampus` -- which
Redondo et al. 2014 is the direct argument against, since the valence switch
they obtained in the dentate gyrus did NOT occur in the basolateral amygdala.
Collapsing a sub-structure-specific result into the whole structure is how a
finding gets inverted. The gap is reported instead of papered over.

Source text rule followed here
------------------------------
Every string written by this migration is free of words the atlas knows for a
brain structure, so that no new candidate appears in
`datalake/scripts/technique-region-curation.json`. Citations are written as
author, year, venue and DOI without titles for the same reason; the full titles
live in `osi-of-mind/QIF-RESEARCH-SOURCES.md`.

Usage: python3 src/scripts/migrate-species-of-evidence-optogenetics.py [--dry-run]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
REGISTRAR = REPO / "datalake" / "qtara-registrar.json"
SDK_COPY = REPO / "datalake" / "qtara" / "src" / "qtara" / "data" / "qtara-registrar.json"
HAZARDS = REPO / "datalake" / "qif-hazards.json"

CHANGE_DATE = "2026-10-18"
CHANGELOG_VERSION = "1.12"

SCHEMA_EXTENSIONS = {
    "species_of_evidence": {
        "added": CHANGE_DATE,
        "description": (
            "The species the entry's causal evidence comes from, and what that work required to obtain it, "
            "written on tara.clinical beside evidence_level. Added because the seven evidence tiers in "
            "src/lib/evidence-tiers.ts grade evidence strength only: demonstrated_lab displays as "
            "'Demonstrated' and names no organism, so an animal-only result is indistinguishable from a "
            "human one once tagged. Moving a tier to encode species would change what every other entry's "
            "tier means, so the species is recorded in its own field and evidence.tier is left as derived."
        ),
        "format": {
            "species_of_evidence": (
                "The organism or organisms the causal evidence comes from, with an explicit statement of "
                "whether a human equivalent is established. Absent where no species applies."
            ),
            "preparation": (
                "What the cited work required to obtain the effect: genetic modification, injected agent, "
                "implanted hardware, surgical access, or none. Absent where no species applies."
            ),
            "note": (
                "Neither field is scored. Neither changes evidence.tier, niss or severity. An entry naming a "
                "non-human species has no demonstrated human analogue unless the entry says so."
            ),
        },
    }
}

# --- QIF-T0137 -------------------------------------------------------------

T0137_SOURCES = [
    "Chen et al. 2018 (Science 359:679-684) DOI:10.1126/science.aaq1144",
    "Liu et al. 2021 (Nature Communications 12:5662) DOI:10.1038/s41467-021-25993-7",
]

T0137_SPECIES = (
    "Mouse. The causal evidence for this mechanism is rodent. No human application of this technique is "
    "established: the only published human use of a light-gated channel is in the eye, by intravitreal viral "
    "delivery for vision, and the two trials recorded in this project's sources disagree on benefit "
    "(Bunnell et al. 2026 reports no evidence of efficacy; Han et al. 2026 reports a small open-label "
    "improvement). Neither is a nervous-system application and neither concerns memory."
)

T0137_PREPARATION = (
    "Genetic modification so the chosen cells express a light-gated channel, plus injection of an "
    "upconversion nanoparticle population, plus an external near-infrared source. Both the genetic step and "
    "the injection are physically invasive procedures, and the gene delivery is not undone by a software "
    "update. No human preparation for this technique exists."
)

T0137_GOVERNANCE_GAP = (
    "The binding control on this mechanism is custody of the gene-delivery step, which sits with gene-therapy "
    "and institutional biosafety oversight rather than with device security. No neurosecurity framework, this "
    "one included, governs that handoff, and QIF asserts no coverage of it."
)

# --- QIF-T0054 -------------------------------------------------------------

T0054_CLINICAL_SOURCES = [
    "Ramirez et al. 2013 (Science 341:387-391) DOI:10.1126/science.1239073",
    "Liu et al. 2012 (Nature 484:381-385) DOI:10.1038/nature11028",
    "Shao et al. 2026 (PLOS Biology 24:e3003886) DOI:10.1371/journal.pbio.3003886",
    "Moore et al. 2026 (Nature 657:724-734) DOI:10.1038/s41586-026-10879-9",
    "Ngo et al. 2013 (Neuron) -- DOI not resolved in the 2026-10-17 or 2026-10-18 intake pass; unverified, "
    "retained for provenance and relied on for nothing",
]

T0054_SPECIES = (
    "Mouse, and for the 2025-2026 results Drosophila melanogaster. Every causal result behind this entry is "
    "from a laboratory animal under conditions no deployed interface has. No read-out of memory content has "
    "been demonstrated in any species. The nearest human work used electrical stimulation of surgically "
    "resected tissue and measured how strongly groups of cells fired together, plus which genes changed, not "
    "what was remembered (Moore et al. 2026). The demonstrated route to a false memory in a person is "
    "misinformation delivered through ordinary perception (Shao et al. 2026, n=100), which is a social and "
    "informational channel, not a neural one."
)

T0054_PREPARATION = (
    "The animal work requires an activity-dependent transgenic background, viral delivery of a light-gated "
    "channel and an implanted light guide, or in the fly work whole-animal illumination of a transparent "
    "insect. The human study required tissue removed during clinically indicated surgery. None of these is a "
    "preparation that can be arrived at through a device interface."
)

T0054_NOTES_SUFFIX = (
    " Evidence status: every causal result behind this entry is from laboratory animals, and no human "
    "equivalent is established; see tara.clinical.species_of_evidence."
)

# --- QIF-T0060 -------------------------------------------------------------

T0060_CLINICAL_SOURCES_ADDED = [
    "Ohkawa et al. 2015 (Cell Reports 11:261-269) DOI:10.1016/j.celrep.2015.03.017",
    "Redondo et al. 2014 (Nature 513:426-430) DOI:10.1038/nature13725",
    "Tumkaya et al. 2025 (iScience 28:113540) DOI:10.1016/j.isci.2025.113540",
    "Yang et al. 2026 (Nature Neuroscience 29:2204-2213) DOI:10.1038/s41593-026-02381-2",
    "Hu et al. 2026 (Neuron 114:759-773.e5) DOI:10.1016/j.neuron.2025.12.031",
]

T0060_SPECIES = (
    "Mouse, and for the 2025-2026 results Drosophila melanogaster. What the animal work demonstrates is the "
    "artificial formation or re-valuing of an ASSOCIATION between things the animal had already stored, not "
    "the insertion of an experience: Ohkawa et al. 2015 state that the information they linked was already "
    "stored and that the link was made by activating two groups of cells at the same time. Direction matters "
    "in three places. Redondo et al. 2014 obtained a valence switch at one site and NOT at the neighbouring "
    "one. Hu et al. 2026 report that driving a second group of cells causes forgetting while 'learned "
    "information remains unperturbed', which is availability and not integrity. Yang et al. 2026 produced a "
    "false memory in flies by manipulating reminder cues rather than by writing with light, and their own "
    "control found that activating the circuit during reminders in untrained flies induced nothing at all. No "
    "human equivalent of any of this is established."
)

T0060_PREPARATION = (
    "Transgenic animals, viral delivery of a light-gated channel, and either an implanted light guide in the "
    "rodent work or whole-animal illumination in the fly work; several of the fly gating experiments used "
    "whole-animal heating rather than light. The human sources cited on this entry are behavioural sleep "
    "studies with no genetic step and no implant, and they do not show content being written."
)

# --- QIF-H0004 -------------------------------------------------------------

H0004_DESCRIPTION = (
    "Pointer entry. The registrar holds QIF-T0137 as a technique, but the text recorded for it describes a "
    "research method that needs gene delivery and a nanoparticle injection, with no adversary and no access "
    'model. Deciding sentence in the entry: "Requires both genetic modification (ChR2 expression) and NP '
    'injection (neurosurgery)." QIF-T0137 has not been moved or edited for this, and the technique count is '
    "unchanged. The two sources now listed here were resolved at Crossref in the 2026-10-17 intake batch, "
    "which also found that the attribution previously carried on QIF-T0137 named the wrong first author; "
    "resolving a citation establishes that the paper exists and who wrote it, and this entry still asserts "
    "nothing about effect size, incidence or outcome in people. The evidence is rodent. Band tags are carried "
    "over from QIF-T0137 without review."
)

H0004_SOURCES = list(T0137_SOURCES)


def changelog_entry() -> dict:
    return {
        "version": CHANGELOG_VERSION,
        "date": CHANGE_DATE,
        "title": "Species and preparation on the memory and optogenetics entries, and one citation correction",
        "summary": (
            "The evidence tiers grade strength and name no organism, so three entries resting entirely on "
            "animal evidence read as simply 'Demonstrated'. Two descriptive fields, species_of_evidence and "
            "preparation, are added on tara.clinical for QIF-T0137, QIF-T0054 and QIF-T0060, stating the "
            "species, what the cited work required, and whether a human equivalent is established. No tier, "
            "NISS vector or severity changes. QIF-T0137's first source is corrected from 'Gong 2018' to "
            "Chen et al. 2018 for DOI:10.1126/science.aaq1144, which carries no author named Gong. No "
            "technique is added or removed; the count stays at 176."
        ),
        "added": [],
        "changed": [
            "QIF-T0137 sources: 'Gong 2018' corrected to 'Chen et al. 2018 (Science 359:679-684)'",
            "QIF-T0137 tara.clinical: species_of_evidence and preparation added (mouse; no human application)",
            "QIF-T0137 tara.governance: governance_gap added, naming gene-delivery custody as out of QIF scope",
            "QIF-T0054 tara.clinical: species_of_evidence and preparation added (mouse and Drosophila)",
            "QIF-T0054 tara.clinical.sources: DOIs attached; the unresolved Ngo 2013 entry marked unverified",
            "QIF-T0054 notes: evidence-status sentence appended",
            "QIF-T0060 tara.clinical: species_of_evidence and preparation added, with the three result "
            "directions that invert if dropped",
            "QIF-T0060 tara.clinical.sources: five verified DOIs added for the artificial-association line",
        ],
        "enrichments": [
            "tara.clinical.species_of_evidence -- organism the causal evidence comes from",
            "tara.clinical.preparation -- what the cited work required to obtain the effect",
        ],
        "therapeutic_highlights": [
            "An animal-only result can no longer be read as a human-demonstrated one on these three entries",
            "The therapeutic analogues on all three entries are unchanged; only the species record is added",
        ],
    }


def enrich_t0137(technique: dict) -> None:
    technique["sources"] = list(T0137_SOURCES)
    clinical = technique["tara"]["clinical"]
    clinical["species_of_evidence"] = T0137_SPECIES
    clinical["preparation"] = T0137_PREPARATION
    technique["tara"]["governance"]["governance_gap"] = T0137_GOVERNANCE_GAP


def enrich_t0054(technique: dict) -> None:
    clinical = technique["tara"]["clinical"]
    clinical["sources"] = list(T0054_CLINICAL_SOURCES)
    clinical["species_of_evidence"] = T0054_SPECIES
    clinical["preparation"] = T0054_PREPARATION
    if T0054_NOTES_SUFFIX.strip() not in technique["notes"]:
        technique["notes"] = technique["notes"].rstrip() + T0054_NOTES_SUFFIX


def enrich_t0060(technique: dict) -> None:
    clinical = technique["tara"]["clinical"]
    existing = list(clinical.get("sources", []))
    for citation in T0060_CLINICAL_SOURCES_ADDED:
        if citation not in existing:
            existing.append(citation)
    clinical["sources"] = existing
    clinical["species_of_evidence"] = T0060_SPECIES
    clinical["preparation"] = T0060_PREPARATION


ENRICHMENTS = {
    "QIF-T0137": enrich_t0137,
    "QIF-T0054": enrich_t0054,
    "QIF-T0060": enrich_t0060,
}


def main() -> int:
    dry_run = "--dry-run" in sys.argv

    registrar = json.loads(REGISTRAR.read_text())
    by_id = {t["id"]: t for t in registrar["techniques"]}

    missing = [tid for tid in ENRICHMENTS if tid not in by_id]
    if missing:
        print(f"ERROR: ids not in registrar: {missing}", file=sys.stderr)
        return 1
    if any(entry.get("version") == CHANGELOG_VERSION for entry in registrar["changelog"]):
        print(f"ERROR: changelog {CHANGELOG_VERSION} already present; migration already applied?", file=sys.stderr)
        return 1

    for tid, enrich in ENRICHMENTS.items():
        enrich(by_id[tid])
        print(f"  enriched {tid} [{by_id[tid]['status']}] tier={by_id[tid]['evidence']['tier']} (tier unchanged)")

    registrar["schema_extensions"].update(SCHEMA_EXTENSIONS)
    registrar["changelog"].append(changelog_entry())

    hazards = json.loads(HAZARDS.read_text())
    hazard = next((h for h in hazards["hazards"] if h["id"] == "QIF-H0004"), None)
    if hazard is None:
        print("ERROR: QIF-H0004 not in datalake/qif-hazards.json", file=sys.stderr)
        return 1
    hazard["description"] = H0004_DESCRIPTION
    hazard["sources"] = list(H0004_SOURCES)
    print(f"  enriched QIF-H0004 ({len(hazard['sources'])} verified sources attached)")

    if dry_run:
        print("\n--dry-run: nothing written")
        return 0

    payload = json.dumps(registrar, indent=2, ensure_ascii=False) + "\n"
    REGISTRAR.write_text(payload)
    SDK_COPY.write_text(payload)
    HAZARDS.write_text(json.dumps(hazards, indent=2, ensure_ascii=False) + "\n")
    print(f"\nwrote {REGISTRAR.relative_to(REPO)}")
    print(f"wrote {SDK_COPY.relative_to(REPO)} (SDK copy, registrar.md step 9)")
    print(f"wrote {HAZARDS.relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
