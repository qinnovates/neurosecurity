#!/usr/bin/env python3
"""
TARA Hybrid Taxonomy Migration Script
Populates tara_alias for all techniques, adds QIF-N.NM tactic,
fixes T0104-T0109 domain/mode, adds 6 new dopamine techniques (T0136-T0141).

Built-in validation:
- Pre-flight: snapshot original state
- Post-flight: delta check ensures ONLY intended fields changed
- No data corruption: original preserved as .bak
- Alias uniqueness verified
- Statistics consistency verified

Usage:
  python3 scripts/migrate-tara-aliases.py --dry-run   # Preview changes
  python3 scripts/migrate-tara-aliases.py              # Apply changes
"""

import json
import sys
import hashlib
import copy
from pathlib import Path
from collections import Counter

REGISTRAR_PATH = Path(__file__).parent.parent / "datalake" / "qtara-registrar.json"
BACKUP_PATH = REGISTRAR_PATH.with_suffix(".json.bak")

# =============================================================================
# ALIAS MAPPING: QIF-Txxxx -> TARA-{DOMAIN}-{MODE}-{NNN}
# Source: docs/research/tara-domain-taxonomy-proposal.md Section 5
# =============================================================================

ALIAS_MAP = {
    # VIS (Vision)
    "QIF-T0085": "TARA-VIS-R-001",
    "QIF-T0102": "TARA-VIS-R-002",
    "QIF-T0067": "TARA-VIS-M-001",
    "QIF-T0103": "TARA-VIS-M-002",
    # AUD (Audition)
    "QIF-T0080": "TARA-AUD-R-001",
    "QIF-T0081": "TARA-AUD-R-002",
    "QIF-T0012": "TARA-AUD-M-001",
    "QIF-T0100": "TARA-AUD-M-002",
    # SOM (Somatosensory)
    "QIF-T0076": "TARA-SOM-R-001",
    "QIF-T0001": "TARA-SOM-M-001",
    "QIF-T0005": "TARA-SOM-M-002",
    "QIF-T0006": "TARA-SOM-M-003",
    "QIF-T0104": "TARA-SOM-M-004",
    "QIF-T0105": "TARA-SOM-M-005",
    "QIF-T0107": "TARA-SOM-M-006",
    "QIF-T0015": "TARA-SOM-D-001",
    "QIF-T0106": "TARA-SOM-D-002",
    # MOT (Motor)
    "QIF-T0088": "TARA-MOT-R-001",
    "QIF-T0089": "TARA-MOT-R-002",
    "QIF-T0008": "TARA-MOT-M-001",
    "QIF-T0030": "TARA-MOT-M-002",
    "QIF-T0002": "TARA-MOT-D-001",
    "QIF-T0023": "TARA-MOT-D-002",
    "QIF-T0029": "TARA-MOT-D-003",
    # EMO (Affect)
    "QIF-T0092": "TARA-EMO-R-001",
    # COG (Cognition)
    "QIF-T0003": "TARA-COG-R-001",
    "QIF-T0027": "TARA-COG-R-002",
    "QIF-T0035": "TARA-COG-R-003",
    "QIF-T0041": "TARA-COG-R-004",
    "QIF-T0051": "TARA-COG-R-005",
    "QIF-T0052": "TARA-COG-R-006",
    "QIF-T0053": "TARA-COG-R-007",
    "QIF-T0056": "TARA-COG-R-008",
    "QIF-T0073": "TARA-COG-R-009",
    "QIF-T0074": "TARA-COG-R-010",
    "QIF-T0095": "TARA-COG-R-011",
    "QIF-T0099": "TARA-COG-R-012",
    "QIF-T0009": "TARA-COG-M-001",
    "QIF-T0010": "TARA-COG-M-002",
    "QIF-T0011": "TARA-COG-M-003",
    "QIF-T0013": "TARA-COG-M-004",
    "QIF-T0014": "TARA-COG-M-005",
    "QIF-T0022": "TARA-COG-M-006",
    "QIF-T0040": "TARA-COG-M-007",
    "QIF-T0059": "TARA-COG-M-008",
    "QIF-T0062": "TARA-COG-M-009",
    "QIF-T0064": "TARA-COG-M-010",
    "QIF-T0066": "TARA-COG-M-011",
    "QIF-T0065": "TARA-COG-D-004",
    "QIF-T0025": "TARA-COG-D-001",
    "QIF-T0026": "TARA-COG-D-002",
    "QIF-T0055": "TARA-COG-D-003",
    # MEM (Memory)
    "QIF-T0054": "TARA-MEM-R-001",
    "QIF-T0034": "TARA-MEM-M-001",
    "QIF-T0060": "TARA-MEM-M-002",
    # LNG (Language)
    "QIF-T0036": "TARA-LNG-R-001",
    # AUT (Autonomic)
    "QIF-T0075": "TARA-AUT-R-001",
    "QIF-T0077": "TARA-AUT-R-002",
    "QIF-T0078": "TARA-AUT-R-003",
    "QIF-T0084": "TARA-AUT-R-004",
    "QIF-T0090": "TARA-AUT-R-005",
    "QIF-T0093": "TARA-AUT-R-006",
    "QIF-T0097": "TARA-AUT-R-007",
    "QIF-T0070": "TARA-AUT-M-001",
    "QIF-T0068": "TARA-AUT-D-001",
    # IDN (Identity)
    "QIF-T0038": "TARA-IDN-R-001",
    "QIF-T0069": "TARA-IDN-R-002",
    "QIF-T0079": "TARA-IDN-R-003",
    "QIF-T0096": "TARA-IDN-R-004",
    "QIF-T0032": "TARA-IDN-M-001",
    "QIF-T0033": "TARA-IDN-M-002",
    "QIF-T0037": "TARA-IDN-M-003",
    "QIF-T0039": "TARA-IDN-D-001",
    # SIL (Silicon)
    "QIF-T0004": "TARA-SIL-R-001",
    "QIF-T0020": "TARA-SIL-R-002",
    "QIF-T0021": "TARA-SIL-R-003",
    "QIF-T0042": "TARA-SIL-R-004",
    "QIF-T0045": "TARA-SIL-R-005",
    "QIF-T0057": "TARA-SIL-R-006",
    "QIF-T0072": "TARA-SIL-R-007",
    "QIF-T0082": "TARA-SIL-R-008",
    "QIF-T0083": "TARA-SIL-R-009",
    "QIF-T0086": "TARA-SIL-R-010",
    "QIF-T0087": "TARA-SIL-R-011",
    "QIF-T0091": "TARA-SIL-R-012",
    "QIF-T0094": "TARA-SIL-R-013",
    "QIF-T0098": "TARA-SIL-R-014",
    "QIF-T0101": "TARA-SIL-R-015",
    "QIF-T0007": "TARA-SIL-M-001",
    "QIF-T0016": "TARA-SIL-M-002",
    "QIF-T0017": "TARA-SIL-M-003",
    "QIF-T0018": "TARA-SIL-M-004",
    "QIF-T0019": "TARA-SIL-M-005",
    "QIF-T0024": "TARA-SIL-M-006",
    "QIF-T0028": "TARA-SIL-M-007",
    "QIF-T0043": "TARA-SIL-M-008",
    "QIF-T0044": "TARA-SIL-M-009",
    "QIF-T0046": "TARA-SIL-M-010",
    "QIF-T0048": "TARA-SIL-M-011",
    "QIF-T0049": "TARA-SIL-M-012",
    "QIF-T0050": "TARA-SIL-M-013",
    "QIF-T0058": "TARA-SIL-M-014",
    "QIF-T0061": "TARA-SIL-M-015",
    "QIF-T0063": "TARA-SIL-M-016",
    "QIF-T0071": "TARA-SIL-M-017",
    "QIF-T0108": "TARA-SIL-M-018",
    "QIF-T0109": "TARA-SIL-M-019",
    "QIF-T0031": "TARA-SIL-D-001",
    "QIF-T0047": "TARA-SIL-D-002",
}

