import json

import numpy as np
import pytest

from atlas_pipeline.glb import GlbNode, read_glb, write_glb

TETRAHEDRON = np.array([[0.0, 0.0, 0.0], [10.0, 0.0, 0.0], [0.0, 20.0, 0.0], [0.0, 0.0, -30.0]])
FACES = np.array([[0, 2, 1], [0, 1, 3], [0, 3, 2], [1, 2, 3]])


def node(label_id: str = "15", shift: float = 0.0) -> GlbNode:
    return GlbNode("cosmetic", {"atlas": "cit168_rl", "label_id": label_id, "hemisphere": "left"}, TETRAHEDRON + shift, FACES)


def test_round_trips_ids_that_loaders_would_mangle_in_node_names() -> None:
    awkward = "a:b.c [d]/e"
    document, nodes = read_glb(write_glb([node(awkward)], "Copyright line", {"source_id": "cit168_rl"}))
    assert nodes[0].extras == {"atlas": "cit168_rl", "label_id": awkward, "hemisphere": "left"}
    assert document["nodes"][0]["extras"]["label_id"] == awkward
    assert document["asset"]["copyright"] == "Copyright line"


def test_positions_survive_quantisation_within_a_thousandth_of_the_box() -> None:
    _, nodes = read_glb(write_glb([node(shift=-40.0)], "c", {}))
    assert np.abs(nodes[0].vertices_mm - (TETRAHEDRON - 40.0)).max() < 30.0 / 1000.0
    assert (nodes[0].triangles == FACES).all()


def test_file_is_geometry_only() -> None:
    document, _ = read_glb(write_glb([node(), node("16", 5.0)], "c", {}))
    for banned in ("images", "textures", "materials", "samplers", "animations", "skins", "cameras"):
        assert banned not in document
    assert document["extensionsRequired"] == ["KHR_mesh_quantization"]
    assert all(set(mesh["primitives"][0]["attributes"]) == {"POSITION"} for mesh in document["meshes"])
    assert len(document["buffers"]) == 1 and "uri" not in document["buffers"][0]


def test_output_is_byte_identical_for_the_same_input() -> None:
    assert write_glb([node()], "c", {"k": 1}) == write_glb([node()], "c", {"k": 1})


def test_reader_rejects_a_truncated_file() -> None:
    payload = write_glb([node()], "c", {})
    with pytest.raises(ValueError, match="length"):
        read_glb(payload[:-4])
    assert json.loads(payload[20:20 + int.from_bytes(payload[12:16], "little")])["asset"]["version"] == "2.0"
