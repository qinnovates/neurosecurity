"""Synthetic shapes for the tests that need arrays."""
import numpy as np


def grid_affine() -> np.ndarray:
    affine = np.diag([0.5, 0.5, 0.5, 1.0])
    affine[:3, 3] = [-20.0, -20.0, -20.0]
    return affine


def ball(shape: tuple[int, int, int], centre: tuple[float, float, float], radius: float) -> np.ndarray:
    grid = np.indices(shape).astype(np.float64)
    return sum((grid[axis] - centre[axis]) ** 2 for axis in range(3)) <= radius ** 2


def ball_mask() -> np.ndarray:
    return ball((80, 80, 80), (40.0, 40.0, 40.0), 14.0)
