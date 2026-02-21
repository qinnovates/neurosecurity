"""Tests for ONI Academy package initialization."""

import pytest


def test_import():
    """Test that the package imports correctly."""
    import oni_academy
    assert hasattr(oni_academy, "__version__")


def test_list_modules():
    """Test list_modules returns expected modules."""
    from oni_academy import list_modules

    modules = list_modules()
    assert isinstance(modules, list)
    assert len(modules) > 0
    assert "introduction" in modules
    assert "14-layer-model" in modules


def test_get_course_valid():
    """Test get_course returns course content."""
    from oni_academy import get_course

    course = get_course("introduction")
    assert isinstance(course, dict)
    assert "title" in course
    assert "description" in course


def test_get_course_invalid():
    """Test get_course returns empty dict for invalid course."""
    from oni_academy import get_course

    course = get_course("nonexistent-course")
    assert course == {}


def test_oni_framework_dependency():
    """Test that oni-framework is available as dependency."""
    import oni
    assert hasattr(oni, "__version__")


def test_brand_constants():
    """Test brand constants are loaded."""
    from oni_academy import __name_full__, __tagline__

    assert "Neurosecurity" in __name_full__ or "ONI" in __name_full__
    assert len(__tagline__) > 0
