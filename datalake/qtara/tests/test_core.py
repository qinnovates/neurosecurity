import json
import re
from typing import get_args

import pytest
from pydantic import ValidationError
from qtara.core import TaraLoader, NissCalculator
from qtara.models import Variant

def test_loader_load():
    loader = TaraLoader()
    loader.load()
    assert len(loader.registry.techniques) > 0
    assert loader.registry.techniques[0].id.startswith("QIF-T")

def test_loader_list_techniques():
    loader = TaraLoader()
    loader.load()
    
    # Test all
    all_techs = loader.list_techniques()
    assert len(all_techs) > 0
    
    # Test band filter
    n1_techs = loader.list_techniques(band="N1")
    for t in n1_techs:
        assert "N1" in t.band_ids

def test_loader_get_technique():
    loader = TaraLoader()
    loader.load()
    
    t = loader.get_technique("QIF-T0001")
    assert t is not None
    assert t.id == "QIF-T0001"
    
    none_t = loader.get_technique("INVALID-ID")
    assert none_t is None

def test_niss_calculator():
    vector = "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H/BI:H/CR:H/CD:H/CV:V/RV:H/NP:H"
    result = NissCalculator.parse_vector(vector)
    assert result["BI"] == "H"
    assert result["CV"] == "V"

NISS_METRICS = {"BI", "CR", "CD", "CV", "RV", "NP"}


def test_every_technique_has_a_niss_scoring_state():
    loader = TaraLoader()
    loader.load()
    for technique in loader.registry.techniques:
        assert technique.niss is not None, technique.id
        assert technique.niss.scoring_state in {"scored", "provisional", "unscored"}, technique.id


def test_scored_techniques_carry_a_vector_and_score():
    loader = TaraLoader()
    loader.load()
    scored = [t for t in loader.registry.techniques if t.niss.scoring_state == "scored"]
    assert len(scored) > 0
    for technique in scored:
        assert technique.niss.score is not None and technique.niss.vector, technique.id
        assert technique.niss.score_min is None and technique.niss.score_max is None, technique.id


def test_provisional_techniques_carry_a_range_and_no_score():
    loader = TaraLoader()
    loader.load()
    provisional = [t for t in loader.registry.techniques if t.niss.scoring_state == "provisional"]
    assert len(provisional) > 0
    for technique in provisional:
        niss = technique.niss
        assert niss.score is None and niss.vector is None, technique.id
        assert set(niss.metrics) == NISS_METRICS, technique.id
        supported = {metric for metric, value in niss.metrics.items() if value != "unknown"}
        assert 0 < len(supported) < len(NISS_METRICS), technique.id
        assert set(niss.metric_evidence) == supported, technique.id
        assert 0.0 <= niss.score_min <= niss.score_max <= 10.0, technique.id
        assert technique.peer_review_status == "peer_reviewed", technique.id


def test_unscored_techniques_carry_a_reason_and_no_metric():
    loader = TaraLoader()
    loader.load()
    unscored = [t for t in loader.registry.techniques if t.niss.scoring_state == "unscored"]
    assert len(unscored) > 0
    for technique in unscored:
        assert technique.niss.unscored_reason is not None, technique.id
        assert technique.niss.score is None and technique.niss.metrics is None, technique.id


def test_techniques_without_peer_review_are_unscored_and_theoretical():
    loader = TaraLoader()
    loader.load()
    for technique in loader.registry.techniques:
        if technique.peer_review_status != "peer_reviewed":
            assert technique.niss.scoring_state == "unscored", technique.id
            assert technique.status in {"THEORETICAL", "SPECULATIVE"}, technique.id


def test_variants_load_apart_from_techniques():
    """Variants are a separate list: none appears among techniques, and each names one existing parent."""
    loader = TaraLoader()
    registry = loader.load()
    technique_ids = {t.id for t in registry.techniques}

    assert len(registry.variants) > 0
    assert loader.get_statistics()["total"] == len(registry.techniques)
    assert loader.get_statistics()["total_variants"] == len(registry.variants)
    for variant in registry.variants:
        assert variant.id not in technique_ids
        assert variant.parent in technique_ids
        assert variant.id.startswith(f"{variant.parent}-V")
        assert variant.parent not in variant.related_ids
        assert loader.get_variant(variant.id) is variant
        assert variant in loader.list_variants(parent=variant.parent)
        assert loader.get_technique(variant.id) is None


