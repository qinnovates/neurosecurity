"""
Narration System for LearnViz

Handles:
- Script generation for educational content
- Text-to-speech audio generation
- Text layout management to prevent overlaps
"""

import os
import json
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class NarrationSegment:
    """A single narration segment with timing and text."""
    id: str
    text: str
    duration: float  # seconds
    position: str = "bottom"  # "top", "bottom", "center"
    style: str = "explanation"  # "title", "explanation", "label", "emphasis"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "text": self.text,
            "duration": self.duration,
            "position": self.position,
            "style": self.style
        }


@dataclass
class NarrationScript:
    """Complete narration script for a visualization."""
    title: str
    segments: List[NarrationSegment] = field(default_factory=list)
    total_duration: float = 0.0

    def add_segment(self, segment: NarrationSegment):
        self.segments.append(segment)
        self.total_duration += segment.duration

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "segments": [s.to_dict() for s in self.segments],
            "total_duration": self.total_duration
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    def get_full_script(self) -> str:
        """Get the full narration as plain text."""
        return "\n\n".join([s.text for s in self.segments])


class ScriptGenerator:
    """Generates educational narration scripts for concepts."""

    # Templates for different concept types
    TEMPLATES = {
        "motor_cortex_bci": {
            "intro": {
                "text": "Let's explore how brain-computer interfaces decode your motor intentions. "
                        "This technology allows paralyzed patients to control robotic arms with their thoughts.",
                "duration": 6.0
            },
            "brain_overview": {
                "text": "The primary motor cortex, or M1, is located in the precentral gyrus. "
                        "It contains a 'motor map' called the homunculus, where different areas control "
                        "different body parts. The hand area is particularly large and well-studied.",
                "duration": 8.0
            },
            "electrode_array": {
                "text": "BCIs use electrode arrays, like the Utah array with 96 tiny electrodes. "
                        "These are implanted directly into the motor cortex, where they can record "
                        "electrical signals from thousands of nearby neurons.",
                "duration": 7.0
            },
            "neural_signals": {
                "text": "Each electrode picks up 'spikes' - brief electrical impulses when neurons fire. "
                        "Different neurons fire at different rates depending on what movement you're "
                        "thinking about. This is the raw data BCIs decode.",
                "duration": 7.0
            },
            "population_coding": {
                "text": "Here's the key insight: each neuron has a 'preferred direction' - it fires "
                        "most strongly when you intend to move in that direction. By combining signals "
                        "from many neurons, we get a 'population vector' pointing in your intended direction.",
                "duration": 8.0
            },
            "bci_decoding": {
                "text": "The decoder uses machine learning to translate these neural patterns into "
                        "device commands. When you think 'move right', the population of M1 neurons "
                        "creates a pattern that the decoder recognizes and converts to cursor movement.",
                "duration": 7.0
            },
            "conclusion": {
                "text": "This is how people with paralysis can control robotic arms, computer cursors, "
                        "and even type on keyboards - just by thinking about movement. The technology "
                        "continues to improve, with higher electrode counts and better algorithms.",
                "duration": 7.0
            }
        },
        "neurotransmitter": {
            "intro": {
                "text": "Neurotransmitters are the brain's chemical messengers. "
                        "They transmit signals between neurons and regulate everything from mood "
                        "to movement to memory. Let's explore three major systems.",
                "duration": 6.0
            },
            "dopamine": {
                "text": "Dopamine is the reward and motivation neurotransmitter. It's produced in "
                        "the VTA and substantia nigra, deep in the midbrain. Dopamine drives you "
                        "to seek rewards and is crucial for motor control. Too little causes Parkinson's; "
                        "too much activity is linked to addiction and schizophrenia.",
                "duration": 9.0
            },
            "serotonin": {
                "text": "Serotonin regulates mood, sleep, and appetite. It comes from the raphe nuclei "
                        "in the brainstem and projects throughout the entire brain. Low serotonin is "
                        "associated with depression and anxiety. Most antidepressants work by increasing "
                        "serotonin availability.",
                "duration": 8.0
            },
            "norepinephrine": {
                "text": "Norepinephrine controls alertness and the stress response. The locus coeruleus, "
                        "a tiny cluster of neurons in the brainstem, sends norepinephrine everywhere. "
                        "It triggers fight-or-flight responses: increased heart rate, heightened focus, "
                        "and mobilized energy. Dysregulation is linked to PTSD and ADHD.",
                "duration": 9.0
            },
            "conclusion": {
                "text": "These three systems don't work in isolation - they interact constantly. "
                        "Dopamine and serotonin balance reward-seeking with contentment. Norepinephrine "
                        "modulates both based on environmental demands. Understanding these systems "
                        "is key to treating mental health conditions.",
                "duration": 8.0
            }
        },
        "action_potential": {
            "intro": {
                "text": "Let's explore how neurons transmit electrical signals through action potentials. "
                        "This is the fundamental mechanism that allows your brain to process information.",
                "duration": 5.0
            },
            "structure": {
                "text": "Here we have a neuron. The cell body, called the soma, connects to a long fiber "
                        "called the axon. The axon is wrapped in myelin sheaths - these fatty insulating "
                        "layers speed up signal transmission. The gaps between myelin are called Nodes of Ranvier.",
                "duration": 8.0
            },
            "resting": {
                "text": "At rest, the neuron maintains a voltage difference across its membrane of about "
                        "negative 70 millivolts. This is called the resting potential. Notice how positive "
                        "charges accumulate outside while negative charges stay inside.",
                "duration": 7.0
            },
            "depolarization": {
                "text": "When a signal arrives, sodium channels open and positive ions rush in. This "
                        "causes depolarization - the inside becomes more positive. When it reaches about "
                        "negative 55 millivolts, an action potential is triggered.",
                "duration": 7.0
            },
            "propagation": {
                "text": "Watch the action potential propagate along the axon. It jumps from node to node - "
                        "this is called saltatory conduction. It's much faster than continuous conduction "
                        "and uses less energy.",
                "duration": 6.0
            },
            "repolarization": {
                "text": "After the peak, potassium channels open and positive ions flow out, causing "
                        "repolarization. The membrane briefly becomes even more negative than resting - "
                        "this hyperpolarization creates a refractory period.",
                "duration": 6.0
            },
            "conclusion": {
                "text": "The signal has been successfully transmitted! This entire process takes only "
                        "about 1 to 2 milliseconds. Your brain performs billions of these transmissions "
                        "every second.",
                "duration": 5.0
            }
        },
        "synapse": {
            "intro": {
                "text": "Now let's see how neurons communicate with each other across the synapse. "
                        "This is where chemical signaling takes over from electrical signaling.",
                "duration": 5.0
            },
            "structure": {
                "text": "The synapse has three main parts: the presynaptic terminal at the top, "
                        "the synaptic cleft - a tiny gap about 20 nanometers wide - and the "
                        "postsynaptic membrane below with its receptor proteins.",
                "duration": 7.0
            },
            "vesicles": {
                "text": "Inside the presynaptic terminal, you can see vesicles - small spheres "
                        "filled with neurotransmitter molecules. These are the chemical messengers "
                        "that will carry the signal across the gap.",
                "duration": 6.0
            },
            "signal_arrival": {
                "text": "When an action potential arrives at the terminal, it triggers calcium "
                        "channels to open. Calcium ions flow in, causing the vesicles to move "
                        "toward and fuse with the membrane.",
                "duration": 6.0
            },
            "release": {
                "text": "Watch the vesicles release their neurotransmitters into the synaptic cleft. "
                        "This process is called exocytosis. Thousands of neurotransmitter molecules "
                        "are released in just microseconds.",
                "duration": 6.0
            },
            "binding": {
                "text": "The neurotransmitters diffuse across the cleft and bind to specific "
                        "receptors on the postsynaptic membrane. Each receptor only accepts "
                        "certain neurotransmitters - like a lock and key.",
                "duration": 6.0
            },
            "response": {
                "text": "When neurotransmitters bind, the receptors open ion channels in the "
                        "postsynaptic neuron. This can either excite the neuron, making it more "
                        "likely to fire, or inhibit it. The signal has been transmitted!",
                "duration": 7.0
            },
            "conclusion": {
                "text": "Synaptic transmission is the basis of all neural communication. Learning "
                        "and memory involve strengthening or weakening these synaptic connections "
                        "over time.",
                "duration": 5.0
            }
        }
    }

    @classmethod
    def generate_script(cls, concept_type: str, custom_segments: Optional[Dict] = None) -> NarrationScript:
        """Generate a narration script for a concept type."""
        template = cls.TEMPLATES.get(concept_type, {})
        if custom_segments:
            template.update(custom_segments)

        script = NarrationScript(title=concept_type.replace("_", " ").title())

        for segment_id, data in template.items():
            segment = NarrationSegment(
                id=segment_id,
                text=data["text"],
                duration=data.get("duration", 5.0),
                position=data.get("position", "bottom"),
                style=data.get("style", "explanation")
            )
            script.add_segment(segment)

        return script


