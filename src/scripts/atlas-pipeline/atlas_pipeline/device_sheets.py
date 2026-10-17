"""Review sheets for the device stage: each landmark on the template image, and the layout on the head mesh.

Written to the cache for a person to look at; never committed. The landmark rules are estimates on an
average head, and this look is the only check of whether they landed where an anatomist would put them.
"""
from __future__ import annotations

import pathlib
from typing import Any

import numpy as np
from PIL import Image, ImageDraw

from .arc_checks import Triangle
from .overlays import PLANES
from .volumes import sample_at_world

HALF_WIDTH_MM = 70.0
PIXEL_MM = 0.5
MARK_RADIUS_PIXELS = 7
MARK_COLOUR = (255, 80, 40)
MESH_COLOUR = (90, 90, 90)
DOT_COLOUR = (40, 160, 255)
VIEW_PIXELS = 520
VIEW_MARGIN_MM = 15.0
# (name, horizontal axis, horizontal sign, vertical axis, depth axis, depth sign): a position is drawn in the views it faces.
VIEWS = (("left", 1, -1.0, 2, 0, -1.0), ("right", 1, 1.0, 2, 0, 1.0), ("top", 0, 1.0, 1, 2, 1.0), ("front", 0, -1.0, 2, 1, 1.0), ("back", 0, 1.0, 2, 1, -1.0))


def write_fiducial_sheet(path: pathlib.Path, point: np.ndarray, t1: np.ndarray, affine: np.ndarray, t1_window: tuple[float, float]) -> None:
    """Sagittal, coronal and axial cuts of the template through one landmark, with a ring on it."""
    steps = np.arange(-HALF_WIDTH_MM, HALF_WIDTH_MM, PIXEL_MM)
    panels = []
    for horizontal, vertical, _ in PLANES:
        grid_h, grid_v = np.meshgrid(steps, steps[::-1])
        points = np.tile(point, (grid_h.size, 1))
        points[:, horizontal] += grid_h.ravel()
        points[:, vertical] += grid_v.ravel()
        grey = np.clip((sample_at_world(t1, affine, points).reshape(grid_h.shape) - t1_window[0]) / (t1_window[1] - t1_window[0]), 0.0, 1.0)
        panel = Image.fromarray((grey * 255).astype(np.uint8)).convert("RGB")
        middle = HALF_WIDTH_MM / PIXEL_MM
        ImageDraw.Draw(panel).ellipse([middle - MARK_RADIUS_PIXELS, middle - MARK_RADIUS_PIXELS, middle + MARK_RADIUS_PIXELS, middle + MARK_RADIUS_PIXELS],
                                      outline=MARK_COLOUR, width=2)
        panels.append(np.asarray(panel))
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.concatenate(panels, axis=1)).save(path, optimize=True)


def _view_panel(triangles: list[Triangle], points: dict[str, Any], view: tuple[str, int, float, int, int, float], centre: np.ndarray, half: float) -> np.ndarray:
    name, horizontal, sign, vertical, depth, depth_sign = view
    panel = Image.new("RGB", (VIEW_PIXELS, VIEW_PIXELS), (0, 0, 0))
    draw = ImageDraw.Draw(panel)
    scale = VIEW_PIXELS / (2.0 * half)

    def place(point: Any) -> tuple[float, float]:
        return ((sign * (point[horizontal] - centre[horizontal]) + half) * scale, (half - (point[vertical] - centre[vertical])) * scale)

    for triangle in triangles:
        if depth_sign * (sum(corner[depth] for corner in triangle) / 3.0 - centre[depth]) > 0:
            draw.line([place(triangle[0]), place(triangle[1]), place(triangle[2]), place(triangle[0])], fill=MESH_COLOUR)
    for label, point in points.items():
        if depth_sign * (point[depth] - centre[depth]) >= 0:
            x, y = place(point)
            draw.ellipse([x - 4, y - 4, x + 4, y + 4], fill=DOT_COLOUR)
            draw.text((x + 6, y - 6), label, fill=(255, 255, 255))
    draw.text((8, 8), f"seen from the {name}", fill=(255, 255, 255))
    return np.asarray(panel)


def write_layout_sheet(path: pathlib.Path, triangles: list[Triangle], points: dict[str, Any]) -> None:
    """The landmarks and electrodes on the shipped head mesh, seen from five sides."""
    corners = np.array([corner for triangle in triangles for corner in triangle])
    centre = (corners.min(axis=0) + corners.max(axis=0)) / 2.0
    half = float((corners.max(axis=0) - corners.min(axis=0)).max()) / 2.0 + VIEW_MARGIN_MM
    panels = [_view_panel(triangles, points, view, centre, half) for view in VIEWS]
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.concatenate(panels, axis=1)).save(path, optimize=True)
