"""Geometry-only GLB 2.0 writer and reader.

Positions are normalised int16 (KHR_mesh_quantization); each node's translation and scale undo the
quantisation. No normals, materials, textures or images, and one embedded buffer. Ids travel in node
`extras`, because loaders rewrite node names.
Coordinates are RAS millimetres in the declared template space, not glTF's metres with y up; the
scene converts.
"""
from __future__ import annotations

import json
import struct
from dataclasses import dataclass
from typing import Any

import numpy as np

GLB_MAGIC, GLB_VERSION = 0x46546C67, 2
CHUNK_JSON, CHUNK_BIN = 0x4E4F534A, 0x004E4942
COMPONENT_SHORT, COMPONENT_UNSIGNED_SHORT, COMPONENT_UNSIGNED_INT = 5122, 5123, 5125
TARGET_ARRAY_BUFFER, TARGET_ELEMENT_ARRAY_BUFFER = 34962, 34963
INT16_MAX = 32767
UINT16_LIMIT = 65535
GENERATOR = "qinnovate atlas pipeline"


@dataclass(frozen=True)
class GlbNode:
    name: str
    extras: dict[str, str]
    vertices_mm: np.ndarray
    triangles: np.ndarray


def _pad4(payload: bytes, filler: bytes) -> bytes:
    return payload + filler * (-len(payload) % 4)


def quantise(vertices: np.ndarray) -> tuple[np.ndarray, list[float], list[float]]:
    """Map vertices into int16 around the box centre. Returns (int16 array, translation, scale)."""
    low, high = vertices.min(axis=0), vertices.max(axis=0)
    centre = (low + high) / 2.0
    half = np.maximum((high - low) / 2.0, 1e-6)
    quantised = np.rint((vertices - centre) / half * INT16_MAX).astype(np.int16)
    return quantised, [float(v) for v in centre], [float(v) for v in half]


def write_glb(nodes: list[GlbNode], copyright_text: str, asset_extras: dict[str, Any]) -> bytes:
    """Serialise nodes to GLB bytes. Output depends only on the arguments, so reruns are identical."""
    buffer = bytearray()
    document: dict[str, Any] = {
        "asset": {"version": "2.0", "generator": GENERATOR, "copyright": copyright_text, "extras": asset_extras},
        "extensionsUsed": ["KHR_mesh_quantization"],
        "extensionsRequired": ["KHR_mesh_quantization"],
        "scene": 0,
        "scenes": [{"nodes": list(range(len(nodes)))}],
        "nodes": [], "meshes": [], "accessors": [], "bufferViews": [],
    }
    for index, node in enumerate(nodes):
        positions, translation, scale = quantise(node.vertices_mm)
        wide = len(node.vertices_mm) > UINT16_LIMIT
        indices = node.triangles.astype(np.uint32 if wide else np.uint16).ravel()
        views = []
        for payload, target in ((positions.tobytes(), TARGET_ARRAY_BUFFER), (indices.tobytes(), TARGET_ELEMENT_ARRAY_BUFFER)):
            offset = len(buffer)
            buffer.extend(_pad4(payload, b"\x00"))
            document["bufferViews"].append({"buffer": 0, "byteOffset": offset, "byteLength": len(payload), "target": target})
            views.append(len(document["bufferViews"]) - 1)
        document["accessors"].append({
            "bufferView": views[0], "componentType": COMPONENT_SHORT, "normalized": True, "count": int(len(positions)), "type": "VEC3",
            "min": [int(v) for v in positions.min(axis=0)], "max": [int(v) for v in positions.max(axis=0)],
        })
        document["accessors"].append({
            "bufferView": views[1], "componentType": COMPONENT_UNSIGNED_INT if wide else COMPONENT_UNSIGNED_SHORT,
            "count": int(len(indices)), "type": "SCALAR",
        })
        document["meshes"].append({"primitives": [{"attributes": {"POSITION": 2 * index}, "indices": 2 * index + 1, "mode": 4}]})
        document["nodes"].append({"name": node.name, "mesh": index, "translation": translation, "scale": scale, "extras": dict(node.extras)})
    document["buffers"] = [{"byteLength": len(buffer)}]
    json_chunk = _pad4(json.dumps(document, separators=(",", ":"), sort_keys=True).encode("utf-8"), b" ")
    bin_chunk = bytes(buffer)
    total = 12 + 8 + len(json_chunk) + 8 + len(bin_chunk)
    return b"".join([
        struct.pack("<III", GLB_MAGIC, GLB_VERSION, total),
        struct.pack("<II", len(json_chunk), CHUNK_JSON), json_chunk,
        struct.pack("<II", len(bin_chunk), CHUNK_BIN), bin_chunk,
    ])


def read_glb(payload: bytes) -> tuple[dict[str, Any], list[GlbNode]]:
    """Parse GLB bytes written by `write_glb`. Returns the JSON document and the dequantised nodes."""
    magic, version, total = struct.unpack_from("<III", payload, 0)
    if magic != GLB_MAGIC or version != GLB_VERSION or total != len(payload):
        raise ValueError("not a GLB 2.0 file, or its length field is wrong")
    json_length, json_type = struct.unpack_from("<II", payload, 12)
    if json_type != CHUNK_JSON:
        raise ValueError("first GLB chunk is not JSON")
    document = json.loads(payload[20:20 + json_length].decode("utf-8"))
    bin_start = 20 + json_length
    bin_length, bin_type = struct.unpack_from("<II", payload, bin_start)
    if bin_type != CHUNK_BIN:
        raise ValueError("second GLB chunk is not binary")
    binary = payload[bin_start + 8:bin_start + 8 + bin_length]
    nodes = []
    for node in document["nodes"]:
        primitive = document["meshes"][node["mesh"]]["primitives"][0]
        position_accessor = document["accessors"][primitive["attributes"]["POSITION"]]
        index_accessor = document["accessors"][primitive["indices"]]
        position_view = document["bufferViews"][position_accessor["bufferView"]]
        index_view = document["bufferViews"][index_accessor["bufferView"]]
        raw = np.frombuffer(binary, dtype=np.int16, count=position_accessor["count"] * 3, offset=position_view["byteOffset"]).reshape(-1, 3)
        index_type = np.uint32 if index_accessor["componentType"] == COMPONENT_UNSIGNED_INT else np.uint16
        triangles = np.frombuffer(binary, dtype=index_type, count=index_accessor["count"], offset=index_view["byteOffset"]).reshape(-1, 3)
        vertices = np.maximum(raw.astype(np.float64) / INT16_MAX, -1.0) * np.array(node["scale"]) + np.array(node["translation"])
        nodes.append(GlbNode(node["name"], node["extras"], vertices, triangles.astype(np.int64)))
    return document, nodes
