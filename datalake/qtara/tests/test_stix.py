import json
import re
import uuid
from pathlib import Path

import pytest
from qtara.core import TaraLoader
from qtara.stix import IDENTITY_ID, StixExporter, attack_pattern_id, tactic_phase_name

UUID_STIX_ID = re.compile(r"relationship--[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}")

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
        # Only a scored technique's severity is derived from NISS; unscored and provisional keep the editorial label.
        if technique.id in patterns and technique.niss and technique.niss.scoring_state == "scored":
            assert patterns[technique.id]["x_qif_severity_source"] == "niss"
            assert patterns[technique.id]["x_qif_severity"] == technique.niss.severity


def test_cognitive_flag_is_exported():
    bundle, loader = _bundle()
    patterns = {o["external_references"][0]["external_id"]: o for o in bundle["objects"] if o["type"] == "attack-pattern"}
    flagged = [t for t in loader.list_techniques() if t.niss and t.niss.cognitive_flag and t.id in patterns]
    assert flagged, "expected at least one technique with CR or CD at H or C"
    for technique in flagged:
        assert patterns[technique.id]["x_qif_niss_cognitive_flag"] is True
def test_stix_niss_fields_follow_the_scoring_state():
    """A score is exported only for scored techniques; a provisional one exports its range."""
    loader = TaraLoader()
    loader.load()
    techniques = loader.list_techniques()
    state_by_name = {t.attack: t.niss.scoring_state for t in techniques}

    bundle = StixExporter.to_bundle(techniques, include_pending=True)
    patterns = [obj for obj in bundle["objects"] if obj["type"] == "attack-pattern"]
    for pattern in patterns:
        state = state_by_name[pattern["name"]]
        assert pattern["x_qif_niss_scoring_state"] == state
        assert ("x_qif_niss_score" in pattern) == (state == "scored")
        assert ("x_qif_niss_score_min" in pattern) == (state == "provisional")


def test_stix_omits_variants_unless_they_are_passed():
    loader = TaraLoader()
    techniques = loader.list_techniques()
    bundle = StixExporter.to_bundle(techniques, include_pending=True)
    assert not [obj for obj in bundle["objects"] if obj["type"] == "relationship"]
    assert len([obj for obj in bundle["objects"] if obj["type"] == "attack-pattern"]) == len(techniques)


def test_stix_variant_is_an_attack_pattern_related_to_its_parent():
    """Each variant exports as an attack-pattern plus one standard relationship pointing at its parent."""
    loader = TaraLoader()
    techniques = loader.list_techniques()
    variants = loader.list_variants()
    assert variants

    bundle = StixExporter.to_bundle(techniques, include_pending=True, variants=variants)
    by_stix_id = {obj["id"]: obj for obj in bundle["objects"]}
    patterns = [obj for obj in bundle["objects"] if obj["type"] == "attack-pattern"]
    relationships = [obj for obj in bundle["objects"] if obj["type"] == "relationship"]

    assert len(patterns) == len(techniques) + len(variants)
    assert len(relationships) == len(variants)
    assert len(by_stix_id) == len(bundle["objects"])
    for variant, relationship in zip(variants, relationships):
        source, target = by_stix_id[relationship["source_ref"]], by_stix_id[relationship["target_ref"]]
        assert relationship["relationship_type"] == "related-to"
        assert relationship["relationship_type"] != "subtechnique-of"
        assert relationship["x_qif_relationship"] == "variant-of"
        assert UUID_STIX_ID.fullmatch(relationship["id"])
        assert source["external_references"][0]["external_id"] == variant.id
        assert target["external_references"][0]["external_id"] == variant.parent
        assert source["x_qif_variant_of"] == variant.parent
        assert source["x_qif_differs_in"] == variant.differs_in
        assert source["x_qif_niss_scoring_state"] == variant.niss.scoring_state
        assert ("x_qif_niss_score" in source) == variant.inherits_niss


def test_stix_variant_is_left_out_when_its_parent_is_not_exported():
    loader = TaraLoader()
    variants = loader.list_variants()
    parent_ids = {variant.parent for variant in variants}
    without_parents = [t for t in loader.list_techniques() if t.id not in parent_ids]

    bundle = StixExporter.to_bundle(without_parents, include_pending=True, variants=variants)
    assert not [obj for obj in bundle["objects"] if obj["type"] == "relationship"]
    assert not [obj for obj in bundle["objects"] if "x_qif_variant_of" in obj]


def test_stix_ids_match_the_golden_fixture_shared_with_the_site():
    """The site export (src/lib/stix-ids.ts) is pinned to the same file, so both exports give one entry one id."""
    golden = json.loads((Path(__file__).parent / "fixtures" / "stix_ids.json").read_text(encoding="utf-8"))
    assert golden["namespace"] == str(uuid.NAMESPACE_DNS)
    for entry_id, stix_id in golden["attack_patterns"].items():
        assert attack_pattern_id(entry_id) == stix_id

    loader = TaraLoader()
    bundle = StixExporter.to_bundle(loader.list_techniques(), include_pending=True, variants=loader.list_variants())
    exported = {obj["external_references"][0]["external_id"]: obj["id"]
                for obj in bundle["objects"] if obj["type"] == "attack-pattern"}
    for entry_id, stix_id in golden["attack_patterns"].items():
        assert exported[entry_id] == stix_id
    relationship_ids = {obj["id"] for obj in bundle["objects"] if obj["type"] == "relationship"}
    assert relationship_ids == {relationship["id"] for relationship in golden["variant_relationships"]}
