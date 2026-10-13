import pytest

pytest.importorskip("numpy", reason="needs the imaging stack; skipped where only the standard library is installed")

import pathlib

import numpy as np
from PIL import Image

from atlas_pipeline import meshing, overlays
from shapes import ball, grid_affine  # noqa: E402



def ball_mesh() -> meshing.Mesh:
    return meshing.mesh_from_field(ball((80, 80, 80), (40.0, 40.0, 40.0), 14.0), grid_affine(), from_mask=True)


def test_plane_through_a_ball_gives_a_ring_of_the_right_radius() -> None:
    mesh = ball_mesh()
    segments = overlays.plane_segments(mesh, 2, 0.0)
    assert len(segments) > 10
    radii = np.linalg.norm(segments.reshape(-1, 3)[:, :2], axis=1)
    assert np.allclose(segments[..., 2], 0.0, atol=1e-9)
    assert 6.0 < radii.min() and radii.max() < 8.0


def test_plane_that_misses_the_mesh_gives_nothing() -> None:
    assert len(overlays.plane_segments(ball_mesh(), 0, 50.0)) == 0


def test_sheet_has_three_panels_and_a_drawn_outline(tmp_path: pathlib.Path) -> None:
    t1 = np.full((80, 80, 80), 100.0, dtype=np.float32)
    path = tmp_path / "sheet.png"
    overlays.write_sheet(path, ball_mesh(), t1, grid_affine(), (0.0, 200.0))
    image = np.asarray(Image.open(path))
    assert image.shape[1] == 3 * image.shape[0]
    coloured = (image[:, :, 0] == overlays.OUTLINE_COLOUR[0]) & (image[:, :, 1] == overlays.OUTLINE_COLOUR[1])
    third = image.shape[0]
    assert all(coloured[:, k * third:(k + 1) * third].sum() > 50 for k in range(3))
