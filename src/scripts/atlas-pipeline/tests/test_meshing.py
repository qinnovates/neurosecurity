import numpy as np
import pytest

from atlas_pipeline import meshing
from atlas_pipeline.errors import MeshError
from atlas_pipeline.volumes import mask_facts, size_class

from conftest import ball


def test_ball_mesh_keeps_volume_centroid_and_surface(ball_mask: np.ndarray, grid_affine: np.ndarray) -> None:
    mesh = meshing.mesh_from_field(ball_mask, grid_affine, from_mask=True)
    assert mesh.facts["within_rules"] is True
    assert abs(mesh.facts["volume_drift_pct"]) < 10.0
    assert mesh.facts["mesh_to_mask_mm"]["mean"] < 0.5 * meshing.MAX_MEAN_DISTANCE_VOXELS + 0.2
    assert meshing.is_closed(mesh.triangles)
    assert mesh.facts["triangle_count"] < mesh.facts["triangles_before_decimation"]
    centre_mm = np.array([40.0, 40.0, 40.0]) * 0.5 - 20.0
    assert np.abs(mesh.vertices_mm.mean(axis=0) - centre_mm).max() < 0.5
    assert meshing.mesh_sanity(mesh, np.full(3, -30.0), np.full(3, 30.0)) == []


def test_sanity_catches_a_mesh_outside_the_template_box(ball_mask: np.ndarray, grid_affine: np.ndarray) -> None:
    mesh = meshing.mesh_from_field(ball_mask, grid_affine, from_mask=True)
    assert "vertex outside the template box" in meshing.mesh_sanity(mesh, np.full(3, -1.0), np.full(3, 1.0))


def test_sanity_catches_an_open_surface_and_a_degenerate_triangle(ball_mask: np.ndarray, grid_affine: np.ndarray) -> None:
    mesh = meshing.mesh_from_field(ball_mask, grid_affine, from_mask=True)
    opened = meshing.Mesh(mesh.vertices_mm, mesh.triangles[1:], mesh.facts)
    assert "surface is not closed" in meshing.mesh_sanity(opened, np.full(3, -30.0), np.full(3, 30.0))
    degenerate = mesh.triangles.copy()
    degenerate[0] = [degenerate[0][0], degenerate[0][0], degenerate[0][1]]
    assert "zero-area triangle" in meshing.mesh_sanity(meshing.Mesh(mesh.vertices_mm, degenerate, mesh.facts), np.full(3, -30.0), np.full(3, 30.0))


def test_small_shapes_keep_a_triangle_floor(grid_affine: np.ndarray) -> None:
    small = ball((30, 30, 30), (15.0, 15.0, 15.0), 4.0)
    mesh = meshing.mesh_from_field(small, grid_affine, from_mask=True)
    assert mesh.facts["triangle_count"] >= min(meshing.TRIANGLE_FLOOR, mesh.facts["triangles_before_decimation"])


def test_empty_field_is_an_error(grid_affine: np.ndarray) -> None:
    with pytest.raises(MeshError):
        meshing.mesh_from_field(np.zeros((8, 8, 8), dtype=np.float32), grid_affine, from_mask=False)


@pytest.mark.parametrize(("voxels", "extent", "expected"), [
    (100, 4.0, "resolved"), (99, 4.0, "coarse"), (100, 3.9, "coarse"), (20, 2.0, "coarse"),
    (19, 3.0, "unresolved"), (500, 1.9, "unresolved"),
])
def test_size_class_boundaries(voxels: int, extent: float, expected: str) -> None:
    assert size_class(voxels, extent) == expected


def test_mask_facts_measures_the_largest_piece_not_the_union(grid_affine: np.ndarray) -> None:
    two = ball((60, 30, 30), (12.0, 15.0, 15.0), 6.0) | ball((60, 30, 30), (45.0, 15.0, 15.0), 3.0)
    facts = mask_facts(two, grid_affine)
    assert facts["connected_pieces"] == 2
    assert 11.0 < facts["shortest_extent_voxels"] < 14.5
    assert facts["largest_piece_voxels"] < facts["voxels"]


def test_small_thin_shapes_get_their_volume_back_after_smoothing(grid_affine: np.ndarray) -> None:
    thin = np.zeros((30, 30, 30), dtype=bool)
    thin[10:20, 12:18, 13:16] = True
    mesh = meshing.mesh_from_field(thin, grid_affine, from_mask=True)
    assert 1.0 < mesh.facts["volume_rescale"] <= meshing.MAX_VOLUME_RESCALE
    assert abs(mesh.facts["volume_drift_pct"]) < 100.0 * meshing.MAX_VOLUME_DRIFT


def test_volume_rescale_is_capped() -> None:
    vertices = np.array([[0.0, 0.0, 0.0], [1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]])
    triangles = np.array([[0, 2, 1], [0, 1, 3], [0, 3, 2], [1, 2, 3]])
    _, factor = meshing.restore_volume(vertices, triangles, target_volume=100.0)
    assert factor == meshing.MAX_VOLUME_RESCALE
