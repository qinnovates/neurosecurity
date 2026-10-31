"""The committed manifest against the registry, the build plan and the code. Standard library only.

These run in the pull-request workflow. They catch a manifest, notice or license text edited by hand,
and pipeline code changed without a rebuild.
"""
import hashlib
import json
import types

import pytest

from atlas_pipeline import codehash, manifest, notices, sources
from atlas_pipeline.registration_settings import flat_parameters

ASSET_DIR = sources.REPO_ROOT / "src" / "site" / "atlas-assets"
REGISTRY = sources.load_registry()
MANIFEST = json.loads((ASSET_DIR / "manifest.json").read_text(encoding="utf-8"))
PLANS = {plan["id"]: plan for plan in REGISTRY.inputs["assets"]}
REBUILD_PENDING = sources.PIPELINE_DIR / "registry" / "rebuild-pending.json"
EVIDENCE = json.loads((sources.PIPELINE_DIR / "evidence" / "registration-evidence.json").read_text(encoding="utf-8"))


def outcome(name: str, gain: float = 0.1, spread: float = 0.01) -> dict:
    return {"outcome": name, "gain_min": gain, "spread": spread}


def test_manifest_lists_exactly_the_buildable_planned_assets() -> None:
    buildable = [plan["id"] for plan in REGISTRY.inputs["assets"] if sources.is_buildable(REGISTRY, plan["source"])]
    assert [asset["id"] for asset in MANIFEST["assets"]] == buildable
    assert len(buildable) >= 5


def test_code_hash_is_that_of_the_committed_pipeline() -> None:
    current = codehash.pipeline_code_hash()
    if not REBUILD_PENDING.exists():
        assert MANIFEST["pipeline_code_hash"] == current, "pipeline code or its plan changed since the last build; rebuild the assets"
        return
    pending = json.loads(REBUILD_PENDING.read_text(encoding="utf-8"))
    assert MANIFEST["pipeline_code_hash"] == pending["built_code_hash"], "manifest code hash changed; delete rebuild-pending.json after a rebuild"
    assert current == pending["current_code_hash"], "pipeline code or its plan changed again while a rebuild is pending; review it and update rebuild-pending.json"


def test_code_hash_changes_with_any_source_file(tmp_path) -> None:
    (tmp_path / "atlas_pipeline").mkdir()
    (tmp_path / "registry").mkdir()
    for name in ("atlas_build.py", "requirements.txt", "registry/pipeline-inputs.json", "atlas_pipeline/a.py"):
        (tmp_path / name).write_text("x", encoding="utf-8")
    before = codehash.pipeline_code_hash(tmp_path)
    (tmp_path / "atlas_pipeline" / "a.py").write_text("y", encoding="utf-8")
    assert codehash.pipeline_code_hash(tmp_path) != before


def test_each_modification_note_is_the_one_the_plan_generates() -> None:
    for asset in MANIFEST["assets"]:
        assert asset["modification_note"] == notices.changes_for(PLANS[asset["id"]], notices.measured_facts(EVIDENCE)), asset["id"]


def test_fetch_pins_are_the_registry_pins_and_the_transform_record_is_the_pinned_archive() -> None:
    registered = 0
    for asset in MANIFEST["assets"]:
        for key, digest in asset["stage_fingerprints"]["fetch"].items():
            source_id, file_name = key.split("/", 1)
            assert digest == sources.registry_file(REGISTRY, source_id, file_name)["sha256"], key
        record = asset["stage_fingerprints"]["register"]
        if record is None:
            assert "transform" not in PLANS[asset["id"]]
            continue
        registered += 1
        transform = REGISTRY.inputs["transforms"][PLANS[asset["id"]]["transform"]]
        assert record == {"archive_sha256": {row["name"]: row["sha256"] for row in transform["archive"]}, "setting": transform["setting"],
                          "tool": transform["tool"], "tool_version": transform["tool_version"], "seed": transform["random_seed"],
                          "parameters": flat_parameters(transform["setting"])}
    assert registered == 2


def test_no_label_ships_in_two_assets() -> None:
    keys = [(node["extras"]["atlas"], node["extras"]["label_id"], node["extras"]["hemisphere"]) for asset in MANIFEST["assets"] for node in asset["nodes"]]
    assert len(keys) > 200
    assert len(keys) == len(set(keys))


def test_support_files_hash_to_the_manifest_and_nothing_else_is_served() -> None:
    listed = MANIFEST["support_files"]
    assert len(listed) >= 7
    for relative, digest in listed.items():
        assert hashlib.sha256((ASSET_DIR / relative).read_bytes()).hexdigest() == digest, relative
    on_disk = {path.relative_to(ASSET_DIR).as_posix() for path in ASSET_DIR.rglob("*") if path.is_file()}
    assert on_disk == set(listed) | {asset["path"] for asset in MANIFEST["assets"]} | {"manifest.json"}


def test_notices_and_license_text_regenerate_to_the_committed_files() -> None:
    for folder in ("open", "by-sa"):
        assert notices.folder_notice(folder, REGISTRY, MANIFEST["assets"]) == (ASSET_DIR / folder / "NOTICE.txt").read_text(encoding="utf-8")
    assert notices.share_alike_licence_text() == (ASSET_DIR / "by-sa" / "LICENSE.txt").read_text(encoding="utf-8")


