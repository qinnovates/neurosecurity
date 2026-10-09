"""Manifest, per-atlas label tables and notices: everything the pipeline writes beside the meshes.

Generated, never hand-edited, and with no date or commit hash: a second run on unchanged inputs
changes nothing.
"""
from __future__ import annotations

import hashlib
import json
import pathlib
from typing import Any

from . import notices, registration
from .build import BuiltAsset
from .sources import PIPELINE_DIR, Registry, effective_license_id, output_folder, registry_file

MANIFEST_SCHEMA_VERSION = 2
LABEL_TABLE_SCHEMA_VERSION = 1
HASH_PREFIX_LENGTH = 12
INTEGRITY_NOTE = "Hashes show the files were delivered unchanged. They do not prove where a file came from."
CODE_HASH_FILES = ("atlas_build.py", "requirements.txt", "registry/pipeline-inputs.json")
NOT_INDEPENDENTLY_CHECKED = "not independently checked"
INDEPENDENTLY_CHECKED = "independently checked"
MIRROR_REASON = "one hemisphere was drawn and the right side is its mirror, so side is assigned by construction"
SPLIT_REASON = "both sides share one map with no side ids, so side is assigned by construction at x = 0"


def digest(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()


def pipeline_code_hash() -> str:
    paths = sorted((PIPELINE_DIR / "atlas_pipeline").glob("*.py")) + [PIPELINE_DIR / name for name in CODE_HASH_FILES]
    hasher = hashlib.sha256()
    for path in paths:
        hasher.update(path.relative_to(PIPELINE_DIR).as_posix().encode("utf-8"))
        hasher.update(path.read_bytes())
    return hasher.hexdigest()


def _check(check_id: str, status: str, measured: float | None, threshold: float | None, reason: str | None = None) -> dict[str, Any]:
    row: dict[str, Any] = {"id": check_id, "status": status, "measured": measured, "threshold": threshold}
    if reason is not None:
        row["reason"] = reason
    return row


def _differential(check_id: str, outcomes: list[dict[str, Any]], what: str) -> dict[str, Any]:
    """A V1 or V2 row: the smallest gain over header-only placement against the largest spread across settings."""
    measured, threshold = min(row["gain_min"] for row in outcomes), max(row["spread"] for row in outcomes)
    better = all(row["outcome"] == "better" for row in outcomes)
    counts = {name: sum(row["outcome"] == name for row in outcomes) for name in ("better", "not_distinguishable", "worse")}
    return _check(check_id, "pass" if better else "fail", measured, threshold,
                  f"{what}: {counts['better']} better, {counts['not_distinguishable']} not distinguishable, {counts['worse']} worse than the "
                  "header-only placement, judged against the spread across three registration settings")


def asset_checks(built: BuiltAsset, evidence: dict[str, Any] | None) -> tuple[list[dict[str, Any]], str]:
    """The manifest's check rows for one asset, and the position check they support."""
    plan, kind, source_id = built.plan, built.plan["kind"], built.plan["source"]
    rows = [_check("K0", "pass", None, None, "; ".join(f"{h['file']}: axes {h['axis_codes']}, determinant sign {h['determinant_sign']}, "
                                                         f"placement from {h['placement_from']}" for h in built.header_records)),
            _check("K9", "pass", 0.0, 0.0, "meshes closed, no zero-area triangles, inside the template box, volume and surface distance within the rules")]
    position = NOT_INDEPENDENTLY_CHECKED
    scans = (evidence or {}).get("shift_scans", {})
    if kind in ("probability_maps", "discrete_lateralised"):
        scan = scans.get(source_id)
        rows.append(_check("K5", "not_run", None, None, "no evidence file; run the evidence command") if scan is None else
                    _check("K5", "pass" if scan["passed"] else "fail", scan["margin"], 0.0,
                           f"zero shift scores {scan['identity_ncc']} against {scan['best_other_ncc']} for the best shifted or mirrored placement"))
    if kind == "probability_maps":
        rows.append(_check("K6", "not_run", None, None, SPLIT_REASON))
    if kind == "discrete_lateralised":
        correct = [node for node in built.nodes if (node["centroid_mm"][0] < 0) == (node["extras"]["hemisphere"] == "left")]
        rows.append(_check("K6", "pass" if len(correct) == len(built.nodes) else "fail", len(correct) / max(len(built.nodes), 1), 1.0,
                           "share of labels whose centroid lies on the side the publisher's table names"))
    if kind == "discrete_mirrored":
        rows.append(_check("K6", "not_run", None, None, MIRROR_REASON))
        registration_evidence = (evidence or {}).get("registration")
        if registration_evidence is None:
            rows.append(_check("V1", "not_run", None, None, "no evidence file; run the evidence command"))
        else:
            folding = evidence["folding"]
            rows.append(_check("K4", "pass" if folding["non_positive_voxels_in_mask"] == 0 else "fail", float(folding["non_positive_voxels_in_mask"]), 0.0,
                               "voxels in the brain mask where the warp's Jacobian determinant is not positive"))
            v1 = _differential("V1", list(registration_evidence["outcomes"]["v1_grey_matter_share"].values()), "grey-matter share of gyral labels per hemisphere")
            v2 = _differential("V2", list(registration_evidence["outcomes"]["v2_hd95_mm"].values()), "95th-percentile surface distance to CIT168 shapes per side")
            if plan["layer"] == "cortical":
                rows.append(v1)
                position = INDEPENDENTLY_CHECKED if v1["status"] == "pass" else NOT_INDEPENDENTLY_CHECKED
            else:
                rows.append(v2)
    return rows, position


def asset_record(built: BuiltAsset, registry: Registry, evidence: dict[str, Any] | None, code_hash: str) -> dict[str, Any]:
    plan, source_id = built.plan, built.plan["source"]
    source, verdict = registry.sources[source_id], registry.verdicts[source_id]
    sha256 = hashlib.sha256(built.glb).hexdigest()
    transform = registry.inputs["transforms"].get(plan.get("transform", ""))
    computed_with = [] if transform is None else sorted({transform["moving_source"], transform["fixed_source"]} - {source_id})
    used_names = [plan[key] for key in ("file", "names_file") if key in plan]
    fetched = {row["name"]: row["sha256"] for row in source["files"] if row.get("sha256") and (not used_names or row["name"] in used_names)}
    for input_id in computed_with:
        fetched.update({row["name"]: row["sha256"] for row in registry.sources[input_id]["files"] if row.get("sha256")})
    route_step: dict[str, Any] = {"kind": source["route"]["kind"]}
    if "publisher_registration" in source["route"]:
        route_step["publisher_registration"] = source["route"]["publisher_registration"]
    register_stage = None if transform is None else {
        "archive_sha256": {row["name"]: row["sha256"] for row in transform["archive"]}, "setting": transform["setting"],
        "tool": transform["tool"], "tool_version": transform["tool_version"], "seed": transform["random_seed"],
        "parameters": _flat(registration.SETTINGS[transform["setting"]]),
    }
    stages = {"fetch": fetched, "register": register_stage, "resample": digest([fetched, register_stage, plan]),
              "mesh": digest([plan, code_hash]), "write": sha256}
    checks, position = asset_checks(built, evidence)
    return {
        "id": plan["id"], "path": f"{output_folder(registry, source_id)}/{plan['id']}.{sha256[:HASH_PREFIX_LENGTH]}.glb", "kind": "mesh", "layer": plan["layer"],
        "bytes": len(built.glb), "sha256": sha256, "input_fingerprint": digest([fetched, register_stage, plan, code_hash]),
        "source_ids": [source_id], "computed_with_source_ids": computed_with,
        "license_id": effective_license_id(source, verdict), "stated_license_id": source["license_id"], "route": [route_step],
        "delineation": {"basis": source["delineation"]["basis"], "subjects": source["delineation"]["subjects"],
                        "hemispheres": plan["hemispheres"], "grid_voxel_mm": plan.get("grid_voxel_mm") or next((row["grid_voxel_mm"] for row in built.report if "grid_voxel_mm" in row), 1.0),
                        "acquisition_voxel_mm": plan.get("acquisition_voxel_mm"), "probability_meaning": plan["probability_meaning"]},
        "libraries": library_versions(), "nodes": built.nodes, "checks": checks, "stage_fingerprints": stages, "position_check": position,
        "modification_note": notices.changes_for(plan),
    }


def _flat(parameters: dict[str, Any]) -> dict[str, Any]:
    """Registration parameters as text, numbers or booleans; a schedule such as (40, 20, 10) becomes "40x20x10"."""
    return {key: ("x".join(str(item) for item in value) if isinstance(value, tuple) else value) for key, value in parameters.items()}


def library_versions() -> dict[str, str]:
    from importlib import metadata

    return {name: metadata.version(name) for name in ("nibabel", "numpy", "scipy", "scikit-image", "fast-simplification", "antspyx")}


def label_table(atlas: str, labels: list[Any]) -> dict[str, Any]:
    unique = {label.label_id: label for label in labels}
    return {"schema_version": LABEL_TABLE_SCHEMA_VERSION, "atlas": atlas,
            "labels": [{"id": label.label_id, "name": label.name, "hemisphere": label.hemisphere} for label in unique.values()]}


def manifest_document(registry: Registry, assets: list[dict[str, Any]], code_hash: str) -> dict[str, Any]:
    return {"schema_version": MANIFEST_SCHEMA_VERSION, "template_space": registry.declared_space, "units": "mm", "axes": "RAS",
            "pipeline_code_hash": code_hash, "integrity_note": INTEGRITY_NOTE, "assets": assets}


def write_json(path: pathlib.Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
