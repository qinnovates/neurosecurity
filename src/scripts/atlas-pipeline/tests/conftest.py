"""Shared synthetic fixtures. No test reads an atlas file or touches the network."""
import pathlib
import sys

import numpy as np
import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))


@pytest.fixture
def grid_affine() -> np.ndarray:
    affine = np.diag([0.5, 0.5, 0.5, 1.0])
    affine[:3, 3] = [-20.0, -20.0, -20.0]
    return affine


def ball(shape: tuple[int, int, int], centre: tuple[float, float, float], radius: float) -> np.ndarray:
    grid = np.indices(shape).astype(np.float64)
    return sum((grid[axis] - centre[axis]) ** 2 for axis in range(3)) <= radius ** 2


@pytest.fixture
def ball_mask() -> np.ndarray:
    return ball((80, 80, 80), (40.0, 40.0, 40.0), 14.0)
