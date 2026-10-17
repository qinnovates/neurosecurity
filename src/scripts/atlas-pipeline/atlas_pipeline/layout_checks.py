"""Checks of a 10-20 electrode layout against the shipped head mesh. Standard library only.

A layout passes when every electrode sits at its share of the measured arc, on the surface, on the
side its name says, and mirrors its partner as closely as the head itself is symmetric. A layout made
by spreading electrodes at equal angles about a centre, as a sphere layout projected outward does, does not pass.
"""
from __future__ import annotations

from typing import Any

from .arc_checks import Triangle, Vec, add_scaled, cross, distance, distance_to_surface, dot, section_polyline, share_along, sub, unit
from .layout_1020 import ARCS, CROSSINGS, ELECTRODE_ORDER, FIDUCIAL_IDS, MIDLINE, MIRROR_PAIRS

SHARE_TOLERANCE = 0.01
SURFACE_TOLERANCE_MM = 2.0
MIDLINE_TOLERANCE_MM = 2.0
MIRROR_SLACK_MM = 1.0
FAR_ABOVE_MM = 1000.0
# The vertex is checked on the arc that did not place it; the temporal positions are only measured, because
# on a real head the half-circumference's midpoint and the ear-to-ear arc's 10 percent point are different points.
CHECKED_CROSSINGS = ("ear_to_ear", "frontal", "parietal")


def top_of_midline(points: dict[str, Vec]) -> Vec:
    """A point far above the head in the plane that holds nasion and inion and stands square to the ear-to-ear line."""
    forward = sub(points["nasion"], points["inion"])
    across = sub(points["right_preauricular"], points["left_preauricular"])
    across = add_scaled(across, forward, -dot(across, forward) / dot(forward, forward))
    centre = add_scaled(points["inion"], forward, 0.5)
    return add_scaled(centre, unit(cross(across, forward)), FAR_ABOVE_MM)


def measure_arcs(triangles: list[Triangle], points: dict[str, Vec]) -> list[dict[str, Any]]:
    """Each arc measured on the mesh: its length and the share of it at which each of its electrodes falls."""
    measured = []
    for arc_id, start, end, through, shares in ARCS:
        toward = top_of_midline(points) if through == "top" else points[through]
        polyline = section_polyline(triangles, points[start], points[end], toward)
        length = sum(distance(first, second) for first, second in zip(polyline, polyline[1:]))
        row: dict[str, Any] = {"id": arc_id, "length_mm": length, "shares": {name: share_along(polyline, points[name]) for name in shares}}
        if arc_id in CROSSINGS:
            row["crossing"] = {"electrode": CROSSINGS[arc_id], "share": share_along(polyline, points[CROSSINGS[arc_id]])}
        measured.append(row)
    return measured


def _share_problems(measured: list[dict[str, Any]]) -> list[str]:
    problems = []
    wanted = {arc_id: shares for arc_id, _, _, _, shares in ARCS}
    for row in measured:
        for name, share in row["shares"].items():
            if abs(share - wanted[row["id"]][name]) > SHARE_TOLERANCE:
                problems.append(f"{name} sits at {share:.3f} of the {row['id']} arc; the 10-20 rule puts it at {wanted[row['id']][name]}")
        if row["id"] in CHECKED_CROSSINGS and abs(row["crossing"]["share"] - 0.5) > SHARE_TOLERANCE:
            problems.append(f"{row['crossing']['electrode']} sits at {row['crossing']['share']:.3f} of the {row['id']} arc; it should be at its middle")
    return problems


def mirror_tolerance_mm(measured: list[dict[str, Any]], points: dict[str, Vec]) -> float:
    """How far a mirrored electrode may sit from its partner: the head's own asymmetry, as measured, plus a millimetre."""
    lengths = {row["id"]: row["length_mm"] for row in measured}
    left, right = points["left_preauricular"], points["right_preauricular"]
    ears = distance((-left[0], left[1], left[2]), right)
    return ears + abs(lengths["left_circumference"] - lengths["right_circumference"]) + MIRROR_SLACK_MM


def _side_problems(points: dict[str, Vec], tolerance_mm: float) -> list[str]:
    problems = [f"{name} is {abs(points[name][0]):.1f} mm off the midline" for name in MIDLINE if abs(points[name][0]) > MIDLINE_TOLERANCE_MM]
    for left_name, right_name in MIRROR_PAIRS:
        left, right = points[left_name], points[right_name]
        if left[0] >= 0 or right[0] <= 0:
            problems.append(f"{left_name} must be on the left (x below 0) and {right_name} on the right; they are at x = {left[0]:.1f} and {right[0]:.1f}")
        gap = distance((-left[0], left[1], left[2]), right)
        if gap > tolerance_mm:
            problems.append(f"{left_name} mirrored is {gap:.1f} mm from {right_name}; the head's own asymmetry allows {tolerance_mm:.1f} mm")
    return problems


def layout_problems(triangles: list[Triangle], fiducials: dict[str, Vec], electrodes: dict[str, Vec]) -> list[str]:
    """Everything wrong with a layout on this mesh; an empty list means it passed."""
    missing = [name for name in ELECTRODE_ORDER if name not in electrodes] + [name for name in FIDUCIAL_IDS if name not in fiducials]
    extra = sorted(set(electrodes) - set(ELECTRODE_ORDER))
    if missing or extra:
        return [f"the layout must hold exactly the 10-20 positions and four landmarks; missing {missing}, not part of it {extra}"]
    points = {**fiducials, **electrodes}
    measured = measure_arcs(triangles, points)
    problems = _share_problems(measured) + _side_problems(points, mirror_tolerance_mm(measured, points))
    for name in (*FIDUCIAL_IDS, *ELECTRODE_ORDER):
        gap = distance_to_surface(triangles, points[name])
        if gap > SURFACE_TOLERANCE_MM:
            problems.append(f"{name} is {gap:.1f} mm from the head surface; at most {SURFACE_TOLERANCE_MM} mm is allowed")
    return problems
