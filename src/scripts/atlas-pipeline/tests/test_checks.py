"""Every check must fail on the seeded fault it claims to catch, and pass on the correct input."""
import numpy as np
import pytest
from scipy import ndimage

from atlas_pipeline import checks
from atlas_pipeline.volumes import side_selectors

from conftest import ball

AFFINE = np.diag([1.0, 1.0, 1.0, 1.0])
AFFINE[:3, 3] = [-32.0, -32.0, -32.0]


def asymmetric_image() -> np.ndarray:
    image = ball((64, 64, 64), (32.0, 32.0, 32.0), 24.0).astype(np.float32)
    image += 2.0 * ball((64, 64, 64), (20.0, 36.0, 30.0), 6.0)
    image += 1.0 * ball((64, 64, 64), (42.0, 24.0, 40.0), 4.0)
    return ndimage.gaussian_filter(image, 1.0)


def scan(moving_affine: np.ndarray, moving: np.ndarray | None = None) -> dict:
    fixed = asymmetric_image()
    return checks.shift_scan(fixed, AFFINE, fixed > 0.05, fixed if moving is None else moving, moving_affine)


def test_shift_scan_passes_for_an_aligned_image() -> None:
    result = scan(AFFINE)
    assert result["passed"] is True and result["margin"] > 0


@pytest.mark.parametrize("axis", [0, 1, 2])
def test_shift_scan_fails_on_a_one_millimetre_offset(axis: int) -> None:
    shifted = AFFINE.copy()
    shifted[axis, 3] += 1.0
    assert scan(shifted)["passed"] is False


def test_shift_scan_fails_on_a_left_right_mirror() -> None:
    assert scan(AFFINE, asymmetric_image()[::-1].copy())["passed"] is False


def gyral_fixture() -> tuple[np.ndarray, dict[str, np.ndarray], dict[str, np.ndarray]]:
    shape = (40, 40, 40)
    shell = ball(shape, (20.0, 20.0, 20.0), 14.0) & ~ball(shape, (20.0, 20.0, 20.0), 10.0)
    labels = np.where(shell, 3, 0).astype(np.uint8)
    affine = np.diag([0.5, 0.5, 0.5, 1.0])
    affine[:3, 3] = [-10.0, -10.0, -10.0]
    tissue = {"gm": shell, "csf": ~ball(shape, (20.0, 20.0, 20.0), 14.0)}
    return labels, tissue, side_selectors(shape, affine)


def test_tissue_share_is_one_when_labels_sit_in_grey_matter() -> None:
    labels, tissue, sides = gyral_fixture()
    share = checks.tissue_share(labels, np.array([3]), tissue, sides)
    assert share["left"]["gm"] == 1.0 and share["right"]["csf"] == 0.0 and share["left"]["voxels"] > 0


@pytest.mark.parametrize("axis", [0, 1, 2])
def test_tissue_share_falls_under_a_two_millimetre_shift(axis: int) -> None:
    labels, tissue, sides = gyral_fixture()
    correct = checks.tissue_share(labels, np.array([3]), tissue, sides)
    shifted = checks.tissue_share(np.roll(labels, 4, axis=axis), np.array([3]), tissue, sides)
    assert min(shifted["left"]["gm"], shifted["right"]["gm"]) < correct["left"]["gm"] - 0.1
    assert max(shifted["left"]["csf"], shifted["right"]["csf"]) > 0.05


def test_compare_masks_sees_a_shift_and_reports_millimetres() -> None:
    a = ball((50, 50, 50), (25.0, 25.0, 25.0), 8.0)
    same = checks.compare_masks(a, a, 0.5)
    moved = checks.compare_masks(a, np.roll(a, 4, axis=1), 0.5)
    assert same["dice"] == 1.0 and same["hd95_mm"] == 0.0
    assert moved["centroid_distance_mm"] == pytest.approx(2.0, abs=0.01)
    assert moved["hd95_mm"] > 1.0 and moved["dice"] < 0.9
    assert checks.compare_masks(a, np.zeros_like(a), 0.5)["empty"] is True


def test_three_outcome_rule() -> None:
    assert checks.gain_beyond_noise([0.849, 0.848, 0.851], 0.793, higher_is_better=True)["outcome"] == "better"
    assert checks.gain_beyond_noise([0.83, 0.51, 0.84], 0.60, higher_is_better=False)["outcome"] == "not_distinguishable"
    assert checks.gain_beyond_noise([1.9, 2.0, 2.1], 0.60, higher_is_better=False)["outcome"] == "worse"
    assert checks.gain_beyond_noise([0.70, 0.71, 0.72], 0.793, higher_is_better=True)["outcome"] == "worse"


def test_a_structure_drawn_twice_is_a_duplicate_and_neighbours_are_not() -> None:
    a = ball((50, 50, 50), (25.0, 25.0, 25.0), 8.0)
    assert checks.is_duplicate_shape(a, np.roll(a, 2, axis=0)) is True
    assert checks.is_duplicate_shape(a, np.roll(a, 14, axis=0)) is False
    assert checks.overlap_share(a, np.zeros_like(a)) == 0.0


def test_a_nucleus_inside_a_larger_parent_region_is_not_a_duplicate() -> None:
    parent = ball((60, 60, 60), (30.0, 30.0, 30.0), 20.0)
    nucleus = ball((60, 60, 60), (34.0, 30.0, 30.0), 5.0)
    assert checks.overlap_share(parent, nucleus) == 1.0
    assert checks.is_duplicate_shape(parent, nucleus) is False