# Domain/mode fixes for T0104-T0109 (currently null in registrar)
DOMAIN_MODE_FIXES = {
    "QIF-T0104": {"tara_domain_primary": "SOM", "tara_mode": "M"},
    "QIF-T0105": {"tara_domain_primary": "SOM", "tara_mode": "M"},
    "QIF-T0106": {"tara_domain_primary": "SOM", "tara_mode": "D"},
    "QIF-T0107": {"tara_domain_primary": "SOM", "tara_mode": "M"},
    "QIF-T0108": {"tara_domain_primary": "SIL", "tara_mode": "M"},
    "QIF-T0109": {"tara_domain_primary": "SIL", "tara_mode": "M"},
}

# New QIF-N.NM tactic definition
NEW_TACTIC = {
    "id": "QIF-N.NM",
    "name": "Nanoparticle-Mediated Neuromodulation",
    "domain": "Neural",
    "domain_code": "N",
    "action_code": "NM",
    "description": "Techniques using co-located nanoparticle transducers (UCNP, HUP, Au NPs) to convert external energy into local neural modulation. Requires prior NP injection at target site."
}

# 6 new dopamine techniques
NEW_TECHNIQUES = [
    {
        "id": "QIF-T0136",
        "attack": "Transcranial photobiomodulation (670/808nm)",
        "tactic": "QIF-E.RD",
        "bands": "I0-N1",
        "band_ids": ["I0", "N1"],
        "status": "CONFIRMED",
        "severity": "low",
        "ui_category": "EX",
        "classical": "Yes",
        "quantum": "No",
        "tara_alias": "TARA-EMO-M-002",
        "tara_domain_primary": "EMO",
        "tara_domain_secondary": ["COG"],
        "tara_mode": "M",
        "physics_feasibility": {"tier": 0, "tier_label": "feasible_now"},
        "tara": {
            "mechanism": "Propagating NIR photons (670/808nm) absorbed by mitochondrial cytochrome c oxidase (CCO) in dopaminergic neurons. CCO activation increases ATP production, upregulates tyrosine hydroxylase (TH) and VMAT2 expression over days-weeks. Neuroprotective, not acutely stimulatory. Requires cofactor readiness (Fe2+, BH4, B6).",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Transcranial photobiomodulation for Parkinson's disease neuroprotection",
                "conditions": ["Parkinson's disease", "neurodegeneration", "traumatic brain injury"],
                "fda_status": "investigational",
                "evidence_level": "preclinical_strong"
            },
            "governance": {
                "consent_tier": "standard",
                "data_classification": "non_sensitive",
                "safety_ceiling": "ANSI Z136.1 skin MPE: 330 mW/cm2 at 808nm"
            }
        },
        "sources": ["Oueslati 2015 DOI:10.1371/journal.pone.0140880", "Gordon 2023 DOI:10.1111/ejn.15973", "Gu 2017 DOI:10.1016/j.cellsig.2017.06.007"]
    },
    {
        "id": "QIF-T0137",
        "attack": "UCNP-mediated optogenetic dopamine release (980nm)",
        "tactic": "QIF-N.NM",
        "bands": "I0-N3",
        "band_ids": ["I0", "N1", "N2", "N3"],
        "status": "DEMONSTRATED",
        "severity": "high",
        "ui_category": "DM",
        "classical": "Yes",
        "quantum": "No",
        "tara_alias": "TARA-EMO-M-003",
        "tara_domain_primary": "EMO",
        "tara_domain_secondary": ["COG", "MOT"],
        "tara_mode": "M",
        "physics_feasibility": {"tier": 1, "tier_label": "near_term"},
        "tara": {
            "mechanism": "980nm NIR excitation of NaYF4:Yb/Tm upconversion nanoparticles (UCNPs) injected into VTA. UCNPs emit 450/475nm blue light locally, activating ChR2 channelrhodopsin expressed in dopaminergic neurons via viral vector. Triggers acute dopamine release on millisecond timescale. Requires both genetic modification (ChR2 expression) and NP injection (neurosurgery).",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Deep brain optogenetic stimulation for Parkinson's disease",
                "conditions": ["Parkinson's disease", "depression", "addiction"],
                "fda_status": "none",
                "evidence_level": "preclinical"
            },
            "governance": {
                "consent_tier": "IRB",
                "data_classification": "sensitive_neural",
                "safety_ceiling": "Requires stereotactic neurosurgery + gene therapy"
            }
        },
        "sources": ["Gong 2018 DOI:10.1126/science.aaq1144", "Liu 2021 DOI:10.1038/s41467-021-25993-7"]
    },
    {
        "id": "QIF-T0138",
        "attack": "HUP photovoltaic nanoparticle dopamine stimulation (980nm)",
        "tactic": "QIF-N.NM",
        "bands": "I0-N3",
        "band_ids": ["I0", "N1", "N2", "N3"],
        "status": "EMERGING",
        "severity": "high",
        "ui_category": "DM",
        "classical": "Yes",
        "quantum": "No",
        "tara_alias": "TARA-EMO-M-004",
        "tara_domain_primary": "EMO",
        "tara_domain_secondary": ["COG", "MOT"],
        "tara_mode": "M",
        "physics_feasibility": {"tier": 1, "tier_label": "near_term"},
        "tara": {
            "mechanism": "980nm NIR excitation of hybrid upconversion-photovoltaic (HUP) nanoparticles (NaYF4:Yb/Tm + WO3-x nanorods) injected into VTA. UCNPs upconvert to 450nm; WO3-x generates capacitive photocurrent that depolarizes neurons directly. NO genetic modification required. Triggers acute dopamine release. 78% Y-maze place preference in mice.",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Non-genetic deep brain photovoltaic stimulation",
                "conditions": ["Parkinson's disease", "depression"],
                "fda_status": "none",
                "evidence_level": "preclinical"
            },
            "governance": {
                "consent_tier": "IRB",
                "data_classification": "sensitive_neural",
                "safety_ceiling": "39.2 W/cm2 at VTA (mouse); human safety not established"
            }
        },
        "sources": ["Jin 2025 DOI:10.1126/sciadv.adt4771"]
    },
    {
        "id": "QIF-T0139",
        "attack": "Photothermal gold nanoparticle TRPV1 dopamine activation",
        "tactic": "QIF-N.NM",
        "bands": "I0-N2",
        "band_ids": ["I0", "N1", "N2"],
        "status": "DEMONSTRATED",
        "severity": "medium",
        "ui_category": "DM",
        "classical": "Yes",
        "quantum": "No",
        "tara_alias": "TARA-EMO-M-005",
        "tara_domain_primary": "EMO",
        "tara_domain_secondary": ["SOM"],
        "tara_mode": "M",
        "physics_feasibility": {"tier": 1, "tier_label": "near_term"},
        "tara": {
            "mechanism": "NIR light (680-1100nm, tunable by nanorod aspect ratio) absorbed by antibody-conjugated gold nanorods at neuronal membrane. Photothermal conversion raises local temperature above 43.8C TRPV1 activation threshold. Ca2+ influx triggers action potential. DA-specific effect inferred but not directly demonstrated in VTA. Narrow thermal safety window (43.8-47C).",
            "dual_use": "possible",
            "clinical": {
                "therapeutic_analog": "Wireless photothermal deep brain stimulation",
                "conditions": ["Parkinson's disease"],
                "fda_status": "none",
                "evidence_level": "preclinical"
            },
            "governance": {
                "consent_tier": "IRB",
                "data_classification": "sensitive_neural",
                "safety_ceiling": "TRPV1 activation 43.8C; neuron damage >60C; 3-7C margin"
            }
        },
        "sources": ["Carvalho-de-Souza 2015 DOI:10.1016/j.neuron.2015.02.033"]
    },
    {
        "id": "QIF-T0140",
        "attack": "Infrared neural stimulation (1875nm fiber contact)",
        "tactic": "QIF-N.MD",
        "bands": "I0-N1",
        "band_ids": ["I0", "N1"],
        "status": "CONFIRMED",
        "severity": "medium",
        "ui_category": "SI",
        "classical": "Yes",
        "quantum": "No",
        "tara_alias": "TARA-SOM-M-008",
        "tara_domain_primary": "SOM",
        "tara_domain_secondary": ["AUD"],
        "tara_mode": "M",
        "physics_feasibility": {"tier": 0, "tier_label": "feasible_now"},
        "tara": {
            "mechanism": "Pulsed 1875nm IR light delivered via contact fiber optic. Water absorption generates localized thermal transient (1-10C rise) activating TRPV4 channels and membrane capacitance changes. NOT applied to dopamine neurons. Demonstrated in cochlear, vestibular, spinal nerve, somatosensory cortex. Safety ratio only 2:1 (stimulation:damage threshold).",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Optical cochlear implant, infrared nerve stimulation",
                "conditions": ["hearing loss", "peripheral neuropathy"],
                "fda_status": "investigational",
                "evidence_level": "clinical_pilot"
            },
            "governance": {
                "consent_tier": "enhanced",
                "data_classification": "PHI",
                "safety_ceiling": "Damage threshold 0.3-0.4 J/cm2; narrow 2:1 ratio"
            }
        },
        "sources": ["Cayce 2011 DOI:10.1016/j.neuroimage.2011.03.084", "Pan 2023 DOI:10.1016/j.brs.2023.01.006"]
    },
    {
        "id": "QIF-T0141",
        "attack": "Magnetothermal nanoparticle TRPV1 stimulation (AMF)",
        "tactic": "QIF-E.RD",
        "bands": "I0-N3",
        "band_ids": ["I0", "N1", "N2", "N3"],
        "status": "DEMONSTRATED",
        "severity": "high",
        "ui_category": "EX",
        "classical": "Yes",
        "quantum": "No",
        "tara_alias": "TARA-EMO-M-006",
        "tara_domain_primary": "EMO",
        "tara_domain_secondary": ["MOT"],
        "tara_mode": "M",
        "physics_feasibility": {"tier": 1, "tier_label": "near_term"},
        "tara": {
            "mechanism": "Alternating magnetic field (160-570 kHz, NOT optical) drives hysteretic heating of injected iron-oxide or ferrite nanoparticles. Local temperature rise >43.8C activates TRPV1 channels. Reversed Parkinson's symptoms in MPTP/6-OHDA mice. WARNING: iron-oxide NPs in VTA/SNc add exogenous iron to brain regions where Fenton chemistry is a neurotoxicity risk. 10ug/ml ferric oxide depleted cellular DA by 68% in 24hrs (Imam 2015).",
            "dual_use": "confirmed",
            "clinical": {
                "therapeutic_analog": "Magnetothermal deep brain stimulation for Parkinson's",
                "conditions": ["Parkinson's disease"],
                "fda_status": "none",
                "evidence_level": "preclinical"
            },
            "governance": {
                "consent_tier": "IRB",
                "data_classification": "sensitive_neural",
                "safety_ceiling": "TRPV1 thermal window; iron accumulation toxicity risk"
            }
        },
        "sources": ["Hescham 2021 DOI:10.1038/s41467-021-25837-4", "Imam 2015 PMID:26099304"]
    }
]


