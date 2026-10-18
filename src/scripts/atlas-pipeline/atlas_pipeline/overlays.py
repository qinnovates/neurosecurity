"""Review sheets: each shape's outline on the declared template's T1, in three planes through its centre.

Written to the cache for a person to look at; never committed. No automated check can stand in for
that look.
"""
from __future__ import annotations

import pathlib

import numpy as np
from PIL import Image, ImageDraw

from .meshing import Mesh
from .volumes import sample_at_world

HALF_WIDTH_MM = 32.0
MARGIN_MM = 8.0
PIXEL_MM = 0.25
MAX_PANEL_PIXELS = 512
OUTLINE_COLOUR = (255, 80, 40)
OUTLINE_WIDTH_PIXELS = 2
PLANES = ((1, 2, 0), (0, 2, 1), (0, 1, 2))  # (horizontal axis, vertical axis, slice axis): sagittal, coronal, axial


def plane_segments(mesh: Mesh, axis: int, position: float) -> np.ndarray:
    """Where the mesh's triangles cross the plane `axis = position`: an (n, 2, 3) array of segment end points."""
    corners = mesh.vertices_mm[mesh.triangles]
    offset = corners[:, :, axis] - position
    crossing = (offset.min(axis=1) < 0) & (offset.max(axis=1) >= 0)
    corners, offset = corners[crossing], offset[crossing]
    segments = []
    for triangle, distance in zip(corners, offset):
        points = []
        for first, second in ((0, 1), (1, 2), (2, 0)):
            if (distance[first] < 0) != (distance[second] < 0):
                fraction = distance[first] / (distance[first] - distance[second])
                points.append(triangle[first] + fraction * (triangle[second] - triangle[first]))
        if len(points) == 2:
            segments.append(points)
    return np.array(segments, dtype=np.float64).reshape(-1, 2, 3)


def write_sheet(path: pathlib.Path, mesh: Mesh, t1: np.ndarray, affine: np.ndarray, t1_window: tuple[float, float]) -> None:
    low, high = mesh.vertices_mm.min(axis=0), mesh.vertices_mm.max(axis=0)
    centre = (low + high) / 2.0
    half_width = max(HALF_WIDTH_MM, float((high - low).max()) / 2.0 + MARGIN_MM)
    pixel_mm = max(PIXEL_MM, 2.0 * half_width / MAX_PANEL_PIXELS)
    steps = np.arange(-half_width, half_width, pixel_mm)
    panels = []
    for horizontal, vertical, normal in PLANES:
        grid_h, grid_v = np.meshgrid(steps, steps[::-1])
        points = np.tile(centre, (grid_h.size, 1))
        points[:, horizontal] += grid_h.ravel()
        points[:, vertical] += grid_v.ravel()
        grey = np.clip((sample_at_world(t1, affine, points).reshape(grid_h.shape) - t1_window[0]) / (t1_window[1] - t1_window[0]), 0.0, 1.0)
        panel = Image.fromarray((grey * 255).astype(np.uint8)).convert("RGB")
        draw = ImageDraw.Draw(panel)
        for start, end in plane_segments(mesh, normal, float(centre[normal])):
            draw.line([((start[horizontal] - centre[horizontal] + half_width) / pixel_mm, (centre[vertical] + half_width - start[vertical]) / pixel_mm),
                       ((end[horizontal] - centre[horizontal] + half_width) / pixel_mm, (centre[vertical] + half_width - end[vertical]) / pixel_mm)],
                      fill=OUTLINE_COLOUR, width=OUTLINE_WIDTH_PIXELS)
        panels.append(np.asarray(panel))
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.concatenate(panels, axis=1)).save(path, optimize=True)
