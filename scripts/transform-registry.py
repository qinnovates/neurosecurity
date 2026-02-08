#!/usr/bin/env python3
"""
Transform threat-registry.json to QIF Locus Taxonomy + QNIS v1.0 scoring.

This script:
1. Replaces MITRE-derived tactic IDs with QIF Locus Taxonomy IDs
2. Renumbers all technique IDs from QIF-T2xxx to QIF-T0001+
3. Adds QNIS v1.0 scoring vectors and base scores
4. Removes all MITRE references
5. Updates statistics
"""

import json
import math
from pathlib import Path
from datetime import datetime

# ============================================================
# QIF LOCUS TAXONOMY — 11 Tactics
# ============================================================
LOCUS_TACTICS = [
    {
        "id": "QIF-N.SC",
        "name": "Neural Scan",
        "domain": "Neural",
        "domain_code": "N",
        "action_code": "SC",
        "description": "Profiling neural signals, mapping BCI topology, fingerprinting devices and neural activity patterns.",
        "legacy_ids": ["TA0043"],
        "legacy_name": "Reconnaissance"
    },
    {
        "id": "QIF-B.IN",
        "name": "BCI Intrusion",
        "domain": "BCI System",
        "domain_code": "B",
        "action_code": "IN",
        "description": "Gaining initial access to a BCI system or neural pathway via electrodes, RF, firmware, or supply chain.",
        "legacy_ids": ["TA0001"],
        "legacy_name": "Initial Access"
    },
    {
        "id": "QIF-N.IJ",
        "name": "Neural Injection",
        "domain": "Neural",
        "domain_code": "N",
        "action_code": "IJ",
        "description": "Injecting malicious signals at the electrode-tissue boundary or into the BCI data pipeline.",
        "legacy_ids": ["TA0002"],
        "legacy_name": "Execution"
    },
    {
        "id": "QIF-C.IM",
        "name": "Cognitive Imprinting",
        "domain": "Cognitive",
        "domain_code": "C",
        "action_code": "IM",
        "description": "Maintaining foothold across BCI sessions via calibration poisoning, learned neural patterns, or memory implants.",
        "legacy_ids": ["TA0003"],
        "legacy_name": "Persistence"
    },
    {
        "id": "QIF-B.EV",
        "name": "BCI Evasion",
        "domain": "BCI System",
        "domain_code": "B",
        "action_code": "EV",
        "description": "Avoiding detection by QI coherence metrics, anomaly detectors, and safety mechanisms.",
        "legacy_ids": ["TA0005"],
        "legacy_name": "Defense Evasion"
    },
    {
        "id": "QIF-D.HV",
        "name": "Data Harvest",
        "domain": "Data",
        "domain_code": "D",
        "action_code": "HV",
        "description": "Harvesting neural data, cognitive states, memory patterns, ERP responses, and biometric signatures.",
        "legacy_ids": ["TA0009"],
        "legacy_name": "Collection"
    },
    {
        "id": "QIF-P.DS",
        "name": "Physiological Disruption",
        "domain": "Physiological",
        "domain_code": "P",
        "action_code": "DS",
        "description": "Disrupting neural function, causing physical harm, denying BCI service, or weaponizing motor output.",
        "legacy_ids": ["TA0040"],
        "legacy_name": "Impact"
    },
    {
        "id": "QIF-N.MD",
        "name": "Neural Modulation",
        "domain": "Neural",
        "domain_code": "N",
        "action_code": "MD",
        "description": "Direct neural state modification via stimulation, entrainment, or signal injection. No traditional cybersecurity equivalent.",
        "legacy_ids": ["TA0050", "QIF-TA0050"],
        "legacy_name": "Neural Manipulation"
    },
    {
        "id": "QIF-C.EX",
        "name": "Cognitive Exploitation",
        "domain": "Cognitive",
        "domain_code": "C",
        "action_code": "EX",
        "description": "Exploiting cognitive processes including memory, attention, identity, and agency. No traditional cybersecurity equivalent.",
        "legacy_ids": ["TA0051", "QIF-TA0051"],
        "legacy_name": "Cognitive Exploitation"
    },
    {
        "id": "QIF-E.RD",
        "name": "Energy Radiation",
        "domain": "Energy",
        "domain_code": "E",
        "action_code": "RD",
        "description": "EM/RF attacks on neural tissue or BCI hardware via frequency-domain coupling. No traditional cybersecurity equivalent.",
        "legacy_ids": ["TA0052", "QIF-TA0052"],
        "legacy_name": "Directed Energy"
    },
    {
        "id": "QIF-M.SV",
        "name": "Model Subversion",
        "domain": "Model",
        "domain_code": "M",
        "action_code": "SV",
        "description": "Attacking BCI decoder/classifier models via poisoning, backdoors, adversarial inputs, or gradient leakage.",
        "legacy_ids": ["TA0053", "QIF-TA0053"],
        "legacy_name": "Adversarial ML"
    },
]

