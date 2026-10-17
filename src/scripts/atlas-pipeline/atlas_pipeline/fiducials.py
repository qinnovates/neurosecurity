"""Where the four 10-20 landmarks sit on the template head, by stated rules a rerun repeats exactly.

These are placements on an average head, made by this code and not by a person feeling a skull. The
average blurs skin landmarks, and the inion is a bump on bone that the skin does not show. Each rule
below says what it measures; the review sheet exists so that a person can overrule it.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
from scipy import ndimage

from .scalp_arcs import SURFACE_LEVEL, Scalp, surface_points
from .volumes import sample_at_world

MIDLINE_HALF_WIDTH_MM = 3
CONCAVITY_REACH_MM = 40
SCALP_PEAK_SEARCH_MM = 14
TISSUE_PROBE_MM = 45
BONE_SHARE_OF_PEAK = 0.5
BASELINE_SPAN_MM = 40
THICKENING_FACTOR = 1.5
# The back of the head is nearly flat over some height; its highest point within this of the rearmost is taken.
REARMOST_BAND_MM = 0.5
EAR_WINDOW_BEHIND_NASION_MM = (60, 165)
EAR_WINDOW_AROUND_NASION_MM = (-30, 30)
EAR_BASELINE_FILTER_MM = 41
EAR_SMOOTHING_MM = 5
EAR_MAP_MARGIN_MM = 25
PIT_SHARE_OF_DEPTH = 0.5
FRONT, BACK = np.array([0.0, 1.0, 0.0]), np.array([0.0, -1.0, 0.0])
SIDES = {"left": np.array([-1.0, 0.0, 0.0]), "right": np.array([1.0, 0.0, 0.0])}


@dataclass(frozen=True)
class Head:
    scalp: Scalp
    t1: np.ndarray
    mask: np.ndarray

    def heights(self) -> np.ndarray:
        """Whole-millimetre heights at which the midline column holds head, bottom to top."""
        origin = np.linalg.inv(self.scalp.affine) @ np.array([0.0, 0.0, 0.0, 1.0])
        column = self.mask[int(round(origin[0]))].any(axis=0)
        z = np.arange(self.mask.shape[2]) * self.scalp.affine[2, 2] + self.scalp.affine[2, 3]
        return z[column][1:-1]

    def depth_centre(self) -> float:
        """A front-to-back position that is inside the head at every midline height."""
        y = np.arange(self.mask.shape[1]) * self.scalp.affine[1, 1] + self.scalp.affine[1, 3]
        present = self.mask.any(axis=(0, 2))
        return float((y[present][0] + y[present][-1]) / 2.0)


def _midline_profile(head: Head, direction: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    heights = head.heights()
    origins = np.column_stack([np.zeros_like(heights), np.full_like(heights, head.depth_centre()), heights])
    inside = head.scalp.value_at(origins) >= SURFACE_LEVEL
    heights, origins = heights[inside], origins[inside]
    return heights, surface_points(head.scalp, origins, np.tile(direction, (len(heights), 1)))


def find_nasion(head: Head) -> tuple[np.ndarray, dict[str, Any]]:
    """The deepest point of the hollow between brow and nose on the front midline."""
    heights, points = _midline_profile(head, FRONT)
    front = points[:, 1]
    depth = np.zeros_like(front)
    for index in range(len(front)):
        below, above = front[max(index - CONCAVITY_REACH_MM, 0):index + 1], front[index:index + CONCAVITY_REACH_MM + 1]
        depth[index] = min(below.max(), above.max()) - front[index]
    chosen = int(np.argmax(depth))
    return points[chosen], {"rule": "front midline point of deepest hollow between brow and nose", "hollow_depth_mm": round(float(depth[chosen]), 2)}


def _tissue_thickness(head: Head, skin: np.ndarray) -> float:
    """Millimetres from the skin inward to where the T1 signal falls to half the scalp's brightest: the outer skull."""
    steps = np.arange(TISSUE_PROBE_MM, dtype=np.float64)
    profile = np.zeros(TISSUE_PROBE_MM)
    for offset in range(-MIDLINE_HALF_WIDTH_MM, MIDLINE_HALF_WIDTH_MM + 1):
        line = skin + np.array([float(offset), 0.0, 0.0]) + steps[:, None] * FRONT
        profile += sample_at_world(head.t1, head.scalp.affine, line)
    peak = int(np.argmax(profile[:SCALP_PEAK_SEARCH_MM]))
    below = np.nonzero(profile[peak:] < BONE_SHARE_OF_PEAK * profile[peak])[0]
    return float(peak + below[0]) if below.size else float(TISSUE_PROBE_MM)