def test_variant_alias_extends_the_parent_alias():
    loader = TaraLoader()
    loader.load()
    with open(loader.data_path, encoding="utf-8") as registrar_file:
        dimensions = json.load(registrar_file)["schema_extensions"]["variants"]["format"]["differs_in"]

    for variant in loader.list_variants():
        parent = loader.get_technique(variant.parent)
        code = dimensions[variant.differs_in]["code"]
        assert re.fullmatch(re.escape(f"{parent.tara_alias}-{code}") + r"[1-9]", variant.alias)


def test_variant_differs_in_vocabulary_matches_the_registrar():
    """The SDK's closed vocabulary and the registrar's must be the same set."""
    loader = TaraLoader()
    with open(loader.data_path, encoding="utf-8") as registrar_file:
        dimensions = json.load(registrar_file)["schema_extensions"]["variants"]["format"]["differs_in"]
    assert set(get_args(Variant.model_fields["differs_in"].annotation)) == set(dimensions)


def test_variant_scoring_state_never_inherits():
    """A variant without a peer-reviewed source is capped at THEORETICAL and stays unscored."""
    loader = TaraLoader()
    for variant in loader.list_variants():
        if variant.peer_review_status != "peer_reviewed":
            assert variant.inherits_niss is False
            assert variant.niss.scoring_state == "unscored"
            assert variant.niss.unscored_reason is not None
            assert variant.status in {"THEORETICAL", "SPECULATIVE"}


VARIANT_FIELDS = {
    "id": "QIF-T0024-V01", "alias": "TARA-SIL-M-006-TS1", "name": "Example variant", "parent": "QIF-T0024",
    "differs_in": "training_setup", "inherits_niss": False, "description": "Example.", "conditions": [],
    "sources": [], "defensive_sources": [], "peer_review_status": "none", "status": "THEORETICAL",
    "niss": {"version": "1.1", "scoring_state": "unscored", "unscored_reason": "no_source"},
    "related_ids": [], "notes": None,
}


@pytest.mark.parametrize("override", [
    {"id": "QIF-T0024.001"},
    {"id": "QIF-T0019-V01"},
    {"parent": "QIF-T0024-V01"},
    {"parent": ["QIF-T0024", "QIF-T0019"]},
    {"differs_in": "other"},
    {"related_ids": ["QIF-T0024"]},
    {"inherits_niss": True},
    {"niss": {"version": "1.1", "scoring_state": "scored", "inherited_from": "QIF-T0024"}},
    {"unexpected_field": 1},
])
def test_variant_model_rejects_entries_outside_the_convention(override):
    assert Variant(**VARIANT_FIELDS).parent == "QIF-T0024"
    with pytest.raises(ValidationError):
        Variant(**{**VARIANT_FIELDS, **override})


def test_variant_may_inherit_only_with_a_peer_reviewed_source():
    inheriting = {**VARIANT_FIELDS, "inherits_niss": True, "peer_review_status": "peer_reviewed",
                  "niss": {"version": "1.1", "scoring_state": "scored", "inherited_from": "QIF-T0024"}}
    assert Variant(**inheriting).niss.inherited_from == "QIF-T0024"
    with pytest.raises(ValidationError):
        Variant(**{**inheriting, "peer_review_status": "preprint"})


def test_loader_refuses_a_variant_whose_parent_is_missing(tmp_path):
    registrar = {"version": "0", "framework": "test", "techniques": [],
                 "variants": [VARIANT_FIELDS]}
    path = tmp_path / "registrar.json"
    path.write_text(json.dumps(registrar), encoding="utf-8")
    with pytest.raises(ValueError):
        TaraLoader(data_path=path).load()
