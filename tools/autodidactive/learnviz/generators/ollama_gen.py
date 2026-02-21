#!/usr/bin/env python3
"""
Ollama Integration for LearnViz

Generates custom Manim visualizations using local LLMs via Ollama.
No cloud services required - runs entirely on your machine.

Requirements:
    - Ollama installed: https://ollama.ai
    - A model pulled: ollama pull llama3.2 (or codellama, mistral, etc.)
"""

import json
import subprocess
import re
from typing import Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class OllamaConfig:
    """Configuration for Ollama generation."""
    model: str = "llama3.2"  # Default model
    temperature: float = 0.7
    max_tokens: int = 4096
    timeout: int = 120  # seconds


# System prompt for Manim code generation
MANIM_SYSTEM_PROMPT = """You are an expert at creating educational animations using Manim (the Python library for mathematical animations).

Your task is to generate a complete, working Manim scene that visualizes the given concept.

RULES:
1. Output ONLY valid Python code - no explanations, no markdown
2. Use Manim Community Edition (manim) syntax
3. Create a single Scene class that inherits from Scene
4. Include clear, educational animations with:
   - Title/introduction
   - Step-by-step visualization
   - Clear labels and explanations as Text objects
   - Smooth transitions between steps
5. Use appropriate Manim objects:
   - Text() for labels and explanations
   - MathTex() for equations
   - Rectangle, Circle, Arrow, Line for shapes
   - VGroup for grouping objects
   - Create, FadeIn, FadeOut, Transform for animations
6. Keep animations educational - show the concept clearly
7. Total animation should be 15-30 seconds
8. Use colors to highlight important elements
9. Position text to avoid overlaps (use UP, DOWN, LEFT, RIGHT with multipliers)

TEMPLATE STRUCTURE:
```python
from manim import *

class ConceptScene(Scene):
    def construct(self):
        # Title
        title = Text("Concept Name", font_size=48)
        self.play(Write(title))
        self.wait(1)
        self.play(title.animate.to_edge(UP))

        # Main visualization
        # ... your code here ...

        # Conclusion
        self.wait(2)
```

Remember: Output ONLY the Python code, nothing else."""


def check_ollama_available() -> bool:
    """Check if Ollama is installed and running."""
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def get_available_models() -> list:
    """Get list of available Ollama models."""
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode != 0:
            return []

        # Parse output (skip header line)
        lines = result.stdout.strip().split('\n')[1:]
        models = []
        for line in lines:
            if line.strip():
                # First column is model name
                model_name = line.split()[0]
                models.append(model_name)
        return models
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return []


def generate_with_ollama(
    concept: str,
    plan: Dict[str, Any],
    config: Optional[OllamaConfig] = None
) -> Optional[str]:
    """
    Generate Manim code for a concept using Ollama.

    Args:
        concept: The concept description from the user
        plan: The visualization plan from the analyzer
        config: Ollama configuration options

    Returns:
        Generated Manim Python code, or None if generation fails
    """
    if config is None:
        config = OllamaConfig()

    if not check_ollama_available():
        print("Error: Ollama is not installed or not running.")
        print("Install from: https://ollama.ai")
        print("Then run: ollama pull llama3.2")
        return None

    # Check if model is available
    available = get_available_models()
    if config.model not in available and not any(config.model in m for m in available):
        print(f"Error: Model '{config.model}' not found.")
        print(f"Available models: {', '.join(available) if available else 'None'}")
        print(f"Pull a model with: ollama pull {config.model}")
        return None

    # Build the prompt
    user_prompt = f"""Create a Manim visualization for this concept:

CONCEPT: {concept}

DETAILS:
- Type: {plan.get('concept_type', 'general')}
- Complexity: {plan.get('complexity', 'moderate')}
- Target duration: {plan.get('total_duration', 20)} seconds

Generate a complete, working Manim scene. Output ONLY Python code."""

    # Call Ollama via subprocess (more reliable than HTTP for local use)
    try:
        # Use ollama run with the prompt
        full_prompt = f"{MANIM_SYSTEM_PROMPT}\n\n{user_prompt}"

        result = subprocess.run(
            ["ollama", "run", config.model, full_prompt],
            capture_output=True,
            text=True,
            timeout=config.timeout
        )

        if result.returncode != 0:
            print(f"Ollama error: {result.stderr}")
            return None

        code = result.stdout.strip()

        # Clean up the response - extract Python code if wrapped in markdown
        code = extract_python_code(code)

        # Validate the code has required elements
        if not validate_manim_code(code):
            print("Warning: Generated code may be incomplete. Review before running.")

        return code

    except subprocess.TimeoutExpired:
        print(f"Ollama generation timed out after {config.timeout}s")
        return None
    except Exception as e:
        print(f"Ollama generation error: {e}")
        return None


