#!/usr/bin/env python3
"""
ONI Academy Visualization Module

Integrates LearnViz visualization engine with ONI Academy curriculum.
Provides a clean API for generating educational visualizations from course content.

Usage:
    from oni_academy.visualization import visualize, list_templates

    # Generate visualization
    result = visualize("How does an action potential work?")
    print(result.video_path)

    # List available templates
    templates = list_templates()
"""

import sys
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, List, Dict, Any

# Try to import learnviz (installed as package or from path)
LEARNVIZ_AVAILABLE = False
try:
    # First try direct import (when installed as package)
    import learnviz
    LEARNVIZ_AVAILABLE = True
except ImportError:
    # Fall back to path-based import (development mode)
    LEARNVIZ_PATH = Path(__file__).parent.parent.parent / "learnviz"
    if LEARNVIZ_PATH.exists():
        sys.path.insert(0, str(LEARNVIZ_PATH))
        try:
            import learnviz
            LEARNVIZ_AVAILABLE = True
        except ImportError:
            pass


@dataclass
class VisualizationResult:
    """Result of a visualization generation."""
    success: bool
    concept: str
    template: Optional[str]
    concept_type: str
    complexity: str

    # Generated artifacts
    code: Optional[str] = None
    code_path: Optional[Path] = None
    video_path: Optional[Path] = None
    audio_path: Optional[Path] = None
    narration_script: Optional[str] = None

    # Metadata
    duration: float = 0.0
    error: Optional[str] = None


def check_learnviz() -> bool:
    """Check if LearnViz is available and properly configured."""
    if not LEARNVIZ_AVAILABLE:
        return False

    try:
        from learnviz.analyzer import analyze
        from learnviz.generators.manim_gen import generate_manim_code
        return True
    except ImportError:
        return False


def list_templates() -> Dict[str, Dict[str, str]]:
    """
    List all available visualization templates.

    Returns:
        Dictionary of template_name -> {name, category, description}
    """
    if not check_learnviz():
        return {}

    return {
        "binary_search": {
            "name": "Binary Search",
            "category": "Algorithms",
            "description": "Step-by-step search with pointer animations"
        },
        "sorting": {
            "name": "Sorting Algorithms",
            "category": "Algorithms",
            "description": "Bubble, selection, insertion sort visualized"
        },
        "tree_traversal": {
            "name": "Tree Traversal",
            "category": "Data Structures",
            "description": "Inorder, preorder, postorder traversal"
        },
        "pythagorean": {
            "name": "Pythagorean Theorem",
            "category": "Mathematics",
            "description": "Visual proof with animated squares"
        },
        "action_potential": {
            "name": "Action Potential",
            "category": "Neuroscience",
            "description": "Neuron depolarization and ion channels"
        },
        "synapse": {
            "name": "Synaptic Transmission",
            "category": "Neuroscience",
            "description": "Vesicle release and receptor binding"
        },
        "motor_cortex_bci": {
            "name": "Motor Cortex & BCI",
            "category": "Neuroscience",
            "description": "Electrode arrays and neural decoding"
        },
        "neurotransmitter": {
            "name": "Neurotransmitter Systems",
            "category": "Neuroscience",
            "description": "Dopamine, serotonin pathways"
        },
    }


def visualize(
    concept: str,
    template: Optional[str] = None,
    render: bool = False,
    narration: bool = False,
    tts_engine: str = "edge-tts",
    output_dir: Optional[Path] = None,
    use_ollama: bool = False,
    ollama_model: str = "llama3.2"
) -> VisualizationResult:
    """
    Generate a visualization for a concept.

    Args:
        concept: Natural language description of the concept
        template: Force a specific template (optional)
        render: Whether to render to video (requires Manim)
        narration: Whether to generate voice narration (requires TTS)
        tts_engine: TTS engine to use (edge-tts, gtts, pyttsx3)
        output_dir: Directory for output files
        use_ollama: Use Ollama for custom generation
        ollama_model: Ollama model to use

    Returns:
        VisualizationResult with generated artifacts
    """
    if not check_learnviz():
        return VisualizationResult(
            success=False,
            concept=concept,
            template=None,
            concept_type="unknown",
            complexity="unknown",
            error="LearnViz not available. Ensure learnviz/ directory exists."
        )

    try:
        from learnviz.analyzer import analyze
        from learnviz.generators.manim_gen import generate_manim_code, TEMPLATES
        from learnviz.generators.narration import ScriptGenerator, TTSGenerator

        # Analyze concept
        plan = analyze(concept)

        # Override template if specified
        if template:
            plan.template = template

        # Generate code
        if use_ollama and (plan.template is None or plan.template not in TEMPLATES):
            try:
                from learnviz.generators.ollama_gen import (
                    generate_with_ollama, OllamaConfig, fix_common_errors,
                    check_ollama_available
                )
                if check_ollama_available():
                    config = OllamaConfig(model=ollama_model)
                    code = generate_with_ollama(concept, plan.to_dict(), config)
                    if code:
                        code = fix_common_errors(code)
                    else:
                        code = generate_manim_code(plan.to_dict(), template_name=plan.template, params={})
                else:
                    code = generate_manim_code(plan.to_dict(), template_name=plan.template, params={})
            except ImportError:
                code = generate_manim_code(plan.to_dict(), template_name=plan.template, params={})
        else:
            code = generate_manim_code(plan.to_dict(), template_name=plan.template, params={})

        result = VisualizationResult(
            success=True,
            concept=concept,
            template=plan.template,
            concept_type=plan.concept_type.value,
            complexity=plan.complexity,
            code=code,
            duration=plan.total_duration
        )

        # Save code if output_dir specified
        if output_dir:
            output_dir = Path(output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)

            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            code_filename = f"viz_{timestamp}.py"
            code_path = output_dir / code_filename

            with open(code_path, "w") as f:
                f.write(code)
            result.code_path = code_path

            # Render if requested
            if render:
                video_path = _render_code(code_path, output_dir)
                if video_path:
                    result.video_path = video_path

                    # Add narration if requested
                    if narration and plan.template:
                        audio_path = _generate_narration(
                            plan.template, output_dir, tts_engine
                        )
                        if audio_path:
                            result.audio_path = audio_path

                            # Combine video and audio
                            combined = _combine_video_audio(video_path, audio_path)
                            if combined:
                                result.video_path = combined

        return result

    except Exception as e:
        return VisualizationResult(
            success=False,
            concept=concept,
            template=None,
            concept_type="unknown",
            complexity="unknown",
            error=str(e)
        )


