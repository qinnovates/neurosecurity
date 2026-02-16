#!/usr/bin/env python3
"""
Enrich qtara-registrar.json with FDORA §3305 / Section 524B regulatory mapping.

Per-technique fields added:
  regulatory.cyber_device    — Does the targeted device meet the 3-prong test?
  regulatory.prongs          — Which prongs are satisfied and why
  regulatory.524b_relevant   — Which 524B submission requirements this technique is relevant to
  regulatory.coverage_score  — 0.0–1.0 score of how well existing regs cover this technique
  regulatory.gaps            — What existing regulations miss for this technique

FDORA "cyber device" 3-prong test (Section 524B):
  1. Contains software (including firmware)
  2. Can connect to the internet (or networked)
  3. Could be vulnerable to cybersecurity threats

FDORA 524B submission requirements:
  TM  = Threat modeling
  VA  = Vulnerability assessment
  SBOM = Software Bill of Materials
  SA  = Security architecture
  PM  = Post-market monitoring plan
"""

import json
from pathlib import Path
from collections import Counter

REGISTRAR = Path(__file__).parent.parent / "shared" / "qtara-registrar.json"

# --- Prong classification rules ---

# Hardware keywords indicating software presence (Prong 1)
SOFTWARE_KEYWORDS = {
    "firmware", "processor", "ADC", "DSP", "FPGA", "microcontroller",
    "wireless_transmitter", "bluetooth", "wifi", "telemetry_module",
    "pulse_generator", "signal_processor", "real_time_processor",
    "GPU", "neural_network", "ML", "model", "algorithm", "software",
    "protocol_analyzer", "compute", "CPU", "SoC", "MCU",
    "amplifier",  # modern amplifiers are digital
}

# Hardware/coupling keywords indicating network connectivity (Prong 2)
NETWORK_KEYWORDS = {
    "wireless_transmitter", "bluetooth", "wifi", "telemetry_module",
    "RF", "antenna", "cellular", "5G", "LTE", "zigbee",
    "cloud", "server", "API", "OTA", "internet",
}

# UI categories that inherently require network (Prong 2)
NETWORK_UI_CATEGORIES = {"CI", "EX", "DS"}  # Chain, Exfiltration, Data Surveillance

# Techniques that are purely physical/analog (override — NOT network-connected)
PHYSICAL_ONLY = {
    "QIF-T0005",  # Quantum neural sensing — cryogenic, no network
}

# --- 524B requirement relevance rules ---

def compute_524b_relevance(tech: dict) -> list:
    """Determine which 524B submission requirements this technique is relevant to."""
    reqs = []

    # ALL techniques are relevant to threat modeling — they ARE the threat model
    reqs.append("TM")

    # ALL techniques with NISS scores are relevant to vulnerability assessment
    niss = tech.get("niss") or {}
    if niss.get("score"):
        reqs.append("VA")

    # SBOM relevance: techniques that exploit software components
    tara = tech.get("tara") or {}
    eng = tara.get("engineering") or {}
    hardware = eng.get("hardware", [])
    dual_use = tara.get("dual_use", "")
    ui_cat = tech.get("ui_category", "")

    # Software-exploiting techniques
    if dual_use == "silicon_only":
        reqs.append("SBOM")  # Pure software attacks → SBOM critical
    elif ui_cat in ("PS", "CI"):
        reqs.append("SBOM")  # Protocol/chain attacks exploit software stack
    elif any(kw in hw.lower() for hw in hardware for kw in
             ("firmware", "processor", "wireless", "bluetooth", "wifi", "telemetry", "ota")):
        reqs.append("SBOM")

    # Security architecture: techniques that target specific architectural bands
    # I0 (interface) attacks are directly about security architecture
    band_ids = tech.get("band_ids", [])
    if "I0" in band_ids or len(band_ids) >= 3:
        reqs.append("SA")
    elif ui_cat in ("SI", "DM"):  # Signal injection/manipulation = architecture concern
        reqs.append("SA")

    # Post-market monitoring: techniques that can emerge/evolve after deployment
    status = tech.get("status", "")
    if status in ("EMERGING", "THEORETICAL", "PLAUSIBLE", "SPECULATIVE"):
        reqs.append("PM")
    elif ui_cat in ("CI", "EX"):  # Chain/exfiltration evolve post-deployment
        reqs.append("PM")
    elif any(b.startswith("S") for b in band_ids):
        reqs.append("PM")  # S-domain attacks use consumer devices that change rapidly

    return reqs


