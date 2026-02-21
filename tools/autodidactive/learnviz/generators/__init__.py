"""
LearnViz Code Generators

Generators for different visualization engines and narration support.
"""

from .manim_gen import generate_manim_code, TEMPLATES, ManimTemplate
from .narration import (
    ScriptGenerator,
    TTSGenerator,
    NarrationScript,
    NarrationSegment,
    TextLayoutManager
)

__all__ = [
    # Manim
    "generate_manim_code",
    "TEMPLATES",
    "ManimTemplate",
    # Narration
    "ScriptGenerator",
    "TTSGenerator",
    "NarrationScript",
    "NarrationSegment",
    "TextLayoutManager",
]
