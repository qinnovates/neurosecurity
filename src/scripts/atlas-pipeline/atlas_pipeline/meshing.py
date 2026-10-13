"""Field to mesh: marching cubes on a continuous field, Taubin smoothing, quadric decimation.

Shapes are meshed on their native grid and then decimated. Measured in the spike: decimation
barely changes volume, while meshing on a coarser grid shrinks thin shapes by 10 to 20 percent.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import fast_simplification
import numpy as np
from scipy import ndimage
from scipy.spatial import cKDTree
from skimage import measure

from .errors import MeshError
from .volumes import crop_affine, voxel_volume_mm3, world_coords

ISO_LEVEL = 0.5
MAX_VOLUME_RESCALE = 1.15
MASK_SMOOTHING_SIGMA_VOXELS = 0.5
TAUBIN_LAMBDA, TAUBIN_MU, TAUBIN_ITERATIONS = 0.5, -0.53, 10
DECIMATION_LADDER = (0.99, 0.975, 0.95, 0.9, 0.8, 0.6, 0.0)
TRIANGLE_FLOOR = 200
MAX_VOLUME_DRIFT = 0.10
# Quadric decimation can leave a few edges shared by one or three triangles. The undecimated surface is
# always closed; a decimated one may carry at most this share of such edges, and the share is recorded.
MAX_IRREGULAR_EDGE_SHARE = 0.002
MAX_MEAN_DISTANCE_VOXELS = 0.7
MAX_P95_DISTANCE_VOXELS = 2.0
MAX_CENTROID_SHIFT_SOURCE_VOXELS = 0.5
SURFACE_SAMPLE_SPACING_VOXELS = 0.5
PAD_VOXELS = 3


@dataclass(frozen=True)
class Mesh:
    vertices_mm: np.ndarray
    triangles: np.ndarray
    facts: dict[str, Any]


def taubin_smooth(vertices: np.ndarray, triangles: np.ndarray) -> np.ndarray:
    edges = np.vstack([triangles[:, [0, 1]], triangles[:, [1, 2]], triangles[:, [2, 0]]])
    edges = np.unique(np.sort(edges, axis=1), axis=0)
    degree = np.bincount(edges.ravel(), minlength=len(vertices)).astype(np.float64)[:, None]
    out = vertices.astype(np.float64).copy()
    for _ in range(TAUBIN_ITERATIONS):
        for factor in (TAUBIN_LAMBDA, TAUBIN_MU):
            total = np.zeros_like(out)
            np.add.at(total, edges[:, 0], out[edges[:, 1]])
            np.add.at(total, edges[:, 1], out[edges[:, 0]])
            out += factor * (total / np.maximum(degree, 1.0) - out)
    return out


def mesh_volume_and_centroid(vertices: np.ndarray, triangles: np.ndarray) -> tuple[float, np.ndarray]:
    a, b, c = vertices[triangles[:, 0]], vertices[triangles[:, 1]], vertices[triangles[:, 2]]
    signed = np.einsum("ij,ij->i", a, np.cross(b, c)) / 6.0
    total = float(signed.sum())
    if abs(total) < 1e-9:
        return 0.0, vertices.mean(axis=0)
    centroid = ((a + b + c) / 4.0 * signed[:, None]).sum(axis=0) / total
    return abs(total), centroid


def sample_surface(vertices: np.ndarray, triangles: np.ndarray, spacing: float) -> np.ndarray:
    """Vertices plus points spread over each triangle so that large triangles are covered."""
    a, b, c = vertices[triangles[:, 0]], vertices[triangles[:, 1]], vertices[triangles[:, 2]]
    area = 0.5 * np.linalg.norm(np.cross(b - a, c - a), axis=1)
    per_triangle = np.minimum(np.ceil(area / (spacing * spacing)).astype(int), 64)
    rng = np.random.default_rng(20261009)
    index = np.repeat(np.arange(len(triangles)), per_triangle)
    u, v = rng.random(len(index)), rng.random(len(index))
    flip = u + v > 1.0
    u[flip], v[flip] = 1.0 - u[flip], 1.0 - v[flip]
    inside = a[index] + u[:, None] * (b[index] - a[index]) + v[:, None] * (c[index] - a[index])
    return np.vstack([vertices, (a + b + c) / 3.0, inside])


def surface_distance_voxels(vertices_vox: np.ndarray, triangles: np.ndarray, mask: np.ndarray) -> dict[str, float]:
    """Symmetric distance between a mesh and the boundary of the mask it came from, in voxels."""
    boundary = mask & ~ndimage.binary_erosion(mask)
    to_boundary = ndimage.distance_transform_edt(~boundary)
    samples = sample_surface(vertices_vox, triangles, SURFACE_SAMPLE_SPACING_VOXELS)
    mesh_to_mask = ndimage.map_coordinates(to_boundary, samples.T, order=1, mode="nearest")
    mask_to_mesh, _ = cKDTree(samples).query(np.argwhere(boundary).astype(np.float64))
    both = np.concatenate([mesh_to_mask, mask_to_mesh])
    return {"mean": float(both.mean()), "p95": float(np.percentile(both, 95)), "max": float(both.max())}


def irregular_edge_share(triangles: np.ndarray) -> float:
    """Share of edges not shared by exactly two triangles: zero for a closed manifold surface."""
    edges = np.sort(np.vstack([triangles[:, [0, 1]], triangles[:, [1, 2]], triangles[:, [2, 0]]]), axis=1)
    _, counts = np.unique(edges, axis=0, return_counts=True)
    return float((counts != 2).mean())


def is_closed(triangles: np.ndarray) -> bool:
    return irregular_edge_share(triangles) == 0.0


def has_zero_area(vertices: np.ndarray, triangles: np.ndarray) -> bool:
    a, b, c = (vertices[triangles[:, k]] for k in range(3))
    return bool((np.linalg.norm(np.cross(b - a, c - a), axis=1) < 1e-10).any())


def _within_rules(measured: dict[str, float], centroid_limit_voxels: float) -> bool:
    return (measured["irregular_edges"] <= MAX_IRREGULAR_EDGE_SHARE and measured["zero_area"] < 0.5 and abs(measured["volume_drift"]) <= MAX_VOLUME_DRIFT
            and measured["mean"] <= MAX_MEAN_DISTANCE_VOXELS and measured["p95"] <= MAX_P95_DISTANCE_VOXELS
            and measured["centroid_shift"] <= centroid_limit_voxels)


def _measure(vertices: np.ndarray, triangles: np.ndarray, mask: np.ndarray, mask_volume: float, mask_centroid: np.ndarray) -> dict[str, float]:
    volume, centroid = mesh_volume_and_centroid(vertices, triangles)
    measured = surface_distance_voxels(vertices, triangles, mask)
    measured["volume_drift"] = (volume - mask_volume) / mask_volume
    measured["centroid_shift"] = float(np.linalg.norm(centroid - mask_centroid))
    measured["irregular_edges"] = irregular_edge_share(triangles)
    measured["zero_area"] = 1.0 if has_zero_area(vertices, triangles) else 0.0
    return measured


def restore_volume(vertices: np.ndarray, triangles: np.ndarray, target_volume: float) -> tuple[np.ndarray, float]:
    """Scale a smoothed mesh about its centroid so that it encloses the mask's volume again.

    Taubin smoothing shrinks small, strongly curved shapes by 10 to 25 percent. The factor is capped,
    and the surface-distance rule still has to hold afterwards, so this cannot hide a wrong shape.
    """
    volume, centroid = mesh_volume_and_centroid(vertices, triangles)
    if volume <= 0.0:
        return vertices, 1.0
    factor = float(np.clip((target_volume / volume) ** (1.0 / 3.0), 1.0 / MAX_VOLUME_RESCALE, MAX_VOLUME_RESCALE))
    return centroid + (vertices - centroid) * factor, factor


def mesh_from_field(field: np.ndarray, affine: np.ndarray, from_mask: bool, source_voxel_mm: float | None = None) -> Mesh:
    """Mesh one structure. `field` is a probability map, or a binary mask when `from_mask` is true.

    Works in voxel space on a padded crop, picks the heaviest decimation that keeps volume, centroid
    and surface distance inside the rules, and returns world-space vertices with the measurements.
    `source_voxel_mm` is the source's own voxel when it is coarser than the grid being meshed; the
    centroid may move by half of it.
    """
    voxel_mm = float(abs(affine[0, 0]))
    centroid_limit = MAX_CENTROID_SHIFT_SOURCE_VOXELS * max(source_voxel_mm or 0.0, voxel_mm) / voxel_mm
    mask_full = field >= ISO_LEVEL
    if not mask_full.any():
        raise MeshError("field never reaches the iso level; nothing to mesh")
    box = ndimage.find_objects(mask_full.astype(np.int8))[0]
    start = np.array([s.start for s in box]) - PAD_VOXELS
    crop = np.pad(field[box].astype(np.float32), PAD_VOXELS)
    mask = crop >= ISO_LEVEL
    surface_field = ndimage.gaussian_filter(crop, MASK_SMOOTHING_SIGMA_VOXELS) if from_mask else crop
    vertices, triangles, _, _ = measure.marching_cubes(surface_field, level=ISO_LEVEL)
    mask_voxels = np.argwhere(mask).astype(np.float64)
    mask_volume, mask_centroid = float(len(mask_voxels)), mask_voxels.mean(axis=0)
    vertices, rescale = restore_volume(taubin_smooth(vertices, triangles), triangles, mask_volume)
    base_triangles = len(triangles)
    chosen: tuple[np.ndarray, np.ndarray, dict[str, float], float] = (vertices, triangles, {}, 0.0)
    for reduction in DECIMATION_LADDER:
        if reduction > 0.0 and base_triangles * (1.0 - reduction) < min(TRIANGLE_FLOOR, base_triangles):
            continue
        if reduction == 0.0:
            candidate_v, candidate_t = vertices, triangles
        else:
            candidate_v, candidate_t = fast_simplification.simplify(vertices.astype(np.float32), triangles.astype(np.int32), target_reduction=reduction)
            candidate_v, candidate_t = np.asarray(candidate_v, dtype=np.float64), np.asarray(candidate_t, dtype=np.int64)
        measured = _measure(candidate_v, candidate_t, mask, mask_volume, mask_centroid)
        chosen = (candidate_v, candidate_t, measured, reduction)
        if _within_rules(measured, centroid_limit):
            break
    final_v, final_t, measured, reduction = chosen
    placed = crop_affine(affine, start)
    facts = {
        "triangles_before_decimation": int(base_triangles),
        "decimation": reduction,
        "vertex_count": int(len(final_v)),
        "triangle_count": int(len(final_t)),
        "mask_volume_mm3": round(mask_volume * voxel_volume_mm3(affine), 2),
        "volume_drift_pct": round(100.0 * measured["volume_drift"], 2),
        "centroid_shift_mm": round(measured["centroid_shift"] * voxel_mm, 3),
        "mesh_to_mask_mm": {key: round(measured[key] * voxel_mm, 3) for key in ("mean", "p95", "max")},
        "volume_rescale": round(rescale, 4),
        "irregular_edge_share": round(measured["irregular_edges"], 5),
        "within_rules": _within_rules(measured, centroid_limit),
        "smoothing": {"taubin_lambda": TAUBIN_LAMBDA, "taubin_mu": TAUBIN_MU, "iterations": TAUBIN_ITERATIONS,
                      "pre_smoothing_sigma_voxels": MASK_SMOOTHING_SIGMA_VOXELS if from_mask else 0.0},
    }
    return Mesh(world_coords(placed, final_v), final_t.astype(np.int64), facts)


def mesh_sanity(mesh: Mesh, box_min: np.ndarray, box_max: np.ndarray) -> list[str]:
    """K9: problems with a finished mesh; an empty list means it passed."""
    problems: list[str] = []
    if has_zero_area(mesh.vertices_mm, mesh.triangles):
        problems.append("zero-area triangle")
    if irregular_edge_share(mesh.triangles) > MAX_IRREGULAR_EDGE_SHARE:
        problems.append("surface is not closed")
    if (mesh.vertices_mm < box_min).any() or (mesh.vertices_mm > box_max).any():
        problems.append("vertex outside the template box")
    if not mesh.facts["within_rules"]:
        problems.append("volume, centroid or surface distance outside the rules even without decimation")
    return problems