def extract_python_code(response: str) -> str:
    """Extract Python code from LLM response, handling markdown code blocks."""
    # Try to find code block
    code_block_pattern = r"```(?:python)?\s*\n(.*?)```"
    matches = re.findall(code_block_pattern, response, re.DOTALL)

    if matches:
        # Return the longest code block (most likely the full code)
        return max(matches, key=len).strip()

    # If no code blocks, assume the whole response is code
    # Remove any leading/trailing non-code text
    lines = response.split('\n')
    code_lines = []
    in_code = False

    for line in lines:
        # Start collecting when we see an import or class definition
        if line.startswith('from manim') or line.startswith('import') or line.startswith('class '):
            in_code = True
        if in_code:
            code_lines.append(line)

    return '\n'.join(code_lines) if code_lines else response


def validate_manim_code(code: str) -> bool:
    """Basic validation that the code looks like valid Manim."""
    checks = [
        'from manim import' in code or 'import manim' in code,
        'class ' in code and '(Scene)' in code,
        'def construct(self)' in code,
        'self.play(' in code or 'self.add(' in code,
    ]
    return all(checks)


def fix_common_errors(code: str) -> str:
    """Attempt to fix common LLM code generation errors."""
    # Ensure proper imports
    if 'from manim import *' not in code and 'from manim import' not in code:
        code = 'from manim import *\n\n' + code

    # Fix common typos
    replacements = [
        ('self.Play(', 'self.play('),
        ('Self.play(', 'self.play('),
        ('TEXT(', 'Text('),
        ('text(', 'Text('),
        ('Fadein(', 'FadeIn('),
        ('Fadeout(', 'FadeOut('),
        ('fadeIn(', 'FadeIn('),
        ('fadeOut(', 'FadeOut('),
    ]

    for old, new in replacements:
        code = code.replace(old, new)

    return code


# Recommended models for code generation
RECOMMENDED_MODELS = {
    "codellama": "Best for code generation, understands Python well",
    "llama3.2": "Good general purpose, fast",
    "mistral": "Good balance of speed and quality",
    "deepseek-coder": "Excellent for code, if available",
    "qwen2.5-coder": "Strong coding model",
}


def print_setup_instructions():
    """Print instructions for setting up Ollama."""
    print("""
╔══════════════════════════════════════════════════════════════╗
║                 OLLAMA SETUP INSTRUCTIONS                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. Install Ollama:                                          ║
║     macOS/Linux: curl -fsSL https://ollama.ai/install.sh | sh║
║     Or download from: https://ollama.ai                      ║
║                                                              ║
║  2. Pull a model (choose one):                               ║
║     ollama pull llama3.2        # Fast, good quality         ║
║     ollama pull codellama       # Best for code              ║
║     ollama pull mistral         # Balanced                   ║
║                                                              ║
║  3. Verify it works:                                         ║
║     ollama run llama3.2 "Hello"                              ║
║                                                              ║
║  4. Use with LearnViz:                                       ║
║     python learnviz.py "your concept" --ollama               ║
║     python learnviz.py "your concept" --ollama-model codellama║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
""")


if __name__ == "__main__":
    # Test Ollama availability
    print("Checking Ollama status...")

    if check_ollama_available():
        print("✓ Ollama is installed and running")
        models = get_available_models()
        if models:
            print(f"✓ Available models: {', '.join(models)}")
        else:
            print("✗ No models found. Run: ollama pull llama3.2")
    else:
        print("✗ Ollama not available")
        print_setup_instructions()