def compute_coverage_score(tech: dict) -> float:
    """Compute regulatory coverage score (0.0–1.0).

    Measures how well EXISTING regulations (pre-FDORA) cover this technique.
    Lower = bigger gap = more FDORA value.

    Factors:
    - Has FDA pathway listed? (+0.2)
    - Has IEC 60601/62443? (+0.2)
    - Has HIPAA/GDPR? (+0.1)
    - CVSS can express the risk? (+0.2) — inverse of gap_group
    - Not silicon_only? (+0.1) — traditional regs cover biological better
    - Status is CONFIRMED/DEMONSTRATED? (+0.2) — existing regs cover known threats
    """
    score = 0.0

    tara = tech.get("tara") or {}
    gov = tara.get("governance") or {}
    regs = gov.get("regulations", [])
    regs_lower = " ".join(r.lower() for r in regs)

    # FDA pathway
    if "fda" in regs_lower or "510(k)" in regs_lower or "pma" in regs_lower:
        score += 0.2

    # IEC standards
    if "iec 60601" in regs_lower or "iec 62443" in regs_lower or "iso 80601" in regs_lower:
        score += 0.2

    # Privacy regs
    if "hipaa" in regs_lower or "gdpr" in regs_lower:
        score += 0.1

    # CVSS expressibility (inverse of gap_group: 1=small gap, 3=large gap)
    cvss = tech.get("cvss") or {}
    gap_group = cvss.get("gap_group", 3)
    if gap_group == 1:
        score += 0.2
    elif gap_group == 2:
        score += 0.1
    # gap_group 3 = 0 (CVSS can't express it)

    # Biological vs silicon
    dual_use = tara.get("dual_use", "")
    if dual_use != "silicon_only":
        score += 0.1

    # Known vs emerging
    status = tech.get("status", "")
    if status in ("CONFIRMED", "DEMONSTRATED"):
        score += 0.2
    elif status == "EMERGING":
        score += 0.1

    return round(min(score, 1.0), 2)


def identify_gaps(tech: dict, coverage: float) -> list:
    """Identify specific regulatory gaps for this technique."""
    gaps = []

    tara = tech.get("tara") or {}
    gov = tara.get("governance") or {}
    regs = gov.get("regulations", [])
    regs_lower = " ".join(r.lower() for r in regs)

    cvss = tech.get("cvss") or {}
    gap_group = cvss.get("gap_group", 3)
    niss = tech.get("niss") or {}
    niss_score = niss.get("score", 0)

    # CVSS gap
    if gap_group == 3:
        gaps.append("CVSS cannot express neural-specific impacts")
    elif gap_group == 2:
        gaps.append("CVSS partially captures risk; neural dimensions missing")

    # No FDA pathway for S-domain consumer devices
    band_ids = tech.get("band_ids", [])
    if any(b.startswith("S") for b in band_ids) and "fda" not in regs_lower:
        gaps.append("No FDA pathway for consumer sensor exploitation")

    # High NISS but no neural-specific regulation
    if niss_score >= 7.0 and "iec 62443" not in regs_lower:
        gaps.append("High neural impact (NISS >= 7.0) without IEC 62443 coverage")

    # Silicon-only with no software security standard
    dual_use = tara.get("dual_use", "")
    if dual_use == "silicon_only" and "iec 62304" not in regs_lower and "21 cfr 820" not in regs_lower:
        gaps.append("Software-only attack without software lifecycle standard (IEC 62304)")

    # Consent gap (from neurorights analysis)
    nr = tech.get("neurorights") or {}
    cci = nr.get("cci", 0)
    if cci < 1.0 and niss_score >= 6.0:
        gaps.append("Consent complexity under-matches neural impact (CCI/NISS mismatch)")

    # Emerging/theoretical without post-market coverage
    status = tech.get("status", "")
    if status in ("THEORETICAL", "PLAUSIBLE", "SPECULATIVE"):
        gaps.append("Threat not yet in regulatory threat catalogs")

    return gaps