def find_inion(head: Head) -> tuple[np.ndarray, dict[str, Any]]:
    """The back midline point where the soft tissue over the skull starts to thicken into the neck.

    The inion is the external occipital protuberance, where the neck muscles attach. Above it the
    scalp is thin and even; below it muscle lies between skin and bone. The rule takes the highest
    point below the back of the head where that thickness reaches 1.5 times its value higher up.
    """
    heights, points = _midline_profile(head, BACK)
    rearmost = int(np.nonzero(points[:, 1] <= points[:, 1].min() + REARMOST_BAND_MM)[0][-1])
    thickness = np.array([_tissue_thickness(head, point) for point in points])
    baseline = float(np.median(thickness[rearmost:rearmost + BASELINE_SPAN_MM + 1]))
    thickened = np.nonzero(thickness[:rearmost] >= THICKENING_FACTOR * baseline)[0]
    if thickened.size == 0:
        raise ValueError("the soft tissue at the back of the head never thickens; the inion rule does not apply to this image")
    chosen = int(thickened[-1])
    facts = {"rule": "highest back midline point, below the rearmost point, where skin-to-skull thickness reaches 1.5 times the scalp's",
             "scalp_thickness_mm": round(baseline, 1), "thickness_here_mm": round(float(thickness[chosen]), 1),
             "rearmost_point_height_mm": round(float(heights[rearmost]), 1)}
    return points[chosen], facts


def _width_map(head: Head, direction: np.ndarray, depths: np.ndarray, heights: np.ndarray) -> np.ndarray:
    grid_y, grid_z = np.meshgrid(depths, heights, indexing="ij")
    origins = np.column_stack([np.zeros(grid_y.size), grid_y.ravel(), grid_z.ravel()])
    edges = surface_points(head.scalp, origins, np.tile(direction, (len(origins), 1)))
    return np.abs(edges[:, 0]).reshape(grid_y.shape)


def find_preauricular(head: Head, side: str, nasion: np.ndarray) -> tuple[np.ndarray, dict[str, Any]]:
    """The centre of the hollow in the side of the head just in front of the ear's ridge.

    The head's half-width is mapped over the side of the head, a wide median of it is taken as the
    head without the ear, and the hollow is where the surface lies furthest inside that.
    """
    margin = EAR_MAP_MARGIN_MM
    bottom = float(head.heights()[0])
    depths = np.arange(nasion[1] - EAR_WINDOW_BEHIND_NASION_MM[1] - margin, nasion[1] - EAR_WINDOW_BEHIND_NASION_MM[0] + margin + 1.0)
    heights = np.arange(max(nasion[2] + EAR_WINDOW_AROUND_NASION_MM[0] - margin, bottom), nasion[2] + EAR_WINDOW_AROUND_NASION_MM[1] + margin + 1.0)
    width = _width_map(head, SIDES[side], depths, heights)
    hollow = ndimage.uniform_filter(width - ndimage.median_filter(width, size=EAR_BASELINE_FILTER_MM, mode="nearest"), EAR_SMOOTHING_MM, mode="nearest")
    low_rows = int(round(max(nasion[2] + EAR_WINDOW_AROUND_NASION_MM[0], bottom) - heights[0]))
    window = hollow[margin:-margin, low_rows:-margin]
    deepest = np.unravel_index(int(np.argmin(window)), window.shape)
    labelled, _ = ndimage.label(window <= PIT_SHARE_OF_DEPTH * window[deepest])
    depth_index, height_index = ndimage.center_of_mass(labelled == labelled[deepest])
    origin = np.array([0.0, depths[margin] + depth_index, heights[low_rows] + height_index])
    point = surface_points(head.scalp, origin, SIDES[side][None, :])[0]
    return point, {"rule": "centre of the hollow in front of the ear's ridge, on the head's side surface", "hollow_depth_mm": round(float(-window[deepest]), 1)}


def find_fiducials(head: Head) -> dict[str, dict[str, Any]]:
    """The four landmarks, each with its position in millimetres and what its rule measured."""
    nasion, nasion_facts = find_nasion(head)
    inion, inion_facts = find_inion(head)
    found = {"nasion": (nasion, nasion_facts), "inion": (inion, inion_facts)}
    for side in SIDES:
        found[f"{side}_preauricular"] = find_preauricular(head, side, nasion)
    return {name: {"position_mm": [round(float(v), 1) for v in point], **facts} for name, (point, facts) in found.items()}