# Map old tactic IDs to new Locus IDs
TACTIC_MAP = {}
for t in LOCUS_TACTICS:
    for lid in t["legacy_ids"]:
        TACTIC_MAP[lid] = t["id"]

# ============================================================
# QNIS v1.0 SCORING
# ============================================================

# Metric weights
AV_WEIGHTS = {"N": 1.0, "W": 0.9, "A": 0.8, "L": 0.7, "P": 0.5}
AC_WEIGHTS = {"L": 1.0, "H": 0.8}
PR_WEIGHTS = {"N": 1.0, "L": 0.8, "H": 0.6}
UI_WEIGHTS = {"N": 1.0, "P": 0.9, "A": 0.8}
BI_WEIGHTS = {"N": 0.0, "L": 0.4, "H": 0.8, "C": 1.0}
CI_WEIGHTS = {"N": 0.0, "L": 0.3, "H": 0.7, "C": 1.0}
II_WEIGHTS = {"N": 0.0, "L": 0.4, "H": 0.8}
S_WEIGHTS  = {"U": 1.0, "C": 1.2}
R_WEIGHTS  = {"A": 0.85, "S": 0.95, "I": 1.0}    # Calibrated: reversibility is a modifier, not a gate
VC_WEIGHTS = {"N": 0.75, "I": 0.9, "E": 1.0}     # Calibrated: even no-consent attacks carry baseline impact
NE_WEIGHTS = {"N": 0.0, "G": 0.6, "D": 1.0}
E_WEIGHTS  = {"U": 0.85, "P": 0.95, "A": 1.0}

# Tactic-based defaults — sensible starting values per operational domain
TACTIC_DEFAULTS = {
    "QIF-N.SC": {"BI": "N", "CI": "L", "II": "H", "VC": "I", "NE": "N", "R": "A"},   # Recon: info-heavy
    "QIF-B.IN": {"BI": "L", "CI": "L", "II": "L", "VC": "I", "NE": "N", "R": "A"},   # Intrusion: system access
    "QIF-N.IJ": {"BI": "H", "CI": "H", "II": "L", "VC": "E", "NE": "G", "R": "S"},   # Injection: neural harm
    "QIF-C.IM": {"BI": "L", "CI": "H", "II": "L", "VC": "E", "NE": "G", "R": "S"},   # Imprinting: persistence in cognition
    "QIF-B.EV": {"BI": "N", "CI": "N", "II": "L", "VC": "I", "NE": "N", "R": "A"},   # Evasion: hiding
    "QIF-D.HV": {"BI": "N", "CI": "L", "II": "H", "VC": "E", "NE": "N", "R": "I"},   # Harvest: data theft (neural data irreversible)
    "QIF-P.DS": {"BI": "H", "CI": "L", "II": "L", "VC": "E", "NE": "N", "R": "S"},   # Disruption: physical harm
    "QIF-N.MD": {"BI": "H", "CI": "H", "II": "L", "VC": "E", "NE": "G", "R": "S"},   # Modulation: direct neural change
    "QIF-C.EX": {"BI": "N", "CI": "H", "II": "H", "VC": "E", "NE": "G", "R": "S"},   # Exploitation: cognitive abuse
    "QIF-E.RD": {"BI": "H", "CI": "L", "II": "L", "VC": "E", "NE": "N", "R": "S"},   # Radiation: energy weapon
    "QIF-M.SV": {"BI": "L", "CI": "H", "II": "H", "VC": "I", "NE": "G", "R": "A"},   # Subversion: model attack
}

