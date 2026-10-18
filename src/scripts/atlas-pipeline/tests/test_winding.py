"""Every committed mesh is wound outward. Standard library only; runs in the pull-request workflow.

glTF front faces are counter-clockwise seen from outside. A mesh wound the other way has a negative
signed volume, and a viewer draws its far inner wall. The first release of these assets shipped
every mesh wound inward, and no check looked.
"""
import json

import pytest

from atlas_pipeline import sources
from atlas_pipeline.glb_triangles import read_glb_triangles, signed_volume_mm3

ASSET_DIR = sources.REPO_ROOT / "src" / "site" / "atlas-assets"
MANIFEST = json.loads((ASSET_DIR / "manifest.json").read_text(encoding="utf-8"))
MESHES = {asset["id"]: read_glb_triangles((ASSET_DIR / asset["path"]).read_bytes()) for asset in MANIFEST["assets"]}


def test_every_committed_mesh_has_a_positive_signed_volume() -> None:
    inward = [f"{asset_id} {key}" for asset_id, meshes in MESHES.items() for key, triangles in meshes.items() if signed_volume_mm3(triangles) <= 0.0]
    assert inward == []
    assert sum(len(meshes) for meshes in MESHES.values()) >= 217


def test_left_and_right_sides_are_both_outward_and_every_listed_mesh_was_measured() -> None:
    for asset in MANIFEST["assets"]:
        listed = {f"{node['extras']['label_id']}:{node['extras']['hemisphere']}" for node in asset["nodes"] if node["vertex_count"] > 0}
        assert set(MESHES[asset["id"]]) == listed, asset["id"]
    sides = {key.rsplit(":", 1)[1] for meshes in MESHES.values() for key in meshes}
    assert {"left", "right", "both"} <= sides


def test_signed_volume_is_close_to_the_volume_the_manifest_records() -> None:
    outline = next(asset for asset in MANIFEST["assets"] if asset["id"] == "outline")
    recorded = outline["nodes"][0]["volume_mm3_at"]["0.5"]
    assert abs(signed_volume_mm3(MESHES["outline"]["brain_mask:both"]) - recorded) < 0.02 * recorded


def test_a_mesh_with_its_triangles_reversed_measures_negative() -> None:
    triangles = MESHES["outline"]["brain_mask:both"]
    reversed_mesh = [(c, b, a) for a, b, c in triangles]
    assert signed_volume_mm3(reversed_mesh) < 0.0 < signed_volume_mm3(triangles)
    assert signed_volume_mm3(reversed_mesh) == pytest.approx(-signed_volume_mm3(triangles), rel=1e-9)


def test_the_manifest_records_the_winding_check_for_every_asset() -> None:
    for asset in MANIFEST["assets"]:
        row = next(check for check in asset["checks"] if check["id"] == "K10")
        assert row["status"] == "pass" and row["measured"] == 0.0 and "counter-clockwise" in row["reason"]