class TextLayoutManager:
    """
    Manages text positioning in Manim scenes to prevent overlaps.

    Provides Manim code snippets for proper text management.
    """

    # Reserved screen regions
    REGIONS = {
        "title": {"y": 3.5, "max_width": 12},
        "subtitle": {"y": 2.8, "max_width": 10},
        "explanation_top": {"y": 3.2, "max_width": 11},
        "explanation_bottom": {"y": -3.2, "max_width": 11},
        "label_top": {"y": 2.5, "max_width": 8},
        "label_bottom": {"y": -2.5, "max_width": 8},
    }

    @classmethod
    def get_manim_helper_code(cls) -> str:
        """Returns Manim helper class code for text management."""
        return '''
class TextManager:
    """Manages text display to prevent overlaps."""

    def __init__(self, scene):
        self.scene = scene
        self.active_texts = {}  # region -> mobject
        self.regions = {
            "title": UP * 3.5,
            "subtitle": UP * 2.8,
            "top": UP * 3.2,
            "bottom": DOWN * 3.2,
            "center": ORIGIN,
        }

    def show(self, text: str, region: str = "bottom", font_size: int = 24,
             color=WHITE, animate: bool = True, clear_region: bool = True) -> Text:
        """Display text in a region, clearing any existing text there."""
        # Clear existing text in this region
        if clear_region and region in self.active_texts:
            self.scene.play(FadeOut(self.active_texts[region]), run_time=0.3)

        # Create new text
        text_obj = Text(text, font_size=font_size, color=color)
        text_obj.move_to(self.regions.get(region, ORIGIN))

        # Ensure text fits on screen
        if text_obj.width > 12:
            text_obj.scale(12 / text_obj.width)

        # Animate or instant
        if animate:
            self.scene.play(Write(text_obj), run_time=0.5)
        else:
            self.scene.add(text_obj)

        self.active_texts[region] = text_obj
        return text_obj

    def clear(self, region: str = None, animate: bool = True):
        """Clear text from a region or all regions."""
        if region:
            if region in self.active_texts:
                if animate:
                    self.scene.play(FadeOut(self.active_texts[region]), run_time=0.3)
                else:
                    self.scene.remove(self.active_texts[region])
                del self.active_texts[region]
        else:
            # Clear all
            if self.active_texts:
                if animate:
                    self.scene.play(*[FadeOut(t) for t in self.active_texts.values()], run_time=0.3)
                else:
                    for t in self.active_texts.values():
                        self.scene.remove(t)
                self.active_texts.clear()

    def update(self, text: str, region: str = "bottom", **kwargs):
        """Update text in a region with a transform animation."""
        if region in self.active_texts:
            new_text = Text(text, font_size=kwargs.get("font_size", 24),
                          color=kwargs.get("color", WHITE))
            new_text.move_to(self.regions.get(region, ORIGIN))
            if new_text.width > 12:
                new_text.scale(12 / new_text.width)
            self.scene.play(Transform(self.active_texts[region], new_text), run_time=0.5)
        else:
            self.show(text, region, **kwargs)
'''