def compute_qnis_score(v):
    """Compute QNIS v1.0 base score from vector dict."""
    av = AV_WEIGHTS[v["AV"]]
    ac = AC_WEIGHTS[v["AC"]]
    pr = PR_WEIGHTS[v["PR"]]
    ui = UI_WEIGHTS[v["UI"]]
    bi = BI_WEIGHTS[v["BI"]]
    ci = CI_WEIGHTS[v["CI"]]
    ii = II_WEIGHTS[v["II"]]
    scope = S_WEIGHTS[v["S"]]
    r  = R_WEIGHTS[v["R"]]
    vc = VC_WEIGHTS[v["VC"]]
    ne = NE_WEIGHTS[v["NE"]]

    # Exploitability = 2.5 * AV * AC * PR * UI
    exploitability = 2.5 * av * ac * pr * ui

    # Combined Impact (compounding — all three sub-metrics equal weight)
    combined = 10 * (1 - (1 - bi) * (1 - ci) * (1 - ii))

    # Impact modifier
    impact_mod = r * vc * (1 + (ne * 0.5))

    # Final impact
    final_impact = min(10, combined * impact_mod * scope)

    # Base score: 30% exploitability, 70% impact
    if final_impact == 0:
        return 0.0

    base = (0.3 * exploitability) + (0.7 * final_impact)
    return round(min(10.0, base), 1)

def vector_to_string(v):
    """Convert vector dict to QNIS string format."""
    parts = [f"QNIS:1.0"]
    for key in ["AV", "AC", "PR", "UI", "BI", "CI", "II", "S", "R", "VC", "NE", "E"]:
        if key in v:
            parts.append(f"{key}:{v[key]}")
    return "/".join(parts)

def score_to_severity(score):
    """Map QNIS score to severity label."""
    if score == 0.0:
        return "none"
    elif score <= 3.9:
        return "low"
    elif score <= 6.9:
        return "medium"
    elif score <= 8.9:
        return "high"
    else:
        return "critical"

# ============================================================
# PER-TECHNIQUE QNIS ASSIGNMENTS
# ============================================================
# Assigned based on: attack characteristics, bands, coupling, access,
# classical/quantum detectability, existing severity, and notes analysis.

