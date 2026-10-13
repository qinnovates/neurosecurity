"""Arcs and distances on a triangle mesh read from a shipped GLB. Standard library only, so it runs anywhere.

Written apart from the placement code on purpose: the placement measures arcs on the template's
voxel image with numpy; this measures them again on the decimated mesh that ships.
"""
from __future__ import annotations

import json
import math
import struct

Vec = tuple[float, float, float]
Triangle = tuple[Vec, Vec, Vec]
INT16_MAX = 32767
COMPONENT_UNSIGNED_INT = 5125


def sub(a: Vec, b: Vec) -> Vec:
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def add_scaled(a: Vec, b: Vec, scale: float) -> Vec:
    return (a[0] + b[0] * scale, a[1] + b[1] * scale, a[2] + b[2] * scale)


def dot(a: Vec, b: Vec) -> float:
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def cross(a: Vec, b: Vec) -> Vec:
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def unit(a: Vec) -> Vec:
    length = math.sqrt(dot(a, a))
    if length < 1e-9:
        raise ValueError("two points of an arc coincide; the layout cannot be checked")
    return (a[0] / length, a[1] / length, a[2] / length)


def distance(a: Vec, b: Vec) -> float:
    return math.dist(a, b)


def read_glb_triangles(payload: bytes) -> dict[str, list[Triangle]]:
    """The triangles of each node of a GLB written by this pipeline, in millimetres, keyed by the node's label id."""
    json_length = struct.unpack_from("<I", payload, 12)[0]
    document = json.loads(payload[20:20 + json_length].decode("utf-8"))
    binary = payload[20 + json_length + 8:]
    meshes: dict[str, list[Triangle]] = {}
    for node in document["nodes"]:
        primitive = document["meshes"][node["mesh"]]["primitives"][0]
        positions, indices = document["accessors"][primitive["attributes"]["POSITION"]], document["accessors"][primitive["indices"]]
        raw = struct.unpack_from(f"<{positions['count'] * 3}h", binary, document["bufferViews"][positions["bufferView"]]["byteOffset"])
        code = "I" if indices["componentType"] == COMPONENT_UNSIGNED_INT else "H"
        order = struct.unpack_from(f"<{indices['count']}{code}", binary, document["bufferViews"][indices["bufferView"]]["byteOffset"])
        vertices = [tuple(max(raw[3 * i + k] / INT16_MAX, -1.0) * node["scale"][k] + node["translation"][k] for k in range(3)) for i in range(positions["count"])]
        meshes[node["extras"]["label_id"]] = [(vertices[order[i]], vertices[order[i + 1]], vertices[order[i + 2]]) for i in range(0, len(order), 3)]
    return meshes


def section_polyline(triangles: list[Triangle], start: Vec, end: Vec, toward: Vec) -> list[Vec]:
    """The mesh's cut by the plane through `start`, `end` and `toward`, from `start` to `end` on the side of `toward`."""
    centre = add_scaled(start, sub(end, start), 0.5)
    along = unit(sub(start, centre))
    side = sub(toward, centre)
    across = unit(add_scaled(side, along, -dot(side, along)))
    normal = cross(along, across)
    found: list[tuple[float, Vec]] = []
    for triangle in triangles:
        heights = [dot(sub(corner, centre), normal) for corner in triangle]
        for first, second in ((0, 1), (1, 2), (2, 0)):
            if (heights[first] < 0) != (heights[second] < 0):
                point = add_scaled(triangle[first], sub(triangle[second], triangle[first]), heights[first] / (heights[first] - heights[second]))
                offset = sub(point, centre)
                angle = math.atan2(dot(offset, across), dot(offset, along))
                if 0.0 < angle < math.pi:
                    found.append((angle, point))
    return [start, *(point for _, point in sorted(found)), end]


def _lengths(polyline: list[Vec]) -> list[float]:
    total = [0.0]
    for first, second in zip(polyline, polyline[1:]):
        total.append(total[-1] + distance(first, second))
    return total


def share_along(polyline: list[Vec], point: Vec) -> float:
    """The share of the polyline's length at its point nearest to `point`."""
    lengths = _lengths(polyline)
    best = (math.inf, 0.0)
    for index, (first, second) in enumerate(zip(polyline, polyline[1:])):
        step = sub(second, first)
        squared = dot(step, step)
        along = 0.0 if squared < 1e-18 else min(max(dot(sub(point, first), step) / squared, 0.0), 1.0)
        gap = distance(point, add_scaled(first, step, along))
        if gap < best[0]:
            best = (gap, lengths[index] + along * math.sqrt(squared))
    return best[1] / lengths[-1]


def point_at_angle_share(polyline: list[Vec], share: float) -> Vec:
    """The polyline point at `share` of the half turn about the arc's centre: the equal-angle construction, not the 10-20 rule."""
    centre = add_scaled(polyline[0], sub(polyline[-1], polyline[0]), 0.5)
    along = unit(sub(polyline[0], centre))
    wanted = share * math.pi
    return min(polyline, key=lambda point: abs(math.acos(max(-1.0, min(1.0, dot(unit(sub(point, centre)), along)))) - wanted))


def distance_to_triangle(point: Vec, triangle: Triangle) -> float:
    """Distance from a point to a triangle (Ericson, Real-Time Collision Detection, closest point on triangle)."""
    a, b, c = triangle
    ab, ac, ap = sub(b, a), sub(c, a), sub(point, a)
    d1, d2 = dot(ab, ap), dot(ac, ap)
    if d1 <= 0 and d2 <= 0:
        return distance(point, a)
    bp = sub(point, b)
    d3, d4 = dot(ab, bp), dot(ac, bp)
    if d3 >= 0 and d4 <= d3:
        return distance(point, b)
    cp = sub(point, c)
    d5, d6 = dot(ab, cp), dot(ac, cp)
    if d6 >= 0 and d5 <= d6:
        return distance(point, c)
    vc, vb, va = d1 * d4 - d3 * d2, d5 * d2 - d1 * d6, d3 * d6 - d5 * d4
    if vc <= 0 and d1 >= 0 and d3 <= 0:
        return distance(point, add_scaled(a, ab, d1 / (d1 - d3)))
    if vb <= 0 and d2 >= 0 and d6 <= 0:
        return distance(point, add_scaled(a, ac, d2 / (d2 - d6)))
    if va <= 0 and d4 - d3 >= 0 and d5 - d6 >= 0:
        return distance(point, add_scaled(b, sub(c, b), (d4 - d3) / ((d4 - d3) + (d5 - d6))))
    total = va + vb + vc
    return distance(point, add_scaled(add_scaled(a, ab, vb / total), ac, vc / total))


def distance_to_surface(triangles: list[Triangle], point: Vec) -> float:
    return min(distance_to_triangle(point, triangle) for triangle in triangles)
