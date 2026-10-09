import pathlib

import nibabel as nib
import numpy as np
import pytest

from atlas_pipeline import build, structures
from atlas_pipeline.errors import HeaderError, RegistryError
from atlas_pipeline.headers import header_facts, load_canonical

from conftest import ball

BOX = build.TemplateBox(np.full(3, -100.0), np.full(3, 100.0))


def symmetric_affine(voxel: float, shape: tuple[int, int, int]) -> np.ndarray:
    affine = np.diag([voxel, voxel, voxel, 1.0])
    affine[:3, 3] = [-(n - 1) * voxel / 2.0 for n in shape]
    return affine


def test_allen_ids_too_large_for_float32_survive_compaction() -> None:
    big = 266441657
    assert int(np.float32(big)) != big
    annotation = np.zeros((4, 4, 4), dtype=np.int64)
    annotation[1, 1, 1], annotation[2, 2, 2] = big, 10392
    compact, ids = structures.compact_allen_ids(annotation)
    assert ids.tolist() == [10392, big] and compact.dtype == np.uint8
    assert compact[1, 1, 1] == 2 and compact[2, 2, 2] == 1 and compact[0, 0, 0] == 0


def test_mirrored_volume_yields_one_structure_per_side_with_the_same_label_id() -> None:
    shape = (60, 30, 30)
    affine = symmetric_affine(0.5, shape)
    compact = np.zeros(shape, dtype=np.uint8)
    compact[ball(shape, (14.0, 15.0, 15.0), 6.0) | ball(shape, (45.0, 15.0, 15.0), 6.0)] = 1
    rows = [{"id": "12114", "name": "precentral gyrus", "acronym": "PrCG"}]
    found = list(structures.mirrored_structures("allen", compact, affine, np.array([12114]), rows))
    assert [(s.label_id, s.hemisphere) for s in found] == [("12114", "left"), ("12114", "right")]
    left, right = found
    assert left.field.sum() == right.field.sum() > 0
    assert left.affine[0, 3] < 0 < right.affine[0, 3] + right.field.shape[0] * 0.5


def test_probability_maps_are_split_at_the_midline(tmp_path: pathlib.Path) -> None:
    shape = (40, 20, 20)
    affine = symmetric_affine(1.0, shape)
    probability = np.zeros(shape + (2,), dtype=np.float32)
    probability[..., 1] = (ball(shape, (10.0, 10.0, 10.0), 5.0) | ball(shape, (30.0, 10.0, 10.0), 3.0)) * 0.9
    path = tmp_path / "prob.nii.gz"
    image = nib.Nifti1Image(probability, affine)
    image.set_sform(affine, code=1)
    nib.save(image, str(path))
    found = list(structures.probability_structures("atlas", path, [{"id": "1", "name": "Nucleus"}], 0.5))
    assert [s.hemisphere for s in found] == ["left", "right"]
    assert found[0].volume_mm3_at["0.5"] > found[1].volume_mm3_at["0.5"] > 0
    assert found[0].max_probability == pytest.approx(0.9, abs=1e-3)


def test_a_volume_read_without_orientation_is_refused(tmp_path: pathlib.Path) -> None:
    image = nib.Nifti1Image(np.zeros((4, 4, 4), dtype=np.uint8), np.eye(4))
    image.set_sform(None, code=0)
    image.set_qform(None, code=0)
    path = tmp_path / "bare.nii"
    nib.save(image, str(path))
    with pytest.raises(HeaderError, match="neither sform nor qform"):
        header_facts(path)


def test_a_volume_stored_back_to_front_is_reoriented_through_its_affine(tmp_path: pathlib.Path) -> None:
    data = np.zeros((6, 8, 6), dtype=np.float32)
    data[1, 1, 1] = 1.0
    flipped_y = np.diag([1.0, -1.0, 1.0, 1.0])
    flipped_y[:3, 3] = [0.0, 7.0, 0.0]
    image = nib.Nifti1Image(data, flipped_y)
    image.set_qform(flipped_y, code=1)
    path = tmp_path / "rps.nii"
    nib.save(image, str(path))
    assert header_facts(path)["axis_codes"] == "RPS" and header_facts(path)["determinant_sign"] == -1
    canonical, affine = load_canonical(path)
    voxel = np.argwhere(canonical > 0.5)[0]
    assert (affine[:3, :3] @ voxel + affine[:3, 3]).tolist() == [1.0, 6.0, 1.0]


