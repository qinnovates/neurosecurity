"""Read the triangles of a shipped GLB and measure which way they are wound. Standard library only, so it runs in CI."""
from __future__ import annotations

import json
import struct

Vec = tuple[float, float, float]
Triangle = tuple[Vec, Vec, Vec]
INT16_MAX = 32767
COMPONENT_UNSIGNED_INT = 5125


def read_glb_triangles(payload: bytes) -> dict[str, list[Triangle]]:
    """The triangles of each node of a GLB written by this pipeline, in millimetres, keyed `<label id>:<hemisphere>`."""
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
        meshes[f"{node['extras']['label_id']}:{node['extras']['hemisphere']}"] = [(vertices[order[i]], vertices[order[i + 1]], vertices[order[i + 2]]) for i in range(0, len(order), 3)]
    return meshes


def signed_volume_mm3(triangles: list[Triangle]) -> float:
    """Positive when the triangles of a closed mesh run counter-clockwise seen from outside: glTF's front face."""
    total = 0.0
    for a, b, c in triangles:
        total += a[0] * (b[1] * c[2] - b[2] * c[1]) + a[1] * (b[2] * c[0] - b[0] * c[2]) + a[2] * (b[0] * c[1] - b[1] * c[0])
    return total / 6.0