def test_notice_generation_would_show_a_removed_wording() -> None:
    committed = (ASSET_DIR / "by-sa" / "NOTICE.txt").read_text(encoding="utf-8")
    assert "Human Connectome Project" in committed and "not legal advice" in committed
    assert notices.folder_notice("by-sa", REGISTRY, MANIFEST["assets"]) != committed.replace("They are not legal advice.", "A lawyer confirmed them.")


@pytest.mark.parametrize(("outcomes", "status"), [
    ([outcome("better"), outcome("better")], "pass"),
    ([outcome("better"), outcome("not_distinguishable", -0.05, 0.3)], "not_distinguishable"),
    ([outcome("not_distinguishable"), outcome("worse", -0.9, 0.1)], "fail"),
])
def test_three_outcome_rule_reaches_the_check_row(outcomes: list, status: str) -> None:
    row = manifest._differential("V2", outcomes, "surface distance")
    assert row["status"] == status and "parameter settings" in row["reason"]


def test_a_failed_check_is_never_exempt() -> None:
    records = [{"id": "deep-allen", "checks": [{"id": "V2", "status": "fail"}, {"id": "K9", "status": "pass"}]},
               {"id": "cortex-allen", "checks": [{"id": "V1", "status": "not_distinguishable"}, {"id": "K6", "status": "not_run"}]}]
    assert manifest.failed_checks(records) == ["deep-allen V2"]
    assert manifest.failed_checks(MANIFEST["assets"]) == []


def fake_built(layer: str) -> types.SimpleNamespace:
    return types.SimpleNamespace(plan={"id": "x", "kind": "discrete_mirrored", "source": "allen_hra_3d_2020", "layer": layer},
                                 header_records=[{"file": "a.nii.gz", "axis_codes": "RAS", "determinant_sign": 1, "placement_from": "qform"}], nodes=[])


def evidence(v1: str, v2: str) -> dict:
    return {"folding": {"non_positive_voxels_in_mask": 0}, "shift_scans": {},
            "registration": {"outcomes": {"v1_grey_matter_share": {"left": outcome(v1)}, "v2_hd95_mm": {"STN|left": outcome(v2, -0.1, 0.4)}}}}


def test_cortex_reads_checked_in_aggregate_only_when_the_pooled_measure_passes() -> None:
    _, passed = manifest.asset_checks(fake_built("cortical"), evidence("better", "not_distinguishable"))
    _, undecided = manifest.asset_checks(fake_built("cortical"), evidence("not_distinguishable", "better"))
    _, missing = manifest.asset_checks(fake_built("cortical"), None)
    assert (passed, undecided, missing) == ("checked in aggregate", "not independently checked", "not independently checked")


def test_deep_shapes_never_read_as_checked_and_record_what_the_second_measure_found() -> None:
    rows, position = manifest.asset_checks(fake_built("deep"), evidence("better", "not_distinguishable"))
    assert position == "not independently checked"
    assert next(row for row in rows if row["id"] == "V2")["status"] == "not_distinguishable"
    assert next(row for row in manifest.asset_checks(fake_built("deep"), evidence("better", "worse"))[0] if row["id"] == "V2")["status"] == "fail"


def test_committed_manifest_says_what_was_shown() -> None:
    by_id = {asset["id"]: asset for asset in MANIFEST["assets"]}
    assert by_id["cortex-allen"]["position_check"] == "checked in aggregate"
    assert {asset["position_check"] for asset_id, asset in by_id.items() if asset_id != "cortex-allen"} == {"not independently checked"}
    assert next(check for check in by_id["deep-allen"]["checks"] if check["id"] == "V2")["status"] == "not_distinguishable"


REGISTRATION_CHECK_IDS = ("K4", "K5", "V1", "V2")


def recomputed(asset: dict, evidence_document: dict | None) -> tuple[list[dict], str]:
    """The registration and placement check rows, and the position check, that the evidence gives this asset."""
    built = types.SimpleNamespace(plan=PLANS[asset["id"]], header_records=[], nodes=asset["nodes"])
    rows, position = manifest.asset_checks(built, evidence_document)
    return [row for row in rows if row["id"] in REGISTRATION_CHECK_IDS], position


def test_manifest_check_rows_and_position_checks_are_what_the_committed_evidence_gives() -> None:
    compared = 0
    for asset in MANIFEST["assets"]:
        rows, position = recomputed(asset, EVIDENCE)
        assert [row for row in asset["checks"] if row["id"] in REGISTRATION_CHECK_IDS] == rows, asset["id"]
        assert asset["position_check"] == position, asset["id"]
        compared += len(rows)
    assert compared >= 6


def test_evidence_edited_to_a_different_outcome_no_longer_matches_the_manifest() -> None:
    edited = json.loads(json.dumps(EVIDENCE))
    for side in edited["registration"]["outcomes"]["v1_grey_matter_share"].values():
        side["outcome"] = "not_distinguishable"
    cortex = next(asset for asset in MANIFEST["assets"] if asset["id"] == "cortex-allen")
    rows, position = recomputed(cortex, edited)
    assert position == "not independently checked" != cortex["position_check"]
    assert rows != [row for row in cortex["checks"] if row["id"] in REGISTRATION_CHECK_IDS]
    scan_edited = json.loads(json.dumps(EVIDENCE))
    scan_edited["shift_scans"]["cit168_rl"]["margin"] = -0.5
    scan_edited["shift_scans"]["cit168_rl"]["passed"] = False
    cit = next(asset for asset in MANIFEST["assets"] if asset["id"] == "deep-cit168")
    assert recomputed(cit, scan_edited)[0] != [row for row in cit["checks"] if row["id"] in REGISTRATION_CHECK_IDS]