def make_structure(mask: np.ndarray, affine: np.ndarray) -> structures.Structure:
    return structures.Structure("atlas", "7", "Fixture", "left", mask, affine, True, 0.5, 1.0, {"0.25": 1.0, "0.5": 1.0, "0.75": 1.0})


def test_an_unresolved_structure_ships_a_marker_and_never_a_mesh() -> None:
    affine = symmetric_affine(1.0, (20, 20, 20))
    node, report, mesh = build.build_node(make_structure(ball((20, 20, 20), (10.0, 10.0, 10.0), 1.5), affine), None, BOX)
    assert node["size_class"] == "unresolved" and node["vertex_count"] == 0 and mesh is None
    assert report["marker"]["nominal_radius_mm"] > 0 and len(report["marker"]["centroid_mm"]) == 3


def test_a_resolved_structure_ships_a_mesh_with_both_drift_measures() -> None:
    affine = symmetric_affine(0.5, (60, 60, 60))
    node, report, mesh = build.build_node(make_structure(ball((60, 60, 60), (30.0, 30.0, 30.0), 12.0), affine), None, BOX)
    assert node["size_class"] == "resolved" and node["vertex_count"] > 0 and mesh is not None
    assert {"volume_drift_pct", "mesh_to_mask_mm", "decimation", "triangle_count"} <= set(report)
    assert report["sanity_problems"] == []


def test_size_class_uses_acquisition_voxels_when_the_grid_is_finer() -> None:
    affine = symmetric_affine(0.5, (40, 40, 40))
    structure = make_structure(ball((40, 40, 40), (20.0, 20.0, 20.0), 3.2), affine)
    on_grid, _, _ = build.build_node(structure, None, BOX)
    on_acquisition, report, _ = build.build_node(structure, 1.0, BOX)
    assert on_grid["size_class"] == "resolved"
    assert on_acquisition["size_class"] in ("coarse", "unresolved")
    assert on_acquisition["voxels"] < on_grid["voxels"] and report["size_rule_voxel_mm"] == 1.0


def test_build_plan_naming_an_unannotated_allen_structure_is_refused(tmp_path: pathlib.Path) -> None:
    csv_path = tmp_path / "voxel_count.csv"
    csv_path.write_text("id,acronym,name,structure_id_path,annotated\n1,A,alpha,/1/,True\n", encoding="utf-8")
    rows = structures.read_allen_table(csv_path)
    with pytest.raises(RegistryError, match="not annotated"):
        structures.select_allen_rows(rows, csv_path, {"acronyms": ["A", "Missing"]})


def test_specks_beside_a_structure_are_dropped_and_counted() -> None:
    shape = (50, 30, 30)
    affine = symmetric_affine(0.5, shape)
    body, speck = ball(shape, (18.0, 15.0, 15.0), 9.0), ball(shape, (42.0, 15.0, 15.0), 1.2)
    node, report, mesh = build.build_node(make_structure(body | speck, affine), None, BOX)
    assert report["dropped_fragment_voxels"] == int(speck.sum()) > 0
    assert mesh is not None and mesh.vertices_mm[:, 0].max() < (36.0 - 24.5) * 0.5
    assert report["connected_pieces"] == 1


def test_the_largest_piece_is_never_dropped_even_when_it_is_small() -> None:
    affine = symmetric_affine(1.0, (20, 20, 20))
    field, dropped = build.drop_fragments(ball((20, 20, 20), (10.0, 10.0, 10.0), 1.5), 0.5, 1.0)
    assert dropped == 0 and field.sum() > 0
