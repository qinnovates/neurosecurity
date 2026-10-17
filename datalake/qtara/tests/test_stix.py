import pytest
from qtara.core import TaraLoader
from qtara.stix import StixExporter

def test_stix_bundle_generation():
    loader = TaraLoader()
    loader.load()
    techniques = loader.list_techniques()

    bundle = StixExporter.to_bundle(techniques)

    assert bundle["type"] == "bundle"
    assert "objects" in bundle

    # Check for Identity object
    identities = [obj for obj in bundle["objects"] if obj["type"] == "identity"]
    assert len(identities) > 0
    assert identities[0]["name"] == "Qinnovate Interface Framework (QIF)"

    # Check for Attack Pattern objects (default: excludes pending techniques)
    patterns = [obj for obj in bundle["objects"] if obj["type"] == "attack-pattern"]
    enriched = [t for t in techniques if not t.tara_enrichment_pending]
    assert len(patterns) == len(enriched)
    assert len(patterns) > 0
    assert patterns[0]["name"] == enriched[0].attack

def test_stix_bundle_include_pending():
    """When include_pending=True, all techniques should be in the bundle."""
    loader = TaraLoader()
    loader.load()
    techniques = loader.list_techniques()

    bundle = StixExporter.to_bundle(techniques, include_pending=True)
    patterns = [obj for obj in bundle["objects"] if obj["type"] == "attack-pattern"]
    assert len(patterns) == len(techniques)


# --- 2026-10-16: deterministic ids, tactic phases, severity provenance ---

import re

import json
from pathlib import Path

from qtara.stix import IDENTITY_ID, attack_pattern_id, tactic_phase_name

STIX_ID = re.compile(r"^[a-z][a-z0-9-]+--[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
# Shared with src/lib/__tests__/stix-ids.test.ts so the SDK and /api/stix.json agree.
GOLDEN = json.loads((Path(__file__).parent / "fixtures" / "stix_ids.json").read_text(encoding="utf-8"))


def _bundle():
    loader = TaraLoader()
    loader.load()
    return StixExporter.to_bundle(loader.list_techniques(), modified=loader.registry.generated), loader


def test_every_stix_id_is_valid():
    bundle, _ = _bundle()
    assert IDENTITY_ID == GOLDEN["identity"]
    for obj in bundle["objects"]:
        assert STIX_ID.match(obj["id"]), obj["id"]
    assert "spec_version" not in bundle  # STIX 2.1 bundles carry no spec_version


def test_ids_are_stable_and_match_the_website():
    for entry_id, stix_id in GOLDEN["attack_patterns"].items():
        assert attack_pattern_id(entry_id) == stix_id
    first, _ = _bundle()
    second, _ = _bundle()
    assert [o["id"] for o in first["objects"]] == [o["id"] for o in second["objects"]]


def test_kill_chain_phase_comes_from_the_tactic():
    bundle, loader = _bundle()
    patterns = {o["external_references"][0]["external_id"]: o for o in bundle["objects"] if o["type"] == "attack-pattern"}
    for technique in loader.list_techniques():
        if technique.id in patterns:
            phase = patterns[technique.id]["kill_chain_phases"][0]["phase_name"]
            assert phase == tactic_phase_name(technique.tactic)
    assert tactic_phase_name("QIF-N.IJ") == "qif-n-ij"


def test_severity_provenance_and_niss_annotations_are_exported():
    bundle, loader = _bundle()
    patterns = {o["external_references"][0]["external_id"]: o for o in bundle["objects"] if o["type"] == "attack-pattern"}
    flagged = [t for t in loader.list_techniques() if t.niss and t.niss.harm_flag and t.id in patterns]
    assert flagged, "expected at least one harm-flagged technique"
    for technique in flagged:
        assert patterns[technique.id]["x_qif_niss_harm_flag"] is True
    for technique in loader.list_techniques():
        if technique.id in patterns and technique.niss:
            assert patterns[technique.id]["x_qif_severity_source"] == "niss"
            assert patterns[technique.id]["x_qif_severity"] == technique.niss.severity


def test_cognitive_flag_is_exported():
    bundle, loader = _bundle()
    patterns = {o["external_references"][0]["external_id"]: o for o in bundle["objects"] if o["type"] == "attack-pattern"}
    flagged = [t for t in loader.list_techniques() if t.niss and t.niss.cognitive_flag and t.id in patterns]
    assert flagged, "expected at least one technique with CR or CD at H or C"
    for technique in flagged:
        assert patterns[technique.id]["x_qif_niss_cognitive_flag"] is True
