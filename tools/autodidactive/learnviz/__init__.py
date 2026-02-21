"""
LearnViz - AI-Powered Educational Visualization Engine

Generate educational animations from natural language concept descriptions.
Part of ONI Academy.

Usage:
    from learnviz import analyze, generate_manim_code

    plan = analyze("How does binary search work?")
    code = generate_manim_code(plan.to_dict(), template_name=plan.template)

Features:
    - Pattern-based concept classification
    - Template-based Manim code generation
    - Ollama LLM integration for custom concepts
    - Text-to-speech narration
    - Local-first (no cloud required)
"""

from .analyzer import analyze, VisualizationPlan, ConceptType, Engine

__version__ = "0.2.0"

__all__ = [
    "analyze",
    "VisualizationPlan",
    "ConceptType",
    "Engine",
    "__version__",
]

# Lazy imports for optional dependencies
def generate_manim_code(*args, **kwargs):
    """Generate Manim visualization code."""
    from .generators.manim_gen import generate_manim_code as _gen
    return _gen(*args, **kwargs)

def get_templates():
    """Get available visualization templates."""
    from .generators.manim_gen import TEMPLATES
    return TEMPLATES
