"""Arcs over the scalp: the tape-measure lines the 10-20 system is defined on.

An arc is the curve where a plane cuts the head surface between two points. Electrodes sit at shares
of its measured length. This is the construction the system defines; spreading electrodes at equal
angles on a sphere and projecting them outward is a different one.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy import ndimage

SURFACE_LEVEL = 0.5
SMOOTHING_SIGMA_VOXELS = 1.0
ANGLE_STEPS = 3600
RAY_STEP_MM = 0.25
RAY_LENGTH_MM = 260.0


@dataclass(frozen=True)
class Scalp:
    """A head mask blurred into a continuous field, so the surface can be found between voxels."""
    field: np.ndarray
    affine: np.ndarray

    @classmethod
    def from_mask(cls, mask: np.ndarray, affine: np.ndarray) -> "Scalp":
        return cls(ndimage.gaussian_filter(mask.astype(np.float32), SMOOTHING_SIGMA_VOXELS), affine)

    def value_at(self, world_mm: np.ndarray) -> np.ndarray:
        voxel = (np.asarray(world_mm, dtype=np.float64) - self.affine[:3, 3]) @ np.linalg.inv(self.affine[:3, :3]).T
        return ndimage.map_coordinates(self.field, voxel.T, order=1, mode="constant", cval=0.0)


def _unit(vector: np.ndarray) -> np.ndarray:
    length = float(np.linalg.norm(vector))
    if length < 1e-9:
        raise ValueError("cannot take the direction of a zero-length vector; two arc points coincide")
    return vector / length


def surface_points(scalp: Scalp, origins: np.ndarray, directions: np.ndarray) -> np.ndarray:
    """Where each ray leaves the head for the last time: the outermost surface point.

    `origins` is one point for all rays, or one point per ray; every origin must be inside the head.
    """
    radii = np.arange(RAY_LENGTH_MM, 0.0, -RAY_STEP_MM)
    origins = np.broadcast_to(np.asarray(origins, dtype=np.float64), directions.shape)
    samples = origins[:, None, :] + directions[:, None, :] * radii[None, :, None]
    values = scalp.value_at(samples.reshape(-1, 3)).reshape(len(directions), len(radii))
    inside = values >= SURFACE_LEVEL
    if not inside.any(axis=1).all() or inside[:, 0].any():
        raise ValueError("a ray never crosses the head surface; its origin is outside this head or beyond the image")
    first = inside.argmax(axis=1)
    rows = np.arange(len(directions))
    inner, outer = values[rows, first], values[rows, first - 1]
    radius = radii[first] + RAY_STEP_MM * (inner - SURFACE_LEVEL) / np.maximum(inner - outer, 1e-9)
    return origins + directions * radius[:, None]


def snap_to_surface(scalp: Scalp, point: np.ndarray, centre: np.ndarray) -> np.ndarray:
    """Move `point` along the line from `centre` onto the head surface."""
    return surface_points(scalp, centre, _unit(point - centre)[None, :])[0]


def trace_arc(scalp: Scalp, start: np.ndarray, end: np.ndarray, toward: np.ndarray) -> np.ndarray:
    """The surface curve from `start` to `end` in the plane that also holds `toward`, on the side of `toward`.

    The plane is swept about the midpoint of the two ends, half a turn. Returns points in millimetres.
    """
    centre = (start + end) / 2.0
    along = _unit(start - centre)
    side = toward - centre
    across = _unit(side - along * float(side @ along))
    angles = np.linspace(0.0, np.pi, ANGLE_STEPS + 1)
    directions = np.cos(angles)[:, None] * along + np.sin(angles)[:, None] * across
    return surface_points(scalp, centre, directions)


def cumulative_length(polyline: np.ndarray) -> np.ndarray:
    return np.concatenate([[0.0], np.cumsum(np.linalg.norm(np.diff(polyline, axis=0), axis=1))])


def arc_length(polyline: np.ndarray) -> float:
    return float(cumulative_length(polyline)[-1])


def point_at_fraction(polyline: np.ndarray, fraction: float) -> np.ndarray:
    """The point at `fraction` of the arc's measured length."""
    lengths = cumulative_length(polyline)
    target = fraction * lengths[-1]
    index = int(np.clip(np.searchsorted(lengths, target) - 1, 0, len(polyline) - 2))
    share = (target - lengths[index]) / max(lengths[index + 1] - lengths[index], 1e-12)
    return polyline[index] + share * (polyline[index + 1] - polyline[index])


def fraction_of(polyline: np.ndarray, point: np.ndarray) -> float:
    """The share of the arc's length at the polyline vertex nearest to `point`."""
    lengths = cumulative_length(polyline)
    nearest = int(np.argmin(np.linalg.norm(polyline - point, axis=1)))
    return float(lengths[nearest] / lengths[-1])
