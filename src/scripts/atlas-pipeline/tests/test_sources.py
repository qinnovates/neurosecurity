import copy
import json

import pytest

from atlas_pipeline import sources
from atlas_pipeline.errors import RegistryError

SOURCE = {"id": "fixture", "licence_id": "cc-by-4.0", "redistribute": True, "route": {"kind": "header_resample", "status": "settled"}, "files": []}
VERDICT = {"source_id": "fixture", "verdict": "SHIP", "grant": "explicit", "treat_as": None, "access_agreement": None,
           "clearance": {"cleared": True, "reason": "fixture", "unlocks_when": [], "drafted_by": "ai"}}


def changed(base: dict, path: list[str], value: object) -> dict:
    out = copy.deepcopy(base)
    target = out
    for key in path[:-1]:
        target = target[key]
    target[path[-1]] = value
    return out


def test_a_cleared_settled_source_builds() -> None:
    assert sources.buildability_blockers(SOURCE, VERDICT, False) == []


@pytest.mark.parametrize(("source", "verdict", "accepted", "blocker"), [
    (SOURCE, changed(VERDICT, ["clearance", "cleared"], False), False, "not_cleared"),
    (SOURCE, changed(VERDICT, ["verdict"], "NEEDS-KEVIN"), False, "verdict_not_ship"),
    (SOURCE, changed(VERDICT, ["grant"], "interpretation"), False, "grant_not_explicit"),
    (SOURCE, changed(VERDICT, ["treat_as"], "hcp-data-use-terms"), False, "licence_not_commercial"),
    (changed(SOURCE, ["redistribute"], False), VERDICT, False, "not_redistributable"),
    (SOURCE, changed(VERDICT, ["access_agreement"], {"name": "terms", "terms_url": "https://example.org", "text_sha256": "a" * 64}), False, "agreement_not_accepted"),
    (changed(SOURCE, ["route", "status"], "open"), VERDICT, False, "route_not_settled"),
    (changed(SOURCE, ["route", "kind"], "unknown"), VERDICT, False, "route_not_settled"),
])
def test_each_blocker_stops_a_build(source: dict, verdict: dict, accepted: bool, blocker: str) -> None:
    assert sources.buildability_blockers(source, verdict, accepted) == [blocker]


def test_an_accepted_agreement_unblocks_and_a_missing_verdict_blocks() -> None:
    gated = changed(VERDICT, ["access_agreement"], {"name": "terms", "terms_url": "https://example.org", "text_sha256": "a" * 64})
    assert sources.buildability_blockers(SOURCE, gated, True) == []
    assert sources.buildability_blockers(SOURCE, None, False) == ["not_cleared"]


def test_committed_buildability_file_equals_the_rule_on_the_real_registry() -> None:
    registry = sources.load_registry()
    committed = json.loads((sources.PIPELINE_DIR / "registry" / "buildability.json").read_text(encoding="utf-8"))["sources"]
    assert committed == sources.buildability_table(registry)
    assert len(committed) >= 5
    assert any(blockers for blockers in committed.values()) and any(not blockers for blockers in committed.values())


def test_every_planned_source_is_buildable_and_pinned_and_held_sources_are_not() -> None:
    registry = sources.load_registry()
    for plan in registry.inputs["assets"]:
        assert sources.is_buildable(registry, plan["source"]), plan["id"]
        for key in ("file", "names_file"):
            if key in plan:
                assert sources.pinned_sha256(sources.registry_file(registry, plan["source"], plan[key]))
    assert not sources.is_buildable(registry, "harvard_aan_v2")
    assert not sources.is_buildable(registry, "hcp1065_tracts")


def test_share_alike_material_goes_to_its_own_folder() -> None:
    registry = sources.load_registry()
    assert sources.output_folder(registry, "cit168_rl") == "by-sa"
    assert sources.output_folder(registry, "allen_hra_3d_2020") == "open"
    with pytest.raises(RegistryError, match="no output folder"):
        sources.output_folder(registry, "hcp_s1200_mmp1")


def test_unpinned_file_is_refused() -> None:
    with pytest.raises(RegistryError, match="no sha256 pin"):
        sources.pinned_sha256({"name": "x", "sha256": None})