class TTSGenerator:
    """
    Generates text-to-speech audio for narration scripts.

    Supports multiple TTS backends:
    - gtts (Google Text-to-Speech) - requires internet
    - pyttsx3 - offline, uses system voices
    - edge-tts - Microsoft Edge TTS (high quality)
    """

    def __init__(self, engine: str = "gtts", output_dir: str = "audio"):
        self.engine = engine
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)

    def generate(self, script: NarrationScript, filename: str = None) -> Optional[Path]:
        """
        Generate audio file from narration script.

        Returns path to generated audio file, or None if TTS unavailable.
        """
        if filename is None:
            filename = f"{script.title.lower().replace(' ', '_')}_narration.mp3"

        output_path = self.output_dir / filename
        full_text = script.get_full_script()

        if self.engine == "gtts":
            return self._generate_gtts(full_text, output_path)
        elif self.engine == "pyttsx3":
            return self._generate_pyttsx3(full_text, output_path)
        elif self.engine == "edge-tts":
            return self._generate_edge_tts(full_text, output_path)
        else:
            print(f"Unknown TTS engine: {self.engine}")
            return None

    def _generate_gtts(self, text: str, output_path: Path) -> Optional[Path]:
        """Generate using Google TTS."""
        try:
            from gtts import gTTS
            tts = gTTS(text=text, lang='en', slow=False)
            tts.save(str(output_path))
            return output_path
        except ImportError:
            print("gtts not installed. Run: pip install gtts")
            return None
        except Exception as e:
            print(f"gTTS error: {e}")
            return None

    def _generate_pyttsx3(self, text: str, output_path: Path) -> Optional[Path]:
        """Generate using pyttsx3 (offline)."""
        try:
            import pyttsx3
            engine = pyttsx3.init()
            # Adjust rate for clearer speech
            engine.setProperty('rate', 150)
            engine.save_to_file(text, str(output_path))
            engine.runAndWait()
            return output_path
        except ImportError:
            print("pyttsx3 not installed. Run: pip install pyttsx3")
            return None
        except Exception as e:
            print(f"pyttsx3 error: {e}")
            return None

    def _generate_edge_tts(self, text: str, output_path: Path) -> Optional[Path]:
        """Generate using edge-tts (high quality)."""
        try:
            import asyncio
            import edge_tts

            async def generate():
                communicate = edge_tts.Communicate(text, "en-US-GuyNeural")
                await communicate.save(str(output_path))

            asyncio.run(generate())
            return output_path
        except ImportError:
            print("edge-tts not installed. Run: pip install edge-tts")
            return None
        except Exception as e:
            print(f"edge-tts error: {e}")
            return None

    def generate_segments(self, script: NarrationScript, prefix: str = "segment") -> List[Path]:
        """Generate separate audio files for each segment."""
        paths = []
        for i, segment in enumerate(script.segments):
            filename = f"{prefix}_{i:02d}_{segment.id}.mp3"
            output_path = self.output_dir / filename

            if self.engine == "gtts":
                path = self._generate_gtts(segment.text, output_path)
            elif self.engine == "pyttsx3":
                path = self._generate_pyttsx3(segment.text, output_path)
            elif self.engine == "edge-tts":
                path = self._generate_edge_tts(segment.text, output_path)
            else:
                path = None

            if path:
                paths.append(path)

        return paths


def generate_narrated_scene_code(concept_type: str) -> Tuple[str, NarrationScript]:
    """
    Generate Manim scene code with integrated narration support.

    Returns tuple of (manim_code, narration_script).
    """
    script = ScriptGenerator.generate_script(concept_type)

    # This would be expanded to generate full Manim code with narration integration
    # For now, return the script for use with templates
    return script


# CLI for testing
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python narration.py <concept_type> [--tts <engine>]")
        print("  concept_type: action_potential, synapse")
        print("  --tts: gtts, pyttsx3, edge-tts")
        sys.exit(1)

    concept = sys.argv[1]

    # Generate script
    script = ScriptGenerator.generate_script(concept)
    print(f"\n=== Narration Script: {script.title} ===")
    print(f"Total duration: {script.total_duration:.1f}s\n")

    for segment in script.segments:
        print(f"[{segment.id}] ({segment.duration}s)")
        print(f"  {segment.text}\n")

    # Generate TTS if requested
    if "--tts" in sys.argv:
        idx = sys.argv.index("--tts")
        engine = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else "gtts"

        print(f"\nGenerating TTS audio with {engine}...")
        tts = TTSGenerator(engine=engine)
        path = tts.generate(script)
        if path:
            print(f"Audio saved to: {path}")