def classify_cyber_device(tech: dict) -> dict:
    """Classify technique against the FDORA 3-prong cyber device test."""
    tara = tech.get("tara") or {}
    eng = tara.get("engineering") or {}
    hardware = eng.get("hardware", [])
    coupling = eng.get("coupling", [])
    band_ids = tech.get("band_ids", [])
    ui_cat = tech.get("ui_category", "")
    tech_id = tech.get("id", "")
    notes = tech.get("notes", "").lower()
    dual_use = tara.get("dual_use", "")

    prongs = {}

    # Prong 1: Contains software
    hw_str = " ".join(h.lower() for h in hardware)
    has_software = (
        any(kw in hw_str for kw in SOFTWARE_KEYWORDS) or
        dual_use == "silicon_only" or
        ui_cat in ("PS", "CI") or  # Protocol/chain attacks = software
        "firmware" in notes or "algorithm" in notes or "model" in notes or
        "software" in notes or "protocol" in notes
    )
    prongs["software"] = has_software

    # Prong 2: Internet/network connectable
    has_network = (
        tech_id not in PHYSICAL_ONLY and (
            any(kw in hw_str for kw in NETWORK_KEYWORDS) or
            any(c.lower() in ("rf", "computational") for c in coupling) or
            ui_cat in NETWORK_UI_CATEGORIES or
            "wireless" in notes or "bluetooth" in notes or "wifi" in notes or
            "ota" in notes or "cloud" in notes or "remote" in notes or
            "internet" in notes or "network" in notes or
            any(b.startswith("S") for b in band_ids)  # S-domain implies consumer/networked
        )
    )
    prongs["network_connectable"] = has_network

    # Prong 3: Vulnerable to cybersecurity threats (ALL techniques satisfy this by definition)
    prongs["vulnerable"] = True

    # Classify
    all_prongs = all(prongs.values())

    return {
        "meets_definition": all_prongs,
        "prongs": prongs,
    }


