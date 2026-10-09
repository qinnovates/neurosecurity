"""Review sheets: each shape's outline on the declared template's T1, in three planes through its centroid.

Written to the cache for a person to look at; never committed. No automated check can stand in for
that look.
"""
from __future__ import annotations

import pathlib

import numpy as np
from PIL import Image

from .meshing import Mesh, sample_surface
from .volumes import sample_at_world

HALF_WIDTH_MM = 32.0
PIXEL_MM = 0.25
SLAB_MM = 0.3
OUTLINE_COLOUR = np.array([255, 80, 40], dtype=np.uint8)
PLANES = ((1, 2, 0), (0, 2, 1), (0, 1, 2))  # (horizontal axis, vertical axis, slice axis): sagittal, coronal, axial


def _plane_image(t1: np.ndarray, affine: np.ndarray, centre: np.ndarray, plane: tuple[int, int, int], half_width: float) -> np.ndarray:
    horizontal, vertical, _ = plane
    steps = np.arange(-half_width, half_width, PIXEL_MM)
    grid_h, grid_v = np.meshgrid(steps, steps[::-1])
    points = np.tile(centre, (grid_h.size, 1))
    points[:, horizontal] += grid_h.ravel()
    points[:, vertical] += grid_v.ravel()
    return sample_at_world(t1, affine, points).reshape(grid_h.shape)


def write_sheet(path: pathlib.Path, mesh: Mesh, t1: np.ndarray, affine: np.ndarray, t1_window: tuple[float, float]) -> None:
    centre = (mesh.vertices_mm.min(axis=0) + mesh.vertices_mm.max(axis=0)) / 2.0
    half_width = max(HALF_WIDTH_MM, float((mesh.vertices_mm.max(axis=0) - mesh.vertices_mm.min(axis=0)).max()) / 2.0 + 8.0)
    surface = sample_surface(mesh.vertices_mm, mesh.triangles, PIXEL_MM)
    panels = []
    for plane in PLANES:
        horizontal, vertical, normal = plane
        grey = np.clip((_plane_image(t1, affine, centre, plane, half_width) - t1_window[0]) / (t1_window[1] - t1_window[0]), 0.0, 1.0)
        rgb = np.repeat((grey * 255).astype(np.uint8)[:, :, None], 3, axis=2)
        near = surface[np.abs(surface[:, normal] - centre[normal]) < SLAB_MM]
        columns = np.floor((near[:, horizontal] - centre[horizontal] + half_width) / PIXEL_MM).astype(int)
        rows = np.floor((centre[vertical] + half_width - near[:, vertical]) / PIXEL_MM).astype(int)
        keep = (columns >= 0) & (columns < rgb.shape[1]) & (rows >= 0) & (rows < rgb.shape[0])
        rgb[rows[keep], columns[keep]] = OUTLINE_COLOUR
        panels.append(rgb)
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.concatenate(panels, axis=1)).save(path, optimize=True)
