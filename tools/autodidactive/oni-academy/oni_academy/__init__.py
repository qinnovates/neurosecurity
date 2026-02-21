"""
ONI Academy - Educational Platform for Neural Security

Interactive learning resources for the ONI Framework and neural security concepts.
Aligned with the ONI 14-layer model and TARA security platform.

Quick Start:
    >>> from oni_academy import get_course, list_modules
    >>> courses = list_modules()
    >>> intro = get_course("introduction")

License: Apache 2.0
Repository: https://github.com/qinnovates/mindloft
"""

__author__ = "Kevin L. Qi"

# Import brand constants from brand.json
try:
    from ._brand import ONI, TARA, ONI_VERSION
    __version__ = ONI_VERSION
    __name_full__ = ONI.full_name
    __tagline__ = ONI.tagline
except ImportError:
    __version__ = "0.1.3"
    __name_full__ = "Open Neurosecurity Interoperability"
    __tagline__ = "The OSI of Mind"


# Placeholder exports - to be implemented
def list_modules() -> list:
    """List available learning modules."""
    return [
        "introduction",
        "14-layer-model",
        "coherence-metric",
        "neural-firewall",
        "attack-patterns",
        "nsam-monitoring",
    ]


def get_course(name: str) -> dict:
    """Get course content by name."""
    courses = {
        "introduction": {
            "title": f"Introduction to {__name_full__}",
            "description": "Learn the fundamentals of neural security",
            "modules": ["overview", "threat-landscape", "getting-started"],
        },
    }
    return courses.get(name, {})


# Visualization integration (LearnViz)
try:
    from .visualization import (
        visualize,
        list_templates,
        get_module_concepts,
        visualize_module,
        VisualizationResult,
        check_learnviz,
    )
    LEARNVIZ_AVAILABLE = check_learnviz()
except ImportError:
    LEARNVIZ_AVAILABLE = False

    def visualize(*args, **kwargs):
        raise ImportError("LearnViz not available. Install dependencies: pip install manim")

    def list_templates():
        return {}

    def get_module_concepts(module_name):
        return []

    def visualize_module(*args, **kwargs):
        return []


__all__ = [
    "__version__",
    "__name_full__",
    "__tagline__",
    "list_modules",
    "get_course",
    # Visualization
    "visualize",
    "list_templates",
    "get_module_concepts",
    "visualize_module",
    "LEARNVIZ_AVAILABLE",
]