def assign_qnis(tech, new_tactic):
    """Assign QNIS vector based on tactic defaults + technique characteristics."""
    severity = tech.get("severity", "medium")
    status = tech.get("status", "THEORETICAL")
    bands = tech.get("band_ids", [])
    coupling = tech.get("coupling")
    access = tech.get("access")
    classical = tech.get("classical", "")
    notes = tech.get("notes", "").lower()
    attack = tech.get("attack", "").lower()

    # Start with tactic-based defaults (domain-aware starting point)
    tactic_defs = TACTIC_DEFAULTS.get(new_tactic, {})
    v = {
        "AV": "L",
        "AC": "H",
        "PR": "L",
        "UI": "N",
        "BI": tactic_defs.get("BI", "N"),
        "CI": tactic_defs.get("CI", "N"),
        "II": tactic_defs.get("II", "L"),
        "S": "U",
        "R": tactic_defs.get("R", "A"),
        "VC": tactic_defs.get("VC", "I"),   # Most BCI attacks implicitly violate consent
        "NE": tactic_defs.get("NE", "N"),
        "E": "U",
    }

    # --- Exploit Maturity from status ---
    if status == "CONFIRMED":
        v["E"] = "A"
    elif status == "DEMONSTRATED":
        v["E"] = "P"

    # --- Attack Vector ---
    if "cloud" in attack or "harvest-now" in attack or "mass bci" in attack:
        v["AV"] = "N"
    elif "firmware" in attack and "ota" in notes:
        v["AV"] = "N"
    elif access == "PUBLIC":
        v["AV"] = "W"
    elif access in ("RESTRICTED", "CLASSIFIED"):
        v["AV"] = "P"
    elif access == "LICENSED":
        v["AV"] = "A"
    elif coupling in ("DIRECT", "INTERMODULATION", "ENVELOPE", "TEMPORAL_INTERFERENCE"):
        v["AV"] = "W" if access not in ("RESTRICTED", "CLASSIFIED") else "A"
    elif "S3" in bands and ("cloud" in notes or "network" in notes or "remote" in notes):
        v["AV"] = "N"
    elif "S2" in bands or "S1" in bands:
        v["AV"] = "W"
    elif "I0" in bands:
        v["AV"] = "P"

    # --- Attack Complexity ---
    if coupling in ("INTERMODULATION", "TEMPORAL_INTERFERENCE"):
        v["AC"] = "H"
    elif "quantum" in notes and "no" in classical.lower():
        v["AC"] = "H"
    elif "ble" in attack or "rf" in attack:
        v["AC"] = "L"
    elif "consumer" in notes or "unencrypted" in notes or "lowest barrier" in notes:
        v["AC"] = "L"
    elif severity in ("critical", "high") and status in ("CONFIRMED", "DEMONSTRATED"):
        v["AC"] = "L"

    # --- Privileges Required ---
    if "no auth" in notes or "unencrypted" in notes or "public" in notes:
        v["PR"] = "N"
    elif "firmware" in attack or "supply chain" in attack:
        v["PR"] = "H"
    elif coupling:
        v["PR"] = "N"
    elif "consumer" in notes:
        v["PR"] = "N"

    # --- User Interaction ---
    if "neurophishing" in attack or ("app" in notes and "trick" in notes):
        v["UI"] = "A"
    elif coupling:
        v["UI"] = "P"

    # === IMPACT UPGRADES (override tactic defaults when keywords indicate higher impact) ===

    # --- Biological Impact upgrades ---
    if "tissue damage" in notes or "seizure" in notes or "thermal" in notes:
        v["BI"] = "C"
    elif "motor" in attack or "neuronal" in attack or "flooding" in notes:
        v["BI"] = max_metric(v["BI"], "H")
    elif "stimulation" in notes and ("disrupt" in notes or "overstim" in notes):
        v["BI"] = max_metric(v["BI"], "H")
    elif "entrainment" in notes or "frey" in notes or "microwave" in notes:
        v["BI"] = max_metric(v["BI"], "H")
    elif "dizziness" in notes or "phosphene" in notes or "discomfort" in notes:
        v["BI"] = max_metric(v["BI"], "L")

    # --- Cognitive Integrity upgrades ---
    if "identity" in attack or "self-model" in attack or "agency" in attack or "personality" in notes:
        v["CI"] = "C"
    elif "memory" in attack or "thought decoding" in attack or "working memory" in notes:
        v["CI"] = max_metric(v["CI"], "H")
    elif "p300" in notes or "cognitive state" in notes or "brainprint" in attack:
        v["CI"] = max_metric(v["CI"], "H")
    elif "neurofeedback" in attack or "cognitive bias" in notes:
        v["CI"] = max_metric(v["CI"], "H")
    elif "ransomware" in attack:
        v["CI"] = max_metric(v["CI"], "H")

    # --- Information Impact upgrades ---
    if "eavesdrop" in attack or "interception" in attack or "privacy" in attack:
        v["II"] = "H"
    elif "erp" in attack or "harvest" in notes or "extraction" in notes:
        v["II"] = max_metric(v["II"], "H")
    elif "side-channel" in attack or "inference" in attack:
        v["II"] = max_metric(v["II"], "H")
    elif "man-in-the-middle" in attack or "protocol" in attack:
        v["II"] = max_metric(v["II"], "H")
    elif "surveillance" in attack or "neuro-surveillance" in attack:
        v["II"] = max_metric(v["II"], "H")

    # --- Scope ---
    if "cascade" in notes or "mass" in attack or "platform" in attack:
        v["S"] = "C"
    elif "cognitive warfare" in attack:
        v["S"] = "C"
    elif "closed-loop" in notes and "destabiliz" in notes:
        v["S"] = "C"
    elif len(bands) >= 5:
        v["S"] = "C"

    # --- Reversibility upgrades ---
    if "permanent" in notes or "irreversible" in notes or "tissue damage" in notes:
        v["R"] = "I"
    elif "neuroplast" in notes or "personality" in notes or "identity" in notes:
        v["R"] = "I"
    elif "neural data" in notes and "cannot be changed" in notes:
        v["R"] = "I"
    elif "long-term" in notes or "maladaptive" in notes:
        v["R"] = max_metric(v["R"], "S")
    elif severity == "critical":
        v["R"] = max_metric(v["R"], "S")

    # --- Violation of Consent upgrades ---
    if "without consent" in notes or "without user awareness" in notes or "subliminal" in notes:
        v["VC"] = "E"
    elif "involuntary" in notes or "covert" in notes or "unintended" in notes:
        v["VC"] = "E"
    elif "consent fatigue" in attack:
        v["VC"] = "E"
    elif coupling:
        v["VC"] = max_metric(v["VC"], "E")

    # --- Neuroplasticity upgrades ---
    if "neuroplast" in notes or "pattern lock" in attack or "memory implant" in attack:
        v["NE"] = "D"
    elif "maladaptive" in notes or "identity erosion" in attack or "self-model" in attack:
        v["NE"] = "D"
    elif "calibration" in attack or "learned" in notes:
        v["NE"] = max_metric(v["NE"], "G")
    elif "long-term" in notes and "stimulation" in notes:
        v["NE"] = max_metric(v["NE"], "G")

    return v