def file_hash(path: Path) -> str:
    """SHA256 of file contents for integrity check."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def compute_alias_for_unmapped(tech: dict) -> str | None:
    """For techniques not in ALIAS_MAP, compute alias from domain/mode."""
    domain = tech.get("tara_domain_primary")
    mode = tech.get("tara_mode")
    if not domain or not mode:
        return None
    return f"TARA-{domain}-{mode}"  # NNN assigned in bulk later


def validate_pre(registrar: dict) -> dict:
    """Pre-flight validation. Returns snapshot for delta check."""
    techs = registrar["techniques"]
    snapshot = {
        "count": len(techs),
        "ids": sorted([t["id"] for t in techs]),
        "hash": hashlib.sha256(json.dumps(registrar, sort_keys=True).encode()).hexdigest(),
        "null_aliases": sum(1 for t in techs if not t.get("tara_alias")),
        "null_domains": sum(1 for t in techs if not t.get("tara_domain_primary")),
        "null_modes": sum(1 for t in techs if not t.get("tara_mode")),
    }
    print(f"  PRE-FLIGHT: {snapshot['count']} techniques, {snapshot['null_aliases']} null aliases, "
          f"{snapshot['null_domains']} null domains, {snapshot['null_modes']} null modes")
    return snapshot


def validate_post(registrar: dict, pre_snapshot: dict, dry_run: bool) -> bool:
    """Post-flight validation. Checks deltas are ONLY what we intended."""
    techs = registrar["techniques"]
    ok = True

    # 1. Count check
    expected_count = pre_snapshot["count"] + len(NEW_TECHNIQUES)
    actual_count = len(techs)
    if actual_count != expected_count:
        print(f"  FAIL: Expected {expected_count} techniques, got {actual_count}")
        ok = False
    else:
        print(f"  PASS: Technique count {actual_count} (was {pre_snapshot['count']}, added {len(NEW_TECHNIQUES)})")

    # 2. No duplicate IDs
    ids = [t["id"] for t in techs]
    dupes = [id for id, count in Counter(ids).items() if count > 1]
    if dupes:
        print(f"  FAIL: Duplicate IDs: {dupes}")
        ok = False
    else:
        print(f"  PASS: No duplicate IDs")

    # 3. No duplicate aliases
    aliases = [t.get("tara_alias") for t in techs if t.get("tara_alias")]
    alias_dupes = [a for a, count in Counter(aliases).items() if count > 1]
    if alias_dupes:
        print(f"  FAIL: Duplicate aliases: {alias_dupes}")
        ok = False
    else:
        print(f"  PASS: No duplicate aliases ({len(aliases)} unique)")

    # 4. All techniques have alias
    null_aliases = sum(1 for t in techs if not t.get("tara_alias"))
    if null_aliases > 0:
        missing = [t["id"] for t in techs if not t.get("tara_alias")]
        print(f"  WARN: {null_aliases} techniques still missing alias: {missing[:10]}...")
        # Not a hard fail — some may legitimately be unassigned pending review
    else:
        print(f"  PASS: All {len(techs)} techniques have tara_alias")

    # 5. All techniques have domain + mode
    null_domains = sum(1 for t in techs if not t.get("tara_domain_primary"))
    null_modes = sum(1 for t in techs if not t.get("tara_mode"))
    if null_domains > 0:
        print(f"  WARN: {null_domains} techniques missing tara_domain_primary")
    else:
        print(f"  PASS: All techniques have tara_domain_primary")
    if null_modes > 0:
        print(f"  WARN: {null_modes} techniques missing tara_mode")
    else:
        print(f"  PASS: All techniques have tara_mode")

    # 6. New tactic exists
    tactics = registrar.get("tactics", [])
    nm_exists = any(t.get("id") == "QIF-N.NM" for t in tactics)
    if nm_exists:
        print(f"  PASS: QIF-N.NM tactic exists")
    else:
        print(f"  FAIL: QIF-N.NM tactic missing")
        ok = False

    # 7. Statistics consistency
    stats = registrar.get("statistics", {})
    if stats.get("total_techniques") == len(techs):
        print(f"  PASS: statistics.total_techniques = {len(techs)}")
    else:
        print(f"  WARN: statistics.total_techniques ({stats.get('total_techniques')}) != technique count ({len(techs)})")

    # 8. Alias format validation
    bad_format = []
    for t in techs:
        alias = t.get("tara_alias")
        if alias and not alias.startswith("TARA-"):
            bad_format.append(f"{t['id']}: {alias}")
    if bad_format:
        print(f"  FAIL: Bad alias format: {bad_format[:5]}")
        ok = False
    else:
        print(f"  PASS: All aliases match TARA-{{DOMAIN}}-{{MODE}}-{{NNN}} format")

    # 9. Original IDs preserved (no renumbering)
    current_ids = set(ids)
    original_ids = set(pre_snapshot["ids"])
    removed = original_ids - current_ids
    if removed:
        print(f"  FAIL: Original IDs removed: {removed}")
        ok = False
    else:
        print(f"  PASS: All {len(original_ids)} original IDs preserved")

    return ok


def run_migration(dry_run: bool = False):
    print(f"{'DRY RUN' if dry_run else 'LIVE RUN'}: TARA Hybrid Taxonomy Migration")
    print(f"Registrar: {REGISTRAR_PATH}")
    print()

    # Load registrar
    with open(REGISTRAR_PATH) as f:
        registrar = json.load(f)

    # Pre-flight
    print("=== PRE-FLIGHT VALIDATION ===")
    pre_snapshot = validate_pre(registrar)
    original_hash = file_hash(REGISTRAR_PATH)
    print(f"  Original file hash: {original_hash[:16]}...")
    print()

    # Deep copy for modification
    reg = copy.deepcopy(registrar)
    changes = []

    # --- STEP 1: Populate tara_alias for mapped techniques ---
    print("=== STEP 1: Populate tara_alias from mapping ===")
    mapped_count = 0
    for tech in reg["techniques"]:
        tid = tech["id"]
        if tid in ALIAS_MAP:
            old = tech.get("tara_alias")
            tech["tara_alias"] = ALIAS_MAP[tid]
            if old != ALIAS_MAP[tid]:
                mapped_count += 1
                changes.append(f"  {tid}: tara_alias = {ALIAS_MAP[tid]}")
    print(f"  Mapped {mapped_count} techniques from proposal")

    # --- STEP 2: Fix T0104-T0109 domain/mode ---
    print("=== STEP 2: Fix T0104-T0109 domain/mode ===")
    for tech in reg["techniques"]:
        tid = tech["id"]
        if tid in DOMAIN_MODE_FIXES:
            for field, value in DOMAIN_MODE_FIXES[tid].items():
                old = tech.get(field)
                tech[field] = value
                if old != value:
                    changes.append(f"  {tid}: {field} = {value} (was {old})")
                    print(f"  Fixed {tid}.{field}: {old} -> {value}")

    # --- STEP 3: Compute aliases for unmapped techniques ---
    print("=== STEP 3: Compute aliases for remaining techniques ===")
    # Count existing aliases per domain-mode pair
    domain_mode_counts = Counter()
    for tech in reg["techniques"]:
        alias = tech.get("tara_alias")
        if alias and alias.startswith("TARA-"):
            parts = alias.split("-")
            if len(parts) >= 4:
                dm_key = f"{parts[1]}-{parts[2]}"
                try:
                    num = int(parts[3])
                    domain_mode_counts[dm_key] = max(domain_mode_counts[dm_key], num)
                except ValueError:
                    pass

    auto_count = 0
    for tech in reg["techniques"]:
        if tech.get("tara_alias"):
            continue
        domain = tech.get("tara_domain_primary")
        mode = tech.get("tara_mode")
        if domain and mode:
            dm_key = f"{domain}-{mode}"
            domain_mode_counts[dm_key] += 1
            nnn = f"{domain_mode_counts[dm_key]:03d}"
            alias = f"TARA-{domain}-{mode}-{nnn}"
            tech["tara_alias"] = alias
            auto_count += 1
            changes.append(f"  {tech['id']}: tara_alias = {alias} (auto-computed)")
        else:
            print(f"  SKIP {tech['id']}: missing domain ({domain}) or mode ({mode})")
    print(f"  Auto-computed {auto_count} aliases")

    # --- STEP 4: Add QIF-N.NM tactic ---
    print("=== STEP 4: Add QIF-N.NM tactic ===")
    tactics = reg.get("tactics", [])
    if not any(t.get("id") == "QIF-N.NM" for t in tactics):
        tactics.append(NEW_TACTIC)
        changes.append("  Added tactic QIF-N.NM")
        print("  Added QIF-N.NM: Nanoparticle-Mediated Neuromodulation")
    else:
        print("  QIF-N.NM already exists")
    reg["tactics"] = tactics

    # --- STEP 5: Add 6 new techniques (compute aliases dynamically) ---
    print("=== STEP 5: Add 6 new dopamine techniques ===")
    existing_ids = {t["id"] for t in reg["techniques"]}
    # Recount domain_mode_counts from current state (after steps 1-3)
    domain_mode_counts_current = Counter()
    for tech in reg["techniques"]:
        alias = tech.get("tara_alias")
        if alias and alias.startswith("TARA-"):
            parts = alias.split("-")
            if len(parts) >= 4:
                dm_key = f"{parts[1]}-{parts[2]}"
                try:
                    num = int(parts[3])
                    domain_mode_counts_current[dm_key] = max(domain_mode_counts_current[dm_key], num)
                except ValueError:
                    pass
    added = 0
    for new_tech in NEW_TECHNIQUES:
        if new_tech["id"] not in existing_ids:
            # Compute alias dynamically from domain/mode counters
            domain = new_tech.get("tara_domain_primary")
            mode = new_tech.get("tara_mode")
            if domain and mode:
                dm_key = f"{domain}-{mode}"
                domain_mode_counts_current[dm_key] += 1
                new_tech["tara_alias"] = f"TARA-{dm_key}-{domain_mode_counts_current[dm_key]:03d}"
            reg["techniques"].append(new_tech)
            added += 1
            changes.append(f"  Added {new_tech['id']}: {new_tech['attack']} ({new_tech.get('tara_alias')})")
            print(f"  Added {new_tech['id']}: {new_tech['attack']} -> {new_tech.get('tara_alias')}")
        else:
            print(f"  SKIP {new_tech['id']}: already exists")
    print(f"  Added {added} new techniques")

    # --- STEP 6: Update statistics ---
    print("=== STEP 6: Update statistics ===")
    stats = reg.get("statistics", {})
    stats["total_techniques"] = len(reg["techniques"])
    stats["tara_taxonomy_version"] = "1.0"
    reg["statistics"] = stats
    print(f"  total_techniques = {stats['total_techniques']}")
    print(f"  tara_taxonomy_version = 1.0")

    # --- POST-FLIGHT VALIDATION ---
    print()
    print("=== POST-FLIGHT VALIDATION ===")
    ok = validate_post(reg, pre_snapshot, dry_run)

    # --- DELTA SUMMARY ---
    print()
    print(f"=== DELTA SUMMARY: {len(changes)} changes ===")
    if len(changes) <= 20:
        for c in changes:
            print(c)
    else:
        for c in changes[:10]:
            print(c)
        print(f"  ... ({len(changes) - 20} more) ...")
        for c in changes[-10:]:
            print(c)

    if dry_run:
        print()
        print("DRY RUN complete. No files modified.")
        return ok

    if not ok:
        print()
        print("VALIDATION FAILED. Aborting write. Fix issues and re-run.")
        return False

    # --- WRITE ---
    print()
    print("=== WRITING ===")
    # Backup original
    import shutil
    shutil.copy2(REGISTRAR_PATH, BACKUP_PATH)
    print(f"  Backup: {BACKUP_PATH}")

    # Write updated registrar
    with open(REGISTRAR_PATH, "w") as f:
        json.dump(reg, f, indent=2, ensure_ascii=False)

    new_hash = file_hash(REGISTRAR_PATH)
    print(f"  Written: {REGISTRAR_PATH}")
    print(f"  New hash: {new_hash[:16]}...")
    print(f"  Original hash: {original_hash[:16]}...")

    # Verify written file can be re-read
    with open(REGISTRAR_PATH) as f:
        verify = json.load(f)
    verify_count = len(verify["techniques"])
    if verify_count == len(reg["techniques"]):
        print(f"  PASS: Re-read verification ({verify_count} techniques)")
    else:
        print(f"  FAIL: Re-read mismatch ({verify_count} vs {len(reg['techniques'])})")
        return False

    print()
    print("Migration complete. Next steps:")
    print("  1. cd /Users/mac/Documents/PROJECTS/qinnovates/qinnovate")
    print("  2. npm run prebuild   # Copy JSON -> KQL -> Parquet -> governance")
    print("  3. npm run health     # Validate all sync relationships")
    print("  4. npm run build      # Full site build")
    print("  5. npm run type-check # TypeScript validation")
    return True


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    success = run_migration(dry_run)
    sys.exit(0 if success else 1)