def _render_code(code_path: Path, output_dir: Path) -> Optional[Path]:
    """Render Manim code to video."""
    import subprocess
    import re

    with open(code_path, "r") as f:
        content = f.read()

    match = re.search(r"class (\w+)\(Scene\)", content)
    if not match:
        return None

    scene_name = match.group(1)
    cmd = f"manim -pql {code_path} {scene_name}"

    result = subprocess.run(
        cmd, shell=True, capture_output=True, text=True,
        cwd=str(code_path.parent)
    )

    if result.returncode != 0:
        return None

    # Find output file
    media_dir = code_path.parent / "media" / "videos" / code_path.stem / "480p15"
    if media_dir.exists():
        files = list(media_dir.glob("*.mp4"))
        if files:
            return files[0]

    return None


def _generate_narration(
    template: str,
    output_dir: Path,
    tts_engine: str
) -> Optional[Path]:
    """Generate narration audio."""
    try:
        from learnviz.generators.narration import ScriptGenerator, TTSGenerator

        script = ScriptGenerator.generate_script(template)
        tts = TTSGenerator(engine=tts_engine, output_dir=str(output_dir))
        audio_path = tts.generate(script, filename="narration.mp3")
        return Path(audio_path) if audio_path else None
    except Exception:
        return None


def _combine_video_audio(video_path: Path, audio_path: Path) -> Optional[Path]:
    """Combine video and audio using ffmpeg."""
    import subprocess

    output_path = video_path.parent / f"{video_path.stem}_narrated.mp4"

    cmd = [
        "ffmpeg", "-y", "-i", str(video_path), "-i", str(audio_path),
        "-c:v", "copy", "-c:a", "aac",
        "-map", "0:v:0", "-map", "1:a:0",
        "-shortest", str(output_path)
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    return output_path if result.returncode == 0 else None


# Module metadata
ONI_ACADEMY_CONCEPTS = {
    "introduction": [
        "What is neurosecurity?",
        "Why do we need brain-computer interface security?",
    ],
    "14-layer-model": [
        "ONI 14-layer security model",
        "Silicon to biology security layers",
        "Neural gateway bridge layer",
    ],
    "coherence-metric": [
        "Coherence metric calculation",
        "Signal integrity measurement",
    ],
    "neural-firewall": [
        "Neural firewall decision matrix",
        "Signal validation and filtering",
    ],
    "attack-patterns": [
        "Neural ransomware attack",
        "Signal injection attacks",
        "Man-in-the-middle neural attacks",
    ],
    "nsam-monitoring": [
        "Neural signal assurance monitoring",
        "Real-time threat detection",
    ],
}


def get_module_concepts(module_name: str) -> List[str]:
    """Get visualizable concepts for an ONI Academy module."""
    return ONI_ACADEMY_CONCEPTS.get(module_name, [])


def visualize_module(
    module_name: str,
    output_dir: Optional[Path] = None,
    render: bool = False
) -> List[VisualizationResult]:
    """
    Generate visualizations for all concepts in a module.

    Args:
        module_name: ONI Academy module name
        output_dir: Directory for output files
        render: Whether to render videos

    Returns:
        List of VisualizationResult for each concept
    """
    concepts = get_module_concepts(module_name)
    results = []

    for concept in concepts:
        result = visualize(
            concept,
            render=render,
            output_dir=output_dir
        )
        results.append(result)

    return results