# Metric ordering for max_metric helper
_METRIC_ORDER = {"N": 0, "L": 1, "G": 2, "A": 3, "S": 4, "I": 5, "H": 6, "C": 7,
                 "U": 0, "P": 1, "W": 2, "E": 8, "D": 9}

def max_metric(current, candidate):
    """Return the higher-severity metric value."""
    return candidate if _METRIC_ORDER.get(candidate, 0) > _METRIC_ORDER.get(current, 0) else current


def clean_notes(notes):
    """Remove MITRE-specific references from notes text."""
    import re
    # Remove "Maps to ..." sentences
    notes = re.sub(r'\.\s*Maps to [^.]+\.', '.', notes)
    # Remove "Closest ICS: ..." references
    notes = re.sub(r'\s*Closest ICS:[^.]+\.', '', notes)
    # Remove "Merges ONI-T..." references - keep these as they're QIF legacy
    # Remove "NO MITRE EQUIVALENT" references
    notes = re.sub(r'\s*NO MITRE EQUIVALENT\.[^.]*\.?', '', notes)
    # Remove stray "MITRE" mentions
    notes = re.sub(r'\s*No MITRE equivalent[^.]*\.?', '', notes)
    # Clean up double periods and spaces
    notes = re.sub(r'\.\.+', '.', notes)
    notes = re.sub(r'\s+', ' ', notes)
    return notes.strip()