def main():
    with open(REGISTRAR) as f:
        data = json.load(f)

    techniques = data.get("techniques", [])

    # Stats
    cyber_device_count = 0
    prong_failures = Counter()
    coverage_scores = []
    gap_counts = Counter()
    req_counts = Counter()

    for tech in techniques:
        cd = classify_cyber_device(tech)
        reqs = compute_524b_relevance(tech)
        coverage = compute_coverage_score(tech)
        gaps = identify_gaps(tech, coverage)

        tech["regulatory"] = {
            "fdora_524b": {
                "cyber_device": cd["meets_definition"],
                "prongs": cd["prongs"],
                "applicable_requirements": reqs,
                "coverage_score": coverage,
                "gaps": gaps,
            }
        }

        if cd["meets_definition"]:
            cyber_device_count += 1
        else:
            for k, v in cd["prongs"].items():
                if not v:
                    prong_failures[k] += 1

        coverage_scores.append(coverage)
        for g in gaps:
            gap_counts[g.split("(")[0].strip()] += 1
        for r in reqs:
            req_counts[r] += 1

    # Add regulatory stats
    data["statistics"]["regulatory"] = {
        "version": "1.0",
        "framework": "FDORA Section 3305 / Section 524B",
        "cyber_device_techniques": cyber_device_count,
        "non_cyber_device_techniques": len(techniques) - cyber_device_count,
        "prong_failure_reasons": dict(prong_failures),
        "techniques_per_requirement": dict(req_counts),
        "coverage_stats": {
            "mean": round(sum(coverage_scores) / len(coverage_scores), 2),
            "min": min(coverage_scores),
            "max": max(coverage_scores),
            "below_0.5": sum(1 for c in coverage_scores if c < 0.5),
        },
        "top_gaps": dict(gap_counts.most_common(10)),
    }

    # Update changelog
    data["changelog"].insert(0, {
        "version": "1.6",
        "date": "2026-02-16",
        "title": "FDORA §3305 Regulatory Compliance Mapping",
        "summary": f"Added per-technique FDORA Section 524B cyber device classification, "
                   f"applicable submission requirements, regulatory coverage scoring, and gap analysis. "
                   f"{cyber_device_count} of {len(techniques)} techniques target cyber devices. "
                   f"Mean regulatory coverage: {round(sum(coverage_scores)/len(coverage_scores), 2)}.",
        "added": [],
        "enrichments": [
            "regulatory.fdora_524b.cyber_device — 3-prong cyber device test result",
            "regulatory.fdora_524b.applicable_requirements — TM/VA/SBOM/SA/PM applicability",
            "regulatory.fdora_524b.coverage_score — 0.0–1.0 existing regulatory coverage",
            "regulatory.fdora_524b.gaps — specific regulatory gaps identified",
        ],
        "therapeutic_highlights": [
            "Regulatory gap analysis enables targeted FDORA compliance for BCI manufacturers",
            "Coverage scoring identifies techniques where existing standards are insufficient",
            f"{sum(1 for c in coverage_scores if c < 0.5)} techniques have coverage below 0.5 (major gaps)",
            "Per-technique gap lists provide actionable compliance checklists",
        ],
    })

    # Update TARA version
    data["statistics"]["tara"]["version"] = "1.6"

    with open(REGISTRAR, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")

    # Print summary
    print("=== FDORA §3305 Regulatory Enrichment Complete ===")
    print(f"Techniques enriched: {len(techniques)}")
    print(f"Cyber devices: {cyber_device_count}/{len(techniques)}")
    if prong_failures:
        print(f"Non-cyber-device reasons: {dict(prong_failures)}")
    print(f"\nRequirement applicability:")
    for req, name in [("TM", "Threat Modeling"), ("VA", "Vulnerability Assessment"),
                       ("SBOM", "Software BOM"), ("SA", "Security Architecture"),
                       ("PM", "Post-Market Monitoring")]:
        print(f"  {req} ({name}): {req_counts.get(req, 0)}")

    print(f"\nCoverage score stats:")
    print(f"  Mean: {round(sum(coverage_scores)/len(coverage_scores), 2)}")
    print(f"  Min:  {min(coverage_scores)}")
    print(f"  Max:  {max(coverage_scores)}")
    print(f"  Below 0.5: {sum(1 for c in coverage_scores if c < 0.5)}")

    print(f"\nTop regulatory gaps:")
    for gap, count in gap_counts.most_common(10):
        print(f"  [{count:3d}] {gap}")

    # Flag worst-covered high-severity techniques
    print(f"\n=== Critical Gap Techniques (coverage < 0.4, severity critical/high) ===")
    for tech in sorted(techniques, key=lambda t: t["regulatory"]["fdora_524b"]["coverage_score"]):
        reg = tech["regulatory"]["fdora_524b"]
        if reg["coverage_score"] < 0.4 and tech["severity"] in ("critical", "high"):
            niss = (tech.get("niss") or {}).get("score", 0)
            print(f"  {tech['id']} ({tech['attack'][:50]}) — coverage={reg['coverage_score']}, "
                  f"severity={tech['severity']}, NISS={niss}, gaps={len(reg['gaps'])}")


if __name__ == "__main__":
    main()