def main():
    registry_path = Path(__file__).parent.parent / "shared" / "threat-registry.json"

    with open(registry_path, "r") as f:
        reg = json.load(f)

    # ============================================================
    # 1. Replace tactics
    # ============================================================
    reg["tactics"] = []
    for t in LOCUS_TACTICS:
        reg["tactics"].append({
            "id": t["id"],
            "name": t["name"],
            "domain": t["domain"],
            "domain_code": t["domain_code"],
            "action_code": t["action_code"],
            "description": t["description"],
            "legacy_ids": t["legacy_ids"],
            "legacy_name": t["legacy_name"],
        })

    # ============================================================
    # 2. Transform techniques
    # ============================================================

    # Sort techniques by old ID for stable ordering
    techniques = sorted(reg["techniques"], key=lambda t: t["id"])

    # Build per-tactic counters for verification
    tactic_counts = {t["id"]: 0 for t in LOCUS_TACTICS}

    new_techniques = []
    for i, tech in enumerate(techniques):
        old_id = tech["id"]
        old_category = tech["category"]

        # Map old category to new Locus tactic
        new_tactic = TACTIC_MAP.get(old_category)
        if not new_tactic:
            print(f"WARNING: No tactic mapping for {old_category} (technique {old_id})")
            # Try without QIF- prefix
            stripped = old_category.replace("QIF-", "")
            new_tactic = TACTIC_MAP.get(stripped)
            if not new_tactic:
                print(f"  FATAL: Cannot map {old_category}")
                continue

        tactic_counts[new_tactic] = tactic_counts.get(new_tactic, 0) + 1

        # New sequential ID
        new_id = f"QIF-T{i+1:04d}"

        # Assign QNIS (tactic-aware)
        qnis_vector = assign_qnis(tech, new_tactic)
        qnis_score = compute_qnis_score(qnis_vector)
        qnis_severity = score_to_severity(qnis_score)
        qnis_string = vector_to_string(qnis_vector)

        # Build cross-references (replace mitre field)
        cross_refs = {}
        if tech.get("mitre"):
            m = tech["mitre"]
            # Keep technique cross-refs but label them as "related" not "maps to"
            if m.get("techniques"):
                cross_refs["related_ids"] = m["techniques"]
            # Keep tactic cross-refs mapped to new Locus IDs
            if m.get("tactics"):
                mapped_tactics = []
                for ta in m["tactics"]:
                    lt = TACTIC_MAP.get(ta)
                    if lt and lt != new_tactic:  # Only secondary tactics
                        mapped_tactics.append(lt)
                if mapped_tactics:
                    cross_refs["secondary_tactics"] = mapped_tactics

        # Clean notes
        cleaned_notes = clean_notes(tech.get("notes", ""))

        new_tech = {
            "id": new_id,
            "attack": tech["attack"],
            "tactic": new_tactic,
            "bands": tech["bands"],
            "band_ids": tech["band_ids"],
            "coupling": tech.get("coupling"),
            "access": tech.get("access"),
            "classical": tech["classical"],
            "quantum": tech["quantum"],
            "sources": tech.get("sources", []),
            "status": tech["status"],
            "severity": tech["severity"],
            "ui_category": tech["ui_category"],
            "notes": cleaned_notes,
            "legacy_ids": tech.get("legacy_ids", []),
            "legacy_technique_id": old_id,
            "qnis": {
                "version": "1.0",
                "vector": qnis_string,
                "score": qnis_score,
                "severity": qnis_severity,
            },
        }

        if cross_refs:
            new_tech["cross_references"] = cross_refs

        new_techniques.append(new_tech)

    reg["techniques"] = new_techniques

    # ============================================================
    # 3. Update metadata
    # ============================================================
    reg["version"] = "3.0"
    reg["taxonomy"] = "QIF Locus Taxonomy v1.0"
    reg["scoring"] = "QNIS v1.0 (QIF Neural Impact Score)"
    reg["generated"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    # Remove old MITRE compatibility section
    if "mitre_compatibility" in reg:
        reg["legacy_mitre_compatibility"] = reg.pop("mitre_compatibility")
        reg["legacy_mitre_compatibility"]["note"] = "DEPRECATED: QIF now uses the Locus Taxonomy with original identifiers. Legacy MITRE cross-references preserved in technique cross_references field."

    # ============================================================
    # 4. Update statistics
    # ============================================================
    by_tactic = {}
    by_status = {}
    by_severity = {}
    by_ui_cat = {}
    by_qnis_severity = {}

    for t in new_techniques:
        tac = t["tactic"]
        by_tactic[tac] = by_tactic.get(tac, 0) + 1

        st = t["status"]
        by_status[st] = by_status.get(st, 0) + 1

        sev = t["severity"]
        by_severity[sev] = by_severity.get(sev, 0) + 1

        ui = t["ui_category"]
        by_ui_cat[ui] = by_ui_cat.get(ui, 0) + 1

        qsev = t["qnis"]["severity"]
        by_qnis_severity[qsev] = by_qnis_severity.get(qsev, 0) + 1

    reg["statistics"] = {
        "total_techniques": len(new_techniques),
        "total_tactics": len(LOCUS_TACTICS),
        "total_domains": 7,
        "by_tactic": dict(sorted(by_tactic.items())),
        "by_status": dict(sorted(by_status.items())),
        "by_severity": dict(sorted(by_severity.items())),
        "by_ui_category": dict(sorted(by_ui_cat.items())),
        "by_qnis_severity": dict(sorted(by_qnis_severity.items())),
    }

    # ============================================================
    # 5. Update deprecated section
    # ============================================================
    reg["deprecated"] = [
        {
            "file": "shared/threat-matrix.json",
            "reason": "Legacy ONI-era threat matrix (24 techniques, ONI-T### IDs). Superseded by this registry.",
            "migration": "All ONI-T### techniques merged into QIF-T#### range. See legacy_ids field on each technique."
        },
        {
            "schema": "v2.0 (MITRE-compatible IDs)",
            "reason": "QIF-T2xxx IDs replaced with QIF-T0xxx sequential IDs in v3.0. MITRE tactic IDs (TA####) replaced with QIF Locus Taxonomy IDs.",
            "migration": "See legacy_technique_id field on each technique. Tactic legacy_ids on each tactic definition."
        }
    ]

    # ============================================================
    # 6. Add domains reference
    # ============================================================
    reg["domains"] = [
        {"code": "N", "name": "Neural", "description": "Direct interface with neural tissue — signal manipulation, electrode boundary, ion channels."},
        {"code": "C", "name": "Cognitive", "description": "Higher-order psychological processes — memory, attention, identity, agency."},
        {"code": "P", "name": "Physiological", "description": "Somatic systems — motor control, autonomic functions, physical harm."},
        {"code": "D", "name": "Data", "description": "Information acquisition and manipulation — brainwave recordings, neural metadata."},
        {"code": "B", "name": "BCI System", "description": "Hardware/software of the BCI device — firmware, protocols, authentication."},
        {"code": "M", "name": "Model", "description": "Machine learning models used in BCI — decoders, classifiers, feedback systems."},
        {"code": "E", "name": "Energy", "description": "Directed energy attacks — ELF, microwave, RF, temporal interference."},
    ]

    # ============================================================
    # 7. Add QNIS specification reference
    # ============================================================
    reg["qnis_spec"] = {
        "version": "1.0",
        "name": "QIF Neural Impact Score",
        "description": "BCI-specific vulnerability scoring system. Prioritizes human impact (biological + cognitive) over system impact.",
        "score_range": "0.0 - 10.0",
        "formula": "BaseScore = (0.3 * Exploitability) + (0.7 * Impact)",
        "severity_levels": {
            "none": "0.0",
            "low": "0.1 - 3.9",
            "medium": "4.0 - 6.9",
            "high": "7.0 - 8.9",
            "critical": "9.0 - 10.0"
        },
        "metrics": {
            "exploitability": ["AV (Attack Vector)", "AC (Attack Complexity)", "PR (Privileges Required)", "UI (User Interaction)"],
            "impact": ["BI (Biological Impact)", "CI (Cognitive Integrity)", "II (Information Impact)", "S (Scope)"],
            "supplemental": ["R (Reversibility)", "VC (Violation of Consent)", "NE (Neuroplasticity)"],
            "threat": ["E (Exploit Maturity)"],
            "environmental": ["SC (Safety Criticality)", "CR (Cognitive Resilience)", "BR (Biological Resilience)"]
        },
        "vector_format": "QNIS:1.0/AV:<V>/AC:<V>/PR:<V>/UI:<V>/BI:<V>/CI:<V>/II:<V>/S:<V>/R:<V>/VC:<V>/NE:<V>/E:<V>"
    }

    # ============================================================
    # Write output
    # ============================================================
    with open(registry_path, "w") as f:
        json.dump(reg, f, indent=2, ensure_ascii=False)

    print(f"✓ Transformed {len(new_techniques)} techniques")
    print(f"✓ {len(LOCUS_TACTICS)} Locus tactics")
    print(f"✓ QNIS scores: {by_qnis_severity}")
    print(f"✓ By tactic: {by_tactic}")

    # Also copy to docs/data/
    docs_path = Path(__file__).parent.parent / "docs" / "data" / "threat-registry.json"
    docs_path.parent.mkdir(parents=True, exist_ok=True)
    with open(docs_path, "w") as f:
        json.dump(reg, f, indent=2, ensure_ascii=False)
    print(f"✓ Copied to {docs_path}")


if __name__ == "__main__":
    main()
